import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart2, Calendar, MessageCircle, Megaphone,
  Settings, CheckCircle, XCircle, AlertCircle, Plus,
  Trash2, RefreshCw, TrendingUp, Printer, Link,
  Eye, Users, Loader, Send,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { db } from './firebase.js';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { AGENCY_ID } from './App.jsx';

const agCol = (name)     => collection(db, 'agencies', AGENCY_ID, name);
const agDoc = (name, id) => doc(db,         'agencies', AGENCY_ID, name, id);

/* ── Styles ── */
const card = (extra={}) => ({ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'16px 18px', ...extra });
const inp = (extra={}) => ({ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#e8eeff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', ...extra });
const btn = (bg='rgba(122,160,255,0.15)', color='#7aa0ff', extra={}) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:`1px solid ${color}30`, background:bg, color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', ...extra });
const lbl = { fontSize:10, fontWeight:700, color:'#9aabcc', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 };

const IG_BASE = 'https://graph.facebook.com/v19.0';
const fmtNum = n => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n||0);

/* ── Print helper ── */
function printSection(id, title) {
  const el = document.getElementById(id);
  if (!el) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html dir="rtl"><head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Cairo',sans-serif;background:#fff;color:#111;padding:28px 32px;direction:rtl}
      h1{font-size:22px;font-weight:800;margin-bottom:6px;color:#1a1a2e}
      .sub{font-size:12px;color:#666;margin-bottom:24px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
      .kpi{border:1px solid #e5e7eb;border-radius:10px;padding:14px;text-align:center}
      .kpi-val{font-size:22px;font-weight:800;color:#1a3aff}
      .kpi-lbl{font-size:11px;color:#666;margin-top:4px}
      .section{margin-bottom:20px}
      .section-title{font-size:14px;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e5e7eb}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f3f4f6;padding:8px 10px;font-weight:700;text-align:right;border:1px solid #e5e7eb}
      td{padding:8px 10px;border:1px solid #e5e7eb}
      tr:nth-child(even) td{background:#f9fafb}
      .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
      .active{background:#d1fae5;color:#065f46}
      .paused{background:#fef3c7;color:#92400e}
      .post-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .post-card{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
      .post-card img{width:100%;height:100px;object-fit:cover}
      .post-card-body{padding:6px 8px;font-size:11px;color:#444}
      .footer{margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:10px;color:#999;text-align:center}
      @media print{body{padding:16px}}
    </style>
    </head><body>
    <h1>${title}</h1>
    <div class="sub">تاريخ التقرير: ${new Date().toLocaleDateString('ar-AE',{year:'numeric',month:'long',day:'numeric'})} — مَكَان Property OS</div>
    ${el.getAttribute('data-print-html')}
    <div class="footer">تم إنشاء هذا التقرير بواسطة مَكَان Property OS · ${new Date().toLocaleString('ar-AE')}</div>
    </body></html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); }, 600);
}

/* ── API helpers ── */
async function igGet(path, token, params={}) {
  const p = new URLSearchParams({ access_token: token, ...params });
  const r = await fetch(`${IG_BASE}/${path}?${p}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d;
}
async function igPost(path, token, body={}) {
  const r = await fetch(`${IG_BASE}/${path}`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ access_token: token, ...body }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d;
}

/* ══════════════════════════════════════════════════════════════════════════════
   SETUP TAB
══════════════════════════════════════════════════════════════════════════════ */
function SetupTab({ cfg, onSave, f }) {
  const [form,    setForm]    = useState({ token:'', igUserId:'', ...cfg });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const testConnection = async () => {
    if (!form.token || !form.igUserId) return setError(f('أدخل التوكن ومعرف الحساب','Enter token and account ID'));
    setLoading(true); setError('');
    try {
      const data = await igGet(form.igUserId, form.token, { fields:'name,username,profile_picture_url,followers_count,media_count,biography' });
      setProfile(data);
      onSave({ ...form, connected: true, username: data.username });
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:600 }}>
      <div style={card()}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:14 }}>
          {f('ربط حساب Instagram','Connect Instagram Account')}
        </div>

        {/* Instructions */}
        <div style={{ background:'rgba(122,160,255,0.06)', border:'1px solid rgba(122,160,255,0.15)', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:12, color:'#9aabcc', lineHeight:1.8 }}>
          <div style={{ fontWeight:700, color:'#7aa0ff', marginBottom:6 }}>{f('كيف تحصل على التوكن؟','How to get your token?')}</div>
          <div>1. {f('روح لـ','Go to')} <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" style={{ color:'#7aa0ff' }}>Facebook Developers</a></div>
          <div>2. {f('أنشئ App من نوع Business','Create a Business App')}</div>
          <div>3. {f('أضف Instagram Graph API','Add Instagram Graph API product')}</div>
          <div>4. {f('اطلب صلاحيات:','Request permissions:')} <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:4, fontSize:11 }}>instagram_basic, instagram_content_publish, instagram_manage_comments, instagram_manage_insights</code></div>
          <div>5. {f('احصل على Long-lived User Token','Get a Long-lived User Access Token')}</div>
          <div>6. {f('معرف الحساب: اذهب لـ Graph API Explorer واكتب','Account ID: Go to Graph API Explorer and type')} <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:4, fontSize:11 }}>GET /me/accounts</code></div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={lbl}>{f('Access Token','Access Token')}</label>
            <input value={form.token} onChange={e=>setForm(p=>({...p,token:e.target.value}))} placeholder="EAABwz..." style={inp()} type="password"/>
          </div>
          <div>
            <label style={lbl}>{f('Instagram User ID (معرف الحساب)','Instagram User ID')}</label>
            <input value={form.igUserId} onChange={e=>setForm(p=>({...p,igUserId:e.target.value}))} placeholder="17841400000000000" style={inp()} dir="ltr"/>
          </div>
          {error && <div style={{ color:'#ff4444', fontSize:12, padding:'8px 12px', background:'rgba(255,68,68,0.08)', borderRadius:8, border:'1px solid rgba(255,68,68,0.2)' }}>{error}</div>}
          <button onClick={testConnection} disabled={loading} style={{ ...btn('rgba(0,230,118,0.1)','#00e676'), justifyContent:'center', opacity:loading?0.6:1 }}>
            {loading ? <Loader size={13} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle size={13}/>}
            {f('اختبر الاتصال وحفظ','Test Connection & Save')}
          </button>
        </div>
      </div>

      {/* Profile preview */}
      {(profile || cfg.connected) && (
        <div style={{ ...card(), display:'flex', alignItems:'center', gap:14 }}>
          {profile?.profile_picture_url && <img src={profile.profile_picture_url} alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover' }}/>}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#e8eeff' }}>@{profile?.username || cfg.username}</div>
            <div style={{ fontSize:12, color:'#9aabcc', marginTop:2 }}>{profile?.biography || ''}</div>
          </div>
          {profile && (
            <div style={{ display:'flex', gap:16, textAlign:'center' }}>
              {[{v:profile.followers_count,l:f('متابع','Followers')},{v:profile.media_count,l:f('منشور','Posts')}].map(({v,l})=>(
                <div key={l}><div style={{ fontSize:16, fontWeight:800, color:'#00e676' }}>{fmtNum(v)}</div><div style={{ fontSize:10, color:'#9aabcc' }}>{l}</div></div>
              ))}
            </div>
          )}
          <div style={{ width:10, height:10, borderRadius:'50%', background: cfg.connected?'#00e676':'#ff4444', flexShrink:0 }}/>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CONTENT TAB — Schedule & Publish Posts / Stories
══════════════════════════════════════════════════════════════════════════════ */
function ContentTab({ cfg, f }) {
  const COLL = 'marketing_scheduled';
  const [posts,     setPosts]     = useState([]);
  const [form,      setForm]      = useState({ mediaUrl:'', caption:'', mediaType:'IMAGE', scheduleDate:'', scheduleTime:'', isStory:false });
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState('');
  const intervalRef = useRef(null);

  /* Load scheduled posts from Firestore */
  useEffect(() => {
    if (!db) return;
    const q = agCol(COLL);
    const unsub = onSnapshot(q, snap => setPosts(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.scheduledAt-b.scheduledAt)));
    return unsub;
  }, []);

  /* Polling: publish due posts */
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      if (!cfg.token || !cfg.igUserId) return;
      const now = Date.now();
      const due = posts.filter(p => p.status === 'scheduled' && p.scheduledAt <= now);
      for (const post of due) {
        try {
          await publishNow(post.mediaUrl, post.caption, post.isStory, post.id);
        } catch {}
      }
    }, 60000);
    return () => clearInterval(intervalRef.current);
  }, [posts, cfg]);

  const publishNow = async (mediaUrl, caption, isStory, docId) => {
    if (!cfg.token || !cfg.igUserId) throw new Error('Not connected');
    const containerBody = { image_url: mediaUrl, caption };
    if (isStory) containerBody.media_type = 'STORIES';
    const { id: creationId } = await igPost(`${cfg.igUserId}/media`, cfg.token, containerBody);
    await igPost(`${cfg.igUserId}/media_publish`, cfg.token, { creation_id: creationId });
    if (docId && db) await setDoc(agDoc(COLL, docId), { status:'published', publishedAt: Date.now() }, { merge:true });
    return creationId;
  };

  const schedule = async () => {
    if (!form.mediaUrl) return setStatus(f('أدخل رابط الصورة أو الفيديو','Enter media URL'));
    setLoading(true); setStatus('');
    try {
      const schedAt = form.scheduleDate
        ? new Date(`${form.scheduleDate}T${form.scheduleTime||'12:00'}`).getTime()
        : null;

      if (!schedAt || schedAt <= Date.now()) {
        // Publish immediately
        await publishNow(form.mediaUrl, form.caption, form.isStory, null);
        setStatus('✅ ' + f('تم النشر بنجاح','Published successfully'));
      } else {
        // Schedule for later
        if (db) {
          const id = `post_${Date.now()}`;
          await setDoc(agDoc(COLL, id), { ...form, scheduledAt: schedAt, status:'scheduled', createdAt: Date.now() });
        }
        setStatus('🗓 ' + f('تم جدولة المنشور','Post scheduled'));
      }
      setForm({ mediaUrl:'', caption:'', mediaType:'IMAGE', scheduleDate:'', scheduleTime:'', isStory:false });
    } catch(e) { setStatus('❌ ' + e.message); }
    setLoading(false);
  };

  const deletePost = async (id) => {
    if (db) await deleteDoc(agDoc(COLL, id));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {!cfg.connected && <NotConnected f={f}/>}

      {/* Create post */}
      <div style={card()}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:14 }}>{f('إنشاء منشور / ستوري','Create Post / Story')}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <label style={lbl}>{f('رابط الصورة أو الفيديو (URL عام)','Media URL (public link)')}</label>
            <input value={form.mediaUrl} onChange={e=>setForm(p=>({...p,mediaUrl:e.target.value}))} placeholder="https://..." style={inp()} dir="ltr"/>
            <div style={{ fontSize:10, color:'#3e4f72', marginTop:4 }}>{f('يجب أن يكون رابط عام يمكن لـ Instagram الوصول إليه','Must be a publicly accessible URL for Instagram')}</div>
          </div>
          <div>
            <label style={lbl}>{f('النص / الكابشن','Caption')}</label>
            <textarea value={form.caption} onChange={e=>setForm(p=>({...p,caption:e.target.value}))} placeholder={f('اكتب نص المنشور هنا...','Write your caption here...')} style={{ ...inp(), height:90, resize:'vertical' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div>
              <label style={lbl}>{f('تاريخ النشر','Publish Date')}</label>
              <input type="date" value={form.scheduleDate} onChange={e=>setForm(p=>({...p,scheduleDate:e.target.value}))} style={inp()} dir="ltr"/>
            </div>
            <div>
              <label style={lbl}>{f('وقت النشر','Publish Time')}</label>
              <input type="time" value={form.scheduleTime} onChange={e=>setForm(p=>({...p,scheduleTime:e.target.value}))} style={inp()} dir="ltr"/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <label style={{ ...lbl, marginBottom:10 }}>{f('نوع المحتوى','Content Type')}</label>
              <div style={{ display:'flex', gap:8 }}>
                {[{v:false,l:f('بوست','Post')},{v:true,l:f('ستوري','Story')}].map(({v,l})=>(
                  <button key={String(v)} onClick={()=>setForm(p=>({...p,isStory:v}))}
                    style={{ ...btn(form.isStory===v?'rgba(225,48,108,0.15)':'rgba(255,255,255,0.04)', form.isStory===v?'#e1306c':'#9aabcc'), flex:1, justifyContent:'center', fontSize:11 }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {status && <div style={{ fontSize:12, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)', color:'#9aabcc' }}>{status}</div>}

          <button onClick={schedule} disabled={loading || !cfg.connected} style={{ ...btn('rgba(225,48,108,0.15)','#e1306c',{justifyContent:'center'}), opacity:loading||!cfg.connected?0.5:1 }}>
            {loading ? <Loader size={13}/> : <Send size={13}/>}
            {form.scheduleDate && new Date(`${form.scheduleDate}T${form.scheduleTime||'12:00'}`).getTime() > Date.now()
              ? f('جدولة المنشور','Schedule Post')
              : f('نشر الآن','Publish Now')}
          </button>
        </div>
      </div>

      {/* Scheduled posts */}
      {posts.length > 0 && (
        <div style={card()}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:12 }}>{f('المنشورات المجدولة','Scheduled Posts')} ({posts.filter(p=>p.status==='scheduled').length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {posts.map(p => (
              <div key={p.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                {p.mediaUrl && <img src={p.mediaUrl} alt="" style={{ width:48, height:48, borderRadius:8, objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'}/>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:'#e8eeff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.caption || f('بدون نص','No caption')}</div>
                  <div style={{ fontSize:11, color:'#9aabcc', marginTop:3, display:'flex', gap:8 }}>
                    <span>{p.isStory ? f('ستوري','Story') : f('بوست','Post')}</span>
                    {p.scheduledAt && <span>🗓 {new Date(p.scheduledAt).toLocaleString('ar-AE',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, padding:'3px 8px', borderRadius:20, fontWeight:700,
                    background: p.status==='published'?'rgba(0,230,118,0.1)':'rgba(245,166,35,0.1)',
                    color: p.status==='published'?'#00e676':'#f5a623' }}>
                    {p.status==='published' ? f('منشور','Published') : f('مجدول','Scheduled')}
                  </span>
                  {p.status==='scheduled' && (
                    <button onClick={()=>deletePost(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff4444', padding:4 }}>
                      <Trash2 size={12}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMMENTS TAB — Auto-reply rules + comment management
══════════════════════════════════════════════════════════════════════════════ */
function CommentsTab({ cfg, f }) {
  const RULES_KEY = 'makan_ig_reply_rules';
  const SEEN_KEY  = 'makan_ig_seen_comments';
  const [rules,     setRules]     = useState(() => { try { return JSON.parse(localStorage.getItem(RULES_KEY)||'[]'); } catch { return []; } });
  const [newKw,      setNewKw]     = useState('');
  const [newReply,   setNewReply]  = useState('');
  const [newPostUrl, setNewPostUrl]= useState('');
  const [autoOn,    setAutoOn]    = useState(() => localStorage.getItem('makan_ig_auto_reply') === 'true');
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const intervalRef = useRef(null);

  const saveRules = (r) => { setRules(r); localStorage.setItem(RULES_KEY, JSON.stringify(r)); };
  const toggleAuto = (v) => { setAutoOn(v); localStorage.setItem('makan_ig_auto_reply', String(v)); };

  const addRule = () => {
    if (!newKw.trim() || !newReply.trim()) return;
    saveRules([...rules, { id: Date.now(), keyword: newKw.trim(), reply: newReply.trim(), postUrl: newPostUrl.trim(), enabled: true, hits: 0 }]);
    setNewKw(''); setNewReply(''); setNewPostUrl('');
  };

  /* Fetch recent comments */
  const fetchComments = useCallback(async () => {
    if (!cfg.token || !cfg.igUserId) return;
    setLoading(true);
    try {
      const { data: media } = await igGet(`${cfg.igUserId}/media`, cfg.token, { fields:'id,caption,timestamp,comments_count', limit:5 });
      const all = [];
      for (const m of (media||[]).slice(0,3)) {
        try {
          const { data: cmts } = await igGet(`${m.id}/comments`, cfg.token, { fields:'id,text,username,timestamp' });
          all.push(...(cmts||[]).map(c=>({ ...c, mediaId: m.id, mediaCaption: m.caption })));
        } catch {}
      }
      all.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      setComments(all.slice(0,30));
      setLastCheck(new Date());

      /* Auto-reply */
      if (autoOn && rules.length) {
        const seen = JSON.parse(localStorage.getItem(SEEN_KEY)||'[]');
        const newCmts = all.filter(c => !seen.includes(c.id));
        for (const cmt of newCmts) {
          const match = rules.find(r => r.enabled && cmt.text.toLowerCase().includes(r.keyword.toLowerCase()));
          if (match) {
            try {
              const replyMsg = match.postUrl ? `${match.reply}\n${match.postUrl}` : match.reply;
              await igPost(`${cmt.id}/replies`, cfg.token, { message: replyMsg });
              match.hits = (match.hits||0) + 1;
              saveRules([...rules]);
            } catch {}
          }
          seen.push(cmt.id);
        }
        localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-500)));
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [cfg, autoOn, rules]);

  useEffect(() => {
    fetchComments();
    intervalRef.current = setInterval(fetchComments, 5 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [fetchComments]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {!cfg.connected && <NotConnected f={f}/>}

      {/* Auto-reply toggle + rules */}
      <div style={card()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>{f('الرد التلقائي على الكومنتات','Auto-Reply to Comments')}</div>
            <div style={{ fontSize:11, color:'#9aabcc', marginTop:2 }}>{f('بيشيك كل 5 دقايق على كومنتات جديدة','Checks every 5 minutes for new comments')}</div>
          </div>
          <div onClick={()=>toggleAuto(!autoOn)} style={{ width:44, height:24, borderRadius:12, background:autoOn?'#00e676':'rgba(255,255,255,0.1)', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:3, left:autoOn?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
          </div>
        </div>

        {/* Add rule */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input value={newKw} onChange={e=>setNewKw(e.target.value)} placeholder={f('كلمة مفتاحية (مثال: سعر)','Keyword (e.g. price)')} style={inp({fontSize:12})}/>
            <input value={newReply} onChange={e=>setNewReply(e.target.value)} placeholder={f('نص الرد التلقائي','Auto reply text')} style={inp({fontSize:12})}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
            <input value={newPostUrl} onChange={e=>setNewPostUrl(e.target.value)} placeholder={f('رابط البوست أو الستوري (اختياري) — يتضاف للرد تلقائياً','Post or Story URL (optional) — appended to reply automatically')} style={inp({fontSize:12})} dir="ltr"/>
            <button onClick={addRule} style={btn('rgba(0,230,118,0.1)','#00e676',{padding:'8px 14px'})}><Plus size={13}/> {f('أضف','Add')}</button>
          </div>
        </div>

        {rules.length === 0 ? (
          <div style={{ textAlign:'center', color:'#3e4f72', fontSize:12, padding:'12px 0' }}>{f('لا توجد قواعد — أضف كلمة مفتاحية وردًا','No rules yet — add a keyword and reply')}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {rules.map(r => (
              <div key={r.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flex:1, fontSize:12, color:'#e8eeff', minWidth:0 }}>
                  <div><span style={{ color:'#7aa0ff', fontWeight:700 }}>"{r.keyword}"</span><span style={{ color:'#9aabcc', margin:'0 6px' }}>→</span><span>{r.reply}</span></div>
                  {r.postUrl && <div style={{ fontSize:10, color:'#e1306c', marginTop:3, display:'flex', alignItems:'center', gap:4, overflow:'hidden' }}><Link size={9}/><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', direction:'ltr' }}>{r.postUrl}</span></div>}
                </div>
                <span style={{ fontSize:10, color:'#9aabcc' }}>{r.hits||0} {f('رد','replies')}</span>
                <button onClick={()=>saveRules(rules.map(x=>x.id===r.id?{...x,enabled:!x.enabled}:x))}
                  style={{ background:'none', border:'none', cursor:'pointer', color:r.enabled?'#00e676':'#3e4f72', padding:2 }}>
                  {r.enabled ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                </button>
                <button onClick={()=>saveRules(rules.filter(x=>x.id!==r.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff4444', padding:2 }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments feed */}
      <div style={card()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>{f('الكومنتات الأخيرة','Recent Comments')} ({comments.length})</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {lastCheck && <span style={{ fontSize:10, color:'#3e4f72' }}>{lastCheck.toLocaleTimeString('ar-AE',{hour:'2-digit',minute:'2-digit'})}</span>}
            <button onClick={fetchComments} disabled={loading} style={btn('rgba(255,255,255,0.04)','#9aabcc',{padding:'5px 10px',fontSize:11})}>
              {loading ? <Loader size={11}/> : <RefreshCw size={11}/>} {f('تحديث','Refresh')}
            </button>
          </div>
        </div>
        {comments.length === 0 ? (
          <div style={{ textAlign:'center', color:'#3e4f72', fontSize:12, padding:'20px 0' }}>
            {loading ? f('جاري التحميل…','Loading…') : f('لا توجد كومنتات','No comments found')}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:380, overflowY:'auto' }}>
            {comments.map(c => (
              <div key={c.id} style={{ padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#7aa0ff' }}>@{c.username}</span>
                  <span style={{ fontSize:10, color:'#3e4f72' }}>{new Date(c.timestamp).toLocaleDateString('ar-AE')}</span>
                </div>
                <div style={{ fontSize:13, color:'#e8eeff' }}>{c.text}</div>
                {c.mediaCaption && <div style={{ fontSize:10, color:'#3e4f72', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📄 {c.mediaCaption?.slice(0,60)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   INSIGHTS TAB — Platform performance reports
══════════════════════════════════════════════════════════════════════════════ */
function InsightsTab({ cfg, f }) {
  const [data,    setData]    = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [period,  setPeriod]  = useState('day');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const printRef = useRef(null);

  const load = async () => {
    if (!cfg.token || !cfg.igUserId) return;
    setLoading(true); setError('');
    try {
      const [ins, med] = await Promise.all([
        igGet(`${cfg.igUserId}/insights`, cfg.token, {
          metric:'impressions,reach,profile_views,follower_count',
          period,
          since: Math.floor(Date.now()/1000) - (period==='day'?7:30)*86400,
          until: Math.floor(Date.now()/1000),
        }),
        igGet(`${cfg.igUserId}/media`, cfg.token, {
          fields:'id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url',
          limit:12,
        }),
      ]);
      setData(ins.data || []);
      setPosts(med.data || []);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [cfg, period]);

  const getMetric = (name) => {
    const m = data?.find(d=>d.name===name);
    return m?.values?.reduce((s,v)=>s+(v.value||0),0) || 0;
  };

  const doPrint = () => {
    const metrics = [
      { name:'impressions',   lbl:f('المشاهدات','Impressions') },
      { name:'reach',         lbl:f('الوصول','Reach') },
      { name:'profile_views', lbl:f('زيارات الملف','Profile Views') },
      { name:'follower_count',lbl:f('المتابعون','Followers') },
    ];
    const kpiHtml = `<div class="grid">${metrics.map(m=>`<div class="kpi"><div class="kpi-val">${fmtNum(getMetric(m.name))}</div><div class="kpi-lbl">${m.lbl}</div></div>`).join('')}</div>`;
    const postsHtml = posts.length ? `<div class="section"><div class="section-title">${f('أداء المنشورات','Post Performance')}</div><table><thead><tr><th>${f('النص','Caption')}</th><th>${f('الإعجابات','Likes')}</th><th>${f('الكومنتات','Comments')}</th><th>${f('التاريخ','Date')}</th></tr></thead><tbody>${posts.map(p=>`<tr><td>${p.caption?.slice(0,50)||'—'}</td><td>${fmtNum(p.like_count||0)}</td><td>${fmtNum(p.comments_count||0)}</td><td>${new Date(p.timestamp).toLocaleDateString('ar-AE')}</td></tr>`).join('')}</tbody></table></div>` : '';
    const html = kpiHtml + postsHtml;
    printRef.current?.setAttribute('data-print-html', html);
    printSection('insights-print-target', f('تقرير أداء المنصات','Platform Performance Report'));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div id="insights-print-target" ref={printRef} style={{display:'none'}}/>
      {!cfg.connected && <NotConnected f={f}/>}

      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        {[{v:'day',l:f('آخر 7 أيام','Last 7 Days')},{v:'week',l:f('آخر شهر','Last Month')}].map(({v,l})=>(
          <button key={v} onClick={()=>setPeriod(v)} style={btn(period===v?'rgba(122,160,255,0.15)':'rgba(255,255,255,0.04)', period===v?'#7aa0ff':'#9aabcc',{border:period===v?'1px solid rgba(122,160,255,0.3)':'1px solid rgba(255,255,255,0.06)'})}>
            {l}
          </button>
        ))}
        <button onClick={load} disabled={loading} style={btn('rgba(255,255,255,0.04)','#9aabcc',{padding:'7px 12px'})}>
          {loading ? <Loader size={12}/> : <RefreshCw size={12}/>}
        </button>
        {data && <button onClick={doPrint} style={btn('rgba(122,160,255,0.1)','#7aa0ff',{padding:'7px 12px',marginInlineStart:'auto'})}>
          <Printer size={13}/> {f('طباعة التقرير','Print Report')}
        </button>}
      </div>

      {error && <div style={{ color:'#ff4444', fontSize:12, padding:'8px 12px', background:'rgba(255,68,68,0.08)', borderRadius:8 }}>{error}</div>}

      {/* Metrics */}
      {data && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
          {[
            { name:'impressions',   lbl:f('المشاهدات','Impressions'),   color:'#7aa0ff', icon:<Eye size={16}/> },
            { name:'reach',         lbl:f('الوصول','Reach'),             color:'#00d4ff', icon:<Users size={16}/> },
            { name:'profile_views', lbl:f('زيارات الملف','Profile Views'), color:'#f5a623', icon:<TrendingUp size={16}/> },
            { name:'follower_count',lbl:f('المتابعون','Followers'),      color:'#00e676', icon:<Users size={16}/> },
          ].map(({name,lbl:l,color,icon})=>(
            <div key={name} style={{ ...card(), textAlign:'center', background:`${color}08`, border:`1px solid ${color}20` }}>
              <div style={{ color, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:22, fontWeight:800, color, direction:'ltr' }}>{fmtNum(getMetric(name))}</div>
              <div style={{ fontSize:11, color:'#9aabcc', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top posts */}
      {posts.length > 0 && (
        <div style={card()}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:12 }}>{f('أداء المنشورات','Post Performance')}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {posts.map(p => (
              <div key={p.id} style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)' }}>
                {(p.media_url || p.thumbnail_url) && (
                  <img src={p.thumbnail_url||p.media_url} alt="" style={{ width:'100%', height:100, objectFit:'cover', display:'block' }}/>
                )}
                <div style={{ padding:'8px 10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#9aabcc' }}>
                    <span>❤️ {fmtNum(p.like_count||0)}</span>
                    <span>💬 {fmtNum(p.comments_count||0)}</span>
                  </div>
                  <div style={{ fontSize:10, color:'#3e4f72', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.caption?.slice(0,40) || '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CAMPAIGNS TAB — Meta Ads performance
══════════════════════════════════════════════════════════════════════════════ */
function CampaignsTab({ cfg, f }) {
  const [adAccountId, setAdAccountId] = useState(() => localStorage.getItem('makan_ad_account')||'');
  const [campaigns,   setCampaigns]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [expanded,    setExpanded]    = useState(null);
  const [editAccount, setEditAccount] = useState(false);
  const printRef = useRef(null);

  const load = async () => {
    if (!cfg.token || !adAccountId) return;
    setLoading(true); setError('');
    try {
      const { data } = await igGet(`act_${adAccountId}/campaigns`, cfg.token, {
        fields:'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights{impressions,reach,clicks,spend,cpc,cpm,cpp,ctr}',
        limit:20,
      });
      setCampaigns(data || []);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { if (adAccountId && cfg.token) load(); }, [adAccountId, cfg.token]);

  const fmtAED = n => `${parseFloat(n||0).toLocaleString('en-AE',{maximumFractionDigits:0})} AED`;
  const ins = (c) => c.insights?.data?.[0] || {};

  const doPrint = () => {
    const totalSpend = campaigns.reduce((s,c)=>s+parseFloat(ins(c).spend||0),0);
    const totalReach = campaigns.reduce((s,c)=>s+parseInt(ins(c).reach||0),0);
    const totalClicks = campaigns.reduce((s,c)=>s+parseInt(ins(c).clicks||0),0);
    const summaryHtml = `<div class="grid"><div class="kpi"><div class="kpi-val">${campaigns.length}</div><div class="kpi-lbl">${f('الحملات','Campaigns')}</div></div><div class="kpi"><div class="kpi-val">${fmtAED(totalSpend)}</div><div class="kpi-lbl">${f('الإجمالي المصروف','Total Spend')}</div></div><div class="kpi"><div class="kpi-val">${fmtNum(totalReach)}</div><div class="kpi-lbl">${f('الوصول الكلي','Total Reach')}</div></div><div class="kpi"><div class="kpi-val">${fmtNum(totalClicks)}</div><div class="kpi-lbl">${f('الكليكات','Clicks')}</div></div></div>`;
    const tableHtml = `<div class="section"><div class="section-title">${f('تفاصيل الحملات','Campaign Details')}</div><table><thead><tr><th>${f('اسم الحملة','Campaign Name')}</th><th>${f('الحالة','Status')}</th><th>${f('المصروف','Spend')}</th><th>${f('الوصول','Reach')}</th><th>${f('الكليكات','Clicks')}</th><th>CPM</th><th>CPC</th><th>CTR</th></tr></thead><tbody>${campaigns.map(c=>{const i=ins(c);return`<tr><td>${c.name}</td><td><span class="badge ${c.status==='ACTIVE'?'active':'paused'}">${c.status}</span></td><td>${fmtAED(i.spend)}</td><td>${fmtNum(i.reach)}</td><td>${fmtNum(i.clicks)}</td><td>${fmtAED(i.cpm)}</td><td>${fmtAED(i.cpc)}</td><td>${parseFloat(i.ctr||0).toFixed(2)}%</td></tr>`;}).join('')}</tbody></table></div>`;
    const html = summaryHtml + tableHtml;
    printRef.current?.setAttribute('data-print-html', html);
    printSection('campaigns-print-target', f('تقرير الحملات الإعلانية','Ad Campaigns Report'));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div id="campaigns-print-target" ref={printRef} style={{display:'none'}}/>
      {!cfg.connected && <NotConnected f={f}/>}

      {/* Ad Account setup */}
      <div style={{ ...card(), display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        {editAccount || !adAccountId ? (
          <>
            <div style={{ flex:1, minWidth:200 }}>
              <label style={lbl}>{f('معرف حساب الإعلانات','Ad Account ID')}</label>
              <input value={adAccountId} onChange={e=>setAdAccountId(e.target.value)} placeholder="123456789" style={inp({fontSize:12})} dir="ltr"/>
            </div>
            <button onClick={()=>{ localStorage.setItem('makan_ad_account',adAccountId); setEditAccount(false); load(); }}
              style={{ ...btn('rgba(0,230,118,0.1)','#00e676'), marginTop:20 }}>
              <CheckCircle size={13}/> {f('حفظ','Save')}
            </button>
          </>
        ) : (
          <>
            <div style={{ flex:1, fontSize:13, color:'#9aabcc' }}>{f('حساب الإعلانات:','Ad Account:')} <span style={{ color:'#e8eeff', fontWeight:700 }}>act_{adAccountId}</span></div>
            <button onClick={()=>setEditAccount(true)} style={btn('rgba(255,255,255,0.04)','#9aabcc',{padding:'5px 10px',fontSize:11})}><Settings size={11}/></button>
            <button onClick={load} disabled={loading} style={btn('rgba(255,255,255,0.04)','#9aabcc',{padding:'5px 10px',fontSize:11})}>
              {loading?<Loader size={11}/>:<RefreshCw size={11}/>}
            </button>
          </>
        )}
      </div>

      {error && <div style={{ color:'#ff4444', fontSize:12, padding:'8px 12px', background:'rgba(255,68,68,0.08)', borderRadius:8 }}>{error}</div>}

      {/* Summary bar */}
      {campaigns.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10 }}>
          {[
            { lbl:f('الحملات','Campaigns'),   val: campaigns.length,                                          color:'#7aa0ff' },
            { lbl:f('الإجمالي المصروف','Total Spend'), val: fmtAED(campaigns.reduce((s,c)=>s+parseFloat(ins(c).spend||0),0)), color:'#f5a623' },
            { lbl:f('الوصول الكلي','Total Reach'),     val: fmtNum(campaigns.reduce((s,c)=>s+parseInt(ins(c).reach||0),0)),  color:'#00d4ff' },
            { lbl:f('الكليكات الكلية','Total Clicks'),  val: fmtNum(campaigns.reduce((s,c)=>s+parseInt(ins(c).clicks||0),0)), color:'#00e676' },
          ].map(({lbl:l,val,color})=>(
            <div key={l} style={{ ...card(), textAlign:'center', background:`${color}08`, border:`1px solid ${color}20` }}>
              <div style={{ fontSize:18, fontWeight:800, color, direction:'ltr' }}>{val}</div>
              <div style={{ fontSize:10, color:'#9aabcc', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Campaigns list */}
      {campaigns.length > 0 && (
        <div style={card()}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>{f('الحملات الإعلانية','Ad Campaigns')}</div>
          <button onClick={doPrint} style={btn('rgba(122,160,255,0.1)','#7aa0ff',{padding:'6px 12px',fontSize:11})}>
            <Printer size={12}/> {f('طباعة','Print')}
          </button>
        </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {campaigns.map(c => {
              const i = ins(c);
              const isExp = expanded === c.id;
              return (
                <div key={c.id} style={{ borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
                  <div onClick={()=>setExpanded(isExp?null:c.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer', background:'rgba(255,255,255,0.03)' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                      background: c.status==='ACTIVE'?'#00e676':c.status==='PAUSED'?'#f5a623':'#ff4444' }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>{c.name}</div>
                      <div style={{ fontSize:11, color:'#9aabcc', marginTop:2 }}>{c.objective} · {c.status}</div>
                    </div>
                    <div style={{ textAlign:'end' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#f5a623', direction:'ltr' }}>{fmtAED(i.spend)}</div>
                      <div style={{ fontSize:10, color:'#9aabcc' }}>{f('مصروف','spent')}</div>
                    </div>
                    {isExp ? <ChevronUp size={14} color="#9aabcc"/> : <ChevronDown size={14} color="#9aabcc"/>}
                  </div>
                  {isExp && (
                    <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:10 }}>
                      {[
                        { l:f('المشاهدات','Impressions'), v:fmtNum(i.impressions), c:'#7aa0ff' },
                        { l:f('الوصول','Reach'),          v:fmtNum(i.reach),       c:'#00d4ff' },
                        { l:f('الكليكات','Clicks'),        v:fmtNum(i.clicks),      c:'#00e676' },
                        { l:'CPM',                         v:fmtAED(i.cpm),         c:'#f5a623' },
                        { l:'CPC',                         v:fmtAED(i.cpc),         c:'#f5a623' },
                        { l:'CTR',                         v:`${parseFloat(i.ctr||0).toFixed(2)}%`, c:'#9aabcc' },
                      ].map(({l,v,c})=>(
                        <div key={l} style={{ textAlign:'center', padding:'8px 6px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:c, direction:'ltr' }}>{v}</div>
                          <div style={{ fontSize:10, color:'#9aabcc', marginTop:2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {campaigns.length === 0 && !loading && adAccountId && (
        <div style={{ textAlign:'center', color:'#3e4f72', fontSize:13, padding:'28px 0' }}>{f('لا توجد حملات أو تحقق من معرف الحساب','No campaigns found — verify your ad account ID')}</div>
      )}
    </div>
  );
}

/* ── Helper component ── */
function NotConnected({ f }) {
  return (
    <div style={{ ...card(), background:'rgba(245,166,35,0.05)', border:'1px solid rgba(245,166,35,0.2)', display:'flex', gap:10, alignItems:'center' }}>
      <AlertCircle size={16} color="#f5a623"/>
      <span style={{ fontSize:12, color:'#f5a623', fontWeight:600 }}>{f('الحساب غير مربوط — اذهب لتبويب الإعداد أولاً','Account not connected — go to Setup tab first')}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN MarketingView
══════════════════════════════════════════════════════════════════════════════ */
export default function MarketingView({ lang, f, rtl }) {
  const CFG_KEY = 'makan_ig_config';
  const [cfg,    setCfg]    = useState(() => { try { return JSON.parse(localStorage.getItem(CFG_KEY)||'{}'); } catch { return {}; } });
  const [active, setActive] = useState('setup');

  const saveCfg = (c) => { setCfg(c); localStorage.setItem(CFG_KEY, JSON.stringify(c)); };

  const tabs = [
    { id:'setup',     icon:<Settings size={14}/>,       ar:'الإعداد',           en:'Setup'     },
    { id:'content',   icon:<Calendar size={14}/>,       ar:'المحتوى',           en:'Content'   },
    { id:'comments',  icon:<MessageCircle size={14}/>,  ar:'الردود التلقائية',   en:'Comments'  },
    { id:'insights',  icon:<BarChart2 size={14}/>,      ar:'تقارير المنصات',    en:'Insights'  },
    { id:'campaigns', icon:<Megaphone size={14}/>,      ar:'تقارير الحملات',    en:'Campaigns' },
  ];

  return (
    <div style={{ padding:'20px 16px', maxWidth:900, margin:'0 auto', fontFamily:'inherit', boxSizing:'border-box' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,rgba(225,48,108,0.2),rgba(253,29,29,0.1))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Megaphone size={20} color="#e1306c"/>
        </div>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#e8eeff' }}>{f('قسم التسويق','Marketing')}</h2>
          <div style={{ fontSize:11, marginTop:1, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: cfg.connected?'#00e676':'#ff4444' }}/>
            <span style={{ color: cfg.connected?'#00e676':'#9aabcc', fontWeight:600, fontSize:11 }}>
              {cfg.connected ? `@${cfg.username}` : f('غير مربوط','Not connected')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActive(t.id)} style={{
            ...btn(active===t.id?'rgba(225,48,108,0.12)':'rgba(255,255,255,0.04)', active===t.id?'#e1306c':'#9aabcc'),
            border: active===t.id?'1px solid rgba(225,48,108,0.3)':'1px solid rgba(255,255,255,0.06)',
            fontSize:12, padding:'7px 13px',
          }}>
            {t.icon} {f(t.ar, t.en)}
          </button>
        ))}
      </div>

      {active === 'setup'     && <SetupTab     cfg={cfg} onSave={saveCfg} f={f}/>}
      {active === 'content'   && <ContentTab   cfg={cfg} f={f}/>}
      {active === 'comments'  && <CommentsTab  cfg={cfg} f={f}/>}
      {active === 'insights'  && <InsightsTab  cfg={cfg} f={f}/>}
      {active === 'campaigns' && <CampaignsTab cfg={cfg} f={f}/>}
    </div>
  );
}
