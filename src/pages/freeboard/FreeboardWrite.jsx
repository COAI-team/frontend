import {axiosInstance} from "../../server/AxiosConfig";
import {useNavigate} from "react-router-dom";
import WriteEditor from "../../components/editor/WriteEditor";
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";

const FreeboardWrite = () => {
  const {alert, showAlert, closeAlert} = useAlert();
  const navigate = useNavigate();

  const handleSubmit = ({title, content, representImage, tags}) => {

    const blocks = [{
      id: `block-${Date.now()}`,
      type: "tiptap",
      content: content,
      order: 0
    }];

    console.log("📤 전송할 데이터:", {
      freeboardTitle: title,
      blocks: blocks,
      freeboardRepresentImage: representImage || null,
      tags: tags || [],
    });

    axiosInstance
      .post("/freeboard", {
        freeboardTitle: title,
        blocks: blocks,
        freeboardRepresentImage: representImage || null,
        tags: tags || [],
      })
      .then((response) => {
        console.log("응답:", response.data);
        showAlert({
          type: 'success',
          title: '등록 완료',
          message: '게시글이 등록되었습니다.'
        });

        navigate("/freeboard");
      })
      .catch((err) => {
        console.error("등록 실패:", err);
        console.error("에러 상세:", err.response?.data);
      });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#101828',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <WriteEditor
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

export default FreeboardWrite;
