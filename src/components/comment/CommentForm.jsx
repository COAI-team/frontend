import { useState } from 'react';

export default function CommentForm({ 
  boardId, 
  boardType, 
  parentCommentId = null,
  currentUserId, 
  onSuccess,
  onCancel,
  isDark,
  formId,
}) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isReply = parentCommentId !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert(`${isReply ? '답글' : '댓글'} 내용을 입력해주세요.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:8090/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': currentUserId
        },
        body: JSON.stringify({
          boardId,
          boardType,
          parentCommentId,
          content: content.trim()
        })
      });

      if (response.ok) {
        setContent('');
        onSuccess();
      } else {
        alert(`${isReply ? '답글' : '댓글'} 작성에 실패했습니다.`);
      }
    } catch (error) {
      console.error('작성 실패:', error);
      alert(`${isReply ? '답글' : '댓글'} 작성 중 오류가 발생했습니다.`);
    } finally {
      setSubmitting(false);
    }
  };

  // 대댓글 스타일
  if (isReply) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="답글을 입력하세요"
          rows={3}
          className={`
            w-full px-4 py-3 rounded-lg resize-none transition-all border
            ${isDark 
              ? "bg-gray-800 text-gray-100 border-gray-600 focus:ring-indigo-400" 
              : "bg-white text-gray-900 border-gray-300 focus:ring-indigo-500"
            }
          `}
          disabled={submitting}
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className={`
              px-4 py-1.5 text-sm rounded-lg transition-colors
              ${isDark 
                ? "text-gray-300 hover:bg-gray-700" 
                : "text-gray-700 hover:bg-gray-100"}
            `}
            disabled={submitting}
          >
            취소
          </button>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className={`
              px-4 py-1.5 text-sm rounded-lg transition-colors
              ${isDark 
                ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-700" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300"}
            `}
          >
            {submitting ? '등록 중...' : '답글 등록'}
          </button>
        </div>
      </form>
    );
  }

  // 일반 댓글 스타일 - 새 디자인
  return (
    <form id={formId} onSubmit={handleSubmit} className={`border rounded-lg p-4 ${isDark ? "border-gray-700" : "border-gray-300"}`}>
      {/* 작성자 표시 - 실제 사용자 정보로 변경 필요 */}
      <div className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
        사용자 {currentUserId}
      </div>

      {/* 텍스트 영역 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 남겨보세요"
        rows={1}
        className={`
          w-full px-0 py-1 resize-none transition-all border-0 focus:ring-0 text-sm
          ${isDark 
            ? "bg-transparent text-gray-100 placeholder-gray-500" 
            : "bg-transparent text-gray-900 placeholder-gray-400"
          }
        `}
        disabled={submitting}
        onInput={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
      />

      {/* 하단 바 */}
      <div className="flex items-center justify-end gap-3 mt-2">
        <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          {content.length}/3000
        </span>
        
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className={`
            px-4 py-1.5 text-sm rounded-lg transition-colors
            ${isDark 
              ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-700" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300"}
          `}
        >
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </div>
    </form>
  );
}