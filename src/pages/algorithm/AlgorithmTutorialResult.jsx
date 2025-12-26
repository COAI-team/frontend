import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

/**
 * 알고리즘 튜토리얼 4: 제출 결과 (Steps 13-15)
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY_ALGO_4 = 'coai_algorithm_tutorial_v3_4';

// 튜토리얼 단계 정의
const TUTORIAL_STEPS = [
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

const AlgorithmTutorialResult = () => {
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
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY_ALGO_4);
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
    localStorage.setItem(TUTORIAL_STORAGE_KEY_ALGO_4, JSON.stringify({
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
    localStorage.removeItem(TUTORIAL_STORAGE_KEY_ALGO_4);
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

  // URL 파라미터에서 submissionId 확인
  const searchParams = new URLSearchParams(window.location.search);
  const submissionId = searchParams.get('submissionId');
  
  if (tutorialCompleted) {
    return (
        <CompletionScreenFinal 
            onReset={handleReset} 
            submissionId={submissionId}
        />
    );
  }

  return (
    <div className="min-h-screen bg-main relative">
      <div className="relative">
          <MockSubmissionResult highlightRefs={highlightRefs} />
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
            <span className="text-white font-medium">튜토리얼 (결과)</span>
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

const MockSubmissionResult = ({ highlightRefs }) => {
  return (
    <div className="min-h-screen bg-main pt-20">
      <div className="bg-panel shadow-sm border-b dark:border-zinc-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4"><span className="text-blue-600 dark:text-blue-400">← 문제 목록</span><span className="text-gray-300">|</span><h1 className="text-lg font-semibold text-main">📊 제출 결과</h1><span className="text-muted">제출 #5678</span></div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div ref={el => highlightRefs.current['judge-result'] = el} className="bg-panel rounded-lg shadow-sm border dark:border-zinc-700 p-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div><h3 className="text-sm font-medium text-muted mb-2">📝 문제</h3><p className="text-lg font-semibold text-main">#1234 산타의 선물 배달</p><span className="inline-block mt-1 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-zinc-700">실버</span></div>
                <div><h3 className="text-sm font-medium text-muted mb-2">⚖️ 판정</h3><div className="inline-flex items-center px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30"><span className="text-xl mr-2">✅</span><span className="font-semibold text-green-600">Accepted</span></div></div>
                <div><h3 className="text-sm font-medium text-muted mb-2">🧪 테스트</h3><p className="text-lg font-semibold text-main">10/10</p><div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-1"><div className="h-2 rounded-full bg-green-500 w-full"></div></div></div>
                <div><h3 className="text-sm font-medium text-muted mb-2">🤖 AI 점수</h3><p className="text-lg font-semibold text-main">85/100</p><div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-1"><div className="h-2 rounded-full bg-blue-500" style={{ width: '85%' }}></div></div></div>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-panel rounded-lg shadow-sm border dark:border-zinc-700 p-6">
               <h3 className="text-lg font-semibold text-main mb-4">📈 실행 결과</h3>
               <div className="space-y-4">
                  <div className="flex justify-between"><span className="text-muted">실행 시간:</span><span className="font-mono text-main">0.124s</span></div>
                  <div className="flex justify-between"><span className="text-muted">메모리 사용량:</span><span className="font-mono text-main">31,256KB</span></div>
                  <div className="flex justify-between"><span className="text-muted">사용 언어:</span><span className="font-medium text-main">Python 3</span></div>
               </div>
            </div>
            <div ref={el => highlightRefs.current['ai-feedback'] = el} className="bg-panel rounded-lg shadow-sm border dark:border-zinc-700 p-6">
               <h3 className="text-lg font-semibold text-main mb-4">🤖 AI 피드백</h3>
               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl">
                  <p className="text-sub mb-3">전반적으로 좋은 풀이입니다!</p>
                  <div className="space-y-2 text-sm">
                     <div className="flex items-start gap-2"><span className="text-green-500">✓</span><span className="text-sub">효율적인 시간 복잡도 (O(n!))</span></div>
                     <div className="flex items-start gap-2"><span className="text-green-500">✓</span><span className="text-sub">깔끔한 코드 구조</span></div>
                     <div className="flex items-start gap-2"><span className="text-amber-500">!</span><span className="text-sub">메모리 최적화 가능</span></div>
                  </div>
               </div>
            </div>
          </div>
          <div ref={el => highlightRefs.current['github-commit'] = el} className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="text-3xl">🐙</span><div><h4 className="text-white font-medium">GitHub 자동 커밋</h4><p className="text-sm text-gray-400">정답 코드가 자동으로 저장되었습니다</p></div></div>
            <a href="#" className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">커밋 보기 →</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 완료 화면
const CompletionScreenFinal = ({ onReset, submissionId }) => {
  const navigate = useNavigate();
  const nextUrl = submissionId ? `/algorithm/submissions/${submissionId}` : '/algorithm/problems';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="text-8xl mb-8 animate-bounce">🎉</div>
        <h1 className="text-5xl font-bold text-white mb-4">튜토리얼 완료!</h1>
        <p className="text-xl text-white/80 mb-12">이제 자신이 푼 문제에 대한 AI 피드백을 확인해보세요.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate(nextUrl)} className="px-8 py-4 bg-white text-purple-900 rounded-2xl font-bold text-lg hover:scale-105 transition-all">결과 보러 가기</button>
          <button onClick={onReset} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-all">🔄 다시 보기</button>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Link to="/algorithm/problems" className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><div className="text-3xl mb-2">📋</div><div className="text-white/80 text-sm">문제 목록</div></Link>
          <Link to="/mypage/daily-mission" className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><div className="text-3xl mb-2">🎯</div><div className="text-white/80 text-sm">데일리 미션</div></Link>
          <Link to="/pricing" className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><div className="text-3xl mb-2">💎</div><div className="text-white/80 text-sm">구독하기</div></Link>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTutorialResult;
