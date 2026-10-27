"use client";
// 플러스(알림톡 한도 있음)인데 세입자 자동 알림톡이 꺼져 있으면 한 번에 켜도록 유도한다.
// 구독의 본체는 "매달 자동으로 해주는 일"이라, 결제 직후·대시보드에서 바로 켤 수 있어야 한다.
// 설정 저장 위치·의미는 AutoAlimtalkSettings 와 동일 (auth user_metadata.auto_alimtalk = { upcoming, unpaid }).
import { useState } from "react";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { toast } from "./shared";
import { track } from "../lib/track";

const DISMISS_KEY = "ownly_auto_alimtalk_nudge_off";

export default function AutoAlimtalkNudge({ variant = "banner", from = "dashboard" }) {
  const { user, tenants, getPlanLimit } = useApp();
  const [on, setOn] = useState(() => {
    const s = user?.user_metadata?.auto_alimtalk;
    return !!(s && (s.upcoming || s.unpaid));
  });
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [saving, setSaving] = useState(false);

  const limit = getPlanLimit("kakaoMonthly") || 0;
  const withPhone = tenants.filter((t) => t.status !== "공실" && t.status !== "퇴거" && String(t.phone || "").replace(/[^0-9]/g, "")).length;
  if (!limit || on || (variant === "banner" && dismissed)) return null;

  const turnOn = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { auto_alimtalk: { upcoming: true, unpaid: true } } });
    setSaving(false);
    if (error) {
      toast("저장 실패: " + error.message, "error");
      return;
    }
    setOn(true);
    track("auto_alimtalk_on", { from });
    toast("켜졌어요. 납부일 전날과 미납 시 온리가 세입자에게 대신 보냅니다");
  };
  const later = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
  };

  const body = (
    <>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>세입자 자동 알림톡이 꺼져 있습니다</p>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
        켜 두면 납부일 전날 안내와 미납 다음 날 독촉을 온리가 대신 보냅니다. 월 {limit}건 한도 안에서 발송되고 언제든 설정에서 끌 수 있습니다.
        {withPhone === 0 && " 지금은 전화번호가 등록된 세입자가 없어 등록 후부터 발송됩니다."}
      </p>
    </>
  );

  if (variant === "card") {
    return (
      <div className="surface-card" style={{ padding: "14px 18px", marginBottom: 20, textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(91,79,207,0.1)", color: "#5b4fcf", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MessageSquareText size={16} strokeWidth={2.2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {body}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={turnOn} disabled={saving} className="btn btn-fill btn-sm">
              {saving ? "저장 중..." : "지금 켜기"}
            </button>
            <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
              설정에서 고르기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="action-banner action-banner-info" style={{ cursor: "default", alignItems: "flex-start" }}>
      <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(91,79,207,0.1)", color: "#5b4fcf", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <MessageSquareText size={16} strokeWidth={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{body}</div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={turnOn} disabled={saving} className="btn btn-fill btn-sm">
          {saving ? "저장 중..." : "한 번에 켜기"}
        </button>
        <button onClick={later} className="btn btn-ghost btn-sm">
          나중에
        </button>
      </div>
    </div>
  );
}
