import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

/**
 * 알고리즘 튜토리얼 1: 문제 생성 (Steps 1-4)
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY_ALGO_1 = 'coai_algorithm_tutorial_v3_1';

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
];

const AlgorithmTutorialGenerator = () => {
  const navigate = useNavigate();
  const { user } = useLogin();

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const highlightRefs = useRef({});

  // 현재 단계 정보
  const currentStepInfo = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // localStorage에서 상태 로드 및 URL 파라미터 처리
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stepParam = searchParams.get('step');
    
    if (stepParam !== null) {
        setCurrentStep(parseInt(stepParam, 10));
        return;
    }

    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY_ALGO_1);
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
    localStorage.setItem(TUTORIAL_STORAGE_KEY_ALGO_1, JSON.stringify({
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
    localStorage.removeItem(TUTORIAL_STORAGE_KEY_ALGO_1);
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

  // URL 파라미터에서 returnUrl 확인
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get('returnUrl') || '/algorithm/problems';

  if (tutorialCompleted) {
    // 1단계 완료 시 -> 문제 생성 페이지로 이동 안내
    return (
        <CompletionScreen 
            onReset={handleReset} 
            title="문제 생성 튜토리얼 완료!"
            actionText="문제 생성하러 가기"
            onAction={() => navigate(returnUrl)}
        />
    );
  }

  return (
    <div className="min-h-screen bg-main relative">
      <div className="relative">
          <MockProblemGenerator highlightRefs={highlightRefs} />
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

// ... (TutorialOverlay, MockProblemGenerator, CompletionScreen components duplicated below)
// I will include the full components to ensure it works standalone.

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
            <span className="text-white font-medium">튜토리얼 (생성)</span>
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
    <div className="min-h-screen bg-main py-8 pt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-main mb-2">AI 문제 생성</h1>
          <p className="text-muted">원하는 난이도와 주제를 선택하면 AI가 문제를 생성합니다</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-panel rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-main mb-6">문제 생성 설정</h2>
            <div ref={el => highlightRefs.current['difficulty'] = el} className="mb-6">
              <label className="block text-sm font-medium text-sub mb-3">난이도 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {difficulties.map((diff) => (
                  <button key={diff.value} className={`p-4 rounded-lg border transition-all ${diff.value === 'SILVER' ? `${diff.color} border-current` : 'border-gray-200 dark:border-zinc-600'}`}><div className="font-semibold text-main">{diff.label}</div></button>
                ))}
              </div>
            </div>
            <div ref={el => highlightRefs.current['topic'] = el} className="mb-6">
              <label className="block text-sm font-medium text-sub mb-3">알고리즘 유형 <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                {topics.map((cat) => (
                  <div key={cat.category}>
                    <div className="text-xs font-semibold text-muted mb-1.5">{cat.category}</div>
                    <div className="flex flex-wrap gap-2">{cat.items.map((item) => (<button key={item} className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${item === 'DFS/BFS' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 dark:border-zinc-600 text-sub'}`}>{item}</button>))}</div>
                  </div>
                ))}
              </div>
            </div>
            <div ref={el => highlightRefs.current['theme'] = el} className="mb-6">
              <label className="block text-sm font-medium text-sub mb-3">스토리 테마 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">{themes.map((theme) => (<button key={theme.value} className={`p-3 rounded-lg border-2 transition-all text-center text-sm ${theme.value === 'SANTA' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500' : 'border-gray-200 dark:border-zinc-600'}`}>{theme.label}</button>))}</div>
            </div>
            <div ref={el => highlightRefs.current['generate-btn'] = el}>
              <button className="w-full py-4 rounded-lg font-semibold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">🚀 문제 생성하기</button>
            </div>
          </div>
          <div className="bg-panel rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-main mb-6">생성된 문제 미리보기</h2>
            <div className="text-center py-12 text-muted">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p>문제 생성 버튼을 클릭하면</p><p>AI가 생성한 문제가 여기에 표시됩니다</p>
            </div>
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

export default AlgorithmTutorialGenerator;
