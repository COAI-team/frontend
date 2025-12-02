import { useState } from 'react';

export default function CommentForm({ 
  boardId, 
  boardType, 
  parentCommentId = null,  // null이면 댓글, 있으면 대댓글
  currentUserId, 
  onSuccess,
  onCancel,                // 대댓글일 때만 사용
  isDark,
}) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isReply = parentCommentId !== null;  // 대댓글인지 확인

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

  // 일반 댓글 스타일
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요"
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors
            ${isDark
              ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-700"
              : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300"
            }
          `}
        >
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </div>
    </form>
  );
}