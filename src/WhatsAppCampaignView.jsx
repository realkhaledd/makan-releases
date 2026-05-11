import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import {
  MessageCircle, Wifi, WifiOff, Play, Square, Upload,
  Plus, Trash2, Download, RefreshCw, Users, Image, FileText,
  CheckCircle, XCircle, AlertCircle, Loader, RotateCcw, X
} from 'lucide-react';

const DEFAULT_SERVER = 'http://localhost:3001';
const getServer = () => localStorage.getItem('wa_server_url') || DEFAULT_SERVER;

const card = (dk, extra = {}) => ({
  background: dk ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
  border: dk ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.12)',
  borderRadius: 16,
  padding: '20px 22px',
  boxShadow: dk ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
  ...extra,
});

const btn = (bg, color = '#fff', extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px', borderRadius: 10, border: 'none',
  background: bg, color, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', transition: 'opacity .18s',
  ...extra,
});

const inp = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  border: '1.5px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#e8eeff', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

const STATE_LABEL = {
  disconnected:  { label: 'غير متصل',       color: '#ff4444', icon: <WifiOff size={14}/> },
  loading:       { label: 'جاري التحميل…',  color: '#f5a623', icon: <Loader size={14} style={{animation:'spin 1s linear infinite'}}/> },
  qr:            { label: 'امسح QR',         color: '#f5a623', icon: <AlertCircle size={14}/> },
  authenticated: { label: 'جاري الدخول…',   color: '#f5a623', icon: <Loader size={14}/> },
  ready:         { label: 'متصل ✓',          color: '#00e676', icon: <Wifi size={14}/> },
  error:         { label: 'خطأ في الاتصال',  color: '#ff4444', icon: <XCircle size={14}/> },
};

