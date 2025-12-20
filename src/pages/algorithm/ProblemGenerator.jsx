import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { drawProblemFromPool, completeMission, getTopics, getUsageInfo } from '../../service/algorithm/AlgorithmApi';
import { useLogin } from '../../context/login/useLogin';
import { extractPureDescription, renderFormattedText } from '../../components/algorithm/problem/markdownUtils';
import '../../styles/ProblemDetail.css';

/**
 * AI 문제 생성 페이지
 * - 타이핑 효과로 실시간 생성 시뮬레이션
 * - 구조화된 문제 출력
 */
const ProblemGenerator = () => {
  const navigate = useNavigate();
  const { user } = useLogin();

  // ===== 상태 관리 =====
  const [formData, setFormData] = useState({
    difficulty: 'BRONZE',
    topic: '',
    additionalRequirements: '',
    problemType: 'ALGORITHM',
    storyTheme: '',  // 스토리 테마 선택
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedProblem, setGeneratedProblem] = useState(null);
  const [generationStep, setGenerationStep] = useState('');

  // SSE 스트리밍 관련 상태
  const [completedSteps, setCompletedSteps] = useState([]);
  const sseCleanupRef = useRef(null);

  // 🎯 데일리 미션 완료 상태
  const [missionStatus, setMissionStatus] = useState({
    completed: false,
    message: null,
    rewardPoints: 0,
    error: null
  });

  // 타이핑 효과 관련 상태
  const [displayedText, setDisplayedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const typingRef = useRef(null);

  // 사용량 제한 상태
  const [usageInfo, setUsageInfo] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);

  // 구독 상태 확인
  const rawTier = user?.subscriptionTier;
  const subscriptionTier = rawTier === 'BASIC' || rawTier === 'PRO' ? rawTier : 'FREE';
  const isSubscriber = subscriptionTier !== 'FREE';
  const isUsageLimitExceeded = usageInfo && !usageInfo.isSubscriber && usageInfo.remaining <= 0;

  // 토픽 목록 상태 (백엔드에서 가져옴)
  const [topicCategories, setTopicCategories] = useState([
    { category: '자료구조', topics: [{ value: 'HASH', displayName: '해시' }, { value: 'STACK_QUEUE', displayName: '스택/큐' }, { value: 'HEAP', displayName: '힙/우선순위 큐' }, { value: 'TREE', displayName: '트리' }] },
    { category: '탐색', topics: [{ value: 'DFS_BFS', displayName: 'DFS/BFS' }, { value: 'BRUTE_FORCE', displayName: '완전탐색' }, { value: 'BACKTRACKING', displayName: '백트래킹' }, { value: 'BINARY_SEARCH', displayName: '이분탐색' }, { value: 'GRAPH_SHORTEST_PATH', displayName: '그래프/최단경로' }] },
    { category: '최적화', topics: [{ value: 'GREEDY', displayName: '그리디' }, { value: 'DP', displayName: '동적 프로그래밍(DP)' }] },
    { category: '구현', topics: [{ value: 'IMPLEMENTATION', displayName: '구현/시뮬레이션' }, { value: 'SORTING', displayName: '정렬' }, { value: 'STRING', displayName: '문자열 처리' }, { value: 'TWO_POINTER', displayName: '투포인터/슬라이딩 윈도우' }] },
  ]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // ===== 상수 정의 =====
  const DIFFICULTY_OPTIONS = [
    { value: 'BRONZE', label: '브론즈 (초급)', color: 'orange', description: '기본 문법, 간단한 구현' },
    { value: 'SILVER', label: '실버 (초중급)', color: 'gray', description: '기본 알고리즘, 자료구조' },
    { value: 'GOLD', label: '골드 (중급)', color: 'yellow', description: '고급 알고리즘, 최적화' },
    { value: 'PLATINUM', label: '플래티넘 (고급)', color: 'blue', description: '복잡한 알고리즘, 수학적 사고' },
  ];

  // 🎄 스토리 테마 옵션 - 겨울/연말 시즌 (백엔드 STORY_THEMES와 동기화)
  const STORY_THEMES = [
    { value: 'SANTA_DELIVERY', label: '🎅 산타의 선물 배달', description: '선물 배달 경로 최적화, 굴뚝 탐색' },
    { value: 'SNOWBALL_FIGHT', label: '⛄ 눈싸움 대작전', description: '눈덩이 전략, 진영 구축, 승리 조건' },
    { value: 'CHRISTMAS_TREE', label: '🎄 크리스마스 트리 장식', description: '장식 배치, 전구 연결, 트리 꾸미기' },
    { value: 'NEW_YEAR_FIREWORKS', label: '🎆 새해 불꽃놀이', description: '불꽃 타이밍, 하늘 배치, 쇼 연출' },
    { value: 'SKI_RESORT', label: '⛷️ 스키장', description: '슬로프 경로, 리프트 최적화, 스키 대회' },
  ];

  // SQL 토픽 (하드코딩 유지 - SQL은 아직 미지원)
  const TOPIC_SUGGESTIONS_SQL = [
    'SELECT', 'GROUP BY', 'String, Date', 'JOIN', 'SUM, MAX, MIN', 'IS NULL'
  ];
  
  // ===== 토픽 목록 조회 =====
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics();
        if (response.data && Array.isArray(response.data)) {
          setTopicCategories(response.data);
        } else {
          console.warn('토픽 API 응답 형식 오류, 기본값 사용');
          // 폴백: 백엔드 enum과 동일한 기본값 사용
          setTopicCategories([
            { category: '자료구조', topics: [{ value: 'HASH', displayName: '해시' }, { value: 'STACK_QUEUE', displayName: '스택/큐' }, { value: 'HEAP', displayName: '힙/우선순위 큐' }, { value: 'TREE', displayName: '트리' }] },
            { category: '탐색', topics: [{ value: 'DFS_BFS', displayName: 'DFS/BFS' }, { value: 'BRUTE_FORCE', displayName: '완전탐색' }, { value: 'BACKTRACKING', displayName: '백트래킹' }, { value: 'BINARY_SEARCH', displayName: '이분탐색' }, { value: 'GRAPH_SHORTEST_PATH', displayName: '그래프/최단경로' }] },
            { category: '최적화', topics: [{ value: 'GREEDY', displayName: '그리디' }, { value: 'DP', displayName: '동적 프로그래밍(DP)' }] },
            { category: '구현', topics: [{ value: 'IMPLEMENTATION', displayName: '구현/시뮬레이션' }, { value: 'SORTING', displayName: '정렬' }, { value: 'STRING', displayName: '문자열 처리' }, { value: 'TWO_POINTER', displayName: '투포인터/슬라이딩 윈도우' }] },
          ]);
        }
      } catch (err) {
        console.error('토픽 목록 조회 실패:', err);
        // 폴백: 백엔드 enum과 동일한 기본값 사용
        setTopicCategories([
          { category: '자료구조', topics: [{ value: 'HASH', displayName: '해시' }, { value: 'STACK_QUEUE', displayName: '스택/큐' }, { value: 'HEAP', displayName: '힙/우선순위 큐' }, { value: 'TREE', displayName: '트리' }] },
          { category: '탐색', topics: [{ value: 'DFS_BFS', displayName: 'DFS/BFS' }, { value: 'BRUTE_FORCE', displayName: '완전탐색' }, { value: 'BACKTRACKING', displayName: '백트래킹' }, { value: 'BINARY_SEARCH', displayName: '이분탐색' }, { value: 'GRAPH_SHORTEST_PATH', displayName: '그래프/최단경로' }] },
          { category: '최적화', topics: [{ value: 'GREEDY', displayName: '그리디' }, { value: 'DP', displayName: '동적 프로그래밍(DP)' }] },
          { category: '구현', topics: [{ value: 'IMPLEMENTATION', displayName: '구현/시뮬레이션' }, { value: 'SORTING', displayName: '정렬' }, { value: 'STRING', displayName: '문자열 처리' }, { value: 'TWO_POINTER', displayName: '투포인터/슬라이딩 윈도우' }] },
        ]);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // ===== 사용량 정보 조회 =====
  useEffect(() => {
    const fetchUsageInfo = async () => {
      if (!user?.userId) {
        setUsageLoading(false);
        return;
      }
      try {
        const response = await getUsageInfo(user.userId);
        if (response.data) {
          setUsageInfo(response.data);
        }
      } catch (err) {
        console.error('사용량 조회 실패:', err);
      } finally {
        setUsageLoading(false);
      }
    };
    fetchUsageInfo();
  }, [user?.userId]);

  // ===== 타이핑 효과 =====
  useEffect(() => {
    if (generatedProblem && generatedProblem.description && !typingComplete) {
      setDisplayedText('');

      const fullText = generatedProblem.description;
      let index = 0;
      const speed = 5; // 타이핑 속도 (ms)

      typingRef.current = setInterval(() => {
        if (index < fullText.length) {
          // 한 번에 여러 글자 추가 (빠른 타이핑 효과)
          const charsToAdd = Math.min(3, fullText.length - index);
          setDisplayedText(prev => prev + fullText.substring(index, index + charsToAdd));
          index += charsToAdd;
        } else {
          clearInterval(typingRef.current);
          setTypingComplete(true);
        }
      }, speed);

      return () => {
        if (typingRef.current) {
          clearInterval(typingRef.current);
        }
      };
    }
  }, [generatedProblem, typingComplete]);

  // ===== 이벤트 핸들러 =====
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTopicSuggestionClick = (topic) => {
    setFormData(prev => ({
      ...prev,
      topic: topic
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // SQL 문제는 현재 지원하지 않음
    if (formData.problemType === 'SQL') {
      setError('SQL 문제는 현재 준비 중입니다. 향후 지원 예정입니다.');
      return;
    }

    if (!formData.topic.trim()) {
      setError('문제 주제를 선택해주세요.');
      return;
    }

    // 스토리 테마 필수 체크 (풀 시스템 사용)
    if (!formData.storyTheme) {
      setError('스토리 테마를 선택해주세요.');
      return;
    }

    // 이전 SSE 연결 정리
    if (sseCleanupRef.current) {
      sseCleanupRef.current();
    }

    setLoading(true);
    setError(null);
    setGeneratedProblem(null);
    setDisplayedText('');
    setTypingComplete(false);
    setCompletedSteps([]);
    setGenerationStep('풀에서 문제 가져오는 중...');

    // 풀 API용 요청 데이터
    const requestData = {
      difficulty: formData.difficulty,
      topic: formData.topic,
      theme: formData.storyTheme,
    };

    console.log('🚀 [Pool SSE] 풀에서 문제 요청:', requestData);

    // SSE 스트리밍 시작 (풀 API)
    const cleanup = drawProblemFromPool(requestData, {
      // 진행 단계 업데이트 콜백 (풀이 비어있을 때 실시간 생성 시에만 호출됨)
      onStep: (message) => {
        console.log('📍 [Pool SSE] 진행 단계:', message);
        setCompletedSteps(prev => [...prev, message]);
        setGenerationStep(message);
      },

      // 완료 콜백
      onComplete: async (data) => {
        console.log('✅ [Pool SSE] 문제 전달 완료:', data);

        // 서버 응답 데이터를 컴포넌트 상태에 맞게 변환
        // DB 필드를 직접 매핑 (파싱 대신 개별 컬럼 사용)
        const problemData = {
          problemId: data.problemId,
          title: data.title,
          description: data.description,  // algoProblemDescription
          inputFormat: data.inputFormat,  // DB의 INPUT_FORMAT 컬럼
          outputFormat: data.outputFormat,  // DB의 OUTPUT_FORMAT 컬럼
          constraints: data.constraints,  // DB의 CONSTRAINTS 컬럼
          algoProblemTags: data.algoProblemTags,  // DB의 ALGO_PROBLEM_TAGS 컬럼
          testcases: data.testcases,  // 예제 테스트케이스 (isSample=true)
          difficulty: data.difficulty,
          testCaseCount: data.testCaseCount,
          generationTime: data.generationTime,  // LLM이 문제 생성하는데 걸린 시간
          fetchTime: data.fetchTime,  // 풀에서 꺼내오는데 걸린 시간 (fromPool=true일 때만)
          fromPool: data.fromPool  // 풀에서 즉시 반환 여부
        };

        setGeneratedProblem(problemData);
        setGenerationStep(data.fromPool ? '풀에서 즉시 반환!' : '생성 완료!');
        setLoading(false);

        // 🎯 데일리 미션 완료 처리 (PROBLEM_GENERATE)
        if (!user?.userId) {
          console.warn('로그인되지 않은 상태에서 미션 완료 처리 스킵');
        } else {
        try {
          const missionResult = await completeMission('PROBLEM_GENERATE', user.userId);
          console.log('🎯 미션 완료 API 응답:', JSON.stringify(missionResult, null, 2));

          const mResult = missionResult.data || missionResult;

          if (mResult.error) {
            if (mResult.code === 'ALGO_4501') {
              setMissionStatus({
                completed: true,
                message: '오늘의 미션은 이미 완료되었습니다',
                rewardPoints: 0,
                error: null
              });
            } else {
              console.warn('미션 완료 API 오류:', mResult.message);
              setMissionStatus(prev => ({ ...prev, error: mResult.message }));
            }
          } else if (mResult.success || mResult.completed) {
            setMissionStatus({
              completed: true,
              message: mResult.message || 'AI 문제 생성 미션 완료!',
              rewardPoints: mResult.rewardPoints || 0,
              error: null
            });
            console.log('✅ 미션 완료:', mResult.message, `+${mResult.rewardPoints || 0}P`);
          } else if (mResult.alreadyCompleted) {
            setMissionStatus({
              completed: true,
              message: '이미 완료된 미션입니다',
              rewardPoints: 0,
              error: null
            });
          } else {
            setMissionStatus({
              completed: true,
              message: 'AI 문제 생성 미션 완료!',
              rewardPoints: 0,
              error: null
            });
          }
        } catch (missionErr) {
          const errorCode = missionErr.response?.data?.code;
          const errorMessage = missionErr.response?.data?.message;

          if (errorCode === 'ALGO_4501') {
            setMissionStatus({
              completed: true,
              message: '오늘의 미션은 이미 완료되었습니다',
              rewardPoints: 0,
              error: null
            });
          } else {
            console.warn('미션 완료 처리 실패 (무시됨):', errorMessage || missionErr);
            setMissionStatus(prev => ({ ...prev, error: errorMessage || '미션 완료 처리 실패' }));
          }
        }
        }
      },

      // 에러 콜백
      onError: (errorMessage) => {
        console.error('❌ [Pool SSE] 에러:', errorMessage);
        setError(errorMessage || '문제를 가져오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    });

    // 정리 함수 저장
    sseCleanupRef.current = cleanup;
  };

  // 컴포넌트 언마운트 시 SSE 연결 정리
  useEffect(() => {
    return () => {
      if (sseCleanupRef.current) {
        sseCleanupRef.current();
      }
    };
  }, []);

  const handleReset = () => {
    // SSE 연결 정리
    if (sseCleanupRef.current) {
      sseCleanupRef.current();
      sseCleanupRef.current = null;
    }
    if (typingRef.current) {
      clearInterval(typingRef.current);
    }
    setFormData({
      difficulty: 'BRONZE',
      topic: '',
      additionalRequirements: '',
      problemType: 'ALGORITHM',
      storyTheme: '',
    });
    setGeneratedProblem(null);
    setError(null);
    setDisplayedText('');
    setTypingComplete(false);
    setCompletedSteps([]);
    setGenerationStep('');
    setLoading(false);
    // 미션 상태 초기화
    setMissionStatus({
      completed: false,
      message: null,
      rewardPoints: 0,
      error: null
    });
  };

  const skipTyping = () => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
    }
    if (generatedProblem?.description) {
      setDisplayedText(generatedProblem.description);
    }
    setTypingComplete(true);
  };

  const handleGoToProblemList = () => {
    navigate('/algorithm/problems');
  };

  const handleGoToProblemDetail = (problemId) => {
    navigate(`/algorithm/problems/${problemId}`);
  };

  // ===== 난이도 색상 헬퍼 =====
  const getDifficultyColorClass = (difficulty) => {
    const colors = {
      BRONZE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
      SILVER: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600',
      GOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
      PLATINUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    };
    return colors[difficulty] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
  };

  /**
   * DB 필드에 구조화된 내용이 있는지 확인
   * - DB에서 직접 가져온 inputFormat, outputFormat, constraints 등이 있으면 구조화 표시
   */
  const hasStructuredSections = generatedProblem && typingComplete && (
    generatedProblem.inputFormat ||
    generatedProblem.outputFormat ||
    generatedProblem.constraints ||
    (generatedProblem.testcases && generatedProblem.testcases.filter(tc => tc.isSample).length > 0)
  );

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-main py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={handleGoToProblemList}
            className="mb-4 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            문제 목록으로
          </button>

          <h1 className="text-3xl font-bold text-main mb-2">AI 문제 생성</h1>
          <p className="text-muted">원하는 난이도와 주제를 선택하면 AI가 문제를 생성합니다</p>
        </div>

        {/* 🎯 데일리 미션 완료 배너 */}
        {missionStatus.completed && (
          <div
            className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 text-white"
            style={{ animation: 'subtle-pulse 2.5s ease-in-out infinite' }}
          >
            <style>{`
              @keyframes subtle-pulse {
                0%, 100% { opacity: 1; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
                50% { opacity: 0.92; box-shadow: 0 10px 20px -3px rgba(16, 185, 129, 0.5); }
              }
            `}</style>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <h3 className="font-bold text-lg">데일리 미션 완료!</h3>
                  <p className="text-green-100 text-sm">
                    {missionStatus.message || 'AI 문제 생성 미션을 완료했습니다'}
                  </p>
                </div>
              </div>
              {missionStatus.rewardPoints > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold">+{missionStatus.rewardPoints}P</p>
                  <p className="text-green-100 text-xs">보상 포인트</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* 왼쪽: 문제 생성 폼 */}
          <div className="bg-panel rounded-lg shadow-md p-6 h-full">
            <h2 className="text-xl font-bold text-main mb-6">문제 생성 설정</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 난이도 선택 */}
              <div>
                <label className="block text-sm font-medium text-sub mb-3">
                  난이도 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('difficulty', option.value)}
                      className={`p-4 rounded-lg border transition-all ${formData.difficulty === option.value
                        ? `${getDifficultyColorClass(option.value)} border-current`
                        : 'border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500'
                        }`}
                    >
                      <div className="font-semibold text-main">{option.label}</div>
                      <div className="text-xs text-muted mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 출제 분야 선택(기존의 문제 유형) */}
              <div>
                <label className="block text-sm font-medium text-sub mb-3">
                  출제 분야 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('problemType', 'ALGORITHM')}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.problemType === 'ALGORITHM'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-500'
                        : 'border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 bg-panel'
                    }`}
                  >
                    <div className={`font-semibold ${formData.problemType !== 'ALGORITHM' ? 'text-main' : ''}`}>알고리즘</div>
                    <div className="text-xs text-muted mt-1">자료구조, 알고리즘 문제</div>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 opacity-60 cursor-not-allowed relative"
                  >
                    <div className="font-semibold text-gray-400 dark:text-gray-500">SQL</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">데이터베이스 쿼리 문제</div>
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium rounded">
                      향후 지원 예정
                    </span>
                  </button>
                </div>
              </div>

              {/* 주제 선택 */}
              <div>
                <label className="block text-sm font-medium text-sub mb-3">
                  알고리즘 유형 <span className="text-red-500">*</span>
                </label>
                {formData.problemType === 'SQL' ? (
                  // SQL 토픽 (기존 방식)
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_SUGGESTIONS_SQL.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleTopicSuggestionClick(topic)}
                        className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                          formData.topic === topic
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-500 font-semibold'
                            : 'bg-panel border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 text-sub'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                ) : topicsLoading ? (
                  // 토픽 로딩 중
                  <div className="flex items-center gap-2 text-muted">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">토픽 목록 로딩 중...</span>
                  </div>
                ) : (
                  // 알고리즘 토픽 (카테고리별 - API에서 가져온 데이터)
                  <div className="space-y-3">
                    {topicCategories.map((categoryData) => (
                      <div key={categoryData.category}>
                        <div className="text-xs font-semibold text-muted mb-1.5">{categoryData.category}</div>
                        <div className="flex flex-wrap gap-2">
                          {categoryData.topics.map((topic) => (
                            <button
                              key={topic.value}
                              type="button"
                              onClick={() => handleTopicSuggestionClick(topic.displayName)}
                              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                                formData.topic === topic.displayName
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-black dark:text-blue-300 border-blue-500 font-semibold'
                                  : 'bg-panel border-[#e5e7eb] dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 text-sub'
                              }`}
                            >
                              {topic.displayName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {formData.topic && (
                  <div className="mt-3 text-sm text-blue-600">
                    선택된 주제: <span className="font-semibold">{formData.topic}</span>
                  </div>
                )}
              </div>

              {/* 🎨 스토리 테마 선택 */}
              <div>
                <label className="block text-sm font-medium text-sub mb-2">
                  스토리 테마 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted mb-3">
                문제에 적용할 스토리 테마를 선택하세요. <br />
                계절마다 새로운 테마가 제공되며, 지금은 코아이가 등장하는 겨울/연말 시즌 테마를 만나볼 수 있습니다! 🎄
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {STORY_THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => handleInputChange('storyTheme', formData.storyTheme === theme.value ? '' : theme.value)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        formData.storyTheme === theme.value
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-black dark:text-purple-300 border-purple-500'
                          : 'border-[#e5e7eb] dark:border-zinc-600 hover:border-purple-300 dark:hover:border-purple-600 bg-panel'
                      }`}
                    >
                      <div className={`font-semibold text-sm ${formData.storyTheme !== theme.value ? 'text-main' : ''}`}>
                        {theme.label}
                      </div>
                      <div className="text-xs text-muted mt-0.5">{theme.description}</div>
                    </button>
                  ))}
                </div>
                {formData.storyTheme && (
                  <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                    선택된 테마: <span className="font-semibold">{STORY_THEMES.find(t => t.value === formData.storyTheme)?.label}</span>
                  </div>
                )}
              </div>

              {/* 추가 요구사항 (일단 제외, 추후 추가 가능) */}
              {/* <div>
                <label className="block text-sm font-medium text-sub mb-2">
                  추가 요구사항 (선택)
                </label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                  placeholder="예: 초보자용으로 쉽게, 실무 면접 수준..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-panel text-main placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div> */}

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* 사용량 초과 경고 */}
              {isUsageLimitExceeded && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold">일일 무료 사용량을 모두 사용했습니다.</span>
                  </div>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-medium underline"
                  >
                    구독권 구매하러 가기 →
                  </Link>
                </div>
              )}

              {/* 버튼 그룹 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || isUsageLimitExceeded}
                  className={`flex-1 px-6 py-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isUsageLimitExceeded
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>AI가 문제를 생성하는 중...</span>
                    </>
                  ) : isUsageLimitExceeded ? (
                    <span>사용량 초과</span>
                  ) : (
                    <span>문제 생성하기</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 border border-[#e5e7eb] dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-md font-semibold transition-colors text-black dark:text-gray-300"
                >
                  초기화
                </button>
              </div>

              {/* AI 면책 조항 */}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                AI가 생성한 문제로 실수가 있을 수 있습니다. 기존 문제와 유사할 경우 이는 우연의 일치입니다.
              </p>
            </form>
          </div>

          {/* 오른쪽: 생성된 문제 미리보기 */}
          <div className="bg-panel rounded-lg shadow-md p-6 h-full flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold text-main mb-6 flex-shrink-0">생성된 문제 미리보기</h2>

            <div className="flex-1 overflow-y-auto">
            {/* 초기 상태 */}
            {!generatedProblem && !loading && (
              <div className="text-center py-12 text-muted">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>문제 생성 버튼을 클릭하면</p>
                <p>AI가 생성한 문제가 여기에 표시됩니다</p>
              </div>
            )}

            {/* 로딩 상태 - SSE 실시간 진행 표시 */}
            {loading && (
              <div className="py-6">
                {/* 현재 진행 상태 */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-blue-700 dark:text-blue-300 font-medium">{generationStep}</p>
                </div>

                {/* 완료된 단계 목록 */}
                <div className="space-y-2 mb-6">
                  <p className="text-sm font-semibold text-sub mb-3">진행 상황</p>
                  {completedSteps.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-zinc-600 animate-pulse"></div>
                      <span>서버 연결 대기 중...</span>
                    </div>
                  ) : (
                    completedSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          index < completedSteps.length - 1
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white animate-pulse'
                        }`}>
                          {index < completedSteps.length - 1 ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span className={index < completedSteps.length - 1 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400 font-medium'}>
                          {step}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* 진행률 바 */}
                <div>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>진행률</span>
                    <span>{Math.min(completedSteps.length * 14, 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${Math.min(completedSteps.length * 14, 95)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted mt-2 text-center">
                    {completedSteps.length === 0
                      ? '풀에서 문제를 가져오는 중...'
                      : '풀이 비어 있어 AI가 문제를 생성하고 있습니다 (약 5-15초 소요)'}
                  </p>
                </div>
              </div>
            )}

            {/* 타이핑 중 (실시간 생성 효과) */}
            {generatedProblem && !typingComplete && (
              <div className="space-y-4">
                {/* 문제 제목 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColorClass(generatedProblem.difficulty)}`}>
                      {generatedProblem.difficulty}
                    </span>
                    <span className="text-sm text-muted">
                      문제 ID: #{generatedProblem.problemId}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-main">{generatedProblem.title}</h3>
                </div>

                {/* 실시간 타이핑 효과 */}
                <div className="bg-gray-900 rounded-lg p-4 min-h-[300px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <button
                      onClick={skipTyping}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      건너뛰기
                    </button>
                  </div>
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {displayedText}
                    <span className="animate-pulse text-white">|</span>
                  </pre>
                </div>

                {/* 진행률 표시 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700 dark:text-blue-400">문제 생성 중...</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {Math.round((displayedText.length / (generatedProblem.description?.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-900/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-100"
                      style={{
                        width: `${(displayedText.length / (generatedProblem.description?.length || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* 생성 완료 - 구조화된 출력 */}
            {generatedProblem && typingComplete && (
              <div className="space-y-4">
                {/* 문제 제목 */}
                <div className="border-b border-gray-200 dark:border-zinc-700 pb-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColorClass(generatedProblem.difficulty)}`}>
                      {generatedProblem.difficulty}
                    </span>
                    {/* 문제 태그 - ProblemDetail.jsx와 동일한 스타일 */}
                    {generatedProblem.algoProblemTags && (() => {
                      try {
                        const tags = JSON.parse(generatedProblem.algoProblemTags);
                        return tags.map((tag, idx) => (
                          <span key={idx} className="badge badge-tag">
                            {tag}
                          </span>
                        ));
                      } catch {
                        return <span className="badge badge-tag">{generatedProblem.algoProblemTags}</span>;
                      }
                    })()}
                    <span className="text-sm text-muted">
                      문제 ID: #{generatedProblem.problemId}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-main">{generatedProblem.title}</h3>
                </div>

                {/* 구조화된 문제 내용 - ProblemDetail.jsx와 동일한 스타일 */}
                {hasStructuredSections ? (
                  <div className="problem-content-area">
                    {/* 문제 설명 - description에서 입력/출력 앞부분만 추출 */}
                    <div className="section-card section-description">
                      <div className="section-header">
                        <span className="section-icon">📋</span>
                        <h2 className="section-title">문제 설명</h2>
                      </div>
                      <div className="section-content">
                        {renderFormattedText(
                          generatedProblem.inputFormat
                            ? extractPureDescription(generatedProblem.description)
                            : generatedProblem.description
                        )}
                      </div>
                    </div>

                    {/* 입력/출력 그리드 */}
                    {(generatedProblem.inputFormat || generatedProblem.outputFormat) && (
                      <div className="io-grid">
                        {generatedProblem.inputFormat && (
                          <div className="section-card section-input">
                            <div className="section-header">
                              <span className="section-icon">📥</span>
                              <h2 className="section-title">입력</h2>
                            </div>
                            <div className="section-content">
                              {renderFormattedText(generatedProblem.inputFormat)}
                            </div>
                          </div>
                        )}
                        {generatedProblem.outputFormat && (
                          <div className="section-card section-output">
                            <div className="section-header">
                              <span className="section-icon">📤</span>
                              <h2 className="section-title">출력</h2>
                            </div>
                            <div className="section-content">
                              {renderFormattedText(generatedProblem.outputFormat)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 제한사항 */}
                    {generatedProblem.constraints && (
                      <div className="section-card section-constraints">
                        <div className="section-header">
                          <span className="section-icon">⚠️</span>
                          <h2 className="section-title">제한 사항</h2>
                        </div>
                        <div className="section-content">
                          {renderFormattedText(generatedProblem.constraints)}
                        </div>
                      </div>
                    )}

                    {/* 예제 입출력 */}
                    {generatedProblem.testcases && generatedProblem.testcases.filter(tc => tc.isSample).length > 0 && (
                      <div className="examples-section">
                        <h2 className="section-title">예제 입출력</h2>
                        <div className="examples-container">
                          {generatedProblem.testcases.filter(tc => tc.isSample).map((tc, idx) => (
                            <div key={idx} className="example-grid">
                              <div className="example-item">
                                <h3 className="example-label">📝 예제 입력 {idx + 1}</h3>
                                <pre className="example-code">
                                  {tc.inputData || tc.input}
                                </pre>
                              </div>
                              <div className="example-item">
                                <h3 className="example-label">✅ 예제 출력 {idx + 1}</h3>
                                <pre className="example-code">
                                  {tc.expectedOutput || tc.output}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 섹션 구분 없는 경우: 전체 설명을 마크다운으로 출력 */
                  <div className="section-card section-description">
                    <div className="section-header">
                      <span className="section-icon">📋</span>
                      <h2 className="section-title">문제 설명</h2>
                    </div>
                    <div className="section-content">
                      {renderFormattedText(generatedProblem.description)}
                    </div>
                  </div>
                )}

                {/* 생성 정보 */}
                <div className={`rounded-lg p-4 ${generatedProblem.fromPool ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  <div className={`grid gap-4 text-sm ${generatedProblem.fromPool ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    <div>
                      <div className="text-muted">테스트케이스</div>
                      <div className="font-semibold text-main">{generatedProblem.testCaseCount}개</div>
                    </div>
                    <div>
                      <div className="text-muted">LLM 생성 시간</div>
                      <div className="font-semibold text-main">{generatedProblem.generationTime?.toFixed(2)}초</div>
                    </div>
                    {generatedProblem.fromPool && generatedProblem.fetchTime && (
                      <div>
                        <div className="text-muted">응답 시간</div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">{generatedProblem.fetchTime?.toFixed(2)}초</div>
                      </div>
                    )}
                    <div>
                      <div className="text-muted">제공 방식</div>
                      <div className={`font-semibold ${generatedProblem.fromPool ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {generatedProblem.fromPool ? '⚡ 즉시 제공' : '🤖 실시간 생성'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 성공 메시지 */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
                  <p className="font-medium">
                    {generatedProblem.fromPool ? '문제가 즉시 제공되었습니다!' : '문제가 성공적으로 생성되었습니다!'}
                  </p>
                  <p className="text-sm mt-1">이제 문제 목록에서 확인하거나 바로 풀이를 시작할 수 있습니다.</p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate(`/algorithm/problems/${generatedProblem.problemId}/solve`)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-md font-bold shadow-md transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    바로 문제 풀러 가기
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGoToProblemDetail(generatedProblem.problemId)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold transition-colors"
                    >
                      문제 상세 보기
                    </button>
                    <button
                      onClick={handleGoToProblemList}
                      className="flex-1 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 px-4 py-2 rounded-md font-semibold transition-colors dark:text-gray-300"
                    >
                      문제 목록으로
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemGenerator;
