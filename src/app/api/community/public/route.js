// 공개 커뮤니티 조회 API — service role로 RLS 우회해 비회원에게도 글 노출
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (id) {
    // 단일 글 조회 + 조회수 증가
    const { data: post, error } = await admin
      .from("community_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !post) return NextResponse.json({ error: "글을 찾을 수 없습니다" }, { status: 404 });

    await admin.from("community_posts").update({ views: (post.views || 0) + 1 }).eq("id", id);

    // 댓글
    const { data: comments } = await admin
      .from("community_comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ post: { ...post, views: (post.views || 0) + 1 }, comments: comments || [] });
  }

  // 목록 조회
  let q = admin.from("community_posts").select("id, title, category, nickname, views, like_count, created_at, content").order("created_at", { ascending: false }).limit(limit);
  if (category && category !== "전체") q = q.eq("category", category);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 각 글 본문은 미리보기만 (200자)
  const posts = (data || []).map(p => ({
    ...p,
    content: p.content?.length > 200 ? p.content.slice(0, 200) + "..." : p.content,
  }));
  return NextResponse.json({ posts });
}
