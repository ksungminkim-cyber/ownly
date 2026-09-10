import { Fragment } from "react";

// "A · B · C" 형태의 한 줄 문구를 모바일에서 예쁘게 줄바꿈 — 각 항목은 한 덩어리로 유지하고, 줄이 바뀌더라도 "·" 로 시작하는 줄이 생기지 않게 한다.
// 항목 사이의 공백은 nowrap 바깥에 두어야 그 자리에서 줄바꿈이 허용된다.
export default function DotText({ text, sep = " · " }) {
  const parts = String(text).split(sep).filter(Boolean);
  return parts.map((p, i) => (
    <Fragment key={i}>
      <span style={{ whiteSpace: "nowrap" }}>{p}{i < parts.length - 1 ? " ·" : ""}</span>
      {i < parts.length - 1 ? " " : ""}
    </Fragment>
  ));
}
