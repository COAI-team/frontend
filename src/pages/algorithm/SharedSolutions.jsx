import React, { useState, useEffect } from 'react';
import { 
  getSharedSubmissions, 
  toggleLike as toggleSubmissionLike, 
  getComments as getSubmissionComments, 
  createComment as createSubmissionComment, 
  deleteComment as deleteSubmissionComment 
} from '../../service/algorithm/AlgorithmSocialApi';

import '../../styles/SharedSolutions.css';
import { Code2, Bot, MessageSquare } from 'lucide-react';

const SharedSolutions = ({ problemId }) => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const pageSize = 20;

  useEffect(() => {
    fetchSolutions(currentPage);
  }, [problemId, currentPage, sortBy, selectedLanguage]);

  const fetchSolutions = async (page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSharedSubmissions(problemId, page, pageSize);
      
      console.log('API 응답:', response);
      
      if (response.error) {
        throw new Error(response.message || '공유된 풀이를 불러오는데 실패했습니다.');
      }
      
      const pageData = response.data || response;
      
      setSolutions(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      
    } catch (err) {
      console.error('공유 풀이 조회 실패:', err);
      setError(err.message || '공유된 풀이를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (submissionId) => {
    setExpandedId(expandedId === submissionId ? null : submissionId);
  };

  const handleLike = async (submissionId) => {
    try {
      const response = await toggleSubmissionLike(submissionId);
      
      if (response.error) {
        console.error('좋아요 처리 실패:', response.message);
        return;
      }
      
      // solutions 상태 업데이트
      setSolutions(prevSolutions =>
        prevSolutions.map(solution =>
          solution.submissionId === submissionId
            ? {
                ...solution,
                isLiked: response.data.liked,
                likeCount: response.data.likeCount
              }
            : solution
        )
      );
    } catch (err) {
      console.error('좋아요 처리 중 오류:', err);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    
    if (Array.isArray(dateValue) && dateValue.length >= 6) {
      const [year, month, day, hour, minute, second] = dateValue;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    
    if (typeof dateValue === 'string') {
      try {
        const date = new Date(dateValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
      } catch (e) {
        return dateValue;
      }
    }
    
    return '-';
  };

  const availableLanguages = [...new Set(solutions.map(s => s.language))].filter(Boolean);

  if (loading && currentPage === 1) {
    return (
      <div className="shared-solutions-container">
        <div className="shared-solutions-content">
          <div className="shared-solutions-loading">
            <div className="shared-solutions-loading-spinner"></div>
            <p className="shared-solutions-loading-text">풀이를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-solutions-container">
        <div className="shared-solutions-content">
          <div className="shared-solutions-error">
            <p className="shared-solutions-error-text">⚠️ {error}</p>
            <button
              onClick={() => fetchSolutions(currentPage)}
              className="shared-solutions-retry-button"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-solutions-container">
      <div className="shared-solutions-content">
        <div className="shared-solutions-header">
          <div className="header-left">
            <h2 className="shared-solutions-title">
              다른 사람의 풀이
            </h2>
            <p className="shared-solutions-count">
              총 {solutions.length}개의 풀이
            </p>
          </div>
          
          <div className="header-filters">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select-inline"
            >
              <option value="latest">최신순</option>
              <option value="likes">좋아요순</option>
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select-inline"
            >
              <option value="">전체 언어</option>
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {solutions.length === 0 ? (
          <div className="shared-solutions-empty">
            <p className="shared-solutions-empty-text">아직 공유된 풀이가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="shared-solutions-table-wrapper">
              <table className="shared-solutions-table">
                <colgroup>
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '160px' }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>제출 번호</th>
                    <th>작성자</th>
                    <th>언어</th>
                    <th>점수</th>
                    <th>좋아요</th>
                    <th>제출 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {solutions.map((solution) => (
                    <React.Fragment key={solution.submissionId}>
                      <tr onClick={() => toggleExpand(solution.submissionId)}>
                        <td>#{solution.submissionId}</td>
                        <td style={{ fontWeight: 500 }}>
                          {solution.userName || solution.userNickname || solution.nickname || '익명'}
                        </td>
                        <td>{solution.language || solution.languageName || '-'}</td>
                        <td style={{ fontWeight: 500 }}>
                          {solution.finalScore ? `${solution.finalScore}점` : '-'}
                        </td>
                        <td>
                          <span className="like-count-display">
                            <svg 
                              width="16" 
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                              />
                            </svg>
                            <span>{solution.likeCount || 0}</span>
                          </span>
                        </td>
                        <td className="text-secondary">
                          {formatDate(solution.submittedAt)}
                        </td>
                      </tr>

                      {expandedId === solution.submissionId && (
                        <tr className="solution-detail-row">
                          <td colSpan="6" className="solution-detail-cell">
                            <SolutionDetail 
                              solution={solution} 
                              onLike={() => handleLike(solution.submissionId)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  이전
                </button>
                
                <span className="pagination-info">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const SolutionDetail = ({ solution, onLike }) => {
  const [activeTab, setActiveTab] = useState('code');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // 댓글 불러오기
  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await getSubmissionComments(solution.submissionId);
      
      if (response.error) {
        console.error('댓글 조회 실패:', response.message);
        return;
      }
      
      setComments(response.data?.content || []);
    } catch (err) {
      console.error('댓글 조회 중 오류:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      const response = await createSubmissionComment(solution.submissionId, newComment);
      
      if (response.error) {
        console.error('댓글 작성 실패:', response.message);
        return;
      }
      
      setNewComment('');
      fetchComments(); // 댓글 목록 새로고침
    } catch (err) {
      console.error('댓글 작성 중 오류:', err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      const response = await deleteSubmissionComment(commentId);
      
      if (response.error) {
        console.error('댓글 삭제 실패:', response.message);
        return;
      }
      
      fetchComments(); // 댓글 목록 새로고침
    } catch (err) {
      console.error('댓글 삭제 중 오류:', err);
    }
  };

  const renderAIFeedback = () => {
    if (!solution.aiFeedback) {
      return <div className="ai-feedback-empty">AI 피드백이 없습니다.</div>;
    }

    return (
      <div className="ai-feedback-content">
        {stripMarkdown(solution.aiFeedback)}
      </div>
    );
  };

  const stripMarkdown = (text) => {
    if (!text) return '';

    return text
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^-+\s*/gm, '')
      .trim();
  };

  const tabs = [
    { id: 'code', label: '제출 코드', icon: Code2 },
    { id: 'feedback', label: 'AI 피드백', icon: Bot },
    { id: 'comments', label: `댓글 (${comments.length})`, icon: MessageSquare }
  ];

  return (
    <div>
      <div className="score-grid">
        <div className="score-card">
          <div className="score-card-label">최종 점수</div>
          <div className="score-card-value">
            {solution.finalScore || 0}
          </div>
        </div>
        <div className="score-card">
          <div className="score-card-label">채점 점수</div>
          <div className="score-card-value">
            {solution.scoreBreakdown?.judgeScore || 0}
          </div>
        </div>
        <div className="score-card">
          <div className="score-card-label">AI 점수</div>
          <div className="score-card-value">
            {solution.aiScore || 0}
          </div>
        </div>
        <div className="score-card">
          <div className="score-card-label">시간 효율</div>
          <div className="score-card-value">
            {solution.timeEfficiencyScore || 0}
          </div>
        </div>
      </div>

      <div className="solution-tabs-container">
        <div className="solution-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`solution-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="solution-tab-content">
        {activeTab === 'code' && (
          <div>
            <pre className="solution-code-block">
              <code>{solution.sourceCode}</code>
            </pre>
            
            <div className="solution-like-section">
              <button
                onClick={onLike}
                className={`solution-like-button ${solution.isLiked ? 'liked' : ''}`}
              >
                <svg 
                  className="like-icon"
                  viewBox="0 0 24 24" 
                  fill={solution.isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="like-text">
                  {solution.isLiked ? '좋아요 취소' : '좋아요'}
                </span>
                <span className="like-count">{solution.likeCount || 0}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            {solution.aiFeedback ? (
              <div className="ai-feedback-container">
                {renderAIFeedback()}
              </div>
            ) : (
              <div className="ai-feedback-empty">
                AI 피드백이 아직 생성되지 않았습니다.
              </div>
            )}
            
            <div className="solution-like-section">
              <button
                onClick={onLike}
                className={`solution-like-button ${solution.isLiked ? 'liked' : ''}`}
              >
                <svg 
                  className="like-icon"
                  viewBox="0 0 24 24" 
                  fill={solution.isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="like-text">
                  {solution.isLiked ? '좋아요 취소' : '좋아요'}
                </span>
                <span className="like-count">{solution.likeCount || 0}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            <div className="comments-list">
              {loadingComments ? (
                <div className="comments-loading">댓글을 불러오는 중...</div>
              ) : comments.length === 0 ? (
                <div className="comments-empty">
                  첫 댓글을 작성해보세요!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.commentId} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-username">
                        {comment.userNickname || '익명'}
                      </span>
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.isAuthor && (
                        <button
                          onClick={() => handleCommentDelete(comment.commentId)}
                          className="comment-delete-button"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="comment-content">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="comment-input"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="comment-submit-button"
              >
                등록
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// formatDate 함수를 컴포넌트 외부로 이동
const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  
  if (Array.isArray(dateValue) && dateValue.length >= 6) {
    const [year, month, day, hour, minute] = dateValue;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  
  if (typeof dateValue === 'string') {
    try {
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    } catch (e) {
      return dateValue;
    }
  }
  
  return '-';
};

export default SharedSolutions;