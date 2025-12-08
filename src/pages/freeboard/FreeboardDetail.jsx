import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../server/AxiosConfig";
import { getAuth } from "../../utils/auth/token";
import hljs from "highlight.js";
import { Heart, MessageCircle, Share2, AlertCircle } from "lucide-react";
import "../../styles/FreeboardDetail.css";
import CommentSection from "../../components/comment/CommentSection";

const FreeboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const contentRef = useRef(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // 로그인 유저 정보
  const [currentUser, setCurrentUser] = useState(null);

  // 다크 모드 감지
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
      alert("게시글을 불러오는데 실패했습니다.");
    }
  };

  fetchBoard();
}, [id]);

  const handleLike = async () => {
    // 로그인 안 되어 있으면 좋아요 전에 로그인 유도
    if (!currentUser) {
      const goLogin = window.confirm(
        "로그인 후 좋아요를 누를 수 있습니다. 로그인 하시겠습니까?"
      );
      if (goLogin) {
        const redirect = encodeURIComponent(`/freeboard/${id}`);
        navigate(`/signin?redirect=${redirect}`);
      }
      return;
    }

    try {
      const response = await axiosInstance.post(`/like/freeboard/${id}`);
      const { isLiked } = response.data;

      setIsLiked(isLiked);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      alert("좋아요 처리에 실패했습니다.");
    }
  };

  const handleShare = () => {
    console.log("공유 클릭");
  };

  const handleReport = () => {
    console.log("신고 클릭");
  };

  // 콘텐츠(스티커/코드블록/링크프리뷰) 렌더링
  useEffect(() => {
    if (!contentRef.current) return;

    const timer = setTimeout(() => {
      const stickerImages = contentRef.current.querySelectorAll(
        'img[data-sticker], img[src*="openmoji"]'
      );
      stickerImages.forEach((img) => {
        img.style.width = "1.5em";
        img.style.height = "1.5em";
        img.style.verticalAlign = "-0.3em";
        img.style.display = "inline-block";
        img.style.margin = "0 0.1em";
      });

      const monacoBlocks = contentRef.current.querySelectorAll(
        'pre[data-type="monaco-code-block"]'
      );

      monacoBlocks.forEach((block) => {
        const code = block.getAttribute("data-code");
        const language = block.getAttribute("data-language");

        if (code) {
          const decodeHTML = (html) => {
            const txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
          };

          const decodedCode = decodeHTML(code);

          block.innerHTML = "";
          block.className = "code-block-wrapper";
          block.removeAttribute("data-type");

          const header = document.createElement("div");
          header.className = "code-header";
          header.innerHTML = `<span class="code-language">${
            language || "code"
          }</span>`;

          const codeElement = document.createElement("code");
          codeElement.className = `language-${language || "plaintext"}`;
          codeElement.textContent = decodedCode;

          block.appendChild(header);
          block.appendChild(codeElement);

          hljs.highlightElement(codeElement);
        }
      });

      const linkPreviews = contentRef.current.querySelectorAll(
        'div[data-type="link-preview"]'
      );

      linkPreviews.forEach((preview) => {
        const title = preview.getAttribute("data-title");
        const description = preview.getAttribute("data-description");
        const image = preview.getAttribute("data-image");
        const site = preview.getAttribute("data-site");
        const url = preview.getAttribute("data-url");

        if (url) {
          preview.innerHTML = "";
          preview.className = `link-preview-card ${
            isDark ? "dark" : "light"
          }`;
          preview.style.cssText = `
            border: 1px solid ${isDark ? "#374151" : "#e5e7eb"};
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1rem 0;
            display: flex;
            gap: 1rem;
            background: ${isDark ? "#1f2937" : "#ffffff"};
            cursor: pointer;
            transition: all 0.2s;
          `;

          preview.addEventListener("mouseenter", () => {
            preview.style.borderColor = isDark ? "#60a5fa" : "#3b82f6";
          });

          preview.addEventListener("mouseleave", () => {
            preview.style.borderColor = isDark ? "#374151" : "#e5e7eb";
          });

          preview.addEventListener("click", () => {
            window.open(url, "_blank");
          });

          if (image) {
            const imgContainer = document.createElement("div");
            imgContainer.style.cssText =
              "flex-shrink: 0; width: 120px; height: 120px; overflow: hidden; border-radius: 0.375rem;";

            const img = document.createElement("img");
            img.src = image;
            img.alt = title || "Link preview";
            img.style.cssText =
              "width: 100%; height: 100%; object-fit: cover;";

            imgContainer.appendChild(img);
            preview.appendChild(imgContainer);
          }

          const textContainer = document.createElement("div");
          textContainer.style.cssText = "flex: 1; min-width: 0;";

          if (site) {
            const siteSpan = document.createElement("div");
            siteSpan.textContent = site;
            siteSpan.style.cssText = `
              font-size: 0.875rem;
              color: ${isDark ? "#9ca3af" : "#6b7280"};
              margin-bottom: 0.25rem;
            `;
            textContainer.appendChild(siteSpan);
          }

          if (title) {
            const titleDiv = document.createElement("div");
            titleDiv.textContent = title;
            titleDiv.style.cssText = `
              font-weight: 600;
              font-size: 1rem;
              color: ${isDark ? "#f3f4f6" : "#111827"};
              margin-bottom: 0.25rem;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `;
            textContainer.appendChild(titleDiv);
          }

          if (description) {
            const descDiv = document.createElement("div");
            descDiv.textContent = description;
            descDiv.style.cssText = `
              font-size: 0.875rem;
              color: ${isDark ? "#d1d5db" : "#4b5563"};
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            `;
            textContainer.appendChild(descDiv);
          }

          preview.appendChild(textContainer);
        }
      });

      const allCodeBlocks = contentRef.current.querySelectorAll(
        'pre code:not([class*="language-"])'
      );
      allCodeBlocks.forEach((block) => {
        block.classList.remove("hljs");
        block.removeAttribute("data-highlighted");
        hljs.highlightElement(block);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [board, isDark]);

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
          backgroundColor: "#101828",
          color: "white",
          padding: "2.5rem",
        }}
      >
        로딩 중...
      </div>
    );
  }

  // 현재 로그인 유저가 게시글 작성자인지 여부
  const currentUserId =
    currentUser && (currentUser.userId ?? currentUser.id ?? null);
  const currentUserNickname = currentUser?.nickname ?? "";
  const isAuthor =
    currentUserId != null && board.userId != null
      ? Number(currentUserId) === Number(board.userId)
      : false;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#101828",
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
          onClick={() => navigate("/freeboard/list")}
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#9ca3af",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#e5e7eb")}
          onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
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
              color: "#e5e7eb",
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
                  backgroundColor: "#374151",
                  color: "#e5e7eb",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#4b5563")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#374151")
                }
              >
                수정
              </button>
              <button
                onClick={() => {
                  if (window.confirm("정말 삭제하시겠습니까?")) {
                    axiosInstance
                      .delete(`/freeboard/${id}`)
                      .then(() => {
                        alert("삭제되었습니다.");
                        navigate("/freeboard/list");
                      })
                      .catch((err) => {
                        console.error("삭제 실패:", err);
                        alert("삭제에 실패했습니다.");
                      });
                  }
                }}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "500",
                  backgroundColor: "rgba(127, 29, 29, 0.3)",
                  color: "#fca5a5",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(127, 29, 29, 0.5)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "rgba(127, 29, 29, 0.3)")
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
            borderBottom: "1px solid #374151",
            color: "#9ca3af",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
                backgroundColor: "#374151",
                color: "#e5e7eb",
              }}
            >
              {board.userNickname
                ? String(board.userNickname).charAt(0).toUpperCase()
                : "U"}
            </div>
            <span>{board.userNickname || "익명"}</span>
          </div>
          <span>·</span>
          <span>{new Date(board.freeboardCreatedAt).toLocaleString()}</span>
          <span>·</span>
          <span>조회수 {board.freeboardClick}</span>
        </div>

        <div
          ref={contentRef}
          className="freeboard-content"
          style={{ marginBottom: "2rem" }}
          dangerouslySetInnerHTML={{
            __html: getRenderedContent(board.freeboardContent),
          }}
        ></div>

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
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#60a5fa",
                }}
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
            borderTop: "1px solid #374151",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
          >
            <button
              onClick={handleLike}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isLiked ? "#ef4444" : "#9ca3af",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                !isLiked && (e.currentTarget.style.color = "#fca5a5")
              }
              onMouseLeave={(e) =>
                !isLiked && (e.currentTarget.style.color = "#9ca3af")
              }
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              <span style={{ fontSize: "0.875rem" }}>좋아요</span>
              <span style={{ fontWeight: "500" }}>{likeCount}</span>
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#9ca3af",
              }}
            >
              <MessageCircle size={20} />
              <span style={{ fontSize: "0.875rem" }}>댓글</span>
              <span style={{ fontWeight: "500" }}>{commentCount}</span>
            </div>
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
          >
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
                color: "#9ca3af",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#d1d5db")}
              onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
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
                color: "#9ca3af",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#d1d5db")}
              onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
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
        />
      </div>
    </div>
  );
};

export default FreeboardDetail;
