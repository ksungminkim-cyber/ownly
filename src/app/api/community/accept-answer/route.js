// 질문 작성자가 답변 중 하나를 "채택"
// 답변자에게는 뱃지 효과, 질문 조회자에겐 최우수 답변 식별

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

    const { postId, commentId } = await req.json();
    if (!postId || !commentId) return NextResponse.json({ error: "postId·commentId 필수" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 호출자 인증
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    const callerId = userData.user.id;

    const admin = createClient(supabaseUrl, service);

    // 질문 작성자 본인만 채택 가능
    const { data: post } = await admin.from("community_posts").select("user_id, accepted_comment_id").eq("id", postId).single();
    if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    if (post.user_id !== callerId) return NextResponse.json({ error: "질문 작성자만 답변을 채택할 수 있어요" }, { status: 403 });

    // 같은 댓글 다시 누르면 취소
    const toggleOff = post.accepted_comment_id === commentId;

    if (toggleOff) {
      await admin.from("community_comments").update({ is_accepted: false }).eq("id", commentId);
      await admin.from("community_posts").update({ accepted_comment_id: null }).eq("id", postId);
      return NextResponse.json({ ok: true, accepted: false, message: "채택이 취소됐습니다" });
    }

    // 기존 채택 해제 후 새로 설정
    if (post.accepted_comment_id) {
      await admin.from("community_comments").update({ is_accepted: false }).eq("id", post.accepted_comment_id);
    }
    await admin.from("community_comments").update({ is_accepted: true }).eq("id", commentId);
    await admin.from("community_posts").update({ accepted_comment_id: commentId }).eq("id", postId);

    return NextResponse.json({ ok: true, accepted: true, message: "✓ 답변이 채택됐어요" });
  } catch (err) {
    console.error("[accept-answer]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
