import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

/**
 * 알고리즘 튜토리얼 페이지 v2
 *
 * UI 스타일: 모달 오버레이 + 전체 페이지 슬라이드 혼합
 *
 * 7단계 온보딩:
 * 1. AI 문제 생성
 * 2. 모드 선택
 * 3. 기본 모드
 * 4. 집중 모드
 * 5. 코드 실행
 * 6. 제출
 * 7. AI 피드백
 */

// localStorage 키
const TUTORIAL_STORAGE_KEY = 'coai_algorithm_tutorial_v2';

// 튜토리얼 단계 정의
const TUTORIAL_STEPS = [
  {
    id: 1,
    title: 'AI 문제 생성',
    subtitle: '나만의 알고리즘 문제를 만들어보세요',
    icon: '🤖',
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    bgImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
  },
  {
    id: 2,
    title: '모드 선택',
    subtitle: '학습 스타일에 맞는 모드를 선택하세요',
    icon: '🎯',
    gradient: 'from-purple-600 via-pink-600 to-rose-600',
    bgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80',
  },
  {
    id: 3,
    title: '기본 모드',
    subtitle: '자유롭게 문제를 풀어보세요',
    icon: '✅',
    gradient: 'from-green-600 via-emerald-600 to-teal-600',
    bgImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1920&q=80',
  },
  {
    id: 4,
    title: '집중 모드',
    subtitle: '시선 추적으로 집중력을 관리하세요',
    icon: '👁️',
    gradient: 'from-amber-600 via-orange-600 to-red-600',
    bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80',
  },
  {
    id: 5,
    title: '코드 실행',
    subtitle: '작성한 코드를 테스트해보세요',
    icon: '▶️',
    gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
    bgImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80',
  },
  {
    id: 6,
    title: '제출',
    subtitle: '코드를 제출하고 채점받으세요',
    icon: '📤',
    gradient: 'from-rose-600 via-red-600 to-orange-600',
    bgImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1920&q=80',
  },
  {
    id: 7,
    title: 'AI 피드백',
    subtitle: 'AI가 분석한 피드백을 확인하세요',
    icon: '💡',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    bgImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&q=80',
  },
];

