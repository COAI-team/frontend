import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProblems, DIFFICULTY_OPTIONS, SOURCE_OPTIONS, PAGE_SIZE_OPTIONS } from '../../service/algorithm/algorithmApi';
import DifficultyBadge from '../../components/algorithm/problem/DifficultyBadge';
import ProblemCard from '../../components/algorithm/problem/ProblemCard';


const ProblemList = () => {
  // ===== 상태 관리 =====
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 필터 및 페이징 상태
  const [filters, setFilters] = useState({
    difficulty: '',
    source: '',
    keyword: '',
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

      // 백엔드 응답 구조에 맞춰 데이터 설정
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
  }, [filters]); // filters를 의존성으로 추가

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    loadProblems();
  }, [loadProblems]); // loadProblems를 의존성으로 추가

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

  const handleSearch = (e) => {
    e.preventDefault();
    const newFilters = { ...filters, page: 1 };
    loadProblems(newFilters);
  };

  const handleProblemClick = (problemId) => {
    navigate(`/algorithm/problems/${problemId}`);
  };

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">알고리즘 문제</h1>
          <p className="text-gray-600">다양한 알고리즘 문제를 풀어보세요</p>
        </div>

        {/* 필터 및 검색 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* 첫 번째 줄: 필터들 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 난이도 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  난이도
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DIFFICULTY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 출처 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출처
                </label>
                <select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SOURCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 페이지 크기 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  표시 개수
                </label>
                <select
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAGE_SIZE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI 문제 생성 버튼 */}
              <div className="flex items-end">
                <Link
                  to="/algorithm/problems/generate"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-center"
                >
                  🤖 AI 문제 생성
                </Link>
              </div>
            </div>

            {/* 두 번째 줄: 검색 */}
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="문제 제목이나 내용으로 검색..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                검색
              </button>
            </div>
          </form>
        </div>

        {/* 결과 정보 */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            총 {pagination.totalCount}개의 문제 (페이지 {pagination.currentPage} / {pagination.totalPages})
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">문제 목록을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <p className="font-medium">오류가 발생했습니다</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* 문제 목록 */}
        {!loading && !error && (
          <>
            {problems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">다른 조건으로 검색해보세요.</p>
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
                  {/* 이전 페이지 */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                    className="px-3 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>

                  {/* 페이지 번호들 */}
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
                        className={`px-3 py-2 rounded-md border ${pageNum === pagination.currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* 다음 페이지 */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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