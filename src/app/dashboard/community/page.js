"use client";
import { useState, useEffect, useRef } from "react";
import { SectionLabel, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
import { generateNickname } from "../../../lib/nickname";

const CATEGORIES = ["전체","공실매물","자유","절세팁","계약·법률","인테리어·수리","지역정보","세입자관리","질문"];
const CAT_HIGHLIGHT = "공실매물";
const CAT_COLORS = { "공실매물":"#0fa573","자유":"#8a8a9a","절세팁":"#0fa573","계약·법률":"#1a2744","인테리어·수리":"#e8960a","지역정보":"#1e7fcb","세입자관리":"#e8445a","질문":"#5b4fcf" };
const BAD_WORDS = ["씨발","시발","씨팔","ㅅㅂ","개새끼","개새","새끼","놈팡이","지랄","병신","미친놈","미친년","썅","쌍년","쌍놈","개년","개놈","꺼져","죽어","살인","강간","성폭행","성희롱","성추행","보지","자지","음란","야동","섹스","섹시","누드","포르노","야설","성기","자위","fuck","shit","bitch","asshole","pussy","dick","cock","nigger","faggot","창녀","매춘","윤락","원조교제","조건만남","만남조건","성매매"];
function containsBadWord(text) { if (!text) return false; const lower = text.toLowerCase().replace(/\s/g,""); return BAD_WORDS.some(w => lower.includes(w.toLowerCase())); }

// 글 카테고리·키워드에 따라 추천할 온리 기능 배너
function getFeatureNudge(post) {
  if (!post) return null;
  const text = `${post.title || ""} ${post.content || ""}`.toLowerCase();
  const cat = post.category;
  // 공실 관련
  if (cat === "공실매물" || /공실|광고|월세\s*내리|세입자\s*구/.test(text)) {
    return { icon:"🤖", color:"#0fa573", title:"AI 입지 분석으로 적정 시세 확인", desc:"공실이 길어질수록 기회비용이 커집니다. 주변 시세 기반 적정 임대료를 AI가 분석합니다.", href:"/dashboard/premium/ai-report" };
  }
  if (/공실\s*\d+(개월|달)|오래\s*안/.test(text)) {
    return { icon:"📉", color:"#e8445a", title:"공실 손실 계산 + 해소 액션플랜", desc:"누적 손실을 정확히 파악하고 공실 기간별 단계별 대응 전략을 확인하세요.", href:"/dashboard/vacancy" };
  }
  // 세금
  if (cat === "절세팁" || /종합소득세|세금|신고|세무사/.test(text)) {
    return { icon:"🧾", color:"#e8960a", title:"세금 시뮬레이터로 예상 세액 확인", desc:"임대소득 기반 종합소득세·부가세를 자동 추정하고 절세 포인트를 체크합니다.", href:"/dashboard/tax" };
  }
  // 계약 · 법률
  if (cat === "계약·법률" || /갱신청구권|계약갱신|임대차\s*3법|5%\s*상한/.test(text)) {
    return { icon:"⚖️", color:"#3b5bdb", title:"임대차 3법 체크 + 임대료 인상 계산", desc:"계약갱신청구권 적용 여부와 법정 상한(5%) 기준 인상액을 자동 계산합니다.", href:"/dashboard/premium/lease-check" };
  }
  if (/미납|독촉|내용증명|퇴거|명도/.test(text)) {
    return { icon:"📨", color:"#e8445a", title:"내용증명 PDF 즉시 발행", desc:"월세 미납·계약 위반 등 6가지 법적 서식을 자동 생성해 우체국 등기로 발송할 수 있습니다.", href:"/dashboard/certified" };
  }
  // 세입자 관리
  if (cat === "세입자관리" || /만료|갱신\s*의향/.test(text)) {
    return { icon:"📅", color:"#5b4fcf", title:"계약 만료 알림 + 갱신 의향 관리", desc:"D-60 이내 만료 임박 물건을 자동 알림으로 받고 세입자 의향을 추적하세요.", href:"/dashboard/renewal" };
  }
  return null;
}

export default function CommunityPage() {
  const { user, tenants, userPlan } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("전체");
  const [activePost, setActivePost] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [myLikes, setMyLikes] = useState(new Set());
  const [myCommentLikes, setMyCommentLikes] = useState(new Set());
  const [showWrite, setShowWrite] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // 댓글 수정 state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // 답글 state
  const [replyTo, setReplyTo] = useState(null); // { id, author_name }

  // 글 수정 state
  const [editingPost, setEditingPost] = useState(false);
  const [editForm, setEditForm] = useState({ title:"", content:"", category:"자유" });

  const myNickname = user?.user_metadata?.nickname || generateNickname();
  const [form, setForm] = useState({ title:"", content:"", category:"자유", author_name: myNickname });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getBadge = () => {
    const plan = userPlan || "free";
    if (plan === "pro") return { label:"🏆 프로 임대인", color:"#c9920a", bg:"rgba(201,146,10,0.1)" };
    if (plan === "plus") return { label:"⭐ 플러스 임대인", color:"#4f46e5", bg:"rgba(79,70,229,0.1)" };
    if ((tenants?.length||0) >= 1) return { label:"🌱 임대인", color:"#8a8a9a", bg:"rgba(138,138,154,0.1)" };
    return null;
  };
  const myBadge = getBadge();

  useEffect(() => { loadPosts(); if (user) loadMyLikes(); }, [category, user]);

  // URL ?post=ID 로 딥링크 진입 시 해당 글 자동 오픈
  useEffect(() => {
    if (typeof window === "undefined" || posts.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("post");
    if (postId && (!activePost || String(activePost.id) !== postId)) {
      const target = posts.find(p => String(p.id) === postId);
      if (target) openPost(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  const loadPosts = async () => {
    setLoading(true);
    let q = supabase.from("community_posts").select("*").order("created_at", { ascending: false });
    if (category !== "전체") q = q.eq("category", category);
    const { data } = await q;
    setPosts(data || []);
    setLoading(false);
  };

  const loadMyLikes = async () => {
    const { data } = await supabase.from("community_likes").select("post_id").eq("user_id", user.id);
    setMyLikes(new Set((data||[]).map(l => l.post_id)));
    // 댓글 좋아요도 로드
    const { data: cl } = await supabase.from("community_comment_likes").select("comment_id").eq("user_id", user.id);
    setMyCommentLikes(new Set((cl||[]).map(l => l.comment_id)));
  };

  const openPost = async (post) => {
    await supabase.from("community_posts").update({ views: post.views + 1 }).eq("id", post.id);
    const updated = { ...post, views: post.views + 1 };
    setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
    setActivePost(updated);
    setPanelOpen(true);
    setEditingPost(false);
    setReplyTo(null);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.set("post", String(post.id));
      window.history.replaceState({}, "", u.toString());
    }
    const { data } = await supabase.from("community_comments")
      .select("*").eq("post_id", post.id).order("created_at");
    setComments(data || []);
    setNewComment("");
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingPost(false);
    setEditingCommentId(null);
    setReplyTo(null);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.delete("post");
      window.history.replaceState({}, "", u.toString());
    }
    setTimeout(() => setActivePost(null), 300);
  };

  const copyPostLink = (postId) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/dashboard/community/posts/${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast("🔗 링크가 복사되었습니다")).catch(() => toast(url, "error"));
    }
  };

  // ─── 이미지 핸들링 ───
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) { toast("이미지는 최대 3장까지 첨부할 수 있어요", "error"); return; }
    const newFiles = files.slice(0, 3 - images.length);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => { const reader = new FileReader(); reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]); reader.readAsDataURL(f); });
  };
  const removeImage = (i) => { setImages(prev => prev.filter((_, idx) => idx !== i)); setPreviews(prev => prev.filter((_, idx) => idx !== i)); };
  const uploadImages = async () => {
    if (images.length === 0) return [];
    const urls = [];
    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("community-images").upload(path, file, { cacheControl:"3600", upsert:false });
      if (error) { toast("이미지 업로드 실패: " + error.message, "error"); continue; }
      const { data } = supabase.storage.from("community-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  // ─── 글 작성 ───
  const submitPost = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast("제목과 내용을 입력하세요", "error"); return; }
    if (containsBadWord(form.title) || containsBadWord(form.content)) { toast("부적절한 내용이 포함되어 있습니다.", "error"); return; }
    setUploading(true);
    const imageUrls = await uploadImages();
    const row = { user_id: user.id, author_name: form.author_name.trim() || myNickname, badge_label: myBadge?.label||null, badge_color: myBadge?.color||null, badge_bg: myBadge?.bg||null, category: form.category, title: form.title.trim(), content: form.content.trim(), images: imageUrls };
    const { data, error } = await supabase.from("community_posts").insert(row).select().single();
    setUploading(false);
    if (error) { toast("작성 오류: " + error.message, "error"); return; }
    setPosts(prev => [data, ...prev]);
    setShowWrite(false);
    setForm({ title:"", content:"", category:"자유", author_name: myNickname });
    setImages([]); setPreviews([]);
    toast("게시글이 등록되었습니다 🎉");
  };

  // ─── 글 수정 ───
  const startEditPost = () => {
    setEditForm({ title: activePost.title, content: activePost.content, category: activePost.category });
    setEditingPost(true);
  };
  const submitEditPost = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) { toast("제목과 내용을 입력하세요", "error"); return; }
    if (containsBadWord(editForm.title) || containsBadWord(editForm.content)) { toast("부적절한 내용이 포함되어 있습니다.", "error"); return; }
    const { error } = await supabase.from("community_posts").update({ title: editForm.title.trim(), content: editForm.content.trim(), category: editForm.category }).eq("id", activePost.id);
    if (error) { toast("수정 오류", "error"); return; }
    const updated = { ...activePost, ...editForm };
    setActivePost(updated);
    setPosts(prev => prev.map(p => p.id === activePost.id ? updated : p));
    setEditingPost(false);
    toast("수정되었습니다 ✓");
  };

  // ─── 글 삭제 ───
  const deletePost = async (id) => {
    if (!confirm("게시글을 삭제할까요?")) return;
    await supabase.from("community_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    closePanel();
    toast("삭제되었습니다");
  };

  // ─── 댓글 작성 (답글 포함) ───
  const submitComment = async () => {
    if (!newComment.trim()) return;
    if (containsBadWord(newComment)) { toast("부적절한 내용이 포함되어 있습니다.", "error"); return; }
    const row = {
      post_id: activePost.id,
      user_id: user.id,
      author_name: myNickname,
      content: newComment.trim(),
      parent_id: replyTo?.id || null,
      reply_to_name: replyTo?.author_name || null,
    };
    const { data, error } = await supabase.from("community_comments").insert(row).select().single();
    if (error) { toast("댓글 오류", "error"); return; }
    setComments(prev => [...prev, data]);
    setNewComment("");
    setReplyTo(null);
    // 댓글 수 업데이트
    const newCount = (activePost.comment_count || 0) + 1;
    await supabase.from("community_posts").update({ comment_count: newCount }).eq("id", activePost.id);
    setActivePost(p => ({ ...p, comment_count: newCount }));
    setPosts(prev => prev.map(p => p.id === activePost.id ? { ...p, comment_count: newCount } : p));
  };

  // ─── 댓글 수정 ───
  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditingCommentText(c.content);
  };
  const submitEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    if (containsBadWord(editingCommentText)) { toast("부적절한 내용이 포함되어 있습니다.", "error"); return; }
    const { error } = await supabase.from("community_comments").update({ content: editingCommentText.trim() }).eq("id", commentId);
    if (error) { toast("수정 오류", "error"); return; }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editingCommentText.trim() } : c));
    setEditingCommentId(null);
    toast("댓글이 수정되었습니다 ✓");
  };

  // ─── 댓글 삭제 ───
  const deleteComment = async (commentId) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    await supabase.from("community_comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    const newCount = Math.max((activePost.comment_count || 1) - 1, 0);
    await supabase.from("community_posts").update({ comment_count: newCount }).eq("id", activePost.id);
    setActivePost(p => ({ ...p, comment_count: newCount }));
    setPosts(prev => prev.map(p => p.id === activePost.id ? { ...p, comment_count: newCount } : p));
    toast("삭제되었습니다");
  };

  // ─── 게시글 좋아요 ───
  const toggleLike = async (postId) => {
    if (!user) return;
    const liked = myLikes.has(postId);
    const post = posts.find(p => p.id === postId);
    const delta = liked ? -1 : 1;
    if (liked) {
      await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.from("community_posts").update({ likes: (post?.likes||1) + delta }).eq("id", postId);
      setMyLikes(prev => { const s = new Set(prev); s.delete(postId); return s; });
    } else {
      await supabase.from("community_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.from("community_posts").update({ likes: (post?.likes||0) + delta }).eq("id", postId);
      setMyLikes(prev => new Set([...prev, postId]));
    }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + delta } : p));
    if (activePost?.id === postId) setActivePost(p => ({ ...p, likes: p.likes + delta }));
  };

  // ─── 댓글 좋아요 ───
  const toggleCommentLike = async (commentId) => {
    if (!user) return;
    const liked = myCommentLikes.has(commentId);
    const comment = comments.find(c => c.id === commentId);
    const delta = liked ? -1 : 1;
    if (liked) {
      await supabase.from("community_comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
      setMyCommentLikes(prev => { const s = new Set(prev); s.delete(commentId); return s; });
    } else {
      await supabase.from("community_comment_likes").insert({ comment_id: commentId, user_id: user.id });
      setMyCommentLikes(prev => new Set([...prev, commentId]));
    }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: (c.likes||0) + delta } : c));
  };

  const timeAgo = (dt) => { const d = (Date.now() - new Date(dt)) / 1000; if (d < 60) return "방금"; if (d < 3600) return Math.floor(d/60) + "분 전"; if (d < 86400) return Math.floor(d/3600) + "시간 전"; return Math.floor(d/86400) + "일 전"; };

  // 루트 댓글 / 답글 분리
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  return (
    <div style={{ fontFamily:"'Pretendard','DM Sans',sans-serif", height:"calc(100vh - 60px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* 헤더 */}
      <div style={{ padding:"20px 28px 0", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:10, marginBottom:14 }}>
          <div>
            <SectionLabel>COMMUNITY</SectionLabel>
            <h1 style={{ fontSize:22, fontWeight:800, color:"var(--text)", margin:0 }}>임대인 커뮤니티</h1>
            {myBadge && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:5, padding:"3px 10px", borderRadius:20, background:myBadge.bg, border:`1px solid ${myBadge.color}30` }}>
                <span style={{ fontSize:10, fontWeight:700, color:myBadge.color }}>{myBadge.label} 인증됨 ✓</span>
              </div>
            )}
          </div>
          <button onClick={() => { setForm({ title:"", content:"", category: category !== "전체" ? category : "자유", author_name: myNickname }); setImages([]); setPreviews([]); setShowWrite(true); }}
            style={{ padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ✏️ 글쓰기
          </button>
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s", border:`1px solid ${category===c?(c===CAT_HIGHLIGHT?"#0fa573":C.indigo):c===CAT_HIGHLIGHT?"rgba(15,165,115,0.4)":"var(--border)"}`, background:category===c?(c===CAT_HIGHLIGHT?"#0fa573":C.indigo):c===CAT_HIGHLIGHT?"rgba(15,165,115,0.07)":"transparent", color:category===c?"#fff":c===CAT_HIGHLIGHT?"#0fa573":"var(--text-muted)" }}>
              {c===CAT_HIGHLIGHT ? "🏠 "+c : c}
            </button>
          ))}
        </div>
        {category===CAT_HIGHLIGHT && (
          <div style={{ background:"rgba(15,165,115,0.07)", border:"1px solid rgba(15,165,115,0.2)", borderRadius:10, padding:"10px 16px", marginTop:12, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>🏠</span>
            <p style={{ fontSize:12, color:"#0fa573", fontWeight:600, margin:0 }}>공실 물건을 내놓거나, 좋은 세입자를 구하는 글을 올려보세요. 온리 임대인들이 직접 연결됩니다.</p>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

        {/* 목록 */}
        <div style={{ flex: panelOpen && !isMobile ? "0 0 380px" : "1", overflowY:"auto", borderRight: panelOpen && !isMobile ? "1px solid var(--border)" : "none", transition:"flex .3s ease" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>불러오는 중...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign:"center", padding:60 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>{category===CAT_HIGHLIGHT?"🏠":"📭"}</div>
              <p style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{category===CAT_HIGHLIGHT?"아직 공실·매물 게시글이 없어요":"첫 번째 글을 작성해보세요!"}</p>
            </div>
          ) : (
            <div>
              {posts.map(post => {
                const isActive = activePost?.id === post.id;
                return (
                  <div key={post.id} onClick={() => openPost(post)}
                    style={{ padding:"14px 20px", cursor:"pointer", borderBottom:"1px solid var(--border)", background:isActive?"rgba(79,70,229,0.05)":"transparent", borderLeft:`3px solid ${isActive?C.indigo:"transparent"}`, transition:"all .15s" }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background="var(--surface2)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:CAT_COLORS[post.category]||"#8a8a9a", background:(CAT_COLORS[post.category]||"#8a8a9a")+"18", padding:"2px 7px", borderRadius:4 }}>{post.category}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{post.author_name}</span>
                      {post.badge_label && <span style={{ fontSize:9, fontWeight:700, color:post.badge_color||"#8a8a9a", background:post.badge_bg||"#f0efe9", padding:"1px 6px", borderRadius:20 }}>{post.badge_label}</span>}
                      <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:"auto" }}>{timeAgo(post.created_at)}</span>
                    </div>
                    <p style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.title}</p>
                    {!(panelOpen && !isMobile) && <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.5, marginBottom:6 }}>{post.content.slice(0,70)}{post.content.length>70?"...":""}</p>}
                    {!(panelOpen && !isMobile) && post.images?.length > 0 && (
                      <div style={{ display:"flex", gap:5, marginBottom:6 }}>
                        {post.images.slice(0,3).map((url, i) => <img key={i} src={url} alt="" style={{ width:56, height:56, objectFit:"cover", borderRadius:6, border:"1px solid var(--border)" }} />)}
                      </div>
                    )}
                    {/* ✅ 댓글 수 포함 */}
                    <div style={{ display:"flex", gap:12 }}>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>👁 {post.views}</span>
                      <span style={{ fontSize:11, color:myLikes.has(post.id)?C.rose:"var(--text-muted)" }}>❤️ {post.likes}</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>💬 {post.comment_count || 0}</span>
                      {post.images?.length > 0 && <span style={{ fontSize:11, color:"var(--text-muted)" }}>📷 {post.images.length}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 상세 패널 */}
        {activePost && (
          <div style={{ ...(isMobile ? { position:"fixed", top:0, right:0, bottom:0, width:"100%", zIndex:300, transform:panelOpen?"translateX(0)":"translateX(100%)" } : { flex:1, position:"relative", transform:panelOpen?"translateX(0)":"translateX(20px)", opacity:panelOpen?1:0 }), background:"var(--surface)", overflowY:"auto", transition:"transform .3s ease, opacity .3s ease", display:"flex", flexDirection:"column" }}>

            {/* 패널 헤더 */}
            <div style={{ position:"sticky", top:0, zIndex:10, background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"13px 20px", display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={closePanel} style={{ width:32, height:32, borderRadius:8, border:"none", background:"var(--surface2)", color:"var(--text)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>{isMobile?"←":"✕"}</button>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px" }}>{activePost.category}</span>
              {/* ✅ 본인 글: 수정 + 삭제 버튼 */}
              {activePost.user_id === user?.id && !editingPost && (
                <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                  <button onClick={startEditPost}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:7, border:`1px solid ${C.indigo}`, background:"transparent", color:C.indigo, cursor:"pointer", fontWeight:600 }}>
                    수정
                  </button>
                  <button onClick={() => deletePost(activePost.id)}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:7, border:`1px solid ${C.rose}`, background:"transparent", color:C.rose, cursor:"pointer", fontWeight:600 }}>
                    삭제
                  </button>
                </div>
              )}
              {editingPost && (
                <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                  <button onClick={() => setEditingPost(false)}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:7, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer" }}>
                    취소
                  </button>
                  <button onClick={submitEditPost}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:7, border:"none", background:C.indigo, color:"#fff", cursor:"pointer", fontWeight:700 }}>
                    저장
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>
              {/* 작성자 정보 */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.indigo},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:800, flexShrink:0 }}>{activePost.author_name?.[0]?.toUpperCase()||"?"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{activePost.author_name}</span>
                    {activePost.badge_label && <span style={{ fontSize:9, fontWeight:700, color:activePost.badge_color||"#8a8a9a", background:activePost.badge_bg||"#f0efe9", padding:"1px 6px", borderRadius:20 }}>{activePost.badge_label}</span>}
                  </div>
                  <span style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo(activePost.created_at)}</span>
                </div>
                <button onClick={() => copyPostLink(activePost.id)}
                  style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.indigo}30`, background:`${C.indigo}08`, color:C.indigo, fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>🔗 링크 복사</button>
              </div>

              {/* ✅ 글 수정 모드 */}
              {editingPost ? (
                <div>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                      {CATEGORIES.slice(1).map(c => (
                        <button key={c} onClick={() => setEditForm(f => ({...f, category:c}))}
                          style={{ padding:"3px 9px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${editForm.category===c?C.indigo:"var(--border)"}`, background:editForm.category===c?C.indigo+"15":"transparent", color:editForm.category===c?C.indigo:"var(--text-muted)" }}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <input value={editForm.title} onChange={e => setEditForm(f => ({...f, title:e.target.value}))}
                      style={{ width:"100%", padding:"10px 12px", fontSize:15, fontWeight:700, color:"var(--text)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, outline:"none", boxSizing:"border-box", marginBottom:8 }} />
                    <textarea value={editForm.content} onChange={e => setEditForm(f => ({...f, content:e.target.value}))}
                      rows={6} style={{ width:"100%", padding:"10px 12px", fontSize:14, color:"var(--text)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box" }} />
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize:18, fontWeight:800, color:"var(--text)", marginBottom:14, lineHeight:1.4 }}>{activePost.title}</h2>
                  <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.9, whiteSpace:"pre-wrap", marginBottom:18 }}>{activePost.content}</p>
                  {activePost.images?.length > 0 && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ display:"grid", gridTemplateColumns:activePost.images.length===1?"1fr":"repeat(2,1fr)", gap:8 }}>
                        {activePost.images.map((url, i) => <img key={i} src={url} alt="" onClick={() => setLightbox(url)} style={{ width:"100%", borderRadius:10, objectFit:"cover", maxHeight:activePost.images.length===1?400:200, cursor:"pointer", border:"1px solid var(--border)" }} />)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 좋아요 / 조회 */}
              <div style={{ display:"flex", gap:14, paddingBottom:16, borderBottom:"1px solid var(--border)", marginBottom:16 }}>
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>👁 {activePost.views}</span>
                <button onClick={() => toggleLike(activePost.id)} style={{ fontSize:12, background:"none", border:"none", cursor:"pointer", fontWeight:700, color:myLikes.has(activePost.id)?C.rose:"var(--text-muted)" }}>
                  {myLikes.has(activePost.id)?"❤️":"🤍"} {activePost.likes} 좋아요
                </button>
              </div>

              {/* 온리 기능 넷지 (카테고리/키워드 기반) */}
              {(() => {
                const nudge = getFeatureNudge(activePost);
                if (!nudge) return null;
                return (
                  <a href={nudge.href} style={{ display:"flex", gap:10, alignItems:"center", padding:"12px 14px", borderRadius:11, background:`${nudge.color}0d`, border:`1px solid ${nudge.color}33`, textDecoration:"none", marginBottom:16 }}>
                    <span style={{ fontSize:22, flexShrink:0 }}>{nudge.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:800, color:nudge.color, marginBottom:2 }}>{nudge.title}</p>
                      <p style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.5 }}>{nudge.desc}</p>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:nudge.color, whiteSpace:"nowrap" }}>바로가기 →</span>
                  </a>
                );
              })()}

              {/* ─── 댓글 목록 ─── */}
              <p style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:12 }}>댓글 {comments.length}개</p>

              {rootComments.map(c => (
                <div key={c.id} style={{ marginBottom:10 }}>
                  {/* 루트 댓글 */}
                  <div style={{ background:"var(--surface2)", borderRadius:10, padding:"10px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{c.author_name}</span>
                        <span style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo(c.created_at)}</span>
                      </div>
                      {/* ✅ 본인 댓글: 수정/삭제 */}
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        {/* 댓글 좋아요 */}
                        <button onClick={() => toggleCommentLike(c.id)}
                          style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:myCommentLikes.has(c.id)?C.rose:"var(--text-muted)", display:"flex", alignItems:"center", gap:3 }}>
                          {myCommentLikes.has(c.id)?"❤️":"🤍"} {c.likes||0}
                        </button>
                        {/* 답글 버튼 */}
                        <button onClick={() => { setReplyTo({ id: c.id, author_name: c.author_name }); }}
                          style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontWeight:600 }}>
                          답글
                        </button>
                        {c.user_id === user?.id && editingCommentId !== c.id && (
                          <>
                            <button onClick={() => startEditComment(c)}
                              style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:C.indigo, fontWeight:600 }}>
                              수정
                            </button>
                            <button onClick={() => deleteComment(c.id)}
                              style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:C.rose, fontWeight:600 }}>
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* ✅ 댓글 수정 모드 */}
                    {editingCommentId === c.id ? (
                      <div style={{ display:"flex", gap:6, marginTop:6 }}>
                        <input value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)}
                          style={{ flex:1, padding:"7px 10px", fontSize:13, color:"var(--text)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, outline:"none" }} />
                        <button onClick={() => submitEditComment(c.id)}
                          style={{ padding:"7px 12px", borderRadius:8, background:C.indigo, border:"none", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>저장</button>
                        <button onClick={() => setEditingCommentId(null)}
                          style={{ padding:"7px 10px", borderRadius:8, background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:12, cursor:"pointer" }}>취소</button>
                      </div>
                    ) : (
                      <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.6, margin:0 }}>{c.content}</p>
                    )}
                  </div>

                  {/* 답글 목록 */}
                  {getReplies(c.id).map(reply => (
                    <div key={reply.id} style={{ marginLeft:24, marginTop:6, background:"var(--surface2)", borderRadius:10, padding:"9px 14px", borderLeft:`2px solid ${C.indigo}30` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:11, color:C.indigo, fontWeight:700 }}>↳</span>
                          <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{reply.author_name}</span>
                          {reply.reply_to_name && <span style={{ fontSize:11, color:C.indigo }}>@{reply.reply_to_name}</span>}
                          <span style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo(reply.created_at)}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <button onClick={() => toggleCommentLike(reply.id)}
                            style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:myCommentLikes.has(reply.id)?C.rose:"var(--text-muted)", display:"flex", alignItems:"center", gap:3 }}>
                            {myCommentLikes.has(reply.id)?"❤️":"🤍"} {reply.likes||0}
                          </button>
                          {reply.user_id === user?.id && editingCommentId !== reply.id && (
                            <>
                              <button onClick={() => startEditComment(reply)}
                                style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:C.indigo, fontWeight:600 }}>수정</button>
                              <button onClick={() => deleteComment(reply.id)}
                                style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:C.rose, fontWeight:600 }}>삭제</button>
                            </>
                          )}
                        </div>
                      </div>
                      {editingCommentId === reply.id ? (
                        <div style={{ display:"flex", gap:6, marginTop:6 }}>
                          <input value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)}
                            style={{ flex:1, padding:"7px 10px", fontSize:13, color:"var(--text)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, outline:"none" }} />
                          <button onClick={() => submitEditComment(reply.id)}
                            style={{ padding:"7px 12px", borderRadius:8, background:C.indigo, border:"none", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>저장</button>
                          <button onClick={() => setEditingCommentId(null)}
                            style={{ padding:"7px 10px", borderRadius:8, background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:12, cursor:"pointer" }}>취소</button>
                        </div>
                      ) : (
                        <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.6, margin:0 }}>{reply.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 댓글 입력창 */}
            <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", background:"var(--surface)", flexShrink:0 }}>
              {/* 답글 대상 표시 */}
              {replyTo && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, padding:"5px 10px", background:`${C.indigo}10`, borderRadius:7 }}>
                  <span style={{ fontSize:12, color:C.indigo, fontWeight:600 }}>↳ @{replyTo.author_name}에게 답글</span>
                  <button onClick={() => setReplyTo(null)} style={{ marginLeft:"auto", fontSize:11, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}>✕</button>
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && !e.shiftKey && submitComment()}
                  placeholder={replyTo ? `@${replyTo.author_name}에게 답글...` : "댓글을 입력하세요..."}
                  style={{ flex:1, padding:"10px 13px", fontSize:13, color:"var(--text)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, outline:"none" }} />
                <button onClick={submitComment}
                  style={{ padding:"10px 16px", borderRadius:10, background:C.indigo, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>등록</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 글쓰기 모달 */}
      {showWrite && (
        <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={() => setShowWrite(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:"var(--surface)", borderRadius:18, padding:24, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:"var(--text)", margin:0 }}>✏️ 글쓰기</h2>
              <button onClick={() => setShowWrite(false)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--surface2)", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>카테고리</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {CATEGORIES.slice(1).map(c => (
                  <button key={c} onClick={() => setForm(f => ({...f, category:c}))}
                    style={{ padding:"4px 10px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${form.category===c?(c===CAT_HIGHLIGHT?"#0fa573":C.indigo):"var(--border)"}`, background:form.category===c?(c===CAT_HIGHLIGHT?"rgba(15,165,115,0.12)":C.indigo+"15"):"transparent", color:form.category===c?(c===CAT_HIGHLIGHT?"#0fa573":C.indigo):"var(--text-muted)" }}>
                    {c===CAT_HIGHLIGHT?"🏠 "+c:c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", margin:0 }}>닉네임</p>
                <button onClick={() => setForm(f => ({...f, author_name:generateNickname()}))} style={{ fontSize:11, color:C.indigo, fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>🎲 랜덤</button>
              </div>
              <input value={form.author_name} onChange={e => setForm(f => ({...f, author_name:e.target.value}))} maxLength={20}
                style={{ width:"100%", padding:"9px 12px", fontSize:13, color:"var(--text)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>제목</p>
              <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="제목을 입력하세요"
                style={{ width:"100%", padding:"9px 12px", fontSize:13, color:"var(--text)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>내용</p>
              <textarea value={form.content} onChange={e => setForm(f => ({...f, content:e.target.value}))} placeholder="내용을 입력하세요..." rows={5}
                style={{ width:"100%", padding:"10px 12px", fontSize:13, color:"var(--text)", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, resize:"vertical", outline:"none", lineHeight:1.7, boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", margin:0 }}>사진 첨부 ({images.length}/3)</p>
                <button onClick={() => fileInputRef.current?.click()} disabled={images.length>=3}
                  style={{ fontSize:12, color:images.length>=3?"var(--text-muted)":C.indigo, fontWeight:700, background:"none", border:"none", cursor:images.length>=3?"not-allowed":"pointer" }}>📷 사진 추가</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display:"none" }} />
              {previews.length > 0 ? (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {previews.map((url, i) => <div key={i} style={{ position:"relative" }}><img src={url} alt="" style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1px solid var(--border)" }} /><button onClick={() => removeImage(i)} style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:"#e8445a", border:"none", color:"#fff", fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800 }}>✕</button></div>)}
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} style={{ border:"2px dashed var(--border)", borderRadius:10, padding:"18px", textAlign:"center", cursor:"pointer", color:"var(--text-muted)", fontSize:12 }}>📷 클릭하거나 드래그해서 사진 추가 (최대 3장)</div>
              )}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowWrite(false)} style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
              <button onClick={submitPost} disabled={uploading} style={{ flex:2, padding:"12px", borderRadius:11, background:uploading?"#94a3b8":`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:uploading?"not-allowed":"pointer" }}>{uploading?"업로드 중...":"등록하기"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
          <img src={lightbox} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", objectFit:"contain", borderRadius:8 }} />
          <button onClick={() => setLightbox(null)} style={{ position:"absolute", top:20, right:20, width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}
