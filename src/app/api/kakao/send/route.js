// src/app/api/kakao/send/route.js
// 솔라피 알림톡 발송 서버 API

import crypto from "crypto";

const SOLAPI_API_KEY    = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_PFID       = process.env.SOLAPI_PFID;

// 솔라피 HMAC-SHA256 인증 헤더 생성
function getSolapiAuthHeader() {
  const date      = new Date().toISOString();
  const salt      = crypto.randomBytes(16).toString("hex");
  const hmac      = crypto.createHmac("sha256", SOLAPI_API_SECRET);
  hmac.update(date + salt);
  const signature = hmac.digest("hex");
  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

// 템플릿 ID 맵
const TEMPLATE_MAP = {
  // 미납 (관리비 없음)
  unpaid:           "KA01TP260319022413946WEFCauw7bu",
  // 미납 (관리비 포함)
  unpaid_with_mgt:  "KA01TP260319044202504A6snqzyf3sN",
  // 납부 예정 (관리비 없음)
  upcoming:         "KA01TP260319022623914XEsARo3VO2y",
  // 납부 예정 (관리비 포함)
  upcoming_with_mgt:"KA01TP26031904425965 6FmFUnv2CZOa",
  // 계약 만료
  expiring:         "KA01TP260319022807781m78Wss6h4dA",
};

// 관리비를 임대인이 수령하는지 판단
function isOwnerMgt(tenant) {
  if (tenant.pType === "상가") return true;
  if (tenant.pType === "주거") {
    if (["아파트", "오피스텔"].includes(tenant.sub)) return false;
    return true;
  }
  return false;
}

// 템플릿 변수 치환
function buildVariables(tab, tenant) {
  const today    = new Date().toLocaleDateString("ko-KR");
  const rent     = (tenant.rent || 0).toLocaleString();
  const mgt      = (tenant.maintenance || 0).toLocaleString();
  const total    = ((tenant.rent || 0) + (tenant.maintenance || 0)).toLocaleString();
  const addr     = tenant.addr || "해당 물건";
  const name     = tenant.name || "임차인";
  const endDate  = tenant.end_date || tenant.end || "미정";
  const dLeft    = tenant.daysLeft || "";
  const payDay   = tenant.payDay   || "5";

  if (tab === "unpaid") {
    return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{날짜}": today };
  }
  if (tab === "unpaid_with_mgt") {
    return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{관리비}": mgt, "#{총금액}": total, "#{날짜}": today };
  }
  if (tab === "upcoming") {
    return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{D-day}": dLeft, "#{납부일}": payDay };
  }
  if (tab === "upcoming_with_mgt") {
    return { "#{이름}": name, "#{주소}": addr, "#{금액}": rent, "#{관리비}": mgt, "#{총금액}": total, "#{D-day}": dLeft, "#{납부일}": payDay };
  }
  if (tab === "expiring") {
    return { "#{이름}": name, "#{주소}": addr, "#{만료일}": endDate, "#{D-day}": String(dLeft) };
  }
  return {};
}

export async function POST(req) {
  try {
    const { tab, tenant } = await req.json();

    if (!tenant?.phone) {
      return Response.json({ error: "전화번호 없음" }, { status: 400 });
    }

    // 관리비 포함 여부 판단
    const hasMgt  = isOwnerMgt(tenant) && (tenant.maintenance || 0) > 0;
    let templateKey = tab;
    if (tab === "unpaid"   && hasMgt) templateKey = "unpaid_with_mgt";
    if (tab === "upcoming" && hasMgt) templateKey = "upcoming_with_mgt";

    const templateId = TEMPLATE_MAP[templateKey];
    if (!templateId) {
      return Response.json({ error: "템플릿 없음" }, { status: 400 });
    }

    const variables = buildVariables(templateKey, tenant);

    // 솔라피 메시지 발송 API
    const body = {
      messages: [{
        to:   tenant.phone.replace(/-/g, ""),
        from: process.env.SOLAPI_FROM || "01000000000",
        kakaoOptions: {
          pfId:       SOLAPI_PFID,
          templateId: templateId,
          variables:  variables,
          disableSms: false,  // 알림톡 실패 시 SMS 대체발송
        },
      }],
    };

    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": getSolapiAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.errorCode) {
      console.error("솔라피 에러:", data);
      return Response.json({ error: data.errorMessage || "발송 실패" }, { status: 500 });
    }

    return Response.json({ success: true, messageId: data.groupId });
  } catch (e) {
    console.error("kakao send error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
