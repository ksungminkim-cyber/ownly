// 홈 화면 추가(PWA 설치) 공통 로직 — 배너·설정·체크리스트가 같은 상태를 본다.
//
// - Chrome(Android/데스크톱)·삼성 인터넷은 `beforeinstallprompt` 를 한 번만 발생시키므로 모듈 로드 시점에 붙잡아 보관한다.
//   (컴포넌트가 나중에 마운트돼도 promptInstall() 로 네이티브 설치 시트를 띄울 수 있다)
// - iOS Safari/Chrome 은 프로그램 설치 API 가 없어 "공유 → 홈 화면에 추가" 안내만 가능하다.
// - 서비스 워커가 없으므로 "오프라인 지원" 같은 약속은 하지 않는다. 얻는 것은 홈 화면 아이콘·전체 화면·로그인 유지.
import { track } from "./track";

const INSTALLED_KEY = "ownly_pwa_installed";
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => { try { fn(); } catch {} });

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    try { localStorage.setItem(INSTALLED_KEY, String(Date.now())); } catch {}
    track("pwa_installed");
    notify();
  });
}

export function subscribeInstallState(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function canPromptInstall() { return Boolean(deferredPrompt); }

// 지금 앱(홈 화면 아이콘)으로 실행 중인지
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
// 설치를 마친 적이 있는지 (appinstalled 이벤트 또는 standalone 실행 이력)
export function isInstalled() {
  if (isStandalone()) { try { localStorage.setItem(INSTALLED_KEY, String(Date.now())); } catch {} return true; }
  try { return Boolean(localStorage.getItem(INSTALLED_KEY)); } catch { return false; }
}

// 네이티브 설치 시트 띄우기 → "accepted" | "dismissed" | "unavailable"
export async function promptInstall(from = "unknown") {
  if (!deferredPrompt) return "unavailable";
  const p = deferredPrompt;
  deferredPrompt = null;
  track("pwa_install_prompt", { from });
  try {
    p.prompt();
    const { outcome } = await p.userChoice;
    notify();
    return outcome === "accepted" ? "accepted" : "dismissed";
  } catch {
    notify();
    return "unavailable";
  }
}

// 기기·브라우저 판별 — 안내 문구 분기용
export function detectPlatform() {
  if (typeof navigator === "undefined") return { os: "desktop", browser: "other" };
  const ua = navigator.userAgent || "";
  const isIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const os = isIos ? "ios" : isAndroid ? "android" : "desktop";
  let browser = "other";
  if (/samsungbrowser/i.test(ua)) browser = "samsung";
  else if (/crios/i.test(ua)) browser = "chrome";           // iOS Chrome
  else if (/fxios/i.test(ua)) browser = "firefox";
  else if (/edg\//i.test(ua)) browser = "edge";
  else if (/chrome|chromium/i.test(ua)) browser = "chrome";
  else if (/safari/i.test(ua)) browser = "safari";
  else if (/firefox/i.test(ua)) browser = "firefox";
  return { os, browser };
}

// 플랫폼별 수동 설치 단계 (네이티브 프롬프트가 없을 때 보여준다)
export function installSteps({ os, browser }) {
  if (os === "ios") {
    return browser === "chrome"
      ? ["주소창 오른쪽의 공유 버튼(⬆)을 누릅니다", "목록에서 “홈 화면에 추가”를 선택합니다", "오른쪽 위 “추가”를 누르면 홈 화면에 온리 아이콘이 생깁니다"]
      : ["Safari 하단 가운데 공유 버튼(⬆)을 누릅니다", "목록을 내려 “홈 화면에 추가”를 선택합니다", "오른쪽 위 “추가”를 누르면 홈 화면에 온리 아이콘이 생깁니다"];
  }
  if (os === "android") {
    if (browser === "samsung") return ["하단 메뉴(≡)를 누릅니다", "“현재 페이지 추가” → “홈 화면”을 선택합니다", "“추가”를 누르면 홈 화면에 온리 아이콘이 생깁니다"];
    return ["오른쪽 위 메뉴(⋮)를 누릅니다", "“홈 화면에 추가” 또는 “앱 설치”를 선택합니다", "“설치”를 누르면 홈 화면과 앱 목록에 온리가 생깁니다"];
  }
  // 데스크톱
  if (browser === "chrome" || browser === "edge") return ["주소창 오른쪽 끝의 설치 아이콘(⊕ 또는 모니터 모양)을 누릅니다", "“설치”를 누르면 바탕화면·작업표시줄에서 앱처럼 열 수 있습니다", "휴대폰에서는 www.ownly.kr 에 접속해 같은 메뉴를 이용하세요"];
  return ["휴대폰(Chrome·Safari·삼성 인터넷)으로 www.ownly.kr 에 접속합니다", "브라우저 메뉴에서 “홈 화면에 추가”를 선택합니다", "데스크톱은 Chrome 또는 Edge 에서 주소창 설치 아이콘을 이용하세요"];
}
