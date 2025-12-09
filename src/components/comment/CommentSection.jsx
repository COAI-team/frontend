import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { axiosInstance } from '../../server/AxiosConfig';

export default function CommentSection({ boardId, boardType, isDark }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  // 댓글 목록 조회
  const fetchComments = async (isLoadMore = false) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/comment', {
        params: {
          boardId,
          boardType,
          cursor: isLoadMore ? cursor : null,
          size: 20
        }
      });

      const { content, nextCursor, hasNext: hasNextPage } = response.data;

      if (isLoadMore) {
        setComments(prev => [...prev, ...content]);
      } else {
        setComments(content);
      }

      setCursor(nextCursor);
      setHasNext(hasNextPage);

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

  // 더보기 버튼
  const handleLoadMore = () => {
    fetchComments(true);
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
      {loading && comments.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div
            className={`
              animate-spin rounded-full h-8 w-8 border-b-2 
              ${isDark ? "border-indigo-400" : "border-indigo-600"}
            `}
          ></div>
        </div>
      ) : (
        <>
          <CommentList
            comments={comments}
            onCommentUpdated={fetchComments}
            isDark={isDark}
          />

          {/* 더보기 버튼 */}
          {hasNext && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-colors
                  ${isDark 
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
                  ${loading ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {loading ? "로딩 중..." : "댓글 더보기"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}