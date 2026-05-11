import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calculator, FileText, StickyNote, Plus, Trash2, Save, ChevronDown, ChevronUp, Printer } from 'lucide-react';

/* ── Shared styles ─────────────────────────────────────────────────────────── */
const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px' };
const isMob = () => typeof window !== 'undefined' && window.innerWidth < 600;
const inp = (extra={}) => ({ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#e8eeff', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color .2s', ...extra });
const btn = (bg='rgba(122,160,255,0.15)', color='#7aa0ff', extra={}) => ({ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:`1px solid ${color}30`, background:bg, color, fontSize:13, fontWeight:700, cursor:'pointer', transition:'opacity .18s', fontFamily:'inherit', ...extra });
const label = { fontSize:11, fontWeight:700, color:'#9aabcc', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 };
const fmt = (n) => new Intl.NumberFormat('en-AE',{style:'currency',currency:'AED',maximumFractionDigits:0}).format(n||0);
const fmtN = (n) => (n||0).toLocaleString('en-AE',{maximumFractionDigits:0});
const parseNum = (v) => parseFloat(String(v).replace(/,/g,'').replace(/[^\d.-]/g,'')) || 0;

/* ══════════════════════════════════════════════════════════════════════════════
   TOOL 1 — Payment Ledger (دفتر المدفوعات)
══════════════════════════════════════════════════════════════════════════════ */
function PaymentLedger({ f, rtl }) {
  const mob = isMob();
  const [price,    setPrice]    = useState('');
  const [downPct,  setDownPct]  = useState('');
  const [feePct,   setFeePct]   = useState('');
  const [feeFixed, setFeeFixed] = useState('');
  const [instName, setInstName] = useState('');
  const [instPct,  setInstPct]  = useState('');
  const [instNum,  setInstNum]  = useState('');
  const [instNote, setInstNote] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [items,    setItems]    = useState([]);

  const totalPrice   = parseNum(price);
  const downPayment  = totalPrice * (parseNum(downPct) / 100);
  const fees         = totalPrice * (parseNum(feePct) / 100) + parseNum(feeFixed);
  const totalUpfront = downPayment + fees;
  const instTotal    = items.reduce((s, i) => s + i.pct, 0);
  const totalPct     = parseNum(downPct) + instTotal;
  const totalAED     = totalPrice * (totalPct / 100);

  const addItem = () => {
    if (!instName.trim() || !parseNum(instPct)) return;
    setItems(p => [...p, { id: Date.now(), name: instName, pct: parseNum(instPct), num: parseInt(instNum)||1, note: instNote }]);
    setInstName(''); setInstPct(''); setInstNum(''); setInstNote('');
  };

  const validation = totalPct === 100 ? { color:'#00e676', msg: f('خطة الدفع مكتملة 100% ✓','Payment plan 100% complete ✓') }
    : totalPct > 100   ? { color:'#ff4444', msg: f('تجاوزت 100%، راجع الأرقام','Total exceeds 100%, please review') }
    : totalPct > 0     ? { color:'#f5a623', msg: `${f('متبقي','Remaining')} ${(100 - totalPct).toFixed(1)}%` }
    : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Inputs */}
      <div style={{ ...card, display:'grid', gridTemplateColumns: mob?'1fr 1fr':'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
        {[
          { lbl: f('السعر الإجمالي (AED)','Total Price (AED)'), val: price, set: setPrice, ph:'1,000,000', full: mob },
          { lbl: f('الدفعة الأولى %','Down Payment %'),          val: downPct, set: setDownPct, ph:'10' },
          { lbl: f('رسوم التسجيل %','Registration Fee %'),       val: feePct, set: setFeePct, ph:'4' },
          { lbl: f('رسوم إدارية (AED)','Admin Fee (AED)'),        val: feeFixed, set: setFeeFixed, ph:'5,000' },
        ].map(({ lbl, val, set, ph, full }) => (
          <div key={lbl} style={full?{gridColumn:'1/-1'}:{}}>
            <label style={label}>{lbl}</label>
            <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={inp()} dir="ltr"/>
          </div>
        ))}
      </div>

      {/* Upfront summary */}
      <div style={{ ...card, display:'grid', gridTemplateColumns: mob?'1fr 1fr':'repeat(auto-fit,minmax(180px,1fr))', gap:10 }}>
        {[
            { lbl: f('الدفعة الأولى','Down Payment'), val: fmt(downPayment), color:'#7aa0ff' },
          { lbl: f('الرسوم','Fees'),                val: fmt(fees),        color:'#f5a623' },
          { lbl: f('إجمالي عند الحجز','Total Upfront'), val: fmt(totalUpfront), color:'#00e676', big:true, full:mob },
        ].map(({ lbl, val, color, big, full }) => (
          <div key={lbl} style={{ background:`${color}10`, border:`1px solid ${color}25`, borderRadius:10, padding:'12px 14px', textAlign:'center', ...(full?{gridColumn:'1/-1'}:{}) }}>
            <div style={{ fontSize:11, color:'#9aabcc', marginBottom:4, fontWeight:600 }}>{lbl}</div>
            <div style={{ fontSize: big?20:16, fontWeight:800, color, direction:'ltr' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Installment builder */}
      <div style={card}>
        <div style={{ fontSize:14, fontWeight:700, color:'#e8eeff', marginBottom:14 }}>{f('منشئ الأقساط','Installment Builder')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:10 }}>
          <input value={instName} onChange={e=>setInstName(e.target.value)} placeholder={f('اسم القسط (مثال: أثناء البناء)','Installment name (e.g. During Construction)')} style={inp()}/>
          <input value={instPct}  onChange={e=>setInstPct(e.target.value)}  placeholder='%' style={inp({width:70})} dir="ltr"/>
        </div>
        {advanced && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <input value={instNum}  onChange={e=>setInstNum(e.target.value)}  placeholder={f('عدد الدفعات','Number of payments')} style={inp()} dir="ltr"/>
            <input value={instNote} onChange={e=>setInstNote(e.target.value)} placeholder={f('ملاحظات / توقيت','Notes / Timing')} style={inp()}/>
          </div>
        )}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={addItem} style={btn('#25d36622','#25d366',{flex:1, justifyContent:'center'})}>
            <Plus size={14}/> {f('إضافة القسط','Add Installment')}
          </button>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, color:'#9aabcc' }}>
            <input type="checkbox" checked={advanced} onChange={e=>setAdvanced(e.target.checked)} style={{ accentColor:'#7aa0ff' }}/>
            {f('تفاصيل متقدمة','Advanced')}
          </label>
        </div>
      </div>

      {/* Installment list */}
      {items.length > 0 && (
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#e8eeff' }}>{f('جدول الأقساط','Installment Schedule')}</div>
            <button onClick={()=>setItems([])} style={btn('rgba(255,68,68,0.08)','#ff4444',{fontSize:11,padding:'5px 10px'})}>
              <Trash2 size={12}/> {f('مسح الكل','Clear All')}
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {items.map(item => {
              const aed = totalPrice * (item.pct / 100);
              const perPayment = aed / item.num;
              return (
                <div key={item.id} style={{ background:'rgba(122,160,255,0.04)', border:'1px solid rgba(122,160,255,0.1)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff' }}>{item.name}</div>
                      <div style={{ fontSize:11, color:'#9aabcc', marginTop:2 }}>{item.pct}% {item.note && `· ${item.note}`}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#7aa0ff', direction:'ltr' }}>{fmt(aed)}</div>
                      <button onClick={()=>setItems(p=>p.filter(i=>i.id!==item.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff4444', padding:4 }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                  {advanced && item.num > 1 && (
                    <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:6 }}>
                      {Array.from({length:item.num},(_,i)=>(
                        <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'7px 10px', display:'flex', justifyContent:'space-between', fontSize:12 }}>
                          <span style={{ color:'#9aabcc' }}>{f('دفعة','Payment')} {i+1}</span>
                          <span style={{ color:'#e8eeff', fontWeight:700, direction:'ltr' }}>{fmt(perPayment)}</span>
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

      {/* Grand total */}
      <div style={{ ...card, display:'grid', gridTemplateColumns: mob?'1fr 1fr':'repeat(3,1fr)', gap:10 }}>
        {[
          { lbl: f('إجمالي النسبة','Total %'),       val: `${totalPct.toFixed(1)}%`, color: validation?.color||'#9aabcc' },
          { lbl: f('تكلفة العقار','Property Cost'),   val: fmt(totalAED),              color:'#00e676' },
          { lbl: f('إجمالي مع الرسوم','Total w/ Fees'),val: fmt(totalAED + fees),     color:'#f5a623' },
        ].map(({ lbl, val, color }) => (
          <div key={lbl} style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:10, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#9aabcc', marginBottom:6, fontWeight:600 }}>{lbl}</div>
            <div style={{ fontSize:20, fontWeight:800, color, direction:'ltr' }}>{val}</div>
          </div>
        ))}
        {validation && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', fontSize:12, fontWeight:700, color:validation.color, padding:'8px', borderRadius:8, background:`${validation.color}10` }}>
            {validation.msg}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TOOL 2 — Secondary Market Calculator (حاسبة السوق الثانوي)
══════════════════════════════════════════════════════════════════════════════ */
function SecondaryCalc({ f, rtl }) {
  const mob = isMob();
  const [op,          setOp]          = useState('');
  const [mode,        setMode]        = useState('percent'); // percent | amount
  const [paidPct,     setPaidPct]     = useState('');
  const [paidAmt,     setPaidAmt]     = useState('');
  const [premium,     setPremium]     = useState('');
  const [transferPct, setTransferPct] = useState('4');
  const [commPct,     setCommPct]     = useState('2');
  const [noc,         setNoc]         = useState('5000');
  const [trustee,     setTrustee]     = useState('4200');
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');

  const calculate = () => {
    const originalPrice  = parseNum(op);
    const sellerPremium  = parseNum(premium);
    if (originalPrice <= 0) { setError(f('أدخل سعر الشراء الأصلي','Enter the original purchase price')); return; }

    let sellerEquity = 0;
    if (mode === 'percent') {
      const pct = parseNum(paidPct);
      if (pct <= 0 || pct > 100) { setError(f('النسبة يجب أن تكون بين 1-100','Percentage must be 1-100')); return; }
      sellerEquity = originalPrice * (pct / 100);
    } else {
      sellerEquity = parseNum(paidAmt);
      if (sellerEquity <= 0 || sellerEquity > originalPrice) { setError(f('المبلغ المدفوع أكبر من سعر الشراء','Paid amount exceeds original price')); return; }
    }

    setError('');
    const newSalePrice      = originalPrice + sellerPremium;
    const dueToSeller       = sellerEquity + sellerPremium;
    const transferFeeAmount = newSalePrice * (parseNum(transferPct) / 100);
    const commissionAmount  = newSalePrice * (parseNum(commPct) / 100);
    const otherFees         = parseNum(noc) + parseNum(trustee);
    const totalUpfront      = dueToSeller + transferFeeAmount + commissionAmount + otherFees;
    const futureLiability   = originalPrice - sellerEquity;
    const totalCost         = totalUpfront + futureLiability;
    const paidPercent       = (sellerEquity / originalPrice) * 100;

    setResult({ originalPrice, newSalePrice, sellerEquity, paidPercent, dueToSeller, transferFeeAmount, commissionAmount, otherFees, totalUpfront, futureLiability, totalCost });
  };

  const reset = () => { setOp(''); setPaidPct(''); setPaidAmt(''); setPremium(''); setTransferPct('4'); setCommPct('2'); setNoc('5000'); setTrustee('4200'); setResult(null); setError(''); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Inputs grid */}
      <div style={{ ...card, display:'grid', gridTemplateColumns: mob?'1fr':'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={label}>{f('سعر الشراء الأصلي (AED)','Original Purchase Price (AED)')}</label>
          <input value={op} onChange={e=>setOp(e.target.value)} placeholder="1,000,000" style={inp()} dir="ltr"/>
        </div>

        {/* Mode toggle */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={label}>{f('طريقة إدخال المبلغ المدفوع','Paid Amount Input Mode')}</label>
          <div style={{ display:'flex', gap:8 }}>
            {[{v:'percent',ar:'بالنسبة %',en:'By % Paid'},{v:'amount',ar:'بالمبلغ AED',en:'By Amount AED'}].map(opt=>(
              <button key={opt.v} onClick={()=>setMode(opt.v)} style={{ ...btn(mode===opt.v?'rgba(122,160,255,0.2)':'rgba(255,255,255,0.04)', mode===opt.v?'#7aa0ff':'#9aabcc'), flex:1, justifyContent:'center' }}>
                {f(opt.ar,opt.en)}
              </button>
            ))}
          </div>
        </div>

        {mode==='percent' ? (
          <div>
            <label style={label}>{f('النسبة المدفوعة للمطور %','% Paid to Developer')}</label>
            <input value={paidPct} onChange={e=>setPaidPct(e.target.value)} placeholder="30" style={inp()} dir="ltr"/>
          </div>
        ) : (
          <div>
            <label style={label}>{f('المبلغ المدفوع للمطور (AED)','Amount Paid to Developer (AED)')}</label>
            <input value={paidAmt} onChange={e=>setPaidAmt(e.target.value)} placeholder="300,000" style={inp()} dir="ltr"/>
          </div>
        )}

        <div>
          <label style={label}>{f('البريميوم / الربح (AED) — سالب = خسارة','Premium / Profit (AED) — negative = loss')}</label>
          <input value={premium} onChange={e=>setPremium(e.target.value)} placeholder="100,000" style={inp()} dir="ltr"/>
        </div>

        <div>
          <label style={label}>{f('رسوم نقل الملكية %','Transfer Fee %')}</label>
          <input value={transferPct} onChange={e=>setTransferPct(e.target.value)} placeholder="4" style={inp()} dir="ltr"/>
        </div>
        <div>
          <label style={label}>{f('عمولة الوكيل %','Agent Commission %')}</label>
          <input value={commPct} onChange={e=>setCommPct(e.target.value)} placeholder="2" style={inp()} dir="ltr"/>
        </div>
        <div>
          <label style={label}>{f('رسوم NOC (AED)','NOC Fee (AED)')}</label>
          <input value={noc} onChange={e=>setNoc(e.target.value)} placeholder="5,000" style={inp()} dir="ltr"/>
        </div>
        <div>
          <label style={label}>{f('أمين التسجيل (AED)','Trustee Fee (AED)')}</label>
          <input value={trustee} onChange={e=>setTrustee(e.target.value)} placeholder="4,200" style={inp()} dir="ltr"/>
        </div>
      </div>

      {error && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,68,68,0.08)', border:'1px solid rgba(255,68,68,0.2)', color:'#ff4444', fontSize:13, fontWeight:600 }}>{error}</div>}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={calculate} style={{ ...btn('rgba(122,160,255,0.15)','#7aa0ff'), flex:1, justifyContent:'center', fontSize:14 }}>
          <Calculator size={15}/> {f('احسب','Calculate')}
        </button>
        <button onClick={reset} style={btn('rgba(255,68,68,0.08)','#ff4444',{padding:'9px 16px'})}>
          {f('مسح','Reset')}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Summary */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:'#e8eeff', marginBottom:12 }}>{f('ملخص الصفقة','Deal Summary')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { lbl: f('سعر البيع الجديد (شامل البريميوم)','New Sale Price (incl. Premium)'), val: fmt(result.newSalePrice) },
                { lbl: f('المبلغ المدفوع للمطور (Equity)','Seller\'s Paid Equity'),             val: `${fmt(result.sellerEquity)} (${result.paidPercent.toFixed(1)}%)` },
              ].map(({lbl,val})=>(
                <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize:13, color:'#9aabcc' }}>{lbl}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#e8eeff', direction:'ltr' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upfront */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:'#7aa0ff', marginBottom:12 }}>{f('التكلفة النقدية الفورية','Upfront Cash Required')}</div>
            {[
              { lbl: f('المستحق للبائع (المدفوع + البريميوم)','Due to Seller (Equity + Premium)'), val: result.dueToSeller },
              { lbl: f('رسوم نقل الملكية','Transfer Fees'),                                         val: result.transferFeeAmount },
              { lbl: f('عمولة الوكيل','Agent Commission'),                                           val: result.commissionAmount },
              { lbl: f('رسوم أخرى (NOC + أمين التسجيل)','Other Fees (NOC + Trustee)'),             val: result.otherFees },
            ].map(({lbl,val})=>(
              <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:13, color:'#9aabcc' }}>{lbl}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#e8eeff', direction:'ltr' }}>{fmt(val)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, padding:'12px 14px', background:'rgba(122,160,255,0.1)', border:'1px solid rgba(122,160,255,0.2)', borderRadius:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#7aa0ff' }}>{f('إجمالي النقد الفوري','Total Upfront Cash')}</span>
              <span style={{ fontSize:18, fontWeight:800, color:'#7aa0ff', direction:'ltr' }}>{fmt(result.totalUpfront)}</span>
            </div>
          </div>

          {/* Future + Total */}
          <div style={{ display:'grid', gridTemplateColumns: mob?'1fr':'1fr 1fr', gap:12 }}>
            <div style={{ ...card, background:'rgba(255,68,68,0.05)', border:'1px solid rgba(255,68,68,0.15)', textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#ff4444', fontWeight:700, marginBottom:6 }}>{f('الالتزامات المستقبلية','Future Liabilities')}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#ff4444', direction:'ltr' }}>{fmt(result.futureLiability)}</div>
              <div style={{ fontSize:11, color:'#9aabcc', marginTop:4 }}>{f('المتبقي للمطور','Remaining to Developer')}</div>
            </div>
            <div style={{ ...card, background:'rgba(0,230,118,0.05)', border:'1px solid rgba(0,230,118,0.15)', textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#00e676', fontWeight:700, marginBottom:6 }}>{f('إجمالي تكلفة العقار','Total Acquisition Cost')}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#00e676', direction:'ltr' }}>{fmt(result.totalCost)}</div>
              <div style={{ fontSize:11, color:'#9aabcc', marginTop:4 }}>{f('النقد الفوري + الالتزامات','Upfront + Liabilities')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   NOTES — standalone page
══════════════════════════════════════════════════════════════════════════════ */
function NotesView({ f, rtl }) {
  const STORAGE_KEY = 'makan_tools_notes';
  const [notes, setNotes]   = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; } });
  const [title, setTitle]   = useState('');
  const [body,  setBody]    = useState('');
  const [open,  setOpen]    = useState(null);
  const [search,setSearch]  = useState('');

  const save = () => {
    if (!body.trim()) return;
    const note = { id: Date.now(), title: title.trim() || f('ملاحظة بدون عنوان','Untitled Note'), body: body.trim(), date: new Date().toLocaleDateString('ar-AE') };
    const next = [note, ...notes];
    setNotes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setTitle(''); setBody('');
  };

  const del = (id) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (open === id) setOpen(null);
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Add note */}
      <div style={card}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={f('عنوان الملاحظة (اختياري)','Note title (optional)')} style={{ ...inp(), marginBottom:10 }}/>
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder={f('اكتب ملاحظتك هنا…','Write your note here…')} style={{ ...inp(), height:110, resize:'vertical', marginBottom:10 }}/>
        <button onClick={save} disabled={!body.trim()} style={{ ...btn('rgba(0,230,118,0.1)','#00e676'), opacity: body.trim()?1:0.4 }}>
          <Save size={14}/> {f('حفظ الملاحظة','Save Note')}
        </button>
      </div>

      {/* Search */}
      {notes.length > 0 && (
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={f('ابحث في الملاحظات…','Search notes…')} style={inp()}/>
      )}

      {/* Notes list */}
      {filtered.length === 0 && notes.length === 0 && (
        <div style={{ textAlign:'center', color:'#3e4f72', padding:'32px 0', fontSize:13 }}>
          <StickyNote size={36} style={{ margin:'0 auto 10px', opacity:.4 }}/>
          <div>{f('مفيش ملاحظات لسه','No notes yet')}</div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(note => (
          <div key={note.id} style={{ ...card, cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }} onClick={()=>setOpen(open===note.id?null:note.id)}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#e8eeff' }}>{note.title}</div>
                <div style={{ fontSize:11, color:'#3e4f72', marginTop:2 }}>{note.date}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {open===note.id ? <ChevronUp size={15} color="#9aabcc"/> : <ChevronDown size={15} color="#9aabcc"/>}
                <button onClick={e=>{e.stopPropagation();del(note.id);}} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff4444', padding:4 }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
            {open === note.id && (
              <div style={{ marginTop:12, padding:'12px 14px', background:'rgba(255,255,255,0.03)', borderRadius:8, fontSize:13, color:'#9aabcc', lineHeight:1.7, whiteSpace:'pre-wrap', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                {note.body}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN ToolsView (calculators only)
══════════════════════════════════════════════════════════════════════════════ */
export default function ToolsView({ lang, f, rtl }) {
  const [active, setActive] = useState('ledger');

  const tabs = [
    { id:'ledger',    icon:<FileText size={15}/>,   ar:'دفتر المدفوعات',      en:'Payment Ledger'   },
    { id:'secondary', icon:<Calculator size={15}/>, ar:'حاسبة السوق الثانوي', en:'Secondary Market' },
  ];

  return (
    <div style={{ padding:'20px 16px', maxWidth:860, margin:'0 auto', fontFamily:'inherit', boxSizing:'border-box' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'rgba(122,160,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Calculator size={20} color="#7aa0ff"/>
        </div>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#e8eeff' }}>{f('الأدوات','Tools')}</h2>
          <div style={{ fontSize:11, color:'#7aa0ff', marginTop:1 }}>{f('حاسبات عقارية','Real estate calculators')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActive(t.id)} style={{
            ...btn(active===t.id?'rgba(122,160,255,0.15)':'rgba(255,255,255,0.04)', active===t.id?'#7aa0ff':'#9aabcc'),
            border: active===t.id?'1px solid rgba(122,160,255,0.3)':'1px solid rgba(255,255,255,0.06)',
            fontSize:12, padding:'7px 14px',
          }}>
            {t.icon} {f(t.ar, t.en)}
          </button>
        ))}
      </div>

      {active === 'ledger'    && <PaymentLedger    f={f} rtl={rtl}/>}
      {active === 'secondary' && <SecondaryCalc    f={f} rtl={rtl}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   NotesStandaloneView — exported for App.jsx
══════════════════════════════════════════════════════════════════════════════ */
export function NotesStandaloneView({ lang, f, rtl }) {
  return (
    <div style={{ padding:'20px 16px', maxWidth:720, margin:'0 auto', fontFamily:'inherit', boxSizing:'border-box' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'rgba(245,166,35,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <StickyNote size={20} color="#f5a623"/>
        </div>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#e8eeff' }}>{f('الملاحظات','Notes')}</h2>
          <div style={{ fontSize:11, color:'#f5a623', marginTop:1 }}>{f('سجّل ملاحظاتك وارجعلها وقت ما تريد','Save notes and come back to them anytime')}</div>
        </div>
      </div>
      <NotesView f={f} rtl={rtl}/>
    </div>
  );
}
