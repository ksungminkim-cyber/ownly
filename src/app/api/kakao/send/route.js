// src/app/api/kakao/send/route.js
import crypto from "crypto";

const SOLAPI_API_KEY    = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_PFID       = process.env.SOLAPI_PFID;
const SOLAPI_FROM       = process.env.SOLAPI_FROM || "";

function getSolapiAuthHeader() {
  const date      = new Date().toISOString();
  const salt      = crypto.randomBytes(16).toString("hex");
  const hmac      = crypto.createHmac("sha256", SOLAPI_API_SECRET);
  hmac.update(date + salt);
  const signature = hmac.digest("hex");
  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

const TEMPLATE_MAP = {
  unpaid:            "KA01TP260319022413946WEFCauw7bu",
  unpaid_with_mgt:   "KA01TP260319044202504A6snqzyf3sN",
  upcoming:          "KA01TP260319022623914XEsARo3VO2y",
  upcoming_with_mgt: "KA01TP260319044259656FmFUnv2CZOa",
  expiring:          "KA01TP260319022807781m78Wss6h4dA",
};

function isOwnerMgt(t) {
  if (t.pType === "\uc0c1\uac00") return true;
  if (t.pType === "\uc8fc\uac70") return !["\uc544\ud30c\ud2b8", "\uc624\ud53c\uc2a4\ud154"].includes(t.sub);
  return false;
}

function buildVariables(templateKey, t) {
  const todayStr = new Date().toLocaleDateString("ko-KR");
  const rent     = String(t.rent || 0);
  const mgt      = String(t.maintenance || 0);
  const total    = String((t.rent || 0) + (t.maintenance || 0));
  const addr     = t.addr || "\ud574\ub2f9 \ubb3c\uac74";
  const name     = t.name || "\uc784\ucc28\uc778";
  const endDate  = t.end_date || t.end || "\ubbf8\uc815";
  const dLeft    = String(t.daysLeft || "");

  if (templateKey === "unpaid") {
    return { "#{name}": name, "#{address}": addr, "#{amount}": rent, "#{date}": todayStr };
  }
  if (templateKey === "unpaid_with_mgt") {
    return { "#{name}": name, "#{address}": addr, "#{rent}": rent, "#{maintenance}": mgt, "#{total}": total, "#{date}": todayStr };
  }
  if (templateKey === "upcoming") {
    return { "#{name}": name, "#{address}": addr, "#{amount}": rent, "#{dday}": dLeft };
  }
  if (templateKey === "upcoming_with_mgt") {
    return { "#{name}": name, "#{address}": addr, "#{rent}": rent, "#{maintenance}": mgt, "#{total}": total, "#{dday}": dLeft };
  }
  if (templateKey === "expiring") {
    return { "#{name}": name, "#{address}": addr, "#{end_date}": endDate, "#{dday}": dLeft };
  }
  return {};
}

export async function POST(req) {
  try {
    const { tab, tenant } = await req.json();

    if (!tenant?.phone) {
      return Response.json({ error: "\uc804\ud654\ubc88\ud638 \uc5c6\uc74c" }, { status: 400 });
    }

    const hasMgt = isOwnerMgt(tenant) && (tenant.maintenance || 0) > 0;
    let templateKey = tab;
    if (tab === "unpaid"   && hasMgt) templateKey = "unpaid_with_mgt";
    if (tab === "upcoming" && hasMgt) templateKey = "upcoming_with_mgt";

    const templateId = TEMPLATE_MAP[templateKey];
    if (!templateId) {
      return Response.json({ error: "\ud15c\ud50c\ub9bf \uc5c6\uc74c: " + templateKey }, { status: 400 });
    }

    const variables = buildVariables(templateKey, tenant);
    const to = tenant.phone.replace(/-/g, "");

    // 솔라피 v4 API - 올바른 파라미터 구조
    const body = {
      message: {
        to,
        from: SOLAPI_FROM,
        kakaoOptions: {
          pfId:       SOLAPI_PFID,
          templateId,
          variables,
          disableSms: false,
        },
      },
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
      console.error("\uc194\ub77c\ud53c \uc5d0\ub7ec:", JSON.stringify(data));
      return Response.json({ error: data.errorMessage || JSON.stringify(data) }, { status: 500 });
    }

    return Response.json({ success: true, messageId: data.messageId || data.groupId });
  } catch (e) {
    console.error("kakao send error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
