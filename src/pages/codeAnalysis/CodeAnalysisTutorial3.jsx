import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

// Real Components
import RepositorySelector from '../../components/github/RepositorySelector';
import FileTree from '../../components/github/FileTree';
import AnalysisForm from '../../components/github/AnalysisForm';
import AnalysisResultCard from '../../components/codeAnalysis/AnalysisResultCard';

/**
 * 코드 분석 튜토리얼 페이지 v3
 *
 * UI 스타일: 실제 페이지 컴포넌트를 사용하여 Mock Data로 렌더링 + 오버레이 하이라이트
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY = 'coai_code_analysis_tutorial_v3';

// Mock Data
const MOCK_REPOS = [
  { id: 1, fullName: 'my-awesome-project', description: 'Updated 2 days ago' },
  { id: 2, fullName: 'old-legacy-code', description: 'Updated 1 year ago' }
];

const MOCK_FILES = [
  { path: 'src', type: 'tree' },
  { path: 'src/components', type: 'tree' },
  { path: 'src/components/AnalysisPage.jsx', type: 'blob' },
  { path: 'src/components/Header.jsx', type: 'blob' },
  { path: 'src/utils', type: 'tree' },
];

const MOCK_RESULT = {
  // checking getSmellKeyword logic... usually takes string 'A', 'B' etc. or a mapping.
  // CodeAnalysisUtils usually maps score (e.g. 92) to grade 'A'. Let's check AnalysisResultCard usage.
  // It passes analysisResult.aiScore to getScoreBadgeColor. 
  // Let's assume aiScore is the grade string based on existing mock usage 'A'.
  // Actually real backend returns a letter grade? Let's check AnalysisPage again later if needed but 'A' is safe.
  aiScore: 'A', 
  codeSmells: [
    { name: '잠재적인 SQL Injection 취약점', description: '사용자 입력을 검증 없이 쿼리에 직접 연결하고 있습니다. PreparedStatement를 사용해야 합니다.' },
    { name: '비효율적인 문자열 연결', description: '루프 내에서 String 변수를 "+" 연산자로 연결하면 성능 저하가 발생할 수 있습니다.' }
  ],
  suggestions: [
    {
       habitContext: '성능 최적화',
       problematicSnippet: 'String result = ""; result += item;',
       proposedReplacement: 'StringBuilder sb = new StringBuilder(); sb.append(item);'
    }
  ],
  relatedAnalysisIds: [] 
};

// 튜토리얼 단계 정의
const TUTORIAL_STEPS = [
  {
    target: 'repo-select',
    title: 'GitHub 리포지토리 선택',
    content: '연동된 GitHub 계정의 리포지토리 목록에서 분석할 프로젝트를 선택합니다.',
    placement: 'right',
    page: 'new-analysis'
  },
  {
    target: 'file-tree',
    title: '분석 파일 선택',
    content: '프로젝트 구조(트리)에서 집중적으로 분석하고 싶은 핵심 파일을 선택하세요.',
    placement: 'right',
    page: 'new-analysis'
  },
  {
    target: 'options-panel',
    title: '분석 세부 설정',
    content: 'RAG(참조 모드) 활성화 여부와 AI 피드백 강도(Tone)를 설정할 수 있습니다.',
    placement: 'left',
    page: 'new-analysis'
  },
  {
    target: 'analyze-btn',
    title: '분석 시작',
    content: '모든 설정이 완료되면 이 버튼을 눌러 AI 심층 분석을 시작합니다.',
    placement: 'bottom',
    page: 'new-analysis'
  },
  {
    target: 'score-card',
    title: '종합 점수 확인',
    content: '코드 품질, 보안, 효율성 등을 종합한 AI 점수를 확인하세요.',
    placement: 'right',
    page: 'result'
  },
  {
    target: 'issue-list',
    title: '발견된 문제점',
    content: '심각도별로 분류된 코드의 문제점과 개선 제안을 리스트로 확인합니다.',
    placement: 'left',
    page: 'result'
  },
  {
    target: 'ai-fix',
    title: 'AI 자동 수정',
    content: 'AI가 제안하는 수정 코드를 확인하고, 원본과 비교해볼 수 있습니다.',
    placement: 'left',
    page: 'result'
  },
];

const CodeAnalysisTutorial3 = () => {
  const navigate = useNavigate();
  const { user } = useLogin();

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const highlightRefs = useRef({});

  // Mock Selection State
  const [mockSelectedRepo, setMockSelectedRepo] = useState(null);
  const [mockSelectedFile, setMockSelectedFile] = useState(null);

  // 현재 단계 정보
  const currentStepInfo = TUTORIAL_STEPS[currentStep];
  const currentPage = currentStepInfo?.page || 'new-analysis';
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // localStorage에서 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
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
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify({
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
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
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
    <div className="min-h-screen bg-white dark:bg-[#0d1117] relative">
      <div className="container mx-auto px-4 py-8 relative opacity-100 transition-opacity duration-300">
        {currentPage === 'new-analysis' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel: File Selection */}
                <div className="space-y-6">
                    <div className="rounded-lg shadow-sm border p-6 bg-white dark:bg-[#161b22] dark:border-[#30363d]">
                        <h2 className="text-lg font-semibold mb-4 dark:text-white">📂 파일 선택</h2>
                        <div className="space-y-4">
                            <div ref={el => highlightRefs.current['repo-select'] = el}>
                                <RepositorySelector 
                                    onSelect={(repo) => setMockSelectedRepo(repo)} 
                                    mockRepositories={MOCK_REPOS}
                                />
                            </div>
                            
                            {/* Always show FileTree for tutorial visual, even if repo not selected (simulate selection) */}
                            <div ref={el => highlightRefs.current['file-tree'] = el}>
                                <FileTree 
                                    repository={{ owner: 'mock', name: 'mock' }} 
                                    branch={{ name: 'main' }}
                                    onSelect={(file) => setMockSelectedFile(file)}
                                    mockFiles={MOCK_FILES}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Analysis Options */}
                <div className="space-y-6">
                    <div className="rounded-lg shadow-sm border p-6 bg-white dark:bg-[#161b22] dark:border-[#30363d]">
                        <h2 className="text-lg font-semibold mb-4 dark:text-white">⚙️ 분석 설정</h2>
                        <div ref={el => highlightRefs.current['options-panel'] = el}>
                            <AnalysisForm 
                                onSubmit={() => {}} 
                                buttonRef={el => highlightRefs.current['analyze-btn'] = el}
                            />
                        </div>
                    </div>
                </div>
           </div>
        )}

        {currentPage === 'result' && (
           <div className="max-w-4xl mx-auto">
               <AnalysisResultCard 
                   analysisResult={MOCK_RESULT}
                   resolvedAnalysisId={null} // Hide buttons for tutorial
                   scoreCardRef={el => highlightRefs.current['score-card'] = el}
                   issueListRef={el => highlightRefs.current['issue-list'] = el}
                   aiFixRef={el => highlightRefs.current['ai-fix'] = el}
               />
           </div>
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
    
    // Global Scroll Logic (Independent of targetRef existence for page transitions)
    const handleScroll = () => {
        // Find the scrollable container defined in Layout.jsx
        // If not found (e.g. standalone page), fallback to window
        const scrollContainer = document.getElementById('scrollArea') || window;
        
        // Helper to force scroll
        const forceScroll = (top, behavior = 'auto') => {
             scrollContainer.scrollTo({ top, behavior });
        };

        if (currentStep === 3) {
             // Step 4: Analyze Button (Bottom)
             // Try multiple times to ensure it catches after render/layout
             forceScroll(999999); // Immediate
             setTimeout(() => forceScroll(999999), 100);
             setTimeout(() => forceScroll(999999, 'smooth'), 300); // Final smooth adjust
        } else if (currentStep === 4) {
             // Step 5: Result Card (Top)
             forceScroll(0); // Immediate
             setTimeout(() => forceScroll(0), 100);
             setTimeout(() => forceScroll(0, 'smooth'), 300);
        } else if (targetRef) {
             // Default: Scroll to element
             targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    
    handleScroll();

    if (targetRef) {
      const rect = targetRef.getBoundingClientRect();
      const padding = 8;
      
      setHighlightStyle({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Apply border highlight directly to element
      targetRef.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'dark:ring-offset-[#0d1117]', 'transition-all', 'duration-300', 'z-50', 'relative');
    }

    // Cleanup function to remove classes when step changes
    return () => {
        if (targetRef) {
            targetRef.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'dark:ring-offset-[#0d1117]', 'transition-all', 'duration-300', 'z-50', 'relative');
        }
    };
  }, [step, highlightRefs, currentStep]);

  useEffect(() => {
    // 툴팁 위치 계산 (간소화)
    if (!highlightRefs.current[step.target]) return;
    
    const targetRef = highlightRefs.current[step.target];
    const rect = targetRef.getBoundingClientRect();
    
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    let tooltipTop, tooltipLeft;

    switch (step.placement) {
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

    // 화면 경계 처리
    tooltipLeft = Math.max(20, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 20));
    tooltipTop = Math.max(20, tooltipTop);

    setTooltipStyle({
    top: tooltipTop,
    left: tooltipLeft,
    width: tooltipWidth,
    });
  }, [step, highlightRefs]); // Re-calculate tooltip position separately or combine if needed. Combined is safer for window resize but strictly Effect dependency is cleaner.

  return (
    <>
       {/* Background Blur Overlay */}
       {/* z-40 ensures it sits on top of normal content (z-auto) but below highlighted element (z-50) */}
       <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-none" />

       {/* Progress Bar - z-50 to stay on top */}
       <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">튜토리얼</span>
            <span className="text-white/60 text-sm">{currentStep + 1} / {totalSteps}</span>
          </div>
          <button onClick={onSkip} className="text-white/70 text-sm hover:text-white transition-colors">건너뛰기</button>
        </div>
        <div className="h-1 bg-zinc-700">
           <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tooltip Card */}
      <div className="absolute z-50 animate-fade-in transition-all duration-300" style={tooltipStyle}>
        <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
             <div className="flex items-center gap-2">
               <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                 {currentStep + 1}
               </span>
               <h3 className="text-white font-bold text-lg">{step.title}</h3>
             </div>
          </div>
          <div className="px-5 py-4">
             <p className="text-gray-300 text-sm leading-relaxed">{step.content}</p>
          </div>
          <div className="px-5 py-3 bg-zinc-800/50 flex items-center justify-between">
             <button onClick={onPrev} disabled={currentStep === 0} className={`px-4 py-2 rounded-lg text-sm font-medium ${currentStep === 0 ? 'text-gray-600' : 'text-white bg-zinc-700 hover:bg-zinc-600'} transition-colors`}>이전</button>
             <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
               {currentStep === totalSteps - 1 ? '완료' : '다음'}
             </button>
          </div>
        </div>
      </div>
    </>
  );
};

const CompletionScreen = ({ onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center overflow-hidden">
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="text-8xl mb-8 animate-bounce">🎉</div>
        <h1 className="text-5xl font-bold text-white mb-4">튜토리얼 완료!</h1>
        <p className="text-xl text-white/80 mb-12">이제 전문가처럼 코드를 분석해보세요.</p>
        <button onClick={() => navigate('/codeAnalysis/new')} className="px-8 py-4 bg-white text-purple-900 rounded-2xl font-bold text-lg hover:scale-105 transition-all cursor-pointer">
           새 분석 시작하기
        </button>
        <div className="mt-4">
           <button onClick={onReset} className="text-white/60 hover:text-white cursor-pointer">다시 보기</button>
        </div>
      </div>
    </div>
  );
};

export default CodeAnalysisTutorial3;
