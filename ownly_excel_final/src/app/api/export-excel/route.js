// src/app/api/export-excel/route.js
// SheetJS 브라우저 방식으로 대체됨 — 이 API는 더 이상 사용하지 않습니다
export async function POST() {
  return Response.json({ deprecated: true, message: "ExcelTab.js (SheetJS)로 대체됨" }, { status: 200 });
}
