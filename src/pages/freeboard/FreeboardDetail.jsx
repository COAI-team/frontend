import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import hljs from 'highlight.js';
import { Heart, MessageCircle, Share2, AlertCircle } from "lucide-react";
import "../../styles/FreeboardDetail.css";
import CommentSection from '../../components/comment/CommentSection';

const FreeboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const contentRef = useRef(null);
  
  // 좋아요 상태 관리
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // 임시로 댓글작성 userId 1로 설정 (나중에 실제 로그인 유저로 변경)
  const currentUserId = 1;

  // 다크모드 감지 및 highlight.js 테마 동적 로드
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
      
      const existingStyle = document.getElementById('hljs-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const link = document.createElement('link');
      link.id = 'hljs-theme';
      link.rel = 'stylesheet';
      link.href = darkMode 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      document.head.appendChild(link);
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      observer.disconnect();
      const existingStyle = document.getElementById('hljs-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    axios
      .get(`http://localhost:8090/freeboard/${id}`)
      .then((res) => {
        console.log("API 응답:", res.data);
        console.log("tags:", res.data.tags);
        setBoard(res.data);
        setLikeCount(res.data.likeCount || 0);
        setCommentCount(res.data.commentCount || 0);
      })
      .catch((err) => console.error("게시글 불러오기 실패:", err));
  }, [id]);

  // 좋아요 핸들러
  const handleLike = () => {
    // TODO: API 연동
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  // 공유 핸들러
  const handleShare = () => {
    // TODO: 공유 기능 구현
    console.log("공유 클릭");
  };

  // 신고 핸들러
  const handleReport = () => {
    // TODO: 신고 기능 구현
    console.log("신고 클릭");
  };

  // Monaco 코드 블록 및 링크 프리뷰 렌더링 처리
  useEffect(() => {
    if (!contentRef.current) return;

    const timer = setTimeout(() => {
      // 스티커 이미지 스타일 적용 (가장 먼저 처리)
      const stickerImages = contentRef.current.querySelectorAll('img[data-sticker], img[src*="openmoji"]');
      stickerImages.forEach(img => {
        img.style.width = '1.5em';
        img.style.height = '1.5em';
        img.style.verticalAlign = '-0.3em';
        img.style.display = 'inline-block';
        img.style.margin = '0 0.1em';
      });

      // Monaco 코드 블록 처리
      const monacoBlocks = contentRef.current.querySelectorAll('pre[data-type="monaco-code-block"]');
      
      monacoBlocks.forEach(block => {
        const code = block.getAttribute('data-code');
        const language = block.getAttribute('data-language');
        
        if (code) {
          const decodeHTML = (html) => {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
          };
          
          const decodedCode = decodeHTML(code);
          
          block.innerHTML = '';
          block.className = 'code-block-wrapper';
          block.removeAttribute('data-type');
          
          const header = document.createElement('div');
          header.className = 'code-header';
          header.innerHTML = `<span class="code-language">${language || 'code'}</span>`;
          
          const codeElement = document.createElement('code');
          codeElement.className = `language-${language || 'plaintext'}`;
          codeElement.textContent = decodedCode;
          
          block.appendChild(header);
          block.appendChild(codeElement);
          
          hljs.highlightElement(codeElement);
        }
      });

      // 링크 프리뷰 처리
      const linkPreviews = contentRef.current.querySelectorAll('div[data-type="link-preview"]');
      
      linkPreviews.forEach(preview => {
        const title = preview.getAttribute('data-title');
        const description = preview.getAttribute('data-description');
        const image = preview.getAttribute('data-image');
        const site = preview.getAttribute('data-site');
        const url = preview.getAttribute('data-url');
        
        if (url) {
          preview.innerHTML = '';
          preview.className = `link-preview-card ${isDark ? 'dark' : 'light'}`;
          preview.style.cssText = `
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1rem 0;
            display: flex;
            gap: 1rem;
            background: ${isDark ? '#1f2937' : '#ffffff'};
            cursor: pointer;
            transition: all 0.2s;
          `;
          
          preview.addEventListener('mouseenter', () => {
            preview.style.borderColor = isDark ? '#60a5fa' : '#3b82f6';
          });
          
          preview.addEventListener('mouseleave', () => {
            preview.style.borderColor = isDark ? '#374151' : '#e5e7eb';
          });
          
          preview.addEventListener('click', () => {
            window.open(url, '_blank');
          });
          
          if (image) {
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'flex-shrink: 0; width: 120px; height: 120px; overflow: hidden; border-radius: 0.375rem;';
            
            const img = document.createElement('img');
            img.src = image;
            img.alt = title || 'Link preview';
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            
            imgContainer.appendChild(img);
            preview.appendChild(imgContainer);
          }
          
          const textContainer = document.createElement('div');
          textContainer.style.cssText = 'flex: 1; min-width: 0;';
          
          if (site) {
            const siteSpan = document.createElement('div');
            siteSpan.textContent = site;
            siteSpan.style.cssText = `
              font-size: 0.875rem;
              color: ${isDark ? '#9ca3af' : '#6b7280'};
              margin-bottom: 0.25rem;
            `;
            textContainer.appendChild(siteSpan);
          }
          
          if (title) {
            const titleDiv = document.createElement('div');
            titleDiv.textContent = title;
            titleDiv.style.cssText = `
              font-weight: 600;
              font-size: 1rem;
              color: ${isDark ? '#f3f4f6' : '#111827'};
              margin-bottom: 0.25rem;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `;
            textContainer.appendChild(titleDiv);
          }
          
          if (description) {
            const descDiv = document.createElement('div');
            descDiv.textContent = description;
            descDiv.style.cssText = `
              font-size: 0.875rem;
              color: ${isDark ? '#d1d5db' : '#4b5563'};
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

      // 일반 코드 블록 Syntax Highlighting
      const allCodeBlocks = contentRef.current.querySelectorAll('pre code:not([class*="language-"])');
      allCodeBlocks.forEach(block => {
        block.classList.remove('hljs');
        block.removeAttribute('data-highlighted');
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
      if (content.startsWith('[')) {
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
      <div className={`p-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        로딩 중...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate("/freeboard/list")}
        className={`mb-4 flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
      >
        ← 목록으로
      </button>

      {/* 제목과 수정/삭제 버튼 */}
      <div className="flex items-start justify-between mb-3">
        <h1 className={`text-4xl font-bold flex-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {board.freeboardTitle || "제목 없음"}
        </h1>
        
        <div className="flex gap-3 ml-4">
          <button
            onClick={() => navigate(`/freeboard/edit/${id}`)}
            className={`px-5 py-2.5 rounded text-base font-medium transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            수정
          </button>
          <button
            onClick={() => {
              if (window.confirm("정말 삭제하시겠습니까?")) {
                axios
                  .delete(`http://localhost:8090/freeboard/${id}`)
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
            className={`px-5 py-2.5 rounded text-base font-medium transition-colors ${
              isDark
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            삭제
          </button>
        </div>
      </div>

      <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-300'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'}`}>
            {board.userNickname ? String(board.userNickname).charAt(0).toUpperCase() : 'U'}
          </div>
          <span>{board.userNickname || '익명'}</span>
        </div>
        <span>·</span>
        <span>{new Date(board.freeboardCreatedAt).toLocaleString()}</span>
        <span>·</span>
        <span>조회수 {board.freeboardClick}</span>
      </div>

      <div
        ref={contentRef}
        className="freeboard-content mb-8"
        dangerouslySetInnerHTML={{ __html: getRenderedContent(board.freeboardContent) }}
      ></div>

      {board.tags && board.tags.length > 0 && (
        <div className={`mt-8 pb-8 flex flex-wrap gap-2`}>
          {board.tags.map((tag, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-sm ${
                isDark
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 좋아요/공유/신고 바 */}
      <div className={`flex items-center justify-between py-4 mt-32 pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className="flex items-center gap-6">
          {/* 좋아요 */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked
                ? 'text-red-500'
                : isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">좋아요</span>
            <span className="font-medium">{likeCount}</span>
          </button>

          {/* 댓글 */}
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <MessageCircle size={20} />
            <span className="text-sm">댓글</span>
            <span className="font-medium">{commentCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* 공유 */}
          <button 
            onClick={handleShare}
            className={`flex items-center gap-2 text-sm transition-colors ${
              isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Share2 size={18} />
            <span>공유</span>
          </button>

          {/* 신고 */}
          <button 
            onClick={handleReport}
            className={`flex items-center gap-2 text-sm transition-colors ${
              isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
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
        isDark={isDark}
      />
    </div>
  );
};

export default FreeboardDetail;