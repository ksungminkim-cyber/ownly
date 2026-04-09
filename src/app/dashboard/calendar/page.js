"use client"; import { useState, useMemo, useEffect } from "react"; import { SectionLabel } from "../../../components/shared"; import { C } from "../../../lib/constants"; import { useApp } from "../../../context/AppContext"; const MONTH_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]; const DAY_KO = ["일","월","화","수","목","금","토"]; export default function CalendarPage() { const { tenants, contracts, payments, refreshData } = useApp(); const today = new Date(); const [year, setYear] = useState(today.getFullYear()); const [month, setMonth] = useState(today.getMonth()); const [selected, setSelected] = useState(null); useEffect(() => { refreshData(); }, []); const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); setSelected(null); }; const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); setSelected(null); }; const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today.getDate()); }; const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDay = new Date(year, month, 1).getDay(); const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // ✅ #2 캘린더 납부일 연동: pay_day 기반 실제 납부 예정일 계산
  const getPayDayForMonth = (t, yr, mo) => {
    const pd = Number(t.pay_day);
    if (!pd || pd === 0) return 1; // 기본값 1일
    if (pd === 99) {
      // 말일: 해당 월의 마지막 날
      return new Date(yr, mo + 1, 0).getDate();
    }
    // 해당 월에 그 날짜가 없으면(예: 2월 31일) 말일로 보정
    const lastDay = new Date(yr, mo + 1, 0).getDate();
    return Math.min(pd, lastDay);
  };

  const eventMap = useMemo(() => {
    const map = {};
    const add = (date, ev) => { if (!map[date]) map[date] = []; map[date].push(ev); };

    tenants.filter(t => t.status !== "공실").forEach((t) => {
      // 계약 만료일
      if (t.end_date) {
        const d = new Date(t.end_date);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "expiry", label: t.name, sub: "계약만료", color: "#e8445a" });
      }

      // ✅ 납부일: pay_day 기반으로 실제 날짜 계산
      const payDay = getPayDayForMonth(t, year, month);
      const monthPayment = (payments || []).find(
        p => p.tid === t.id && Number(p.month) === month + 1 && (Number(p.year) || year) === year
      );

      if (monthPayment?.paid) {
        const d = new Date(monthPayment.paid);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "paid", label: t.name, sub: "월세납부", color: "#0fa573" });
      } else {
        add(payDay, {
          type: monthPayment?.status === "미납" ? "unpaid" : "due",
          label: t.name,
          sub: monthPayment?.status === "미납" ? "미납" : "수금예정",
          color: monthPayment?.status === "미납" ? C.rose : C.amber,
        });
      }
    });

    // 계약 시작/종료 (contracts)
    (contracts || []).forEach((c) => {
      if (c.start_date) { const d = new Date(c.start_date); if (d.getFullYear() === year && d.getMonth() === month) add(d.getDate(), { type: "contract_start", label: c.tenant_name || c.tenantName || "", sub: "계약시작", color: "#1a2744" }); }
      if (c.end_date) { const d = new Date(c.end_date); if (d.getFullYear() === year && d.getMonth() === month) add(d.getDate(), { type: "contract_end", label: c.tenant_name || c.tenantName || "", sub: "계약종료", color: "#5b4fcf" }); }
    });
    // ✅ ④ 세금 신고 D-Day 이벤트 자동 추가
    const TAX_EVENTS = [
      { month: 5, day: 31, label: "종합소득세 신고", sub: "신고 마감", color: "#7c3aed", type: "tax" },
      { month: 1, day: 25, label: "부가세 신고(2기)", sub: "신고 마감", color: "#dc2626", type: "tax" },
      { month: 7, day: 25, label: "부가세 신고(1기)", sub: "신고 마감", color: "#dc2626", type: "tax" },
      { month: 11, day: 30, label: "종합소득세 중간예납", sub: "납부 마감", color: "#9333ea", type: "tax" },
    ];
    TAX_EVENTS.forEach(ev => {
      if (ev.month === month + 1) add(ev.day, { type: ev.type, label: ev.label, sub: ev.sub, color: ev.color });
    });

    return map;
  }, [tenants, contracts, payments, year, month]);

  const selectedEvents = selected ? (eventMap[selected] || []) : [];
  const allEvents = useMemo(() => { return Object.entries(eventMap).sort(([a], [b]) => Number(a) - Number(b)).flatMap(([date, evs]) => evs.map(ev => ({ ...ev, date: Number(date) }))); }, [eventMap]);
  const cells = []; for (let i = 0; i < firstDay; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const TYPE_ICON = { expiry: "⚠️", paid: "✅", unpaid: "🚨", due: "💰", contract_start: "📋", contract_end: "📋" };

  return ( <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}> <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "28px 28px 28px 36px" }}> <div style={{ marginBottom: 20 }}> <SectionLabel>LEASE CALENDAR</SectionLabel> <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2744" }}>임대차 캘린더</h1> </div> <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}> <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "#ffffff", border: "1px solid #ebe9e3", color: "#1a2744", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button> <div style={{ display: "flex", gap: 12, alignItems: "center" }}> <span style={{ fontSize: 20, fontWeight: 800, color: "#1a2744" }}>{year}년 {MONTH_KO[month]}</span> <button onClick={goToday} style={{ padding: "4px 12px", borderRadius: 8, background: C.indigo + "20", border: `1px solid ${C.indigo}40`, color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>오늘</button> </div> <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "#ffffff", border: "1px solid #ebe9e3", color: "#1a2744", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button> </div> <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}> {DAY_KO.map((d, i) => ( <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? C.rose : i === 6 ? C.indigo : C.muted, padding: "6px 0" }}>{d}</div> ))} </div> <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, flex: 1 }}> {cells.map((d, i) => { if (!d) return <div key={`e-${i}`} />; const evs = eventMap[d] || []; const isSel = selected === d; const col = i % 7; return ( <div key={d} onClick={() => setSelected(isSel ? null : d)} style={{ minHeight: 72, borderRadius: 10, padding: "8px 7px", cursor: "pointer", background: isSel ? C.indigo + "25" : isToday(d) ? C.indigo + "12" : "#ffffff", border: `1px solid ${isSel ? C.indigo : isToday(d) ? C.indigo + "60" : "#ebe9e3"}`, transition: "all .12s" }}> <div style={{ fontSize: 13, fontWeight: isToday(d) ? 800 : 600, color: isToday(d) ? C.indigo : col === 0 ? C.rose : col === 6 ? "#818cf8" : C.text, marginBottom: 4 }}> {d} {isToday(d) && <span style={{ marginLeft: 3, fontSize: 9, background: C.indigo, color: "#fff", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>오늘</span>} </div> <div style={{ display: "flex", flexDirection: "column", gap: 2 }}> {evs.slice(0, 3).map((ev, j) => ( <div key={j} style={{ fontSize: 10, fontWeight: 600, color: ev.color, background: ev.color + "18", borderRadius: 4, padding: "2px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}> {ev.label} {ev.sub} </div> ))} {evs.length > 3 && <div style={{ fontSize: 10, color: "#8a8a9a" }}>+{evs.length - 3}개</div>} </div> </div> ); })} </div> </div> <div style={{ width: 260, borderLeft: "1px solid #ebe9e3", overflowY: "auto", padding: "28px 18px", flexShrink: 0 }}> {selected ? ( <> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>{month+1}월 {selected}일</p> {selectedEvents.length === 0 ? <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 20, textAlign: "center" }}>일정 없음</p> : selectedEvents.map((ev, i) => ( <div key={i} style={{ background: "#ffffff", border: `1px solid ${ev.color}30`, borderLeft: `3px solid ${ev.color}`, borderRadius: 10, padding: "11px 12px", marginBottom: 8 }}> <div style={{ fontSize: 11, color: ev.color, fontWeight: 700, marginBottom: 4 }}>{TYPE_ICON[ev.type]} {ev.sub}</div> <div style={{ fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{ev.label}</div> </div> ))} </> ) : ( <> <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>{month+1}월 전체 일정</p> {allEvents.length === 0 ? <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 20, textAlign: "center" }}>이번 달 일정 없음</p> : allEvents.map((ev, i) => ( <div key={i} onClick={() => setSelected(ev.date)} style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderLeft: `3px solid ${ev.color}`, borderRadius: 10, padding: "10px 12px", marginBottom: 7, cursor: "pointer" }}> <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}> <span style={{ fontSize: 11, color: ev.color, fontWeight: 700 }}>{TYPE_ICON[ev.type]} {ev.sub}</span> <span style={{ fontSize: 11, color: "#8a8a9a" }}>{month+1}/{ev.date}</span> </div> <div style={{ fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{ev.label}</div> </div> ))} </> )} <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #ebe9e3" }}> <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 10 }}>범례</p> {[ { color: "#e8960a", label: "수금 예정" }, { color: "#0fa573", label: "납부 완료" }, { color: "#e8445a", label: "미납 / 계약만료" }, { color: "#1a2744", label: "계약 시작" }, { color: "#5b4fcf", label: "계약 종료" }, ].map(({ color, label }) => ( <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}> <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} /> <span style={{ fontSize: 12, color: "#8a8a9a" }}>{label}</span> </div> ))} </div> </div> </div> ); }