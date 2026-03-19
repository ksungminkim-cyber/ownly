"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../../context/AppContext";

const C = {
  navy: "#1a2744", purple: "#5b4fcf", emerald: "#0fa573", rose: "#e8445a",
  amber: "#e8960a", border: "#e8e6e0", surface: "#ffffff", faint: "#f8f7f4", muted: "#8a8a9a",
};
const MAX_RATE = 5;

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
  const [selectedTid, setSelectedTid] = useState("");
  const [currentRent, setCurrentRent] = useState(50);
  const [currentDep, setCurrentDep] = useState(1000);
  const [rate, setRate] = useState(5);
  const [convertDep, setConvertDep] = useState(false);

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
  const DEP_TO_RENT_RATE = 5.5;
  const depToRentMonthly = Math.round((depIncrease * 10000 * DEP_TO_RENT_RATE) / 100 / 12);
  const isOverLimit = rate > MAX_RATE;

  return (
    <div className="page-in page-padding" style={{ maxWidth: 720, fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        {"\u2190"} {"\ub4a4\ub85c\uac00\uae30"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${C.navy},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{"\ud83d\udcc8"}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: "-.4px" }}>{"\uc784\ub300\ub8cc \uc778\uc0c1 \uacc4\uc0b0\uae30"}</h1>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.amber, background: "rgba(232,150,10,0.12)", padding: "3px 8px", borderRadius: 6 }}>PLUS</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>{"5% \uc0c1\ud55c\uc81c \uae30\uc900\uc73c\ub85c \uc778\uc0c1\uc561\uc744 \uc790\ub3d9 \uacc4\uc0b0\ud569\ub2c8\ub2e4"}</p>
        </div>
      </div>

      <div style={{ background: "rgba(26,39,68,0.05)", border: `1px solid ${C.navy}22`, borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18 }}>{"\u2696\ufe0f"}</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, marginBottom: 2 }}>{"\uc8fc\ud0dd\uc784\ub300\ucc28\ubcf4\ud638\ubc95 \u2014 \uc784\ub300\ub8cc \uc778\uc0c1 \uc0c1\ud55c 5%"}</p>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{"\uacc4\uc57d\uac31\uc2e0\uccad\uad6c\uad8c \ud589\uc0ac \uc2dc \uc784\ub300\ub8cc(\uc6d4\uc138\xb7\ubcf4\uc99d\uae08) \uc778\uc0c1\uc740 \uc9c1\uc804 \uae08\uc561\uc758 5%\ub97c \ucd08\uacfc\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4. \uc0c1\uac00\ub294 5%, \uc8fc\ud0dd\uc740 5% \uc0c1\ud55c\uc774 \uc801\uc6a9\ub429\ub2c8\ub2e4."}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tenants.length > 0 && (
            <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>{"\uc784\ucc28\uc778 \ubd88\ub7ec\uc624\uae30"}</p>
              <select onChange={e => onSelectTenant(e.target.value)} value={selectedTid}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, color: C.navy, cursor: "pointer", appearance: "none" }}>
                <option value="">{"\uc9c1\uc811 \uc785\ub825"}</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {"\u2014"} {t.rent}{"\ub9cc\uc6d0/\uc6d4"}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{"\ud604\uc7ac \uc6d4\uc138"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input type="number" value={currentRent} min={0} onChange={e => { const v=Number(e.target.value); if(!isNaN(v)&&v>=0) setCurrentRent(v); }}
                  style={{ width:90, padding:"3px 7px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
                <span style={{ fontSize: 12, color: C.muted }}>{"\ub9cc\uc6d0"}</span>
              </div>
            </div>
            <input type="range" min={10} max={2000} step={10} value={Math.min(currentRent, 2000)} onChange={e => setCurrentRent(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>{"10\ub9cc\uc6d0"}</span>
              <span style={{ fontSize: 10, color: C.muted }}>{"2,000\ub9cc\uc6d0+"}</span>
            </div>
          </div>

          <div style={{ background: C.faint, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{"\ud604\uc7ac \ubcf4\uc99d\uae08"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input type="number" value={currentDep} min={0} onChange={e => { const v=Number(e.target.value); if(!isNaN(v)&&v>=0) setCurrentDep(v); }}
                  style={{ width:90, padding:"3px 7px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, fontWeight:700, color:C.navy, textAlign:"right", outline:"none", background:"#fff" }} />
                <span style={{ fontSize: 12, color: C.muted }}>{"\ub9cc\uc6d0"}</span>
              </div>
            </div>
            <input type="range" min={0} max={200000} step={1000} value={Math.min(currentDep, 200000)} onChange={e => setCurrentDep(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>0</span>
              <span style={{ fontSize: 10, color: C.muted }}>{"20\uc5b5+"}</span>
            </div>
          </div>

          <div style={{ background: isOverLimit ? "rgba(232,68,90,0.06)" : C.faint, border: `1px solid ${isOverLimit ? C.rose + "40" : "transparent"}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isOverLimit ? C.rose : C.navy }}>{"\uc778\uc0c1\ub960"}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: isOverLimit ? C.rose : C.navy }}>{rate}<span style={{ fontSize: 12 }}>%</span></span>
            </div>
            <input type="range" min={1} max={10} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))}
              style={{ width: "100%", accentColor: isOverLimit ? C.rose : C.navy, height: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.muted }}>1%</span>
              <span style={{ fontSize: 10, color: isOverLimit ? C.rose : C.muted, fontWeight: isOverLimit ? 700 : 400 }}>{"5% \uc0c1\ud55c"}</span>
              <span style={{ fontSize: 10, color: C.muted }}>10%</span>
            </div>
            {isOverLimit && (
              <p style={{ fontSize: 11, color: C.rose, fontWeight: 700, marginTop: 8 }}>{"\u26a0\ufe0f 5% \ucd08\uacfc \u2014 \uacc4\uc57d\uac31\uc2e0\uccad\uad6c\uad8c \ud589\uc0ac \uc2dc \ubc95\uc801 \uc0c1\ud55c\uc744 \ub118\uc2b5\ub2c8\ub2e4. \uacc4\uc0b0\uc740 5%\ub85c \uc801\uc6a9\ub429\ub2c8\ub2e4."}</p>
            )}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 16px", background: C.faint, borderRadius: 12 }}>
            <input type="checkbox" checked={convertDep} onChange={e => setConvertDep(e.target.checked)} className="custom-check" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{"\ubcf4\uc99d\uae08 \uc778\uc0c1\ubd84 \u2192 \uc6d4\uc138 \uc804\ud658 \uacc4\uc0b0"}</p>
              <p style={{ fontSize: 11, color: C.muted }}>{"\uc804\uc6d4\uc138 \uc804\ud658\uc728 5.5% \uae30\uc900"}</p>
            </div>
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: `linear-gradient(135deg,${C.navy}12,${C.purple}08)`, border: `2px solid ${C.navy}20`, borderRadius: 20, padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 8 }}>{"\uc778\uc0c1 \ud6c4 \uc6d4\uc138"}</p>
            <p style={{ fontSize: 52, fontWeight: 900, color: C.navy, letterSpacing: "-2px", lineHeight: 1 }}>{newRent.toLocaleString()}<span style={{ fontSize: 20 }}>{"\ub9cc\uc6d0"}</span></p>
            <div style={{ marginTop: 14, padding: "8px 14px", background: C.emerald + "15", borderRadius: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>{"\uc6d4 +"}{rentIncrease.toLocaleString()}{"\ub9cc\uc6d0 \uc99d\uac00"}</p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{"\uc5f0 +"}{(rentIncrease * 12).toLocaleString()}{"\ub9cc\uc6d0"}</p>
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", marginBottom: 12 }}>{"\uc0c1\uc138 \uacc4\uc0b0 \ub0b4\uc5ed"}</p>
            <InfoRow label={"\ud604\uc7ac \uc6d4\uc138"} value={`${currentRent.toLocaleString()}\ub9cc\uc6d0`} />
            <InfoRow label={`\uc801\uc6a9 \uc778\uc0c1\ub960 (${actualRate}%)`} value={`+${rentIncrease.toLocaleString()}\ub9cc\uc6d0`} color={C.emerald} />
            <InfoRow label={"\uc778\uc0c1 \ud6c4 \uc6d4\uc138"} value={`${newRent.toLocaleString()}\ub9cc\uc6d0`} bold separator />
            <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
            <InfoRow label={"\ud604\uc7ac \ubcf4\uc99d\uae08"} value={`${currentDep.toLocaleString()}\ub9cc\uc6d0`} />
            <InfoRow label={`\uc801\uc6a9 \uc778\uc0c1\ub960 (${actualRate}%)`} value={`+${depIncrease.toLocaleString()}\ub9cc\uc6d0`} color={C.emerald} />
            <InfoRow label={"\uc778\uc0c1 \ud6c4 \ubcf4\uc99d\uae08"} value={`${newDep.toLocaleString()}\ub9cc\uc6d0`} bold separator />
          </div>

          {convertDep && (
            <div style={{ background: "rgba(91,79,207,0.06)", border: `1px solid ${C.purple}30`, borderRadius: 16, padding: "16px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.purple, letterSpacing: "1px", marginBottom: 12 }}>{"\ubcf4\uc99d\uae08 \uc778\uc0c1\ubd84 \u2192 \uc6d4\uc138 \uc804\ud658"}</p>
              <InfoRow label={"\ubcf4\uc99d\uae08 \uc778\uc0c1\ubd84"} value={`${depIncrease.toLocaleString()}\ub9cc\uc6d0`} />
              <InfoRow label={"\uc804\ud658\uc728 (5.5%)"} value="" />
              <InfoRow label={"\ucd94\uac00 \uc6d4\uc138 \ud658\uc0b0"} value={`+${depToRentMonthly.toLocaleString()}\ub9cc\uc6d0/\uc6d4`} color={C.purple} bold separator />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                {"\ubcf4\uc99d\uae08 \uc778\uc0c1 \ub300\uc2e0 \uc6d4\uc138\ub85c \ubc1b\uc744 \uacbd\uc6b0 \uc6d4 "}{depToRentMonthly.toLocaleString()}{"\ub9cc\uc6d0 \ucd94\uac00 \uc218\ub839 \uac00\ub2a5"}
              </p>
            </div>
          )}

          <button onClick={() => window.print()} className="no-print"
            style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg,${C.navy},${C.purple})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 16px ${C.navy}30` }}>
            {"\ud83d\udda8\ufe0f \uacc4\uc0b0 \uacb0\uacfc PDF \ucd9c\ub825"}
          </button>
        </div>
      </div>
    </div>
  );
}
