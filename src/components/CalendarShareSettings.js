"use client";
// 설정 > 캘린더 구독(ICS) + 읽기 전용 공유 링크(세무사·가족용 연간 보고서)
// - 캘린더: calendar_feeds 에 본인 세션으로 직접 upsert(RLS 본인만). URL = /api/calendar/<token>
// - 공유: /api/share (생성·목록·해지, Bearer 토큰). 공개 화면 = /share/<token>
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { toast } from "./shared";

const BASE = "https://www.ownly.kr";
const calUrl = (token) => `${BASE}/api/calendar/${token}`;
const shareUrl = (token) => `${BASE}/share/${token}`;

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("링크를 복사했어요"); }
  catch { toast("복사하지 못했어요. 링크를 길게 눌러 직접 복사해 주세요", "error"); }
}

async function authFetch(url, init = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(url, { ...init, headers: { ...(init.headers || {}), "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "요청에 실패했어요");
  return body;
}

const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "short", day: "numeric" }); };
const eyebrow = { fontSize: 12, fontWeight: 700, color: "#8a8a9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 };
const help = { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 12px" };
const urlBox = { fontSize: 12, color: "var(--text)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px", wordBreak: "break-all", fontFamily: "ui-monospace, monospace" };
const input = { padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13 };

export default function CalendarShareSettings() {
  const { user } = useApp();
  const thisYear = new Date().getFullYear();
  const [feed, setFeed] = useState({ loading: true, token: null });
  const [calBusy, setCalBusy] = useState(false);
  const [links, setLinks] = useState({ loading: true, rows: [] });
  const [form, setForm] = useState({ year: thisYear - 1, label: "", days: 30 });
  const [shareBusy, setShareBusy] = useState(false);
  const [now] = useState(() => Date.now()); // 만료 표시 기준 시각 (렌더 중 Date.now 호출 금지)
  const uid = user?.id;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const [{ data }, list] = await Promise.all([
        supabase.from("calendar_feeds").select("token").eq("user_id", uid).maybeSingle(),
        authFetch("/api/share").catch(() => ({ links: [] })),
      ]);
      if (cancelled) return;
      setFeed({ loading: false, token: data?.token || null });
      setLinks({ loading: false, rows: list.links || [] });
    })();
    return () => { cancelled = true; };
  }, [uid]);

  const issueCalendar = async () => {
    if (!uid) return;
    if (feed.token && !window.confirm("새 링크를 만들면 기존 구독 링크는 더 이상 동작하지 않아요. 캘린더 앱에서 새 링크로 다시 추가해야 합니다. 계속할까요?")) return;
    setCalBusy(true);
    const token = randomToken();
    const { error } = await supabase.from("calendar_feeds").upsert([{ user_id: uid, token, created_at: new Date().toISOString() }], { onConflict: "user_id" });
    setCalBusy(false);
    if (error) { toast("링크를 만들지 못했어요: " + error.message, "error"); return; }
    setFeed({ loading: false, token });
    toast(feed.token ? "새 링크를 만들었어요. 기존 링크는 무효가 됐습니다" : "캘린더 구독 링크를 만들었어요");
  };

  const revokeCalendar = async () => {
    if (!uid || !window.confirm("구독 링크를 해지하면 이 링크로 추가한 캘린더가 더 이상 갱신되지 않아요. 해지할까요?")) return;
    setCalBusy(true);
    const { error } = await supabase.from("calendar_feeds").delete().eq("user_id", uid);
    setCalBusy(false);
    if (error) { toast("해지하지 못했어요: " + error.message, "error"); return; }
    setFeed({ loading: false, token: null });
    toast("캘린더 구독 링크를 해지했어요");
  };

  const createShare = async () => {
    setShareBusy(true);
    try {
      const { link } = await authFetch("/api/share", { method: "POST", body: JSON.stringify({ year: Number(form.year), label: form.label, days: Number(form.days) }) });
      setLinks((s) => ({ ...s, rows: [link, ...s.rows] }));
      setForm((f) => ({ ...f, label: "" }));
      copy(shareUrl(link.token));
    } catch (e) { toast(e.message, "error"); }
    setShareBusy(false);
  };

  const revokeShare = async (id) => {
    if (!window.confirm("이 공유 링크를 해지할까요? 받은 사람은 더 이상 보고서를 열 수 없어요.")) return;
    try {
      await authFetch(`/api/share?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setLinks((s) => ({ ...s, rows: s.rows.map((r) => (r.id === id ? { ...r, revoked_at: new Date().toISOString() } : r)) }));
      toast("공유를 해지했어요");
    } catch (e) { toast(e.message, "error"); }
  };

  const years = Array.from({ length: 4 }, (_, i) => thisYear - i);

  return (
    <>
      <div className="surface-card" style={{ padding: 20, marginBottom: 18 }}>
        <p style={eyebrow}>📅 캘린더 구독</p>
        <p style={help}>
          월세 납부일·계약 만료일(90일 전 알림)·전월세 신고 기한·세금 일정을 구글 캘린더나 아이폰 캘린더에서 볼 수 있어요.
          온리에서 물건 정보를 바꾸면 캘린더 앱이 몇 시간 안에 자동으로 다시 가져갑니다(앱마다 갱신 주기가 달라요).
        </p>
        {feed.loading ? (
          <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0 }}>불러오는 중…</p>
        ) : feed.token ? (
          <>
            <div style={urlBox}>{calUrl(feed.token)}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button className="btn btn-fill btn-sm" onClick={() => copy(calUrl(feed.token))}>링크 복사</button>
              <button className="btn btn-ghost btn-sm" disabled={calBusy} onClick={issueCalendar}>재발급</button>
              <button className="btn btn-ghost btn-sm" disabled={calBusy} onClick={revokeCalendar}>해지</button>
            </div>
            <ul style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8, margin: "12px 0 0", paddingLeft: 18 }}>
              <li><b>구글 캘린더</b>: PC 웹에서 왼쪽 &lsquo;다른 캘린더&rsquo; 옆 + → &lsquo;URL로 추가&rsquo; → 링크 붙여넣기</li>
              <li><b>아이폰</b>: 설정 → 캘린더 → 계정 → 계정 추가 → 기타 → &lsquo;구독 캘린더 추가&rsquo; → 링크 붙여넣기</li>
            </ul>
          </>
        ) : (
          <button className="btn btn-fill btn-sm" disabled={calBusy || !uid} onClick={issueCalendar}>{calBusy ? "만드는 중…" : "캘린더 구독 링크 만들기"}</button>
        )}
        <p style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6, margin: "10px 0 0" }}>
          링크를 아는 사람은 누구나 일정(세입자 이름·월세 금액·주소 앞부분)을 볼 수 있어요. 다른 사람에게 보내지 말고, 유출이 의심되면 재발급하세요. 세입자 전화번호는 포함되지 않습니다.
          세금 일정은 일반적인 기한 안내이며 실제 기한은 국세청·지자체 공지를 확인하세요.
        </p>
      </div>

      <div className="surface-card" style={{ padding: 20, marginBottom: 18 }}>
        <p style={eyebrow}>🔗 세무사·가족에게 보고서 공유</p>
        <p style={help}>
          링크를 받은 사람은 <b>로그인 없이</b> 해당 연도 수입·지출 요약(물건별 월세 수입, 장부 카테고리별 합계, 수리비, 보증금)을 볼 수 있습니다.
          읽기 전용이며, 세입자 이름은 가려지고 전화번호는 보이지 않아요.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select aria-label="연도" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} style={input}>
            {years.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <input aria-label="받는 사람 메모" placeholder="받는 사람 (예: OO세무사)" maxLength={40} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} style={{ ...input, flex: "1 1 160px", minWidth: 0 }} />
          <select aria-label="만료" value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))} style={input}>
            {[7, 30, 90].map((d) => <option key={d} value={d}>{d}일 후 만료</option>)}
          </select>
          <button className="btn btn-fill btn-sm" disabled={shareBusy || !uid} onClick={createShare}>{shareBusy ? "만드는 중…" : "링크 만들기"}</button>
        </div>

        <div style={{ marginTop: 14 }}>
          {links.loading ? null : links.rows.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0 }}>아직 만든 공유 링크가 없어요.</p>
          ) : links.rows.map((r) => {
            const expired = new Date(r.expires_at).getTime() <= now;
            const live = !r.revoked_at && !expired;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{r.label || "받는 사람 미지정"} · {r.year}년</p>
                  <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "3px 0 0" }}>
                    {r.revoked_at ? <span className="chip">해지됨</span> : expired ? <span className="chip chip-warn">만료됨</span> : <span className="chip chip-success">{fmtDate(r.expires_at)}까지</span>}
                  </p>
                </div>
                {live && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-soft btn-sm" onClick={() => copy(shareUrl(r.token))}>링크 복사</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => revokeShare(r.id)}>해지</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
