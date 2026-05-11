const { app, BrowserWindow, shell, session, ipcMain, safeStorage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path    = require('path');
const Store   = require('electron-store');
const nodemailer = require('nodemailer');

// ── Agency Store ──────────────────────────────────────────────────────────────
const agencyStore = new Store({ name: 'makan-agency' });

// ── Auto Updater (silent background updates) ──────────────────────────────────
autoUpdater.autoDownload    = true;   // حمّل تلقائياً
autoUpdater.autoInstallOnAppQuit = true; // ثبّت لما يقفل

// ── WhatsApp Campaign Server ──────────────────────────────────────────────────
try {
  const { startWaServer } = require('./wa-server.cjs');
  app.whenReady().then(() => {
    startWaServer(app.getPath('userData'));
  });
} catch (err) {
  console.warn('WA server not available:', err.message);
}

const store = new Store({ name: 'makan-config' });

// ── Encryption helpers ────────────────────────────────────────────────────────
function encrypt(plaintext) {
  if (!plaintext) return '';
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(String(plaintext)).toString('base64')
    : Buffer.from(String(plaintext)).toString('base64');
}
function decrypt(ciphertext) {
  if (!ciphertext) return '';
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.decryptString(Buffer.from(ciphertext, 'base64'))
    : Buffer.from(ciphertext, 'base64').toString();
}

// ── IPC input validators ──────────────────────────────────────────────────────
const isString  = (v) => typeof v === 'string';
const isNumber  = (v) => typeof v === 'number' || (isString(v) && !isNaN(Number(v)));
const isArray   = (v) => Array.isArray(v);

// ── Keep a global reference so the window isn't GC'd ──────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1380,
    height:    860,
    minWidth:  960,
    minHeight: 640,
    title:     'MAKAN Property OS',
    titleBarStyle:        'hiddenInset',
    trafficLightPosition: { x: 16, y: 20 },
    backgroundColor:      '#f8fafc',
    webPreferences: {
      nodeIntegration:             false,
      contextIsolation:            true,
      sandbox:                     true,
      webSecurity:                 true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load app with agencyId if saved
  const savedAgency = agencyStore.get('agencyId');
  if (savedAgency) {
    mainWindow.loadFile(path.join(__dirname, '../dist/app.html'), {
      query: { agency: savedAgency }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/agency-setup.html'));
  }

  // Block all navigation away from the app origin
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appURL = `file://${path.join(__dirname, '../dist/app.html')}`;
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  // Disable DevTools in production
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const allowed = ['https://'].some(p => url.startsWith(p));
    if (allowed) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  session.defaultSession.on('will-download', (event, item) => {
    const downloadsPath = app.getPath('downloads');
    item.setSavePath(path.join(downloadsPath, item.getFilename()));
    item.on('updated', (e, state) => {
      if (state === 'interrupted') item.resume();
    });
  });

  mainWindow.setMenuBarVisibility(false);
}

// ── IPC: Save SMTP config ─────────────────────────────────────────────────────
ipcMain.handle('save-smtp', (_e, { host, port, user, pass }) => {
  if (!isString(host) || !isNumber(port) || !isString(user) || !isString(pass))
    return { ok: false, error: 'Invalid input.' };
  store.set('smtp', { host, port, user, passEnc: encrypt(pass) });
  return { ok: true };
});

// ── IPC: Read SMTP config ─────────────────────────────────────────────────────
ipcMain.handle('get-smtp', () => {
  const cfg = store.get('smtp');
  if (!cfg) return null;
  try {
    return { host: cfg.host, port: cfg.port, user: cfg.user, pass: decrypt(cfg.passEnc) };
  } catch {
    return null;
  }
});

// ── IPC: Test SMTP connection ─────────────────────────────────────────────────
ipcMain.handle('test-smtp', async (_e, { host, port, user, pass }) => {
  if (!isString(host) || !isNumber(port) || !isString(user) || !isString(pass))
    return { ok: false, error: 'Invalid input.' };
  try {
    const transporter = nodemailer.createTransport({
      host, port: Number(port), secure: Number(port) === 465,
      auth: { user, pass },
    });
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── IPC: Save Meta token (encrypted) ─────────────────────────────────────────
ipcMain.handle('save-meta-token', (_e, { token, formId }) => {
  if (!isString(token) || !isString(formId)) return { ok: false, error: 'Invalid input.' };
  store.set('meta', { tokenEnc: encrypt(token), formId });
  return { ok: true };
});

// ── IPC: Get Meta token ───────────────────────────────────────────────────────
ipcMain.handle('get-meta-token', () => {
  const m = store.get('meta');
  if (!m) return null;
  try { return { token: decrypt(m.tokenEnc), formId: m.formId }; }
  catch { return null; }
});

// ── IPC: Bulk send ────────────────────────────────────────────────────────────
ipcMain.handle('send-bulk-mail', async (event, { recipients, subject, body }) => {
  if (!isArray(recipients) || !isString(subject) || !isString(body))
    return { ok: false, error: 'Invalid input.' };
  if (recipients.length > 5000)
    return { ok: false, error: 'Recipient limit exceeded (5000 max).' };

  const cfg = store.get('smtp');
  if (!cfg) return { ok: false, error: 'No SMTP config saved.' };

  let pass;
  try { pass = decrypt(cfg.passEnc); }
  catch { return { ok: false, error: 'Failed to decrypt password.' }; }

  const transporter = nodemailer.createTransport({
    host: cfg.host, port: Number(cfg.port), secure: Number(cfg.port) === 465,
    auth: { user: cfg.user, pass },
  });

  const results = [];
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const email = String(r.Email || r.email || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ email, status: 'skipped', error: 'Invalid email.' });
      continue;
    }
    const safeName = String(r.Name || r.name || '').replace(/[<>]/g, '');
    const personalizedBody    = body.replace(/\{Name\}/gi, safeName);
    const personalizedSubject = subject.replace(/\{Name\}/gi, safeName);

    try {
      await transporter.sendMail({
        from: cfg.user, to: email,
        subject: personalizedSubject, html: personalizedBody,
      });
      results.push({ email, status: 'sent' });
    } catch (err) {
      results.push({ email, status: 'failed', error: err.message });
    }

    event.sender.send('mail-progress', {
      current: i + 1, total: recipients.length,
      email, status: results[results.length - 1].status,
    });

    if (i < recipients.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
  return { ok: true, results };
});

// ── IPC: Fetch Meta Lead Ads ──────────────────────────────────────────────────
ipcMain.handle('fetch-meta-leads', async (_e, { token, formId, since }) => {
  if (!isString(token) || !isString(formId)) return { ok: false, error: 'Invalid input.' };
  // token must look like a Meta access token (alphanumeric + limited chars)
  if (!/^[A-Za-z0-9|_\-]+$/.test(token)) return { ok: false, error: 'Invalid token format.' };
  try {
    const params = new URLSearchParams({
      access_token: token,
      limit: '100',
      fields: 'field_data,created_time,id,ad_name,campaign_name',
    });
    if (since) params.append('filtering', JSON.stringify([{ field:'time_created', operator:'GREATER_THAN', value: since }]));
    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(formId)}/leads?${params}`;
    const res  = await fetch(url);
    const json = await res.json();
    if (json.error) return { ok: false, error: json.error.message };
    return { ok: true, data: json.data || [], paging: json.paging };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Agency IPC ────────────────────────────────────────────────────────────────
ipcMain.handle('get-agency',    ()          => agencyStore.get('agencyId') || null);
ipcMain.handle('set-agency',    (_e, code)  => { agencyStore.set('agencyId', code); return { ok: true }; });
ipcMain.handle('clear-agency',  ()          => { agencyStore.delete('agencyId'); return { ok: true }; });
ipcMain.handle('reload-agency', (_e, code)  => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, '../dist/app.html'), {
      query: { agency: code }
    });
  }
  return { ok: true };
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // Check for updates silently after 3 seconds
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {}); // silent fail if no internet
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});