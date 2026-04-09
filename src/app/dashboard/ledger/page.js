"use client"; import { useState } from "react"; import { useApp } from "../../../context/AppContext"; import { SectionLabel, toast, EmptyState } from "../../../components/shared"; const C = { navy:"#1a2744", emerald:"#0fa573", rose:"#e8445a", amber:"#e8960a", purple:"#5b4fcf", indigo:"#3b5bdb", border:"#e8e6e0", surface:"#ffffff", faint:"#f8f7f4", muted:"#8a8a9a" }; const INCOME_CATS = ["월세수입","보증금수입","관리비수입","기타수입"]; const EXPENSE_CATS = ["수리비","관리비","세금","보험료","대출이자","광고비","기타지출"];

export default function LedgerPage() {
  // ✅ #10: AppContext에서 ledger 직접 가져옴 (별도 supabase 쿼리 불필요)
  const { tenants, ledger: items, addLedgerEntry, deleteLedgerEntry, loading } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false); // ✅ ⑥ CSV 가져오기
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(0);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type:"income", category:INCOME_CATS[0], amount:0, memo:"", tenant_id:"" });

  const save = async () => {
    if (!form.amount || form.amount <= 0) { toast("금액을 입력해주세요", "error"); return; }
    setSaving(true);
    try {
      await addLedgerEntry({ ...form, amount: Number(form.amount), tenant_id: form.tenant_id || null });
      toast("장부가 저장되었습니다");
      setShowForm(false);
      setForm({ date: new Date().toISOString().slice(0,10), type:"income", category:INCOME_CATS[0], amount:0, memo:"", tenant_id:"" });
    } catch { toast("저장 중 오류가 발생했습니다", "error"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try { await deleteLedgerEntry(id); toast("삭제되었습니다", "warning"); }
    catch { toast("삭제 중 오류가 발생했습니다", "error"); }
  };

  const filtered = (items || []).filter(i => { const d = new Date(i.date); if (d.getFullYear() !== viewYear) return false; if (viewMonth > 0 && d.getMonth()+1 !== viewMonth) return false; return true; }); const totalIncome = filtered.filter(i=>i.type==="income").reduce((s,i)=>s+(i.amount||0),0); const totalExpense = filtered.filter(i=>i.type==="expense").reduce((s,i)=>s+(i.amount||0),0); const netIncome = totalIncome - totalExpense; const monthlyData = Array.from({length:12},(_,mi)=>{ const m = mi+1; const inc = (items||[]).filter(i=>new Date(i.date).getFullYear()===viewYear&&new Date(i.date).getMonth()+1===m&&i.type==="income").reduce((s,i)=>s+(i.amount||0),0); const exp = (items||[]).filter(i=>new Date(i.date).getFullYear()===viewYear&&new Date(i.date).getMonth()+1===m&&i.type==="expense").reduce((s,i)=>s+(i.amount||0),0); return { m, inc, exp, net:inc-exp }; }); const maxVal = Math.max(...monthlyData.map(d=>Math.max(d.inc,d.exp)),1);

  // ✅ #10: 자동 기록된 항목 카운트
  const autoCount = filtered.filter(i => i.auto_generated).length;

  return ( <div className="page-in page-padding" style={{ maxWidth:960 }}> <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:26, flexWrap:"wrap", gap:12 }}> <div> <SectionLabel>LEDGER</SectionLabel> <h1 style={{ fontSize:24, fontWeight:800, color:C.navy, letterSpacing:"-.4px" }}>간편 장부</h1>
      <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>
        임대 수입과 지출을 한눈에 관리하세요
        {/* ✅ #10: 자동 기록 안내 */}
        {autoCount > 0 && <span style={{ marginLeft:8, fontSize:11, color:"#5b4fcf", fontWeight:600, background:"rgba(91,79,207,0.08)", padding:"2px 8px", borderRadius:10 }}>🤖 수금 자동기록 {autoCount}건 포함</span>}
      </p>
    </div> <div style={{ display:"flex", gap:8, alignItems:"center" }}> <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"7px 11px" }}> <button onClick={()=>setViewYear(y=>y-1)} style={{ width:26,height:26,borderRadius:7,border:"none",background:C.faint,cursor:"pointer",fontSize:14 }}>‹</button> <span style={{ fontSize:13, fontWeight:700, color:C.navy, minWidth:58, textAlign:"center" }}>{viewYear}년</span> <button onClick={()=>setViewYear(y=>y+1)} style={{ width:26,height:26,borderRadius:7,border:"none",background:C.faint,cursor:"pointer",fontSize:14 }}>›</button> </div> <button onClick={()=>setShowForm(true)} style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.navy},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ 내역 추가</button>
          {/* ✅ ⑥ CSV 가져오기 버튼 */}
          <button onClick={() => setShowCsvImport(true)} style={{ padding:"9px 16px", borderRadius:10, background:"rgba(15,165,115,0.1)", border:"1px solid rgba(15,165,115,0.3)", color:"#0fa573", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            📥 CSV 가져오기
          </button>
        </div> </div>

    {/* ✅ #10: 자동 기록 안내 배너 */}
    {autoCount === 0 && (items||[]).length === 0 && (
      <div style={{ background:"rgba(91,79,207,0.05)", border:"1px solid rgba(91,79,207,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:20 }}>🤖</span>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"#5b4fcf" }}>수금 현황에서 납부 처리하면 월세수입이 자동으로 기록됩니다</p>
          <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>이중 입력 없이 수금과 장부를 한 번에 관리하세요</p>
        </div>
      </div>
    )}

    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13, marginBottom:20 }}> {[ { label:"연간 수입", value:`${totalIncome.toLocaleString()}만원`, color:C.emerald, bg:"rgba(15,165,115,0.08)" }, { label:"연간 지출", value:`${totalExpense.toLocaleString()}만원`, color:C.rose, bg:"rgba(232,68,90,0.08)" }, { label:"순수익", value:`${netIncome.toLocaleString()}만원`, color:netIncome>=0?C.indigo:C.rose, bg:netIncome>=0?"rgba(59,91,219,0.08)":"rgba(232,68,90,0.08)" }, ].map(k=>( <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.color}22`, borderRadius:14, padding:"18px 20px" }}> <p style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>{k.label}</p> <p style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.value}</p> </div> ))} </div> <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", marginBottom:20 }}> <p style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:"1px", marginBottom:16 }}>월별 수입/지출</p> <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:80 }}> {monthlyData.map(d=>( <div key={d.m} onClick={()=>setViewMonth(viewMonth===d.m?0:d.m)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer" }}> <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:64, gap:2 }}> {d.inc>0&&<div style={{ width:"100%", height:`${(d.inc/maxVal)*60}px`, background:viewMonth===d.m?C.emerald:C.emerald+"88", borderRadius:"3px 3px 0 0", minHeight:2 }} />} {d.exp>0&&<div style={{ width:"100%", height:`${(d.exp/maxVal)*60}px`, background:viewMonth===d.m?C.rose:C.rose+"88", borderRadius:"3px 3px 0 0", minHeight:2 }} />} </div> <span style={{ fontSize:9, color:viewMonth===d.m?C.navy:C.muted, fontWeight:viewMonth===d.m?800:500 }}>{d.m}월</span> </div> ))} </div> <div style={{ display:"flex", gap:16, marginTop:8 }}> <span style={{ fontSize:11, color:C.emerald }}>■ 수입</span> <span style={{ fontSize:11, color:C.rose }}>■ 지출</span> {viewMonth>0&&<span style={{ fontSize:11, color:C.navy, fontWeight:700 }}>{viewMonth}월 선택됨</span>} </div> </div> <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}> {[{v:0,l:"전체"},...Array.from({length:12},(_,i)=>({v:i+1,l:`${i+1}월`}))].map(({v,l})=>( <button key={v} onClick={()=>setViewMonth(v)} style={{ padding:"5px 11px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${viewMonth===v?C.navy:C.border}`, background:viewMonth===v?C.navy:"transparent", color:viewMonth===v?"#fff":C.muted }}>{l}</button> ))} </div> {loading ? ( <div style={{ textAlign:"center", padding:40, color:C.muted }}>불러오는 중...</div> ) : filtered.length === 0 ? ( <EmptyState icon="📒" title="내역이 없습니다" desc="수입·지출 내역을 추가해보세요" hint="수금 현황에서 납부 처리하면 월세수입이 자동으로 기록됩니다" /> ) : ( <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:17, overflow:"hidden" }}> <div style={{ padding:"10px 20px", background:"#0a0a10", display:"grid", gridTemplateColumns:"90px 60px 100px 1fr 100px 30px 40px", gap:8 }}> {["날짜","구분","분류","메모/연결","금액","",""].map((h,i)=>( <span key={i} style={{ fontSize:10, color:"#8a8a9a", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px" }}>{h}</span> ))} </div> {filtered.map((item,i)=>{ const tenant = item.tenant_id ? tenants.find(t=>t.id===item.tenant_id) : null; return ( <div key={item.id} style={{ display:"grid", gridTemplateColumns:"90px 60px 100px 1fr 100px 30px 40px", gap:8, padding:"12px 20px", borderTop:`1px solid ${C.border}`, background:i%2===0?"transparent":C.faint, alignItems:"center" }}> <span style={{ fontSize:12, color:C.muted }}>{item.date}</span> <span style={{ fontSize:11, fontWeight:800, color:item.type==="income"?C.emerald:C.rose, background:item.type==="income"?"rgba(15,165,115,0.1)":"rgba(232,68,90,0.1)", padding:"2px 8px", borderRadius:20, textAlign:"center" }}>{item.type==="income"?"수입":"지출"}</span> <span style={{ fontSize:12, color:C.navy, fontWeight:600 }}>{item.category}</span> <div> {item.memo&&<p style={{ fontSize:13, color:C.navy }}>{item.memo}</p>} {tenant&&<p style={{ fontSize:11, color:C.muted }}>👤 {tenant.name}</p>} </div> <span style={{ fontSize:14, fontWeight:800, color:item.type==="income"?C.emerald:C.rose }}>{item.type==="income"?"+":"-"}{(item.amount||0).toLocaleString()}만원</span>
              {/* ✅ #10: 자동 기록 뱃지 */}
              <span style={{ fontSize:9, fontWeight:700, color: item.auto_generated ? "#5b4fcf" : "transparent", background: item.auto_generated ? "rgba(91,79,207,0.1)" : "transparent", padding:"2px 4px", borderRadius:4, whiteSpace:"nowrap" }}>{item.auto_generated ? "자동" : ""}</span>
              <button onClick={()=>del(item.id)} style={{ width:28,height:28,borderRadius:7,border:"none",background:"rgba(232,68,90,0.1)",color:C.rose,fontSize:12,cursor:"pointer" }}>×</button>
            </div>

      {/* ✅ ⑥ CSV 가져오기 모달 */}
      {showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onImport={async (rows) => {
            let ok = 0;
            for (const row of rows) {
              try { await addLedger({ date: row.date, type: row.type, category: row.category, memo: row.memo, amount: Number(row.amount), auto: false }); ok++; } catch {}
            }
            toast(`✅ ${ok}건 가져오기 완료`);
            setShowCsvImport(false);
          }}
        />
      )}
  ); }

// ✅ ⑥ CSV 가져오기 모달
function CsvImportModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g,""));
      if (cols.length < 5) continue;
      rows.push({ date:cols[0], type:cols[1]==="지출"?"지출":"수입", category:cols[2]||"기타", memo:cols[3]||"", amount:Number(cols[4].replace(/[^0-9]/g,""))||0 });
    }
    return rows;
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (!rows.length) { setError("CSV 형식 오류: 날짜,구분,분류,메모,금액 순이어야 합니다."); setPreview([]); return; }
        setPreview(rows); setError("");
      } catch { setError("파일을 읽을 수 없습니다."); }
    };
    reader.readAsText(f, "utf-8");
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={e => e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"var(--surface)", borderRadius:18, padding:24, width:"100%", maxWidth:500, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:17, fontWeight:800, color:"var(--text)", margin:0 }}>📥 CSV 가져오기</h3>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:"none", background:"var(--surface2)", cursor:"pointer", fontSize:14 }}>✕</button>
        </div>
        <div style={{ background:"rgba(15,165,115,0.07)", border:"1px solid rgba(15,165,115,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <p style={{ fontSize:12, fontWeight:700, color:"#0fa573", marginBottom:4 }}>📋 CSV 형식</p>
          <p style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.8, margin:0, fontFamily:"monospace" }}>날짜,구분,분류,메모,금액<br/>2026-04-01,수입,월세수입,홍길동 4월,120<br/>2026-04-03,지출,수리비,보일러 교체,35</p>
        </div>
        <label style={{ display:"block", border:"2px dashed var(--border)", borderRadius:12, padding:"20px", textAlign:"center", cursor:"pointer", marginBottom:12, background:file?"rgba(15,165,115,0.04)":"transparent" }}>
          <input type="file" accept=".csv,.txt" onChange={handleFile} style={{ display:"none" }} />
          {file ? <div><p style={{ fontSize:14, fontWeight:700, color:"#0fa573", marginBottom:3 }}>✅ {file.name}</p><p style={{ fontSize:12, color:"var(--text-muted)" }}>클릭해서 다른 파일 선택</p></div>
          : <div><p style={{ fontSize:22, marginBottom:6 }}>📄</p><p style={{ fontSize:14, fontWeight:600, color:"var(--text)", marginBottom:3 }}>CSV 파일 선택</p><p style={{ fontSize:12, color:"var(--text-muted)" }}>클릭 또는 드래그</p></div>}
        </label>
        {error && <p style={{ fontSize:12, color:"#e8445a", marginBottom:10, padding:"8px 12px", background:"rgba(232,68,90,0.08)", borderRadius:8 }}>⚠️ {error}</p>}
        {preview.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:7 }}>미리보기 ({preview.length}건)</p>
            <div style={{ background:"var(--surface2)", borderRadius:10, overflow:"hidden", maxHeight:160, overflowY:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead><tr style={{ background:"var(--border)" }}>{["날짜","구분","분류","메모","금액"].map(h=><th key={h} style={{ padding:"5px 8px", textAlign:"left", fontWeight:700, color:"var(--text-muted)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {preview.slice(0,8).map((r,i)=><tr key={i} style={{ borderBottom:"1px solid var(--border)" }}><td style={{ padding:"5px 8px", color:"var(--text-muted)" }}>{r.date}</td><td style={{ padding:"5px 8px", color:r.type==="수입"?"#0fa573":"#e8445a", fontWeight:700 }}>{r.type}</td><td style={{ padding:"5px 8px", color:"var(--text-muted)" }}>{r.category}</td><td style={{ padding:"5px 8px", color:"var(--text)", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.memo}</td><td style={{ padding:"5px 8px", fontWeight:700 }}>{r.amount.toLocaleString()}만</td></tr>)}
                  {preview.length>8&&<tr><td colSpan={5} style={{ padding:"5px 8px", color:"var(--text-muted)", textAlign:"center" }}>외 {preview.length-8}건...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
          <button onClick={async()=>{ if(!preview.length)return; setImporting(true); await onImport(preview); setImporting(false); }} disabled={!preview.length||importing} style={{ flex:2, padding:"12px", borderRadius:11, background:preview.length?"linear-gradient(135deg,#0fa573,#059669)":"#d1d5db", border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:preview.length?"pointer":"not-allowed", opacity:importing?0.7:1 }}>
            {importing?"가져오는 중...":`${preview.length}건 가져오기`}
          </button>
        </div>
      </div>
    </div>
  );
})} <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", gap:24 }}> <span style={{ fontSize:12, color:C.emerald, fontWeight:700 }}>수입 {totalIncome.toLocaleString()}만원</span> <span style={{ fontSize:12, color:C.rose, fontWeight:700 }}>지출 {totalExpense.toLocaleString()}만원</span> <span style={{ fontSize:14, fontWeight:900, color:netIncome>=0?C.indigo:C.rose }}>순수익 {netIncome.toLocaleString()}만원</span> </div> </div> )}

    {showForm && ( <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setShowForm(false)}> <div style={{ background:C.surface,borderRadius:20,padding:28,width:"min(460px,94vw)",maxHeight:"90vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}> <h3 style={{ fontSize:17, fontWeight:800, color:C.navy, marginBottom:20 }}>내역 추가</h3> <div style={{ display:"flex", flexDirection:"column", gap:14 }}> <div style={{ display:"flex", gap:8 }}> {[{v:"income",l:"수입",c:C.emerald},{v:"expense",l:"지출",c:C.rose}].map(({v,l,c})=>( <button key={v} onClick={()=>setForm(f=>({...f,type:v,category:v==="income"?INCOME_CATS[0]:EXPENSE_CATS[0]}))} style={{ flex:1, padding:"11px", borderRadius:11, fontWeight:700, fontSize:13, cursor:"pointer", border:`2px solid ${form.type===v?c:C.border}`, background:form.type===v?`${c}15`:"transparent", color:form.type===v?c:C.muted }}>{l}</button> ))} </div> <div> <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>날짜</p> <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }} /> </div> <div> <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>분류</p> <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}> {(form.type==="income"?INCOME_CATS:EXPENSE_CATS).map(c=>( <button key={c} onClick={()=>setForm(f=>({...f,category:c}))} style={{ padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer", border:`1px solid ${form.category===c?(form.type==="income"?C.emerald:C.rose):C.border}`, background:form.category===c?`${form.type==="income"?C.emerald:C.rose}18`:"transparent", color:form.category===c?(form.type==="income"?C.emerald:C.rose):C.muted }}>{c}</button> ))} </div> </div> <div> <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>금액 (만원)</p> <input type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0" style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }} /> </div> {tenants.length>0&&( <div> <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>연결 임차인 (선택)</p> <select value={form.tenant_id} onChange={e=>setForm(f=>({...f,tenant_id:e.target.value}))} style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }}> <option value="">선택 안 함</option> {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)} </select> </div> )} <div> <p style={{ fontSize:11,color:C.muted,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginBottom:6 }}>메모</p> <input value={form.memo} onChange={e=>setForm(f=>({...f,memo:e.target.value}))} placeholder="간단한 메모..." style={{ width:"100%",padding:"11px 13px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.navy,background:C.faint }} /> </div> <div style={{ display:"flex",gap:9,marginTop:4 }}> <button onClick={()=>setShowForm(false)} style={{ flex:1,padding:"12px",borderRadius:11,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontWeight:600,fontSize:13,cursor:"pointer" }}>취소</button> <button onClick={save} disabled={saving} className="btn-primary" style={{ flex:2,padding:"12px",borderRadius:11,background:`linear-gradient(135deg,${C.navy},${C.purple})`,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer" }}>{saving?"저장 중...":"저장하기"}</button> </div> </div> </div> </div> )}
  </div> ); }