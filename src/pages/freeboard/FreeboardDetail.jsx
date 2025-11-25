import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import hljs from 'highlight.js';
import "../../styles/FreeboardDetail.css";

const FreeboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const contentRef = useRef(null);

  // 다크모드 감지 및 highlight.js 테마 동적 로드
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
      
      // 기존 highlight.js 스타일 제거
      const existingStyle = document.getElementById('hljs-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // 테마에 맞는 스타일 추가
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
        console.log("📄 상세 데이터:", res.data);
        setBoard(res.data);
      })
      .catch((err) => console.error("게시글 불러오기 실패:", err));
  }, [id]);

  // Monaco 코드 블록 렌더링 처리 + Syntax Highlighting
  useEffect(() => {
    if (!contentRef.current) return;

    const timer = setTimeout(() => {
      const monacoBlocks = contentRef.current.querySelectorAll('pre[data-type="monaco-code-block"]');
      
      monacoBlocks.forEach(block => {
        const code = block.getAttribute('data-code');
        const language = block.getAttribute('data-language');
        
        if (code) {
          // HTML 엔티티 디코딩
          const decodeHTML = (html) => {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
          };
          
          const decodedCode = decodeHTML(code);
          
          // 기존 클래스 유지하되 내용 재구성
          block.innerHTML = '';
          block.className = 'code-block-wrapper'; // 새로운 클래스명
          block.removeAttribute('data-type');
          
          const header = document.createElement('div');
          header.className = 'code-header';
          header.innerHTML = `<span class="code-language">${language || 'code'}</span>`;
          
          const codeElement = document.createElement('code');
          codeElement.className = `language-${language || 'plaintext'}`;
          codeElement.textContent = decodedCode;
          
          block.appendChild(header);
          block.appendChild(codeElement);
          
          codeElement.classList.remove('hljs');
          codeElement.removeAttribute('data-highlighted');
          hljs.highlightElement(codeElement);
        }
      });

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
    if (!content) return "";
    
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

      <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        {board.freeboardTitle || "제목 없음"}
      </h1>

      <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-300'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700'}`}>
            {String(board.userId).slice(0, 1)}
          </div>
          <span>사용자 {board.userId}</span>
        </div>
        <span>·</span>
        <span>{new Date(board.freeboardCreatedAt).toLocaleString()}</span>
        <span>·</span>
        <span>조회수 {board.freeboardClick}</span>
      </div>

      {board.freeboardRepresentImage && (
        <div className="mb-6">
          <img
            src={board.freeboardRepresentImage}
            alt="대표 이미지"
            className="w-full max-w-2xl rounded-lg"
          />
        </div>
      )}

      <div
        ref={contentRef}
        className="freeboard-content"
        dangerouslySetInnerHTML={{ __html: getRenderedContent(board.freeboardContent) }}
      ></div>

      <div className={`mt-10 pt-6 border-t flex gap-3 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
        <button
          onClick={() => navigate(`/freeboard/edit/${id}`)}
          className={`px-4 py-2 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
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
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
        >
          삭제
        </button>
      </div>
    </div>
  );
};

export default FreeboardDetail;