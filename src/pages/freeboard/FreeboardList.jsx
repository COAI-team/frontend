import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FreeboardList = () => {
  const [boards, setBoards] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const size = 5;
  const navigate = useNavigate();

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
      // freeboardContent가 JSON 배열 문자열인 경우 파싱
      let content = htmlString;
      if (htmlString.startsWith('[')) {
        const blocks = JSON.parse(htmlString);
        if (blocks.length > 0 && blocks[0].content) {
          content = blocks[0].content;
        }
      }
      
      // HTML 태그 제거
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // 텍스트만 추출
      const text = tempDiv.textContent || tempDiv.innerText || "";
      
      // 150자까지만 표시
      return text.trim().slice(0, 150) || "내용 없음";
      
    } catch (e) {
      console.error("텍스트 추출 실패:", e);
      return "내용을 불러올 수 없습니다";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">자유게시판</h1>
        <button
          onClick={() => navigate("/freeboard/write")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          글쓰기
        </button>
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
              className="bg-[#1f1f1f] rounded-xl p-5 shadow-md hover:shadow-xl hover:bg-[#262626] cursor-pointer transition-all duration-200 flex gap-5"
              onClick={() => navigate(`/freeboard/${b.freeboardId}`)}
            >
              {/* 왼쪽 본문 */}
              <div className="flex-1">
                {/* 프로필, 닉네임, 작성시간 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-sm">
                    {String(b.userId).slice(0, 1)}
                  </div>
                  <div className="text-sm text-gray-300">
                    사용자 {b.userId}
                    <span className="ml-2 text-gray-500">
                      · {new Date(b.freeboardCreatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* 제목 */}
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  {b.freeboardTitle || "제목 없음"}
                </h3>

                {/* 내용(요약) */}
                <div className="text-gray-400 line-clamp-2">
                  {extractTextFromHTML(b.freeboardContent)}
                </div>

                {/* 하단 정보 */}
                <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm">
                  <span>조회수 {b.freeboardClick}</span>
                  <span>❤️ 0</span>
                  <span>💬 0</span>
                </div>
              </div>

              {/* 오른쪽 대표 이미지 */}
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

      {/* 페이지네이션 */}
      {totalCount > 0 && (
        <div className="mt-10 flex justify-center items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-40"
          >
            이전
          </button>

          <span className="text-gray-300">
            {page} / {Math.ceil(totalCount / size)}
          </span>

          <button
            onClick={() =>
              setPage((p) => (p * size < totalCount ? p + 1 : p))
            }
            disabled={page * size >= totalCount}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default FreeboardList;