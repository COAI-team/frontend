import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateProblem, completeMission } from '../../service/algorithm/AlgorithmApi';

/**
 * AI 문제 생성 페이지
 * - 타이핑 효과로 실시간 생성 시뮬레이션
 * - 구조화된 문제 출력
 */
const ProblemGenerator = () => {
  const navigate = useNavigate();

  // ===== 상태 관리 =====
  const [formData, setFormData] = useState({
    difficulty: 'BRONZE',
    topic: '',
    additionalRequirements: '',
    problemType: 'ALGORITHM',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedProblem, setGeneratedProblem] = useState(null);
  const [generationStep, setGenerationStep] = useState('');

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

  // ===== 상수 정의 =====
  const DIFFICULTY_OPTIONS = [
    { value: 'BRONZE', label: '브론즈 (초급)', color: 'orange', description: '기본 문법, 간단한 구현' },
    { value: 'SILVER', label: '실버 (초중급)', color: 'gray', description: '기본 알고리즘, 자료구조' },
    { value: 'GOLD', label: '골드 (중급)', color: 'yellow', description: '고급 알고리즘, 최적화' },
    { value: 'PLATINUM', label: '플래티넘 (고급)', color: 'blue', description: '복잡한 알고리즘, 수학적 사고' },
  ];

  // 카테고리별 알고리즘 토픽 (24개)
  const TOPIC_CATEGORIES_ALGO = {
    '기초': ['배열', '구현', '시뮬레이션', '재귀', '수학', '문자열'],
    '탐색': ['탐색', 'BFS', 'DFS', '이분탐색', '백트래킹'],
    '알고리즘': ['DP', '그리디', '정렬', '분할정복', '투포인터'],
    '그래프': ['그래프', '최단경로', 'MST', '위상정렬'],
    '자료구조': ['스택/큐', '트리', '힙', '유니온파인드'],
  };

  // 평면화된 토픽 배열 (기존 호환성 유지)
  const TOPIC_SUGGESTIONS_ALGO = Object.values(TOPIC_CATEGORIES_ALGO).flat();

  const TOPIC_SUGGESTIONS_SQL = [
    'SELECT', 'GROUP BY', 'String, Date', 'JOIN', 'SUM, MAX, MIN', 'IS NULL'
  ];

  // ===== 문제 설명 파싱 함수 =====
  const parseProblemDescription = (description) => {
    if (!description) return null;

    const sections = {
      description: '',
      input: '',
      output: '',
      constraints: '',
      exampleInput: '',
      exampleOutput: '',
    };

    // 섹션 구분자 패턴
    const patterns = {
      input: /(?:^|\n)(?:입력|Input)\s*(?::|：)?\s*\n?/i,
      output: /(?:^|\n)(?:출력|Output)\s*(?::|：)?\s*\n?/i,
      constraints: /(?:^|\n)(?:제한사항|제한|조건|Constraints?)\s*(?::|：)?\s*\n?/i,
      exampleInput: /(?:^|\n)(?:예제 ?입력|입력 ?예제|예시 ?입력|Sample Input|Example Input)\s*(?:\d*)\s*(?::|：)?\s*\n?/i,
      exampleOutput: /(?:^|\n)(?:예제 ?출력|출력 ?예제|예시 ?출력|Sample Output|Example Output)\s*(?:\d*)\s*(?::|：)?\s*\n?/i,
    };

    let remaining = description;
    let firstSectionStart = remaining.length;

    // 각 섹션의 시작 위치 찾기
    const sectionPositions = [];
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = remaining.match(pattern);
      if (match) {
        const pos = remaining.indexOf(match[0]);
        sectionPositions.push({ key, pos, matchLength: match[0].length });
        if (pos < firstSectionStart) {
          firstSectionStart = pos;
        }
      }
    }

    // 문제 설명 (첫 섹션 이전의 모든 텍스트)
    sections.description = remaining.substring(0, firstSectionStart).trim();

    // 위치순 정렬
    sectionPositions.sort((a, b) => a.pos - b.pos);

    // 각 섹션 내용 추출
    for (let i = 0; i < sectionPositions.length; i++) {
      const current = sectionPositions[i];
      const next = sectionPositions[i + 1];
      const startPos = current.pos + current.matchLength;
      const endPos = next ? next.pos : remaining.length;
      sections[current.key] = remaining.substring(startPos, endPos).trim();
    }

    return sections;
  };

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

    if (!formData.topic.trim()) {
      setError('문제 주제를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedProblem(null);
    setDisplayedText('');
    setTypingComplete(false);
    setGenerationStep('AI가 문제를 생성하고 있습니다...');

    console.log('AI 문제 생성 요청:', formData);

    try {
      const result = await generateProblem(formData);

      if (result.error) {
        setError(result.message || '문제 생성에 실패했습니다.');
        return;
      }

      console.log('AI 문제 생성 성공:', result.data);
      setGeneratedProblem(result.data);
      setGenerationStep('생성 완료!');

      // 🎯 데일리 미션 완료 처리 (PROBLEM_GENERATE)
      // TODO: 실제 로그인 구현 후 user.userId로 변경
      const testUserId = 3; // 개발용 테스트 userId
      try {
        const missionResult = await completeMission('PROBLEM_GENERATE', testUserId);
        console.log('🎯 미션 완료 API 응답 (전체):', JSON.stringify(missionResult, null, 2));

        const mResult = missionResult.data || missionResult;

        if (mResult.error) {
          // "이미 완료된 미션" 에러(ALGO_4501)는 정상 케이스로 처리
          if (mResult.code === 'ALGO_4501') {
            setMissionStatus({
              completed: true,
              message: '오늘의 미션은 이미 완료되었습니다',
              rewardPoints: 0,
              error: null
            });
            console.log('ℹ️ 오늘 미션은 이미 완료되었습니다.');
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
          console.log('ℹ️ 이미 완료된 미션');
        } else {
          // 에러가 아니면 성공으로 간주
          console.log('ℹ️ 예상치 못한 응답 구조, 성공으로 처리:', mResult);
          setMissionStatus({
            completed: true,
            message: 'AI 문제 생성 미션 완료!',
            rewardPoints: 0,
            error: null
          });
        }
      } catch (missionErr) {
        // "이미 완료된 미션" 에러(ALGO_4501)는 정상 케이스로 처리
        const errorCode = missionErr.response?.data?.code;
        const errorMessage = missionErr.response?.data?.message;

        if (errorCode === 'ALGO_4501') {
          // 이미 완료된 미션 - 에러가 아닌 정상 상태로 처리
          setMissionStatus({
            completed: true,
            message: '오늘의 미션은 이미 완료되었습니다',
            rewardPoints: 0,
            error: null
          });
          console.log('ℹ️ 오늘 미션은 이미 완료되었습니다.');
        } else {
          // 다른 에러는 경고로 처리 (문제 생성 자체는 성공했으므로)
          console.warn('미션 완료 처리 실패 (무시됨):', errorMessage || missionErr);
          setMissionStatus(prev => ({ ...prev, error: errorMessage || '미션 완료 처리 실패' }));
        }
      }

    } catch (err) {
      console.error('문제 생성 에러:', err);
      setError('문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
    }
    setFormData({
      difficulty: 'BRONZE',
      topic: '',
      additionalRequirements: '',
      problemType: 'ALGORITHM',
    });
    setGeneratedProblem(null);
    setError(null);
    setDisplayedText('');
    setTypingComplete(false);
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

  // 파싱된 문제 섹션
  const parsedSections = typingComplete
    ? parseProblemDescription(generatedProblem?.description)
    : null;

  // ===== 마크다운 텍스트 파싱 함수 =====
  const renderFormattedText = (text) => {
    if (!text) return null;

    // **text** 패턴을 찾아서 <strong>으로 변환
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      // **text** 패턴인 경우
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-main">
            {boldText}
          </strong>
        );
      }
      // 일반 텍스트
      return <span key={index}>{part}</span>;
    });
  };

  // ===== 섹션 렌더링 컴포넌트 =====
  const SectionCard = ({ title, icon, content, bgColor = 'bg-panel' }) => {
    if (!content) return null;
    return (
      <div className={`${bgColor} rounded-lg p-4 border border-gray-200 dark:border-zinc-700`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold text-main">{title}</h4>
        </div>
        <div className="text-sm text-sub whitespace-pre-wrap leading-relaxed">
          {renderFormattedText(content)}
        </div>
      </div>
    );
  };

  const CodeBlock = ({ title, icon, content }) => {
    if (!content) return null;
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span>{icon}</span>
          <span className="text-sm font-medium text-gray-300">{title}</span>
        </div>
        <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto">
          {content}
        </pre>
      </div>
    );
  };

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
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 text-white animate-pulse">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 문제 생성 폼 */}
          <div className="bg-panel rounded-lg shadow-md p-6">
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
                      className={`p-4 rounded-lg border-2 transition-all ${formData.difficulty === option.value
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

              {/* 문제 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-sub mb-3">
                  문제 유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('problemType', 'ALGORITHM')}
                    className={`p-4 rounded-lg border-2 transition-all ${
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
                    onClick={() => handleInputChange('problemType', 'SQL')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.problemType === 'SQL'
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-500'
                        : 'border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 bg-panel'
                    }`}
                  >
                    <div className={`font-semibold ${formData.problemType !== 'SQL' ? 'text-main' : ''}`}>SQL</div>
                    <div className="text-xs text-muted mt-1">데이터베이스 쿼리 문제</div>
                  </button>
                </div>
              </div>

              {/* 주제 선택 */}
              <div>
                <label className="block text-sm font-medium text-sub mb-3">
                  문제 주제 <span className="text-red-500">*</span>
                </label>
                {formData.problemType === 'SQL' ? (
                  // SQL 토픽 (기존 방식)
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_SUGGESTIONS_SQL.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleTopicSuggestionClick(topic)}
                        className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                          formData.topic === topic
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-500 font-semibold'
                            : 'bg-panel border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 text-sub'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                ) : (
                  // 알고리즘 토픽 (카테고리별)
                  <div className="space-y-3">
                    {Object.entries(TOPIC_CATEGORIES_ALGO).map(([category, topics]) => (
                      <div key={category}>
                        <div className="text-xs font-semibold text-muted mb-1.5">{category}</div>
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => handleTopicSuggestionClick(topic)}
                              className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                                formData.topic === topic
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-500 font-semibold'
                                  : 'bg-panel border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 text-sub'
                              }`}
                            >
                              {topic}
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

              {/* 추가 요구사항 */}
              <div>
                <label className="block text-sm font-medium text-sub mb-2">
                  추가 요구사항 (선택)
                </label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                  placeholder="예: 초보자용으로 쉽게, 실무 면접 수준..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-panel text-main placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* 버튼 그룹 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>AI가 문제를 생성하는 중...</span>
                    </>
                  ) : (
                    <span>문제 생성하기</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-md font-semibold transition-colors dark:text-gray-300"
                >
                  초기화
                </button>
              </div>
            </form>
          </div>

          {/* 오른쪽: 생성된 문제 미리보기 */}
          <div className="bg-panel rounded-lg shadow-md p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-xl font-bold text-main mb-6">생성된 문제 미리보기</h2>

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

            {/* 로딩 상태 */}
            {loading && (
              <div className="py-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sub font-medium">{generationStep}</p>
                </div>
                <div className="mt-6">
                  <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                  <p className="text-xs text-muted mt-2 text-center">약 3-5초 소요됩니다</p>
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

                {/* 구조화된 문제 내용 */}
                {parsedSections ? (
                  <div className="space-y-4">
                    {/* 문제 설명 */}
                    <SectionCard
                      title="문제 설명"
                      icon="📋"
                      content={parsedSections.description}
                      bgColor="bg-panel"
                    />

                    {/* 입력/출력 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SectionCard
                        title="입력"
                        icon="📥"
                        content={parsedSections.input}
                        bgColor="bg-blue-50 dark:bg-blue-900/20"
                      />
                      <SectionCard
                        title="출력"
                        icon="📤"
                        content={parsedSections.output}
                        bgColor="bg-green-50 dark:bg-green-900/20"
                      />
                    </div>

                    {/* 제한사항 */}
                    <SectionCard
                      title="제한사항"
                      icon="⚠️"
                      content={parsedSections.constraints}
                      bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                    />

                    {/* 예제 입출력 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CodeBlock
                        title="예제 입력"
                        icon="📝"
                        content={parsedSections.exampleInput}
                      />
                      <CodeBlock
                        title="예제 출력"
                        icon="✅"
                        content={parsedSections.exampleOutput}
                      />
                    </div>
                  </div>
                ) : (
                  /* 파싱 실패 시 원본 출력 (마크다운 포맷팅 적용) */
                  <div className="bg-panel rounded-lg p-4">
                    <div className="text-sm text-sub whitespace-pre-wrap leading-relaxed">
                      {renderFormattedText(generatedProblem.description)}
                    </div>
                  </div>
                )}

                {/* 생성 정보 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted">테스트케이스</div>
                      <div className="font-semibold text-main">{generatedProblem.testCaseCount}개</div>
                    </div>
                    <div>
                      <div className="text-muted">생성 시간</div>
                      <div className="font-semibold text-main">{generatedProblem.generationTime?.toFixed(2)}초</div>
                    </div>
                  </div>
                </div>

                {/* 성공 메시지 */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
                  <p className="font-medium">문제가 성공적으로 생성되었습니다!</p>
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
  );
};

export default ProblemGenerator;
