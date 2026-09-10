// 국토부(MOLIT) 실거래 API 응답 파싱 — 서버 라우트 공용
// MOLIT 은 _type=json 을 무시하고 XML 로 답하는 경우가 많고, 한도 초과·키 오류·점검도 HTTP 200 + 오류 본문으로 돌려준다.
// 따라서 (1) JSON → XML 순으로 파싱하고 (2) resultCode 가 000/00 이 아니면 "오류"로 구분해 호출자가 "데이터 없음"과 다르게 처리하게 한다.
export function parseMolitBody(text) {
  try {
    const data = JSON.parse(text);
    const code = String(data?.response?.header?.resultCode ?? "000");
    if (!/^0+$/.test(code)) return { error: `${data?.response?.header?.resultMsg || "MOLIT error"} (${code})`, items: [] };
    const items = data?.response?.body?.items?.item;
    return { items: Array.isArray(items) ? items : items ? [items] : [] };
  } catch {
    // XML
  }
  const codeMatch = text.match(/<resultCode>\s*([^<\s]+)\s*<\/resultCode>/i) || text.match(/<returnReasonCode>\s*([^<\s]+)\s*<\/returnReasonCode>/i);
  const code = codeMatch ? codeMatch[1] : null;
  if (code && !/^0+$/.test(code)) {
    const msg = (text.match(/<resultMsg>\s*([\s\S]*?)\s*<\/resultMsg>/i) || text.match(/<returnAuthMsg>\s*([\s\S]*?)\s*<\/returnAuthMsg>/i) || [])[1];
    return { error: `${(msg || "MOLIT error").trim()} (${code})`, items: [] };
  }
  const items = [];
  for (const m of text.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const obj = {};
    for (const [, k, v] of m[1].matchAll(/<(\w+)>\s*([\s\S]*?)\s*<\/\1>/g)) obj[k] = v.trim();
    items.push(obj);
  }
  return { items };
}

/**
 * MOLIT 한 페이지 조회 (24h 캐시). 오류 본문이면 캐시를 우회해 1회 재시도하고, 그래도 오류면 errs 에 기록 후 [] 반환.
 * @param {string} url  serviceKey 포함 완성 URL
 * @param {string[]} [errs]  요청 범위 오류 수집기
 * @param {string} [label]   오류 메시지 접두 (예: "apt_rent 202608")
 */
export async function fetchMolitRows(url, errs, label = "") {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = attempt === 0
        ? await fetch(url, { next: { revalidate: 86400 } })
        : await fetch(url + "&_retry=" + Date.now(), { cache: "no-store" });
      const text = await res.text();
      const parsed = parseMolitBody(text);
      if (parsed.error) { if (attempt === 1) errs?.push(`${label}: ${parsed.error}`.trim()); continue; }
      return parsed.items;
    } catch (e) {
      if (attempt === 1) errs?.push(`${label}: ${e?.message || "fetch failed"}`.trim());
    }
  }
  return [];
}
