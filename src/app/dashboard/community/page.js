// src/app/dashboard/community/page.js
// Split-panel layout + 이미지 업로드 (호갱노노 스타일)
"use client";
import { useState, useEffect, useRef } from "react";
import { SectionLabel, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
import { generateNickname } from "../../../lib/nickname";

const CATEGORIES = ["전체","자유","절세팁","계약·법률","인테리어·수리","지역정보","세입자관리","질문"];
const CAT_COLORS = {
  "자유":"#8a8a9a","절세팁":"#0fa573","계약·법률":"#1a2744",
  "인테리어·수리":"#e8960a","지역정보":"#1e7fcb","세입자관리":"#e8445a","질문":"#5b4fcf",
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function CommunityPage() {
  const { user, tenants, userPlan } = useApp();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState("전체");
  const [activePost, setActivePost] = useState(null); // 우측 패널
  const [panelOpen, setPanelOpen]   = useState(false);
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState("");
  const [myLikes, setMyLikes]       = useState(new Set());
  const [showWrite, setShowWrite]   = useState(false);
  const [lightbox, setLightbox]     = useState(null); // 이미지 확대
  const [isMobile, setIsMobile]     = useState(false);

  // 글쓰기 폼
  const myNickname = user?.user_metadata?.nickname || generateNickname();
  const [form, setForm]         = useState({ title:"", content:"", category:"자유", author_name: myNickname });
  const [images, setImages]     = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // dataURL[]
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
    if (plan === "pro")  return { label:"🏆 프로 임대인",   color:"#c9920a", bg:"rgba(201,146,10,0.1)" };
    if (plan === "plus") return { label:"⭐ 플러스 임대인", color:"#4f46e5", bg:"rgba(79,70,229,0.1)" };
    if ((tenants?.length||0) >= 1) return { label:"🌱 임대인", color:"#8a8a9a", bg:"rgba(138,138,154,0.1)" };
    return null;
  };
  const myBadge = getBadge();

  useEffect(() => { loadPosts(); if (user) loadMyLikes(); }, [category, user]);

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
  };

  const openPost = async (post) => {
    await supabase.from("community_posts").update({ views: post.views + 1 }).eq("id", post.id);
    const updated = { ...post, views: post.views + 1 };
    setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
    setActivePost(updated);
    setPanelOpen(true);
    const { data } = await supabase.from("community_comments").select("*").eq("post_id", post.id).order("created_at");
    setComments(data || []);
    setNewComment("");
  };

  const closePanel = () => { setPanelOpen(false); setTimeout(() => setActivePost(null), 300); };

  // 이미지 선택
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) { toast("이미지는 최대 3장까지 첨부할 수 있어요", "error"); return; }
    const newFiles = files.slice(0, 3 - images.length);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  // 이미지 업로드 → public URL 배열 반환
  const uploadImages = async () => {
    if (images.length === 0) return [];
    const urls = [];
    for (const file of images) {
      const ext  = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("community-images").upload(path, file, { cacheControl:"3600", upsert:false });
      if (error) { toast("이미지 업로드 실패: " + error.message, "error"); continue; }
      const { data } = supabase.storage.from("community-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  // 글 등록
  const submitPost = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast("제목과 내용을 입력하세요", "error"); return; }
    setUploading(true);
    const imageUrls = await uploadImages();
    const row = {
      user_id:     user.id,
      author_name: form.author_name.trim() || myNickname,
      badge_label: myBadge?.label || null,
      badge_color: myBadge?.color || null,
      badge_bg:    myBadge?.bg    || null,
      category:    form.category,
      title:       form.title.trim(),
      content:     form.content.trim(),
      images:      imageUrls,
    };
    const { data, error } = await supabase.from("community_posts").insert(row).select().single();
    setUploading(false);
    if (error) { toast("작성 오류: " + error.message, "error"); return; }
    setPosts(prev => [data, ...prev]);
    setShowWrite(false);
    setForm({ title:"", content:"", category:"자유", author_name: myNickname });
    setImages([]); setPreviews([]);
    toast("게시글이 등록되었습니다 🎉");
  };

  // 댓글
  const submitComment = async () => {
    if (!newComment.trim()) return;
    const row = { post_id: activePost.id, user_id: user.id, author_name: myNickname, content: newComment.trim() };
    const { data, error } = await supabase.from("community_comments").insert(row).select().single();
    if (error) { toast("댓글 오류", "error"); return; }
    setComments(prev => [...prev, data]);
    setNewComment("");
  };

  // 좋아요
  const toggleLike = async (postId) => {
    if (!user) return;
    const liked = myLikes.has(postId);
    const post  = posts.find(p => p.id === postId);
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

  const deletePost = async (id) => {
    await supabase.from("community_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    closePanel();
    toast("삭제되었습니다");
  };

  const timeAgo = (dt) => {
    const d = (Date.now() - new Date(dt)) / 1000;
    if (d < 60) return "방금";
    if (d < 3600) return Math.floor(d/60) + "분 전";
    if (d < 86400) return Math.floor(d/3600) + "시간 전";
    return Math.floor(d/86400) + "일 전";
  };

  // ── 렌더 ──
  return (
    <div style={{ fontFamily:"'Pretendard','DM Sans',sans-serif", height:"calc(100vh - 60px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* 상단 헤더 */}
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
          <button onClick={() => { setForm({ title:"", content:"", category:"자유", author_name: myNickname }); setImages([]); setPreviews([]); setShowWrite(true); }}
            style={{ padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ✏️ 글쓰기
          </button>
        </div>

        {/* 카테고리 탭 */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s",
                border:`1px solid ${category===c ? C.indigo : "var(--border)"}`,
                background: category===c ? C.indigo : "transparent",
                color: category===c ? "#fff" : "var(--text-muted)" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 — 목록 + 우측 패널 */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

        {/* 왼쪽: 글 목록 */}
        <div style={{
          flex: panelOpen && !isMobile ? "0 0 380px" : "1",
          overflowY:"auto", borderRight: panelOpen && !isMobile ? "1px solid var(--border)" : "none",
          transition:"flex .3s ease"
        }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:60, color:"var(--text-muted)" }}>불러오는 중...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign:"center", padding:60 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
              <p style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>첫 번째 글을 작성해보세요!</p>
            </div>
          ) : (
            <div>
              {posts.map((post, i) => {
                const isActive = activePost?.id === post.id;
                return (
                  <div key={post.id} onClick={() => openPost(post)}
                    style={{
                      padding:"14px 20px", cursor:"pointer", borderBottom:"1px solid var(--border)",
                      background: isActive ? "rgba(79,70,229,0.05)" : "transparent",
                      borderLeft: `3px solid ${isActive ? C.indigo : "transparent"}`,
                      transition:"all .15s"
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--surface2)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>

                    {/* 카테고리 + 작성자 + 시간 */}
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:CAT_COLORS[post.category]||"#8a8a9a",
                        background:(CAT_COLORS[post.category]||"#8a8a9a")+"18", padding:"2px 7px", borderRadius:4 }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{post.author_name}</span>
                      {post.badge_label && (
                        <span style={{ fontSize:9, fontWeight:700, color:post.badge_color||"#8a8a9a",
                          background:post.badge_bg||"#f0efe9", padding:"1px 6px", borderRadius:20 }}>
                          {post.badge_label}
                        </span>
                      )}
                      <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:"auto" }}>{timeAgo(post.created_at)}</span>
                    </div>

                    {/* 제목 */}
                    <p style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:3,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.title}</p>

                    {/* 내용 미리보기 */}
                    {!(panelOpen && !isMobile) && (
                      <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.5, marginBottom:6 }}>
                        {post.content.slice(0,70)}{post.content.length>70?"...":""}
                      </p>
                    )}

                    {/* 썸네일 (목록 펼침 상태일 때만) */}
                    {!(panelOpen && !isMobile) && post.images?.length > 0 && (
                      <div style={{ display:"flex", gap:5, marginBottom:6 }}>
                        {post.images.slice(0,3).map((url, i) => (
                          <img key={i} src={url} alt="" style={{ width:56, height:56, objectFit:"cover", borderRadius:6, border:"1px solid var(--border)" }} />
                        ))}
                      </div>
                    )}

                    {/* 통계 */}
                    <div style={{ display:"flex", gap:12 }}>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>👁 {post.views}</span>
                      <span style={{ fontSize:11, color: myLikes.has(post.id) ? C.rose : "var(--text-muted)" }}>❤️ {post.likes}</span>
                      {post.images?.length > 0 && (
                        <span style={{ fontSize:11, color:"var(--text-muted)" }}>📷 {post.images.length}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 오른쪽: 상세 패널 (데스크탑) / 슬라이드 오버레이 (모바일) */}
        {activePost && (
          <div style={{
            ...(isMobile ? {
              position:"fixed", top:0, right:0, bottom:0,
              width:"100%", zIndex:300,
              transform: panelOpen ? "translateX(0)" : "translateX(100%)",
            } : {
              flex:1, position:"relative",
              transform: panelOpen ? "translateX(0)" : "translateX(20px)",
              opacity: panelOpen ? 1 : 0,
            }),
            background:"var(--surface)", overflowY:"auto",
            transition:"transform .3s ease, opacity .3s ease",
            borderLeft: isMobile ? "none" : "none",
            display:"flex", flexDirection:"column"
          }}>

            {/* 패널 헤더 */}
            <div style={{ position:"sticky", top:0, zIndex:10, background:"var(--surface)",
              borderBottom:"1px solid var(--border)", padding:"13px 20px",
              display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={closePanel}
                style={{ width:32, height:32, borderRadius:8, border:"none", background:"var(--surface2)",
                  color:"var(--text)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {isMobile ? "←" : "✕"}
              </button>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px" }}>
                {activePost.category}
              </span>
              {activePost.user_id === user?.id && (
                <button onClick={() => deletePost(activePost.id)}
                  style={{ marginLeft:"auto", fontSize:11, padding:"4px 10px", borderRadius:7,
                    border:`1px solid ${C.rose}`, background:"transparent", color:C.rose, cursor:"pointer" }}>
                  삭제
                </button>
              )}
            </div>

            {/* 패널 본문 */}
            <div style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>
              {/* 작성자 */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.indigo},${C.purple})`,
                  display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:800, flexShrink:0 }}>
                  {activePost.author_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{activePost.author_name}</span>
                    {activePost.badge_label && (
                      <span style={{ fontSize:9, fontWeight:700, color:activePost.badge_color||"#8a8a9a",
                        background:activePost.badge_bg||"#f0efe9", padding:"1px 6px", borderRadius:20 }}>
                        {activePost.badge_label}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo(activePost.created_at)}</span>
                </div>
              </div>

              {/* 제목 */}
              <h2 style={{ fontSize:18, fontWeight:800, color:"var(--text)", marginBottom:14, lineHeight:1.4 }}>{activePost.title}</h2>

              {/* 내용 */}
              <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.9, whiteSpace:"pre-wrap", marginBottom:18 }}>{activePost.content}</p>

              {/* 이미지 */}
              {activePost.images?.length > 0 && (
                <div style={{ marginBottom:18 }}>
                  <div style={{ display:"grid", gridTemplateColumns: activePost.images.length === 1 ? "1fr" : "repeat(2,1fr)", gap:8 }}>
                    {activePost.images.map((url, i) => (
                      <img key={i} src={url} alt="" onClick={() => setLightbox(url)}
                        style={{ width:"100%", borderRadius:10, objectFit:"cover",
                          maxHeight: activePost.images.length === 1 ? 400 : 200,
                          cursor:"pointer", border:"1px solid var(--border)" }} />
                    ))}
                  </div>
                </div>
              )}

              {/* 좋아요/조회 */}
              <div style={{ display:"flex", gap:14, paddingBottom:16, borderBottom:"1px solid var(--border)", marginBottom:16 }}>
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>👁 {activePost.views}</span>
                <button onClick={() => toggleLike(activePost.id)}
                  style={{ fontSize:12, background:"none", border:"none", cursor:"pointer", fontWeight:700,
                    color: myLikes.has(activePost.id) ? C.rose : "var(--text-muted)" }}>
                  {myLikes.has(activePost.id) ? "❤️" : "🤍"} {activePost.likes} 좋아요
                </button>
              </div>

              {/* 댓글 */}
              <p style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:12 }}>댓글 {comments.length}개</p>
              {comments.map(c => (
                <div key={c.id} style={{ background:"var(--surface2)", borderRadius:10, padding:"10px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{c.author_name}</span>
                    <span style={{ fontSize:11, color:"var(--text-muted)" }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.6 }}>{c.content}</p>
                </div>
              ))}
            </div>

            {/* 댓글 입력 (하단 고정) */}
            <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", background:"var(--surface)", flexShrink:0 }}>
              <div style={{ display:"flex", gap:8 }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && !e.shiftKey && submitComment()}
                  placeholder="댓글을 입력하세요..."
                  style={{ flex:1, padding:"10px 13px", fontSize:13, color:"var(--text)",
                    background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, outline:"none" }} />
                <button onClick={submitComment}
                  style={{ padding:"10px 16px", borderRadius:10, background:C.indigo, border:"none",
                    color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>등록</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 글쓰기 모달 ── */}
      {showWrite && (
        <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setShowWrite(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"var(--surface)", borderRadius:18, padding:24, width:"100%", maxWidth:520,
              maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:"var(--text)", margin:0 }}>✏️ 글쓰기</h2>
              <button onClick={() => setShowWrite(false)}
                style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--surface2)", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>

            {/* 카테고리 */}
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>카테고리</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {CATEGORIES.slice(1).map(c => (
                  <button key={c} onClick={() => setForm(f => ({...f, category:c}))}
                    style={{ padding:"4px 10px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                      border:`1px solid ${form.category===c ? C.indigo : "var(--border)"}`,
                      background: form.category===c ? C.indigo+"15" : "transparent",
                      color: form.category===c ? C.indigo : "var(--text-muted)" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 닉네임 */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", margin:0 }}>닉네임</p>
                <button onClick={() => setForm(f => ({...f, author_name: generateNickname()}))}
                  style={{ fontSize:11, color:C.indigo, fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>🎲 랜덤</button>
              </div>
              <input value={form.author_name} onChange={e => setForm(f => ({...f, author_name:e.target.value}))} maxLength={20}
                style={{ width:"100%", padding:"9px 12px", fontSize:13, color:"var(--text)", background:"var(--surface2)",
                  border:"1px solid var(--border)", borderRadius:10, outline:"none", boxSizing:"border-box" }} />
            </div>

            {/* 제목 */}
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>제목</p>
              <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="제목을 입력하세요"
                style={{ width:"100%", padding:"9px 12px", fontSize:13, color:"var(--text)", background:"var(--surface2)",
                  border:"1px solid var(--border)", borderRadius:10, outline:"none", boxSizing:"border-box" }} />
            </div>

            {/* 내용 */}
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>내용</p>
              <textarea value={form.content} onChange={e => setForm(f => ({...f, content:e.target.value}))}
                placeholder="내용을 입력하세요..." rows={5}
                style={{ width:"100%", padding:"10px 12px", fontSize:13, color:"var(--text)", background:"var(--surface2)",
                  border:"1px solid var(--border)", borderRadius:10, resize:"vertical", outline:"none",
                  lineHeight:1.7, boxSizing:"border-box" }} />
            </div>

            {/* 이미지 첨부 */}
            <div style={{ marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".5px", margin:0 }}>
                  사진 첨부 <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>({images.length}/3)</span>
                </p>
                <button onClick={() => fileInputRef.current?.click()} disabled={images.length >= 3}
                  style={{ fontSize:12, color: images.length >= 3 ? "var(--text-muted)" : C.indigo,
                    fontWeight:700, background:"none", border:"none", cursor: images.length >= 3 ? "not-allowed" : "pointer" }}>
                  📷 사진 추가
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display:"none" }} />
              {previews.length > 0 && (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {previews.map((url, i) => (
                    <div key={i} style={{ position:"relative" }}>
                      <img src={url} alt="" style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1px solid var(--border)" }} />
                      <button onClick={() => removeImage(i)}
                        style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%",
                          background:"#e8445a", border:"none", color:"#fff", fontSize:11, cursor:"pointer",
                          display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {previews.length === 0 && (
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ border:"2px dashed var(--border)", borderRadius:10, padding:"18px", textAlign:"center",
                    cursor:"pointer", color:"var(--text-muted)", fontSize:12 }}>
                  📷 클릭하거나 드래그해서 사진 추가 (최대 3장, 5MB 이하)
                </div>
              )}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowWrite(false)}
                style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid var(--border)",
                  color:"var(--text-muted)", fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
              <button onClick={submitPost} disabled={uploading}
                style={{ flex:2, padding:"12px", borderRadius:11,
                  background: uploading ? "#94a3b8" : `linear-gradient(135deg,${C.indigo},${C.purple})`,
                  border:"none", color:"#fff", fontWeight:700, fontSize:13,
                  cursor: uploading ? "not-allowed" : "pointer" }}>
                {uploading ? "업로드 중..." : "등록하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.9)",
            display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
          <img src={lightbox} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", objectFit:"contain", borderRadius:8 }} />
          <button onClick={() => setLightbox(null)}
            style={{ position:"absolute", top:20, right:20, width:40, height:40, borderRadius:"50%",
              background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}
