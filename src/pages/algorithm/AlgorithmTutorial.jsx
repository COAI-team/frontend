import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

/**
 * 알고리즘 튜토리얼 페이지
 *
 * 7단계 인터랙티브 온보딩:
 * 1. AI 문제 생성
 * 2. 모드 선택
 * 3. 기본 모드
 * 4. 집중 모드
 * 5. 코드 실행
 * 6. 제출
 * 7. AI 피드백
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY = 'coai_algorithm_tutorial';

// 튜토리얼 단계 정의
const TUTORIAL_STEPS = [
  {
    id: 1,
    title: 'AI 문제 생성',
    subtitle: '나만의 알고리즘 문제를 만들어보세요',
    icon: '🤖',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 2,
    title: '모드 선택',
    subtitle: '학습 스타일에 맞는 모드를 선택하세요',
    icon: '🎯',
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 3,
    title: '기본 모드',
    subtitle: '자유롭게 문제를 풀어보세요',
    icon: '✅',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 4,
    title: '집중 모드',
    subtitle: '시선 추적으로 집중력을 관리하세요',
    icon: '👁️',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 5,
    title: '코드 실행',
    subtitle: '작성한 코드를 테스트해보세요',
    icon: '▶️',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 6,
    title: '제출',
    subtitle: '코드를 제출하고 채점받으세요',
    icon: '📤',
    color: 'from-rose-500 to-red-600',
  },
  {
    id: 7,
    title: 'AI 피드백',
    subtitle: 'AI가 분석한 피드백을 확인하세요',
    icon: '💡',
    color: 'from-violet-500 to-purple-600',
  },
];

const AlgorithmTutorial = () => {
  const navigate = useNavigate();
  const { user } = useLogin();

  // 현재 단계 (1-7)
  const [currentStep, setCurrentStep] = useState(1);
  // 완료된 단계들
  const [completedSteps, setCompletedSteps] = useState([]);
  // 튜토리얼 완료 여부
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  // 인터랙티브 데모 상태
  const [demoState, setDemoState] = useState({});

  // localStorage에서 진행 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(parsed.completedSteps || []);
        setTutorialCompleted(parsed.tutorialCompleted || false);
        // 마지막으로 진행했던 단계로 복귀
        if (parsed.lastStep && !parsed.tutorialCompleted) {
          setCurrentStep(parsed.lastStep);
        }
      } catch (e) {
        console.error('튜토리얼 상태 로드 실패:', e);
      }
    }
  }, []);

  // 진행 상태 저장
  const saveProgress = useCallback((step, completed, isComplete = false) => {
    const data = {
      completedSteps: completed,
      lastStep: step,
      tutorialCompleted: isComplete,
      timestamp: Date.now(),
    };
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(data));
  }, []);

  // 단계 완료 처리
  const handleStepComplete = useCallback(() => {
    if (!completedSteps.includes(currentStep)) {
      const newCompleted = [...completedSteps, currentStep];
      setCompletedSteps(newCompleted);

      if (currentStep === 7) {
        // 마지막 단계 완료
        setTutorialCompleted(true);
        saveProgress(currentStep, newCompleted, true);
      } else {
        // 다음 단계로 이동
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setDemoState({}); // 데모 상태 초기화
        saveProgress(nextStep, newCompleted);
      }
    } else if (currentStep < 7) {
      // 이미 완료된 단계면 바로 다음으로
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setDemoState({});
      saveProgress(nextStep, completedSteps);
    }
  }, [currentStep, completedSteps, saveProgress]);

  // 이전 단계로 이동
  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setDemoState({});
      saveProgress(prevStep, completedSteps);
    }
  }, [currentStep, completedSteps, saveProgress]);

  // 특정 단계로 이동 (이미 완료한 단계만)
  const handleJumpToStep = useCallback((step) => {
    if (step <= currentStep || completedSteps.includes(step - 1) || step === 1) {
      setCurrentStep(step);
      setDemoState({});
      saveProgress(step, completedSteps);
    }
  }, [currentStep, completedSteps, saveProgress]);

  // 튜토리얼 건너뛰기
  const handleSkip = useCallback(() => {
    const allSteps = [1, 2, 3, 4, 5, 6, 7];
    setCompletedSteps(allSteps);
    setTutorialCompleted(true);
    saveProgress(7, allSteps, true);
  }, [saveProgress]);

  // 튜토리얼 초기화
  const handleReset = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setCurrentStep(1);
    setCompletedSteps([]);
    setTutorialCompleted(false);
    setDemoState({});
  }, []);

  // 현재 단계 정보
  const currentStepInfo = TUTORIAL_STEPS[currentStep - 1];
  const progress = (completedSteps.length / 7) * 100;

  // 완료 후 이동
  const handleComplete = () => {
    navigate('/algorithm/problems/generate');
  };

  return (
    <div className="min-h-screen bg-main">
      {/* 헤더 */}
      <div className="bg-panel shadow-sm border-b dark:border-zinc-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                ← 홈으로
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <h1 className="text-lg font-semibold text-main">
                🎓 알고리즘 튜토리얼
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {!tutorialCompleted && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm text-muted hover:text-main transition-colors"
                >
                  건너뛰기
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-muted hover:text-main transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="bg-panel border-b dark:border-zinc-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted">진행률</span>
                <span className="text-main font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 단계 인디케이터 */}
          <div className="flex items-center justify-between mt-4">
            {TUTORIAL_STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep || completedSteps.includes(step.id - 1) || step.id === 1;

              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && handleJumpToStep(step.id)}
                  disabled={!isAccessible}
                  className={`
                    relative flex flex-col items-center transition-all
                    ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                  `}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-lg
                      transition-all duration-300
                      ${isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? `bg-gradient-to-r ${step.color} text-white ring-4 ring-offset-2 ring-blue-300 dark:ring-blue-600 dark:ring-offset-zinc-900`
                          : 'bg-gray-200 dark:bg-zinc-700 text-muted'
                      }
                    `}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span className={`
                    text-xs mt-1 hidden md:block
                    ${isCurrent ? 'text-main font-medium' : 'text-muted'}
                  `}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        {tutorialCompleted ? (
          // 완료 화면
          <CompletionScreen onStart={handleComplete} onReset={handleReset} />
        ) : (
          // 현재 단계 컨텐츠
          <div className="max-w-4xl mx-auto">
            {/* 단계 헤더 */}
            <div className="text-center mb-8">
              <div className={`
                inline-flex items-center justify-center w-20 h-20 rounded-full mb-4
                bg-gradient-to-r ${currentStepInfo.color} text-white text-4xl
                shadow-lg
              `}>
                {currentStepInfo.icon}
              </div>
              <h2 className="text-2xl font-bold text-main mb-2">
                Step {currentStep}: {currentStepInfo.title}
              </h2>
              <p className="text-muted">{currentStepInfo.subtitle}</p>
            </div>

            {/* 단계별 데모 컴포넌트 */}
            <div className="bg-panel rounded-xl shadow-lg border dark:border-zinc-700 overflow-hidden">
              {currentStep === 1 && (
                <Step1Demo demoState={demoState} setDemoState={setDemoState} />
              )}
              {currentStep === 2 && (
                <Step2Demo demoState={demoState} setDemoState={setDemoState} />
              )}
              {currentStep === 3 && (
                <Step3Demo demoState={demoState} setDemoState={setDemoState} />
              )}
              {currentStep === 4 && (
                <Step4Demo demoState={demoState} setDemoState={setDemoState} />
              )}
              {currentStep === 5 && (
                <Step5Demo demoState={demoState} setDemoState={setDemoState} />
              )}
              {currentStep === 6 && (
                <Step6Demo demoState={demoState} setDemoState={setDemoState} />
              )}
              {currentStep === 7 && (
                <Step7Demo demoState={demoState} setDemoState={setDemoState} />
              )}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2
                  ${currentStep === 1
                    ? 'bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-zinc-700 text-main hover:bg-gray-300 dark:hover:bg-zinc-600'
                  }
                `}
              >
                ← 이전
              </button>

              <span className="text-muted text-sm">
                {currentStep} / 7
              </span>

              <button
                onClick={handleStepComplete}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2
                  bg-gradient-to-r ${currentStepInfo.color} text-white
                  hover:opacity-90 hover:shadow-lg
                `}
              >
                {currentStep === 7 ? '완료!' : '다음 →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 완료 화면 ====================
const CompletionScreen = ({ onStart, onReset }) => (
  <div className="max-w-2xl mx-auto text-center py-12">
    <div className="text-8xl mb-6">🎉</div>
    <h2 className="text-3xl font-bold text-main mb-4">
      튜토리얼 완료!
    </h2>
    <p className="text-muted text-lg mb-8">
      이제 알고리즘 문제 생성부터 AI 피드백까지<br />
      모든 기능을 자유롭게 사용할 수 있습니다.
    </p>

    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={onStart}
        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 hover:shadow-lg transition-all"
      >
        🚀 AI 문제 생성하러 가기
      </button>
      <button
        onClick={onReset}
        className="px-8 py-4 bg-gray-200 dark:bg-zinc-700 text-main rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-zinc-600 transition-all"
      >
        🔄 다시 보기
      </button>
    </div>

    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link
        to="/algorithm/problems"
        className="p-6 bg-panel rounded-xl border dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
      >
        <div className="text-3xl mb-2">📋</div>
        <h3 className="font-semibold text-main group-hover:text-blue-600 dark:group-hover:text-blue-400">
          문제 목록
        </h3>
        <p className="text-sm text-muted mt-1">기존 문제 풀어보기</p>
      </Link>

      <Link
        to="/algorithm/problems/generate"
        className="p-6 bg-panel rounded-xl border dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all group"
      >
        <div className="text-3xl mb-2">🤖</div>
        <h3 className="font-semibold text-main group-hover:text-purple-600 dark:group-hover:text-purple-400">
          AI 문제 생성
        </h3>
        <p className="text-sm text-muted mt-1">나만의 문제 만들기</p>
      </Link>

      <Link
        to="/mypage/daily-mission"
        className="p-6 bg-panel rounded-xl border dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-500 transition-all group"
      >
        <div className="text-3xl mb-2">🎯</div>
        <h3 className="font-semibold text-main group-hover:text-green-600 dark:group-hover:text-green-400">
          데일리 미션
        </h3>
        <p className="text-sm text-muted mt-1">포인트 획득하기</p>
      </Link>
    </div>
  </div>
);

// ==================== Step 1: AI 문제 생성 ====================
const Step1Demo = ({ demoState, setDemoState }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState(demoState.difficulty || '');
  const [selectedTopic, setSelectedTopic] = useState(demoState.topic || '');
  const [selectedTheme, setSelectedTheme] = useState(demoState.theme || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(demoState.generated || false);

  const difficulties = [
    { value: 'BRONZE', label: '브론즈', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
    { value: 'SILVER', label: '실버', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
    { value: 'GOLD', label: '골드', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
    { value: 'PLATINUM', label: '플래티넘', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  ];

  const topics = ['DFS/BFS', '동적 프로그래밍', '그리디', '스택/큐', '이분탐색'];
  const themes = ['🎅 산타의 선물 배달', '⛄ 눈싸움 대작전', '🎄 크리스마스 트리'];

  const handleGenerate = () => {
    if (!selectedDifficulty || !selectedTopic || !selectedTheme) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
      setDemoState({ difficulty: selectedDifficulty, topic: selectedTopic, theme: selectedTheme, generated: true });
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 설명 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <span>💡</span> AI 문제 생성이란?
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          AI가 선택한 난이도, 알고리즘 유형, 스토리 테마를 기반으로
          나만의 알고리즘 문제를 실시간으로 생성합니다.
          매번 새로운 문제를 경험할 수 있어요!
        </p>
      </div>

      {/* 인터랙티브 데모 */}
      <div className="space-y-4">
        {/* 난이도 선택 */}
        <div>
          <label className="block text-sm font-medium text-sub mb-2">
            1️⃣ 난이도를 선택하세요
          </label>
          <div className="grid grid-cols-4 gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff.value}
                onClick={() => setSelectedDifficulty(diff.value)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center
                  ${selectedDifficulty === diff.value
                    ? `${diff.color} border-current font-semibold ring-2 ring-offset-2 ring-blue-400`
                    : 'border-gray-200 dark:border-zinc-600 hover:border-gray-300'
                  }
                `}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* 주제 선택 */}
        <div>
          <label className="block text-sm font-medium text-sub mb-2">
            2️⃣ 알고리즘 유형을 선택하세요
          </label>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`
                  px-4 py-2 rounded-lg border transition-all
                  ${selectedTopic === topic
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-200 dark:border-zinc-600 hover:border-blue-400 text-sub'
                  }
                `}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* 테마 선택 */}
        <div>
          <label className="block text-sm font-medium text-sub mb-2">
            3️⃣ 스토리 테마를 선택하세요
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center text-sm
                  ${selectedTheme === theme
                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-800 dark:text-purple-300'
                    : 'border-gray-200 dark:border-zinc-600 hover:border-purple-400 text-sub'
                  }
                `}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* 생성 버튼 */}
        <div className="pt-4">
          <button
            onClick={handleGenerate}
            disabled={!selectedDifficulty || !selectedTopic || !selectedTheme || isGenerating || generated}
            className={`
              w-full py-4 rounded-lg font-semibold text-lg transition-all
              ${generated
                ? 'bg-green-500 text-white'
                : isGenerating
                  ? 'bg-gray-300 dark:bg-zinc-600 text-gray-500 cursor-wait'
                  : selectedDifficulty && selectedTopic && selectedTheme
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {generated ? '✅ 문제가 생성되었습니다!' : isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span> AI가 문제를 생성하는 중...
              </span>
            ) : '🚀 문제 생성하기'}
          </button>
        </div>

        {/* 생성 결과 미리보기 */}
        {generated && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-300">
                  "{selectedTheme.split(' ').slice(1).join(' ')}" - {selectedTopic} 문제
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  난이도: {difficulties.find(d => d.value === selectedDifficulty)?.label} |
                  생성 시간: 2.3초
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 팁 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>💡 팁:</strong> 스토리 테마는 계절마다 바뀝니다!
          지금은 겨울/연말 시즌 테마를 만나볼 수 있어요.
        </p>
      </div>
    </div>
  );
};

