import React, { useState, useEffect } from 'react';
import { Settings, Save, Wifi, WifiOff, ChevronDown, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const GLASS = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.65)',
  borderRadius: 20,
  boxShadow: '0 8px 32px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
};

const PRIMARY = '#4F46E5';

const fLabel = {
  fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block',
  marginBottom: 6, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: "'Inter',sans-serif",
};
const fInput = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid rgba(226,232,240,0.8)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: 'rgba(255,255,255,0.7)',
  color: '#0f172a', fontFamily: "'Inter','Tajawal',sans-serif", transition: 'border-color .2s',
};

const PRESETS = [
  { label: 'Gmail',   host: 'smtp.gmail.com',    port: 587 },
  { label: 'Outlook', host: 'smtp.office365.com', port: 587 },
  { label: 'iCloud',  host: 'smtp.mail.me.com',   port: 587 },
  { label: 'Custom',  host: '',                   port: 587 },
];

export default function SmtpSettingsView({ lang, f, rtl, roleStyle }) {
  const [preset,   setPreset]   = useState(0);
  const [host,     setHost]     = useState(PRESETS[0].host);
  const [port,     setPort]     = useState(PRESETS[0].port);
  const [user,     setUser]     = useState('');
  const [pass,     setPass]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status,   setStatus]   = useState(''); // 'saving' | 'saved' | 'testing' | 'ok' | 'fail' | ''
  const [errMsg,   setErrMsg]   = useState('');

  const isElectron = typeof window !== 'undefined' && !!window.smtpAPI;

  useEffect(() => {
    if (!isElectron) return;
    window.smtpAPI.getConfig().then(cfg => {
      if (!cfg) return;
      setUser(cfg.user);
      setPass(cfg.pass);
      setHost(cfg.host);
      setPort(cfg.port);
      const idx = PRESETS.findIndex(p => p.host === cfg.host);
      setPreset(idx >= 0 ? idx : 3);
    });
  }, []);

  const applyPreset = (idx) => {
    setPreset(idx);
    if (PRESETS[idx].host) {
      setHost(PRESETS[idx].host);
      setPort(PRESETS[idx].port);
    }
  };

  const handleSave = async () => {
    if (!host || !port || !user || !pass) return;
    setStatus('saving');
    await window.smtpAPI.saveConfig({ host, port: Number(port), user, pass });
    setStatus('saved');
    setTimeout(() => setStatus(''), 2500);
  };

  const handleTest = async () => {
    if (!host || !port || !user || !pass) return;
    setStatus('testing');
    setErrMsg('');
    const res = await window.smtpAPI.testConn({ host, port: Number(port), user, pass });
    setStatus(res.ok ? 'ok' : 'fail');
    if (!res.ok) setErrMsg(res.error || 'Connection failed');
    setTimeout(() => setStatus(''), 4000);
  };

  const statusBanner = () => {
    if (status === 'saving')  return { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe', icon:<Settings size={14} style={{ animation:'spin 1s linear infinite' }}/>, text: f('جاري الحفظ...','Saving...') };
    if (status === 'saved')   return { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', icon:<CheckCircle2 size={14}/>, text: f('تم الحفظ بنجاح ✓','Saved successfully ✓') };
    if (status === 'testing') return { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe', icon:<Wifi size={14} style={{ animation:'spin 1s linear infinite' }}/>, text: f('جاري الاختبار...','Testing connection...') };
    if (status === 'ok')      return { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', icon:<CheckCircle2 size={14}/>, text: f('الاتصال ناجح ✓','Connection successful ✓') };
    if (status === 'fail')    return { bg:'#fff1f2', color:'#be123c', border:'#fecdd3', icon:<WifiOff size={14}/>, text: errMsg };
    return null;
  };
  const banner = statusBanner();

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={22} color={PRIMARY}/> {f('إعدادات البريد (SMTP)','Email Settings (SMTP)')}
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          {f('بيانات الإرسال محمية بتشفير النظام','Credentials encrypted via system keychain')}
        </p>
      </div>

      <div style={{ ...GLASS, padding: '1.75rem', maxWidth: 560 }}>
        {/* Presets */}
        <div style={{ marginBottom: 20 }}>
          <label style={fLabel}>{f('إعداد سريع','Quick Preset')}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESETS.map((p, i) => (
              <button key={p.label} onClick={() => applyPreset(i)} style={{
                padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${preset === i ? PRIMARY : 'rgba(226,232,240,0.9)'}`,
                background: preset === i ? `${PRIMARY}12` : 'rgba(255,255,255,0.7)',
                color: preset === i ? PRIMARY : '#64748b', transition: 'all .15s',
              }}>{p.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={fLabel}>SMTP Host</label>
            <input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.gmail.com"
              style={fInput} dir="ltr"/>
          </div>
          <div>
            <label style={fLabel}>Port</label>
            <input type="number" value={port} onChange={e => setPort(e.target.value)}
              style={fInput} dir="ltr"/>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fLabel}>{f('البريد الإلكتروني','Email Address')}</label>
          <input value={user} onChange={e => setUser(e.target.value)}
            placeholder="you@gmail.com" style={fInput} dir="ltr"/>
        </div>

        <div style={{ marginBottom: 20, position: 'relative' }}>
          <label style={fLabel}>{f('كلمة مرور التطبيق','App Password')}</label>
          <input type={showPass ? 'text' : 'password'} value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="xxxx xxxx xxxx xxxx"
            style={{ ...fInput, paddingRight: 40 }} dir="ltr"/>
          <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', bottom: 10, right: 12, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
            {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </div>

        {banner && (
          <div style={{ background: banner.bg, border: `1px solid ${banner.border}`, borderRadius: 10, padding: '9px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: banner.color }}>
            {banner.icon} {banner.text}
          </div>
        )}

        {!isElectron && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '9px 14px', marginBottom: 16, fontSize: 12, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={13}/> {f('يعمل فقط داخل تطبيق Electron','Only functional inside the Electron app')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleTest} disabled={!isElectron || status === 'testing'} style={{
            flex: 1, padding: '11px', borderRadius: 12, border: `1.5px solid ${PRIMARY}55`,
            background: 'rgba(79,70,229,0.06)', color: PRIMARY, fontSize: 14, fontWeight: 700,
            cursor: isElectron ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: "'Inter','Tajawal',sans-serif", transition: 'all .2s',
          }}>
            <Wifi size={16}/> {f('اختبار الاتصال','Test Connection')}
          </button>
          <button onClick={handleSave} disabled={!isElectron || status === 'saving'} style={{
            flex: 1, padding: '11px', borderRadius: 12, border: 'none',
            background: isElectron ? PRIMARY : '#94a3b8', color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: isElectron ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: "'Inter','Tajawal',sans-serif", boxShadow: `0 4px 14px ${PRIMARY}44`, transition: 'all .2s',
          }}>
            <Save size={16}/> {f('حفظ الإعدادات','Save Settings')}
          </button>
        </div>
      </div>
    </div>
  );
}
