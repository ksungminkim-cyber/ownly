// src/lib/nickname.js
// 회원가입/로그인 시 닉네임 자동 생성

const ADJECTIVES = [
  "부지런한","꼼꼼한","든든한","여유로운","노련한",
  "신중한","성실한","현명한","차분한","활발한",
];
const NOUNS = [
  "임대왕","건물주","집주인","임대인","부동산왕",
  "월세왕","전세왕","투자왕","관리왕","수익왕",
];

export function generateNickname() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}_${num}`;
}

// Supabase user_metadata에서 닉네임 추출 (없으면 자동 생성값 반환)
export function getNickname(user) {
  if (!user) return "익명";
  return user.user_metadata?.nickname || generateNickname();
}
