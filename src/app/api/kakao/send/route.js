// src/app/api/kakao/send/route.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SOLAPI_API_KEY    = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_PFID       = process.env.SOLAPI_PFID;
const SOLAPI_FROM       = process.env.SOLAPI_FROM || "";

const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

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

// tab → notification_logs.type 매핑
const TAB_TO_TYPE = {
  unpaid: "unpaid",
  upcoming: "unpaid",
  expiring: "expiry",
};

function isOwnerMgt(t) {
  if (t.pType === "\uc0c1\uac00") return true;
  if (t.pType === "\uc8fc\uac70") return !["\uc544\ud30c\ud2b8", "\uc624\ud53c\uc2a4\ud154"].includes(t.sub);
  return false;
}

// ✅ 실제 솔라피 템플릿 변수명과 정확히 일치
function buildVariables(templateKey, t) {
  const todayStr = new Date().toLocaleDateString("ko-KR");
  const rent     = String(t.rent || 0);
  const mgt      = String(t.maintenance || 0);
  const total    = String((t.rent || 0) + (t.maintenance || 0));
  const addr     = t.addr || "\ud574\ub2f9 \ubb3c\uac74";
  const name     = t.name || "\uc784\ucc28\uc778";
  const endDate  = t.end_date || t.end || "\ubbf8\uc815";
  const dLeft    = String(t.daysLeft ?? "");
  const payDay   = String(t.pay_day || 5);

  if (templateKey === "unpaid") {
    return {
      "#{\uc774\ub984}": name,
      "#{\uc8fc\uc18c}": addr,
      "#{\uae08\uc561}": rent,
      "#{\ub0a0\uc9dc}": todayStr,
    };
  }
  if (templateKey === "unpaid_with_mgt") {
    return {
      "#{\uc774\ub984}": name,
      "#{\uc8fc\uc18c}": addr,
      "#{\uae08\uc561}": rent,
      "#{\uad00\ub9ac\ube44}": mgt,
      "#{\ucd1d\uae08\uc561}": total,
      "#{\ub0a0\uc9dc}": todayStr,
    };
  }
  if (templateKey === "upcoming") {
    return {
      "#{\uc774\ub984}": name,
      "#{\uc8fc\uc18c}": addr,
      "#{\uae08\uc561}": rent,
      "#{D-day}": dLeft,
      "#{\ub0a9\ubd80\uc77c}": payDay,
    };
  }
  if (templateKey === "upcoming_with_mgt") {
    return {
      "#{\uc774\ub984}": name,
      "#{\uc8fc\uc18c}": addr,
      "#{\uae08\uc561}": rent,
      "#{\uad00\ub9ac\ube44}": mgt,
      "#{\ucd1d\uae08\uc561}": total,
      "#{D-day}": dLeft,
      "#{\ub0a9\ubd80\uc77c}": payDay,
    };
  }
  if (templateKey === "expiring") {
    return {
      "#{\uc774\ub984}": name,
      "#{\uc8fc\uc18c}": addr,
      "#{\ub9cc\ub8cc\uc77c}": endDate,
      "#{D-day}": dLeft,
    };
  }
  return {};
}

// 발송 로그 기록 (실패해도 요청 자체는 실패시키지 않음)
async function logSend({ userId, tenant, type, templateKey, variables, status, errorMessage, messageId }) {
  if (!supabaseAdmin || !userId) return;
  try {
    const preview = Object.entries(variables).map(([k, v]) => `${k}=${v}`).join(", ");
    await supabaseAdmin.from("notification_logs").insert({
      user_id: userId,
      tenant_id: tenant?.id || null,
      type,
      channel: "kakao",
      template_key: templateKey,
      message: preview,
      status,
      error_message: errorMessage || null,
      provider_message_id: messageId || null,
      sent_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("notification_logs insert failed:", e);
  }
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { tab, tenant, userId } = body || {};

  if (!tenant?.phone) {
    return Response.json({ error: "\uc804\ud654\ubc88\ud638 \uc5c6\uc74c" }, { status: 400 });
  }

  const hasMgt = isOwnerMgt(tenant) && (tenant.maintenance || 0) > 0;
  let templateKey = tab;
  if (tab === "unpaid"   && hasMgt) templateKey = "unpaid_with_mgt";
  if (tab === "upcoming" && hasMgt) templateKey = "upcoming_with_mgt";

  const templateId = TEMPLATE_MAP[templateKey];
  const logType = TAB_TO_TYPE[tab] || "kakao";

  if (!templateId) {
    await logSend({ userId, tenant, type: logType, templateKey, variables: {}, status: "failed", errorMessage: "\ud15c\ud50c\ub9bf \uc5c6\uc74c: " + templateKey });
    return Response.json({ error: "\ud15c\ud50c\ub9bf \uc5c6\uc74c: " + templateKey }, { status: 400 });
  }

  const variables = buildVariables(templateKey, tenant);
  const to = tenant.phone.replace(/-/g, "");

  const sendBody = {
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

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": getSolapiAuthHeader(),
      },
      body: JSON.stringify(sendBody),
    });

    const data = await res.json();

    if (!res.ok || data.errorCode) {
      console.error("\uc194\ub77c\ud53c \uc5d0\ub7ec:", JSON.stringify(data));
      const errMsg = data.errorMessage || JSON.stringify(data);
      await logSend({ userId, tenant, type: logType, templateKey, variables, status: "failed", errorMessage: errMsg });
      return Response.json({ error: errMsg }, { status: 500 });
    }

    const messageId = data.messageId || data.groupId;
    await logSend({ userId, tenant, type: logType, templateKey, variables, status: "success", messageId });
    return Response.json({ success: true, messageId });
  } catch (e) {
    console.error("kakao send error:", e);
    await logSend({ userId, tenant, type: logType, templateKey, variables, status: "failed", errorMessage: e.message });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
