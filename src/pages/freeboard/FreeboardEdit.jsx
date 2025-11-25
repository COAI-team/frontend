import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WriteEditor from "../../components/editor/WriteEditor";
import axios from "axios";

const FreeboardEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchFreeboard = async () => {
      try {
        const response = await axios.get(`http://localhost:8090/freeboard/${id}`);
        const data = response.data;
        
        console.log("불러온 데이터:", data);
        
        // freeboardContent는 JSON 문자열이므로 파싱 필요
        let content = "";
        if (data.freeboardContent) {
          try {
            const blocks = JSON.parse(data.freeboardContent);
            content = blocks[0]?.content || "";
          } catch (e) {
            console.error("JSON 파싱 에러:", e);
            content = "";
          }
        }
        
        console.log("추출한 content:", content);
        console.log("제목:", data.freeboardTitle);
        
        setInitialData({
          title: data.freeboardTitle || "",
          content: content,
          representImage: data.freeboardRepresentImage,
        });
      } catch (error) {
        console.error("Error:", error);
        alert("게시글을 불러오는데 실패했습니다.");
        navigate("/freeboard/list");
      } finally {
        setLoading(false);
      }
    };

    fetchFreeboard();
  }, [id, navigate]);

  const handleSubmit = async ({ title, content, representImage }) => {
    try {
      const blocks = [{
        id: `block-${Date.now()}`,
        type: "tiptap",
        content: content,
        order: 0
      }];

      await axios.put(`http://localhost:8090/freeboard/${id}`, {
        freeboardTitle: title,
        blocks: blocks,  // 배열로 전송
        freeboardRepresentImage: representImage || null,
      });

      alert("게시글이 수정되었습니다.");
      navigate(`/freeboard/${id}`);
    } catch (error) {
      console.error("수정 실패:", error);
      console.error("에러 상세:", error.response?.data);
      alert("게시글 수정에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <WriteEditor 
        mode="edit"
        initialTitle={initialData?.title}
        initialContent={initialData?.content}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default FreeboardEdit;