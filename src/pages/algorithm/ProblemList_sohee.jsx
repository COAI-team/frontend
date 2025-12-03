// 소희님 문제 목록 페이지 경로 따로 빼셔서 해주시면 감사할 것 같아요
// 테스트 하는데 경로가 계속 바뀌어 헷갈립니다..ㅎ 
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getProblems,
  DIFFICULTY_OPTIONS,
  SOURCE_OPTIONS,
  PAGE_SIZE_OPTIONS
} from '../../service/algorithm/AlgorithmApi';

import TopicSelector from '../../components/algorithm/common/TopicSelector';

// 언어 옵션
const LANGUAGE_OPTIONS = [
  { value: '', label: '전체 언어' },
  { value: 'C', label: 'C' },
  { value: 'C++', label: 'C++' },
  { value: 'C#', label: 'C#' },
  { value: 'Go', label: 'Go' },
  { value: 'Java', label: 'Java' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Kotlin', label: 'Kotlin' },
  { value: 'Python', label: 'Python' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Swift', label: 'Swift' },
];

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'accuracy', label: '정답률순' },
  { value: 'popular', label: '인기순' }
];

// 난이도 색상
const DIFFICULTY_COLORS = {
  'BRONZE': { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10' },
  'SILVER': { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  'GOLD': { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
  'PLATINUM': { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/10' },
};

const ProblemList = () => {
  const [activeTab, setActiveTab] = useState('AI_GENERATED');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statistics, setStatistics] = useState({
    totalProblems: 0,
    solvedProblems: 0,
    averageAccuracy: 0,
    totalAttempts: 0
  });

  const [filters, setFilters] = useState({
    difficulty: '',
    source: 'AI_GENERATED',
    language: '',
    status: '',
    keyword: '',
    topic: '',
    sortBy: 'latest',
    page: 1,
    size: 20
  });

  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrevious: false
  });

  const navigate = useNavigate();

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

  const loadStatistics = useCallback(async () => {
    try {
      setStatistics({
        totalProblems: 365,
        solvedProblems: 42,
        averageAccuracy: 42.8,
        totalAttempts: 448029
      });
    } catch (err) {
      console.error('통계 로딩 에러:', err);
    }
  }, []);

  useEffect(() => {
    loadProblems();
    loadStatistics();
  }, [loadProblems, loadStatistics]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newFilters = { ...filters, source: tab, page: 1 };
    setFilters(newFilters);
    loadProblems(newFilters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadProblems(newFilters);
  };

  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadProblems(newFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProblemClick = (problemId) => {
    navigate(`/algorithm/problems/${problemId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Problems</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pagination.totalCount.toLocaleString()} 개의 문제
          </p>
        </div>

        {/* 탭 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'AI_GENERATED', label: 'AI 생성', icon: '🤖' },
              { key: 'BOJ', label: '백준', icon: '🏛️' },
              { key: 'PROGRAMMERS', label: '프로그래머스', icon: '💻' },
              { key: 'CUSTOM', label: '커스텀', icon: '✏️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === tab.key
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            ))}
          </div>

          {/* 주제 필터 (TopicSelector) */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <TopicSelector
              selectedTopic={filters.topic}
              onTopicSelect={(topicValue) => handleFilterChange('topic', topicValue)}
            />
          </div>

          {/* 필터 바 */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-3">
            {/* 검색 */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="문제 검색..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && loadProblems()}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                         rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                         text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* 상태 */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                       rounded-lg text-sm text-gray-900 dark:text-white cursor-pointer"
            >
              <option value="">상태</option>
              <option value="solved">풀었음</option>
              <option value="unsolved">안풀음</option>
            </select>

            {/* 난이도 */}
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                       rounded-lg text-sm text-gray-900 dark:text-white cursor-pointer"
            >
              {DIFFICULTY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* 언어 */}
            <select
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                       rounded-lg text-sm text-gray-900 dark:text-white cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* 정렬 */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                       rounded-lg text-sm text-gray-900 dark:text-white cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="flex-1"></div>

            {/* AI 생성 버튼 */}
            <Link
              to="/algorithm/problems/generate"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
                       text-white rounded-lg text-sm font-medium transition-colors"
            >
              🤖 AI 생성
            </Link>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">문제가 없습니다</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    제목
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">
                    언어
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">
                    난이도
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                    유형
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">
                    정답률
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24">
                    푼 사람
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {problems.map((problem) => (
                  <tr
                    key={problem.algoProblemId}
                    onClick={() => handleProblemClick(problem.algoProblemId)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    {/* 상태 */}
                    <td className="px-4 py-3">
                      {problem.solved ? (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                      )}
                    </td>

                    {/* 제목 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                          {problem.algoProblemId}.
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                          {problem.algoProblemTitle}
                        </span>
                      </div>
                    </td>

                    {/* 언어 */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {problem.language || '-'}
                      </span>
                    </td>

                    {/* 난이도 */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${DIFFICULTY_COLORS[problem.algoProblemDifficulty]?.text || 'text-gray-600 dark:text-gray-400'
                        }`}>
                        {problem.algoProblemDifficulty}
                      </span>
                    </td>

                    {/* 유형 (임시) */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        -
                      </span>
                    </td>

                    {/* 정답률 */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {problem.accuracy ? `${problem.accuracy.toFixed(1)}%` : '-'}
                      </span>
                    </td>

                    {/* 푼 사람 */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {problem.successCount?.toLocaleString() || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevious}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                         rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ««
              </button>

              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevious}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                         rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ‹
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, pagination.currentPage - 2);
                const pageNum = startPage + i;
                if (pageNum > pagination.totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm rounded ${pageNum === pagination.currentPage
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                         rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ›
              </button>

              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                         rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                »»
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProblemList;