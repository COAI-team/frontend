import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../../components/algorithm/editor/CodeEditor';
import { codeTemplates, LANGUAGE_MAP, LANGUAGE_NAME_TO_TEMPLATE_KEY, ALLOWED_LANGUAGES } from '../../components/algorithm/editor/editorUtils';
import { useResizableLayout, useVerticalResizable } from '../../hooks/algorithm/useResizableLayout';
import { useFocusViolationDetection } from '../../hooks/algorithm/useFocusViolationDetection';
import { startProblemSolve, submitCode, runTestCode } from '../../service/algorithm/algorithmApi';
import EyeTracker from '../../components/algorithm/eye-tracking/EyeTracker';
import ModeSelectionScreen from '../../components/algorithm/ModeSelectionScreen';
import ViolationWarnings from '../../components/algorithm/ViolationWarnings';
import { useLogin } from '../../context/login/useLogin';

/**
 * 문제 풀이 페이지 - 백엔드 API 연동 + 다크 테마
 * ✅ 수평(좌우) + 수직(상하) 리사이저 지원
 *
 * 변경사항:
 * - solveMode 추가 (BASIC/FOCUS)
 * - monitoringSessionId 지원 (FOCUS 모드에서 시선 추적 시 사용)
 * - 모니터링은 점수에 미반영 (정보 제공 및 경고 목적)
 * - 모드 선택 화면 추가 (기본 모드 / 집중 모드)
 * - 시간 설정 기능 추가
 * - 집중 모드: 자동 시선 추적 + 타이머 시작
 * - 기본 모드: 수동 타이머 시작
 */