const AlgorithmTutorial2 = () => {
  const navigate = useNavigate();
  const { user } = useLogin();

  // 현재 단계 (1-7)
  const [currentStep, setCurrentStep] = useState(1);
  // 완료된 단계들
  const [completedSteps, setCompletedSteps] = useState([]);
  // 튜토리얼 완료 여부
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  // 슬라이드 전환 애니메이션
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  // 모달 표시 상태
  const [showTipModal, setShowTipModal] = useState(false);
  // 현재 팁 인덱스
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // localStorage에서 진행 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(parsed.completedSteps || []);
        setTutorialCompleted(parsed.tutorialCompleted || false);
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

  // 다음 단계로 이동
  const handleNext = useCallback(() => {
    if (isTransitioning) return;

    setSlideDirection('next');
    setIsTransitioning(true);

    setTimeout(() => {
      if (!completedSteps.includes(currentStep)) {
        const newCompleted = [...completedSteps, currentStep];
        setCompletedSteps(newCompleted);

        if (currentStep === 7) {
          setTutorialCompleted(true);
          saveProgress(currentStep, newCompleted, true);
        } else {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          setCurrentTipIndex(0);
          saveProgress(nextStep, newCompleted);
        }
      } else if (currentStep < 7) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setCurrentTipIndex(0);
        saveProgress(nextStep, completedSteps);
      } else {
        setTutorialCompleted(true);
        saveProgress(7, completedSteps, true);
      }

      setIsTransitioning(false);
    }, 400);
  }, [currentStep, completedSteps, isTransitioning, saveProgress]);

  // 이전 단계로 이동
  const handlePrev = useCallback(() => {
    if (currentStep === 1 || isTransitioning) return;

    setSlideDirection('prev');
    setIsTransitioning(true);

    setTimeout(() => {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setCurrentTipIndex(0);
      saveProgress(prevStep, completedSteps);
      setIsTransitioning(false);
    }, 400);
  }, [currentStep, completedSteps, isTransitioning, saveProgress]);

  // 건너뛰기
  const handleSkip = useCallback(() => {
    const allSteps = [1, 2, 3, 4, 5, 6, 7];
    setCompletedSteps(allSteps);
    setTutorialCompleted(true);
    saveProgress(7, allSteps, true);
  }, [saveProgress]);

  // 초기화
  const handleReset = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setCurrentStep(1);
    setCompletedSteps([]);
    setTutorialCompleted(false);
    setCurrentTipIndex(0);
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

  const currentStepInfo = TUTORIAL_STEPS[currentStep - 1];
  const progress = (completedSteps.length / 7) * 100;

  if (tutorialCompleted) {
    return <CompletionScreen onReset={handleReset} />;
  }

  return (
    <div className="fixed inset-0 bg-zinc-900 overflow-hidden">
      {/* 배경 슬라이드 */}
      <div
        className={`
          absolute inset-0 transition-all duration-500
          ${isTransitioning ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${currentStepInfo.gradient} opacity-90`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      </div>

      {/* 상단 네비게이션 바 */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">나가기</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              초기화
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all"
            >
              건너뛰기
            </button>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="px-6">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / 7) * 100 + (100 / 7)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="absolute inset-0 flex items-center justify-center pt-20 pb-32">
        <div
          className={`
            w-full max-w-5xl mx-auto px-8
            transition-all duration-400
            ${isTransitioning
              ? slideDirection === 'next'
                ? '-translate-x-20 opacity-0'
                : 'translate-x-20 opacity-0'
              : 'translate-x-0 opacity-100'
            }
          `}
        >
          {/* 단계 표시 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
              <span className="text-white/60 text-sm">Step</span>
              <span className="text-white font-bold">{currentStep}</span>
              <span className="text-white/60 text-sm">of 7</span>
            </div>

            <div className="text-8xl mb-6">{currentStepInfo.icon}</div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {currentStepInfo.title}
            </h1>
            <p className="text-xl text-white/80">
              {currentStepInfo.subtitle}
            </p>
          </div>

          {/* 단계별 컨텐츠 카드 */}
          <div className="mt-12">
            <StepContent
              step={currentStep}
              showTipModal={showTipModal}
              setShowTipModal={setShowTipModal}
              currentTipIndex={currentTipIndex}
              setCurrentTipIndex={setCurrentTipIndex}
            />
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6 py-6">
          {/* 이전 버튼 */}
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${currentStep === 1
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white bg-white/10 hover:bg-white/20'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>

          {/* 단계 점 인디케이터 */}
          <div className="flex items-center gap-2">
            {TUTORIAL_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id <= Math.max(...completedSteps, currentStep)) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${step.id === currentStep
                    ? 'bg-white scale-125'
                    : completedSteps.includes(step.id)
                      ? 'bg-white/60 hover:bg-white/80'
                      : 'bg-white/20'
                  }
                `}
              />
            ))}
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-white text-zinc-900 rounded-xl font-semibold hover:bg-white/90 hover:scale-105 transition-all shadow-xl"
          >
            {currentStep === 7 ? '완료' : '다음'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 키보드 힌트 */}
        <div className="text-center pb-4">
          <p className="text-white/40 text-xs">
            ← → 키로 이동 | Enter 다음 | Esc 건너뛰기
          </p>
        </div>
      </div>

      {/* 팁 모달 오버레이 */}
      {showTipModal && (
        <TipModal
          step={currentStep}
          tipIndex={currentTipIndex}
          onClose={() => setShowTipModal(false)}
          onNext={() => setCurrentTipIndex(prev => prev + 1)}
        />
      )}
    </div>
  );
};

// ==================== 단계별 컨텐츠 ====================
const StepContent = ({ step, showTipModal, setShowTipModal, currentTipIndex, setCurrentTipIndex }) => {
  const contents = {
    1: <Step1Content onShowTip={() => setShowTipModal(true)} />,
    2: <Step2Content onShowTip={() => setShowTipModal(true)} />,
    3: <Step3Content onShowTip={() => setShowTipModal(true)} />,
    4: <Step4Content onShowTip={() => setShowTipModal(true)} />,
    5: <Step5Content onShowTip={() => setShowTipModal(true)} />,
    6: <Step6Content onShowTip={() => setShowTipModal(true)} />,
    7: <Step7Content onShowTip={() => setShowTipModal(true)} />,
  };

  return contents[step] || null;
};

// ==================== 각 단계별 슬라이드 컨텐츠 ====================

const Step1Content = ({ onShowTip }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <FeatureCard
      icon="📊"
      title="난이도 선택"
      description="브론즈부터 플래티넘까지 4단계 난이도"
      onClick={onShowTip}
    />
    <FeatureCard
      icon="🧩"
      title="알고리즘 유형"
      description="DFS/BFS, DP, 그리디 등 다양한 유형"
      onClick={onShowTip}
    />
    <FeatureCard
      icon="🎄"
      title="스토리 테마"
      description="계절마다 바뀌는 재미있는 테마"
      onClick={onShowTip}
    />
  </div>
);

const Step2Content = ({ onShowTip }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <ModeCard
      icon="🎓"
      title="학습 모드"
      description="AI 튜터와 함께 힌트를 받으며 연습"
      badge="Basic/Pro"
      onClick={onShowTip}
    />
    <ModeCard
      icon="✅"
      title="기본 모드"
      description="자유롭게 시간을 설정하고 풀이"
      badge={null}
      onClick={onShowTip}
    />
    <ModeCard
      icon="👁️"
      title="집중 모드"
      description="시선 추적으로 집중도 모니터링"
      badge="Pro"
      onClick={onShowTip}
    />
  </div>
);

const Step3Content = ({ onShowTip }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">⏱️</span>
        <h3 className="text-xl font-bold text-white">타이머 모드</h3>
      </div>
      <p className="text-white/70 mb-4">카운트다운 방식으로 시간 제한을 두고 풀이</p>
      <div className="flex gap-2">
        {[15, 30, 45, 60].map(min => (
          <span key={min} className="px-3 py-1 bg-white/10 rounded-lg text-white/80 text-sm">
            {min}분
          </span>
        ))}
      </div>
    </div>
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">⏰</span>
        <h3 className="text-xl font-bold text-white">스톱워치 모드</h3>
      </div>
      <p className="text-white/70 mb-4">시간 제한 없이 자유롭게 풀이 시간 측정</p>
      <div className="text-4xl font-mono text-white/90">00:00:00</div>
    </div>
  </div>
);

const Step4Content = ({ onShowTip }) => (
  <div className="space-y-4">
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">시선 추적 캘리브레이션</h3>
        <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm">Pro 전용</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '🖥️', label: '전체화면 이탈', penalty: '1.5점' },
          { icon: '📑', label: '탭 전환', penalty: '2점' },
          { icon: '😴', label: '졸음 감지', penalty: '1.5점' },
          { icon: '👥', label: '다중 인물', penalty: '3점' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-white/80 text-sm">{item.label}</div>
            <div className="text-red-400 text-xs mt-1">{item.penalty}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-3 text-white/60 text-sm justify-center">
      <span>⚠️</span>
      <span>7점 이상 누적 시 자동 제출</span>
    </div>
  </div>
);

const Step5Content = ({ onShowTip }) => (
  <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10">
    <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/80 border-b border-white/10">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <span className="text-white/60 text-sm">Python 3</span>
      <button className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
        ▶ 실행
      </button>
    </div>
    <div className="p-4 font-mono text-sm">
      <div className="text-purple-400">def <span className="text-blue-400">solution</span>(n):</div>
      <div className="text-white/80 pl-4">result = []</div>
      <div className="text-white/80 pl-4">
        <span className="text-purple-400">for</span> i <span className="text-purple-400">in</span> range(n):
      </div>
      <div className="text-white/80 pl-8">result.append(i * 2)</div>
      <div className="text-purple-400 pl-4">return <span className="text-white/80">result</span></div>
    </div>
    <div className="px-4 py-3 bg-zinc-800/50 border-t border-white/10">
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <span>✓</span>
        <span>테스트 1: 통과 (0.02s)</span>
      </div>
    </div>
  </div>
);

const Step6Content = ({ onShowTip }) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
      <div className="text-6xl mb-4">📤</div>
      <h3 className="text-2xl font-bold text-white mb-2">코드 제출</h3>
      <p className="text-white/70 mb-6">모든 테스트케이스로 채점이 진행됩니다</p>
      <button className="px-8 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all">
        제출하기
      </button>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {[
        { code: 'AC', label: '정답', color: 'bg-green-500' },
        { code: 'WA', label: '오답', color: 'bg-red-500' },
        { code: 'TLE', label: '시간 초과', color: 'bg-yellow-500' },
        { code: 'RE', label: '런타임 에러', color: 'bg-orange-500' },
      ].map((r) => (
        <div key={r.code} className="bg-white/10 rounded-xl p-3 flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${r.color}`}></span>
          <span className="text-white/80 text-sm">{r.code}</span>
        </div>
      ))}
    </div>
  </div>
);

