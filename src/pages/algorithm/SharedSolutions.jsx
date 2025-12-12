import React, { useState, useEffect } from 'react';
import { getSharedSubmissions } from '../../service/algorithm/algorithmApi';

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'AC':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'WA':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'TLE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MLE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'RE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border border-t-0 p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">풀이를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border border-t-0 p-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <button
            onClick={() => fetchSolutions(currentPage)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border border-t-0">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            다른 사람의 풀이
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            총 {solutions.length}개의 풀이
          </p>
        </div>

        {solutions.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            아직 공유된 풀이가 없습니다.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      제출 번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      결과
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      언어
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      점수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      메모리 / 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      제출 일시
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {solutions.map((solution) => (
                    <React.Fragment key={solution.submissionId}>
                      {/* 테이블 행 */}
                      <tr
                        onClick={() => toggleExpand(solution.submissionId)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          #{solution.submissionId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(solution.judgeResult)}`}>
                            {getStatusText(solution.judgeResult)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {solution.language}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {solution.finalScore ? `${solution.finalScore}점` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {solution.memoryUsage ? `${Math.round(solution.memoryUsage / 1024)}KB` : '-'} /
                          {solution.executionTime ? ` ${solution.executionTime}ms` : ' -'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(solution.submittedAt)}
                        </td>
                      </tr>

                      {/* 펼쳐지는 상세 영역 */}
                      {expandedId === solution.submissionId && (
                        <tr>
                          <td colSpan="6" className="px-6 py-6 bg-gray-50 dark:bg-gray-900">
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
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  이전
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
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
      return <div className="text-gray-500 dark:text-gray-400">AI 피드백이 없습니다.</div>;
    }

    return (
      <div className="prose dark:prose-invert max-w-none text-sm">
        <div className="whitespace-pre-wrap">{solution.aiFeedback}</div>
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
    <div className="space-y-4">
      {/* 점수 정보 - 항상 표시 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">최종 점수</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {solution.finalScore || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">채점 점수</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {solution.scoreBreakdown?.judgeScore || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI 점수</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {solution.aiScore || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">시간 효율</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {solution.timeEfficiencyScore || 0}
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="py-4">
        {/* 코드 탭 */}
        {activeTab === 'code' && (
          <div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{solution.sourceCode}</code>
            </pre>
          </div>
        )}

        {/* AI 피드백 탭 */}
        {activeTab === 'feedback' && (
          <div>
            {solution.aiFeedback ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                {renderAIFeedback()}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                AI 피드백이 아직 생성되지 않았습니다.
              </div>
            )}
          </div>
        )}

        {/* 댓글 탭 */}
        {activeTab === 'comments' && (
          <div>
            {/* 댓글 목록 */}
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  첫 댓글을 작성해보세요!
                </div>
              ) : (
                comments.map((comment, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {comment.createdAt}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* 댓글 작성 폼 */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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