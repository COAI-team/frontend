import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Freeboard {
  freeboardId: number;
  userId: number;
  freeboardTitle: string;
  freeboardContent: string;
  freeboardClick: number;
  freeboardCreatedAt: string;
}

const FreeboardList: React.FC = () => {
  const [boards, setBoards] = useState<Freeboard[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const size = 5;
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/freeboard/list", { params: { page, size } }) // ✅ 프록시 기준
      .then((res) => {
        console.log("서버 응답:", res.data); // 확인용
        setBoards(res.data.boards);
        setTotalCount(res.data.totalCount);
      })
      .catch((err) => console.error("목록 불러오기 실패:", err));
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">자유게시판</h1>
        <button
          onClick={() => navigate("/freeboard/write")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          글쓰기
        </button>
      </div>

      <div className="space-y-4">
        {boards.map((b) => (
          <div
            key={b.freeboardId}
            className="bg-gray-800 hover:bg-gray-700 cursor-pointer transition rounded-lg p-5 shadow"
            onClick={() => navigate(`/freeboard/${b.freeboardId}`)}
          >
            <h3 className="text-lg font-semibold text-blue-400">{b.freeboardTitle}</h3>
            <p className="text-gray-300 mt-2 line-clamp-2">{b.freeboardContent}</p>
            <div className="text-sm text-gray-400 mt-3 flex justify-between">
              <span>조회수 {b.freeboardClick}</span>
              <span>{new Date(b.freeboardCreatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center items-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          이전
        </button>
        <span className="text-gray-300">
          {page} / {Math.ceil(totalCount / size)}
        </span>
        <button
          onClick={() => setPage((p) => (p * size < totalCount ? p + 1 : p))}
          disabled={page * size >= totalCount}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default FreeboardList;
