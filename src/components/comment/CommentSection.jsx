import { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { axiosInstance } from '../../server/AxiosConfig';

export default function CommentSection({ boardId, boardType, isDark, onCommentCountChange, currentUserId, onLineClick }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const buildCommentTree = (flatComments) => {
    const commentMap = new Map();
    const rootComments = [];

    flatComments.forEach(comment => {
      commentMap.set(comment.commentId, { ...comment, replies: [] });
    });

    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.commentId);
      
      if (comment.parentCommentId === null) {
        rootComments.push(commentWithReplies);
      } else {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      }
    });

    return rootComments;
  };

  const fetchComments = async (isLoadMore = false) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/comment', {
        params: {
          boardId,
          boardType,
          cursor: isLoadMore ? cursor : null,
          size: 5
        }
      });

      const { content, nextCursor, hasNext: hasNextPage, totalElements } = response.data;
      const treeComments = buildCommentTree(content);

      if (isLoadMore) {
        setComments(prev => [...prev, ...treeComments]);
      } else {
        setComments(treeComments);
      }

      setCursor(nextCursor);
      setHasNext(hasNextPage);

      if (totalElements !== undefined) {
        setTotalCount(totalElements);
        if (onCommentCountChange) {
          onCommentCountChange(totalElements);
        }
      }

    } catch (error) {
      console.error('댓글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [boardId, boardType]);

  return (
    <div style={{ width: '100%' }}>
      {/* 댓글 작성 폼 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <CommentForm
          boardId={boardId}
          boardType={boardType}
          onSuccess={() => fetchComments()}
          isDark={isDark}
        />
      </div>

      {/* 댓글 목록 */}
      {loading && comments.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '3rem 0' 
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: `2px solid ${isDark ? '#4f46e5' : '#4f46e5'}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <>
          <CommentList
            comments={comments}
            onCommentUpdated={fetchComments}
            isDark={isDark}
            currentUserId={currentUserId}
            onLineClick={onLineClick}
          />

          {hasNext && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => fetchComments(true)}
                disabled={loading}
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  backgroundColor: 'transparent',
                  color: isDark ? '#e5e7eb' : '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {loading ? '로딩 중...' : '댓글 더보기'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}