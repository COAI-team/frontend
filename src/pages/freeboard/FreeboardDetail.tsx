import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface Freeboard {
  freeboardId: number;
  userId: number;
  freeboardTitle: string;
  freeboardContent: string;
  freeboardClick: number;
  freeboardCreatedAt: string;
}

const FreeboardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<Freeboard | null>(null);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`http://localhost:8090/api/freeboard/${id}`)
      .then((res) => setBoard(res.data))
      .catch((err) => console.error("게시글 불러오기 실패:", err));
  }, [id]);

  if (!board) return <div className="text-white p-10">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-100">
      <h1 className="text-3xl font-bold mb-3">{board.freeboardTitle}</h1>
      <div className="text-gray-400 mb-6">
        작성자: {board.userId} | 조회수: {board.freeboardClick}
      </div>
      <p className="whitespace-pre-wrap text-gray-200">{board.freeboardContent}</p>
    </div>
  );
};

export default FreeboardDetail;
