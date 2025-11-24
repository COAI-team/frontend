import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css'; // VS Code 다크 테마
import "../../styles/FreeboardDetail.css";

const FreeboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const contentRef = useRef(null);

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

    // Monaco 코드 블록 찾기
    const monacoBlocks = contentRef.current.querySelectorAll('pre[data-type="monaco-code-block"]');
    
    monacoBlocks.forEach(block => {
      const code = block.getAttribute('data-code');
      const language = block.getAttribute('data-language');
      
      if (code) {
        // HTML 엔티티 디코딩
        const decodedCode = code
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&');
        
        // 코드 블록 재구성
        block.innerHTML = `
          <div class="monaco-code-header">
            <span class="monaco-language">${language || 'code'}</span>
          </div>
          <code class="language-${language || 'plaintext'}">${decodedCode}</code>
        `;
        
        // Syntax Highlighting 적용
        const codeElement = block.querySelector('code');
        if (codeElement) {
          hljs.highlightElement(codeElement);
        }
      }
    });

    // 일반 코드 블록에도 하이라이팅 적용
    const allCodeBlocks = contentRef.current.querySelectorAll('pre code:not(.hljs)');
    allCodeBlocks.forEach(block => {
      hljs.highlightElement(block);
    });
  }, [board]);

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

  if (!board) return <div className="text-white p-10">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-100">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate("/freeboard")}
        className="mb-4 text-gray-400 hover:text-gray-200 flex items-center gap-2"
      >
        ← 목록으로
      </button>

      {/* 제목 */}
      <h1 className="text-4xl font-bold mb-3">
        {board.freeboardTitle || "제목 없음"}
      </h1>

      {/* 메타 정보 */}
      <div className="flex items-center gap-4 text-gray-400 mb-6 pb-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm">
            {String(board.userId).slice(0, 1)}
          </div>
          <span>사용자 {board.userId}</span>
        </div>
        <span>·</span>
        <span>{new Date(board.freeboardCreatedAt).toLocaleString()}</span>
        <span>·</span>
        <span>조회수 {board.freeboardClick}</span>
      </div>

      {/* 대표 이미지 */}
      {board.freeboardRepresentImage && (
        <div className="mb-6">
          <img
            src={board.freeboardRepresentImage}
            alt="대표 이미지"
            className="w-full max-w-2xl rounded-lg"
          />
        </div>
      )}

      {/* 본문 내용 */}
      <div
        ref={contentRef}
        className="freeboard-content"
        dangerouslySetInnerHTML={{ __html: getRenderedContent(board.freeboardContent) }}
      ></div>

      {/* 하단 액션 버튼 */}
      <div className="mt-10 pt-6 border-t border-gray-700 flex gap-3">
        <button
          onClick={() => navigate(`/freeboard/edit/${id}`)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
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
                  navigate("/freeboard");
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