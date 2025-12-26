import {useState, useRef, useEffect} from 'react';
import {axiosInstance} from '../../server/AxiosConfig';
import CommentForm from './CommentForm';
import {getAuth} from '../../utils/auth/token';

export default function CommentItem({comment, onCommentUpdated, isReply = false, isDark, currentUserId, onLineClick}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [liked, setLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  const isLikingRef = useRef(false);
  const menuRef = useRef(null);

  const isMyComment = currentUserId != null && comment.userId != null && Number(currentUserId) === Number(comment.userId);

  // liked 상태를 comment.isLiked와 동기화
  useEffect(() => {
    setLiked(comment.isLiked || false);
    setLikeCount(comment.likeCount || 0);
  }, [comment.isLiked, comment.likeCount]);

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

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

  const handleLike = async () => {
    if (isLikingRef.current) return;

    isLikingRef.current = true;

    // UI 즉시 업데이트
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const response = await axiosInstance.post(`/like/comment/${comment.commentId}`);

      // 백엔드 응답 구조 변경: isLiked → liked, likeCount 추가
      const responseData = response.data.data || response.data;
      const serverLiked = responseData.liked !== undefined ? responseData.liked : responseData.isLiked;
      const serverLikeCount = responseData.likeCount;

      // 서버 응답과 다르면 동기화
      if (serverLiked !== undefined) {
        setLiked(serverLiked);
      }
      if (serverLikeCount !== undefined) {
        setLikeCount(serverLikeCount);
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
      // 실패시 롤백
      setLiked(!newLiked);
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
    } finally {
      // 300ms 후 다시 클릭 가능
      setTimeout(() => {
        isLikingRef.current = false;
      }, 300);
    }
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

  const authorBadgeStyle = {
    marginLeft: '0.375rem',
    padding: '0.125rem 0.375rem',
    fontSize: '0.625rem',
    fontWeight: '500',
    borderRadius: '0.25rem',
    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.2)' : '#dbeafe',
    color: isDark ? '#60a5fa' : '#2563eb'
  };

  const actionButtonStyle = {
    fontSize: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: isDark ? '#6b7280' : '#9ca3af'
  };

  // 수정 모드
  if (isEditing) {
    return (
      <div style={{padding: isReply ? '0.75rem 0' : '1rem 0'}}>
        <div style={{
          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          backgroundColor: isDark ? '#1f2937' : '#f9fafb',
          overflow: 'hidden'
        }}>
          {/* 닉네임 */}
          <div style={{
            padding: '0.75rem 1rem 0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isDark ? '#e5e7eb' : '#111827'
          }}>
            {comment.userNickname}
          </div>

          {/* 텍스트 입력 */}
          <div style={{padding: '0 1rem'}}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              disabled={isUpdating}
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
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <button type="button" style={{
                padding: '0.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <button type="button" style={{
                padding: '0.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </button>
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isUpdating}
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
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating || !editContent.trim()}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: isUpdating || !editContent.trim()
                    ? (isDark ? '#4b5563' : '#9ca3af')
                    : (isDark ? '#60a5fa' : '#2563eb'),
                  cursor: isUpdating || !editContent.trim() ? 'default' : 'pointer'
                }}
              >
                {isUpdating ? '수정 중...' : '수정'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        padding: isReply ? '0.75rem 0' : '1rem 0'
      }}>
        {/* 프로필 사진 */}
        <div style={{
          width: isReply ? '1.75rem' : '2.25rem',
          height: isReply ? '1.75rem' : '2.25rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: isReply ? '0.75rem' : '0.875rem',
          fontWeight: '500',
          backgroundColor: isDark ? '#374151' : '#e5e7eb',
          color: isDark ? '#d1d5db' : '#4b5563',
          overflow: 'hidden'
        }}>
          {comment.userImage ? (
            <img 
              src={comment.userImage} 
              alt={comment.userNickname}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            comment.userNickname?.charAt(0)?.toUpperCase() || '?'
          )}
        </div>

        {/* 콘텐츠 */}
        <div style={{flex: 1, minWidth: 0}}>
          {/* 닉네임 & 작성자 뱃지 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.25rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <span style={{
                fontSize: isReply ? '0.8125rem' : '0.875rem',
                fontWeight: '600',
                color: isDark ? '#f3f4f6' : '#111827'
              }}>
                {comment.userNickname}
              </span>
              {comment.isAuthor && (
                <span style={authorBadgeStyle}>내가 쓴</span>
              )}
            </div>

            {/* 더보기 메뉴 */}
            {isMyComment && (
              <div style={{position: 'relative'}} ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    padding: '0.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#6b7280' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>

                {showMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem',
                    minWidth: '100px',
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditing(true);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isDark ? '#e5e7eb' : '#374151',
                        borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = isDark ? '#374151' : '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isDark ? '#fca5a5' : '#dc2626'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = isDark ? '#374151' : '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 댓글 내용 */}
          <CommentContent 
            content={comment.content}
            isReply={isReply}
            isDark={isDark}
            onLineClick={onLineClick}
          />

          {/* 액션 버튼들 */}
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <span style={{
              fontSize: '0.75rem',
              color: isDark ? '#6b7280' : '#9ca3af'
            }}>
              {formatDate(comment.createdAt)}
            </span>

            {/* 대댓글에는 답글쓰기 버튼 숨김 */}
            {!isReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                style={actionButtonStyle}
              >
                답글쓰기
              </button>
            )}

            <button
              onClick={handleLike}
              style={{
                ...actionButtonStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: liked
                  ? (isDark ? '#f87171' : '#ef4444')
                  : (isDark ? '#6b7280' : '#9ca3af')
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
          </div>

          {/* 답글 토글 버튼 */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              style={{
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: isDark ? '#60a5fa' : '#2563eb'
              }}
            >
              <svg
                style={{
                  width: '0.875rem',
                  height: '0.875rem',
                  transition: 'transform 0.2s',
                  transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
              답글 {comment.replies.length}개 {showReplies ? '접기' : '보기'}
            </button>
          )}
        </div>
      </div>

      {/* 답글 작성 폼 */}
      {showReplyForm && (
        <div style={{marginLeft: '3rem', marginBottom: '0.75rem'}}>
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

      {/* 답글 목록 */}
      {!isReply && showReplies && comment.replies && comment.replies.length > 0 && (
        <div style={{marginLeft: '3rem'}}>
          {comment.replies.map((reply, index) => (
            <div key={reply.commentId}>
              <CommentItem
                comment={{...reply, boardId: comment.boardId, boardType: comment.boardType}}
                onCommentUpdated={onCommentUpdated}
                isReply={true}
                isDark={isDark}
              />
              {index < comment.replies.length - 1 && (
                <div style={{borderTop: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}`}}/>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 댓글 내용에서 라인 참조 처리
function CommentContent({ content, isReply, isDark, onLineClick }) {
  const [processedContent, setProcessedContent] = useState([]); // 빈 배열로 초기화

  useEffect(() => {
    const regex = /\[L(\d+)(?:-(\d+))?\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // 일반 텍스트
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      // 라인 참조
      const startLine = parseInt(match[1]);
      const endLine = match[2] ? parseInt(match[2]) : startLine;
      parts.push({
        type: 'line',
        content: match[0],
        startLine,
        endLine
      });

      lastIndex = regex.lastIndex;
    }

    // 남은 텍스트
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    // 라인 참조가 없으면 전체를 텍스트로
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: content
      });
    }

    setProcessedContent(parts);
  }, [content]);

  return (
    <p style={{
      fontSize: isReply ? '0.8125rem' : '0.875rem',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
      marginBottom: '0.5rem',
      color: isDark ? '#e5e7eb' : '#374151'
    }}>
      {processedContent.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        }

        return (
          <button
            key={index}
            onClick={() => onLineClick && onLineClick(part.startLine, part.endLine)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.125rem 0.375rem',
              margin: '0 0.125rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              cursor: onLineClick ? 'pointer' : 'default',
              transition: 'background-color 0.2s',
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(224, 231, 255, 1)',
              color: isDark ? '#a5b4fc' : '#4f46e5',
              border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
              opacity: onLineClick ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (onLineClick) {
                e.target.style.backgroundColor = isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(199, 210, 254, 1)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(224, 231, 255, 1)';
            }}
          >
            {part.content}
          </button>
        );
      })}
    </p>
  );
}