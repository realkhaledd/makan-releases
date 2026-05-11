const { contextBridge, ipcRenderer } = require('electron');

// ── Sanitisation helpers (renderer-side, before any IPC call) ─────────────────
const str  = (v, max = 2048) => (typeof v === 'string' ? v.slice(0, max) : '');
const num  = (v)             => (typeof v === 'number' ? v : (isNaN(Number(v)) ? 0 : Number(v)));
const bool = (v)             => Boolean(v);

function sanitiseSmtp(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('Invalid SMTP config.');
  return {
    host: str(cfg.host, 253),
    port: num(cfg.port),
    user: str(cfg.user, 320),
    pass: str(cfg.pass, 512),
  };
}

function sanitiseBulkPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload.');
  if (!Array.isArray(payload.recipients))       throw new Error('recipients must be an array.');
  if (payload.recipients.length > 5000)         throw new Error('Recipient limit exceeded (5000 max).');
  return {
    subject:    str(payload.subject, 998),
    body:       str(payload.body, 1_000_000),
    recipients: payload.recipients.map(r => ({
      Email: str(r?.Email ?? r?.email ?? '', 320),
      Name:  str(r?.Name  ?? r?.name  ?? '', 200),
    })),
  };
}

function sanitiseMeta(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('Invalid Meta config.');
  return {
    token:  str(cfg.token,  512),
    formId: str(cfg.formId, 64),
    since:  cfg.since != null ? num(cfg.since) : undefined,
  };
}

function sanitiseMetaToken(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('Invalid input.');
  return {
    token:  str(cfg.token,  512),
    formId: str(cfg.formId, 64),
  };
}

// ── Exposed APIs ──────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('smtpAPI', {
  saveConfig: (cfg) => ipcRenderer.invoke('save-smtp',  sanitiseSmtp(cfg)),
  getConfig:  ()    => ipcRenderer.invoke('get-smtp'),
  testConn:   (cfg) => ipcRenderer.invoke('test-smtp',  sanitiseSmtp(cfg)),
});

contextBridge.exposeInMainWorld('mailAPI', {
  sendBulk: (payload) => ipcRenderer.invoke('send-bulk-mail', sanitiseBulkPayload(payload)),

  onProgress: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_e, data) => {
      // Only forward a safe, typed subset — never the raw IPC event
      callback({
        current: num(data?.current),
        total:   num(data?.total),
        email:   str(data?.email, 320),
        status:  str(data?.status, 20),
      });
    };
    ipcRenderer.on('mail-progress', handler);
    return () => ipcRenderer.removeListener('mail-progress', handler);
  },
});

contextBridge.exposeInMainWorld('metaAPI', {
  fetchLeads:    (cfg) => ipcRenderer.invoke('fetch-meta-leads',  sanitiseMeta(cfg)),
  saveToken:     (cfg) => ipcRenderer.invoke('save-meta-token',   sanitiseMetaToken(cfg)),
  getToken:      ()    => ipcRenderer.invoke('get-meta-token'),
});

contextBridge.exposeInMainWorld('agencyAPI', {
  get:    ()       => ipcRenderer.invoke('get-agency'),
  set:    (code)   => ipcRenderer.invoke('set-agency',    str(code, 50)),
  clear:  ()       => ipcRenderer.invoke('clear-agency'),
  reload: (code)   => ipcRenderer.invoke('reload-agency', str(code, 50)),
});
