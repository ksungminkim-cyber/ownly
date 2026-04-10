import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_PFID = process.env.SOLAPI_PFID;
const SOLAPI_FROM = process.env.SOLAPI_FROM || "";
const REPAIR_TEMPLATE_ID = "KA01TP260409070703777fnl8SYOG5rt";

function getSolapiAuth() {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const hmac = crypto.createHmac("sha256", SOLAPI_API_SECRET);
  hmac.update(date + salt);
  const signature = hmac.digest("hex");
  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function POST(req) {
  try {
    const { tenantId, category, memo, address, tenantName } = await req.json();

    if (!tenantId) {
      return Response.json({ error: "tenantId required" }, { status: 400 });
    }

    // service_role key로 임대인 정보 조회
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // tenants 테이블에서 user_id 조회
    const { data: tenant, error: tErr } = await adminClient
      .from("tenants")
      .select("user_id")
      .eq("id", tenantId)
      .single();

    if (tErr || !tenant) {
      return Response.json({ error: "tenant not found" }, { status: 404 });
    }

    // auth.users에서 임대인 전화번호 조회
    const { data: { user }, error: uErr } = await adminClient.auth.admin.getUserById(tenant.user_id);

    if (uErr || !user) {
      return Response.json({ error: "user not found" }, { status: 404 });
    }

    const ownerPhone = user.user_metadata?.phone || user.phone;
    if (!ownerPhone) {
      return Response.json({ error: "owner phone not found" }, { status: 400 });
    }

    const to = ownerPhone.replace(/-/g, "");
    const variables = {
      "#{주소}": address || "",
      "#{이름}": tenantName || "",
      "#{분야}": category || "",
      "#{내용}": (memo || "").slice(0, 100),
    };

    const body = {
      message: {
        to,
        from: SOLAPI_FROM,
        kakaoOptions: {
          pfId: SOLAPI_PFID,
          templateId: REPAIR_TEMPLATE_ID,
          variables,
          disableSms: false,
        },
      },
    };

    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": getSolapiAuth(),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.errorCode) {
      console.error("solapi error:", JSON.stringify(data));
      // 알림톡 실패해도 수리요청 자체는 성공으로 처리
      return Response.json({ success: false, error: data.errorMessage }, { status: 200 });
    }

    return Response.json({ success: true });

  } catch (e) {
    console.error("repair-notify error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