// ==================== Step 2: 모드 선택 ====================
const Step2Demo = ({ demoState, setDemoState }) => {
  const [selectedMode, setSelectedMode] = useState(demoState.mode || '');

  const modes = [
    {
      id: 'LEARN',
      icon: '🎓',
      title: '학습 모드',
      description: '튜터와 함께 연습해보세요',
      features: ['힌트 제공', '연습용 페이지', '타이머 없음'],
      color: 'border-green-500 bg-green-900/20',
      badge: 'Basic/Pro',
    },
    {
      id: 'BASIC',
      icon: '✅',
      title: '기본 모드',
      description: '자유롭게 문제를 풀어보세요',
      features: ['타이머 기능', '시간 설정 가능', '채점 기록 저장'],
      color: 'border-blue-500 bg-blue-900/20',
      badge: null,
    },
    {
      id: 'FOCUS',
      icon: '👁️',
      title: '집중 모드',
      description: '시선 추적으로 집중력을 관리하세요',
      features: ['시선 추적', '집중도 모니터링', '자동 타이머'],
      color: 'border-purple-500 bg-purple-900/20',
      badge: 'Pro',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 설명 */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
          <span>🎯</span> 모드 선택이란?
        </h3>
        <p className="text-sm text-purple-700 dark:text-purple-400">
          학습 스타일에 맞는 모드를 선택할 수 있습니다.
          학습 모드로 연습하고, 기본/집중 모드로 실력을 테스트하세요!
        </p>
      </div>

      {/* 모드 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => {
              setSelectedMode(mode.id);
              setDemoState({ mode: mode.id });
            }}
            className={`
              relative p-6 rounded-xl border-2 transition-all text-left
              ${selectedMode === mode.id
                ? `${mode.color}`
                : 'border-gray-200 dark:border-zinc-600 hover:border-gray-300'
              }
            `}
          >
            {mode.badge && (
              <span className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                {mode.badge}
              </span>
            )}
            <div className="text-4xl mb-3">{mode.icon}</div>
            <h4 className="font-bold text-main text-lg">{mode.title}</h4>
            <p className="text-sm text-muted mt-1">{mode.description}</p>
            <ul className="mt-3 space-y-1">
              {mode.features.map((feature, idx) => (
                <li key={idx} className="text-sm text-sub flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* 선택 결과 */}
      {selectedMode && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-300">
            <strong>선택한 모드:</strong> {modes.find(m => m.id === selectedMode)?.title}
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== Step 3: 기본 모드 ====================
const Step3Demo = ({ demoState, setDemoState }) => {
  const [timerMode, setTimerMode] = useState(demoState.timerMode || 'TIMER');
  const [time, setTime] = useState(demoState.time || 30);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(time * 60);

  useEffect(() => {
    let interval;
    if (isRunning && currentTime > 0) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (timerMode === 'TIMER') {
            return Math.max(0, prev - 1);
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, currentTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 설명 */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
          <span>✅</span> 기본 모드란?
        </h3>
        <p className="text-sm text-green-700 dark:text-green-400">
          자유롭게 문제를 풀 수 있는 모드입니다.
          타이머(카운트다운) 또는 스톱워치 중 선택하여 시간을 관리할 수 있어요.
        </p>
      </div>

      {/* 타이머 모드 선택 */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setTimerMode('TIMER');
            setCurrentTime(time * 60);
            setIsRunning(false);
          }}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            timerMode === 'TIMER'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-zinc-700 text-sub'
          }`}
        >
          ⏱️ 타이머 (카운트다운)
        </button>
        <button
          onClick={() => {
            setTimerMode('STOPWATCH');
            setCurrentTime(0);
            setIsRunning(false);
          }}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            timerMode === 'STOPWATCH'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-zinc-700 text-sub'
          }`}
        >
          ⏰ 스톱워치
        </button>
      </div>

      {/* 시간 설정 (타이머 모드만) */}
      {timerMode === 'TIMER' && !isRunning && (
        <div>
          <label className="block text-sm font-medium text-sub mb-2">
            풀이 시간 설정 (분)
          </label>
          <div className="flex gap-2">
            {[15, 30, 45, 60].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTime(t);
                  setCurrentTime(t * 60);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  time === t
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-zinc-700 text-sub hover:bg-gray-200 dark:hover:bg-zinc-600'
                }`}
              >
                {t}분
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 타이머 디스플레이 */}
      <div className="bg-zinc-900 rounded-xl p-8 text-center">
        <div className="text-6xl font-mono text-white mb-4">
          {formatTime(currentTime)}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2 rounded-lg font-medium ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? '⏸️ 일시정지' : '▶️ 시작'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setCurrentTime(timerMode === 'TIMER' ? time * 60 : 0);
            }}
            className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white"
          >
            🔄 초기화
          </button>
        </div>
      </div>

      {/* 팁 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>💡 팁:</strong> 타이머 위에 마우스를 올리면 시간을 직접 편집할 수 있어요!
        </p>
      </div>
    </div>
  );
};

// ==================== Step 4: 집중 모드 ====================
const Step4Demo = ({ demoState, setDemoState }) => {
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(demoState.calibrated || false);
  const [focusScore, setFocusScore] = useState(75);

  const handleCalibrate = () => {
    setCalibrating(true);
    setTimeout(() => {
      setCalibrating(false);
      setCalibrated(true);
      setDemoState({ calibrated: true });
    }, 2000);
  };

  const violations = [
    { type: '전체화면 이탈', penalty: '1.5점', color: 'text-yellow-500' },
    { type: '탭 전환', penalty: '2점', color: 'text-orange-500' },
    { type: '졸음 감지', penalty: '1.5점', color: 'text-yellow-500' },
    { type: '다중 인물', penalty: '3점', color: 'text-red-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 설명 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
          <span>👁️</span> 집중 모드란?
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          웹캠을 통해 시선을 추적하고 집중도를 모니터링합니다.
          전체화면에서 진행되며, 이탈 시 경고가 표시됩니다.
        </p>
      </div>

      {/* 캘리브레이션 데모 */}
      <div className="bg-zinc-900 rounded-xl p-6">
        <div className="text-center">
          <h4 className="text-white font-semibold mb-4">시선 추적 캘리브레이션</h4>

          {!calibrated ? (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-zinc-800 flex items-center justify-center">
                {calibrating ? (
                  <div className="animate-pulse text-4xl">👁️</div>
                ) : (
                  <span className="text-4xl">📷</span>
                )}
              </div>
              <button
                onClick={handleCalibrate}
                disabled={calibrating}
                className={`px-6 py-3 rounded-lg font-medium ${
                  calibrating
                    ? 'bg-gray-600 text-gray-400 cursor-wait'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {calibrating ? '캘리브레이션 중...' : '캘리브레이션 시작'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
              <p className="text-green-400">캘리브레이션 완료!</p>

              {/* 집중도 게이지 */}
              <div className="mt-6 max-w-xs mx-auto">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>집중도</span>
                  <span>{focusScore}점</span>
                </div>
                <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      focusScore >= 50 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(0, (focusScore + 100) / 2)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 위반 시스템 */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">⚠️ 위반 시스템</h4>
        <div className="grid grid-cols-2 gap-3">
          {violations.map((v, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-sub">{v.type}</span>
              <span className={v.color}>{v.penalty}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mt-3">
          * 7점 이상 누적 시 자동 제출됩니다
        </p>
      </div>
    </div>
  );
};

// ==================== Step 5: 코드 실행 ====================
const Step5Demo = ({ demoState, setDemoState }) => {
  const [code, setCode] = useState(demoState.code || 'def solution(n):\n    return n * 2');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(demoState.result || null);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setResult({
        status: 'success',
        output: '테스트 1: 통과\n테스트 2: 통과',
        time: '0.03s',
      });
      setDemoState({ code, result: { status: 'success' } });
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 설명 */}
      <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
        <h3 className="font-semibold text-cyan-800 dark:text-cyan-300 mb-2 flex items-center gap-2">
          <span>▶️</span> 코드 실행이란?
        </h3>
        <p className="text-sm text-cyan-700 dark:text-cyan-400">
          제출 전에 예제 테스트케이스로 코드를 테스트할 수 있습니다.
          실행 결과를 확인하고 디버깅에 활용하세요!
        </p>
      </div>

      {/* 미니 에디터 */}
      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <span className="text-sm text-gray-400">Python 3</span>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded text-sm font-medium ${
              isRunning
                ? 'bg-gray-600 text-gray-400 cursor-wait'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? '실행 중...' : '▶️ 실행'}
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-32 p-4 bg-zinc-900 text-green-400 font-mono text-sm resize-none focus:outline-none"
          placeholder="여기에 코드를 입력하세요..."
        />
      </div>

      {/* 실행 결과 */}
      {result && (
        <div className={`rounded-lg p-4 ${
          result.status === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <h4 className={`font-semibold mb-2 ${
            result.status === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
          }`}>
            {result.status === 'success' ? '✅ 테스트 통과' : '❌ 테스트 실패'}
          </h4>
          <pre className="text-sm font-mono whitespace-pre-wrap text-sub">
            {result.output}
          </pre>
          <p className="text-xs text-muted mt-2">실행 시간: {result.time}</p>
        </div>
      )}

      {/* 팁 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>💡 팁:</strong> 실행과 제출은 다릅니다!
          실행은 예제 테스트만, 제출은 모든 테스트케이스를 검증합니다.
        </p>
      </div>
    </div>
  );
};

// ==================== Step 6: 제출 ====================
const Step6Demo = ({ demoState, setDemoState }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(demoState.submitted || false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSubmitting(false);
          setSubmitted(true);
          setDemoState({ submitted: true });
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 설명 */}
      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
        <h3 className="font-semibold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-2">
          <span>📤</span> 제출이란?
        </h3>
        <p className="text-sm text-rose-700 dark:text-rose-400">
          코드를 제출하면 모든 테스트케이스로 채점이 진행됩니다.
          정답(AC)이면 AI 피드백을 받을 수 있어요!
        </p>
      </div>

      {/* 제출 시뮬레이션 */}
      <div className="bg-zinc-900 rounded-xl p-6 text-center">
        {!submitted ? (
          <>
            <div className="text-6xl mb-4">📤</div>
            <h4 className="text-white text-lg font-semibold mb-4">
              {isSubmitting ? '채점 중...' : '코드를 제출하시겠습니까?'}
            </h4>

            {isSubmitting && (
              <div className="max-w-xs mx-auto mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>진행률</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg font-semibold ${
                isSubmitting
                  ? 'bg-gray-600 text-gray-400 cursor-wait'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 text-white'
              }`}
            >
              {isSubmitting ? '채점 중...' : '제출하기'}
            </button>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="text-6xl mb-4">✅</div>
            <h4 className="text-green-400 text-xl font-bold mb-2">Accepted!</h4>
            <p className="text-gray-400">모든 테스트케이스를 통과했습니다</p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">5/5</div>
                <div className="text-xs text-gray-500">테스트 통과</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0.12s</div>
                <div className="text-xs text-gray-500">실행 시간</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">+50 XP</div>
                <div className="text-xs text-gray-500">획득 경험치</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 결과 유형 설명 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { code: 'AC', label: '정답', color: 'bg-green-500' },
          { code: 'WA', label: '오답', color: 'bg-red-500' },
          { code: 'TLE', label: '시간 초과', color: 'bg-yellow-500' },
          { code: 'RE', label: '런타임 에러', color: 'bg-orange-500' },
        ].map((r) => (
          <div key={r.code} className="flex items-center gap-2 p-2 bg-panel rounded-lg border dark:border-zinc-700">
            <span className={`w-3 h-3 rounded-full ${r.color}`}></span>
            <span className="text-sm text-main">{r.code}</span>
            <span className="text-xs text-muted">({r.label})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== Step 7: AI 피드백 ====================
const Step7Demo = ({ demoState, setDemoState }) => {
  const [loading, setLoading] = useState(!demoState.loaded);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
        setDemoState({ loaded: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, setDemoState]);

  const feedback = {
    score: 85,
    summary: '전반적으로 좋은 풀이입니다! 코드 구조가 명확하고 알고리즘 선택이 적절합니다.',
    strengths: [
      '효율적인 시간 복잡도 (O(n))',
      '깔끔한 변수 네이밍',
      '엣지 케이스 처리 양호',
    ],
    improvements: [
      '메모리 사용량 최적화 가능',
      '주석 추가 권장',
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* 설명 */}
      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
        <h3 className="font-semibold text-violet-800 dark:text-violet-300 mb-2 flex items-center gap-2">
          <span>💡</span> AI 피드백이란?
        </h3>
        <p className="text-sm text-violet-700 dark:text-violet-400">
          제출한 코드를 AI가 분석하여 강점과 개선점을 알려줍니다.
          코드 품질을 높이는 데 활용하세요!
        </p>
      </div>

      {/* AI 피드백 카드 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">🤖</div>
            <p className="text-indigo-700 dark:text-indigo-400">AI가 코드를 분석하고 있습니다...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 점수 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h4 className="font-bold text-main text-lg">AI 피드백</h4>
                  <p className="text-sm text-muted">코드 품질 분석</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {feedback.score}/100
                </div>
                <div className="text-xs text-muted">AI 점수</div>
              </div>
            </div>

            {/* 요약 */}
            <p className="text-sub">{feedback.summary}</p>

            {/* 상세 피드백 */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
            >
              {expanded ? '접기 ▲' : '상세 보기 ▼'}
            </button>

            {expanded && (
              <div className="space-y-4 pt-4 border-t border-indigo-200 dark:border-indigo-700">
                {/* 강점 */}
                <div>
                  <h5 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                    ✅ 잘한 점
                  </h5>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-sub flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 개선점 */}
                <div>
                  <h5 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">
                    💡 개선할 점
                  </h5>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-sub flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GitHub 커밋 */}
      <div className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐙</span>
          <div>
            <h4 className="text-white font-medium">GitHub 자동 커밋</h4>
            <p className="text-sm text-gray-400">정답 코드를 자동으로 저장하세요</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
          연동됨
        </span>
      </div>
    </div>
  );
};

export default AlgorithmTutorial;
