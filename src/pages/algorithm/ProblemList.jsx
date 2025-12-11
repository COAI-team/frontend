import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProblems, DIFFICULTY_OPTIONS, PAGE_SIZE_OPTIONS } from '../../service/algorithm/algorithmApi';
import TopicSelector from '../../components/algorithm/common/TopicSelector';

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'mostSolved', label: '푼 사람 많은 순' },
  { value: 'highAccuracy', label: '정답률 높은 순' },
  { value: 'lowAccuracy', label: '정답률 낮은 순' },
];

// 풀이 상태 옵션
const SOLVED_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'solved', label: '푼 문제' },
  { value: 'unsolved', label: '안 푼 문제' },
];

const ProblemList = () => {
  // ===== 상태 관리 =====
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 필터 및 페이징 상태
  const [filters, setFilters] = useState({
    difficulty: '',
    topic: '',
    keyword: '',
    solved: '',
    sort: 'latest',
    page: 1,
    size: 10
  });

  // 페이지네이션 정보
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrevious: false
  });

  const navigate = useNavigate();

  // ===== 데이터 로딩 =====
  const loadProblems = useCallback(async (filterParams = filters) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getProblems(filterParams);

      if (result.error) {
        setError(result.message || '문제 목록을 불러오는데 실패했습니다.');
        return;
      }

      if (result.data) {
        setProblems(result.data.problems || []);
        setPagination({
          totalCount: result.data.totalCount || 0,
          totalPages: result.data.totalPages || 0,
          currentPage: result.data.currentPage || 1,
          hasNext: result.data.hasNext || false,
          hasPrevious: result.data.hasPrevious || false
        });
      }
    } catch (err) {
      console.error('문제 목록 로딩 에러:', err);
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // ===== 이벤트 핸들러 =====
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadProblems(newFilters);
  };

  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadProblems(newFilters);
  };

  const handleProblemClick = (problemId) => {
    navigate(`/algorithm/problems/${problemId}`);
  };

  // 난이도 색상 반환
  const getDifficultyColor = (difficulty) => {
    const colors = {
      BRONZE: 'text-amber-700 dark:text-amber-600',
      SILVER: 'text-gray-600 dark:text-gray-400',
      GOLD: 'text-yellow-600 dark:text-yellow-500',
      PLATINUM: 'text-cyan-600 dark:text-cyan-500'
    };
    return colors[difficulty] || 'text-gray-500 dark:text-gray-400';
  };

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">알고리즘 문제</h1>
          <p className="text-gray-600 dark:text-gray-400">다양한 알고리즘 문제를 만들고 풀어보세요</p>
        </div>

        {/* 주제 필터 탭 */}
        <div className="mb-4">
          <TopicSelector 
            selectedTopic={filters.topic}
            onTopicSelect={(topic) => handleFilterChange('topic', topic)}
          />
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="문제 검색..."
            value={filters.keyword}
            onChange={(e) => {
              const newFilters = { ...filters, keyword: e.target.value, page: 1 };
              setFilters(newFilters);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                loadProblems(filters);
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.solved}
            onChange={(e) => handleFilterChange('solved', e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SOLVED_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DIFFICULTY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.size}
            onChange={(e) => handleFilterChange('size', parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Link
            to="/algorithm/problems/generate"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            🤖 AI 생성
          </Link>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">문제 목록을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-6">
            <p className="font-medium">오류가 발생했습니다</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* 문제 목록 테이블 */}
        {!loading && !error && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                      상태
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                      번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                      난이도
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                      유형
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                      제출수
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                      정답률
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {problems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    problems.map((problem, index) => (
                      <tr
                        key={problem.algoProblemId}
                        onClick={() => handleProblemClick(problem.algoProblemId)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-3 text-center">
                          {problem.isSolved ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30">
                              <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          {(pagination.currentPage - 1) * filters.size + index + 1}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-white truncate">
                          {problem.algoProblemTitle}
                        </td>
                        <td className={`px-3 py-3 text-center text-sm font-medium ${getDifficultyColor(problem.algoProblemDifficulty)}`}>
                          {problem.algoProblemDifficulty}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          -
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          {problem.solveCount || 0}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          -
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    이전
                  </button>

                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      pagination.totalPages - 4,
                      Math.max(1, pagination.currentPage - 2)
                    )) + i;

                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-md border transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProblemList;