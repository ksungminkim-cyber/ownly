"use client";
import { useState, useEffect } from "react";
import { SectionLabel, Modal, toast } from "../../../components/shared";
import { C } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";

const CATEGORIES = ["전체", "자유", "절세팁", "계약·법률", "인테리어·수리", "지역정보", "세입자관리", "질문"];
const CAT_COLORS = {
  "자유": "#8a8a9a", "절세팁": "#0fa573", "계약·법률": "#1a2744",
  "인테리어·수리": "#e8960a", "지역정보": "#1e7fcb", "세입자관리": "#e8445a", "질문": "#5b4fcf",
};

export default function CommunityPage() {
  const { user, tenants, userPlan } = useApp();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState("전체");
  const [showWrite, setShowWrite]   = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState("");
  const [myLikes, setMyLikes]       = useState(new Set());

  // 글 작성 폼
  const [form, setForm] = useState({ title: "", content: "", category: "자유", author_name: "" });

  const email = user?.email || "";
  const defaultName = email.split("@")[0] || "익명";

  // 인증 뱃지 계산
  const getBadge = (planOrTenantCount) => {
    const plan = userPlan || "free";
    const count = tenants?.length || 0;
    if (plan === "pro") return { label: "🏆 프로 임대인", color: "#c9920a", bg: "rgba(201,146,10,0.1)" };
    if (plan === "starter_plus") return { label: "⭐ 스타터+ 임대인", color: "#0fa573", bg: "rgba(15,165,115,0.1)" };
    if (plan === "starter") return { label: "🏠 스타터 임대인", color: "#3b5bdb", bg: "rgba(59,91,219,0.1)" };
    if (count >= 1) return { label: "🌱 임대인", color: "#8a8a9a", bg: "rgba(138,138,154,0.1)" };
    return null;
  };
  const myBadge = getBadge();

  useEffect(() => {
    loadPosts();
    if (user) loadMyLikes();
  }, [category, user]);

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
    setMyLikes(new Set((data || []).map(l => l.post_id)));
  };

  const openPost = async (post) => {
    // 조회수 증가
    await supabase.from("community_posts").update({ views: post.views + 1 }).eq("id", post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: p.views + 1 } : p));
    setShowDetail({ ...post, views: post.views + 1 });
    // 댓글 로드
    const { data } = await supabase.from("community_comments").select("*").eq("post_id", post.id).order("created_at");
    setComments(data || []);
    setNewComment("");
  };

  const submitPost = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast("제목과 내용을 입력하세요", "error"); return; }
    const row = {
      user_id: user.id,
      author_name: form.author_name.trim() || defaultName,
      badge_label: myBadge?.label || null,
      badge_color: myBadge?.color || null,
      badge_bg:    myBadge?.bg    || null,
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
    };
    const { data, error } = await supabase.from("community_posts").insert(row).select().single();
    if (error) { toast("작성 오류: " + error.message, "error"); return; }
    setPosts(prev => [data, ...prev]);
    setShowWrite(false);
    setForm({ title: "", content: "", category: "자유", author_name: "" });
    toast("게시글이 등록되었습니다 🎉");
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    const row = { post_id: showDetail.id, user_id: user.id, author_name: defaultName, content: newComment.trim() };
    const { data, error } = await supabase.from("community_comments").insert(row).select().single();
    if (error) { toast("댓글 오류", "error"); return; }
    setComments(prev => [...prev, data]);
    setNewComment("");
  };

  const toggleLike = async (postId) => {
    if (!user) return;
    const liked = myLikes.has(postId);
    if (liked) {
      await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.from("community_posts").update({ likes: (posts.find(p=>p.id===postId)?.likes||1)-1 }).eq("id", postId);
      setMyLikes(prev => { const s=new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id===postId ? {...p,likes:p.likes-1} : p));
      if (showDetail?.id===postId) setShowDetail(p => ({...p, likes:p.likes-1}));
    } else {
      await supabase.from("community_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.from("community_posts").update({ likes: (posts.find(p=>p.id===postId)?.likes||0)+1 }).eq("id", postId);
      setMyLikes(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => p.id===postId ? {...p,likes:p.likes+1} : p));
      if (showDetail?.id===postId) setShowDetail(p => ({...p, likes:p.likes+1}));
    }
  };

  const deletePost = async (id) => {
    await supabase.from("community_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setShowDetail(null);
    toast("삭제되었습니다");
  };

  const timeAgo = (dt) => {
    const diff = (Date.now() - new Date(dt)) / 1000;
    if (diff < 60) return "방금";
    if (diff < 3600) return Math.floor(diff/60) + "분 전";
    if (diff < 86400) return Math.floor(diff/3600) + "시간 전";
    return Math.floor(diff/86400) + "일 전";
  };

  return (
    <div className="page-in page-padding" style={{ maxWidth: 860 }}>
      {/* 헤더 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <SectionLabel>COMMUNITY</SectionLabel>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a2744" }}>임대인 커뮤니티</h1>
          {myBadge && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:6, padding:"4px 12px", borderRadius:20, background:myBadge.bg, border:`1px solid ${myBadge.color}30` }}>
              <span style={{ fontSize:11, fontWeight:700, color:myBadge.color }}>{myBadge.label}</span>
              <span style={{ fontSize:10, color:myBadge.color }}>인증됨 ✓</span>
            </div>
          )}
          <p style={{ fontSize:13, color:"#8a8a9a", marginTop:3 }}>가입자 전용 · 팁·정보·질문 자유롭게 공유하세요</p>
        </div>
        <button onClick={() => { setForm({...form, author_name: defaultName}); setShowWrite(true); }}
          style={{ padding:"10px 20px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          ✏️ 글쓰기
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
            border:`1px solid ${category===c ? C.indigo : "#ebe9e3"}`,
            background: category===c ? C.indigo : "transparent",
            color: category===c ? "#fff" : C.muted,
          }}>{c}</button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.muted }}>불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:"center", padding:60 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          <p style={{ fontSize:15, fontWeight:700, color:"#1a2744" }}>첫 번째 글을 작성해보세요!</p>
          <p style={{ fontSize:13, color:C.muted, marginTop:6 }}>임대 관련 팁, 정보, 질문 무엇이든 환영합니다</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {posts.map(post => (
            <div key={post.id} onClick={() => openPost(post)} className="hover-lift"
              style={{ background:"#fff", border:"1px solid #ebe9e3", borderRadius:14, padding:"16px 20px", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:10, fontWeight:700, color: CAT_COLORS[post.category]||C.muted, background:(CAT_COLORS[post.category]||C.muted)+"15", padding:"2px 8px", borderRadius:5 }}>{post.category}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1a2744" }}>{post.author_name}</span>
                    {post.badge_label && (
                      <span style={{ fontSize:9, fontWeight:700, color: post.badge_color || "#8a8a9a", background: post.badge_bg || "#f0efe9", padding:"1px 6px", borderRadius:20, marginLeft:4 }}>{post.badge_label}</span>
                    )}
                    <span style={{ fontSize:11, color:C.muted }}>{timeAgo(post.created_at)}</span>
                  </div>
                  <p style={{ fontSize:14, fontWeight:700, color:"#1a2744", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.title}</p>
                  <p style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{post.content.slice(0,80)}{post.content.length>80?"...":""}</p>
                </div>
              </div>
              <div style={{ display:"flex", gap:14, marginTop:10 }}>
                <span style={{ fontSize:11, color:C.muted }}>👁 {post.views}</span>
                <span style={{ fontSize:11, color:myLikes.has(post.id)?C.rose:C.muted }}>❤️ {post.likes}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 글쓰기 모달 */}
      <Modal open={showWrite} onClose={() => setShowWrite(false)}>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:16 }}>글쓰기</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          <div>
            <p style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>카테고리</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {CATEGORIES.slice(1).map(c => (
                <button key={c} onClick={() => setForm(f=>({...f,category:c}))} style={{
                  padding:"4px 11px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
                  border:`1px solid ${form.category===c?C.indigo:"#ebe9e3"}`,
                  background:form.category===c?C.indigo+"15":"transparent",
                  color:form.category===c?C.indigo:C.muted,
                }}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>닉네임</p>
            <input value={form.author_name} onChange={e=>setForm(f=>({...f,author_name:e.target.value}))} placeholder={defaultName}
              style={{ width:"100%", padding:"10px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, outline:"none" }} />
          </div>
          <div>
            <p style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>제목</p>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="제목을 입력하세요"
              style={{ width:"100%", padding:"10px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, outline:"none" }} />
          </div>
          <div>
            <p style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", marginBottom:7 }}>내용</p>
            <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="내용을 입력하세요..." rows={6}
              style={{ width:"100%", padding:"11px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, resize:"vertical", outline:"none", lineHeight:1.7 }} />
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowWrite(false)} style={{ flex:1, padding:"12px", borderRadius:11, background:"transparent", border:"1px solid #ebe9e3", color:C.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>취소</button>
            <button onClick={submitPost} style={{ flex:2, padding:"12px", borderRadius:11, background:`linear-gradient(135deg,${C.indigo},${C.purple})`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>등록하기</button>
          </div>
        </div>
      </Modal>

      {/* 상세 / 댓글 모달 */}
      {showDetail && (
        <Modal open={!!showDetail} onClose={()=>setShowDetail(null)}>
          <div style={{ maxHeight:"75vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <span style={{ fontSize:10, fontWeight:700, color:CAT_COLORS[showDetail.category]||C.muted, background:(CAT_COLORS[showDetail.category]||C.muted)+"15", padding:"2px 8px", borderRadius:5 }}>{showDetail.category}</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#1a2744" }}>{showDetail.author_name}</span>
            {showDetail.badge_label && (
              <span style={{ fontSize:9, fontWeight:700, color: showDetail.badge_color || "#8a8a9a", background: showDetail.badge_bg || "#f0efe9", padding:"1px 7px", borderRadius:20, marginLeft:4 }}>{showDetail.badge_label}</span>
            )}
              <span style={{ fontSize:11, color:C.muted }}>{timeAgo(showDetail.created_at)}</span>
              {showDetail.user_id===user?.id && (
                <button onClick={()=>deletePost(showDetail.id)} style={{ marginLeft:"auto", fontSize:11, padding:"3px 9px", borderRadius:7, border:`1px solid ${C.rose}`, background:"transparent", color:C.rose, cursor:"pointer" }}>삭제</button>
              )}
            </div>
            <h2 style={{ fontSize:18, fontWeight:800, color:"#1a2744", marginBottom:14 }}>{showDetail.title}</h2>
            <p style={{ fontSize:14, color:"#1a2744", lineHeight:1.8, whiteSpace:"pre-wrap", marginBottom:18 }}>{showDetail.content}</p>
            <div style={{ display:"flex", gap:14, paddingBottom:16, borderBottom:"1px solid #ebe9e3" }}>
              <span style={{ fontSize:12, color:C.muted }}>👁 {showDetail.views}</span>
              <button onClick={()=>toggleLike(showDetail.id)} style={{ fontSize:12, background:"none", border:"none", color:myLikes.has(showDetail.id)?C.rose:C.muted, cursor:"pointer", fontWeight:700 }}>
                {myLikes.has(showDetail.id)?"❤️":"🤍"} {showDetail.likes} 좋아요
              </button>
            </div>

            {/* 댓글 */}
            <div style={{ marginTop:16 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#1a2744", marginBottom:12 }}>댓글 {comments.length}개</p>
              {comments.map(c => (
                <div key={c.id} style={{ background:"#f8f7f4", borderRadius:10, padding:"11px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1a2744" }}>{c.author_name}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize:13, color:"#1a2744", lineHeight:1.6 }}>{c.content}</p>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <input value={newComment} onChange={e=>setNewComment(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&submitComment()}
                  placeholder="댓글을 입력하세요..."
                  style={{ flex:1, padding:"10px 13px", fontSize:13, color:"#1a2744", background:"#f8f7f4", border:"1px solid #ebe9e3", borderRadius:10, outline:"none" }} />
                <button onClick={submitComment} style={{ padding:"10px 16px", borderRadius:10, background:C.indigo, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>등록</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
