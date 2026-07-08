"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CountUp } from "./Trendy";

/**
 * 랜딩 첫 화면 — 3D 인터랙티브 히어로
 * 마우스 움직임에 따라 대시보드 목업이 기울고(perspective tilt),
 * 떠 있는 알림 카드들이 서로 다른 깊이(parallax)로 반응합니다.
 * 목업 콘텐츠는 "예시 화면" 라벨로 명시 (진실성 원칙).
 */
export default function LandingHero3D({ user, abHeadline, onStart, onLogin }) {
  const heroRef = useRef(null);
  const mx = useMotionValue(0); // -1 ~ 1
  const my = useMotionValue(0);

  const spring = { stiffness: 110, damping: 18, mass: 0.7 };
  const rotateX = useSpring(useTransform(my, [-1, 1], [8, -8]), spring);
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-11, 11]), spring);
  // 떠다니는 카드 — 깊이별 패럴랙스 (목업보다 크게/반대로 움직여 입체감)
  const f1x = useSpring(useTransform(mx, [-1, 1], [-22, 22]), spring);
  const f1y = useSpring(useTransform(my, [-1, 1], [-16, 16]), spring);
  const f2x = useSpring(useTransform(mx, [-1, 1], [16, -16]), spring);
  const f2y = useSpring(useTransform(my, [-1, 1], [12, -12]), spring);
  const f3x = useSpring(useTransform(mx, [-1, 1], [-12, 12]), spring);
  const f3y = useSpring(useTransform(my, [-1, 1], [10, -10]), spring);

  const handleMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  const fadeUp = (delay) => ({
    initial: { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 180, damping: 24, delay },
  });

  return (
    <div ref={heroRef} onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ width: "100%", maxWidth: 1100, position: "relative", zIndex: 2, paddingTop: 48 }}>
      <style>{`
        .hero3d-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.05fr); gap: 40px; align-items: center; }
        .hero3d-mock-wrap { perspective: 1200px; }
        @media (max-width: 920px) {
          .hero3d-grid { grid-template-columns: 1fr; gap: 44px; text-align: center; }
          .hero3d-left { display: flex; flex-direction: column; align-items: center; }
          .hero3d-chips { justify-content: center; }
          .hero3d-mock-wrap { max-width: 480px; margin: 0 auto; }
        }
        @keyframes hero-draw { from { stroke-dashoffset: 480; } to { stroke-dashoffset: 0; } }
        @keyframes hero-fill-in { from { opacity: 0; } to { opacity: 1; } }
        .hero-chart-line { stroke-dasharray: 480; animation: hero-draw 1.6s .5s var(--ease, ease) both; }
        .hero-chart-fill { animation: hero-fill-in .8s 1.4s ease both; }
        @keyframes hero-float-a { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes hero-float-b { 0%,100% { transform: translateY(0); } 50% { transform: translateY(9px); } }
        .hero-float-a { animation: hero-float-a 5.5s ease-in-out infinite; }
        .hero-float-b { animation: hero-float-b 6.5s ease-in-out infinite; }
      `}</style>

      <div className="hero3d-grid">
        {/* ─── 왼쪽: 카피 + CTA ─── */}
        <div className="hero3d-left">
          <motion.div {...fadeUp(0)} style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(145deg, #1a2744, #2d4270)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 24px rgba(26,39,68,0.3)" }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/><rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/></svg>
            </div>
            <div>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.5px" }}>온리</span>
              <span style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 500, marginLeft: 6, letterSpacing: "0.5px" }}>Ownly</span>
            </div>
          </motion.div>

          <motion.h1 {...fadeUp(0.06)} style={{ fontSize: "clamp(34px,4.6vw,58px)", fontWeight: 900, lineHeight: 1.08, marginBottom: 18, letterSpacing: "-0.03em" }}>
            {abHeadline === "B"
              ? (<><span className="gradient-text-2">임대 관리,</span><br /> <span style={{ color: "#1a2744" }}>하나의 앱으로 끝.</span></>)
              : (<><span className="gradient-text-2">내 임대 물건,</span><br /> <span style={{ color: "#1a2744" }}>온리 하나로.</span></>)}
          </motion.h1>

          <motion.p {...fadeUp(0.12)} style={{ fontSize: 15.5, color: "#6a6a7a", lineHeight: 1.75, marginBottom: 10, maxWidth: 460 }}>
            수금·계약·세금·내용증명까지. 엑셀 대신, 임대인 업무를 <b style={{ color: "#1a2744" }}>한 화면에서 자동으로</b> 처리하세요.
          </motion.p>
          <motion.p {...fadeUp(0.16)} style={{ fontSize: 11, color: "#a0a0b0", marginBottom: 26, lineHeight: 1.6 }}>
            ※ 임대 물건 관리 서비스(월 구독) · 부동산 매매·임대·중개와는 무관
          </motion.p>

          <motion.div {...fadeUp(0.2)} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <button onClick={onStart} className="btn btn-fill btn-lg">{user ? "내 대시보드로" : "무료로 시작하기 →"}</button>
            <button onClick={onLogin} className="btn btn-ghost btn-lg">{user ? "로그아웃" : "로그인"}</button>
          </motion.div>
          <motion.span {...fadeUp(0.24)} style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 22 }}>
            신용카드 불필요 · 무료 플랜 영구 제공 · 언제든 취소 가능
          </motion.span>

          <motion.div {...fadeUp(0.28)} className="hero3d-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { icon: "🏛", label: "국토부 실거래가 연동" },
              { icon: "🔒", label: "Supabase Auth · SSL 암호화" },
              { icon: "📱", label: "PWA · 모바일 설치 지원" },
            ].map(({ icon, label }) => (
              <span key={label} className="chip"><span>{icon}</span>{label}</span>
            ))}
          </motion.div>
        </div>

        {/* ─── 오른쪽: 3D 대시보드 목업 ─── */}
        <motion.div className="hero3d-mock-wrap" initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.15 }}
          style={{ position: "relative" }}>
          {/* 백그라운드 글로우 */}
          <div style={{ position: "absolute", inset: "-8% -6%", background: "radial-gradient(ellipse at 60% 40%, rgba(91,79,207,0.16), rgba(56,189,248,0.08) 45%, transparent 70%)", filter: "blur(28px)", zIndex: 0 }} />

          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d", position: "relative", zIndex: 1, willChange: "transform" }}>
            {/* 메인 대시보드 카드 */}
            <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", border: "1px solid rgba(235,233,227,0.9)", borderRadius: 22, boxShadow: "0 30px 80px -18px rgba(26,39,68,0.35), 0 8px 28px rgba(26,39,68,0.1)", overflow: "hidden" }}>
              {/* 타이틀 바 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid #f0efe9", background: "#fbfaf7" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "0.4px" }}>온리 대시보드</span>
                <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 700, color: "#8a8a9a", background: "#f0efe9", padding: "2px 8px", borderRadius: 10 }}>예시 화면</span>
              </div>

              {/* KPI */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: "14px 16px 6px" }}>
                {[
                  { l: "이번 달 수입", v: 1240, suffix: "만", c: "#0fa573" },
                  { l: "운영 물건", v: 8, suffix: "개", c: "#1a2744" },
                  { l: "수금률", v: 96, suffix: "%", c: "#5b4fcf" },
                ].map((k) => (
                  <div key={k.l} style={{ background: "#faf9f6", border: "1px solid #f0efe9", borderRadius: 12, padding: "10px 12px" }}>
                    <p style={{ fontSize: 9.5, fontWeight: 700, color: "#8a8a9a", marginBottom: 3, letterSpacing: "0.3px" }}>{k.l}</p>
                    <p style={{ fontSize: 17, fontWeight: 900, color: k.c, margin: 0 }}>
                      <CountUp value={k.v} suffix={k.suffix} duration={1400} />
                    </p>
                  </div>
                ))}
              </div>

              {/* 차트 */}
              <div style={{ padding: "8px 16px 4px" }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "#8a8a9a", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>월별 수입 추이</p>
                <svg viewBox="0 0 320 92" style={{ width: "100%", height: "auto", display: "block" }}>
                  <defs>
                    <linearGradient id="hero3dFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5b4fcf" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#5b4fcf" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[22, 46, 70].map((y) => (
                    <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#f0efe9" strokeWidth="1" strokeDasharray="3 4" />
                  ))}
                  <path className="hero-chart-fill" d="M0,72 C40,66 60,68 90,60 C130,50 150,54 190,42 C230,32 260,30 320,18 L320,92 L0,92 Z" fill="url(#hero3dFill)" />
                  <path className="hero-chart-line" d="M0,72 C40,66 60,68 90,60 C130,50 150,54 190,42 C230,32 260,30 320,18" fill="none" stroke="#5b4fcf" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="320" cy="18" r="4" fill="#5b4fcf" />
                  <circle cx="320" cy="18" r="8" fill="#5b4fcf" opacity="0.18" />
                </svg>
              </div>

              {/* 물건 리스트 */}
              <div style={{ padding: "6px 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { icon: "🏪", name: "GS25 편의점 · 1층 상가", rent: "280만", tag: "납부완료", c: "#0fa573" },
                  { icon: "🏠", name: "래미안 304호 · 아파트", rent: "120만", tag: "D-45 만료", c: "#e8960a" },
                  { icon: "🏢", name: "선릉 오피스텔 702호", rent: "95만", tag: "미납 1건", c: "#e8445a" },
                ].map((r) => (
                  <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#faf9f6", border: "1px solid #f0efe9", borderRadius: 11 }}>
                    <span style={{ fontSize: 16 }}>{r.icon}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1a2744", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                    <span className="num" style={{ fontSize: 11.5, fontWeight: 800, color: "#1a2744" }}>{r.rent}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: r.c, background: r.c + "16", padding: "3px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>{r.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 떠다니는 카드 1: 입금 알림 (우상단) ── */}
            <motion.div style={{ x: f1x, y: f1y, position: "absolute", top: -38, right: -8, zIndex: 3 }}>
              <div className="hero-float-a" style={{ background: "#fff", border: "1px solid #e6f5ef", borderRadius: 14, padding: "10px 14px", boxShadow: "0 14px 38px rgba(15,165,115,0.22)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(15,165,115,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💰</div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", margin: 0 }}>월세 입금 확인</p>
                  <p className="num" style={{ fontSize: 12, fontWeight: 900, color: "#0fa573", margin: 0 }}>+2,800,000원</p>
                </div>
              </div>
            </motion.div>

            {/* ── 떠다니는 카드 2: 계약 만료 알림 (좌하단) ── */}
            <motion.div style={{ x: f2x, y: f2y, position: "absolute", bottom: 158, left: -26, zIndex: 3 }}>
              <div className="hero-float-b" style={{ background: "#fff", border: "1px solid #fdf0dc", borderRadius: 14, padding: "10px 14px", boxShadow: "0 14px 38px rgba(232,150,10,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(232,150,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📅</div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", margin: 0 }}>계약 만료 D-45</p>
                  <p style={{ fontSize: 10.5, fontWeight: 600, color: "#8a8a9a", margin: 0 }}>갱신 협상 알림 예약됨</p>
                </div>
              </div>
            </motion.div>

            {/* ── 떠다니는 카드 3: 카카오 알림톡 (우하단) ── */}
            <motion.div style={{ x: f3x, y: f3y, position: "absolute", bottom: -20, right: 22, zIndex: 3 }}>
              <div className="hero-float-a" style={{ animationDelay: "-2.5s", background: "#fff", border: "1px solid #f4f1e4", borderRadius: 14, padding: "9px 13px", boxShadow: "0 14px 38px rgba(26,39,68,0.16)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>💬</span>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: "#1a2744", margin: 0 }}>미납 알림톡 자동 발송 <span className="pulse-dot" style={{ display: "inline-block", marginLeft: 4, verticalAlign: "middle" }} /></p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
