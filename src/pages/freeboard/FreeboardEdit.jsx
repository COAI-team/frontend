import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WriteEditor from "../../components/editor/WriteEditor";
import axiosInstance from "../../server/AxiosConfig";
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";

const FreeboardEdit = () => {
  const {alert, showAlert, closeAlert} = useAlert();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchFreeboard = async () => {
      try {
        const response = await axiosInstance.get(`/freeboard/${id}`);
        
        // response.data.data로 실제 데이터 접근
        const data = response.data.data || response.data;
        
        console.log("불러온 데이터:", data);
        
        let content = "";
        if (data.freeboardContent) {
          try {
            const blocks = JSON.parse(data.freeboardContent);
            content = blocks[0]?.content || "";
            
            const stickerCount = (content.match(/data-sticker/g) || []).length;
            console.log(`스티커 개수: ${stickerCount}`);
            
            content = content.replaceAll(
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

        showAlert({
          type: 'error',
          title: '불러오기 실패',
          message: '게시글을 불러오는데 실패했습니다.',
          onConfirm: () => navigate('/freeboard')
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFreeboard();
  }, [alert, id, navigate, showAlert]);

  const handleSubmit = async ({ title, content, representImage, tags }) => {
    try {
      const stickerCount = (content.match(/data-sticker/g) || []).length;
      console.log(`제출할 스티커 개수: ${stickerCount}`);
      
      const blocks = [
        {
          id: `block-${crypto.randomUUID()}`,
          type: "tiptap",                   
          content: content,                 
          language: null,
          order: 0                  
        }
      ];

      const payload = {
        freeboardTitle: title,
        blocks: blocks,                  
        freeboardRepresentImage: representImage || null,
        tags: tags || []
      };

      console.log("전송 payload:", payload);

      await axiosInstance.put(`/freeboard/${id}`, payload);

      showAlert({
        type: 'success',
        title: '수정 완료',
        message: '게시글이 수정되었습니다.',
        onConfirm: () => navigate(`/freeboard/${id}`)
      });
      navigate(`/freeboard/${id}`);
    } catch (error) {
      console.error("수정 실패:", error);
      console.error("에러 상세:", error.response?.data);
      showAlert({
        type: 'error',
        title: '수정 실패',
        message: '게시글 수정에 실패했습니다.'
      });
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#131313'
      }}>
        <div style={{ fontSize: '1.125rem', color: 'white' }}>로딩 중...</div>
      </div>
    );
  }

  return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#131313' : '#ffffff',
        padding: '2rem 1rem'
      }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <WriteEditor 
          mode="edit"
          initialTitle={initialData?.title}
          initialContent={initialData?.content}
          initialTags={initialData?.tags}
          onSubmit={handleSubmit}
          toolbarType="full"
        />
      </div>
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </div>
  );
};

export default FreeboardEdit;
