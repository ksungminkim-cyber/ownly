"use client";
import { useEffect } from "react";
import { captureAttribution } from "../lib/track";

// 첫 방문 시 utm_*·착지 경로를 localStorage 에 1회 저장 (렌더 없음)
// 가입 후 첫 대시보드 진입에서 signup_source 이벤트로 전송된다 — src/lib/track.js
export default function AttributionCapture() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}
