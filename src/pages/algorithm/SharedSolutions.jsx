import React, { useState, useEffect } from 'react';
import { getSharedSubmissions } from '../../service/algorithm/algorithmApi';
import '../../styles/SharedSolutions.css';

const SharedSolutions = ({ problemId }) => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const pageSize = 20;

  useEffect(() => {
    fetchSolutions(currentPage);
  }, [problemId, currentPage]);

  const fetchSolutions = async (page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSharedSubmissions(problemId, page, pageSize);
      
      // API 응답 구조 확인
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

  const getStatusText = (status) => {
    const statusMap = {
      'AC': '맞았습니다',
      'WA': '틀렸습니다',
      'TLE': '시간초과',
      'MLE': '메모리초과',
      'RE': '런타임에러',
      'CE': '컴파일에러'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'AC': 'status-badge-ac',
      'WA': 'status-badge-wa',
      'TLE': 'status-badge-tle',
      'MLE': 'status-badge-mle',
      'RE': 'status-badge-re'
    };
    return `status-badge ${classMap[status] || 'status-badge-default'}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    
    // 배열 형식인 경우
    if (Array.isArray(dateValue) && dateValue.length >= 6) {
      const [year, month, day, hour, minute, second] = dateValue;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    
    // 문자열인 경우
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
          <h2 className="shared-solutions-title">
            다른 사람의 풀이
          </h2>
          <p className="shared-solutions-count">
            총 {solutions.length}개의 풀이
          </p>
        </div>

        {solutions.length === 0 ? (
          <div className="shared-solutions-empty">
            <p className="shared-solutions-empty-text">아직 공유된 풀이가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="shared-solutions-table-wrapper">
              <table className="shared-solutions-table">
                <thead>
                  <tr>
                    <th>제출 번호</th>
                    <th>결과</th>
                    <th>언어</th>
                    <th>점수</th>
                    <th>메모리 / 시간</th>
                    <th>제출 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {solutions.map((solution) => (
                    <React.Fragment key={solution.submissionId}>
                      {/* 테이블 행 */}
                      <tr onClick={() => toggleExpand(solution.submissionId)}>
                        <td>#{solution.submissionId}</td>
                        <td>
                          <span className={getStatusClass(solution.judgeResult)}>
                            {getStatusText(solution.judgeResult)}
                          </span>
                        </td>
                        <td>{solution.language}</td>
                        <td style={{ fontWeight: 500 }}>
                          {solution.finalScore ? `${solution.finalScore}점` : '-'}
                        </td>
                        <td className="text-secondary">
                          {solution.memoryUsage ? `${Math.round(solution.memoryUsage / 1024)}KB` : '-'} /
                          {solution.executionTime ? ` ${solution.executionTime}ms` : ' -'}
                        </td>
                        <td className="text-secondary">
                          {formatDate(solution.submittedAt)}
                        </td>
                      </tr>

                      {/* 펼쳐지는 상세 영역 */}
                      {expandedId === solution.submissionId && (
                        <tr className="solution-detail-row">
                          <td colSpan="6" className="solution-detail-cell">
                            <SolutionDetail solution={solution} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
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

const SolutionDetail = ({ solution }) => {
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'feedback', 'comments'
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const renderAIFeedback = () => {
    if (!solution.aiFeedback) {
      return <div className="ai-feedback-empty">AI 피드백이 없습니다.</div>;
    }

    return (
      <div className="ai-feedback-content">
        {solution.aiFeedback}
      </div>
    );
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    // TODO: 댓글 등록 API 호출
    console.log('댓글 등록:', newComment);
    setNewComment('');
  };

  const tabs = [
    { id: 'code', label: '제출 코드', icon: '💻' },
    { id: 'feedback', label: 'AI 피드백', icon: '🤖' },
    { id: 'comments', label: `댓글 (${comments.length})`, icon: '💬' }
  ];

  return (
    <div>
      {/* 점수 정보 - 항상 표시 */}
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

      {/* 탭 메뉴 */}
      <div className="solution-tabs-container">
        <div className="solution-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`solution-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="solution-tab-content">
        {/* 코드 탭 */}
        {activeTab === 'code' && (
          <div>
            <pre className="solution-code-block">
              <code>{solution.sourceCode}</code>
            </pre>
          </div>
        )}

        {/* AI 피드백 탭 */}
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
          </div>
        )}

        {/* 댓글 탭 */}
        {activeTab === 'comments' && (
          <div>
            {/* 댓글 목록 */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="comments-empty">
                  첫 댓글을 작성해보세요!
                </div>
              ) : (
                comments.map((comment, index) => (
                  <div key={index} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-username">
                        {comment.userName}
                      </span>
                      <span className="comment-date">
                        {comment.createdAt}
                      </span>
                    </div>
                    <p className="comment-content">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* 댓글 작성 폼 */}
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

export default SharedSolutions;