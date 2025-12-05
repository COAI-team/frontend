import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WriteEditor from "../../components/editor/WriteEditor";
import axiosInstance from "../../server/AxiosConfig";

const FreeboardEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchFreeboard = async () => {
      try {
        const response = await axiosInstance.get(`/freeboard/${id}`);
        const data = response.data;
        
        console.log("불러온 데이터:", data);
        
        let content = "";
        if (data.freeboardContent) {
          try {
            const blocks = JSON.parse(data.freeboardContent);
            content = blocks[0]?.content || "";
            
            const stickerCount = (content.match(/data-sticker/g) || []).length;
            console.log(`스티커 개수: ${stickerCount}`);
            
            content = content.replace(
              /<img([^>]*src="https:\/\/cdn\.jsdelivr\.net\/gh\/hfg-gmuend\/openmoji[^"]*"[^>]*)(?!.*data-sticker)([^>]*)>/g,
              '<img$1 data-sticker="true"$2>'
            );
            
            console.log("처리 후 스티커 개수:", (content.match(/data-sticker/g) || []).length);
          } catch (e) {
            console.error("JSON 파싱 에러:", e);
            content = "";
          }
        }
        
        console.log("추출한 content:", content);
        
        setInitialData({
          title: data.freeboardTitle || "",
          content: content,
          representImage: data.freeboardRepresentImage,
          tags: data.tags || [],
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

  const handleSubmit = async ({ title, content, representImage, tags }) => {
    try {
      const stickerCount = (content.match(/data-sticker/g) || []).length;
      console.log(`제출할 스티커 개수: ${stickerCount}`);
      
      const blocks = [{
        id: `block-${Date.now()}`,
        type: "tiptap",
        content: content,
        order: 0
      }];

      await axiosInstance.put(`/freeboard/${id}`, {
        freeboardTitle: title,
        blocks: blocks,
        freeboardRepresentImage: representImage || null,
        tags: tags || [],
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
        initialTags={initialData?.tags}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default FreeboardEdit;