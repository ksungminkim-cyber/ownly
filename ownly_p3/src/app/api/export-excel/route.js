// src/app/api/export-excel/route.js
// 세금 신고 참고용 엑셀 내보내기
// POST /api/export-excel { year, tenants, payments, repairs, ledger }
// CSV 형식으로 반환 (엑셀에서 바로 열림)

export async function POST(req) {
  try {
    const { year, tenants, payments, repairs, ledger } = await req.json();
    const y = Number(year) || new Date().getFullYear();

    // ── 시트1: 임대 수입 현황 ──────────────────────────────────────
    const incomeRows = [];
    incomeRows.push(["[시트1] 임대 수입 현황", "", "", "", "", ""]);
    incomeRows.push([`${y}년 임대소득 신고 참고자료 (Ownly 자동 생성)`, "", "", "", "", ""]);
    incomeRows.push(["", "", "", "", "", ""]);
    incomeRows.push(["세입자명", "주소", "유형", "월세(만원)", "연간수입(만원)", "비고"]);

    const tenantIncome = (tenants || []).map(t => {
      const annualRent = (t.rent || 0) * 12;
      return [
        t.name || "",
        t.address || t.addr || "",
        t.p_type || t.pType || "",
        t.rent || 0,
        annualRent,
        t.business_name || t.biz || "",
      ];
    });
    tenantIncome.forEach(r => incomeRows.push(r));

    const totalAnnual = (tenants || []).reduce((s, t) => s + (t.rent || 0) * 12, 0);
    incomeRows.push(["", "", "", "", "", ""]);
    incomeRows.push(["합계", "", "", "", totalAnnual, ""]);

    // ── 시트2: 월별 수금 내역 ──────────────────────────────────────
    const payRows = [];
    payRows.push(["[시트2] 월별 수금 내역", "", "", "", "", ""]);
    payRows.push(["", "", "", "", "", ""]);
    payRows.push(["월", "세입자명", "납부금액(만원)", "납부일", "상태", "비고"]);

    const yearPayments = (payments || []).filter(p =>
      (p.year || new Date().getFullYear()) === y
    ).sort((a, b) => (a.month || 0) - (b.month || 0));

    yearPayments.forEach(p => {
      const tenant = (tenants || []).find(t => t.id === (p.tenant_id || p.tid));
      payRows.push([
        `${p.month || ""}월`,
        tenant?.name || "",
        p.amount || p.amt || 0,
        p.paid_date || p.paid || "",
        p.status === "paid" ? "납부완료" : "미납",
        "",
      ]);
    });

    const totalPaid = yearPayments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || p.amt || 0), 0);
    payRows.push(["", "", "", "", "", ""]);
    payRows.push(["합계(납부완료)", "", totalPaid, "", "", ""]);

    // ── 시트3: 필요경비 내역 ──────────────────────────────────────
    const expRows = [];
    expRows.push(["[시트3] 필요경비 내역 (세금 신고 시 공제 가능)", "", "", "", "", ""]);
    expRows.push(["※ 실제 세금 신고 시 증빙서류(영수증)가 필요합니다", "", "", "", "", ""]);
    expRows.push(["", "", "", "", "", ""]);
    expRows.push(["날짜", "분류", "내용", "금액(만원)", "물건", "비고"]);

    // 수리비
    const yearRepairs = (repairs || []).filter(r => {
      const d = new Date(r.date || "");
      return d.getFullYear() === y;
    });
    yearRepairs.forEach(r => {
      expRows.push([
        r.date || "",
        r.category || "수리비",
        r.memo || "",
        r.cost || 0,
        r.property_name || "",
        r.vendor || "",
      ]);
    });

    // 간편 장부 지출
    const yearLedgerExp = (ledger || []).filter(l => {
      const d = new Date(l.date || "");
      return d.getFullYear() === y && l.type === "expense";
    });
    yearLedgerExp.forEach(l => {
      expRows.push([
        l.date || "",
        l.category || "기타지출",
        l.memo || l.description || "",
        l.amount || 0,
        "",
        "",
      ]);
    });

    const totalRepair = yearRepairs.reduce((s, r) => s + (r.cost || 0), 0);
    const totalLedger = yearLedgerExp.reduce((s, l) => s + (l.amount || 0), 0);
    const totalExp = totalRepair + totalLedger;

    expRows.push(["", "", "", "", "", ""]);
    expRows.push(["합계", "", "", totalExp, "", ""]);

    // ── 시트4: 세금 요약 ──────────────────────────────────────────
    const taxRows = [];
    taxRows.push(["[시트4] 세금 신고 참고 요약", "", ""]);
    taxRows.push([`${y}년 귀속 임대소득 요약`, "", ""]);
    taxRows.push(["※ 본 자료는 참고용이며 실제 세금 신고는 세무사에게 문의하세요", "", ""]);
    taxRows.push(["", "", ""]);
    taxRows.push(["항목", "금액(만원)", "비고"]);
    taxRows.push(["총 임대 수입", totalAnnual, "연간 월세 합산"]);
    taxRows.push(["수리비 공제", totalRepair, "증빙 필요"]);
    taxRows.push(["기타 지출 공제", totalLedger, "증빙 필요"]);
    taxRows.push(["총 필요경비", totalExp, "수리비+기타"]);
    taxRows.push(["과세표준 (추정)", Math.max(0, totalAnnual - totalExp), "수입-경비"]);
    taxRows.push(["", "", ""]);
    taxRows.push(["종합소득세 신고 기한", "5월 31일", "매년"]);
    taxRows.push(["부가세 신고 기한", "1월·7월 25일", "상가 임대인"]);

    // ── CSV 생성 ─────────────────────────────────────────────────
    const escape = (v) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const toCSV = (rows) => rows.map(r => r.map(escape).join(",")).join("\n");

    const sections = [
      toCSV(incomeRows),
      "",
      toCSV(payRows),
      "",
      toCSV(expRows),
      "",
      toCSV(taxRows),
    ].join("\n");

    // BOM + CSV (엑셀 한글 깨짐 방지)
    const bom = "\uFEFF";
    const csv = bom + sections;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ownly_tax_${y}.csv"`,
      },
    });
  } catch (e) {
    console.error("export-excel error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
