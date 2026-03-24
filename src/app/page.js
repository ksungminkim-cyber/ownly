"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C, PLANS } from "../lib/constants";

export default function LandingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("plus");

  const features = [
    { icon: "?��", title: "주거·?��? ?�합 관�?, desc: "?�파?�·빌?�·오?�스?�·상가·?��? ??모든 ?��? ?�형?????�랫?�에??관리합?�다." },
    { icon: "?��", title: "?��?�??�금 ?�동??,  desc: "?�세·보증�??�금 ?�황???�동 추적?�고 미납 즉시 ?�림. ?��?�?관리�? ?�워집니??" },
    { icon: "?��", title: "?��? ?�익�?분석",    desc: "물건�????�익�??�동 계산, ?�별 ?�익 차트. ?��? ?�산 ?�익 ?�황???�눈???�악?�니??" },
    { icon: "?��", title: "계약?�·내?�증�?,     desc: "?��?�?계약??관리�???법적 ?�력???�용증명 PDF 발행까�? ?�스?�으�?처리?�니??" },
    { icon: "?��", title: "?�금 ?�고 ?��??�이??, desc: "?��??�득 종합?�득?�·�?가?��? ?�동 추정?�니?? ?��??�업???�금 ?�고???��????�니??" },
    { icon: "?��", title: "AI ?��?·?��?�?분석", desc: "�?��부 ?�거?��? 기반?�로 지???�정 ?��?료�? ?��?�?AI가 분석?�니??" },
  ];

  return (
    <div className="grid-bg" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "40px 20px 0",
      position: "relative", overflow: "hidden",
      fontFamily: "'Pretendard','DM Sans',sans-serif",
      background: "#f5f4f0"
    }}>

      {/* 배경 ?�식 */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,39,68,0.05), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,79,207,0.04), transparent 70%)", pointerEvents: "none" }} />

      {/* ?�어�??�션 */}
      <div style={{ textAlign: "center", maxWidth: 700, position: "relative", zIndex: 1, paddingTop: 40 }}>
        {/* 로고 */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: "linear-gradient(145deg, #1a2744, #2d4270)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 24px rgba(26,39,68,0.3)"
          }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/>
              <rect x="7.5" y="12" width="5" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 24, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.5px" }}>?�리</span>
            <span style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 500, marginLeft: 6, letterSpacing: "0.5px" }}>Ownly</span>
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          <span className="gradient-text">???��? 물건,</span><br />
          <span style={{ color: "#1a2744" }}>?�리 ?�나�?</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          ?�금부??계약·?�금·?�용증명까�?. ?��? 관리에 ?�요??모든 �? ?�나???�에??
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary"
            style={{
              padding: "15px 44px", borderRadius: 14,
              background: "linear-gradient(135deg, #1a2744, #2d4270)",
              border: "none", color: "#fff", fontWeight: 800, fontSize: 16,
              cursor: "pointer", boxShadow: "0 8px 32px rgba(26,39,68,0.3)"
            }}
          >무료�??�작?�기</button>
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "15px 28px", borderRadius: 14,
              background: "#ffffff", border: "1.5px solid #e8e6e0",
              color: "#6a6a7a", fontWeight: 600, fontSize: 15, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(26,39,68,0.06)"
            }}
          >로그??/button>
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/features" style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "none", borderBottom: "1px solid #d0cfc8", paddingBottom: 1 }}>
            모든 기능 ?�펴보기 ??
          </Link>
        </div>
      </div>

      {/* 기능 카드 */}
      <style>{`@media(max-width:640px){.features-grid{grid-template-columns:1fr 1fr!important}}`}</style>
      <div className="stagger features-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)",
        gap: 14, maxWidth: 960, width: "100%", marginTop: 56, position: "relative", zIndex: 1, marginLeft: "auto", marginRight: "auto"
      }}>
        {features.map((f) => (
          <div key={f.title} className="hover-lift" style={{
            background: "#ffffff", border: "1px solid #ebe9e3",
            borderRadius: 16, padding: "22px 20px",
            boxShadow: "0 2px 10px rgba(26,39,68,0.05)"
          }}>
            <span style={{ fontSize: 26, marginBottom: 10, display: "block" }}>{f.icon}</span>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 5 }}>{f.title}</h2>
            <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ?�?�?� 구독 ?�랜 ?�션 ?�?�?� */}
      <div style={{ width: "100%", maxWidth: 960, marginTop: 80, position: "relative", zIndex: 1, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, opacity: 0.5 }}>PRICING</p>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, color: "#1a2744", margin: 0 }}>?�에�?맞는 ?�랜 ?�택</h2>
          <p style={{ color: "#8a8a9a", fontSize: 14, marginTop: 8 }}>모든 ?�랜?� ?�제?��? 변경·취??가?�합?�다</p>

          {/* ?�간 / ?�간 ?��? */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 20, background: "#f5f4f0", borderRadius: 40, padding: "5px 6px" }}>
            <button onClick={() => setIsAnnual(false)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s",
                background: !isAnnual ? "#fff" : "transparent",
                color: !isAnnual ? "#1a2744" : "#8a8a9a",
                boxShadow: !isAnnual ? "0 2px 8px rgba(26,39,68,0.1)" : "none" }}>
              ?�간 결제
            </button>
            <button onClick={() => setIsAnnual(true)}
              style={{ padding: "7px 20px", borderRadius: 30, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .2s", display: "flex", alignItems: "center", gap: 6,
                background: isAnnual ? "#1a2744" : "transparent",
                color: isAnnual ? "#fff" : "#8a8a9a",
                boxShadow: isAnnual ? "0 2px 8px rgba(26,39,68,0.2)" : "none" }}>
              ?�간 결제
              <span style={{ fontSize: 10, fontWeight: 800, background: isAnnual ? "rgba(255,255,255,0.2)" : "#0fa573", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>20% ?�인</span>
            </button>
          </div>
          {isAnnual && (
            <p style={{ fontSize: 12, color: "#0fa573", fontWeight: 600, marginTop: 8 }}>
              ?�� ?�간 결제 ??2.4개월�?무료 ??12개월 ??번에 결제
            </p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, padding: "0 0 20px", alignItems: "start" }}>
          {Object.values(PLANS).map((plan) => {
            const isPlus = plan.id === "plus";
            const isPro         = plan.id === "pro";
            return (
              <div key={plan.id} style={{
                background: isPlus ? "linear-gradient(160deg, rgba(79,70,229,0.04), #ffffff)" : "#ffffff",
                border: `1.5px solid ${isPlus ? "rgba(79,70,229,0.25)" : isPro ? "rgba(201,146,10,0.25)" : "#ebe9e3"}`,
                borderRadius: 20, padding: "28px 24px 24px",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: isPlus ? "0 8px 32px rgba(79,70,229,0.12)" : "0 2px 10px rgba(26,39,68,0.05)"
              }}>
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: isPlus ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "linear-gradient(135deg,#c9920a,#e8960a)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap"
                  }}>{plan.badge}</div>
                )}

                {/* ?�랜�?& 가�?*/}
                <p style={{ fontSize: 13, fontWeight: 800, color: isPro ? "#c9920a" : isPlus ? "#4f46e5" : "#8a8a9a", marginBottom: 6, letterSpacing: "1px" }}>{plan.name.toUpperCase()}</p>
                {(() => {
                  const monthly  = plan.price;
                  const annual   = Math.round(monthly * 0.8);
                  const showPrice = isAnnual && monthly > 0 ? annual : monthly;
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "0 0 4px" }}>
                        <p style={{ fontSize: monthly === 0 ? 32 : 28, fontWeight: 900, color: "#1a2744", margin: 0 }}>
                          {monthly === 0 ? "무료" : `??{showPrice.toLocaleString()}`}
                        </p>
                        {isAnnual && monthly > 0 && (
                          <span style={{ fontSize: 13, color: "#8a8a9a", textDecoration: "line-through" }}>??monthly.toLocaleString()}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 20 }}>
                        {monthly === 0 ? "?�구 무료" : isAnnual ? `????{(annual*12).toLocaleString()} · VAT ?�함` : "??구독 · VAT ?�함"}
                      </p>
                    </>
                  );
                })()}

                {/* 기능 목록 ??flex: 1 �??�여??버튼????�� ?�단??*/}
                <div style={{ marginBottom: 24, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start", opacity: f.ok ? 1 : 0.35 }}>
                      <span style={{ color: f.ok ? "#0fa573" : "#8a8a9a", fontSize: 13, marginTop: 1, flexShrink: 0 }}>{f.ok ? "?? : "??}</span>
                      <span style={{ fontSize: 13, color: f.ok ? "#1a2744" : "#8a8a9a" }}>{f.t}</span>
                    </div>
                  ))}
                </div>

                {/* CTA 버튼 ??marginTop: auto �???�� ?�단 ?�렬 */}
                <button
                  onClick={() => router.push("/login")}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12, border: "none",
                    cursor: "pointer", fontWeight: 800, fontSize: 14, marginTop: "auto",
                    background: isPlus
                      ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                      : isPro
                        ? "linear-gradient(135deg, #c9920a, #e8960a)"
                        : "#f0efe9",
                    color: plan.price === 0 ? "#6a6a7a" : "#fff",
                    boxShadow: isPlus ? "0 4px 16px rgba(79,70,229,0.25)" : isPro ? "0 4px 16px rgba(201,146,10,0.25)" : "none",
                  }}
                >
                  {plan.price === 0 ? "무료�??�작" : "구독 ?�작?�기"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ?�?�?� ?��???커�??�티 ?�?�?� */}
      <div style={{ width: "100%", background: "#ffffff", padding: "60px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#8a8a9a", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>COMMUNITY</p>
              <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, color: "#1a2744", lineHeight: 1.2 }}>?��??�들???�제 ?�야�?/h2>
              <p style={{ fontSize: 15, color: "#8a8a9a", marginTop: 8 }}>?�리�??�용?�는 ?��??�들???�누??경험�??�하??/p>
            </div>
            <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: "#5b4fcf", textDecoration: "none", background: "rgba(91,79,207,0.08)", padding: "9px 18px", borderRadius: 10, flexShrink: 0 }}>무료�??�작?�기 ??/a>
          </div>

          {/* 커�??�티 ?�드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, alignItems: "flex-start" }}>
            {[
              { avatar: "?��", name: "?�울 강남 ?��???, time: "방금 ??, tag: "?�금 관�?, content: "?�세 미납 ?�림??바로 ?�???�입?�한??문자 보내?�까 ?�음??바로 ?�금?�어?? ?�전???�기�?체크?�다 까먹?�는???�제 ?�전 ?�해졌습?�다 ?��", likes: 24 },
              { avatar: "?��", name: "?�천 ?�세?� 2�??�영", time: "1?�간 ??, tag: "?�금 ?��?", content: "종합?�득???�고 ?�에 ?�금 ?��??�이???�려봤는???�무??견적?�랑 거의 비슷?�게 ?�왔?�요. ?�전??준비할 ???�어???�무 좋습?�다", likes: 18 },
              { avatar: "?��", name: "부???��? ?��?", time: "3?�간 ??, tag: "?�용증명", content: "?�거 ?�청 ?�용증명???�에??바로 뽑아???�기�?보냈?�요. 변?�사 ?�하�?50만원?�데 직접 ?�니�????�편료만 ?�었?�니???��", likes: 31 },
              { avatar: "?���?, name: "경기 빌라 3�?, time: "?�제", tag: "계약 관�?, content: "계약 만료??90???��????�림???�니�?미리미리 ?�입?�한???�락?????�어?? 공실 ?�이 계속 ?��? 중입?�다!", likes: 15 },
              { avatar: "?��", name: "충남 ?��? ?��?", time: "?��? ??, tag: "?��? 관�?, content: "?��? ?��???관�?가?�해??좋아?? ?��? ?��?�??�금 ?�역???�별�??�리?????�고, ?�금 계산???�로 ?��????�하?�요", likes: 9 },
              { avatar: "?��", name: "?�울 ?�피?�텔 5�?, time: "3????, tag: "리포??, content: "?�말???�무?�고 ?�료 준비할 ??리포??뽑으?�까 1?�치 ?�입·지출이 ?�눈??보여?? ?�무???�담 ?�간???�반?�로 줄었?�요", likes: 27 },
            ].map((post, i) => (
              <div key={i} style={{ background: "#f8f7f4", borderRadius: 16, padding: "18px 20px", border: "1px solid #ebe9e3" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{post.avatar}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{post.name}</p>
                      <p style={{ fontSize: 11, color: "#a0a0b0" }}>{post.time}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#5b4fcf", background: "rgba(91,79,207,0.1)", padding: "3px 9px", borderRadius: 6 }}>{post.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: "#3a3a4e", lineHeight: 1.7, marginBottom: 14 }}>{post.content}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>?�️</span>
                  <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 600 }}>{post.likes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32, textAlign: "center", padding: "32px", background: "linear-gradient(135deg,rgba(26,39,68,0.04),rgba(91,79,207,0.04))", borderRadius: 20, border: "1px solid rgba(91,79,207,0.1)" }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 8 }}>지�?바로 ?�작?�보?�요</p>
            <p style={{ fontSize: 14, color: "#8a8a9a", marginBottom: 20 }}>무료 ?�랜?�로 ?�작, ?�제???�그?�이??가??/p>
            <a href="/login" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg,#1a2744,#2d4270)", color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>무료�??�리 ?�작?�기 ??/a>
          </div>
        </div>
      </div>

      {/* ?�?�?� B2B 문의 ?�션 ?�?�?� */}
      <div style={{ width: "100%", background: "#1a2744", padding: "48px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>ENTERPRISE</p>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-.3px" }}>
              법인·공인중개??�자?��?리사 ?�??별도 문의
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              ?�수 물건 보유 법인 · 공인중개???�무??· ?�산관리회??br/>
              ?�금계산??발행 · ?�간 계약 · ?� 계정 ?�의 가??
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <a href="mailto:inquiry@mclean21.com?subject=?�리 기업 구독 문의"
              style={{ padding: "14px 28px", borderRadius: 12, background: "#fff", color: "#1a2744", fontWeight: 800, fontSize: 14, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" }}>
              ?�업?�??문의?�기 ??
            </a>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>inquiry@mclean21.com</p>
          </div>
        </div>
      </div>

      {/* ?�?�?� 법적 ?�터 ?�?�?� */}
      <footer style={{
        width: "100%", borderTop: "1px solid #e8e6e0",
        marginTop: 60, padding: "40px 20px 80px",
        position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* ?�터 ?�단 ??로고 + 링크 그리??*/}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            {/* 로고 + ?�명 */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1a2744, #2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.9"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 16, fontWeight: 900, color: "#1a2744", letterSpacing: "-0.3px" }}>?�리</span>
              </div>
              <p style={{ fontSize: 12, color: "#8a8a9a", lineHeight: 1.7, maxWidth: 200 }}>???��? 물건, ?�리 ?�나�?<br/>?�금·계약·?�금·?�용증명</p>
            </div>

            {/* 링크 그룹??*/}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>?�비??/p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/features" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    기능 ?�개
                  </Link>
                  <Link href="/login" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    무료 ?�작?�기
                  </Link>
                  <Link href="/dashboard/pricing" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?�금??
                  </Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>지??/p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/faq" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?�주 묻는 질문
                  </Link>
                  <Link href="/legal/notice" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    공�??�항
                  </Link>
                  <a href="mailto:inquiry@mclean21.com" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    문의?�기
                  </a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#1a2744", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>법적</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link href="/legal/terms" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    ?�비???�용?��?
                  </Link>
                  <Link href="/legal/privacy" style={{ fontSize: 13, color: "#6a6a7a", textDecoration: "none" }}
                    onMouseEnter={e=>e.target.style.color="#1a2744"} onMouseLeave={e=>e.target.style.color="#6a6a7a"}>
                    개인?�보처리방침
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ?�터 ?�단 ???�업???�보 */}
          <div style={{ borderTop: "1px solid #ebe9e3", paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.9, display: "flex", flexWrap: "wrap", gap: "0 20px" }}>
              <span>?�호�? (�?맥클�?/span>
              <span>?�?? 김?��?</span>
              <span>?�업?�등록번?? 137-81-52231</span>
              <span>?�신?�매?�신�? ??000-?�울00-0000??/span>
              <span>?�메?? inquiry@mclean21.com</span>
            </div>
            <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 8 }}>© 2025 McLean Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ?�?�?� ?�단 고정 결제 �??�?�?� */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #e8e6e0", padding: "12px 20px", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select onChange={(e) => setSelectedPlan(e.target.value)} value={selectedPlan}
            style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid #e8e6e0", fontSize: 13, fontWeight: 600, color: "#1a2744", background: "#fff", cursor: "pointer" }}>
            {Object.values(PLANS).filter(p => p.price > 0).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => setIsAnnual(!isAnnual)}
            style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #e8e6e0", fontSize: 13, fontWeight: 600, cursor: "pointer", background: isAnnual ? "#1a2744" : "#fff", color: isAnnual ? "#fff" : "#1a2744", whiteSpace: "nowrap" }}>
            {isAnnual ? "?�간 (20% ?�인)" : "?�간"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {(() => {
            const plan = Object.values(PLANS).find(p => p.id === selectedPlan) || Object.values(PLANS)[1];
            const monthly = plan?.price || 0;
            const price = isAnnual ? Math.round(monthly * 0.8) : monthly;
            return (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#1a2744", lineHeight: 1.1 }}>
                  ??price.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#8a8a9a" }}> / ??/span>
                  {isAnnual && <span style={{ fontSize: 10, fontWeight: 800, color: "#0fa573", marginLeft: 4 }}>-20%</span>}
                </p>
                <p style={{ fontSize: 10, color: "#8a8a9a" }}>{isAnnual ? `????{(price * 12).toLocaleString()} · VAT ?�함` : "VAT ?�함"}</p>
              </div>
            );
          })()}
          <button onClick={() => router.push("/login")}
            style={{ padding: "10px 24px", borderRadius: 11, background: "linear-gradient(135deg, #1a2744, #2d4270)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(26,39,68,0.25)" }}>
            구독 ?�작?�기
          </button>
        </div>
      </div>
    </div>
  );
}
