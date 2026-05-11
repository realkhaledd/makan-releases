'use strict';

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const qrcode     = require('qrcode');
const multer     = require('multer');
const XLSX       = require('xlsx');
const fs         = require('fs');
const path       = require('path');

let sharpLib;
try { sharpLib = require('sharp'); } catch {}

const WA_PORT = 3001;

// ─── Data directory ───────────────────────────────────────────────────────────
let DATA_DIR = path.join(require('os').homedir(), '.makan-wa');

function setDataDir(dir) {
  DATA_DIR = path.join(dir, 'wa-campaign');
  [DATA_DIR, path.join(DATA_DIR, 'images'), path.join(DATA_DIR, 'temp_uploads')].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms)            { return new Promise(r => setTimeout(r, ms)); }
function shuffle(arr)         { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=randomInt(0,i);[a[i],a[j]]=[a[j],a[i]];} return a; }

// ─── Anti-Ban ─────────────────────────────────────────────────────────────────
const INVISIBLE = ['​','‌','‍','⁠','﻿'];
function evadeCaption(text) {
  const chars = text.split('');
  for(let i=0;i<randomInt(3,7);i++) chars.splice(randomInt(0,chars.length),0,INVISIBLE[randomInt(0,INVISIBLE.length-1)]);
  return chars.join('');
}
function injectJpegComment(buffer) {
  const comment = `ID-${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
  const commentBuf = Buffer.from(comment, 'ascii');
  const lenBuf = Buffer.alloc(2); lenBuf.writeUInt16BE(commentBuf.length + 2);
  const segment = Buffer.concat([Buffer.from([0xFF,0xFE]), lenBuf, commentBuf]);
  return Buffer.concat([buffer.slice(0,2), segment, buffer.slice(2)]);
}

// ─── Image Processing ─────────────────────────────────────────────────────────
const SUPPORTED = new Set(['.jpg','.jpeg','.png','.webp']);
function loadImages() {
  const dir = path.join(DATA_DIR, 'images');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => SUPPORTED.has(path.extname(f).toLowerCase())).map(f => path.join(dir, f));
}
async function generateUniqueImage(srcPath, contactId) {
  if (!sharpLib) return srcPath;
  const tmpDir = path.join(DATA_DIR, 'temp_campaign');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const meta    = await sharpLib(srcPath).metadata();
  const pixel   = await sharpLib({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
  const outPath = path.join(tmpDir, `${contactId.replace(/\W/g,'_')}_${Date.now()}.jpg`);
  await sharpLib(srcPath).composite([{input:pixel,left:randomInt(0,Math.max(0,meta.width-1)),top:randomInt(0,Math.max(0,meta.height-1))}])
    .withMetadata({density:[72,96,150,300][randomInt(0,3)]}).jpeg({quality:randomInt(88,95)}).toFile(outPath);
  const buf = fs.readFileSync(outPath); fs.writeFileSync(outPath, injectJpegComment(buf));
  return outPath;
}
function cleanupTemp() {
  const d = path.join(DATA_DIR, 'temp_campaign');
  if (!fs.existsSync(d)) return;
  fs.readdirSync(d).forEach(f => { try { fs.unlinkSync(path.join(d,f)); } catch {} });
  try { fs.rmdirSync(d); } catch {}
}

// ─── Phone Normalization ──────────────────────────────────────────────────────
function normalizePhone(raw) {
  let d = String(raw).replace(/[\s\-\(\)\+\.]/g,'').replace(/\D/g,'');
  if (d.length < 7) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length===11 && d.startsWith('01')) return '20'+d.slice(1);
  if (d.length===10 && d.startsWith('1'))  return '20'+d;
  if (d.length>=11  && !d.startsWith('0')) return d;
  if (d.startsWith('0') && d.length>=10)   return '20'+d.slice(1);
  if (d.length>=8)                          return '20'+d;
  return null;
}
function parseExcel(filePath) {
  const wb   = XLSX.readFile(filePath, { cellText:true, cellNF:false });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'', raw:false });
  const seen = new Set(); const out = [];
  for (const row of rows) for (const cell of row) { const n = normalizePhone(cell); if (n && !seen.has(n)) { seen.add(n); out.push(n+'@c.us'); } }
  return out;
}

// ─── Persistent Data ──────────────────────────────────────────────────────────
function defaultReply() { return { enabled:false, append_text:'ردّ بـ نعم لو مهتم 👇', trigger_word:'نعم', followup_message:'شكراً! سيتواصل معك فريقنا قريباً.' }; }
function loadData() {
  const f = path.join(DATA_DIR, 'data.json');
  if (fs.existsSync(f)) { const d = JSON.parse(fs.readFileSync(f,'utf8')); if (!d.reply_system) d.reply_system = defaultReply(); return d; }
  return { contacts:[], captions:['عرض حصري لفترة محدودة 🔥','وحدات مميزة بأسعار تنافسية 🏠'], reply_system:defaultReply() };
}
function saveData()       { fs.writeFileSync(path.join(DATA_DIR,'data.json'), JSON.stringify(appData,null,2)); }
function loadInterested() { const f = path.join(DATA_DIR,'interested.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f,'utf8')) : []; }
function saveInterested() { fs.writeFileSync(path.join(DATA_DIR,'interested.json'), JSON.stringify(interestedContacts,null,2)); }

let appData           = null;
let interestedContacts = [];

// ─── State ────────────────────────────────────────────────────────────────────
let sock = null, waState = 'disconnected', campaignRunning = false, campaignAborted = false;

// ─── Express + Socket.io ──────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors:{ origin:'*' } });

app.use(express.json());
app.use(require('cors')());
app.use((req,res,next) => {
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers','*');
  if (req.method==='OPTIONS') return res.sendStatus(200);
  next();
});

// ─── WhatsApp (Baileys) ───────────────────────────────────────────────────────
function setWaState(state) { waState = state; io.emit('wa_state', state); }

function toJid(contact) {
  // Convert @c.us → @s.whatsapp.net for Baileys
  return contact.replace('@c.us','') + '@s.whatsapp.net';
}

function setupMessageListener() {
  if (!sock) return;
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!appData.reply_system.enabled || msg.key.fromMe) continue;
      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const trigger = appData.reply_system.trigger_word.trim();
      if (!body.toLowerCase().includes(trigger.toLowerCase())) continue;
      const contact = msg.key.remoteJid;
      if (!interestedContacts.includes(contact)) {
        interestedContacts.push(contact);
        saveInterested();
        io.emit('log', `💚 ${contact} مهتم!`);
        io.emit('interested_update', { count:interestedContacts.length, contact });
      }
      const followup = appData.reply_system.followup_message.trim();
      if (followup && sock) {
        try { await sock.sendMessage(contact, { text: followup }); io.emit('log', `📤 رد تلقائي → ${contact}`); } catch {}
      }
    }
  });
}

async function initWhatsApp() {
  if (sock) return;
  setWaState('loading');
  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = await import('@whiskeysockets/baileys');
    const { default: pino } = await import('pino');
    const logger = pino({ level: 'silent' });

    const authPath = path.join(DATA_DIR, '.baileys_auth');
    if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      printQRInTerminal: false,
      logger,
      browser: ['MAKAN', 'Chrome', '10.0'],
    });

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        io.emit('qr', await qrcode.toDataURL(qr, { width:280 }));
        setWaState('qr');
      }
      if (connection === 'open') {
        setWaState('ready');
        io.emit('log', '✅ واتساب متصل');
        setupMessageListener();
      }
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        sock = null;
        if (loggedOut) {
          setWaState('disconnected');
          try { fs.rmSync(path.join(DATA_DIR, '.baileys_auth'), { recursive:true, force:true }); } catch {}
        } else {
          setWaState('loading');
          setTimeout(initWhatsApp, 3000);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    io.emit('log', `❌ خطأ في الاتصال: ${err.message}`);
    setWaState('error');
    sock = null;
  }
}

// ─── Campaign ─────────────────────────────────────────────────────────────────
async function runCampaign() {
  if (campaignRunning) return;
  const images = loadImages();
  if (!sock || waState !== 'ready') return io.emit('log', '❌ واتساب غير متصل');
  if (!images.length)               return io.emit('log', '❌ مفيش صور');
  if (!appData.contacts.length)     return io.emit('log', '❌ مفيش أرقام');
  if (!appData.captions.length)     return io.emit('log', '❌ مفيش رسائل');

  campaignRunning = true; campaignAborted = false;
  io.emit('campaign_state', { running:true });
  const contacts = shuffle(appData.contacts);
  io.emit('log', `📋 بدأت الحملة — ${contacts.length} رقم`);
  io.emit('progress', { current:0, total:contacts.length });
  let sent = 0, skipped = 0;

  for (let i = 0; i < contacts.length; i++) {
    if (campaignAborted) { io.emit('log', '🛑 توقفت'); break; }
    const contact = contacts[i];
    const imgPath = images[randomInt(0, images.length-1)];
    const raw     = appData.captions[randomInt(0, appData.captions.length-1)];
    const full    = appData.reply_system.enabled && appData.reply_system.append_text ? raw+'\n\n'+appData.reply_system.append_text : raw;
    const caption = evadeCaption(full);
    let tmpPath   = null;
    try {
      const jid = toJid(contact);
      const [exists] = await sock.onWhatsApp(jid.replace('@s.whatsapp.net',''));
      if (!exists?.exists) { skipped++; io.emit('progress',{current:i+1,total:contacts.length}); continue; }
      tmpPath = await generateUniqueImage(imgPath, contact);
      const imageBuffer = fs.readFileSync(tmpPath);
      await sock.sendMessage(jid, { image: imageBuffer, caption });
      sent++;
      io.emit('log', `✅ [${i+1}/${contacts.length}] ${contact}`);
    } catch (err) {
      io.emit('log', `❌ فشل ${contact}: ${err.message}`);
    } finally {
      if (tmpPath) { try { fs.unlinkSync(tmpPath); } catch {} }
    }
    io.emit('progress', { current:i+1, total:contacts.length });
    if (i < contacts.length-1 && !campaignAborted) {
      const s = randomInt(14, 47);
      io.emit('log', `⏳ ${s}s...`);
      await sleep(s * 1000);
    }
  }
  cleanupTemp(); campaignRunning = false;
  io.emit('campaign_state', { running:false });
  io.emit('log', `🎉 انتهت — أُرسل: ${sent} | تخطّى: ${skipped}`);
}

// ─── Multer ───────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req,_file,cb) => cb(null, path.join(DATA_DIR,'temp_uploads')),
    filename:    (_req,file,cb)  => cb(null, `${Date.now()}_${file.originalname}`),
  }),
  fileFilter: (_req,file,cb) => cb(null, ['.xlsx','.xls','.csv'].includes(path.extname(file.originalname).toLowerCase())),
  limits: { fileSize: 10*1024*1024 },
});
const imgUpload = multer({
  storage: multer.diskStorage({
    destination: (_req,_file,cb) => cb(null, path.join(DATA_DIR,'images')),
    filename:    (_req,file,cb)  => cb(null, `${Date.now()}_${file.originalname}`),
  }),
  fileFilter: (_req,file,cb) => cb(null, SUPPORTED.has(path.extname(file.originalname).toLowerCase())),
  limits: { fileSize: 20*1024*1024 },
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.get('/api/data', (_req,res) => res.json({...appData, images:loadImages().map(p=>path.basename(p)), wa_state:waState, campaign_running:campaignRunning, interested_count:interestedContacts.length}));
app.post('/api/contacts', (req,res) => { appData.contacts=req.body.contacts??[]; saveData(); res.json({ok:true,count:appData.contacts.length}); });
app.post('/api/contacts/upload', upload.single('file'), (req,res) => {
  if (!req.file) return res.status(400).json({error:'لم يتم رفع ملف'});
  try { const contacts=parseExcel(req.file.path); fs.unlinkSync(req.file.path); res.json({ok:true,contacts,count:contacts.length}); }
  catch(err) { try{fs.unlinkSync(req.file.path);}catch{} res.status(500).json({error:err.message}); }
});
app.post('/api/captions', (req,res) => { appData.captions=req.body.captions??[]; saveData(); res.json({ok:true}); });
app.get('/api/images', (_req,res) => res.json({images:loadImages().map(p=>path.basename(p))}));
app.post('/api/images/upload', imgUpload.single('image'), (req,res) => {
  if (!req.file) return res.status(400).json({error:'لم يتم رفع صورة'});
  res.json({ok:true, filename:req.file.filename});
});
app.post('/api/reply-system', (req,res) => { appData.reply_system={...appData.reply_system,...req.body}; saveData(); res.json({ok:true}); });
app.get('/api/interested/download', (_req,res) => {
  const rows=[['الأرقام المهتمة'],...interestedContacts.map(c=>[c.replace('@s.whatsapp.net','').replace('@c.us','')])];
  const wb=XLSX.utils.book_new(); const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:20}]; XLSX.utils.book_append_sheet(wb,ws,'المهتمون');
  const buf=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Disposition','attachment; filename="interested.xlsx"');
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});
app.post('/api/interested/clear', (_req,res) => { interestedContacts=[]; saveInterested(); io.emit('interested_update',{count:0,contact:null}); res.json({ok:true}); });
app.post('/api/campaign/start', (_req,res) => { runCampaign(); res.json({ok:true}); });
app.post('/api/campaign/stop',  (_req,res) => { campaignAborted=true; res.json({ok:true}); });
app.post('/api/reconnect', (_req,res) => {
  if (sock) { try { sock.end(); } catch {} sock = null; }
  setTimeout(initWhatsApp, 1500);
  res.json({ok:true});
});
app.post('/api/disconnect', async (_req,res) => {
  if (!sock) return res.json({ok:true});
  try { await sock.logout(); } catch {}
  sock = null; setWaState('disconnected');
  try { fs.rmSync(path.join(DATA_DIR,'.baileys_auth'), { recursive:true, force:true }); } catch {}
  io.emit('log', '🔌 تم قطع الاتصال');
  res.json({ok:true});
});

io.on('connection', (socket) => {
  socket.emit('wa_state', waState);
  socket.emit('campaign_state', { running:campaignRunning });
  socket.emit('interested_update', { count:interestedContacts.length, contact:null });
});

// ─── Start ────────────────────────────────────────────────────────────────────
function startWaServer(userDataPath) {
  setDataDir(userDataPath);
  appData           = loadData();
  interestedContacts = loadInterested();

  server.listen(WA_PORT, '127.0.0.1', () => {
    console.log(`✅ WA Server → http://localhost:${WA_PORT}`);
    initWhatsApp();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${WA_PORT} already in use — WA server skipped`);
    } else {
      console.error('WA server error:', err);
    }
  });
}

module.exports = { startWaServer };
