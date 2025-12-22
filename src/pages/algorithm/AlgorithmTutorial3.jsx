import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

/**
 * 알고리즘 튜토리얼 페이지 v3
 *
 * UI 스타일: 실제 페이지 위에 모달 오버레이 + 스포트라이트 하이라이트
 *
 * 실제 서비스 페이지를 배경으로 두고, 해당 영역을 하이라이트하며
 * 단계별로 튜토리얼을 진행합니다.
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY_ALGO = 'coai_algorithm_tutorial_v3';

// 튜토리얼 단계 정의
const TUTORIAL_STEPS = [
  // ===== 문제 생성 페이지 =====
  {
    id: 1,
    page: 'generator',
    target: 'difficulty',
    title: '난이도 선택',
    description: '브론즈(초급)부터 플래티넘(고급)까지 4단계 중 원하는 난이도를 선택하세요.',
    position: 'right',
  },
  {
    id: 2,
    page: 'generator',
    target: 'topic',
    title: '알고리즘 유형 선택',
    description: 'DFS/BFS, 동적 프로그래밍, 그리디 등 연습하고 싶은 알고리즘 유형을 선택하세요.',
    position: 'right',
  },
  {
    id: 3,
    page: 'generator',
    target: 'theme',
    title: '스토리 테마 선택',
    description: '계절마다 새로운 테마가 제공됩니다. 지금은 겨울/연말 시즌 테마를 만나보세요!',
    position: 'right',
  },
  {
    id: 4,
    page: 'generator',
    target: 'generate-btn',
    title: '문제 생성하기',
    description: '모든 옵션을 선택했다면, 버튼을 클릭하여 AI가 문제를 생성하도록 하세요!',
    position: 'top',
  },
  // ===== 모드 선택 페이지 =====
  {
    id: 5,
    page: 'mode-selection',
    target: 'learn-mode',
    title: '학습 모드',
    description: 'AI 튜터가 힌트를 제공합니다. 채점 기록과 별도로 연습할 수 있어요. (Basic/Pro 전용)',
    position: 'bottom',
  },
  {
    id: 6,
    page: 'mode-selection',
    target: 'basic-mode',
    title: '기본 모드',
    description: '자유롭게 타이머를 설정하고 풀이할 수 있는 일반적인 모드입니다.',
    position: 'bottom',
  },
  {
    id: 7,
    page: 'mode-selection',
    target: 'focus-mode',
    title: '집중 모드',
    description: '웹캠으로 시선을 추적하여 집중도를 모니터링합니다. 전체화면으로 진행됩니다. (Pro 전용)',
    position: 'bottom',
  },
  // ===== 문제 풀이 페이지 =====
  {
    id: 8,
    page: 'solve',
    target: 'problem-desc',
    title: '문제 설명',
    description: 'AI가 생성한 문제의 설명, 입출력 형식, 제한사항을 확인하세요.',
    position: 'right',
  },
  {
    id: 9,
    page: 'solve',
    target: 'code-editor',
    title: '코드 에디터',
    description: '여러 프로그래밍 언어를 지원합니다. 코드를 작성하세요!',
    position: 'left',
  },
  {
    id: 10,
    page: 'solve',
    target: 'timer',
    title: '타이머',
    description: '카운트다운 또는 스톱워치 모드로 풀이 시간을 관리할 수 있습니다.',
    position: 'bottom',
  },
  {
    id: 11,
    page: 'solve',
    target: 'run-btn',
    title: '코드 실행',
    description: '제출 전에 예제 테스트케이스로 코드를 테스트해보세요.',
    position: 'top',
  },
  {
    id: 12,
    page: 'solve',
    target: 'submit-btn',
    title: '코드 제출',
    description: '모든 테스트케이스로 채점이 진행됩니다. 정답이면 AI 피드백을 받을 수 있어요!',
    position: 'top',
  },
  // ===== 제출 결과 페이지 =====
  {
    id: 13,
    page: 'result',
    target: 'judge-result',
    title: '채점 결과',
    description: 'AC(정답), WA(오답), TLE(시간초과), RE(런타임에러) 등의 결과를 확인하세요.',
    position: 'bottom',
  },
  {
    id: 14,
    page: 'result',
    target: 'ai-feedback',
    title: 'AI 피드백',
    description: 'AI가 코드를 분석하여 강점과 개선점을 알려줍니다. 코드 품질 향상에 활용하세요!',
    position: 'left',
  },
  {
    id: 15,
    page: 'result',
    target: 'github-commit',
    title: 'GitHub 자동 커밋',
    description: '정답 코드를 GitHub에 자동으로 커밋할 수 있습니다. 프로필에서 연동하세요!',
    position: 'top',
  },
];

const AlgorithmTutorial3 = () => {
  const navigate = useNavigate();
  const { user } = useLogin();

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const highlightRefs = useRef({});

  // 현재 단계 정보
  const currentStepInfo = TUTORIAL_STEPS[currentStep];
  const currentPage = currentStepInfo?.page || 'generator';
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // localStorage에서 상태 로드 및 URL 파라미터 처리
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stepParam = searchParams.get('step');
    
    if (stepParam !== null) {
        // URL 파라미터가 있으면 강제로 해당 단계로 이동 (localStorage 무시)
        setCurrentStep(parseInt(stepParam, 10));
        return;
    }

    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY_ALGO);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tutorialCompleted) {
          setTutorialCompleted(true);
        } else if (parsed.lastStep) {
          setCurrentStep(parsed.lastStep);
        }
      } catch (e) {
        console.error('튜토리얼 상태 로드 실패:', e);
      }
    }
  }, []);

  // 상태 저장
  const saveProgress = useCallback((step, isComplete = false) => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY_ALGO, JSON.stringify({
      lastStep: step,
      tutorialCompleted: isComplete,
      timestamp: Date.now(),
    }));
  }, []);

  // 다음 단계
  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveProgress(nextStep);
    } else {
      setTutorialCompleted(true);
      saveProgress(currentStep, true);
    }
  }, [currentStep, saveProgress]);

  // 이전 단계
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(prevStep);
    }
  }, [currentStep, saveProgress]);

  // 건너뛰기
  const handleSkip = useCallback(() => {
    setTutorialCompleted(true);
    saveProgress(TUTORIAL_STEPS.length - 1, true);
  }, [saveProgress]);

  // 초기화
  const handleReset = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY_ALGO);
    setCurrentStep(0);
    setTutorialCompleted(false);
  }, []);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (tutorialCompleted) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSkip, tutorialCompleted]);

  if (tutorialCompleted) {
    return <CompletionScreen onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-main relative">
      {/* 실제 페이지 렌더링 (배경) */}
      <div className="relative z-0">
        {currentPage === 'generator' && (
          <MockProblemGenerator highlightRefs={highlightRefs} />
        )}
        {currentPage === 'mode-selection' && (
          <MockModeSelection highlightRefs={highlightRefs} />
        )}
        {currentPage === 'solve' && (
          <MockProblemSolve highlightRefs={highlightRefs} />
        )}
        {currentPage === 'result' && (
          <MockSubmissionResult highlightRefs={highlightRefs} />
        )}
      </div>

      {/* 오버레이 + 스포트라이트 */}
      {isVisible && (
        <TutorialOverlay
          step={currentStepInfo}
          currentStep={currentStep}
          totalSteps={TUTORIAL_STEPS.length}
          progress={progress}
          highlightRefs={highlightRefs}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
};

// ==================== 튜토리얼 오버레이 ====================
const TutorialOverlay = ({
  step,
  currentStep,
  totalSteps,
  progress,
  highlightRefs,
  onNext,
  onPrev,
  onSkip,
}) => {
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [highlightStyle, setHighlightStyle] = useState({});

  // 하이라이트 위치 계산
  useEffect(() => {
    const targetRef = highlightRefs.current[step.target];
    if (targetRef) {
      const rect = targetRef.getBoundingClientRect();
      const padding = 8;

      setHighlightStyle({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // 툴팁 위치 계산
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      let tooltipTop, tooltipLeft;

      switch (step.position) {
        case 'top':
          tooltipTop = rect.top - tooltipHeight - 20 + window.scrollY;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          tooltipTop = rect.bottom + 20 + window.scrollY;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
          tooltipLeft = rect.left - tooltipWidth - 20;
          break;
        case 'right':
        default:
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
          tooltipLeft = rect.right + 20;
          break;
      }

      // 화면 경계 조정
      tooltipLeft = Math.max(20, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 20));
      tooltipTop = Math.max(20, tooltipTop);

      setTooltipStyle({
        top: tooltipTop,
        left: tooltipLeft,
        width: tooltipWidth,
      });
    }
  }, [step, highlightRefs]);

  return (
    <>
      {/* 어두운 오버레이 (스포트라이트 효과) */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={highlightStyle.left}
                y={highlightStyle.top}
                width={highlightStyle.width}
                height={highlightStyle.height}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* 하이라이트 테두리 */}
      <div
        className="fixed z-50 pointer-events-none rounded-xl border-2 border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.3)] transition-all duration-300"
        style={{
          top: highlightStyle.top,
          left: highlightStyle.left,
          width: highlightStyle.width,
          height: highlightStyle.height,
        }}
      />

      {/* 펄스 애니메이션 */}
      <div
        className="fixed z-50 pointer-events-none rounded-xl animate-ping border-2 border-blue-400 opacity-75"
        style={{
          top: highlightStyle.top,
          left: highlightStyle.left,
          width: highlightStyle.width,
          height: highlightStyle.height,
          animationDuration: '2s',
        }}
      />

      {/* 상단 진행률 바 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">튜토리얼</span>
            <span className="text-white/60 text-sm">{currentStep + 1} / {totalSteps}</span>
          </div>
          <button
            onClick={onSkip}
            className="px-4 py-1.5 text-white/70 hover:text-white text-sm transition-colors"
          >
            건너뛰기
          </button>
        </div>
        <div className="h-1 bg-zinc-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 툴팁 카드 */}
      <div
        className="fixed z-50 animate-fade-in"
        style={tooltipStyle}
      >
        <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
          {/* 헤더 */}
          <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {currentStep + 1}
              </span>
              <h3 className="text-white font-bold text-lg">{step.title}</h3>
            </div>
          </div>

          {/* 본문 */}
          <div className="px-5 py-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* 네비게이션 */}
          <div className="px-5 py-3 bg-zinc-800/50 flex items-center justify-between">
            <button
              onClick={onPrev}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentStep === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-white bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              ← 이전
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalSteps, 15) }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-blue-500 w-4'
                      : idx < currentStep
                        ? 'bg-blue-400/50'
                        : 'bg-zinc-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={onNext}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              {currentStep === totalSteps - 1 ? '완료' : '다음 →'}
            </button>
          </div>
        </div>

        {/* 화살표 포인터 */}
        <div
          className={`absolute w-4 h-4 bg-zinc-900 border-zinc-700 transform rotate-45 ${
            step.position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2 border-r border-b' :
            step.position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2 border-l border-t' :
            step.position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2 border-t border-r' :
            'left-[-8px] top-1/2 -translate-y-1/2 border-b border-l'
          }`}
        />
      </div>

      {/* 키보드 힌트 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-zinc-800/90 backdrop-blur-sm px-4 py-2 rounded-full text-white/60 text-xs">
          ← → 키로 이동 | Enter 다음 | Esc 건너뛰기
        </div>
      </div>
    </>
  );
};

// ==================== Mock 문제 생성 페이지 ====================
const MockProblemGenerator = ({ highlightRefs }) => {
  const difficulties = [
    { value: 'BRONZE', label: '브론즈 (초급)', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
    { value: 'SILVER', label: '실버 (초중급)', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
    { value: 'GOLD', label: '골드 (중급)', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
    { value: 'PLATINUM', label: '플래티넘 (고급)', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  ];

  const topics = [
    { category: '자료구조', items: ['해시', '스택/큐', '힙', '트리'] },
    { category: '탐색', items: ['DFS/BFS', '완전탐색', '백트래킹', '이분탐색'] },
    { category: '최적화', items: ['그리디', 'DP'] },
  ];

  const themes = [
    { value: 'SANTA', label: '🎅 산타의 선물 배달' },
    { value: 'SNOWBALL', label: '⛄ 눈싸움 대작전' },
    { value: 'TREE', label: '🎄 크리스마스 트리' },
  ];

  return (
    <div className="min-h-screen bg-main py-8 pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-main mb-2">AI 문제 생성</h1>
          <p className="text-muted">원하는 난이도와 주제를 선택하면 AI가 문제를 생성합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 설정 폼 */}
          <div className="bg-panel rounded-lg shadow-md p-5">
            <h2 className="text-xl font-bold text-main mb-4">문제 생성 설정</h2>

            {/* 난이도 선택 */}
            <div
              ref={el => highlightRefs.current['difficulty'] = el}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-sub mb-2">
                난이도 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {difficulties.map((diff) => (
                  <button
                    key={diff.value}
                    className={`p-3 rounded-lg border transition-all ${
                      diff.value === 'SILVER'
                        ? `${diff.color} border-current`
                        : 'border-gray-200 dark:border-zinc-600'
                    }`}
                  >
                    <div className="font-semibold text-main">{diff.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 알고리즘 유형 */}
            <div
              ref={el => highlightRefs.current['topic'] = el}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-sub mb-2">
                알고리즘 유형 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {topics.map((cat) => (
                  <div key={cat.category}>
                    <div className="text-xs font-semibold text-muted mb-1">{cat.category}</div>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <button
                          key={item}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                            item === 'DFS/BFS'
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-200 dark:border-zinc-600 text-sub'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 스토리 테마 */}
            <div
              ref={el => highlightRefs.current['theme'] = el}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-sub mb-2">
                스토리 테마 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    className={`p-3 rounded-lg border-2 transition-all text-center text-sm ${
                      theme.value === 'SANTA'
                        ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500'
                        : 'border-gray-200 dark:border-zinc-600'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 생성 버튼 */}
            <div
              ref={el => highlightRefs.current['generate-btn'] = el}
            >
              <button className="w-full py-4 rounded-lg font-semibold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                🚀 문제 생성하기
              </button>
            </div>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="bg-panel rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-main mb-6">생성된 문제 미리보기</h2>
            <div className="text-center py-12 text-muted">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>문제 생성 버튼을 클릭하면</p>
              <p>AI가 생성한 문제가 여기에 표시됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Mock 모드 선택 페이지 ====================
const MockModeSelection = ({ highlightRefs }) => {
  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100 pt-20">
      <div className="bg-zinc-800 border-b border-zinc-700">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-xl font-bold">#1234 산타의 선물 배달 최적화</h1>
          <p className="text-sm text-gray-400 mt-1">맞힌사람 42 • 제출 128</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 학습 모드 */}
            <div
              ref={el => highlightRefs.current['learn-mode'] = el}
              className="p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800"
            >
              <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                Basic/Pro
              </div>
              <div className="text-center mb-4">
                <span className="text-4xl">🎓</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">학습 모드</h3>
              <p className="text-gray-400 text-sm text-center mb-4">튜터와 함께 연습해보세요</p>
              <ul className="text-sm space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 힌트 제공</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 연습용 페이지</li>
                <li className="flex items-center gap-2"><span className="text-gray-500">✗</span> 타이머 없음</li>
              </ul>
            </div>

            {/* 기본 모드 */}
            <div
              ref={el => highlightRefs.current['basic-mode'] = el}
              className="p-6 rounded-xl border-2 border-blue-500 bg-blue-900/20"
            >
              <div className="text-center mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">기본 모드</h3>
              <p className="text-gray-400 text-sm text-center mb-4">자유롭게 문제를 풀어보세요</p>
              <ul className="text-sm space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 타이머 기능</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 시간 설정 가능</li>
                <li className="flex items-center gap-2"><span className="text-gray-500">✗</span> 시선 추적 없음</li>
              </ul>
            </div>

            {/* 집중 모드 */}
            <div
              ref={el => highlightRefs.current['focus-mode'] = el}
              className="p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800 relative"
            >
              <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                PRO
              </div>
              <div className="text-center mb-4">
                <span className="text-4xl">👁️</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">집중 모드</h3>
              <p className="text-gray-400 text-sm text-center mb-4">시선 추적으로 집중력을 관리하세요</p>
              <ul className="text-sm space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 타이머 자동 시작</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 시선 추적</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 집중도 모니터링</li>
              </ul>
            </div>
          </div>

          {/* 시작 버튼 */}
          <div className="mt-8 text-center">
            <button className="px-8 py-3 rounded-lg font-semibold text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              기본 모드로 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Mock 문제 풀이 페이지 ====================
const MockProblemSolve = ({ highlightRefs }) => {
  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100 pt-20">
      {/* 헤더 */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">#1234 산타의 선물 배달 최적화</span>
            <span className="px-2 py-1 bg-gray-700 rounded text-sm">실버</span>
          </div>
          <div
            ref={el => highlightRefs.current['timer'] = el}
            className="flex items-center gap-2 bg-zinc-700 px-4 py-2 rounded-lg"
          >
            <span className="text-2xl">⏱️</span>
            <span className="text-2xl font-mono text-white">29:45</span>
          </div>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* 왼쪽: 문제 설명 */}
        <div
          ref={el => highlightRefs.current['problem-desc'] = el}
          className="w-1/2 p-6 overflow-auto border-r border-zinc-700"
        >
          <h2 className="text-xl font-bold mb-4">문제 설명</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              산타클로스는 크리스마스 이브에 N개의 집에 선물을 배달해야 합니다.
              각 집은 2차원 좌표 평면 위에 위치하고 있으며, 산타는 원점(0, 0)에서 출발합니다.
            </p>
            <p className="text-gray-300 mb-4">
              산타가 모든 집을 방문하는 최단 경로의 길이를 구하세요.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-2">입력</h3>
            <p className="text-gray-300">첫째 줄에 집의 개수 N이 주어집니다. (1 ≤ N ≤ 10)</p>

            <h3 className="text-lg font-semibold mt-6 mb-2">출력</h3>
            <p className="text-gray-300">최단 경로의 길이를 소수점 둘째 자리까지 출력합니다.</p>

            <h3 className="text-lg font-semibold mt-6 mb-2">예제</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">입력</div>
                <pre className="text-green-400 text-sm">3{'\n'}1 1{'\n'}2 2{'\n'}3 1</pre>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">출력</div>
                <pre className="text-green-400 text-sm">7.24</pre>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 에디터 + 결과 */}
        <div className="w-1/2 flex flex-col">
          {/* 에디터 */}
          <div
            ref={el => highlightRefs.current['code-editor'] = el}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
              <select className="bg-zinc-700 text-white px-3 py-1 rounded text-sm">
                <option>Python 3</option>
                <option>Java</option>
                <option>C++</option>
              </select>
            </div>
            <div className="flex-1 bg-zinc-950 p-4 font-mono text-sm">
              <div className="text-purple-400">import <span className="text-white">math</span></div>
              <div className="text-purple-400">from <span className="text-white">itertools</span> import <span className="text-white">permutations</span></div>
              <div className="mt-2"></div>
              <div className="text-purple-400">def <span className="text-blue-400">solution</span>(houses):</div>
              <div className="text-gray-500 pl-4"># 코드를 작성하세요</div>
              <div className="text-purple-400 pl-4">pass</div>
            </div>
          </div>

          {/* 실행/제출 버튼 */}
          <div className="flex gap-2 p-4 bg-zinc-800 border-t border-zinc-700">
            <button
              ref={el => highlightRefs.current['run-btn'] = el}
              className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium"
            >
              ▶ 실행
            </button>
            <button
              ref={el => highlightRefs.current['submit-btn'] = el}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium"
            >
              📤 제출
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Mock 제출 결과 페이지 ====================
const MockSubmissionResult = ({ highlightRefs }) => {
  return (
    <div className="min-h-screen bg-main pt-20">
      {/* 헤더 */}
      <div className="bg-panel shadow-sm border-b dark:border-zinc-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <span className="text-blue-600 dark:text-blue-400">← 문제 목록</span>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-main">📊 제출 결과</h1>
            <span className="text-muted">제출 #5678</span>
          </div>
        </div>
      </div>

      {/* 메인 */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 결과 요약 */}
          <div
            ref={el => highlightRefs.current['judge-result'] = el}
            className="bg-panel rounded-lg shadow-sm border dark:border-zinc-700 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">📝 문제</h3>
                <p className="text-lg font-semibold text-main">#1234 산타의 선물 배달</p>
                <span className="inline-block mt-1 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-zinc-700">실버</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">⚖️ 판정</h3>
                <div className="inline-flex items-center px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <span className="text-xl mr-2">✅</span>
                  <span className="font-semibold text-green-600">Accepted</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">🧪 테스트</h3>
                <p className="text-lg font-semibold text-main">10/10</p>
                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-1">
                  <div className="h-2 rounded-full bg-green-500 w-full"></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">🤖 AI 점수</h3>
                <p className="text-lg font-semibold text-main">85/100</p>
                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-1">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 실행 결과 */}
            <div className="bg-panel rounded-lg shadow-sm border dark:border-zinc-700 p-6">
              <h3 className="text-lg font-semibold text-main mb-4">📈 실행 결과</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted">실행 시간:</span>
                  <span className="font-mono text-main">0.124s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">메모리 사용량:</span>
                  <span className="font-mono text-main">31,256KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">사용 언어:</span>
                  <span className="font-medium text-main">Python 3</span>
                </div>
              </div>
            </div>

            {/* AI 피드백 */}
            <div
              ref={el => highlightRefs.current['ai-feedback'] = el}
              className="bg-panel rounded-lg shadow-sm border dark:border-zinc-700 p-6"
            >
              <h3 className="text-lg font-semibold text-main mb-4">🤖 AI 피드백</h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl">
                <p className="text-sub mb-3">전반적으로 좋은 풀이입니다!</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sub">효율적인 시간 복잡도 (O(n!))</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sub">깔끔한 코드 구조</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">!</span>
                    <span className="text-sub">메모리 최적화 가능</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GitHub 커밋 */}
          <div
            ref={el => highlightRefs.current['github-commit'] = el}
            className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐙</span>
              <div>
                <h4 className="text-white font-medium">GitHub 자동 커밋</h4>
                <p className="text-sm text-gray-400">정답 코드가 자동으로 저장되었습니다</p>
              </div>
            </div>
            <a href="#" className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">
              커밋 보기 →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 완료 화면 ====================
const CompletionScreen = ({ onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="text-8xl mb-8 animate-bounce">🎉</div>
        <h1 className="text-5xl font-bold text-white mb-4">튜토리얼 완료!</h1>
        <p className="text-xl text-white/80 mb-12">
          이제 실제로 AI 문제를 생성하고<br />
          풀이를 시작해보세요!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/algorithm/problems/generate')}
            className="px-8 py-4 bg-white text-purple-900 rounded-2xl font-bold text-lg hover:scale-105 transition-all"
          >
            🚀 AI 문제 생성하기
          </button>
          <button
            onClick={onReset}
            className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-all"
          >
            🔄 다시 보기
          </button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Link to="/algorithm/problems" className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-white/80 text-sm">문제 목록</div>
          </Link>
          <Link to="/mypage/daily-mission" className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-white/80 text-sm">데일리 미션</div>
          </Link>
          <Link to="/pricing" className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-white/80 text-sm">구독하기</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTutorial3;
