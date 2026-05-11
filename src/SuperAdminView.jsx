import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase.js';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import {
  Building2, Plus, Trash2, CheckCircle, XCircle, ChevronLeft,
  Copy, Globe, Users, BarChart2, RefreshCw, Eye, Settings,
  CreditCard, UserPlus, Shield, AlertCircle, Calendar, Loader
} from 'lucide-react';

/* ── Shared styles ── */
const S = {
  card: (extra={}) => ({ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'16px 20px', ...extra }),
  inp:  (extra={}) => ({ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#e8eeff', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', ...extra }),
  btn:  (bg='rgba(122,160,255,0.15)', color='#7aa0ff', extra={}) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:`1px solid ${color}30`, background:bg, color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', ...extra }),
  lbl:  { fontSize:10, fontWeight:700, color:'#9aabcc', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 },
};

const PLANS = [
  { id:'starter',      label:'Starter',      price:'AED 299/mo',  color:'#9aabcc', users:5,  props:50  },
  { id:'professional', label:'Professional', price:'AED 599/mo',  color:'#7aa0ff', users:15, props:300 },
  { id:'enterprise',   label:'Enterprise',   price:'AED 1,199/mo',color:'#f5a623', users:999,props:9999},
];
const PLAN = Object.fromEntries(PLANS.map(p=>[p.id,p]));

const ROLES = ['admin','listing','sales'];

/* ══════════════════════════════════════════════════════════════════════════════
   Agency Detail View
══════════════════════════════════════════════════════════════════════════════ */
function AgencyDetail({ agency, onBack }) {
  const [employees, setEmployees]   = useState([]);
  const [tab,       setTab]         = useState('employees'); // employees | subscription | settings
  const [loading,   setLoading]     = useState(false);
  const [newEmp,    setNewEmp]      = useState({ name:'', email:'', password:'', role:'sales', phone:'' });
  const [showAdd,   setShowAdd]     = useState(false);
  const [subEdit,   setSubEdit]     = useState(false);
  const [subForm,   setSubForm]     = useState({
    plan:       agency.plan        || 'professional',
    active:     agency.active      !== false,
    trialUntil: agency.trialUntil  || '',
    paidUntil:  agency.paidUntil   || '',
    notes:      agency.notes       || '',
  });

  /* Load employees */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'agencies', agency.id, 'users'),
      snap => setEmployees(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    return unsub;
  }, [agency.id]);

  const addEmployee = async () => {
    if (!newEmp.name || !newEmp.email || !newEmp.password) return;
    setLoading(true);
    const id = 'emp_' + Date.now();
    const avatar = newEmp.name.trim().slice(0,2);
    await setDoc(doc(db, 'agencies', agency.id, 'users', id), {
      ...newEmp,
      id,
      agencyId: agency.id,
      avatar,
      agentId: 'AGT-' + Date.now().toString().slice(-4),
      createdAt: new Date().toISOString(),
      active: true,
    });
    setNewEmp({ name:'', email:'', password:'', role:'sales', phone:'' });
    setShowAdd(false);
    setLoading(false);
  };

  const removeEmployee = async (emp) => {
    if (!confirm(`حذف موظف "${emp.name}"؟`)) return;
    await deleteDoc(doc(db, 'agencies', agency.id, 'users', emp.id));
  };

  const toggleEmpActive = (emp) =>
    updateDoc(doc(db, 'agencies', agency.id, 'users', emp.id), { active: !emp.active });

  const saveSub = async () => {
    await updateDoc(doc(db, 'agencies', agency.id), {
      plan:       subForm.plan,
      active:     subForm.active,
      trialUntil: subForm.trialUntil,
      paidUntil:  subForm.paidUntil,
      notes:      subForm.notes,
      updatedAt:  new Date().toISOString(),
    });
    setSubEdit(false);
  };

  const cancelSub = async () => {
    if (!confirm('إلغاء الاشتراك؟ هيتوقف وصول الوكالة للنظام.')) return;
    await updateDoc(doc(db, 'agencies', agency.id), { active: false, cancelledAt: new Date().toISOString() });
    setSubForm(p=>({...p, active:false}));
  };

  const reactivateSub = async () => {
    await updateDoc(doc(db, 'agencies', agency.id), { active: true, cancelledAt: null });
    setSubForm(p=>({...p, active:true}));
  };

  const plan = PLAN[agency.plan] || PLAN.professional;
  const tabs = [
    { id:'employees',    icon:<Users size={13}/>,      label:'الموظفين'     },
    { id:'subscription', icon:<CreditCard size={13}/>, label:'الاشتراك'     },
    { id:'settings',     icon:<Settings size={13}/>,   label:'إعدادات'      },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Back + header */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} style={S.btn('rgba(255,255,255,0.04)','#9aabcc',{padding:'8px 12px'})}>
          <ChevronLeft size={14}/> رجوع
        </button>
        <div style={{ width:40, height:40, borderRadius:12, background:`${plan.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Building2 size={20} color={plan.color}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#e8eeff' }}>{agency.name}</div>
          <div style={{ fontSize:11, color:'#3e4f72', direction:'ltr' }}>{agency.url}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
            background:`${plan.color}15`, color:plan.color, border:`1px solid ${plan.color}30` }}>
            {plan.label}
          </div>
          <div style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
            background: agency.active!==false?'rgba(0,230,118,0.1)':'rgba(255,68,68,0.1)',
            color: agency.active!==false?'#00e676':'#ff4444',
            border: `1px solid ${agency.active!==false?'#00e67630':'#ff444430'}` }}>
            {agency.active!==false ? '● نشط' : '● موقوف'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            ...S.btn(tab===t.id?'rgba(122,160,255,0.15)':'rgba(255,255,255,0.04)', tab===t.id?'#7aa0ff':'#9aabcc'),
            border: tab===t.id?'1px solid rgba(122,160,255,0.3)':'1px solid rgba(255,255,255,0.06)',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── EMPLOYEES TAB ── */}
      {tab === 'employees' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, color:'#9aabcc' }}>
              {employees.length} موظف · الحد الأقصى {plan.users === 999 ? 'غير محدود' : plan.users}
            </div>
            <button onClick={()=>setShowAdd(!showAdd)} style={S.btn('rgba(0,230,118,0.1)','#00e676')}>
              <UserPlus size={13}/> إضافة موظف
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div style={S.card({ border:'1px solid rgba(0,230,118,0.2)', background:'rgba(0,230,118,0.03)' })}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                {[
                  { lbl:'الاسم الكامل', key:'name',     ph:'محمد أحمد' },
                  { lbl:'الإيميل',      key:'email',    ph:'emp@agency.com', dir:'ltr' },
                  { lbl:'كلمة المرور',  key:'password', ph:'••••••••',       dir:'ltr', type:'password' },
                  { lbl:'رقم الهاتف',   key:'phone',    ph:'+971...',        dir:'ltr' },
                ].map(({lbl,key,ph,dir,type})=>(
                  <div key={key}>
                    <label style={S.lbl}>{lbl}</label>
                    <input value={newEmp[key]} onChange={e=>setNewEmp(p=>({...p,[key]:e.target.value}))} placeholder={ph} type={type||'text'} style={S.inp()} dir={dir}/>
                  </div>
                ))}
                <div>
                  <label style={S.lbl}>الدور</label>
                  <select value={newEmp.role} onChange={e=>setNewEmp(p=>({...p,role:e.target.value}))} style={{ ...S.inp(), appearance:'none' }}>
                    {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={addEmployee} disabled={loading||!newEmp.name||!newEmp.email||!newEmp.password}
                  style={{ ...S.btn('rgba(0,230,118,0.1)','#00e676'), opacity:(!newEmp.name||!newEmp.email||!newEmp.password)?0.5:1 }}>
                  {loading?<Loader size={12}/>:<CheckCircle size={12}/>} حفظ
                </button>
                <button onClick={()=>setShowAdd(false)} style={S.btn('rgba(255,68,68,0.08)','#ff4444')}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Employees list */}
          {employees.length === 0 ? (
            <div style={S.card({ textAlign:'center', padding:'32px', color:'#3e4f72' })}>
              <Users size={32} style={{ margin:'0 auto 10px', opacity:.3 }}/>
              <div>لا يوجد موظفون بعد</div>
            </div>
          ) : (
            employees.map(emp => (
              <div key={emp.id} style={{ ...S.card(), display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(122,160,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14, fontWeight:700, color:'#7aa0ff' }}>
                  {emp.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>{emp.name}</div>
                  <div style={{ fontSize:11, color:'#9aabcc', marginTop:1, direction:'ltr' }}>{emp.email}</div>
                </div>
                <div style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(122,160,255,0.08)', color:'#7aa0ff', fontWeight:700 }}>
                  {emp.role}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: emp.active!==false?'#00e676':'#ff4444' }}/>
                  <button onClick={()=>toggleEmpActive(emp)} style={S.btn('rgba(255,255,255,0.04)','#9aabcc',{padding:'5px 8px',fontSize:11})}>
                    {emp.active!==false ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button onClick={()=>removeEmployee(emp)} style={S.btn('rgba(255,68,68,0.08)','#ff4444',{padding:'5px 8px'})}>
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SUBSCRIPTION TAB ── */}
      {tab === 'subscription' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Status banner */}
          <div style={S.card({
            background: agency.active!==false?'rgba(0,230,118,0.05)':'rgba(255,68,68,0.05)',
            border: `1px solid ${agency.active!==false?'rgba(0,230,118,0.2)':'rgba(255,68,68,0.2)'}`,
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10
          })}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {agency.active!==false ? <CheckCircle size={18} color="#00e676"/> : <XCircle size={18} color="#ff4444"/>}
              <div>
                <div style={{ fontSize:14, fontWeight:700, color: agency.active!==false?'#00e676':'#ff4444' }}>
                  {agency.active!==false ? 'الاشتراك نشط' : 'الاشتراك موقوف'}
                </div>
                {agency.cancelledAt && <div style={{ fontSize:11, color:'#9aabcc' }}>تم الإلغاء: {new Date(agency.cancelledAt).toLocaleDateString('ar-AE')}</div>}
              </div>
            </div>
            {agency.active!==false ? (
              <button onClick={cancelSub} style={S.btn('rgba(255,68,68,0.1)','#ff4444')}>
                <XCircle size={13}/> إلغاء الاشتراك
              </button>
            ) : (
              <button onClick={reactivateSub} style={S.btn('rgba(0,230,118,0.1)','#00e676')}>
                <CheckCircle size={13}/> إعادة التفعيل
              </button>
            )}
          </div>

          {/* Plan selector */}
          <div style={S.card()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>الباقة والتفاصيل</div>
              {!subEdit ? (
                <button onClick={()=>setSubEdit(true)} style={S.btn('rgba(255,255,255,0.04)','#9aabcc',{padding:'6px 12px',fontSize:11})}>
                  <Settings size={11}/> تعديل
                </button>
              ) : (
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={saveSub} style={S.btn('rgba(0,230,118,0.1)','#00e676',{padding:'6px 12px',fontSize:11})}>
                    <CheckCircle size={11}/> حفظ
                  </button>
                  <button onClick={()=>setSubEdit(false)} style={S.btn('rgba(255,68,68,0.08)','#ff4444',{padding:'6px 12px',fontSize:11})}>
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {subEdit ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {/* Plan cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {PLANS.map(p=>(
                    <div key={p.id} onClick={()=>setSubForm(f=>({...f,plan:p.id}))}
                      style={{ padding:'14px', borderRadius:10, cursor:'pointer', textAlign:'center',
                        background: subForm.plan===p.id?`${p.color}15`:'rgba(255,255,255,0.03)',
                        border: `1px solid ${subForm.plan===p.id?p.color+'50':'rgba(255,255,255,0.06)'}` }}>
                      <div style={{ fontSize:13, fontWeight:800, color: subForm.plan===p.id?p.color:'#9aabcc' }}>{p.label}</div>
                      <div style={{ fontSize:11, color:'#9aabcc', marginTop:4 }}>{p.price}</div>
                      <div style={{ fontSize:10, color:'#3e4f72', marginTop:4 }}>{p.users===999?'مستخدمين غير محدود':`${p.users} مستخدمين`}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={S.lbl}>تاريخ انتهاء التجربة</label>
                    <input type="date" value={subForm.trialUntil} onChange={e=>setSubForm(f=>({...f,trialUntil:e.target.value}))} style={S.inp()} dir="ltr"/>
                  </div>
                  <div>
                    <label style={S.lbl}>تاريخ انتهاء الاشتراك المدفوع</label>
                    <input type="date" value={subForm.paidUntil} onChange={e=>setSubForm(f=>({...f,paidUntil:e.target.value}))} style={S.inp()} dir="ltr"/>
                  </div>
                </div>
                <div>
                  <label style={S.lbl}>ملاحظات داخلية</label>
                  <textarea value={subForm.notes} onChange={e=>setSubForm(f=>({...f,notes:e.target.value}))} style={{ ...S.inp(), height:70, resize:'vertical' }}/>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { lbl:'الباقة',              val: PLAN[agency.plan]?.label || agency.plan,   color: PLAN[agency.plan]?.color },
                  { lbl:'السعر الشهري',         val: PLAN[agency.plan]?.price || '—' },
                  { lbl:'الحد الأقصى مستخدمين',val: PLAN[agency.plan]?.users===999?'غير محدود':`${PLAN[agency.plan]?.users||'—'} مستخدمين` },
                  { lbl:'انتهاء التجربة',       val: agency.trialUntil ? new Date(agency.trialUntil).toLocaleDateString('ar-AE') : '—' },
                  { lbl:'انتهاء الاشتراك',      val: agency.paidUntil  ? new Date(agency.paidUntil).toLocaleDateString('ar-AE')  : '—' },
                  { lbl:'ملاحظات',              val: agency.notes || '—' },
                ].map(({lbl,val,color})=>(
                  <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:12, color:'#9aabcc' }}>{lbl}</span>
                    <span style={{ fontSize:12, fontWeight:700, color: color||'#e8eeff' }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <AgencySettings agency={agency}/>
      )}
    </div>
  );
}

/* ── Agency Settings ── */
function AgencySettings({ agency }) {
  const [form, setForm] = useState({
    name:       agency.name       || '',
    adminEmail: agency.adminEmail || '',
    phone:      agency.phone      || '',
    city:       agency.city       || '',
    logo:       agency.logo       || '',
  });
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await updateDoc(doc(db, 'agencies', agency.id), { ...form, updatedAt: new Date().toISOString() });
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  };

  const deleteAgency = async () => {
    if (!confirm(`حذف وكالة "${agency.name}" نهائياً؟ لا يمكن التراجع.`)) return;
    await deleteDoc(doc(db, 'agencies', agency.id));
  };

  return (
    <div style={S.card()}>
      <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:14 }}>إعدادات الوكالة</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        {[
          { lbl:'اسم الوكالة',       key:'name',       ph:'وكالة الريم' },
          { lbl:'إيميل الأدمن',      key:'adminEmail', ph:'admin@agency.com', dir:'ltr' },
          { lbl:'رقم الهاتف',        key:'phone',      ph:'+971 XX XXX XXXX', dir:'ltr' },
          { lbl:'المدينة',           key:'city',       ph:'دبي' },
          { lbl:'رابط الشعار (URL)', key:'logo',       ph:'https://...', dir:'ltr', full:true },
        ].map(({lbl,key,ph,dir,full})=>(
          <div key={key} style={full?{gridColumn:'1/-1'}:{}}>
            <label style={S.lbl}>{lbl}</label>
            <input value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} placeholder={ph} style={S.inp()} dir={dir}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={save} style={S.btn('rgba(0,230,118,0.1)','#00e676')}>
          <CheckCircle size={13}/> {saved ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
        </button>
        <button onClick={deleteAgency} style={S.btn('rgba(255,68,68,0.08)','#ff4444',{fontSize:11,padding:'7px 12px'})}>
          <Trash2 size={12}/> حذف الوكالة نهائياً
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN SuperAdminView
══════════════════════════════════════════════════════════════════════════════ */
export default function SuperAdminView({ f }) {
  const [agencies,   setAgencies]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState({ name:'', subdomain:'', plan:'professional', adminEmail:'' });
  const [creating,   setCreating]   = useState(false);
  const [stats,      setStats]      = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [dbError,    setDbError]    = useState(!db);

  useEffect(() => {
    if (!db) { setDbError(true); return; }
    try {
      const unsub = onSnapshot(
        collection(db, 'agencies'),
        snap => { setAgencies(snap.docs.map(d=>({id:d.id,...d.data()}))); },
        err  => { console.error('SuperAdmin agencies:', err); setDbError(true); }
      );
      return unsub;
    } catch(e) {
      console.error('SuperAdmin init:', e);
      setDbError(true);
    }
  }, []);

  const loadStats = useCallback(async () => {
    const s = {};
    await Promise.all(agencies.map(async ag => {
      try {
        const [u,p,l] = await Promise.all([
          getDocs(collection(db, 'agencies', ag.id, 'users')),
          getDocs(collection(db, 'agencies', ag.id, 'properties')),
          getDocs(collection(db, 'agencies', ag.id, 'leads')),
        ]);
        s[ag.id] = { users: u.size, props: p.size, leads: l.size };
      } catch { s[ag.id] = { users:0, props:0, leads:0 }; }
    }));
    setStats(s);
  }, [agencies]);

  useEffect(() => { if (agencies.length) loadStats(); }, [agencies.length]);

  const createAgency = async () => {
    const sub = form.subdomain.toLowerCase().replace(/[^a-z0-9-]/g,'');
    if (!form.name || !sub) return setError('أدخل الاسم والـ subdomain');
    if (agencies.find(a=>a.id===sub)) return setError('الـ subdomain موجود مسبقاً');
    setCreating(true); setError('');
    try {
      await setDoc(doc(db, 'agencies', sub), {
        name:       form.name,
        subdomain:  sub,
        plan:       form.plan,
        adminEmail: form.adminEmail,
        active:     true,
        url:        `https://${sub}.makancore.com`,
        createdAt:  new Date().toISOString(),
      });
      setForm({ name:'', subdomain:'', plan:'professional', adminEmail:'' });
      setShowCreate(false);
    } catch(e) { setError(e.message); }
    setCreating(false);
  };

  /* Summary KPIs */
  const totalUsers  = Object.values(stats).reduce((s,v)=>s+(v.users||0),0);
  const totalProps  = Object.values(stats).reduce((s,v)=>s+(v.props||0),0);
  const activeCount = agencies.filter(a=>a.active!==false).length;

  const filtered = agencies.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (dbError) return (
    <div style={{ padding:'40px 20px', textAlign:'center', color:'#ff4444', fontFamily:'inherit' }}>
      <AlertCircle size={40} style={{ marginBottom:12 }}/>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>تعذر الاتصال بقاعدة البيانات</div>
      <div style={{ fontSize:12, color:'#9aabcc' }}>تأكد من اتصال الإنترنت ثم أعد تشغيل البرنامج</div>
    </div>
  );

  /* If an agency is selected, show its detail view */
  if (selected) {
    const ag = agencies.find(a=>a.id===selected.id) || selected;
    return (
      <div style={{ padding:'24px 20px', maxWidth:900, margin:'0 auto', fontFamily:'inherit' }}>
        <AgencyDetail agency={ag} onBack={()=>setSelected(null)}/>
      </div>
    );
  }

  return (
    <div style={{ padding:'24px 20px', maxWidth:1000, margin:'0 auto', fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'rgba(245,166,35,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Building2 size={22} color="#f5a623"/>
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:'#e8eeff' }}>Super Admin</h2>
          <div style={{ fontSize:12, color:'#9aabcc', marginTop:2 }}>إدارة جميع الوكالات والاشتراكات</div>
        </div>
        <button onClick={()=>setShowCreate(!showCreate)} style={S.btn('rgba(0,230,118,0.1)','#00e676')}>
          <Plus size={13}/> وكالة جديدة
        </button>
      </div>

      {/* KPI bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { lbl:'الوكالات',     val:agencies.length, color:'#7aa0ff' },
          { lbl:'نشطة',        val:activeCount,      color:'#00e676' },
          { lbl:'الموظفون',    val:totalUsers,       color:'#f5a623' },
          { lbl:'الوحدات',     val:totalProps,       color:'#00d4ff' },
        ].map(({lbl,val,color})=>(
          <div key={lbl} style={{ ...S.card(), textAlign:'center', background:`${color}08`, border:`1px solid ${color}18` }}>
            <div style={{ fontSize:24, fontWeight:800, color, direction:'ltr' }}>{val}</div>
            <div style={{ fontSize:11, color:'#9aabcc', marginTop:4 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ ...S.card(), marginBottom:16, border:'1px solid rgba(0,230,118,0.2)', background:'rgba(0,230,118,0.02)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#00e676', marginBottom:14 }}>إضافة وكالة جديدة</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
            <div>
              <label style={S.lbl}>اسم الوكالة</label>
              <input value={form.name} onChange={e=>{
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/[\s؀-ۿ]+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').slice(0,8);
                const rand = Math.floor(100+Math.random()*900);
                const code = slug ? `${slug}${rand}` : '';
                setForm(p=>({...p, name, subdomain: code}));
              }} placeholder="وكالة الريم" style={S.inp()}/>
            </div>
            <div>
              <label style={S.lbl}>كود الوكالة (تلقائي)</label>
              <input value={form.subdomain} onChange={e=>setForm(p=>({...p,subdomain:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')}))} style={S.inp({fontFamily:'monospace', fontWeight:700, color:'#00e676'})} dir="ltr"/>
              <div style={{ fontSize:10, color:'#3e4f72', marginTop:3 }}>
                {form.subdomain ? <>كود الدخول: <strong style={{color:'#00e676'}}>{form.subdomain}</strong></> : '???'}
              </div>
            </div>
            <div>
              <label style={S.lbl}>الباقة</label>
              <select value={form.plan} onChange={e=>setForm(p=>({...p,plan:e.target.value}))} style={{ ...S.inp(), appearance:'none' }}>
                {PLANS.map(p=><option key={p.id} value={p.id}>{p.label} — {p.price}</option>)}
              </select>
            </div>
            <div>
              <label style={S.lbl}>إيميل الأدمن</label>
              <input value={form.adminEmail} onChange={e=>setForm(p=>({...p,adminEmail:e.target.value}))} placeholder="admin@agency.com" style={S.inp()} dir="ltr"/>
            </div>
          </div>
          {error && <div style={{ fontSize:12, color:'#ff4444', padding:'6px 10px', background:'rgba(255,68,68,0.08)', borderRadius:8, marginBottom:8 }}>{error}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={createAgency} disabled={creating} style={{ ...S.btn('rgba(0,230,118,0.1)','#00e676'), opacity:creating?0.6:1 }}>
              {creating?<Loader size={12}/>:<CheckCircle size={12}/>} إنشاء
            </button>
            <button onClick={()=>{setShowCreate(false);setError('');}} style={S.btn('rgba(255,68,68,0.08)','#ff4444')}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث عن وكالة..." style={{ ...S.inp(), marginBottom:12 }}/>

      {/* Agencies list */}
      {filtered.length === 0 ? (
        <div style={{ ...S.card(), textAlign:'center', padding:'48px', color:'#3e4f72' }}>
          <Building2 size={36} style={{ margin:'0 auto 12px', opacity:.3 }}/>
          <div>لا توجد وكالات بعد</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(ag => {
            const s    = stats[ag.id] || {};
            const plan = PLAN[ag.plan] || PLAN.professional;
            return (
              <div key={ag.id} onClick={()=>setSelected(ag)}
                style={{ ...S.card(), display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}>

                {/* Active dot */}
                <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background: ag.active!==false?'#00e676':'#ff4444' }}/>

                {/* Agency info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#e8eeff' }}>{ag.name}</div>
                  <div style={{ fontSize:11, color:'#3e4f72', direction:'ltr', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {ag.id}.makancore.com
                  </div>
                </div>

                {/* Plan */}
                <div style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                  background:`${plan.color}15`, color:plan.color, border:`1px solid ${plan.color}25`, flexShrink:0 }}>
                  {plan.label}
                </div>

                {/* Stats */}
                <div style={{ display:'flex', gap:16, flexShrink:0 }}>
                  {[
                    { icon:<Users size={11}/>,    v:s.users||0, l:'موظف'  },
                    { icon:<BarChart2 size={11}/>, v:s.props||0, l:'وحدة' },
                    { icon:<BarChart2 size={11}/>, v:s.leads||0, l:'ليد'  },
                  ].map(({icon,v,l})=>(
                    <div key={l} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'#e8eeff' }}>{v}</div>
                      <div style={{ fontSize:9, color:'#3e4f72', display:'flex', alignItems:'center', gap:2 }}>{icon}{l}</div>
                    </div>
                  ))}
                </div>

                {/* Date */}
                <div style={{ fontSize:10, color:'#3e4f72', flexShrink:0 }}>
                  {ag.createdAt ? new Date(ag.createdAt).toLocaleDateString('ar-AE',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DNS guide */}
      <div style={{ ...S.card(), marginTop:20, background:'rgba(122,160,255,0.03)', border:'1px solid rgba(122,160,255,0.1)' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#7aa0ff', marginBottom:8, display:'flex', gap:6 }}>
          <Globe size={13}/> إعداد Subdomain لكل وكالة جديدة
        </div>
        <div style={{ fontSize:11, color:'#9aabcc', lineHeight:2 }}>
          <span style={{ color:'#e8eeff', fontWeight:600 }}>DNS:</span> أضف CNAME → Name: <code style={{ background:'rgba(255,255,255,0.08)', padding:'0 5px', borderRadius:4 }}>reem</code> → Value: <code style={{ background:'rgba(255,255,255,0.08)', padding:'0 5px', borderRadius:4 }}>makan-673c9.web.app</code>
          <span style={{ margin:'0 10px', color:'#3e4f72' }}>·</span>
          <span style={{ color:'#e8eeff', fontWeight:600 }}>Firebase:</span> Hosting → Add custom domain → <code style={{ background:'rgba(255,255,255,0.08)', padding:'0 5px', borderRadius:4 }}>reem.makancore.com</code>
        </div>
      </div>

      {/* Change Super Admin Password */}
      <ChangeAdminPassword />
    </div>
  );
}

function ChangeAdminPassword() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [status,      setStatus]      = useState(null); // null | 'loading' | 'success' | 'error'
  const [msg,         setMsg]         = useState('');

  async function hashStr(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function handleChange() {
    setMsg(''); setStatus('loading');
    if (!currentPass || !newPass || !confirmPass) { setStatus('error'); setMsg('أكمل كل الحقول'); return; }
    if (newPass !== confirmPass) { setStatus('error'); setMsg('كلمة المرور الجديدة غير متطابقة'); return; }
    if (newPass.length < 8) { setStatus('error'); setMsg('كلمة المرور لازم تكون 8 أحرف على الأقل'); return; }

    try {
      // Verify current password
      const currentHash = await hashStr(currentPass);
      const snap = await fetch('https://firestore.googleapis.com/v1/projects/makan-673c9/databases/(default)/documents/settings/superadmin');
      const data = await snap.json();
      const storedHash = data?.fields?.passHash?.stringValue;
      if (!storedHash || currentHash !== storedHash) { setStatus('error'); setMsg('كلمة المرور الحالية غير صحيحة'); return; }

      // Save new hash
      const newHash = await hashStr(newPass);
      await setDoc(doc(db, 'settings', 'superadmin'), { passHash: newHash });

      setStatus('success'); setMsg('✅ تم تغيير كلمة المرور بنجاح');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (e) {
      setStatus('error'); setMsg('❌ حدث خطأ — ' + e.message);
    }
  }

  return (
    <div style={{ ...S.card(), marginTop:20, background:'rgba(245,166,35,0.02)', border:'1px solid rgba(245,166,35,0.12)' }}>
      <div style={{ fontSize:12, fontWeight:700, color:'#f5a623', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
        <Shield size={13}/> تغيير كلمة مرور الإدارة
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
        <div>
          <label style={S.lbl}>كلمة المرور الحالية</label>
          <input type="password" value={currentPass} onChange={e=>setCurrentPass(e.target.value)} style={S.inp()} placeholder="••••••••"/>
        </div>
        <div>
          <label style={S.lbl}>كلمة المرور الجديدة</label>
          <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={S.inp()} placeholder="••••••••"/>
        </div>
        <div>
          <label style={S.lbl}>تأكيد كلمة المرور</label>
          <input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} style={S.inp()} placeholder="••••••••"/>
        </div>
      </div>
      {msg && (
        <div style={{ fontSize:12, padding:'7px 12px', borderRadius:8, marginBottom:10,
          background: status==='success' ? 'rgba(0,230,118,0.08)' : 'rgba(255,68,68,0.08)',
          color:       status==='success' ? '#00e676' : '#ff4444',
          border:     `1px solid ${status==='success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,68,68,0.2)'}` }}>
          {msg}
        </div>
      )}
      <button onClick={handleChange} disabled={status==='loading'} style={{ ...S.btn('rgba(245,166,35,0.12)', '#f5a623'), opacity: status==='loading' ? 0.5 : 1 }}>
        {status==='loading' ? <Loader size={12}/> : <Shield size={12}/>}
        {status==='loading' ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
      </button>
    </div>
  );
}