const ProblemSolve = () => {
  
  const { problemId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const eyeTrackerRef = useRef(null); // 시선 추적 ref
  const { user } = useLogin();


  // 문제 데이터 상태
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========== 모드 선택 관련 상태 ==========
  const [showModeSelection, setShowModeSelection] = useState(true); // 모드 선택 화면 표시 여부
  const [selectedMode, setSelectedMode] = useState(null); // 'BASIC' | 'FOCUS'
  const [customTimeMinutes, setCustomTimeMinutes] = useState(30); // 사용자 지정 시간 (분)
  const [solvingStarted, setSolvingStarted] = useState(false); // 풀이 시작 여부

  // 에디터 상태
  const [selectedLanguage, setSelectedLanguage] = useState('Python 3');
  const [code, setCode] = useState('');

  // 타이머 상태 (풀이 시간 - 기본 30분)
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // 실행 결과 상태
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  // 시선 추적/모니터링 상태
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(false);
  const [eyeTrackingReady, setEyeTrackingReady] = useState(false);
  const [monitoringSessionId, setMonitoringSessionId] = useState(null);

  // 풀이 모드: BASIC (자유 모드) vs FOCUS (집중 모드 - 시선 추적 포함)
  const solveMode = selectedMode || 'BASIC';
  const currentUserId = user?.userId ?? user?.id ?? null;

  // 집중 모드 위반 감지 훅
  const {
    showFullscreenWarning,
    showTabSwitchWarning,
    showMouseLeaveWarning,
    violationCount,
    enterFullscreen,
    dismissFullscreenWarning,
    dismissTabSwitchWarning,
    dismissMouseLeaveWarning
  } = useFocusViolationDetection({
    isActive: selectedMode === 'FOCUS' && solvingStarted,
    monitoringSessionId
  });

  // ✅ 수평 리사이저 (문제설명 | 에디터)
  const {
    leftPanelWidth,
    isResizing: isHorizontalResizing,
    handleResizeStart: handleHorizontalResizeStart,
    containerRef
  } = useResizableLayout(35, 20, 60);

  // ✅ 수직 리사이저 (에디터 | 실행결과)
  const {
    topPanelHeight: editorHeight,
    isResizing: isVerticalResizing,
    handleResizeStart: handleVerticalResizeStart,
    containerRef: editorContainerRef
  } = useVerticalResizable(70, 30, 85);

  // 경과 시간 계산
  const getElapsedTime = useCallback(() => {
    if (!startTime) return 0;
    return Math.floor((new Date() - startTime) / 1000);
  }, [startTime]);

  // ========== 모드 선택 및 시작 핸들러 ==========

  // 모드 선택 완료 및 풀이 시작
  const handleStartSolving = useCallback((mode) => {
    if (mode === 'LEARN') {
      navigate(`/algorithm/problems/${problemId}/learn`);
      return;
    }
    setSelectedMode(mode);
    setShowModeSelection(false);
    setSolvingStarted(true);

    // 사용자 지정 시간으로 타이머 설정
    const timeInSeconds = customTimeMinutes * 60;
    setTimeLeft(timeInSeconds);
    setStartTime(new Date());

    if (mode === 'FOCUS') {
      // 집중 모드: 전체화면 진입 + 시선 추적 자동 활성화
      enterFullscreen();
      setEyeTrackingEnabled(true);
    }
    // 기본 모드는 사용자가 수동으로 타이머 시작
  }, [customTimeMinutes, enterFullscreen]);

  // 집중 모드에서 시선 추적 준비 완료 시 타이머 자동 시작
  useEffect(() => {
    if (selectedMode === 'FOCUS' && eyeTrackingReady && solvingStarted && !isTimerRunning) {
      setIsTimerRunning(true);
      console.log('🎯 집중 모드: 시선 추적 준비 완료, 타이머 자동 시작');
    }
  }, [selectedMode, eyeTrackingReady, solvingStarted, isTimerRunning]);

  // 기본 모드 타이머 시작
  const handleStartTimer = useCallback(() => {
    if (selectedMode === 'BASIC') {
      // 기본 모드에서 시작 버튼 클릭 시
      const timeInSeconds = customTimeMinutes * 60;
      setTimeLeft(timeInSeconds);
      setStartTime(new Date());
      setIsTimerRunning(true);
    }
  }, [selectedMode, customTimeMinutes]);

  // 코드 제출
  // 변경: solveMode, monitoringSessionId 추가
  const handleSubmit = useCallback(async () => {
    if (!code.trim()) {
      alert('코드를 작성해주세요!');
      return;
    }

    // 현재 모니터링 세션 ID 저장 (제출 전에 종료되므로)
    const currentMonitoringSessionId = monitoringSessionId;
    const currentSolveMode = solveMode;

    // 시선 추적 세션 종료 (남은 시간 전달)
    if (eyeTrackingEnabled && eyeTrackerRef.current) {
      await eyeTrackerRef.current.stopTracking(timeLeft);
      setEyeTrackingEnabled(false);
      setMonitoringSessionId(null);
    }

    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const res = await submitCode({
        problemId: Number(problemId),
        language: selectedLanguage, // DB expects exact language name (e.g., "Python 3", "Java 17")
        sourceCode: code,
        elapsedTime: getElapsedTime(),
        solveMode: currentSolveMode,
        monitoringSessionId: currentSolveMode === 'FOCUS' ? currentMonitoringSessionId : null
      });

      if (res.error) {
        alert(`제출 실패: ${res.message}`);
      } else {
        const responseData = res.Data || res.data || res;
        const submissionId = responseData?.algosubmissionId || responseData?.submissionId;
        navigate(`/algorithm/submissions/${submissionId}`);
      }
    } catch {
      alert('코드 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [code, problemId, selectedLanguage, navigate, getElapsedTime, eyeTrackingEnabled, solveMode, monitoringSessionId, timeLeft]);

  // 문제 데이터 로드
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await startProblemSolve(problemId);
        console.log('📥 API 응답:', res);

        if (res.error) {
          setError(res.message);
          return;
        }

        const problemData = res.Data || res.data || res;
        console.log('📋 문제 데이터:', problemData);
        console.log('🔤 Available Languages:', problemData.availableLanguages);

        setProblem(problemData);

        // SQL 문제인 경우 기본 언어를 SQL로 설정
        if (problemData.problemType === 'SQL') {
          setSelectedLanguage('SQL');
        } else {
          // 기본 언어 설정 (Python 3)
          setSelectedLanguage('Python 3');
        }

        setTimeLeft(30 * 60);
        setStartTime(new Date());

      } catch (err) {
        console.error('❌ 문제 로드 실패:', err);
        setError('문제를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  // 타이머 효과
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      handleSubmit();
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, handleSubmit]);

  // 초기 코드 설정
  useEffect(() => {
    // 백엔드 languageName을 template key로 변환
    const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[selectedLanguage] || selectedLanguage;
    const template = codeTemplates[templateKey] || codeTemplates['default'] || '// 코드를 작성하세요';
    console.log(`[ProblemSolve] Loading template for language: ${selectedLanguage}`, {
      templateKey,
      hasTemplate: !!codeTemplates[templateKey],
      templateLength: template.length
    });
    setCode(template);
  }, [selectedLanguage]);

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 언어 변경
  const handleLanguageChange = (lang) => {
    if (window.confirm(`언어를 ${lang}로 변경하시겠습니까?\n현재 작성한 코드가 초기화됩니다.`)) {
      setSelectedLanguage(lang);
      const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[lang] || lang;
      setCode(codeTemplates[templateKey] || codeTemplates['default'] || '// 코드를 작성하세요');
    }
  };

  // 코드 테스트 실행
  const handleTestRun = async () => {
    if (!code.trim()) {
      alert('코드를 작성해주세요!');
      return;
    }

    setIsRunning(true);
    setTestResult(null);
    setRunProgress(0);

    const progressInterval = setInterval(() => {
      setRunProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const res = await runTestCode({
        problemId: Number(problemId),
        language: selectedLanguage, // DB expects exact language name (e.g., "Python 3", "Java 17")
        sourceCode: code
      });

      console.log('🧪 테스트 결과:', res);
      clearInterval(progressInterval);
      setRunProgress(100);

      if (res.error || (res.code && res.code !== '0000')) {
        setTestResult({ error: true, message: res.message || '테스트 실행 실패' });
      } else {
        setTestResult(res.Data || res.data || res);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setRunProgress(0);
      console.error('테스트 실행 오류:', err);
      setTestResult({ error: true, message: '테스트 실행 중 오류가 발생했습니다.' });
    } finally {
      setTimeout(() => {
        setIsRunning(false);
        setRunProgress(0);
      }, 500);
    }
  };

  // 에디터 마운트
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = { editor, monaco };
  };

  // 코드 초기화
  const handleResetCode = () => {
    if (window.confirm('코드를 초기화하시겠습니까?')) {
      setCode(codeTemplates[selectedLanguage] || codeTemplates['default'] || '// 코드를 작성하세요');
    }
  };

  // 난이도 배지 스타일
  const getDifficultyBadge = (diff) => {
    const styles = {
      'BRONZE': 'bg-orange-900/50 text-orange-400 border-orange-700',
      'SILVER': 'bg-gray-700/50 text-gray-300 border-gray-600',
      'GOLD': 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
      'PLATINUM': 'bg-cyan-900/50 text-cyan-400 border-cyan-700'
    };
    return styles[diff] || 'bg-gray-700/50 text-gray-400 border-gray-600';
  };

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
      input: /(?:^|\n)(?:\*\*)?(?:입력|Input)(?:\*\*)?\s*(?::|：)?\s*\n?/i,
      output: /(?:^|\n)(?:\*\*)?(?:출력|Output)(?:\*\*)?\s*(?::|：)?\s*\n?/i,
      constraints: /(?:^|\n)(?:\*\*)?(?:제한사항|제한 ?사항|제한|조건|Constraints?)(?:\*\*)?\s*(?::|：)?\s*\n?/i,
      exampleInput: /(?:^|\n)(?:\*\*)?(?:예제 ?입력|입력 ?예제|예시 ?입력|Sample Input|Example Input)(?:\*\*)?\s*(?:\d*)?\s*(?::|：)?\s*\n?/i,
      exampleOutput: /(?:^|\n)(?:\*\*)?(?:예제 ?출력|출력 ?예제|예시 ?출력|Sample Output|Example Output)(?:\*\*)?\s*(?:\d*)?\s*(?::|：)?\s*\n?/i,
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

  // ===== 마크다운 텍스트 파싱 함수 =====
  const renderFormattedText = (text) => {
    if (!text) return null;

    // **text** 패턴을 찾아서 <strong>으로 변환
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-gray-100">
            {boldText}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // ===== 섹션 렌더링 컴포넌트 (다크 테마) =====
  const SectionCard = ({ title, icon, content, bgColor = 'bg-zinc-900/50' }) => {
    if (!content) return null;
    return (
      <div className={`${bgColor} rounded-lg p-4 border border-zinc-700`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold text-gray-200">{title}</h4>
        </div>
        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
          {renderFormattedText(content)}
        </div>
      </div>
    );
  };

  const CodeBlock = ({ title, icon, content }) => {
    if (!content) return null;
    return (
      <div className="bg-zinc-950 rounded-lg overflow-hidden border border-zinc-700">
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-700">
          <span>{icon}</span>
          <span className="text-sm font-medium text-gray-300">{title}</span>
        </div>
        <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto">
          {content}
        </pre>
      </div>
    );
  };

  // 파싱된 문제 섹션
  const parsedSections = useMemo(() => {
    return parseProblemDescription(problem?.description);
  }, [problem?.description]);

  // 필터링된 언어 목록 (useMemo로 캐싱 - 렌더링 중 반복 계산 방지)
  const filteredLanguages = useMemo(() => {
    if (!problem?.availableLanguages) return [];

    const seen = new Set();
    const filtered = problem.availableLanguages.filter(lang => {
      if (seen.has(lang.languageName)) return false;
      seen.add(lang.languageName);
      if (!ALLOWED_LANGUAGES.has(lang.languageName)) return false;
      const monacoLang = LANGUAGE_MAP[lang.languageName];
      return monacoLang && monacoLang !== 'plaintext';
    });

    // 개발 환경에서만 로그 출력 (Vite 환경변수 사용)
    if (import.meta.env.DEV && filtered.length > 0) {
      console.log(`[ProblemSolve] 언어 필터링 완료: ${filtered.length}개 표시 (전체 ${problem.availableLanguages.length}개 중)`);
    }

    return filtered;
  }, [problem?.availableLanguages]);

  // EyeTracker 콜백 메모이제이션 (무한 렌더링 방지)
  const handleEyeTrackerReady = useCallback(() => {
    setEyeTrackingReady(true);
  }, []);

  const handleSessionStart = useCallback((sessionId) => {
    console.log('Eye tracking session started:', sessionId);
    setMonitoringSessionId(sessionId);
  }, []);

  const handleSessionEnd = useCallback((sessionId) => {
    console.log('Eye tracking session ended:', sessionId);
    setEyeTrackingReady(false);
    setMonitoringSessionId(null);
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">⚠️ {error}</p>
          <button onClick={() => navigate('/algorithm')} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            문제 목록으로
          </button>
        </div>
      </div>
    );
  }

  // ========== 모드 선택 화면 ==========
  if (showModeSelection) {
    return (
      <ModeSelectionScreen
        problem={problem}
        problemId={problemId}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        customTimeMinutes={customTimeMinutes}
        setCustomTimeMinutes={setCustomTimeMinutes}
        onStartSolving={handleStartSolving}
        onNavigateBack={() => navigate('/algorithm')}
        onGoToLearnMode={() => navigate(`/algorithm/problems/${problemId}/learn`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100">
      {/* 헤더 */}
      <div className="bg-zinc-800 border-b border-zinc-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">#{problem?.problemId || problemId} {problem?.title || '문제'}</h1>
              <p className="text-sm text-gray-400 mt-1">
                맞힌사람 {problem?.solvedCount || 0} • 제출한 사람 {problem?.submitCount || 0}
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* 현재 모드 표시 */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                selectedMode === 'FOCUS' ? 'bg-purple-600' : 'bg-blue-600'
              }`}>
                <span>{selectedMode === 'FOCUS' ? '👁️' : '📝'}</span>
                <span className="text-sm font-semibold">
                  {selectedMode === 'FOCUS' ? '집중 모드' : '기본 모드'}
                </span>
                {selectedMode === 'FOCUS' && (
                  <span className={`w-2 h-2 rounded-full ml-1 ${
                    eyeTrackingReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                  }`}></span>
                )}
              </div>

              {/* 타이머 */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                <span className="text-sm">풀이 시간</span>
                <span className={`font-mono text-lg ${timeLeft <= 300 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* 타이머 컨트롤 - 기본 모드에서만 수동 제어 가능 */}
              {selectedMode === 'BASIC' && (
                <>
                  {!isTimerRunning && !startTime ? (
                    // 아직 시작 안 함 - 시간 설정 가능
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={customTimeMinutes}
                        onChange={(e) => setCustomTimeMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 30)))}
                        className="w-16 px-2 py-1 bg-zinc-700 rounded text-center text-sm"
                      />
                      <span className="text-gray-400 text-sm">분</span>
                      <button
                        onClick={handleStartTimer}
                        className="px-3 py-1 rounded text-sm bg-green-600 hover:bg-green-700"
                      >
                        시작
                      </button>
                    </div>
                  ) : (
                    // 이미 시작됨 - 일시정지/재개
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-3 py-1 rounded text-sm ${isTimerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {isTimerRunning ? '일시정지' : '재개'}
                    </button>
                  )}
                </>
              )}

              {/* 집중 모드 상태 표시 */}
              {selectedMode === 'FOCUS' && (
                <span className={`text-sm ${eyeTrackingReady ? 'text-green-400' : 'text-yellow-400'}`}>
                  {eyeTrackingReady ? '추적 중' : '캘리브레이션 중...'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-6 py-6" ref={containerRef}>
        <div className="flex h-[calc(100vh-220px)] gap-1">

          {/* 왼쪽: 문제 설명 */}
          <div className="bg-zinc-800 rounded-lg overflow-auto" style={{ width: `${leftPanelWidth}%` }}>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">문제 설명</h2>

              {/* 제한 정보 표시 */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs border ${getDifficultyBadge(problem?.difficulty)}`}>
                  {problem?.difficulty || 'N/A'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-900/50 text-blue-400 border border-blue-700">
                  ⏱ 시간제한: {problem?.timeLimit || 1000}ms
                </span>
                <span className="px-3 py-1 rounded-full text-xs bg-green-900/50 text-green-400 border border-green-700">
                  💾 메모리제한: {problem?.memoryLimit || 256}MB
                </span>
              </div>

              {/* 구조화된 문제 내용 */}
              {parsedSections && (parsedSections.description || parsedSections.input || parsedSections.output) ? (
                <div className="space-y-4">
                  {/* 문제 설명 */}
                  <SectionCard
                    title="문제 설명"
                    icon="📋"
                    content={parsedSections.description}
                    bgColor="bg-zinc-900/30"
                  />

                  {/* 입력/출력 */}
                  <div className="grid grid-cols-1 gap-4">
                    <SectionCard
                      title="입력"
                      icon="📥"
                      content={parsedSections.input}
                      bgColor="bg-blue-900/20"
                    />
                    <SectionCard
                      title="출력"
                      icon="📤"
                      content={parsedSections.output}
                      bgColor="bg-green-900/20"
                    />
                  </div>

                  {/* 제한사항 */}
                  <SectionCard
                    title="제한사항"
                    icon="⚠️"
                    content={parsedSections.constraints}
                    bgColor="bg-yellow-900/20"
                  />

                  {/* 파싱된 예제 입출력 */}
                  {(parsedSections.exampleInput || parsedSections.exampleOutput) && (
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
                  )}

                  {/* DB에서 가져온 샘플 테스트케이스 (파싱된 예제가 없을 경우) */}
                  {!parsedSections.exampleInput && !parsedSections.exampleOutput && problem?.sampleTestCases?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                        <span>📋</span> 예제
                      </h3>
                      {problem.sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="bg-zinc-900 rounded p-4 mb-3 border border-zinc-700">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">입력</p>
                              <pre className="text-sm bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">출력</p>
                              <pre className="text-sm bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.expectedOutput}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* 파싱 실패 시 원본 출력 (마크다운 포맷팅 적용) */
                <div className="prose prose-invert prose-sm max-w-none space-y-4">
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {renderFormattedText(problem?.description) || '문제 설명이 없습니다.'}
                  </div>

                  {problem?.sampleTestCases?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                        <span>📋</span> 예제
                      </h3>
                      {problem.sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="bg-zinc-900 rounded p-4 mb-3 border border-zinc-700">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">입력</p>
                              <pre className="text-sm bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">출력</p>
                              <pre className="text-sm bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.expectedOutput}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ 수평 리사이저 (좌우) */}
          <div
            className={`w-1 bg-zinc-700 hover:bg-purple-500 cursor-col-resize transition-colors ${isHorizontalResizing ? 'bg-purple-500' : ''}`}
            onMouseDown={handleHorizontalResizeStart}
          />

          {/* 오른쪽: 에디터 + 실행결과 */}
          <div
            className="bg-zinc-800 rounded-lg flex flex-col overflow-hidden"
            style={{ width: `${100 - leftPanelWidth}%` }}
            ref={editorContainerRef}
          >
            {/* 에디터 헤더 */}
            <div className="flex items-center justify-between p-3 border-b border-zinc-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-zinc-700 border-none rounded px-3 py-1 text-sm"
                >
                  {problem?.problemType === 'SQL' ? (
                    <option value="SQL">SQL (SQLite)</option>
                  ) : (
                    filteredLanguages.map(lang => (
                      <option key={lang.languageName} value={lang.languageName}>
                        {lang.languageName}
                      </option>
                    ))
                  )}
                </select>

                {/* 선택된 언어의 제한 정보 표시 (작게) */}
                {problem?.availableLanguages && (
                  <span className="text-xs text-gray-500 ml-2">
                    (⏱ {problem.availableLanguages.find(l => l.languageName === selectedLanguage)?.timeLimit}ms /
                    💾 {problem.availableLanguages.find(l => l.languageName === selectedLanguage)?.memoryLimit}MB)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-zinc-700 rounded" title="복사">📋</button>
                <button className="p-2 hover:bg-zinc-700 rounded" title="전체화면">⛶</button>
              </div>
            </div>

            {/* ✅ 에디터 영역 (수직 리사이저블) */}
            <div style={{ height: `${editorHeight}%` }} className="min-h-0">
              <CodeEditor
                language={selectedLanguage}
                value={code}
                onChange={setCode}
                onMount={handleEditorMount}
                height="100%"
                theme="vs-dark"
              />
            </div>

            {/* ✅ 수직 리사이저 (상하) */}
            <div
              className={`h-1 bg-zinc-700 hover:bg-purple-500 cursor-row-resize transition-colors flex-shrink-0 ${isVerticalResizing ? 'bg-purple-500' : ''}`}
              onMouseDown={handleVerticalResizeStart}
            >
              {/* 리사이저 핸들 표시 */}
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-0.5 bg-zinc-500 rounded-full"></div>
              </div>
            </div>

            {/* result panel (right) */}
            <div style={{ height: `${100 - editorHeight}%` }} className="flex flex-col min-h-0">
              <div className="p-3 bg-zinc-850 flex-1 overflow-auto space-y-3">
                <div className="bg-zinc-900 rounded p-3 h-full overflow-auto text-sm">
                  <p className="text-sm text-gray-400 mb-2">Execution Result</p>

                  {isRunning && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Running test code...</span>
                        <span>{Math.round(runProgress)}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                          style={{ width: `${runProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isRunning ? (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <span className="animate-spin">...</span>
                      <span>Running code on Judge0 server...</span>
                    </div>
                  ) : testResult ? (
                    testResult.error ? (
                      <span className="text-red-400">Error: {testResult.message}</span>
                    ) : (
                      <div>
                        <div className={`font-bold mb-2 ${testResult.overallResult === 'AC' ? 'text-green-400' : 'text-red-400'}`}>
                          {testResult.overallResult === 'AC' ? 'Accepted!' : `Result: ${testResult.overallResult}`}
                          <span className="ml-2 text-gray-400 font-normal">
                            ({testResult.passedCount}/{testResult.totalCount} passed)
                          </span>
                          {testResult.maxExecutionTime && (
                            <span className="ml-2 text-gray-500 font-normal text-xs">
                              Time: {testResult.maxExecutionTime}ms
                            </span>
                          )}
                        </div>
                        {testResult.testCaseResults?.map((tc, idx) => (
                          <div key={idx} className="text-xs mt-1">
                            <span className={tc.result === 'AC' ? 'text-green-400' : 'text-red-400'}>
                              TC{tc.testCaseNumber}: {tc.result}
                            </span>
                            {tc.result !== 'AC' && tc.actualOutput && (
                              <span className="text-gray-500 ml-2">
                                Output: "{tc.actualOutput?.trim()}"
                              </span>
                            )}
                            {tc.errorMessage && (
                              <pre className="text-red-300 mt-1 text-xs whitespace-pre-wrap bg-red-900/20 p-2 rounded">
                                {tc.errorMessage}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <span className="text-gray-500">Write code and press "Run Code" to see results.</span>
                  )}
                </div>
              </div>

              {/* footer buttons */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700 bg-zinc-800 flex-shrink-0">
                <button onClick={handleResetCode} className="px-4 py-2 text-gray-400 hover:text-white">
                  Reset
                </button>
                <button onClick={handleTestRun} disabled={isRunning}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-50 flex items-center gap-2">
                  {isRunning ? (
                    <>
                      <span className="animate-spin">...</span>
                      Running...
                    </>
                  ) : (
                    'Run Code'
                  )}
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting || !code.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded font-medium disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Submitting...' : 'Submit & View Result'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 시선 추적 컴포넌트 - 집중 모드에서만 활성화 */}
      {eyeTrackingEnabled && selectedMode === 'FOCUS' && (
        <EyeTracker
          ref={eyeTrackerRef}
          problemId={Number(problemId)}
          isEnabled={eyeTrackingEnabled}
          timeLimitMinutes={customTimeMinutes}
          onReady={handleEyeTrackerReady}
          onSessionStart={handleSessionStart}
          onSessionEnd={handleSessionEnd}
        />
      )}

      {/* 집중 모드 경고 팝업 */}
      <ViolationWarnings
        showFullscreenWarning={showFullscreenWarning}
        showTabSwitchWarning={showTabSwitchWarning}
        showMouseLeaveWarning={showMouseLeaveWarning}
        violationCount={violationCount}
        onDismissFullscreen={dismissFullscreenWarning}
        onDismissTabSwitch={dismissTabSwitchWarning}
        onDismissMouseLeave={dismissMouseLeaveWarning}
      />
    </div>
  );
};

export default ProblemSolve;
