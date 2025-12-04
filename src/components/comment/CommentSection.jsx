import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

export default function CommentSection({ boardId, boardType, currentUserId, isDark }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // 댓글 목록 조회
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8090/comments?boardId=${boardId}&boardType=${boardType}`,
        {
          headers: {
            'userId': currentUserId
          }
        }
      );
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('댓글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [boardId, boardType]);

  // 댓글 작성 성공 시 새로고침
  const handleCommentCreated = () => {
    fetchComments();
  };

  

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 댓글 개수 헤더와 등록 버튼을 한 줄로 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
          댓글 {comments.length}개
        </h3>
        
        <button
          type="submit"
          form="comment-form"
          disabled={loading}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors
            ${isDark
              ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-700"
              : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300"
            }
          `}
        >
          댓글 등록
        </button>
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
          currentUserId={currentUserId}
          onCommentUpdated={fetchComments}
          isDark={isDark}
        />
      )}

      {/* 댓글 작성 폼 */}
      <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-lg shadow-sm p-6 mt-6`}>
        <CommentForm
          boardId={boardId}
          boardType={boardType}
          currentUserId={currentUserId}
          onSuccess={handleCommentCreated}
          isDark={isDark}
          formId="comment-form"
        />
      </div>
    </div>
  );
}