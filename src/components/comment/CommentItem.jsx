import { useState } from 'react';
import CommentForm from './CommentForm';

export default function CommentItem({ comment, currentUserId, onCommentUpdated, isReply = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 수정
  const handleUpdate = async () => {
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:8090/comments/${comment.commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'userId': currentUserId
        },
        body: JSON.stringify({
          content: editContent.trim()
        })
      });

      if (response.ok) {
        setIsEditing(false);
        onCommentUpdated();
      } else {
        alert('댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 수정 실패:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!confirm(`${isReply ? '답글을' : '댓글을'} 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`http://localhost:8090/comments/${comment.commentId}`, {
        method: 'DELETE',
        headers: {
          'userId': currentUserId
        }
      });

      if (response.ok) {
        onCommentUpdated();
      } else {
        alert(`${isReply ? '답글' : '댓글'} 삭제에 실패했습니다.`);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // 시간 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isMyComment = comment.userId === currentUserId;

  // 대댓글 스타일
  if (isReply) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xs">
                {comment.userNickname?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 text-sm">
                  {comment.userNickname}
                </span>
                {comment.isAuthor && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                    작성자
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
            </div>
          </div>

          {isMyComment && !isEditing && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-600 hover:text-indigo-600 transition-colors"
              >
                수정
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleDelete}
                className="text-xs text-gray-600 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={isUpdating}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdating}
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating || !editContent.trim()}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
              >
                {isUpdating ? '수정 중...' : '수정'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed pl-11">
            {comment.content}
          </p>
        )}
      </div>
    );
  }

  // 일반 댓글 스타일
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 댓글 본문 */}
      <div className="p-6">
        {/* 작성자 정보 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {comment.userNickname?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {comment.userNickname}
                </span>
                {comment.isAuthor && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                    작성자
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
            </div>
          </div>

          {/* 수정/삭제 버튼 */}
          {isMyComment && !isEditing && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                수정
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleDelete}
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 댓글 내용 */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={isUpdating}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdating}
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating || !editContent.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
              >
                {isUpdating ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>

            {/* 답글 버튼 */}
            <div className="mt-4">
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                💬 답글 {comment.replies?.length > 0 && `${comment.replies.length}개`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 답글 작성 폼 */}
      {showReplyForm && (
        <div className="px-6 pb-4">
          <CommentForm
            boardId={comment.boardId}
            boardType={comment.boardType}
            parentCommentId={comment.commentId}
            currentUserId={currentUserId}
            onSuccess={() => {
              setShowReplyForm(false);
              onCommentUpdated();
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200">
          {comment.replies.map((reply) => (
            <div key={reply.commentId} className="p-6 border-b border-gray-200 last:border-b-0">
              <CommentItem
                comment={reply}
                currentUserId={currentUserId}
                onCommentUpdated={onCommentUpdated}
                isReply={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}