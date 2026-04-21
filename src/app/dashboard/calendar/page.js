"use client"; import { useState, useMemo, useEffect } from "react"; import { useRouter } from "next/navigation"; import { SectionLabel } from "../../../components/shared"; import { C } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; const MONTH_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]; const DAY_KO = ["일","월","화","수","목","금","토"]; export default function CalendarPage() { const router = useRouter(); const { tenants, contracts, payments, vacancies, refreshData } = useApp(); const today = new Date(); const [year, setYear] = useState(today.getFullYear()); const [month, setMonth] = useState(today.getMonth()); const [selected, setSelected] = useState(null); useEffect(() => { refreshData(); }, []); const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); setSelected(null); }; const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); setSelected(null); }; const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today.getDate()); }; const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDay = new Date(year, month, 1).getDay(); const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear(); const getPayDayForMonth = (t, yr, mo) => { const pd = Number(t.pay_day); if (!pd || pd === 0) return 1; if (pd === 99) return new Date(yr, mo + 1, 0).getDate(); const lastDay = new Date(yr, mo + 1, 0).getDate(); return Math.min(pd, lastDay); };

  // 공실 일수 계산
  const vacantDays = (since) => {
    const d = Math.ceil((new Date() - new Date(since)) / 86400000);
    return d < 0 ? 0 : d;
  };

  const eventMap = useMemo(() => {
    const map = {};
    const add = (date, ev) => { if (!map[date]) map[date] = []; map[date].push(ev); };

    // 기존: 입주 세입자 수금/만료 이벤트
    tenants.filter(t => t.status !== "공실").forEach((t) => {
      if (t.end_date) {
        const d = new Date(t.end_date);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "expiry", label: t.name, sub: "계약만료", color: "#e8445a" });
      }
      const payDay = getPayDayForMonth(t, year, month);
      const monthPayment = (payments || []).find(
        p => p.tid === t.id && Number(p.month) === month + 1 && (Number(p.year) || year) === year
      );
      if (monthPayment?.paid) {
        const d = new Date(monthPayment.paid);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "paid", label: t.name, sub: "월세납부", color: "#0fa573" });
      } else {
        add(payDay, { type: monthPayment?.status === "미납" ? "unpaid" : "due", label: t.name, sub: monthPayment?.status === "미납" ? "미납" : "수금예정", color: monthPayment?.status === "미납" ? C.rose : C.amber });
      }
    });

    // 기존: 계약서 이벤트
    (contracts || []).forEach((c) => {
      if (c.start_date) { const d = new Date(c.start_date); if (d.getFullYear() === year && d.getMonth() === month) add(d.getDate(), { type: "contract_start", label: c.tenant_name || c.tenantName || "", sub: "계약시작", color: "#1a2744" }); }
      if (c.end_date) { const d = new Date(c.end_date); if (d.getFullYear() === year && d.getMonth() === month) add(d.getDate(), { type: "contract_end", label: c.tenant_name || c.tenantName || "", sub: "계약종료", color: "#5b4fcf" }); }
    });

    // 기존: 세금 신고 이벤트
    const TAX_EVENTS = [
      { month: 5, day: 31, label: "종합소득세 신고", sub: "신고 마감", color: "#7c3aed", type: "tax" },
      { month: 1, day: 25, label: "부가세 신고(2기)", sub: "신고 마감", color: "#dc2626", type: "tax" },
      { month: 7, day: 25, label: "부가세 신고(1기)", sub: "신고 마감", color: "#dc2626", type: "tax" },
      { month: 11, day: 30, label: "종합소득세 중간예납", sub: "납부 마감", color: "#9333ea", type: "tax" },
    ];
    TAX_EVENTS.forEach(ev => { if (ev.month === month + 1) add(ev.day, { type: ev.type, label: ev.label, sub: ev.sub, color: ev.color }); });

    // ✅ 공실 이벤트 추가
    // 공실 중인 세입자 (status === "공실")
    const vacantTenants = tenants.filter(t => t.status === "공실");
    // vacancies 테이블 직접 등록된 공실
    const allVacant = [
      ...vacantTenants.map(t => ({ id: t.id, addr: t.addr, since: t.start_date || new Date().toISOString().slice(0,10), name: t.name || t.addr, pType: t.pType })),
      ...(vacancies || []).map(v => ({ id: v.id, addr: v.addr, since: v.vacant_since || v.vacantSince || new Date().toISOString().slice(0,10), name: v.addr, pType: v.p_type })),
    ];

    allVacant.forEach(v => {
      const sinceDate = new Date(v.since);
      const sinceYear = sinceDate.getFullYear();
      const sinceMonth = sinceDate.getMonth();
      const sinceDay = sinceDate.getDate();

      // ① 공실 시작일 표시 (해당 월에 시작했을 때)
      if (sinceYear === year && sinceMonth === month) {
        add(sinceDay, { type: "vacant_start", label: v.name, sub: "공실 시작", color: "#e8445a" });
      }

      // ② 공실 진행 중 — 이번 달 1일에 "공실 n일째" 이벤트
      const isOngoing = sinceDate <= new Date(year, month + 1, 0); // 공실 시작이 이번 달 말 이전
      const isNotEnded = true; // 아직 임대 완료 처리 안 됨
      if (isOngoing && isNotEnded && !(sinceYear === year && sinceMonth === month)) {
        // 이달 1일에 공실 경과일 표시
        const days = Math.ceil((new Date(year, month, 1) - sinceDate) / 86400000);
        if (days > 0) {
          add(1, { type: "vacant_ongoing", label: v.name, sub: `공실 ${days}일째`, color: "#f97316" });
        }
      }

      // ③ 30일·60일·90일 마일스톤 — 해당 날짜가 이번 달이면 표시
      [30, 60, 90].forEach(milestone => {
        const msDate = new Date(sinceDate.getTime() + milestone * 86400000);
        if (msDate.getFullYear() === year && msDate.getMonth() === month) {
          const color = milestone === 90 ? "#e8445a" : milestone === 60 ? "#f97316" : "#e8960a";
          add(msDate.getDate(), {
            type: "vacant_milestone",
            label: v.name,
            sub: `공실 ${milestone}일`,
            color,
          });
        }
      });
    });

    return map;
  }, [tenants, contracts, payments, vacancies, year, month]);

  const selectedEvents = selected ? (eventMap[selected] || []) : [];
  const allEvents = useMemo(() => {
    return Object.entries(eventMap).sort(([a], [b]) => Number(a) - Number(b)).flatMap(([date, evs]) => evs.map(ev => ({ ...ev, date: Number(date) })));
  }, [eventMap]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const TYPE_ICON = {
    expiry: "⚠️", paid: "✅", unpaid: "🚨", due: "💰",
    contract_start: "📋", contract_end: "📋", tax: "🧾",
    vacant_start: "🚨", vacant_ongoing: "🏚️", vacant_milestone: "📍",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "28px 28px 28px 36px" }}>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>LEASE CALENDAR</SectionLabel>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2744" }}>임대차 캘린더</h1>
        </div>

        {/* 공실 요약 배너 */}
        {(() => {
          const vacantItems = [
            ...tenants.filter(t => t.status === "공실").map(t => ({ addr: t.addr, since: t.start_date, rent: Number(t.rent || 0) + Number(t.maintenance || 0) })),
            ...(vacancies || []).map(v => ({ addr: v.addr, since: v.vacant_since || v.vacantSince, rent: Number(v.expected_rent || v.expectedRent || 0) + Number(v.maintenance || 0) })),
          ];
          if (vacantItems.length === 0) return null;
          const daysOf = (s) => { if (!s) return 0; const d = Math.ceil((new Date() - new Date(s)) / 86400000); return d < 0 ? 0 : d; };
          const maxDays = Math.max(...vacantItems.map(v => daysOf(v.since)));
          const monthlyLoss = vacantItems.reduce((s, v) => s + v.rent, 0);
          const cumulativeLoss = Math.round(vacantItems.reduce((s, v) => s + v.rent * (daysOf(v.since) / 30.44), 0));
          const severityColor = maxDays >= 180 ? "#7c1d1d" : maxDays >= 91 ? "#e8445a" : maxDays >= 61 ? "#f97316" : maxDays >= 15 ? "#e8960a" : "#0fa573";
          const severityLabel = maxDays >= 180 ? "⛔ 초장기" : maxDays >= 91 ? "🚨 장기" : maxDays >= 61 ? "🔔 중기" : maxDays >= 15 ? "⚠️ 주의" : "🟢 신규";
          return (
            <div onClick={() => router.push("/dashboard/vacancy")}
              style={{ marginBottom: 18, padding: "14px 18px", borderRadius: 13, background: `linear-gradient(135deg,${severityColor}12,${severityColor}04)`, border: `1.5px solid ${severityColor}30`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: severityColor, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 3 }}>{severityLabel} · 공실 {vacantItems.length}실</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744" }}>최장 D+{maxDays}일 · 누적 손실 <span style={{ color: severityColor }}>{cumulativeLoss.toLocaleString()}만원</span></p>
                </div>
                <div style={{ width: 1, height: 32, background: severityColor + "30" }} />
                <div>
                  <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, marginBottom: 2 }}>월간 예상 손실</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: severityColor }}>{monthlyLoss.toLocaleString()}만원/월</p>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: severityColor, whiteSpace: "nowrap" }}>공실 관리로 →</span>
            </div>
          );
        })()}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "#ffffff", border: "1px solid #ebe9e3", color: "#1a2744", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#1a2744" }}>{year}년 {MONTH_KO[month]}</span>
            <button onClick={goToday} style={{ padding: "4px 12px", borderRadius: 8, background: C.indigo + "20", border: `1px solid ${C.indigo}40`, color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>오늘</button>
          </div>
          <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "#ffffff", border: "1px solid #ebe9e3", color: "#1a2744", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAY_KO.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? C.rose : i === 6 ? C.indigo : C.muted, padding: "6px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, flex: 1 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />;
            const evs = eventMap[d] || [];
            const isSel = selected === d;
            const col = i % 7;
            const hasVacancy = evs.some(e => e.type?.startsWith("vacant"));
            return (
              <div key={d} onClick={() => setSelected(isSel ? null : d)} style={{ minHeight: 72, borderRadius: 10, padding: "8px 7px", cursor: "pointer", background: isSel ? C.indigo + "25" : isToday(d) ? C.indigo + "12" : hasVacancy ? "rgba(249,115,22,0.04)" : "#ffffff", border: `1px solid ${isSel ? C.indigo : isToday(d) ? C.indigo + "60" : hasVacancy ? "rgba(249,115,22,0.3)" : "#ebe9e3"}`, transition: "all .12s" }}>
                <div style={{ fontSize: 13, fontWeight: isToday(d) ? 800 : 600, color: isToday(d) ? C.indigo : col === 0 ? C.rose : col === 6 ? "#818cf8" : C.text, marginBottom: 4 }}>
                  {d} {isToday(d) && <span style={{ marginLeft: 3, fontSize: 9, background: C.indigo, color: "#fff", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>오늘</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {evs.slice(0, 3).map((ev, j) => (
                    <div key={j} style={{ fontSize: 10, fontWeight: 600, color: ev.color, background: ev.color + "18", borderRadius: 4, padding: "2px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.label} {ev.sub}
                    </div>
                  ))}
                  {evs.length > 3 && <div style={{ fontSize: 10, color: "#8a8a9a" }}>+{evs.length - 3}개</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측 사이드바 */}
      <div style={{ width: 260, borderLeft: "1px solid #ebe9e3", overflowY: "auto", padding: "28px 18px", flexShrink: 0 }}>
        {selected ? (
          <>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>{month+1}월 {selected}일</p>
            {selectedEvents.length === 0 ? <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 20, textAlign: "center" }}>일정 없음</p> : selectedEvents.map((ev, i) => (
              <div key={i} style={{ background: "#ffffff", border: `1px solid ${ev.color}30`, borderLeft: `3px solid ${ev.color}`, borderRadius: 10, padding: "11px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: ev.color, fontWeight: 700, marginBottom: 4 }}>{TYPE_ICON[ev.type] || "📌"} {ev.sub}</div>
                <div style={{ fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{ev.label}</div>
              </div>
            ))}
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>{month+1}월 전체 일정</p>
            {allEvents.length === 0 ? <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 20, textAlign: "center" }}>이번 달 일정 없음</p> : allEvents.map((ev, i) => (
              <div key={i} onClick={() => setSelected(ev.date)} style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderLeft: `3px solid ${ev.color}`, borderRadius: 10, padding: "10px 12px", marginBottom: 7, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: ev.color, fontWeight: 700 }}>{TYPE_ICON[ev.type] || "📌"} {ev.sub}</span>
                  <span style={{ fontSize: 11, color: "#8a8a9a" }}>{month+1}/{ev.date}</span>
                </div>
                <div style={{ fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{ev.label}</div>
              </div>
            ))}
          </>
        )}

        {/* 범례 */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #ebe9e3" }}>
          <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 10 }}>범례</p>
          {[
            { color: "#e8960a", label: "수금 예정" },
            { color: "#0fa573", label: "납부 완료" },
            { color: "#e8445a", label: "미납 / 계약만료" },
            { color: "#1a2744", label: "계약 시작" },
            { color: "#5b4fcf", label: "계약 종료" },
            { color: "#e8445a", label: "🏚️ 공실 시작" },
            { color: "#f97316", label: "🏚️ 공실 진행 중" },
            { color: "#e8960a", label: "📍 공실 30/60일" },
            { color: "#e8445a", label: "📍 공실 90일" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#8a8a9a" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