export default function WhatsAppCampaignView({ lang, f, rtl, darkMode = false }) {
  const dk = darkMode;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [serverUrl,    setServerUrl]    = useState(getServer());
  const [urlInput,     setUrlInput]     = useState(getServer());
  const [showUrlEdit,  setShowUrlEdit]  = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [waState,      setWaState]      = useState('disconnected');
  const [qrImg,        setQrImg]        = useState(null);
  const [contacts,     setContacts]     = useState([]);
  const [captions,     setCaptions]     = useState([]);
  const [images,       setImages]       = useState([]);
  const [newCaption,   setNewCaption]   = useState('');
  const [logs,         setLogs]         = useState([]);
  const [progress,     setProgress]     = useState(null); // {current,total}
  const [running,      setRunning]      = useState(false);
  const [interested,   setInterested]   = useState(0);
  const [replySystem,  setReplySystem]  = useState({ enabled:false, append_text:'', trigger_word:'نعم', followup_message:'' });
  const [activeSection,setActiveSection]= useState('status'); // status|contacts|messages|images|reply|logs
  const [contactInput, setContactInput] = useState('');
  const [fileName,     setFileName]     = useState('');

  const socketRef   = useRef(null);
  const logsEndRef  = useRef(null);
  const fileRef     = useRef(null);
  const imgRef      = useRef(null);

  /* ── Scroll logs ── */
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [logs]);

  /* ── Connect to server ── */
  useEffect(() => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(serverUrl, { timeout: 4000, reconnectionAttempts: 3 });
    socketRef.current = socket;

    socket.on('connect',   () => setServerOnline(true));
    socket.on('disconnect',() => setServerOnline(false));
    socket.on('connect_error', () => setServerOnline(false));

    socket.on('wa_state',        s   => setWaState(s));
    socket.on('qr',              img => setQrImg(img));
    socket.on('campaign_state',  d   => setRunning(d.running));
    socket.on('progress',        d   => setProgress(d));
    socket.on('log',             msg => setLogs(p => [...p.slice(-199), msg]));
    socket.on('interested_update', d => setInterested(d.count));

    /* Load initial data */
    fetch(`${serverUrl}/api/data`)
      .then(r => r.json())
      .then(d => {
        setContacts(d.contacts || []);
        setCaptions(d.captions || []);
        setImages(d.images   || []);
        setRunning(d.campaign_running || false);
        setInterested(d.interested_count || 0);
        setWaState(d.wa_state || 'disconnected');
        if (d.reply_system) setReplySystem(d.reply_system);
      })
      .catch(() => {});

    return () => socket.disconnect();
  }, []);

  /* ── Helpers ── */
  const post = (url, body) =>
    fetch(`${serverUrl}${url}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });

  const saveContacts = useCallback((list) => {
    setContacts(list);
    post('/api/contacts', { contacts: list });
  }, []);

  const saveCaptions = useCallback((list) => {
    setCaptions(list);
    post('/api/captions', { captions: list });
  }, []);

  const saveReply = useCallback((data) => {
    setReplySystem(data);
    post('/api/reply-system', data);
  }, []);

  /* ── Upload contacts Excel ── */
  const handleContactFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${serverUrl}/api/contacts/upload`, { method:'POST', body: formData });
    const data = await res.json();
    if (data.contacts) {
      const nums = data.contacts.map(c => c.replace('@c.us',''));
      setContacts(data.contacts);
      addLog(`✅ تم استيراد ${data.count} رقم من ${file.name}`);
    }
  };

  /* ── Add manual contacts ── */
  const handleAddContacts = () => {
    const lines = contactInput.split(/[\n,،\s]+/).map(s => s.trim()).filter(Boolean);
    const normalized = lines.map(n => {
      let d = n.replace(/[\s\-\(\)\+\.]/g,'').replace(/\D/g,'');
      if (d.startsWith('00')) d = d.slice(2);
      if (d.length===11 && d.startsWith('01')) return '20'+d.slice(1)+'@c.us';
      if (d.length>=11 && !d.startsWith('0')) return d+'@c.us';
      if (d.startsWith('0') && d.length>=10) return '20'+d.slice(1)+'@c.us';
      return d.length>=8 ? '20'+d+'@c.us' : null;
    }).filter(Boolean);
    const merged = [...new Set([...contacts, ...normalized])];
    saveContacts(merged);
    setContactInput('');
  };

  /* ── Upload image ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    await fetch(`${serverUrl}/api/images/upload`, { method:'POST', body: formData });
    const res  = await fetch(`${serverUrl}/api/images`);
    const data = await res.json();
    setImages(data.images || []);
  };

  const addLog = (msg) => setLogs(p => [...p, msg]);

  const stInfo = STATE_LABEL[waState] || STATE_LABEL.disconnected;

  /* ── Sections ── */
  const sections = [
    { id:'status',   icon:<Wifi size={15}/>,        label: 'الاتصال'   },
    { id:'contacts', icon:<Users size={15}/>,        label: 'الأرقام'   },
    { id:'messages', icon:<MessageCircle size={15}/>,label: 'الرسائل'   },
    { id:'images',   icon:<Image size={15}/>,        label: 'الصور'     },
    { id:'reply',    icon:<RotateCcw size={15}/>,    label: 'الرد التلقائي' },
    { id:'logs',     icon:<FileText size={15}/>,     label: `اللوج ${logs.length ? `(${logs.length})` : ''}` },
  ];

  return (
    <div style={{ padding:'24px 28px', maxWidth:900, margin:'0 auto', fontFamily:'inherit', color: dk ? '#e8eeff' : '#0f172a' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'#25d36622', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MessageCircle size={22} color="#25d366"/>
        </div>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:'#e8eeff' }}>
            {f('واتساب كامبين','WhatsApp Campaign')}
          </h2>
          <div style={{ fontSize:12, color:'#7aa0ff', marginTop:2 }}>
            {f('إرسال رسائل جماعية عبر واتساب','Bulk WhatsApp messaging tool')}
          </div>
        </div>

        {/* Server + WA status */}
        <div style={{ marginInlineStart:'auto', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20,
            background: serverOnline ? 'rgba(0,230,118,0.1)' : 'rgba(255,68,68,0.1)',
            border: `1px solid ${serverOnline ? '#00e67640' : '#ff444440'}`,
            fontSize:12, fontWeight:600, color: serverOnline ? '#00e676' : '#ff4444' }}>
            {serverOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
            {serverOnline ? f('السيرفر شغال','Server Online') : f('السيرفر مش شغال','Server Offline')}
          </div>
          {serverOnline && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20,
              background: `${stInfo.color}18`, border:`1px solid ${stInfo.color}40`,
              fontSize:12, fontWeight:600, color: stInfo.color }}>
              {stInfo.icon} {stInfo.label}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile notice ── */}
      {isMobile && (
        <div style={{ ...card(dk), background:'rgba(245,166,35,0.07)', border:'1px solid rgba(245,166,35,0.2)', marginBottom:16, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
          <AlertCircle size={18} color="#f5a623" style={{ flexShrink:0, marginTop:1 }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#f5a623', marginBottom:4 }}>
              {f('الأداة دي للكمبيوتر بس','Desktop Only Tool')}
            </div>
            <div style={{ fontSize:12, color:'#9aabcc', lineHeight:1.6 }}>
              {f('سيرفر الواتساب بيشتغل على جهازك. لو على نفس الشبكة غيّر الـ URL لـ IP جهازك.','The WhatsApp server runs on your Mac. If on the same network, change the URL to your Mac\'s IP.')}
            </div>
          </div>
        </div>
      )}

      {/* ── Server URL editor ── */}
      <div style={{ marginBottom:16 }}>
        {showUrlEdit ? (
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
              placeholder="http://localhost:3001"
              style={{ ...inp, flex:1, fontSize:12, padding:'8px 12px' }}/>
            <button onClick={() => {
              const url = urlInput.trim().replace(/\/$/, '');
              localStorage.setItem('wa_server_url', url);
              setServerUrl(url);
              setShowUrlEdit(false);
            }} style={btn('#25d36622','#25d366',{border:'1px solid #25d36640',padding:'8px 14px',fontSize:12})}>
              حفظ
            </button>
            <button onClick={() => setShowUrlEdit(false)}
              style={btn('rgba(255,255,255,0.04)','#9aabcc',{border:'1px solid rgba(255,255,255,0.06)',padding:'8px 12px',fontSize:12})}>
              إلغاء
            </button>
          </div>
        ) : (
          <button onClick={() => setShowUrlEdit(true)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#3e4f72', display:'flex', alignItems:'center', gap:5 }}>
            <RefreshCw size={11}/> {serverUrl}
          </button>
        )}
      </div>

      {/* ── Server Offline Notice ── */}
      {!serverOnline && (
        <div style={{ ...card(dk), background:'rgba(255,68,68,0.07)', border:'1px solid rgba(255,68,68,0.2)', marginBottom:20, textAlign:'center', padding:'28px 20px' }}>
          <WifiOff size={32} color="#ff4444" style={{ marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:700, color:'#ff4444', marginBottom:8 }}>
            {f('السيرفر مش شغال','Server is Offline')}
          </div>
          <div style={{ fontSize:13, color:'#9aabcc', lineHeight:1.7 }}>
            {isMobile
              ? f('شغّل السيرفر على الكمبيوتر الأول، وتأكد إن الـ URL صح','Start the server on your Mac first, and make sure the URL is correct')
              : f('لازم تشغّل سيرفر الواتساب الأول. افتح فولدر "api whatsapp" وشغّل ملف start.command','Start the WhatsApp server first. Open the "api whatsapp" folder and run start.command')
            }
          </div>
          {!isMobile && (
            <div style={{ marginTop:14, padding:'10px 16px', background:'rgba(0,0,0,0.3)', borderRadius:8, fontFamily:'monospace', fontSize:12, color:'#7aa0ff', display:'inline-block' }}>
              cd "api whatsapp" &amp;&amp; node server.js
            </div>
          )}
        </div>
      )}

      {serverOnline && (
        <>
          {/* ── Section Tabs ── */}
          <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                ...btn(activeSection===s.id ? '#25d36622' : 'rgba(255,255,255,0.04)',
                       activeSection===s.id ? '#25d366' : '#9aabcc'),
                border: activeSection===s.id ? '1px solid #25d36640' : '1px solid rgba(255,255,255,0.06)',
                padding:'7px 14px', fontSize:12,
              }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* ── Campaign Start/Stop bar ── */}
          <div style={{ ...card(dk), display:'flex', alignItems:'center', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:'#9aabcc', marginBottom:4 }}>
                {contacts.length} {f('رقم','numbers')} · {captions.length} {f('رسالة','messages')} · {images.length} {f('صورة','images')}
              </div>
              {progress && running && (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'#25d366', borderRadius:3, width:`${(progress.current/progress.total)*100}%`, transition:'width .4s' }}/>
                  </div>
                  <span style={{ fontSize:12, color:'#25d366', fontWeight:700, whiteSpace:'nowrap' }}>
                    {progress.current}/{progress.total}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {interested > 0 && (
                <button onClick={() => window.open(`${serverUrl}/api/interested/download`,'_blank')} style={btn('rgba(0,212,255,0.1)','#00d4ff',{border:'1px solid #00d4ff30',fontSize:12})}>
                  <Download size={13}/> {f('المهتمين','Interested')} ({interested})
                </button>
              )}
              {running ? (
                <button onClick={() => post('/api/campaign/stop',{})} style={btn('#ff444420','#ff4444',{border:'1px solid #ff444440'})}>
                  <Square size={14}/> {f('إيقاف','Stop')}
                </button>
              ) : (
                <button
                  onClick={() => { post('/api/campaign/start',{}); setActiveSection('logs'); }}
                  disabled={waState!=='ready' || !contacts.length || !captions.length || !images.length}
                  style={{ ...btn('#25d366', '#fff'), opacity:(waState==='ready'&&contacts.length&&captions.length&&images.length)?1:0.4 }}>
                  <Play size={14}/> {f('ابدأ الحملة','Start Campaign')}
                </button>
              )}
            </div>
          </div>

          {/* ────────── STATUS ────────── */}
          {activeSection==='status' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* QR / Status */}
              <div style={{ ...card(dk), textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:16 }}>
                  {f('اتصال واتساب','WhatsApp Connection')}
                </div>
                {waState==='ready' ? (
                  <div>
                    <CheckCircle size={56} color="#00e676" style={{ marginBottom:12 }}/>
                    <div style={{ fontSize:14, color:'#00e676', fontWeight:700, marginBottom:16 }}>
                      {f('متصل وجاهز','Connected & Ready')}
                    </div>
                    <button onClick={() => post('/api/disconnect',{})} style={btn('rgba(255,68,68,0.1)','#ff4444',{border:'1px solid #ff444430',fontSize:12})}>
                      <WifiOff size={13}/> {f('قطع الاتصال','Disconnect')}
                    </button>
                  </div>
                ) : qrImg && waState==='qr' ? (
                  <div>
                    <div style={{ fontSize:12, color:'#f5a623', marginBottom:12 }}>
                      {f('افتح واتساب ← اتصال الأجهزة ← ربط جهاز','Open WhatsApp → Linked Devices → Link a Device')}
                    </div>
                    <img src={qrImg} alt="QR" style={{ width:200, height:200, borderRadius:12, border:'2px solid rgba(255,255,255,0.1)' }}/>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:13, color: stInfo.color, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      {stInfo.icon} {stInfo.label}
                    </div>
                    <button onClick={() => post('/api/reconnect',{})} style={btn('#25d36622','#25d366',{border:'1px solid #25d36640'})}>
                      <RefreshCw size={13}/> {f('اتصل','Connect')}
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ ...card(dk) }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:16 }}>
                  {f('إحصائيات','Stats')}
                </div>
                {[
                  { label: f('الأرقام المضافة','Contacts'),   val: contacts.length,   color:'#7aa0ff' },
                  { label: f('الرسائل المضافة','Captions'),   val: captions.length,   color:'#f5a623' },
                  { label: f('الصور المضافة','Images'),        val: images.length,     color:'#00d4ff' },
                  { label: f('المهتمين','Interested'),          val: interested,        color:'#00e676' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:13, color:'#9aabcc' }}>{label}</span>
                    <span style={{ fontSize:18, fontWeight:800, color, fontFamily:'monospace' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ────────── CONTACTS ────────── */}
          {activeSection==='contacts' && (
            <div style={card(dk)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>
                  {f('الأرقام','Contacts')} <span style={{ color:'#25d366', marginInlineStart:6 }}>({contacts.length})</span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => fileRef.current?.click()} style={btn('rgba(122,160,255,0.1)','#7aa0ff',{border:'1px solid #7aa0ff30',fontSize:12})}>
                    <Upload size={13}/> {f('استورد Excel','Import Excel')}
                  </button>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={handleContactFile}/>
                  {contacts.length > 0 && (
                    <button onClick={() => saveContacts([])} style={btn('rgba(255,68,68,0.1)','#ff4444',{border:'1px solid #ff444430',fontSize:12})}>
                      <Trash2 size={13}/> {f('امسح الكل','Clear All')}
                    </button>
                  )}
                </div>
              </div>

              {fileName && <div style={{ fontSize:11, color:'#25d366', marginBottom:12 }}>✅ {fileName}</div>}

              {/* Manual add */}
              <div style={{ marginBottom:16 }}>
                <textarea
                  value={contactInput}
                  onChange={e => setContactInput(e.target.value)}
                  placeholder={f('أدخل الأرقام (سطر أو فاصلة): \n0501234567\n971521234567','Enter numbers (line or comma):\n0501234567\n971521234567')}
                  style={{ ...inp, height:90, resize:'vertical', fontSize:12 }}
                />
                <button onClick={handleAddContacts} disabled={!contactInput.trim()} style={{ ...btn('#25d36622','#25d366',{border:'1px solid #25d36640',marginTop:8}), opacity:contactInput.trim()?1:0.4 }}>
                  <Plus size={13}/> {f('أضف الأرقام','Add Numbers')}
                </button>
              </div>

              {/* List preview */}
              {contacts.length > 0 && (
                <div style={{ maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                  {contacts.slice(0,100).map((c,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'6px 10px', borderRadius:8, background:'rgba(37,211,102,0.05)', fontSize:12, color:'#9aabcc' }}>
                      <span style={{fontFamily:'monospace'}}>{c.replace('@c.us','')}</span>
                      <button onClick={() => saveContacts(contacts.filter((_,j)=>j!==i))}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#ff4444', padding:'2px 4px' }}>
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                  {contacts.length > 100 && <div style={{fontSize:11,color:'#9aabcc',textAlign:'center',padding:8}}>+{contacts.length-100} {f('أرقام أخرى','more numbers')}</div>}
                </div>
              )}
            </div>
          )}

          {/* ────────── MESSAGES ────────── */}
          {activeSection==='messages' && (
            <div style={card(dk)}>
              <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:16 }}>
                {f('الرسائل والكابشنز','Messages & Captions')}
                <span style={{ color:'#f5a623', marginInlineStart:8, fontSize:12 }}>({captions.length})</span>
                <span style={{ fontSize:11, color:'#9aabcc', display:'block', fontWeight:400, marginTop:3 }}>
                  {f('السيستم هيختار رسالة عشوائية لكل مرسل','System picks a random message per contact')}
                </span>
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <textarea
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                  placeholder={f('اكتب رسالة جديدة...','Write a new message...')}
                  style={{ ...inp, flex:1, height:70, resize:'vertical' }}
                />
                <button onClick={() => { if(newCaption.trim()){ saveCaptions([...captions, newCaption.trim()]); setNewCaption(''); }}}
                  disabled={!newCaption.trim()}
                  style={{ ...btn('#f5a62322','#f5a623',{border:'1px solid #f5a62340',alignSelf:'flex-end',whiteSpace:'nowrap'}), opacity:newCaption.trim()?1:0.4 }}>
                  <Plus size={13}/> {f('أضف','Add')}
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {captions.map((cap,i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'12px 14px',
                    borderRadius:10, background:'rgba(245,166,35,0.05)', border:'1px solid rgba(245,166,35,0.1)' }}>
                    <div style={{ flex:1, fontSize:13, color:'#e8eeff', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{cap}</div>
                    <button onClick={() => saveCaptions(captions.filter((_,j)=>j!==i))}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#ff4444', padding:'2px 4px', flexShrink:0 }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
                {!captions.length && (
                  <div style={{ textAlign:'center', color:'#9aabcc', fontSize:13, padding:'20px 0' }}>
                    {f('مفيش رسائل مضافة — أضف رسالة واحدة على الأقل','No messages yet — add at least one')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ────────── IMAGES ────────── */}
          {activeSection==='images' && (
            <div style={card(dk)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>
                  {f('الصور','Images')}
                  <span style={{ color:'#00d4ff', marginInlineStart:8, fontSize:12 }}>({images.length})</span>
                  <span style={{ fontSize:11, color:'#9aabcc', display:'block', fontWeight:400, marginTop:3 }}>
                    {f('كل صورة بتتعدّل تلقائياً للحماية من الحظر','Each image is auto-modified for anti-ban')}
                  </span>
                </div>
                <button onClick={() => imgRef.current?.click()} style={btn('rgba(0,212,255,0.1)','#00d4ff',{border:'1px solid #00d4ff30',fontSize:12})}>
                  <Upload size={13}/> {f('رفع صورة','Upload Image')}
                </button>
                <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload}/>
              </div>

              {images.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {images.map((img,i) => (
                    <div key={i} style={{ padding:'8px 12px', borderRadius:8,
                      background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.12)',
                      fontSize:12, color:'#9aabcc', display:'flex', alignItems:'center', gap:8 }}>
                      <Image size={13} color="#00d4ff"/>
                      {img}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'28px 0' }}>
                  <Image size={36} color="#3e4f72" style={{ marginBottom:10 }}/>
                  <div style={{ color:'#9aabcc', fontSize:13 }}>
                    {f('مفيش صور — ارفع صورة واحدة على الأقل','No images — upload at least one')}
                  </div>
                  <div style={{ fontSize:11, color:'#3e4f72', marginTop:6 }}>
                    {f('أو ضع الصور في فولدر images/ جوا فولدر السيرفر','Or place images in the images/ folder inside the server folder')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────── REPLY SYSTEM ────────── */}
          {activeSection==='reply' && (
            <div style={card(dk)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>{f('الرد التلقائي','Auto-Reply System')}</div>
                  <div style={{ fontSize:11, color:'#9aabcc', marginTop:3 }}>
                    {f('لما حد يرد بكلمة معينة يتحفظ في قائمة المهتمين','When someone replies with a keyword they get saved as interested')}
                  </div>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <span style={{ fontSize:12, color: replySystem.enabled ? '#00e676' : '#9aabcc', fontWeight:600 }}>
                    {replySystem.enabled ? f('مفعّل','Enabled') : f('معطّل','Disabled')}
                  </span>
                  <div onClick={() => saveReply({...replySystem, enabled:!replySystem.enabled})}
                    style={{ width:40, height:22, borderRadius:11, background: replySystem.enabled ? '#00e676' : 'rgba(255,255,255,0.1)',
                    cursor:'pointer', position:'relative', transition:'background .2s' }}>
                    <div style={{ position:'absolute', top:3, left: replySystem.enabled ? 20 : 3, width:16, height:16,
                      borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                  </div>
                </label>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { key:'trigger_word',     label:f('كلمة التفعيل','Trigger Word'),         ph:f('نعم','yes'), hint:f('لما حد يكتبها يتحفظ كمهتم','When someone writes this they get saved as interested') },
                  { key:'append_text',      label:f('نص يتضاف للرسائل','Appended to messages'), ph:'ردّ بـ نعم لو مهتم 👇', hint:f('بيتضاف تلقائياً لآخر كل رسالة','Automatically appended to every message') },
                  { key:'followup_message', label:f('رسالة الرد التلقائي','Auto-Reply Message'),  ph:f('شكراً على اهتمامك! سنتواصل معك','Thanks! We will contact you soon'), hint:f('الرسالة اللي بتتبعت تلقائياً لما حد يرد بكلمة التفعيل','Sent automatically when trigger word is detected') },
                ].map(({ key, label, ph, hint }) => (
                  <div key={key}>
                    <label style={{ fontSize:11, fontWeight:700, color:'#9aabcc', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
                    <input
                      value={replySystem[key]}
                      onChange={e => setReplySystem(p => ({...p, [key]:e.target.value}))}
                      onBlur={() => saveReply(replySystem)}
                      placeholder={ph}
                      style={inp}
                    />
                    <div style={{ fontSize:10, color:'#3e4f72', marginTop:4 }}>{hint}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ────────── LOGS ────────── */}
          {activeSection==='logs' && (
            <div style={card(dk)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>
                  {f('اللوج','Campaign Log')}
                  {running && <span style={{ marginInlineStart:8, fontSize:11, color:'#25d366', fontWeight:600, animation:'pulse 1.5s infinite' }}>● {f('شغال','Running')}</span>}
                </div>
                <button onClick={() => setLogs([])} style={btn('rgba(255,255,255,0.04)','#9aabcc',{border:'1px solid rgba(255,255,255,0.06)',fontSize:11,padding:'5px 12px'})}>
                  {f('مسح','Clear')}
                </button>
              </div>
              <div style={{ height:340, overflowY:'auto', fontFamily:'monospace', fontSize:12, lineHeight:1.8, display:'flex', flexDirection:'column', gap:1 }}>
                {logs.length === 0 && (
                  <div style={{ color:'#3e4f72', textAlign:'center', padding:'28px 0' }}>
                    {f('مفيش لوج لسه — ابدأ الحملة','No logs yet — start the campaign')}
                  </div>
                )}
                {logs.map((log,i) => {
                  const color = log.startsWith('✅')||log.startsWith('🎉') ? '#00e676'
                              : log.startsWith('❌') ? '#ff4444'
                              : log.startsWith('⚠') ? '#f5a623'
                              : log.startsWith('💚') ? '#25d366'
                              : log.startsWith('📤') ? '#7aa0ff'
                              : '#9aabcc';
                  return <div key={i} style={{ color, padding:'1px 0' }}>{log}</div>;
                })}
                <div ref={logsEndRef}/>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
