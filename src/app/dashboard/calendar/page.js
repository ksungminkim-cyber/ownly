"use client";
import { useState, useMemo, useEffect } from "react";
import { SectionLabel } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";

const MONTH_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_KO   = ["일","월","화","수","목","금","토"];

export default function CalendarPage() {
  const { tenants, contracts, payments, refreshData } = useApp();
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null); // 선택된 날짜

  // 캘린더 진입 시 최신 데이터 자동 새로고침
  useEffect(() => {
    refreshData();
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); setSelected(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); setSelected(null); };
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today.getDate()); };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const isToday     = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // 이벤트 생성
  const eventMap = useMemo(() => {
    const map = {}; // date → [{type, label, color, sub}]
    const add = (date, ev) => { if (!map[date]) map[date] = []; map[date].push(ev); };

    tenants.forEach((t) => {
      // 계약 만료일
      if (t.end_date) {
        const d = new Date(t.end_date);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "expiry", label: t.name, sub: "계약만료", color: "#e8445a" });
      }
      // 수금일 (payments 기록에서 이번 달 납부 예정/완료)
      const monthPayment = (payments || []).find(
        p => p.tid === t.id && Number(p.year) === year && Number(p.month) === month + 1
      );
      // 납부 예정일: 매월 1일 (기본) 또는 실제 납부일
      if (monthPayment?.paid) {
        const d = new Date(monthPayment.paid);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "paid", label: t.name, sub: "월세납부", color: "#0fa573" });
      } else {
        // 미납/예정: 매월 1일에 표시
        add(1, {
          type: monthPayment?.status === "미납" ? "unpaid" : "due",
          label: t.name,
          sub: monthPayment?.status === "미납" ? "미납" : "수금예정",
          color: monthPayment?.status === "미납" ? C.rose : C.amber,
        });
      }
    });

    // 계약 시작/종료
    (contracts || []).forEach((c) => {
      if (c.start_date) {
        const d = new Date(c.start_date);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "contract_start", label: c.tenant_name || c.tenantName || "", sub: "계약시작", color: "#1a2744" });
      }
      if (c.end_date) {
        const d = new Date(c.end_date);
        if (d.getFullYear() === year && d.getMonth() === month)
          add(d.getDate(), { type: "contract_end", label: c.tenant_name || c.tenantName || "", sub: "계약종료", color: "#5b4fcf" });
      }
    });

    return map;
  }, [tenants, contracts, payments, year, month]);

  // 선택된 날짜의 이벤트
  const selectedEvents = selected ? (eventMap[selected] || []) : [];

  // 이번 달 전체 이벤트 (사이드바용)
  const allEvents = useMemo(() => {
    return Object.entries(eventMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([date, evs]) => evs.map(ev => ({ ...ev, date: Number(date) })));
  }, [eventMap]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const TYPE_ICON = { expiry: "⚠️", paid: "✅", unpaid: "🚨", due: "💰", contract_start: "📋", contract_end: "📋" };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* ── 캘린더 영역 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "28px 28px 28px 36px" }}>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>LEASE CALENDAR</SectionLabel>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2744" }}>임대차 캘린더</h1>
        </div>

        {/* 월 네비게이션 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "#ffffff", border: "1px solid #ebe9e3", color: "#1a2744", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#1a2744" }}>{year}년 {MONTH_KO[month]}</span>
            <button onClick={goToday} style={{ padding: "4px 12px", borderRadius: 8, background: C.indigo + "20", border: `1px solid ${C.indigo}40`, color: "#1a2744", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>오늘</button>
          </div>
          <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 9, background: "#ffffff", border: "1px solid #ebe9e3", color: "#1a2744", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAY_KO.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? C.rose : i === 6 ? C.indigo : C.muted, padding: "6px 0" }}>{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, flex: 1 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />;
            const evs = eventMap[d] || [];
            const isSel = selected === d;
            const col = i % 7;
            return (
              <div key={d} onClick={() => setSelected(isSel ? null : d)}
                style={{
                  minHeight: 72, borderRadius: 10, padding: "8px 7px", cursor: "pointer",
                  background: isSel ? C.indigo + "25" : isToday(d) ? C.indigo + "12" : "#ffffff",
                  border: `1px solid ${isSel ? C.indigo : isToday(d) ? C.indigo + "60" : "#ebe9e3"}`,
                  transition: "all .12s",
                }}>
                <div style={{ fontSize: 13, fontWeight: isToday(d) ? 800 : 600, color: isToday(d) ? C.indigo : col === 0 ? C.rose : col === 6 ? "#818cf8" : C.text, marginBottom: 4 }}>
                  {d}
                  {isToday(d) && <span style={{ marginLeft: 3, fontSize: 9, background: C.indigo, color: "#1a2744", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>오늘</span>}
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

      {/* ── 오른쪽 사이드: 이벤트 목록 ── */}
      <div style={{ width: 260, borderLeft: "1px solid #ebe9e3", overflowY: "auto", padding: "28px 18px", flexShrink: 0 }}>
        {selected ? (
          <>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>{month+1}월 {selected}일</p>
            {selectedEvents.length === 0
              ? <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 20, textAlign: "center" }}>일정 없음</p>
              : selectedEvents.map((ev, i) => (
                <div key={i} style={{ background: "#ffffff", border: `1px solid ${ev.color}30`, borderLeft: `3px solid ${ev.color}`, borderRadius: 10, padding: "11px 12px", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: ev.color, fontWeight: 700, marginBottom: 4 }}>{TYPE_ICON[ev.type]} {ev.sub}</div>
                  <div style={{ fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{ev.label}</div>
                </div>
              ))
            }
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 14 }}>{month+1}월 전체 일정</p>
            {allEvents.length === 0
              ? <p style={{ fontSize: 13, color: "#8a8a9a", marginTop: 20, textAlign: "center" }}>이번 달 일정 없음</p>
              : allEvents.map((ev, i) => (
                <div key={i} onClick={() => setSelected(ev.date)}
                  style={{ background: "#ffffff", border: "1px solid #ebe9e3", borderLeft: `3px solid ${ev.color}`, borderRadius: 10, padding: "10px 12px", marginBottom: 7, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: ev.color, fontWeight: 700 }}>{TYPE_ICON[ev.type]} {ev.sub}</span>
                    <span style={{ fontSize: 11, color: "#8a8a9a" }}>{month+1}/{ev.date}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#1a2744", fontWeight: 600 }}>{ev.label}</div>
                </div>
              ))
            }
          </>
        )}

        {/* 범례 */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #ebe9e3" }}>
          <p style={{ fontSize: 10, color: "#8a8a9a", fontWeight: 700, letterSpacing: ".5px", marginBottom: 10 }}>범례</p>
          {[
            { color: "#e8960a",   label: "수금 예정" },
            { color: "#0fa573", label: "납부 완료" },
            { color: "#e8445a",    label: "미납 / 계약만료" },
            { color: "#1a2744",  label: "계약 시작" },
            { color: "#5b4fcf",  label: "계약 종료" },
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
