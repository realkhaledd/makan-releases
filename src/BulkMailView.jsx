import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Mail, UploadCloud, Send, CheckCircle2, XCircle, AlertCircle, FileText, X } from 'lucide-react';

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

export default function BulkMailView({ lang, f, rtl }) {
  const [recipients, setRecipients] = useState([]);
  const [fileName,   setFileName]   = useState('');
  const [subject,    setSubject]    = useState('');
  const [body,       setBody]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [progress,   setProgress]   = useState(null); // { current, total, email, status }
  const [log,        setLog]        = useState([]);
  const [done,       setDone]       = useState(false);
  const fileRef = useRef(null);

  const isElectron = typeof window !== 'undefined' && !!window.mailAPI;

  // Register IPC progress listener
  useEffect(() => {
    if (!isElectron) return;
    const unsub = window.mailAPI.onProgress(data => {
      setProgress(data);
      setLog(prev => [...prev, data]);
    });
    return unsub;
  }, [isElectron]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb   = XLSX.read(ev.target.result, { type: 'binary' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      setRecipients(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleSend = async () => {
    if (!recipients.length || !subject || !body) return;
    setSending(true);
    setDone(false);
    setLog([]);
    setProgress({ current: 0, total: recipients.length, email: '', status: '' });

    const res = await window.mailAPI.sendBulk({ recipients, subject, body });
    setSending(false);
    setDone(true);
    if (!res.ok) {
      setLog(prev => [...prev, { email: '—', status: 'failed', error: res.error }]);
    }
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mail size={22} color={PRIMARY}/> {f('الإرسال الجماعي بالبريد','Bulk Email Sender')}
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          {f('يدعم {Name} للتخصيص · 2 ثانية بين كل إرسال','Supports {Name} personalisation · 2 s delay between sends')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Left column: file + compose */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* File upload */}
          <div style={{ ...GLASS, padding: '1.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
              {f('رفع قائمة المستلمين (XLSX)','Upload Recipients (XLSX)')}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} id="bulk-xlsx"/>
            <label htmlFor="bulk-xlsx" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: fileName ? `${PRIMARY}08` : 'rgba(255,255,255,0.7)',
              border: `1.5px dashed ${fileName ? PRIMARY : 'rgba(226,232,240,0.9)'}`,
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
              color: fileName ? PRIMARY : '#94a3b8', fontWeight: 700, fontSize: 13,
              fontFamily: "'Inter','Tajawal',sans-serif", transition: 'all .2s',
            }}>
              {fileName ? <FileText size={18}/> : <UploadCloud size={18}/>}
              {fileName || f('اختر ملف Excel...','Choose Excel file...')}
              {fileName && (
                <span onClick={e => { e.preventDefault(); e.stopPropagation(); setFileName(''); setRecipients([]); if (fileRef.current) fileRef.current.value = ''; }}
                  style={{ marginRight: 'auto', marginLeft: 'auto', color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</span>
              )}
            </label>
            {recipients.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} color="#16a34a"/>
                {recipients.length} {f('مستلم جاهز','recipients loaded')}
                {recipients[0] && (
                  <span style={{ color: '#94a3b8' }}>· {f('أعمدة:','cols:')} {Object.keys(recipients[0]).join(', ')}</span>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div style={{ ...GLASS, padding: '1.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
              {f('محتوى الرسالة','Message Content')}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={fLabel}>{f('الموضوع','Subject')}</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder={f('مثال: عرض حصري لـ {Name}','e.g. Exclusive offer for {Name}')}
                style={fInput}/>
            </div>
            <div>
              <label style={fLabel}>{f('نص الرسالة (HTML مدعوم)','Body (HTML supported)')}</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
                placeholder={f('<p>مرحبا {Name}،</p>\n<p>...</p>','<p>Hello {Name},</p>\n<p>...</p>')}
                style={{ ...fInput, resize: 'vertical', height: 'auto', fontFamily: 'monospace', fontSize: 13 }}/>
            </div>
          </div>
        </div>

        {/* Right column: send + progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Send button */}
          <div style={{ ...GLASS, padding: '1.5rem' }}>
            {!isElectron && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '9px 14px', marginBottom: 14, fontSize: 12, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={13}/> {f('يعمل فقط داخل تطبيق Electron','Only functional inside the Electron app')}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              <span>📬 {recipients.length} {f('مستلم','recipients')}</span>
              <span>⏱ ~{Math.ceil(recipients.length * 2 / 60)} {f('دقيقة تقديراً','min est.')}</span>
            </div>
            <button onClick={handleSend}
              disabled={!isElectron || sending || !recipients.length || !subject || !body}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: (isElectron && !sending && recipients.length && subject && body) ? PRIMARY : '#94a3b8',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: (!isElectron || sending || !recipients.length || !subject || !body) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: "'Inter','Tajawal',sans-serif",
                boxShadow: sending ? 'none' : `0 6px 20px ${PRIMARY}44`, transition: 'all .25s',
              }}>
              <Send size={17}/>
              {sending
                ? f(`جاري الإرسال... (${progress?.current || 0}/${progress?.total || 0})`,
                    `Sending... (${progress?.current || 0}/${progress?.total || 0})`)
                : f('ابدأ الإرسال الجماعي','Start Bulk Send')}
            </button>
          </div>

          {/* Progress bar */}
          {progress && (
            <div style={{ ...GLASS, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                  {f('التقدم','Progress')} — {progress.current}/{progress.total}
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: PRIMARY }}>{pct}%</span>
              </div>
              <div style={{ background: 'rgba(241,245,249,0.8)', borderRadius: 20, height: 8, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 20,
                  background: done ? '#16a34a' : `linear-gradient(90deg,${PRIMARY},${PRIMARY}99)`,
                  transition: 'width .4s ease, background .3s',
                  boxShadow: done ? '0 0 8px #16a34a44' : `0 0 8px ${PRIMARY}44`,
                }}/>
              </div>
              {progress.email && (
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {progress.status === 'sent'
                    ? <CheckCircle2 size={13} color="#16a34a"/>
                    : <XCircle size={13} color="#dc2626"/>}
                  {progress.email}
                  <span style={{ fontWeight: 700, color: progress.status === 'sent' ? '#16a34a' : '#dc2626' }}>
                    {progress.status === 'sent' ? f('أُرسلت','sent') : f('فشل','failed')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Log */}
          {log.length > 0 && (
            <div style={{ ...GLASS, padding: '1.25rem', maxHeight: 320, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                {f('سجل الإرسال','Send Log')}
              </div>
              {log.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(226,232,240,0.5)', fontSize: 12 }}>
                  {l.status === 'sent'
                    ? <CheckCircle2 size={12} color="#16a34a"/>
                    : <XCircle size={12} color="#dc2626"/>}
                  <span style={{ flex: 1, color: '#475569', fontFamily: 'monospace' }}>{l.email}</span>
                  <span style={{ fontWeight: 700, fontSize: 11, color: l.status === 'sent' ? '#16a34a' : '#dc2626' }}>
                    {l.status === 'sent' ? '✓' : '✗'}
                  </span>
                </div>
              ))}
              {done && (
                <div style={{ marginTop: 10, fontWeight: 800, color: '#16a34a', fontSize: 13, textAlign: 'center' }}>
                  {f('اكتمل الإرسال ✓','Bulk send complete ✓')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
