import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { axiosInstance } from '../../server/AxiosConfig';

export default function CommentSection({ boardId, boardType, isDark }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // 댓글 목록 조회 (axiosInstance 사용)
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/comment', {
        params: {
          boardId,
          boardType
        }
      });

      setComments(response.data.data);
    } catch (error) {
      console.error('댓글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [boardId, boardType]);

  // 댓글 작성 성공 시 목록 다시 불러오기
  const handleCommentCreated = () => {
    fetchComments();
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4">

      {/* 댓글 작성 폼 */}
      <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-lg shadow-sm p-6 mb-6`}>
        <CommentForm
          boardId={boardId}
          boardType={boardType}
          onSuccess={handleCommentCreated}
          isDark={isDark}
          formId="comment-form"
        />
      </div>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div
            className={`
              animate-spin rounded-full h-8 w-8 border-b-2 
              ${isDark ? "border-indigo-400" : "border-indigo-600"}
            `}
          ></div>
        </div>
      ) : (
        <CommentList
          comments={comments}
          onCommentUpdated={fetchComments}
          isDark={isDark}
        />
      )}
    </div>
  );
}