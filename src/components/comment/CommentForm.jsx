import { useState } from 'react';

export default function CommentForm({ 
  boardId, 
  boardType, 
  parentCommentId = null,  // null이면 댓글, 있으면 대댓글
  currentUserId, 
  onSuccess,
  onCancel  // 대댓글일 때만 사용
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
      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="답글을 입력하세요"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          disabled={submitting}
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
        disabled={submitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </div>
    </form>
  );
}