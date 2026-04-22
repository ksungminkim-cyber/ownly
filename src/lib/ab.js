"use client";
import { useState, useEffect } from "react";

// GA event helper
function ga(name, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  } catch {}
}

// A/B 변형 할당 — 50/50 스플릿, localStorage 지속
// 1회 할당 후 같은 유저는 항상 같은 variant 조회
export function useABVariant(experimentName, { weights = [50, 50] } = {}) {
  const [variant, setVariant] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = `ab_${experimentName}`;
    let v;
    try {
      v = localStorage.getItem(key);
      if (v !== "A" && v !== "B") {
        const total = weights[0] + weights[1];
        const r = Math.random() * total;
        v = r < weights[0] ? "A" : "B";
        localStorage.setItem(key, v);
        ga("ab_assignment", { experiment: experimentName, variant: v });
      }
    } catch {
      v = Math.random() < 0.5 ? "A" : "B";
    }
    setVariant(v);
  }, [experimentName]);

  // SSR hydration 안전 — mount 전엔 'A' 기본값
  return { variant: mounted ? variant : "A", mounted };
}

export function trackABConversion(experimentName, goal = "signup_click") {
  try {
    const v = typeof window !== "undefined" ? localStorage.getItem(`ab_${experimentName}`) : null;
    if (v) ga("ab_conversion", { experiment: experimentName, variant: v, goal });
  } catch {}
}
