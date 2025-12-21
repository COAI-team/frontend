import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getProblems, DIFFICULTY_OPTIONS, PAGE_SIZE_OPTIONS } from '../../service/algorithm/AlgorithmApi';
import TopicSelector from '../../components/common/TopicSelector';
import Pagination from '../../components/common/Pagination';
import AlgorithmListStats from '../../components/algorithm/AlgorithmListStats';
import '../../styles/ProblemList.css';

const SOLVED_OPTIONS = [
  { value: '', label: '풀이 상태' },
  { value: 'solved', label: '푼 문제' },
  { value: 'unsolved', label: '안 푼 문제' },
];

const ProblemList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrevious: false
  });

  // URL에서 파라미터 읽기
  const keyword = searchParams.get('keyword') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('size')) || 10;
  const difficulty = searchParams.get('difficulty') || '';
  const topic = searchParams.get('topic') || '';
  const solved = searchParams.get('solved') || '';

  // 검색 입력용 로컬 state
  const [searchInput, setSearchInput] = useState(keyword);

  // URL 파라미터 업데이트 헬퍼 함수
  const updateParams = useCallback((updates, resetPage = false) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    if (resetPage) {
      newParams.delete('page');
    }

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // URL keyword 변경 시 검색 입력창 동기화
  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  // 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== keyword) {
        updateParams({ keyword: searchInput }, true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, keyword, updateParams]);

  // 문제 목록 조회
  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getProblems({
        page: currentPage,
        size: pageSize,
        difficulty,
        topic,
        keyword,
        solved
      });

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
  }, [currentPage, pageSize, difficulty, topic, keyword, solved]);

  // URL 파라미터가 변경될 때마다 문제 조회
  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // 필터 변경
  const handleFilterChange = (key, value) => {
    updateParams({ [key]: value }, true);
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
  };

  const handleProblemClick = (problemId) => {
    navigate(`/algorithm/problems/${problemId}`);
  };

  const getDifficultyClass = (difficulty) => {
    const classes = {
      BRONZE: 'difficulty-bronze',
      SILVER: 'difficulty-silver',
      GOLD: 'difficulty-gold',
      PLATINUM: 'difficulty-platinum'
    };
    return classes[difficulty] || '';
  };

  const getTopicDisplayName = (tags) => {
    if (!tags) return '-';
    
    try {
      // JSON 배열 형태인 경우
      if (tags.startsWith('[')) {
        const parsedTags = JSON.parse(tags);
        return parsedTags[0] || '-';
      }
      // 쉼표로 구분된 문자열인 경우
      const tagArray = tags.split(',').map(t => t.trim());
      return tagArray[0] || '-';
    } catch (_e) {  // or e_
      return tags.split(',')[0]?.trim() || '-';
    }
  };

  return (
    <div className="problem-list-container">
      <div>
        <div className="problem-header">
          <div className="problem-header-row">
            <h1 className="problem-title">알고리즘 문제</h1>
            <Link to="/algorithm/problems/generate" className="ai-generate-btn">
            🚀 나만의 문제 만들러 가기 → 
            </Link>
          </div>
          <p className="problem-subtitle">다양한 알고리즘 문제를 만들고 풀어보세요</p>
        </div>

        <div className="topic-filter-section">
          <TopicSelector
            selectedTopic={topic}
            onTopicSelect={(topic) => handleFilterChange('topic', topic)}
          />
        </div>

        <div className="problem-controls">
          <input
            type="text"
            placeholder="문제 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <select
            value={solved}
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
            value={difficulty}
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
            value={pageSize}
            onChange={(e) => handleFilterChange('size', Number.parseInt(e.target.value))}
            className="filter-select"
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>문제 목록을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p className="error-title">오류가 발생했습니다</p>
            <p className="error-message">{error}</p>
          </div>
        )}

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
                    <th style={{width: '180px'}}>유형</th>
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
                          {(pagination.currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td style={{textAlign: 'left'}}>
                          {problem.algoProblemTitle}
                        </td>
                        <td className={getDifficultyClass(problem.algoProblemDifficulty)}>
                          {problem.algoProblemDifficulty}
                        </td>
                        <td>{getTopicDisplayName(problem.algoProblemTags)}</td>
                        <td>{problem.totalSubmissions || 0}</td>
                        <td>{problem.accuracy ? `${problem.accuracy}%` : '0%'}</td>
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

            {/* 통계 섹션 */}
            <AlgorithmListStats />
          </>
        )}
      </div>
    </div>
  );
};

export default ProblemList;
