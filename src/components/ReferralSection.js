"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useApp } from "../context/AppContext";
import { toast } from "./shared";

// 친구 초대 UI — 내 초대 링크 + 초대 현황
// 코드 미발급 시 즉석 발급 (백필 누락된 기존 유저 대응)
export default function ReferralSection() {
  const { user } = useApp();
  const [code, setCode] = useState(null);
  const [stats, setStats] = useState({ invited: 0, rewardDays: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      try {
        // 1) 기존 코드 조회
        const { data: codeRow, error: codeErr } = await supabase
          .from("user_invite_codes").select("code").eq("user_id", user.id).maybeSingle();

        if (codeErr) {
          // 테이블 자체가 없거나 RLS 문제 — 친구초대 기능 비활성 상태
          if (!cancelled) { setError("초대 기능 준비 중 (관리자에게 문의)"); setLoading(false); }
          return;
        }

        let resolvedCode = codeRow?.code;

        // 2) 코드 없으면 즉석 발급 시도
        if (!resolvedCode) {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch("/api/invite/generate-code", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
          });
          const result = await res.json();
          if (result.code) resolvedCode = result.code;
          else throw new Error(result.error || "코드 발급 실패");
        }

        if (!cancelled) setCode(resolvedCode);

        // 3) 보상 통계
        const { data: rewards } = await supabase
          .from("invite_rewards").select("reward_days").eq("inviter_id", user.id);
        if (rewards && !cancelled) {
          const totalDays = rewards.reduce((s, r) => s + (r.reward_days || 0), 0);
          setStats({ invited: rewards.length, rewardDays: totalDays });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const inviteUrl = code ? `https://www.ownly.kr/login?mode=signup&ref=${code}` : "";

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        toast("📋 초대 링크가 복사됐습니다");
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {}
  };

  const shareNative = () => {
    const text = `온리(Ownly) 임대 관리 플랫폼에 초대합니다! 이 링크로 가입하면 Plus 30일 무료 체험이 추가돼요:\n${inviteUrl}`;
    if (navigator.share) {
      navigator.share({ title: "온리 초대", text, url: inviteUrl }).catch(() => copyLink());
    } else {
      copyLink();
    }
  };

  // 로딩 또는 에러 상태도 명확히 노출 (이전엔 null 반환해서 무엇도 안 보였음)
  if (loading) {
    return (
      <div style={{ background: "rgba(91,79,207,0.04)", border: "1px solid rgba(91,79,207,0.15)", borderRadius: 16, padding: 22, marginBottom: 18, fontSize: 13, color: "#8a8a9a" }}>
        🎁 친구 초대 기능 불러오는 중...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ background: "rgba(232,68,90,0.04)", border: "1px solid rgba(232,68,90,0.2)", borderRadius: 16, padding: 22, marginBottom: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#e8445a", marginBottom: 4 }}>🎁 친구 초대</p>
        <p style={{ fontSize: 12, color: "#6a6a7a" }}>{error}</p>
      </div>
    );
  }
  if (!code) return null;

  return (
    <div style={{ background: "linear-gradient(135deg,rgba(91,79,207,0.05),rgba(232,150,10,0.03))", border: "1px solid rgba(91,79,207,0.2)", borderRadius: 16, padding: 22, marginBottom: 18 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#5b4fcf", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>🎁 친구 초대</p>
      <p style={{ fontSize: 18, fontWeight: 900, color: "#1a2744", marginBottom: 4 }}>초대하면 양쪽 30일 무료 체험</p>
      <p style={{ fontSize: 13, color: "#6a6a7a", lineHeight: 1.7, marginBottom: 16 }}>
        내 링크로 친구가 가입하면 <b>친구 +30일, 나 +30일</b> Plus 체험 기간이 추가됩니다.
      </p>

      {/* 통계 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 4 }}>초대 성공</p>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#1a2744" }}>{stats.invited}<span style={{ fontSize: 13, color: "#8a8a9a", fontWeight: 700, marginLeft: 3 }}>명</span></p>
        </div>
        <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#8a8a9a", fontWeight: 700, marginBottom: 4 }}>획득 보너스</p>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#0fa573" }}>+{stats.rewardDays}<span style={{ fontSize: 13, color: "#8a8a9a", fontWeight: 700, marginLeft: 3 }}>일</span></p>
        </div>
      </div>

      {/* 링크 박스 */}
      <div style={{ padding: "11px 14px", background: "#fff", border: "1px dashed #c4c1fa", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, marginBottom: 10, overflow: "hidden", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#5b4fcf", fontWeight: 800, flexShrink: 0 }}>내 코드</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#1a2744", letterSpacing: 1 }}>{code}</span>
        <span style={{ fontSize: 11, color: "#8a8a9a", flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace", minWidth: 0 }}>
          {inviteUrl}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={shareNative}
          style={{ flex: 1, padding: "11px", borderRadius: 10, background: "linear-gradient(135deg,#1a2744,#5b4fcf)", color: "#fff", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", minWidth: 140 }}>
          💬 친구에게 공유하기
        </button>
        <button onClick={copyLink}
          style={{ padding: "11px 16px", borderRadius: 10, background: copied ? "#0fa573" : "#fff", color: copied ? "#fff" : "#5b4fcf", border: `1px solid ${copied ? "#0fa573" : "#5b4fcf40"}`, fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all .2s" }}>
          {copied ? "✓ 복사됨" : "🔗 복사"}
        </button>
      </div>

      <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 12, lineHeight: 1.7 }}>
        💡 <b>Tip</b>: 카카오톡, 임대인 카페, 블로그 등에 공유하면 효과적이에요. 친구도 이득, 나도 이득.
      </p>
    </div>
  );
}
