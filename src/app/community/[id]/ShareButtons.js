"use client";
import { useState } from "react";

export default function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {}
  };

  const shareKakao = () => {
    // 카카오톡 네이티브 공유는 SDK 필요. 모바일에서는 Web Share API 사용
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <>
      <button onClick={shareKakao}
        style={{ padding: "8px 14px", borderRadius: 9, background: "#fee500", color: "#3c1e1e", fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer" }}>
        💬 카톡·공유
      </button>
      <a href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer"
        style={{ padding: "8px 14px", borderRadius: 9, background: "#000", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
        𝕏 X
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`} target="_blank" rel="noopener noreferrer"
        style={{ padding: "8px 14px", borderRadius: 9, background: "#1877f2", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
        페이스북
      </a>
      <button onClick={copyLink}
        style={{ padding: "8px 14px", borderRadius: 9, background: copied ? "#0fa573" : "#5b4fcf", color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "background .2s" }}>
        {copied ? "✓ 복사됨" : "🔗 링크 복사"}
      </button>
    </>
  );
}
