import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProblems, DIFFICULTY_OPTIONS, PAGE_SIZE_OPTIONS } from '../../service/algorithm/algorithmApi';
import TopicSelector from '../../components/common/TopicSelector';
import Pagination from '../../components/common/Pagination';
import '../../styles/ProblemList.css';

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'mostSolved', label: '푼 사람 많은 순' },
  { value: 'highAccuracy', label: '정답률 높은 순' },
  { value: 'lowAccuracy', label: '정답률 낮은 순' },
];

// 풀이 상태 옵션
const SOLVED_OPTIONS = [
  { value: '', label: '풀이 상태' },
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

  // 난이도 클래스 반환
  const getDifficultyClass = (difficulty) => {
    const classes = {
      BRONZE: 'difficulty-bronze',
      SILVER: 'difficulty-silver',
      GOLD: 'difficulty-gold',
      PLATINUM: 'difficulty-platinum'
    };
    return classes[difficulty] || '';
  };

  // ===== 렌더링 =====
  return (
    <div className="problem-list-container">
      <div>
        {/* 페이지 헤더 */}
        <div className="problem-header">
          <h1 className="problem-title">알고리즘 문제</h1>
          <p className="problem-subtitle">다양한 알고리즘 문제를 만들고 풀어보세요</p>
        </div>

        {/* 주제 필터 탭 */}
        <div className="topic-filter-section">
          <TopicSelector 
            selectedTopic={filters.topic}
            onTopicSelect={(topic) => handleFilterChange('topic', topic)}
          />
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="problem-controls">
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
            className="search-input"
          />
          <select
            value={filters.solved}
            onChange={(e) => handleFilterChange('solved', e.target.value)}
            className="filter-select"
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
            className="filter-select"
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
            className="filter-select"
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
            className="filter-select"
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Link to="/algorithm/problems/generate" className="ai-generate-btn">
            문제 만들기
          </Link>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>문제 목록을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="error-container">
            <p className="error-title">오류가 발생했습니다</p>
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* 문제 목록 테이블 */}
        {!loading && !error && (
          <>
            <div className="problem-table-container">
              <table className="problem-table">
                <thead>
                  <tr>
                    <th style={{width: '60px'}}>상태</th>
                    <th style={{width: '60px'}}>번호</th>
                    <th>제목</th>
                    <th style={{width: '100px'}}>난이도</th>
                    <th style={{width: '80px'}}>유형</th>
                    <th style={{width: '80px'}}>제출수</th>
                    <th style={{width: '80px'}}>정답률</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{textAlign: 'center', padding: '60px 20px'}}>
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    problems.map((problem, index) => (
                      <tr
                        key={problem.algoProblemId}
                        onClick={() => handleProblemClick(problem.algoProblemId)}
                      >
                        <td>
                          {problem.isSolved ? (
                            <span className="status-icon solved">
                              <svg fill="currentColor" viewBox="0 0 20 20" style={{color: '#22c55e'}}>
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : (
                            <span className="status-icon unsolved"></span>
                          )}
                        </td>
                        <td>
                          {(pagination.currentPage - 1) * filters.size + index + 1}
                        </td>
                        <td style={{textAlign: 'left'}}>
                          {problem.algoProblemTitle}
                        </td>
                        <td className={getDifficultyClass(problem.algoProblemDifficulty)}>
                          {problem.algoProblemDifficulty}
                        </td>
                        <td>-</td>
                        <td>{problem.solveCount || 0}</td>
                        <td>-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProblemList;