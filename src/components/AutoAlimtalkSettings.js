"use client";
// 설정 > 세입자 자동 알림톡 — 켜면 매일 오전 크론(/api/notify)이 세입자에게 알림톡을 보낸다 (src/lib/alimtalk.js autoAlimtalkTargets)
// 저장 위치: auth user_metadata.auto_alimtalk = { upcoming, unpaid } (기본 꺼짐)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { toast } from "./shared";
import { PLANS, PAID_PLAN_ID } from "../lib/constants";

const OPTIONS = [
  { key: "upcoming", label: "납부일 하루 전 안내", sub: "그달 완납 기록이 없는 세입자에게 1회" },
  { key: "unpaid", label: "미납 안내", sub: "납부일 다음 날 1회, 7일 지나도 미납이면 1회 더 (부분납부는 잔액으로 안내)" },
];

export default function AutoAlimtalkSettings() {
  const router = useRouter();
  const { user, tenants, getPlanLimit } = useApp();
  const [settings, setSettings] = useState(() => user?.user_metadata?.auto_alimtalk || { upcoming: false, unpaid: false });
  const [saving, setSaving] = useState(null);
  const limit = getPlanLimit("kakaoMonthly") || 0;
  const active = tenants.filter((t) => t.status !== "공실" && t.status !== "퇴거" && Number(t.rent) > 0);
  const withPhone = active.filter((t) => String(t.phone || "").replace(/[^0-9]/g, "")).length;

  const toggle = async (key) => {
    if (!limit) { router.push("/dashboard/pricing"); return; }
    const next = { ...settings, [key]: !settings[key] };
    setSaving(key);
    const { error } = await supabase.auth.updateUser({ data: { auto_alimtalk: next } });
    setSaving(null);
    if (error) { toast("저장 실패: " + error.message, "error"); return; }
    setSettings(next);
    toast(next[key] ? "켜졌어요. 매일 오전 9시쯤 대상 세입자에게 발송됩니다" : "자동 발송을 껐어요");
  };

  return (
    <div className="surface-card" style={{ padding: 20, marginBottom: 18 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>💬 세입자 자동 알림톡</p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 12px" }}>
        켜면 온리가 매일 오전 전화번호가 등록된 세입자에게 카카오 알림톡(실패 시 문자)을 <b>임대인 대신 자동으로</b> 보냅니다.
        {limit
          ? <> 월 {limit}건 한도 안에서 발송되며, 수동 발송과 한도를 함께 씁니다. 현재 대상 세입자 {active.length}명 중 전화번호 등록 {withPhone}명.</>
          : <> 알림톡은 플러스 플랜(월 {PLANS[PAID_PLAN_ID].price.toLocaleString()}원)에서 사용할 수 있어요.</>}
      </p>
      {OPTIONS.map((o) => {
        const on = Boolean(settings[o.key]) && Boolean(limit);
        return (
          <div key={o.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{o.label}</p>
              <p style={{ fontSize: 11, color: "#8a8a9a", margin: "3px 0 0", lineHeight: 1.6 }}>{o.sub}</p>
            </div>
            <div onClick={saving ? undefined : () => toggle(o.key)} role="switch" aria-checked={on} aria-label={o.label}
              style={{ width: 44, height: 24, borderRadius: 12, background: on ? "#1a2744" : "#d1d5db", cursor: saving ? "wait" : "pointer", position: "relative", transition: "background var(--t-fast) var(--ease)", flexShrink: 0, opacity: saving === o.key ? 0.6 : 1 }}>
              <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left var(--t-fast) var(--ease)" }} />
            </div>
          </div>
        );
      })}
      <p style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6, margin: "10px 0 0" }}>
        세입자 연락처는 임대차 관리 목적으로 임대인이 등록한 번호로만 발송됩니다. 발송 내역은 알림 히스토리에서 확인할 수 있어요.
        납부 기록을 온리에 입력하지 않으면 이미 낸 세입자에게도 미납 안내가 갈 수 있으니, 켜기 전에 이번 달 수금 현황을 맞춰 주세요.
      </p>
    </div>
  );
}
