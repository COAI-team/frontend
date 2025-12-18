import React, {useState, useRef, useEffect} from 'react';
import {axiosInstance} from '../../server/AxiosConfig';
import {getAuth} from '../../utils/auth/token';
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";

export default function CommentForm({
                                      boardId,
                                      boardType,
                                      parentCommentId = null,
                                      onSuccess,
                                      onCancel,
                                      isDark,
                                    }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const {alert, showAlert, closeAlert} = useAlert();

  const isReply = parentCommentId !== null;
  const auth = getAuth();
  const userNickname = auth?.user?.nickname || '로그인 후';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      showAlert({
        type: "warning",
        title: "입력 필요",
        message: `${isReply ? "답글" : "댓글"} 내용을 입력해주세요.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/comment', {
        boardId,
        boardType,
        parentCommentId,
        content: content.trim()
      });

      setContent('');
      onSuccess();
    } catch (error) {
      console.error('작성 실패:', error);
      showAlert({
        type: "error",
        title: "작성 실패",
        message: `${isReply ? "답글" : "댓글"} 작성에 실패했습니다.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextareaInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          backgroundColor: isDark ? '#1f2937' : '#f9fafb',
          overflow: 'hidden'
        }}
      >
        {/* 닉네임 */}
        <div style={{
          padding: '0.75rem 1rem 0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#e5e7eb' : '#111827'
        }}>
          {userNickname}
        </div>

        {/* 텍스트 입력 */}
        <div style={{padding: '0 1rem'}}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInput={handleTextareaInput}
          placeholder={isReply ? '답글을 남겨보세요' : '댓글을 남겨보세요'}
          rows={2}
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0',
            border: 'none',
            backgroundColor: 'transparent',
            color: isDark ? '#f3f4f6' : '#111827',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none'
          }}
        />
        </div>

        {/* 하단 액션 바 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem 0.75rem'
        }}>
          {/* 왼쪽: 이미지, 이모티콘 버튼 */}
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <button
              type="button"
              style={{
                padding: '0.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#9ca3af' : '#6b7280',
                display: 'flex',
                alignItems: 'center'
              }}
              title="이미지 첨부"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <button
              type="button"
              style={{
                padding: '0.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#9ca3af' : '#6b7280',
                display: 'flex',
                alignItems: 'center'
              }}
              title="이모티콘"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
          </div>

          {/* 오른쪽: 취소, 등록 버튼 */}
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            {isReply && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8125rem',
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: '500',
                borderRadius: '0.25rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: submitting || !content.trim()
                  ? (isDark ? '#4b5563' : '#9ca3af')
                  : (isDark ? '#60a5fa' : '#2563eb'),
                cursor: submitting || !content.trim() ? 'default' : 'pointer'
              }}
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      </form>
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </>
  );
}
