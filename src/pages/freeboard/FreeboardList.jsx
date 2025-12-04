import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Eye, PencilLine } from "lucide-react";

const FreeboardList = () => {
  const [boards, setBoards] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const size = 5;
  const navigate = useNavigate();

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // MutationObserver로 dark 클래스 변경 감지
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:8090/freeboard", {
        params: { page, size }
      })
      .then((res) => {
        console.log("🔍 응답 데이터:", res.data);
        setBoards(res.data.boards || res.data.content || []);
        setTotalCount(res.data.totalCount || res.data.totalElements || 0);
      })
      .catch((err) => {
        console.error("목록 불러오기 실패:", err);
        console.error("에러 상세:", err.response?.data);
      });
  }, [page]);

  // HTML에서 텍스트만 추출하는 함수
  const extractTextFromHTML = (htmlString) => {
    if (!htmlString) return "내용 없음";
    
    try {
      let content = htmlString;
      if (htmlString.startsWith('[')) {
        const blocks = JSON.parse(htmlString);
        if (blocks.length > 0 && blocks[0].content) {
          content = blocks[0].content;
        }
      }
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      return text.trim().slice(0, 150) || "내용 없음";
      
    } catch (e) {
      console.error("텍스트 추출 실패:", e);
      return "내용을 불러올 수 없습니다";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          자유게시판
        </h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          개발과 관련된 다양한 주제로 자유롭게 이야기를 나눠보세요
        </p>
      </div>

      {boards.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          작성된 게시글이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {boards.map((b) => (
            <div
              key={b.freeboardId}
              className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'} rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex gap-5 border`}
              onClick={() => navigate(`/freeboard/${b.freeboardId}`)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700'} flex items-center justify-center text-sm`}>
                    {b.userNickname ? String(b.userNickname).charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                    {b.userNickname || '익명'}
                    <span className={`ml-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      · {new Date(b.freeboardCreatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h3 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                  {b.freeboardTitle || "제목 없음"}
                </h3>

                <div className="text-gray-500 line-clamp-2">
                  {extractTextFromHTML(b.freeboardContent)}
                </div>

                {b.tags && b.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {b.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`
                          px-2 py-1 rounded-md text-xs font-medium
                          ${isDark
                            ? "bg-gray-800 text-blue-300 border border-gray-700"
                            : "bg-blue-100 text-blue-800"}
                        `}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`flex items-center gap-6 mt-4 text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span className="flex items-center gap-1">
                    <Eye size={16} />
                    {b.freeboardClick}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={16} />
                    {b.likeCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={16} />
                    {b.commentCount || 0}
                  </span>
                </div>
              </div>

              {b.freeboardRepresentImage && (
                <img
                  src={b.freeboardRepresentImage}
                  alt="썸네일"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {totalCount > 0 && (
        <div className="mt-10 flex justify-center items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded disabled:opacity-40 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            이전
          </button>

          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
            {page} / {Math.ceil(totalCount / size)}
          </span>

          <button
            onClick={() => setPage((p) => (p * size < totalCount ? p + 1 : p))}
            disabled={page * size >= totalCount}
            className={`px-3 py-1 rounded disabled:opacity-40 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            다음
          </button>
        </div>
      )}

      <button
        onClick={() => navigate("/freeboard/write")}
        className={`
          fixed bottom-30 right-80
          px-6 py-3 rounded-full font-medium shadow-md transition-all duration-200 border flex items-center gap-2
          ${
            isDark
              ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }
        `}
      >
        <PencilLine size={18} />
        글쓰기
      </button>
    </div>
  );
};

export default FreeboardList;