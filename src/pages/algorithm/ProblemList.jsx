import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getProblems, 
  DIFFICULTY_OPTIONS, 
  SOURCE_OPTIONS, 
  PAGE_SIZE_OPTIONS 
} from '../../service/algorithm/algorithmApi';

import ProblemCard from '../../components/algorithm/problem/ProblemCard';

// 언어 옵션
const LANGUAGE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'C', label: 'C' },
  { value: 'C++', label: 'C++' },
  { value: 'C#', label: 'C#' },
  { value: 'Go', label: 'Go' },
  { value: 'Java', label: 'Java' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Kotlin', label: 'Kotlin' },
  { value: 'Python', label: 'Python' },
  { value: 'Python3', label: 'Python3' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'Scala', label: 'Scala' },
  { value: 'Swift', label: 'Swift' },
  { value: 'Rust', label: 'Rust' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Dart', label: 'Dart' },
  { value: 'MySQL', label: 'MySQL' },
  { value: 'Oracle', label: 'Oracle' },
  { value: 'Elixir', label: 'Elixir' },
  { value: 'Erlang', label: 'Erlang' },
  { value: 'Racket', label: 'Racket' }
];

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'accuracy', label: '정답률순' },
  { value: 'popular', label: '많이 푼 순' }
];


const ProblemList = () => {
  // ======================================
  // 상태 관리
  // ======================================
  
  // FIXED: 탭의 기본값 → 백엔드 enum과 일치
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

  // FIXED: source 기본값 'AI' → 'AI_GENERATED'
  const [filters, setFilters] = useState({
    difficulty: '',
    source: 'AI_GENERATED',
    language: '',
    status: '',
    keyword: '',
    sortBy: 'latest',
    page: 1,
    size: 10
  });

  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrevious: false
  });

  const navigate = useNavigate();

  // ======================================
  // 문제 목록 로딩
  // ======================================
  const loadProblems = useCallback(async (filterParams = filters) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getProblems(filterParams);
      
      console.log('🔍 [ProblemList] result:', result);

      if (result.error) {
        setError(result.message || '문제 목록을 불러오는데 실패했습니다.');
        return;
      }

      // result = { data: { problems, totalCount, totalPages, ... } }
      if (result.data) {
        setProblems(result.data.problems || []);
        setPagination({
          totalCount: result.data.totalCount || 0,
          totalPages: result.data.totalPages || 0,
          currentPage: result.data.currentPage || 1,
          hasNext: result.data.hasNext || false,
          hasPrevious: result.data.hasPrevious || false
        });
      } else {
        console.warn('⚠️ result.data가 없습니다:', result);
        setProblems([]);
      }
    } catch (err) {
      console.error('문제 목록 로딩 에러:', err);
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ======================================
  // 통계 로딩
  // ======================================
  const loadStatistics = useCallback(async () => {
    try {
      // TODO: API 구현 시 실제 데이터로 대체
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

  // 최초 로딩
  useEffect(() => {
    loadProblems();
    loadStatistics();
  }, [loadProblems, loadStatistics]);

  // ======================================
  // 이벤트 핸들러
  // ======================================

  const handleTabChange = (tab) => {
    // FIXED: 탭은 곧바로 백엔드 ENUM으로 사용됨
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

  const handleSearch = (e) => {
    e.preventDefault();
    loadProblems({ ...filters, page: 1 });
  };

  const handleProblemClick = (problemId) => {
    navigate(`/algorithm/problems/${problemId}`);
  };

  // ======================================
  // 필터 태그
  // ======================================

  const removeFilter = (filterKey) => {
    handleFilterChange(filterKey, '');
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.status) {
      const statusLabel = filters.status === 'solved' ? '풀었음' : '안 풀었음';
      active.push({ key: 'status', label: statusLabel });
    }
    if (filters.difficulty) {
      const diffOption = DIFFICULTY_OPTIONS.find(opt => opt.value === filters.difficulty);
      if (diffOption) active.push({ key: 'difficulty', label: diffOption.label });
    }
    if (filters.language) {
      const langOption = LANGUAGE_OPTIONS.find(opt => opt.value === filters.language);
      if (langOption) active.push({ key: 'language', label: langOption.label });
    }
    return active;
  };

  const activeFilters = getActiveFilters();

  // ======================================
  // 렌더링
  // ======================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI 문제 생성기</h1>
          <p className="text-gray-600 text-lg">원하는 조건으로 알고리즘 문제를 AI가 생성해드립니다</p>
        </div>

        {/* 탭 */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            
            <button
              onClick={() => handleTabChange('AI_GENERATED')}
              className={`flex-1 py-4 px-6 font-semibold ${
                activeTab === 'AI_GENERATED'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI 생성 문제
            </button>

            <button
              onClick={() => handleTabChange('BOJ')}
              className={`flex-1 py-4 px-6 font-semibold ${
                activeTab === 'BOJ'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              백준
            </button>

            <button
              onClick={() => handleTabChange('CUSTOM')}
              className={`flex-1 py-4 px-6 font-semibold ${
                activeTab === 'CUSTOM'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              프로그래머스
            </button>

          </div>

          {/* 필터 섹션 */}
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              
              {/* 검색창 */}
              <input
                type="text"
                placeholder="풀고 싶은 문제 제목, 기출문제 검색"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              {/* 필터들 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* 상태 */}
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-4 py-3 border rounded-lg"
                >
                  <option value="">상태</option>
                  <option value="solved">풀었음</option>
                  <option value="unsolved">안 풀었음</option>
                </select>

                {/* 난이도 */}
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="px-4 py-3 border rounded-lg"
                >
                  {DIFFICULTY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* 언어 */}
                <select
                  value={filters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="px-4 py-3 border rounded-lg"
                >
                  {LANGUAGE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* 정렬 */}
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-4 py-3 border rounded-lg"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

              </div>
            </form>

            {/* 활성 필터 태그 */}
            {activeFilters.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {activeFilters.map((filter) => (
                  <div
                    key={filter.key}
                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700"
                  >
                    {filter.label}
                    <button
                      onClick={() => removeFilter(filter.key)}
                      className="ml-2 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 문제 개수 */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            {pagination.totalCount} 문제
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filters.size}
              onChange={(e) => handleFilterChange('size', Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              {PAGE_SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Link
              to="/algorithm/problems/generate"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              🤖 AI 문제 생성
            </Link>
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">문제 목록을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            <p className="font-semibold">오류가 발생했습니다</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* 문제 리스트 */}
        {!loading && !error && (
          <>
            {problems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-16 text-center">
                <p className="text-xl text-gray-500">검색 결과가 없습니다</p>
                <p className="text-gray-400 mt-2">다른 조건으로 검색해보세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {problems.map((problem) => (
                  <ProblemCard
                    key={problem.algoProblemId}
                    problem={problem}
                    onClick={handleProblemClick}
                  />
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2">

                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPrevious}
                    className="px-3 py-2 border rounded-lg bg-white disabled:opacity-30"
                  >
                    ‹‹
                  </button>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                    className="px-3 py-2 border rounded-lg bg-white disabled:opacity-30"
                  >
                    ‹
                  </button>

                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const startPage = Math.max(
                      1,
                      pagination.currentPage - 2
                    );
                    const pageNum = startPage + i;
                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 border rounded-lg bg-white disabled:opacity-30"
                  >
                    ›
                  </button>

                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 border rounded-lg bg-white disabled:opacity-30"
                  >
                    ››
                  </button>

                </div>
              </div>
            )}
          </>
        )}

        {/* 통계 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-sm text-gray-600 mb-2">전체 문제 수</div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {statistics.totalProblems.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-sm text-gray-600 mb-2">평균 정답률</div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {statistics.averageAccuracy}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-sm text-gray-600 mb-2">총 응시자</div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {statistics.totalAttempts.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="text-sm text-gray-600 mb-2">내가 푼 문제</div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {statistics.solvedProblems.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              총 {statistics.totalProblems}개 중 {statistics.solvedProblems}개 완료
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProblemList;
