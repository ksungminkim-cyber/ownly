"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = {
  navy: "#1a2744", purple: "#5b4fcf", emerald: "#0fa573",
  rose: "#e8445a", amber: "#e8960a", border: "#e8e6e0",
  surface: "#ffffff", faint: "#f8f7f4", muted: "#8a8a9a",
};

const MAX_RATE = 5; // 二쇳깮?꾨?李⑤낫?몃쾿 ?곹븳 5%

function InfoRow({ label, value, color, bold, separator }) {
  return (
    <>
      {separator && <div style={{ height: 1, background: C.border, margin: "8px 0" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
        <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 900 : 700, color: color || C.navy }}>{value}</span>
      </div>
    </>
  );
}

export default function RentIncreasePage() {
  const router = useRouter();
  const { tenants } = useApp();

  const [mode, setMode] = useState("manual"); // manual | tenant
  const [selectedTid, setSelectedTid] = useState("");
  const [currentRent, setCurrentRent] = useState(50);
  const [currentDep, setCurrentDep] = useState(1000);
  const [rate, setRate] = useState(5);
  const [convertDep, setConvertDep] = useState(false); // 蹂댁쬆湲??붿꽭 ?꾪솚 ?щ?

  // ?좏깮???꾩감???뺣낫 ?먮룞 ?낅젰
  const onSelectTenant = (tid) => {
    setSelectedTid(tid);
    const t = tenants.find(x => x.id === tid);
    if (t) {
      setCurrentRent(t.rent || 50);
      setCurrentDep(t.dep ? t.dep / 10000 : 1000);
    }
  };

  const actualRate = Math.min(rate, MAX_RATE);
  const newRent = Math.round(currentRent * (1 + actualRate / 100));
  const rentIncrease = newRent - currentRent;
  const newDep = Math.round(currentDep * (1 + actualRate / 100));
  const depIncrease = newDep - currentDep;

  // 蹂댁쬆湲댿넂?붿꽭 ?꾪솚 (?꾩썡???꾪솚??5.5% 湲곗?)
  const DEP_TO_RENT_RATE = 5.5;
  const depToRentMonthly = Math.round((depIncrease * 10000 * DEP_TO_RENT_RATE) / 100 / 12);

  const isOverLimit = rate > MAX_RATE;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        ???ㅻ줈媛湲?      </button>

      {/* ?ㅻ뜑 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${C.navy},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>?뱢</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: "-.4px" }}>?꾨?猷??몄긽 怨꾩궛湲?/h1>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.amber, background: "rgba(232,150,10,0.12)", padding: "3px 8px", borderRadius: 6 }}>PLUS</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>5% ?곹븳??湲곗??쇰줈 ?몄긽?≪쓣 ?먮룞 怨꾩궛?⑸땲??/p>
        </div>
      </div>

      {/* 踰뺤쟻 ?덈궡 諛곕꼫 */}
      <div style={{ background: "rgba(26,39,68,0.05)", border: `1px solid ${C.navy}22`, borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18 }}>?뽳툘</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, marginBottom: 2 }}>二쇳깮?꾨?李⑤낫?몃쾿 ???꾨?猷??몄긽 ?곹븳 5%</p>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>怨꾩빟媛깆떊泥?뎄沅??됱궗 ???꾨?猷??붿꽭쨌蹂댁쬆湲? ?몄긽? 吏곸쟾 湲덉븸??5%瑜?珥덇낵?????놁뒿?덈떎. ?곴???5%, 二쇳깮? 5% ?곹븳???곸슜?⑸땲??</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* ?낅젰 ?곸뿭 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ?꾩감??遺덈윭?ㅺ린 */}
          {tenants.length > 0 && (
            <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>?꾩감??遺덈윭?ㅺ린</p>
              <select onChange={e => onSelectTenant(e.target.value)} value={selectedTid}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, color: C.navy, cursor: "pointer", appearance: "none" }}>
                <option value="">吏곸젒 ?낅젰</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ??{t.rent}留뚯썝/??/option>
                ))}
              </select>
            </div>
          )}

          {/* ?꾩옱 ?붿꽭 ?щ씪?대뜑 */}
          <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>?꾩옱 ?붿꽭</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input type="number" value={currentRent} min={0} onChange={e => { const v=Number(e.target.value); if(!isNaN(v)&&v>=0) setCurrentRent(v); }}
                  style={{ width:90, padding:"3px 7px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
                <span style={{ fontSize: 12, color: C.muted }}>留뚯썝</span>
              </div>
            </div>
            <input type="range" min={10} max={2000} step={10} value={Math.min(currentRent, 2000)} onChange={e => setCurrentRent(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>10留뚯썝</span>
              <span style={{ fontSize: 10, color: C.muted }}>2,000留뚯썝+</span>
            </div>
          </div>

          {/* ?꾩옱 蹂댁쬆湲??щ씪?대뜑 */}
          <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>?꾩옱 蹂댁쬆湲?/span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input type="number" value={currentDep} min={0} onChange={e => { const v=Number(e.target.value); if(!isNaN(v)&&v>=0) setCurrentDep(v); }}
                  style={{ width:90, padding:"3px 7px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
                <span style={{ fontSize: 12, color: C.muted }}>留뚯썝</span>
              </div>
            </div>
            <input type="range" min={0} max={200000} step={1000} value={Math.min(currentDep, 200000)} onChange={e => setCurrentDep(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>0</span>
              <span style={{ fontSize: 10, color: C.muted }}>20??</span>
            </div>
          </div>

          {/* ?몄긽瑜??щ씪?대뜑 */}
          <div style={{ background: isOverLimit ? "rgba(232,68,90,0.06)" : C.faint, border: `1px solid ${isOverLimit ? C.rose + "40" : "transparent"}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isOverLimit ? C.rose : C.navy }}>?몄긽瑜?/span>
              <span style={{ fontSize: 18, fontWeight: 900, color: isOverLimit ? C.rose : C.navy }}>{rate}<span style={{ fontSize: 12 }}>%</span></span>
            </div>
            <input type="range" min={1} max={10} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))}
              style={{ width: "100%", accentColor: isOverLimit ? C.rose : C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>1%</span>
              <span style={{ fontSize: 10, color: isOverLimit ? C.rose : C.muted, fontWeight: isOverLimit ? 700 : 400 }}>5% ?곹븳</span>
              <span style={{ fontSize: 10, color: C.muted }}>10%</span>
            </div>
            {isOverLimit && (
              <p style={{ fontSize: 11, color: C.rose, fontWeight: 700, marginTop: 8 }}>?좑툘 5% 珥덇낵 ??怨꾩빟媛깆떊泥?뎄沅??됱궗 ??踰뺤쟻 ?곹븳???섏뒿?덈떎. 怨꾩궛? 5%濡??곸슜?⑸땲??</p>
            )}
          </div>

          {/* 蹂댁쬆湲댿넂?붿꽭 ?꾪솚 ?듭뀡 */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 16px", background: C.faint, borderRadius: 12 }}>
            <input type="checkbox" checked={convertDep} onChange={e => setConvertDep(e.target.checked)} className="custom-check" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>蹂댁쬆湲??몄긽遺????붿꽭 ?꾪솚 怨꾩궛</p>
              <p style={{ fontSize: 11, color: C.muted }}>?꾩썡???꾪솚??5.5% 湲곗?</p>
            </div>
          </label>
        </div>

        {/* 寃곌낵 ?곸뿭 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ?듭떖 寃곌낵 移대뱶 */}
          <div style={{ background: `linear-gradient(135deg,${C.navy}12,${C.purple}08)`, border: `2px solid ${C.navy}20`, borderRadius: 20, padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 8 }}>?몄긽 ???붿꽭</p>
            <p style={{ fontSize: 52, fontWeight: 900, color: C.navy, letterSpacing: "-2px", lineHeight: 1 }}>{newRent.toLocaleString()}<span style={{ fontSize: 20 }}>留뚯썝</span></p>
            <div style={{ marginTop: 14, padding: "8px 14px", background: C.emerald + "15", borderRadius: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>??+{rentIncrease.toLocaleString()}留뚯썝 利앷?</p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>??+{(rentIncrease * 12).toLocaleString()}留뚯썝</p>
            </div>
          </div>

          {/* ?곸꽭 ?댁뿭 */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 12 }}>?곸꽭 怨꾩궛 ?댁뿭</p>
            <InfoRow label="?꾩옱 ?붿꽭" value={`${currentRent.toLocaleString()}留뚯썝`} />
            <InfoRow label={`?곸슜 ?몄긽瑜?(${actualRate}%)`} value={`+${rentIncrease.toLocaleString()}留뚯썝`} color={C.emerald} />
            <InfoRow label="?몄긽 ???붿꽭" value={`${newRent.toLocaleString()}留뚯썝`} bold separator />
            <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
            <InfoRow label="?꾩옱 蹂댁쬆湲? value={`${currentDep.toLocaleString()}留뚯썝`} />
            <InfoRow label={`?곸슜 ?몄긽瑜?(${actualRate}%)`} value={`+${depIncrease.toLocaleString()}留뚯썝`} color={C.emerald} />
            <InfoRow label="?몄긽 ??蹂댁쬆湲? value={`${newDep.toLocaleString()}留뚯썝`} bold separator />
          </div>

          {/* 蹂댁쬆湲댿넂?붿꽭 ?꾪솚 寃곌낵 */}
          {convertDep && (
            <div style={{ background: "rgba(91,79,207,0.06)", border: `1px solid ${C.purple}30`, borderRadius: 16, padding: "16px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.purple, letterSpacing: "1px", marginBottom: 12 }}>蹂댁쬆湲??몄긽遺????붿꽭 ?꾪솚</p>
              <InfoRow label="蹂댁쬆湲??몄긽遺? value={`${depIncrease.toLocaleString()}留뚯썝`} />
              <InfoRow label="?꾪솚??(5.5%)" value="" />
              <InfoRow label="異붽? ?붿꽭 ?섏궛" value={`+${depToRentMonthly.toLocaleString()}留뚯썝/??} color={C.purple} bold separator />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                蹂댁쬆湲??몄긽 ????붿꽭濡?諛쏆쓣 寃쎌슦 ??{depToRentMonthly.toLocaleString()}留뚯썝 異붽? ?섎졊 媛??              </p>
            </div>
          )}

          {/* PDF 異쒕젰 */}
          <button onClick={() => window.print()} className="no-print"
            style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg,${C.navy},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 16px ${C.navy}30` }}>
            ?뼥截?怨꾩궛 寃곌낵 PDF 異쒕젰
          </button>
        </div>
      </div>
    </div>
  );
}

