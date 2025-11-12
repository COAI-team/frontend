import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FreeboardWrite: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    axios
      .post("http://localhost:8090/api/freeboard/write", {
        userId: 1, // 임시
        freeboardTitle: title,
        freeboardContent: content,
      })
      .then(() => {
        alert("게시글이 등록되었습니다.");
        navigate("/freeboard");
      })
      .catch((err) => console.error("등록 실패:", err));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">게시글 작성</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
        />
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-white"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default FreeboardWrite;
