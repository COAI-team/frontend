import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getProblems,
  DIFFICULTY_OPTIONS,
  PAGE_SIZE_OPTIONS,
  getTodayMissions,
  getSolveBonusStatus,
  MISSION_TYPE_INFO
} from '../../service/algorithm/AlgorithmApi';
import TopicSelector from '../../components/common/TopicSelector';
import Pagination from '../../components/common/Pagination';
import AlgorithmListStats from '../../components/algorithm/AlgorithmListStats';
import { useLogin } from '../../context/login/useLogin';
import '../../styles/ProblemList.css';

const SOLVED_OPTIONS = [
  { value: '', label: '풀이 상태' },
  { value: 'solved', label: '푼 문제' },
  { value: 'unsolved', label: '안 푼 문제' },
];

const ProblemList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 로그인 상태 확인
  const { user, hydrated } = useLogin();
  const isLoggedIn = !!user;

  // 사이드바 열림/닫힘 상태 (localStorage에서 복원)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('problemListSidebarOpen');
    return saved !== 'false'; // 기본값: 열림(true)
  });

  // 사이드바 상태 변경 시 localStorage에 저장
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('problemListSidebarOpen', String(newState));
      return newState;
    });
  };

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

  // 미션 관련 상태
  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [bonusStatusMap, setBonusStatusMap] = useState({});

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

  // 보너스 상태 조회 함수
  const fetchBonusStatuses = useCallback(async (missionList) => {
    const targets = missionList.filter(
      (m) => m.missionType === 'PROBLEM_SOLVE' && m.problemId
    );
    if (targets.length === 0) {
      setBonusStatusMap({});
      return;
    }

    try {
      const results = await Promise.all(
        targets.map(async (m) => {
          const res = await getSolveBonusStatus(m.problemId);
          if (res?.error && !res.data) return null;
          return {
            key: m.missionId || m.problemId,
            data: res.data || res
          };
        })
      );

      const map = {};
      results.forEach((item) => {
        if (item?.key && item.data) {
          map[item.key] = item.data;
        }
      });
      setBonusStatusMap(map);
    } catch (e) {
      console.error('보너스 상태 조회 실패:', e);
    }
  }, []);

  // 미션 데이터 로딩
  const loadMissions = useCallback(async () => {
    if (!isLoggedIn || !user?.userId) {
      setMissionsLoading(false);
      return;
    }

    try {
      setMissionsLoading(true);
      const missionsResult = await getTodayMissions(user.userId);

      if (!missionsResult.error) {
        const missionData = missionsResult.data || [];
        setMissions(missionData);
        fetchBonusStatuses(missionData);
      }
    } catch (err) {
      console.error('미션 로딩 에러:', err);
    } finally {
      setMissionsLoading(false);
    }
  }, [isLoggedIn, user, fetchBonusStatuses]);

  // hydrated 상태와 로그인 상태가 확인되면 미션 데이터 로딩
  useEffect(() => {
    if (hydrated) {
      loadMissions();
    }
  }, [hydrated, loadMissions]);

  // 페이지 포커스 시 미션 데이터 새로고침
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hydrated && isLoggedIn) {
        loadMissions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hydrated, isLoggedIn, loadMissions]);

  // 미션 카드 클릭 핸들러
  const handleMissionClick = (mission) => {
    if (mission.completed) return;

    const typeInfo = MISSION_TYPE_INFO[mission.missionType];
    if (mission.missionType === 'PROBLEM_GENERATE') {
      navigate(typeInfo.link);
    } else if (mission.missionType === 'PROBLEM_SOLVE' && mission.problemId) {
      navigate(`${typeInfo.linkPrefix}${mission.problemId}`);
    }
  };

  // 난이도 라벨 가져오기
  const getDifficultyLabel = (difficulty) => {
    const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
    return option ? option.label : difficulty;
  };

  // 완료된 미션 수 계산
  const completedCount = missions.filter(m => m.completed).length;
  const totalMissions = missions.length;

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
    } catch (e) {
      return tags.split(',')[0]?.trim() || '-';
    }
  };

  return (
    <div className="problem-list-container">
      <div className="problem-list-layout">
        {/* 메인 컨텐츠 영역 */}
        <div className="problem-list-main">
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
              onChange={(e) => handleFilterChange('size', parseInt(e.target.value))}
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
                          {problem.algoProblemId}
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

        {/* 미니멀 화살표 토글 (사이드바가 닫혀있을 때) */}
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="sidebar-toggle-minimal"
            title="오늘의 미션 열기"
          >
            <span className="sidebar-toggle-arrow">‹</span>
          </button>
        )}

        {/* 사이드바 - 오늘의 미션 */}
        <aside className={`problem-list-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          {/* 미션 진행률 */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h2 className="sidebar-title">오늘의 미션</h2>
              <div className="sidebar-header-right">
                {isLoggedIn && (
                  <span className="sidebar-subtitle">
                    {completedCount} / {totalMissions} 완료
                  </span>
                )}
                <button
                  onClick={toggleSidebar}
                  className="sidebar-close-btn"
                  title="사이드바 닫기"
                >
                  ✕
                </button>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="sidebar-login-prompt">
                <p>로그인하면 오늘의 미션을 확인할 수 있습니다.</p>
                <Link to="/signin" className="sidebar-login-btn">
                  로그인하기
                </Link>
              </div>
            ) : missionsLoading ? (
              <div className="sidebar-loading">
                <div className="loading-spinner-small"></div>
                <span>미션 로딩 중...</span>
              </div>
            ) : (
              <>
                {/* 진행률 바 */}
                <div className="mission-progress-bar-container">
                  <div className="mission-progress-bar">
                    <div
                      className="mission-progress-fill"
                      style={{
                        width: totalMissions > 0
                          ? `${(completedCount / totalMissions) * 100}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                {completedCount === totalMissions && totalMissions > 0 && (
                  <p className="mission-complete-message">
                    오늘의 모든 미션 완료!
                  </p>
                )}

                {/* 미션 목록 */}
                <div className="sidebar-mission-list">
                  {missions.length === 0 ? (
                    <p className="sidebar-empty">오늘의 미션이 없습니다.</p>
                  ) : (
                    missions.map((mission, index) => {
                      const typeInfo = MISSION_TYPE_INFO[mission.missionType] || {};
                      const isCompleted = mission.completed;

                      return (
                        <div
                          key={mission.missionId || index}
                          onClick={() => handleMissionClick(mission)}
                          className={`sidebar-mission-card ${
                            isCompleted ? 'completed' : 'active'
                          }`}
                        >
                          <div className="mission-card-content">
                            <div className={`mission-icon ${isCompleted ? 'completed' : ''}`}>
                              {isCompleted ? '✅' : typeInfo.icon}
                            </div>
                            <div className="mission-info">
                              <h4 className={`mission-name ${isCompleted ? 'completed' : ''}`}>
                                {typeInfo.name || mission.missionType}
                              </h4>
                              {mission.missionType === 'PROBLEM_SOLVE' && mission.problemTitle && (
                                <p className="mission-problem-title">{mission.problemTitle}</p>
                              )}
                              {mission.missionType === 'PROBLEM_SOLVE' && mission.problemDifficulty && (
                                <span className={`mission-difficulty ${mission.problemDifficulty.toLowerCase()}`}>
                                  {getDifficultyLabel(mission.problemDifficulty)}
                                </span>
                              )}
                            </div>
                            <div className={`mission-reward ${isCompleted ? 'completed' : ''}`}>
                              +{mission.rewardPoints}P
                            </div>
                          </div>

                          {/* 선착순 보너스 상태 */}
                          {mission.missionType === 'PROBLEM_SOLVE' && (
                            <div className="mission-bonus-status">
                              {(() => {
                                const bonusKey = mission.missionId || mission.problemId;
                                const bonusStatus = bonusStatusMap[bonusKey];
                                const current = bonusStatus?.currentCount ?? 0;
                                const limit = bonusStatus?.limit ?? 3;

                                if (!bonusStatus) {
                                  return <span className="bonus-loading">보너스 확인 중...</span>;
                                }

                                if (isCompleted) {
                                  return (
                                    <span className="bonus-completed">
                                      보너스 지급 완료 ({current}/{limit}명)
                                    </span>
                                  );
                                }

                                if (bonusStatus.eligible) {
                                  return (
                                    <span className="bonus-eligible">
                                      선착순 보너스 가능 ({current}/{limit}명)
                                    </span>
                                  );
                                }

                                return (
                                  <span className="bonus-closed">
                                    보너스 마감 ({current}/{limit}명)
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {!isCompleted && (
                            <div className="mission-action-hint">
                              클릭하여 시작 →
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 데일리미션 전체보기 링크 */}
                <Link to="/mypage/daily-mission" className="sidebar-view-all">
                  전체 미션 보기 →
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProblemList;
