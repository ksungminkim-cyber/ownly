// 커뮤니티 글 좋아요·조회수 — community_posts 의 update 정책은 작성자 본인만 허용이라
// 클라이언트가 남의 글의 likes·views 를 직접 고치면 0행 갱신(오류 없음)으로 조용히 사라졌다.
// 로그인 사용자를 확인한 뒤 service role 로 집계 컬럼만 갱신한다.
//
// POST { postId, action: "like" | "view" }  (Authorization: Bearer <access_token>)
//  - like: 내 좋아요를 토글하고 community_likes 행 수로 likes 를 다시 계산 → { liked, likes }
//  - view: views + 1 → { views }

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isRateLimited } from "../../../../lib/ratelimit";

export async function POST(req) {
  if (isRateLimited(req, "community-react", 600)) return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { postId, action } = body;
  if (!postId || !["like", "view"].includes(action)) return NextResponse.json({ error: "postId·action 필수" }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  const userId = userData.user.id;

  const { data: post } = await admin.from("community_posts").select("id, views").eq("id", postId).maybeSingle();
  if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });

  if (action === "view") {
    const views = (post.views || 0) + 1;
    const { error } = await admin.from("community_posts").update({ views }).eq("id", postId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ views });
  }

  // like 토글
  const { data: mine } = await admin.from("community_likes").select("post_id").eq("post_id", postId).eq("user_id", userId).limit(1);
  const liked = !(mine && mine.length > 0);
  const { error: toggleErr } = liked
    ? await admin.from("community_likes").insert({ post_id: postId, user_id: userId })
    : await admin.from("community_likes").delete().eq("post_id", postId).eq("user_id", userId);
  if (toggleErr) return NextResponse.json({ error: toggleErr.message }, { status: 500 });

  const { count } = await admin.from("community_likes").select("post_id", { count: "exact", head: true }).eq("post_id", postId);
  const likes = count || 0;
  const { error } = await admin.from("community_posts").update({ likes }).eq("id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ liked, likes });
}