const Step7Content = ({ onShowTip }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🤖</span>
        <div>
          <h3 className="text-xl font-bold text-white">AI 피드백</h3>
          <p className="text-white/60 text-sm">코드 품질 분석</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-bold text-white">85<span className="text-lg">/100</span></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-green-400">✓</span>
          <span className="text-white/80 text-sm">효율적인 시간 복잡도</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-400">✓</span>
          <span className="text-white/80 text-sm">깔끔한 변수 네이밍</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-400">!</span>
          <span className="text-white/80 text-sm">메모리 최적화 가능</span>
        </div>
      </div>
    </div>
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🐙</span>
        <div>
          <h3 className="text-xl font-bold text-white">GitHub 자동 커밋</h3>
          <p className="text-white/60 text-sm">정답 코드를 자동으로 저장</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-green-400">
        <span>✓</span>
        <span className="text-sm">연동 완료</span>
      </div>
    </div>
  </div>
);

// ==================== 공통 컴포넌트 ====================

const FeatureCard = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-left hover:bg-white/20 hover:scale-105 transition-all group"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-white/70 text-sm">{description}</p>
    <div className="mt-4 text-white/40 group-hover:text-white/60 text-sm flex items-center gap-1 transition-colors">
      클릭하여 자세히 보기
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

const ModeCard = ({ icon, title, description, badge, onClick }) => (
  <button
    onClick={onClick}
    className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-left hover:bg-white/20 hover:scale-105 transition-all"
  >
    {badge && (
      <span className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
        {badge}
      </span>
    )}
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-white/70 text-sm">{description}</p>
  </button>
);

