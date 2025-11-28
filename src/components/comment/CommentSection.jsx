import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

export default function CommentSection({ boardId, boardType, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

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
    <div className="w-full max-w-4xl mx-auto mt-8 mb-16">
      {/* 댓글 작성 폼 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          댓글 {comments.length}개
        </h3>
        <CommentForm
          boardId={boardId}
          boardType={boardType}
          currentUserId={currentUserId}
          onSuccess={handleCommentCreated}
        />
      </div>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onCommentUpdated={fetchComments}
        />
      )}
    </div>
  );
}