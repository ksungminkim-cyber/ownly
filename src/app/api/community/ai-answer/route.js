// 커뮤니티 질문 글에 AI 자동 답변 생성
// Groq Llama 3.3 70B 사용 — 한국 부동산 전문가 페르소나
// 새 "질문" 글 작성 후 클라이언트에서 호출 → 즉시 AI 답변 코멘트 등록

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { createClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `당신은 15년 경력의 한국 부동산 임대 관리 전문가입니다. 임대인들의 커뮤니티에서 질문에 친절하게 답변합니다.

답변 원칙:
- 반드시 **3~5문장**, 한국어로만 (마크다운·bullet·번호 매기기 금지)
- 친근한 말투 ("~해요", "~입니다" 혼용 가능)
- 구체적 조치 하나는 반드시 포함 (법 조항·문서 형식·시세 범위 등)
- 모르는 내용은 추측 금지, "전문가 상담 권장" 명시
- 한자·영어·외국어 섞지 말 것
- 답변 끝에 "- 온리 AI 💬" 같은 서명 불필요 (자동 표시됨)
- 세입자 악담 금지, 중립적 법적 관점 유지
- 자신 없는 수치는 "평균 00만~00만원 수준" 식 범위로`;

export async function POST(req) {
  try {
    const { postId, title, content, category } = await req.json();
    if (!postId || !title) return new Response(JSON.stringify({ error: "postId·title 필수" }), { status: 400 });

    // 질문 글만 답변
    if (category !== "질문") {
      return new Response(JSON.stringify({ skipped: true, reason: "질문 카테고리 아님" }));
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "AI 키 미설정" }), { status: 500 });

    // Groq 호출
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `[제목]\n${title}\n\n[내용]\n${content || "(본문 없음)"}` },
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: "AI 호출 실패: " + errText.slice(0, 200) }), { status: res.status });
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) return new Response(JSON.stringify({ error: "AI 응답 비어있음" }), { status: 500 });

    // 마크다운/글머리 제거
    const clean = answer
      .replace(/^\*\*|\*\*$/g, "")
      .replace(/^[#*\-]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .trim();

    // 댓글 insert (service role)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // AI bot용 가상 user_id가 필요하지만 뷰어 입장에선 실제 유저처럼 보이면 안 됨
    // → user_id를 null로 저장하면 RLS 통과? 대신 is_ai=true로 구분
    // 실제로는 original user의 user_id를 쓰되 is_ai=true 마크 (RLS는 user_id 기반이므로)

    // 해당 post의 작성자 user_id 조회 (AI 답변도 같은 user_id로 기록해 RLS 통과)
    const { data: post } = await admin
      .from("community_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    const { data: inserted, error: insertErr } = await admin
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: post?.user_id || null,
        author_name: "🤖 온리 AI",
        content: clean,
        is_ai: true,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[ai-answer insert]", insertErr);
      return new Response(JSON.stringify({ error: "댓글 저장 실패: " + insertErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, comment: inserted }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-answer]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