// ==================== 팁 모달 ====================
const TipModal = ({ step, tipIndex, onClose, onNext }) => {
  const tips = {
    1: [
      { title: '난이도 선택', content: '브론즈(초급)부터 플래티넘(고급)까지, 본인 실력에 맞는 난이도를 선택하세요.' },
      { title: '알고리즘 유형', content: 'DFS/BFS, 동적 프로그래밍, 그리디 등 연습하고 싶은 알고리즘 유형을 선택할 수 있습니다.' },
      { title: '스토리 테마', content: '계절마다 새로운 테마가 제공됩니다. 지금은 겨울/연말 시즌 테마를 만나보세요!' },
    ],
    2: [
      { title: '학습 모드', content: 'AI 튜터가 힌트를 제공하며, 채점 기록과 별도로 연습할 수 있습니다.' },
      { title: '기본 모드', content: '자유롭게 타이머를 설정하고 풀이할 수 있는 일반적인 모드입니다.' },
      { title: '집중 모드', content: '웹캠으로 시선을 추적하여 집중도를 모니터링합니다. 전체화면으로 진행됩니다.' },
    ],
  };

  const stepTips = tips[step] || [{ title: '팁', content: '이 기능을 활용해보세요!' }];
  const currentTip = stepTips[Math.min(tipIndex, stepTips.length - 1)];
  const hasMore = tipIndex < stepTips.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 카드 */}
      <div className="relative bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">💡</span>
          <h3 className="text-xl font-bold text-white">{currentTip.title}</h3>
        </div>

        <p className="text-white/80 leading-relaxed mb-6">
          {currentTip.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {stepTips.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${idx === tipIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>

          {hasMore ? (
            <button
              onClick={onNext}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all"
            >
              다음 팁 →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-white/90 transition-all"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== 완료 화면 ====================
const CompletionScreen = ({ onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="text-8xl mb-8 animate-bounce">🎉</div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          튜토리얼 완료!
        </h1>

        <p className="text-xl text-white/80 mb-12">
          이제 알고리즘 문제 생성부터 AI 피드백까지<br />
          모든 기능을 자유롭게 사용할 수 있습니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => navigate('/algorithm/problems/generate')}
            className="px-8 py-4 bg-white text-purple-900 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all"
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

        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Link
            to="/algorithm/problems"
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all group"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="text-white/80 text-sm group-hover:text-white">문제 목록</div>
          </Link>
          <Link
            to="/mypage/daily-mission"
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all group"
          >
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-white/80 text-sm group-hover:text-white">데일리 미션</div>
          </Link>
          <Link
            to="/mypage/dashboard"
            className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all group"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-white/80 text-sm group-hover:text-white">대시보드</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTutorial2;
