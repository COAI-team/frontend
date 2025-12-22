import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

/**
 * 알고리즘 튜토리얼 2: 모드 선택 (Steps 5-7)
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY_ALGO_2 = 'coai_algorithm_tutorial_v3_2';

// 튜토리얼 단계 정의
const TUTORIAL_STEPS = [
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
];

const AlgorithmTutorialMode = () => {
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
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY_ALGO_2);
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
    localStorage.setItem(TUTORIAL_STORAGE_KEY_ALGO_2, JSON.stringify({
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
    localStorage.removeItem(TUTORIAL_STORAGE_KEY_ALGO_2);
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
            title="모드 선택 튜토리얼 완료!"
            actionText="문제 풀러 가기"
            onAction={() => navigate(nextUrl)}
        />
    );
  }

  return (
    <div className="min-h-screen bg-main relative">
      <div className="relative">
          <MockModeSelection highlightRefs={highlightRefs} />
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
            <span className="text-white font-medium">튜토리얼 (모드)</span>
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
            <div ref={el => highlightRefs.current['learn-mode'] = el} className="p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800">
              <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">Basic/Pro</div>
              <div className="text-center mb-4"><span className="text-4xl">🎓</span></div>
              <h3 className="text-xl font-bold text-center mb-2">학습 모드</h3>
              <p className="text-gray-400 text-sm text-center mb-4">튜터와 함께 연습해보세요</p>
              <ul className="text-sm space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 힌트 제공</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 연습용 페이지</li>
                <li className="flex items-center gap-2"><span className="text-gray-500">✗</span> 타이머 없음</li>
              </ul>
            </div>
            <div ref={el => highlightRefs.current['basic-mode'] = el} className="p-6 rounded-xl border-2 border-blue-500 bg-blue-900/20">
              <div className="text-center mb-4"><span className="text-4xl">✅</span></div>
              <h3 className="text-xl font-bold text-center mb-2">기본 모드</h3>
              <p className="text-gray-400 text-sm text-center mb-4">자유롭게 문제를 풀어보세요</p>
              <ul className="text-sm space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 타이머 기능</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 시간 설정 가능</li>
                <li className="flex items-center gap-2"><span className="text-gray-500">✗</span> 시선 추적 없음</li>
              </ul>
            </div>
            <div ref={el => highlightRefs.current['focus-mode'] = el} className="p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800 relative">
              <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">PRO</div>
              <div className="text-center mb-4"><span className="text-4xl">👁️</span></div>
              <h3 className="text-xl font-bold text-center mb-2">집중 모드</h3>
              <p className="text-gray-400 text-sm text-center mb-4">시선 추적으로 집중력을 관리하세요</p>
              <ul className="text-sm space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 타이머 자동 시작</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 시선 추적</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 집중도 모니터링</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center"><button className="px-8 py-3 rounded-lg font-semibold text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">기본 모드로 시작</button></div>
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

export default AlgorithmTutorialMode;
