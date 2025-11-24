import React from "react";
import { axiosInstance } from "../../server/axiosConfig";  // ← 이렇게 변경!
import { useNavigate } from "react-router-dom";
import WriteEditor from "../../components/editor/WriteEditor";

const FreeboardWrite = () => {
  const navigate = useNavigate();

  const handleSubmit = ({ title, content, representImage }) => {
    const blocks = [{
      id: `block-${Date.now()}`,
      type: "tiptap",
      content: content,
      order: 0
    }];

    // axiosInstance를 사용하면 인터셉터가 자동으로 토큰을 추가해줍니다
    axiosInstance  // ← axios 대신 axiosInstance
      .post("http://localhost:8090/freeboard", {
        freeboardTitle: title,
        blocks: blocks, 
        freeboardRepresentImage: representImage || null,
      })
      // headers 옵션은 이제 필요없습니다 - 인터셉터가 자동으로 추가
      .then(() => {
        alert("게시글이 등록되었습니다.");
        navigate("/freeboard/list");
      })
      .catch((err) => {
        console.error("등록 실패:", err);
        console.error("에러 상세:", err.response?.data);
      });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      <WriteEditor onSubmit={handleSubmit} />
    </div>
  );
};

export default FreeboardWrite;