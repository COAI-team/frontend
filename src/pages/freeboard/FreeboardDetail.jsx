import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../server/AxiosConfig";
import { getAuth } from "../../utils/auth/token";
import { MessageCircle, Share2, AlertCircle } from "lucide-react";
import "../../styles/FreeboardDetail.css";
import CommentSection from "../../components/comment/CommentSection";
import LikeButton from '../../components/button/LikeButton';
import FreeboardContent from './FreeboardContent';
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";

const FreeboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Alert 훅
  const {alert, showAlert, closeAlert} = useAlert();

  useEffect(() => {
    const auth = getAuth();
    if (auth) {
      setCurrentUser(auth.user);
    }
  }, []);

  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains("dark");
      setIsDark(darkMode);

      const existingStyle = document.getElementById("hljs-theme");
      if (existingStyle) {
        existingStyle.remove();
      }

      const link = document.createElement("link");
      link.id = "hljs-theme";
      link.rel = "stylesheet";
      link.href = darkMode
        ? "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css"
        : "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
      document.head.appendChild(link);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      const existingStyle = document.getElementById("hljs-theme");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchBoard = async () => {
      try {
        const res = await axiosInstance.get(`/freeboard/${id}`);
        const responseData = res.data?.data || res.data;
        
        setBoard(responseData);
        setIsLiked(responseData.isLiked || false);
        setLikeCount(responseData.likeCount || 0);
        setCommentCount(responseData.commentCount || 0);
      } catch (err) {
        console.error("게시글 불러오기 실패:", err);
        showAlert({
          type: 'error',
          title: '불러오기 실패',
          message: '게시글을 불러오는데 실패했습니다.'
        });
      }
    };

    fetchBoard();
  }, [alert, id, showAlert]);

  const handleTagClick = (tag) => {
    navigate(`/freeboard?keyword=${encodeURIComponent(tag)}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(globalThis.location.href);

    showAlert({
      type: 'success',
      title: '복사 완료',
      message: '링크가 클립보드에 복사되었습니다.'
    });
  };

  const handleReport = () => {
    console.log("신고 클릭");
  };

  const handleLikeChange = (newIsLiked, newLikeCount) => {
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
  };

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
  };

  const getRenderedContent = (content) => {
    if (!content) {
      return "";
    }

    try {
      if (content.startsWith("[")) {
        const blocks = JSON.parse(content);
        if (blocks.length > 0 && blocks[0].content) {
          return blocks[0].content;
        }
      }
      return content;
    } catch (e) {
      console.error("컨텐츠 파싱 실패:", e);
      return content;
    }
  };

  if (!board) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#101828" : "#f9fafb",
          color: isDark ? "white" : "#1f2937",
          padding: "2.5rem",
        }}
      >
        로딩 중...
      </div>
    );
  }

  const currentUserId = currentUser?.userId ?? currentUser?.id ?? null;
  const currentUserNickname = currentUser?.userNickname ?? currentUser?.nickname ?? "";
  const isAuthor =
    currentUserId != null && board.userId != null
      ? Number(currentUserId) === Number(board.userId)
      : false;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day}. ${hours}:${minutes}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#101828" : "#f9fafb",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => navigate("/freeboard")}
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: isDark ? "#9ca3af" : "#4b5563",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = isDark ? "#e5e7eb" : "#1f2937")}
          onMouseLeave={(e) => (e.target.style.color = isDark ? "#9ca3af" : "#4b5563")}
        >
          ← 목록으로
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "0.75rem",
          }}
        >
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: "700",
              flex: 1,
              color: isDark ? "#e5e7eb" : "#111827",
            }}
          >
            {board.freeboardTitle || "제목 없음"}
          </h1>

          {isAuthor && (
            <div style={{ display: "flex", gap: "0.75rem", marginLeft: "1rem" }}>
              <button
                onClick={() => navigate(`/freeboard/edit/${id}`)}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "500",
                  backgroundColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#e5e7eb" : "#1f2937",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = isDark ? "#4b5563" : "#d1d5db")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = isDark ? "#374151" : "#e5e7eb")
                }
              >
                수정
              </button>
              <button
                onClick={() => {
                  showAlert({
                    type: 'warning',
                    title: '삭제 확인',
                    message: '정말 삭제하시겠습니까?',
                    onConfirm: async () => {
                      try {
                        await axiosInstance.delete(`/freeboard/${id}`);

                        showAlert({
                          type: 'success',
                          title: '삭제 완료',
                          message: '게시글이 삭제되었습니다.',
                          onConfirm: () => navigate('/freeboard')
                        });
                      } catch (err) {
                        console.error('삭제 실패:', err);

                        showAlert({
                          type: 'error',
                          title: '삭제 실패',
                          message: '게시글 삭제에 실패했습니다.'
                        });
                      }
                    }
                  });
                }}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "500",
                  backgroundColor: isDark ? "rgba(127, 29, 29, 0.3)" : "rgba(220, 38, 38, 0.1)",
                  color: isDark ? "#fca5a5" : "#dc2626",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = isDark ? "rgba(127, 29, 29, 0.5)" : "rgba(220, 38, 38, 0.2)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = isDark ? "rgba(127, 29, 29, 0.3)" : "rgba(220, 38, 38, 0.1)")
                }
              >
                삭제
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
            paddingBottom: "1.5rem",
            borderBottom: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            color: isDark ? "#9ca3af" : "#4b5563",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              backgroundColor: isDark ? "#374151" : "#d1d5db",
              color: isDark ? "#e5e7eb" : "#1f2937",
              overflow: "hidden",
            }}
          >
            {board.userImage ? (
              <img 
                src={board.userImage} 
                alt={board.userNickname}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              board.userNickname
                ? String(board.userNickname).charAt(0).toUpperCase()
                : "U"
            )}
          </div>
          <span>{board.userNickname || "익명"}</span>
        </div>
          <span>·</span>
          <span>{formatDate(board.freeboardCreatedAt)}</span>
          <span>·</span>
          <span>조회수 {board.freeboardClick}</span>
        </div>

        <FreeboardContent
          content={getRenderedContent(board.freeboardContent)}
          isDark={isDark}
          boardId={board.freeboardId}
        />

        {board.tags && board.tags.length > 0 && (
          <div
            style={{
              marginTop: "2rem",
              paddingBottom: "2rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {board.tags.map((tag, index) => (
              <span
                key={index}
                onClick={() => handleTagClick(tag)}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#60a5fa",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)")}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 0",
            marginTop: "8rem",
            paddingTop: "2rem",
            borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <LikeButton
              referenceType="freeboard"
              referenceId={Number(id)}
              initialIsLiked={isLiked}
              initialLikeCount={likeCount}
              showCount={true}
              showUsers={true}
              size="md"
              onChange={handleLikeChange}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: isDark ? "#9ca3af" : "#4b5563",
              }}
            >
              <MessageCircle size={20} />
              <span style={{ fontSize: "0.875rem" }}>댓글</span>
              <span style={{ fontWeight: "500" }}>{commentCount}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <button
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isDark ? "#9ca3af" : "#4b5563",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = isDark ? "#d1d5db" : "#1f2937")}
              onMouseLeave={(e) => (e.target.style.color = isDark ? "#9ca3af" : "#4b5563")}
            >
              <Share2 size={18} />
              <span>공유</span>
            </button>

            <button
              onClick={handleReport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isDark ? "#9ca3af" : "#4b5563",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = isDark ? "#d1d5db" : "#1f2937")}
              onMouseLeave={(e) => (e.target.style.color = isDark ? "#9ca3af" : "#4b5563")}
            >
              <AlertCircle size={18} />
              <span>신고</span>
            </button>
          </div>
        </div>

        <CommentSection
          boardId={Number(id)}
          boardType="FREEBOARD"
          currentUserId={currentUserId}
          currentUserNickname={currentUserNickname}
          isDark={isDark}
          onCommentCountChange={handleCommentCountChange}
        />
      </div>
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </div>
  );
};

export default FreeboardDetail;
