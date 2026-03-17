"use client";
import { useState } from "react";

const NOTICES = [
  {
    id: 1,
    type: "서비스",
    title: "Ownly 서비스 오픈 안내",
    date: "2025-01-01",
    important: true,
    content: `안녕하세요, Ownly 팀입니다.

임대 자산 관리 플랫폼 플랫폼 Ownly가 정식 오픈하였습니다.

■ 주요 기능
- 물건 관리: 주거·상가·토지 임대 물건 통합 관리
- 세입자 관리: 임차인 정보 및 계약 현황 한눈에 확인
- 수금 현황: 월별 납부 현황 추적 및 미납 알림
- 세금 시뮬레이터: 종합소득세·부가가치세 예상 세액 계산
- 내용증명: 법적 효력 있는 내용증명 문서 작성

■ 구독 플랜
- 무료: 물건 2개, 세입자 3명
- 스타터 (월 10,900원): 물건 5개, 세입자 10명
- 스타터+ (월 19,900원): 물건 15개, 세입자 30명
- 프로 (월 32,900원): 무제한

서비스 이용 중 불편사항이나 개선 의견이 있으시면 inquiry@mclean21.com으로 언제든 연락주세요.

감사합니다.
Ownly 팀 드림`,
  },
  {
    id: 2,
    type: "점검",
    title: "[안내] 서비스 안정화 업데이트",
    date: "2025-02-01",
    important: false,
    content: `안녕하세요, Ownly 팀입니다.

더 나은 서비스 제공을 위해 안정화 업데이트를 진행하였습니다.

■ 업데이트 내용
- 데이터 로딩 속도 개선
- 세금 시뮬레이터 계산 로직 업데이트 (2024년 귀속 세율 반영)
- 모바일 화면 최적화
- 버그 수정 및 성능 개선

앞으로도 더 나은 서비스로 찾아뵙겠습니다.
감사합니다.`,
  },
  {
    id: 3,
    type: "기능",
    title: "토지 임대 관리 기능 추가",
    date: "2025-03-01",
    important: false,
    content: `안녕하세요, Ownly 팀입니다.

기존 주거·상가 임대 물건 관리에 이어 토지 임대 관리 기능이 추가되었습니다.

■ 추가 기능
- 토지 유형 물건 등록 (전·답 / 임야 / 대지 / 잡종지 / 기타)
- 토지 세목 안내 (종합소득세, 종합부동산세 등)
- 대시보드 토지 필터 추가

■ 변경 사항
- 세금 시뮬레이터: 임대 유형별(주거/상가/토지) 세목 분리 안내

이용해 주셔서 감사합니다.`,
  },
];

const TYPE_COLOR = {
  서비스: { color: "#1a2744", bg: "#eef3fd" },
  점검: { color: "#e8960a", bg: "#fdf0cc" },
  기능: { color: "#0fa573", bg: "#d0f0e6" },
  긴급: { color: "#e8445a", bg: "#fde8ec" },
};

export default function NoticePage() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Pretendard','DM Sans',sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #ebe9e3" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 20px" }}>
          <a href="/dashboard" style={{ fontSize: 12, color: "#8a8a9a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
            ← 대시보드로 돌아가기
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1a2744,#2d4270)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><polygon points="10,2 18,9 15,9 15,18 5,18 5,9 2,9" fill="white" opacity="0.95"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>Ownly</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a2744", letterSpacing: "-.5px" }}>공지사항</h1>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 24px 60px" }}>
        {selected ? (
          /* 상세 보기 */
          <div>
            <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#8a8a9a", background: "none", border: "none", cursor: "pointer", marginBottom: 20, padding: 0 }}>
              ← 목록으로
            </button>
            <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: "28px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[selected.type]?.color, background: TYPE_COLOR[selected.type]?.bg, padding: "3px 10px", borderRadius: 20 }}>{selected.type}</span>
                {selected.important && <span style={{ fontSize: 10, fontWeight: 800, color: "#e8445a", background: "#fde8ec", padding: "3px 8px", borderRadius: 20 }}>중요</span>}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a2744", marginBottom: 8 }}>{selected.title}</h2>
              <p style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 24 }}>{selected.date}</p>
              <div style={{ borderTop: "1px solid #f0efe9", paddingTop: 20 }}>
                <pre style={{ fontSize: 14, color: "#3a3a4e", lineHeight: 1.9, whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{selected.content}</pre>
              </div>
            </div>
          </div>
        ) : (
          /* 목록 */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {NOTICES.map((n) => {
              const tc = TYPE_COLOR[n.type] || TYPE_COLOR["서비스"];
              return (
                <div key={n.id} onClick={() => setSelected(n)}
                  style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 14, padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a2744"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,39,68,0.07)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#ebe9e3"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, padding: "2px 8px", borderRadius: 20 }}>{n.type}</span>
                      {n.important && <span style={{ fontSize: 10, fontWeight: 800, color: "#e8445a" }}>● 중요</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2744", marginBottom: 2 }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: "#8a8a9a" }}>{n.date}</p>
                  </div>
                  <span style={{ fontSize: 16, color: "#c0c0cc" }}>→</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
