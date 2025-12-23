import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

/**
 * 알고리즘 튜토리얼 3: 문제 풀이 (Steps 8-12)
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY_ALGO_3 = 'coai_algorithm_tutorial_v3_3';

// 튜토리얼 단계 정의
const TUTORIAL_STEPS = [
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
];

const AlgorithmTutorialSolve = () => {
  const navigate = useNavigate();
  const { user } = useLogin();

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const highlightRefs = useRef({});

  // 현재 단계 정보
  const currentStepInfo = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stepParam = searchParams.get('step');
    if (stepParam !== null) {
        setCurrentStep(parseInt(stepParam, 10));
        return;
    }
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY_ALGO_3);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tutorialCompleted) {
          setTutorialCompleted(true);
        } else if (parsed.lastStep) {
          setCurrentStep(parsed.lastStep);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  const saveProgress = useCallback((step, isComplete = false) => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY_ALGO_3, JSON.stringify({
      lastStep: step,
      tutorialCompleted: isComplete,
      timestamp: Date.now(),
    }));
  }, []);

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

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(prevStep);
    }
  }, [currentStep, saveProgress]);

  const handleSkip = useCallback(() => {
    setTutorialCompleted(true);
    saveProgress(TUTORIAL_STEPS.length - 1, true);
  }, [saveProgress]);

  const handleReset = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY_ALGO_3);
    setCurrentStep(0);
    setTutorialCompleted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (tutorialCompleted) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSkip, tutorialCompleted]);

  // URL 파라미터에서 problemId 확인
  const searchParams = new URLSearchParams(window.location.search);
  const problemId = searchParams.get('problemId');
  const nextUrl = problemId ? `/algorithm/problems/${problemId}/solve` : '/algorithm/problems';

  if (tutorialCompleted) {
    return (
        <CompletionScreen 
            onReset={handleReset} 
            title="문제 풀이 튜토리얼 완료!"
            actionText="문제 목록으로"
            onAction={() => navigate(nextUrl)}
        />
    );
  }

  return (
    <div className="min-h-screen bg-main relative">
      <div className="relative">
          <MockProblemSolve highlightRefs={highlightRefs} />
      </div>

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

const TutorialOverlay = ({ step, currentStep, totalSteps, progress, highlightRefs, onNext, onPrev, onSkip }) => {
  const [tooltipStyle, setTooltipStyle] = useState({});

  useEffect(() => {
    const targetRef = highlightRefs.current[step.target];
    
    // Global Scroll Logic
    const handleScroll = () => {
        const scrollContainer = document.getElementById('scrollArea') || window;
        if (targetRef) {
             targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    
    handleScroll();

    if (targetRef) {
      // Apply border highlight directly to element
      targetRef.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'dark:ring-offset-[#0d1117]', 'transition-all', 'duration-300', 'z-50', 'relative');
    }

    return () => {
        if (targetRef) {
            targetRef.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'dark:ring-offset-[#0d1117]', 'transition-all', 'duration-300', 'z-50', 'relative');
        }
    };
  }, [step, highlightRefs, currentStep]);

  useEffect(() => {
    if (!highlightRefs.current[step.target]) return;
    
    const targetRef = highlightRefs.current[step.target];
    const rect = targetRef.getBoundingClientRect();
    
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

    tooltipLeft = Math.max(20, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 20));
    tooltipTop = Math.max(20, tooltipTop);

    setTooltipStyle({
      top: tooltipTop,
      left: tooltipLeft,
      width: tooltipWidth,
    });
  }, [step, highlightRefs]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-none" />
      
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">튜토리얼 (풀이)</span>
            <span className="text-white/60 text-sm">{currentStep + 1} / {totalSteps}</span>
          </div>
          <button onClick={onSkip} className="px-4 py-1.5 text-white/70 hover:text-white text-sm transition-colors">건너뛰기</button>
        </div>
        <div className="h-1 bg-zinc-700">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="fixed z-50 animate-fade-in" style={tooltipStyle}>
        <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">{currentStep + 1}</span>
              <h3 className="text-white font-bold text-lg">{step.title}</h3>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
          </div>
          <div className="px-5 py-3 bg-zinc-800/50 flex items-center justify-between">
            <button onClick={onPrev} disabled={currentStep === 0} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-white bg-zinc-700 hover:bg-zinc-600'}`}>← 이전</button>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentStep ? 'bg-blue-500 w-4' : idx < currentStep ? 'bg-blue-400/50' : 'bg-zinc-600'}`} />
              ))}
            </div>
            <button onClick={onNext} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all">{currentStep === totalSteps - 1 ? '완료' : '다음 →'}</button>
          </div>
        </div>
        <div className={`absolute w-4 h-4 bg-zinc-900 border-zinc-700 transform rotate-45 ${step.position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2 border-r border-b' : step.position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2 border-l border-t' : step.position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2 border-t border-r' : 'left-[-8px] top-1/2 -translate-y-1/2 border-b border-l'}`} />
      </div>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-zinc-800/90 backdrop-blur-sm px-4 py-2 rounded-full text-white/60 text-xs">← → 키로 이동 | Enter 다음 | Esc 건너뛰기</div>
      </div>
    </>
  );
};

const MockProblemSolve = ({ highlightRefs }) => {
  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100 pt-20">
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">#1234 산타의 선물 배달 최적화</span>
            <span className="px-2 py-1 bg-gray-700 rounded text-sm">실버</span>
          </div>
          <div ref={el => highlightRefs.current['timer'] = el} className="flex items-center gap-2 bg-zinc-700 px-4 py-2 rounded-lg">
            <span className="text-2xl">⏱️</span><span className="text-2xl font-mono text-white">29:45</span>
          </div>
        </div>
      </div>
      <div className="flex h-[calc(100vh-140px)]">
        <div ref={el => highlightRefs.current['problem-desc'] = el} className="w-1/2 p-6 overflow-auto border-r border-zinc-700">
          <h2 className="text-xl font-bold mb-4">문제 설명</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">산타클로스는 크리스마스 이브에 N개의 집에 선물을 배달해야 합니다. 각 집은 2차원 좌표 평면 위에 위치하고 있으며, 산타는 원점(0, 0)에서 출발합니다.</p>
            <p className="text-gray-300 mb-4">산타가 모든 집을 방문하는 최단 경로의 길이를 구하세요.</p>
            <h3 className="text-lg font-semibold mt-6 mb-2">입력</h3><p className="text-gray-300">첫째 줄에 집의 개수 N이 주어집니다. (1 ≤ N ≤ 10)</p>
            <h3 className="text-lg font-semibold mt-6 mb-2">출력</h3><p className="text-gray-300">최단 경로의 길이를 소수점 둘째 자리까지 출력합니다.</p>
            <h3 className="text-lg font-semibold mt-6 mb-2">예제</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-zinc-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">입력</div><pre className="text-green-400 text-sm">3{'\n'}1 1{'\n'}2 2{'\n'}3 1</pre></div>
              <div className="bg-zinc-800 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">출력</div><pre className="text-green-400 text-sm">7.24</pre></div>
            </div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div ref={el => highlightRefs.current['code-editor'] = el} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
              <select className="bg-zinc-700 text-white px-3 py-1 rounded text-sm"><option>Python 3</option><option>Java</option><option>C++</option></select>
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
          <div className="flex gap-2 p-4 bg-zinc-800 border-t border-zinc-700">
            <button ref={el => highlightRefs.current['run-btn'] = el} className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium">▶ 실행</button>
            <button ref={el => highlightRefs.current['submit-btn'] = el} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium">📤 제출</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompletionScreen = ({ onReset, title, actionText, onAction }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="text-8xl mb-8 animate-bounce">🎉</div>
        <h1 className="text-5xl font-bold text-white mb-4">{title}</h1>
        <p className="text-xl text-white/80 mb-12">이제 다음 단계로 넘어가볼까요?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onAction} className="px-8 py-4 bg-white text-purple-900 rounded-2xl font-bold text-lg hover:scale-105 transition-all">{actionText}</button>
          <button onClick={onReset} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-all">🔄 다시 보기</button>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTutorialSolve;
