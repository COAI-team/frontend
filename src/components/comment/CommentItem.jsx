import { useState } from 'react';
import { axiosInstance } from '../../server/AxiosConfig';
import CommentForm from './CommentForm';
import { getAuth } from '../../utils/auth/token';

export default function CommentItem({ comment, onCommentUpdated, isReply = false, isDark }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const auth = getAuth();
  const currentUserId = auth?.userId;

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      await axiosInstance.put(`/comment/${comment.commentId}`, {
        content: editContent.trim()
      });

      setIsEditing(false);
      onCommentUpdated();
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`${isReply ? '답글을' : '댓글을'} 삭제하시겠습니까?`)) return;

    try {
      await axiosInstance.delete(`/comment/${comment.commentId}`);
      onCommentUpdated();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert(`${isReply ? '답글' : '댓글'} 삭제에 실패했습니다.`);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const isMyComment = currentUserId != null && comment.userId === currentUserId;

  // 대댓글
  if (isReply) {
    return (
      <div className={`flex gap-3 py-4 ${isDark ? "" : ""}`}>
        <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`} style={{ width: '2rem', height: '2rem', fontSize: '0.875rem' }}>
          {comment.userNickname?.charAt(0)?.toUpperCase() || "?"}
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 text-sm rounded border focus:outline-none ${isDark ? "bg-gray-800 text-gray-100 border-gray-700 focus:border-indigo-500" : "bg-white text-gray-900 border-gray-300 focus:border-indigo-500"}`}
                disabled={isUpdating}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className={`px-3 py-1 text-xs rounded ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  disabled={isUpdating}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating || !editContent.trim()}
                  className={`px-3 py-1 text-xs rounded ${isDark ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50" : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"}`}
                >
                  {isUpdating ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-1">
                <span className={`font-bold text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                  {comment.userNickname}
                </span>
                {comment.isAuthor && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`}>
                    작성자
                  </span>
                )}
              </div>

              <p className={`text-sm leading-relaxed whitespace-pre-wrap mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {comment.content}
              </p>

              <div className="flex items-center gap-3">
                <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {formatDate(comment.createdAt)}
                </span>
                
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className={`text-xs ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`}
                >
                  답글쓰기
                </button>

                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 text-xs ${liked ? (isDark ? "text-red-400" : "text-red-500") : (isDark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500")}`}
                >
                  <span>좋아요 </span>
                  <span>{likeCount}</span>
                </button>

                {isMyComment && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`text-xs ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`}
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className={`text-xs ${isDark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-600"}`}
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 일반 댓글
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem 0' }}>
        <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`} style={{ width: '2rem', height: '2rem', fontSize: '0.875rem' }}>
          {comment.userNickname?.charAt(0)?.toUpperCase() || "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 rounded border focus:outline-none ${isDark ? "bg-gray-800 text-gray-100 border-gray-700 focus:border-indigo-500" : "bg-white text-gray-900 border-gray-300 focus:border-indigo-500"}`}
                style={{ fontSize: '0.875rem' }}
                disabled={isUpdating}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className={`px-4 py-1.5 rounded ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  style={{ fontSize: '0.875rem' }}
                  disabled={isUpdating}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating || !editContent.trim()}
                  className={`px-4 py-1.5 rounded ${isDark ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50" : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"}`}
                  style={{ fontSize: '0.875rem' }}
                >
                  {isUpdating ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '0.25rem' }}>
                <span className={isDark ? "text-gray-100" : "text-gray-900"} style={{ fontSize: '1rem' }}>
                  {comment.userNickname}
                </span>
                {comment.isAuthor && (
                  <span className={`ml-2 px-2 py-0.5 rounded ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`} style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                    작성자
                  </span>
                )}
              </div>

              <p className={`whitespace-pre-wrap ${isDark ? "text-gray-200" : "text-gray-800"}`} style={{ fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                {comment.content}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span className={isDark ? "text-gray-500" : "text-gray-400"} style={{ fontSize: '0.75rem' }}>
                  {formatDate(comment.createdAt)}
                </span>

                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className={isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}
                  style={{ fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  답글쓰기
                </button>

                <button
                  onClick={handleLike}
                  className={liked ? (isDark ? "text-red-400" : "text-red-500") : (isDark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500")}
                  style={{ fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <svg style={{ width: '0.875rem', height: '0.875rem' }} fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{likeCount}</span>
                </button>

                {isMyComment && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}
                      style={{ fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className={isDark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-600"}
                      style={{ fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className={isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}
                  style={{ fontSize: '0.75rem', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <svg 
                    style={{ width: '0.875rem', height: '0.875rem', transition: 'transform 0.2s', transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  답글 {comment.replies.length}개 {showReplies ? '접기' : '보기'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div style={{ marginLeft: '2.75rem', marginBottom: '1rem' }}>
          <CommentForm
            boardId={comment.boardId}
            boardType={comment.boardType}
            parentCommentId={comment.commentId}
            onSuccess={() => {
              setShowReplyForm(false);
              onCommentUpdated();
            }}
            onCancel={() => setShowReplyForm(false)}
            isDark={isDark}
          />
        </div>
      )}

      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: '2.75rem' }}>
          {comment.replies.map((reply, index) => (
            <div key={reply.commentId}>
              <CommentItem
                comment={reply}
                onCommentUpdated={onCommentUpdated}
                isReply={true}
                isDark={isDark}
              />
              {index < comment.replies.length - 1 && (
                <div className={`border-t ${isDark ? "border-gray-800" : "border-gray-100"}`} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}