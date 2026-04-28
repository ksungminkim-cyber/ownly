// 이름에서 아바타에 표시할 첫 글자 추출
// 법인 표기·괄호·특수문자를 제거하고 의미 있는 첫 글자 반환
//
// 예:
//   "(주)카탈로그"   → "카"
//   "(유)홍길동"     → "홍"
//   "주식회사 ABC"   → "A"
//   "[관리] 김철수"  → "김"
//   "  김철수  "     → "김"
//   ""              → "?"

const PREFIX_RE = /^(주식회사|유한회사|재단법인|사단법인|합자회사|합명회사|유한책임회사|개인사업자)\s*/;

export function getInitial(name) {
  if (!name) return "?";
  let s = String(name)
    .replace(/\([^)]*\)/g, "")   // (주), (유) 등 괄호 안 표기 제거
    .replace(/\[[^\]]*\]/g, "")  // [관리] 등 대괄호 표기 제거
    .replace(/^[㈜㈐㈑㈒㈓㈔㈕㈖㈗㈘㈙㈚㈛]/g, "") // 한자 약어
    .replace(PREFIX_RE, "")      // 풀네임 법인 표기
    .trim();
  if (!s) s = String(name).trim();
  // 의미 없는 특수문자만 남았으면 원본의 첫 영문자/한글 찾기
  const m = s.match(/[가-힣A-Za-z0-9]/);
  if (m) return m[0].toUpperCase();
  return "?";
}
