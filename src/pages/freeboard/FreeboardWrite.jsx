import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import WriteEditor from "../../component/editor/WriteEditor";

const FreeboardWrite = () => {
  const navigate = useNavigate();

  const handleSubmit = (html) => {
    axios
      .post("http://localhost:8090/api/freeboard/write", {
        userId: 1,
        freeboardTitle: "임시 제목",
        freeboardContent: html,
      })
      .then(() => {
        alert("게시글이 등록되었습니다.");
        navigate("/freeboard/list");
      })
      .catch((err) => console.error("등록 실패:", err));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      <WriteEditor onSubmit={handleSubmit} />
    </div>
  );
};

export default FreeboardWrite;
