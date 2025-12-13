import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../../components/algorithm/editor/CodeEditor';
import { codeTemplates, LANGUAGE_MAP, LANGUAGE_NAME_TO_TEMPLATE_KEY, ALLOWED_LANGUAGES } from '../../components/algorithm/editor/editorUtils';
import { useResizableLayout, useVerticalResizable } from '../../hooks/algorithm/useResizableLayout';
import { useFocusViolationDetection } from '../../hooks/algorithm/useFocusViolationDetection';
import { useParsedProblem } from '../../hooks/algorithm/useParsedProblem';
import { startProblemSolve, submitCode, runTestCode } from '../../service/algorithm/algorithmApi';
import EyeTracker, { TRACKER_TYPES } from '../../components/algorithm/eye-tracking/EyeTracker';
import ModeSelectionScreen from '../../components/algorithm/ModeSelectionScreen';
import ViolationWarnings from '../../components/algorithm/ViolationWarnings';
import PenaltyNotification from '../../components/algorithm/PenaltyNotification';
import ConfirmModal from '../../components/algorithm/ConfirmModal';
import { useViolationPenalty } from '../../hooks/algorithm/useViolationPenalty';
import { useApplyThemeClass } from '../../hooks/useApplyThemeClass';

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
  const handleSubmitRef = useRef(null); // 자동 제출용 ref (stale closure 방지)
  const noFaceSustainedRecordedRef = useRef(false); // NO_FACE_SUSTAINED 중복 기록 방지

  // 테마 적용 (이 페이지는 Layout 밖에 있어서 직접 호출 필요)
  useApplyThemeClass();

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
  // 변경사항 (2025-12-13): selectedLanguageId 추가 (API 호출용), Python 3 → Python
  const [selectedLanguage, setSelectedLanguage] = useState('Python');  // 표시용 languageName
  const [selectedLanguageId, setSelectedLanguageId] = useState(null);    // API 호출용 languageId
  const [code, setCode] = useState('');

  // 타이머 상태 (풀이 시간 - 기본 30분)
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timerEndTime, setTimerEndTime] = useState(null); // 타이머 종료 시점 (timestamp) - 브라우저 스로틀링 방지

  // ========== 타이머 모드 관련 상태 ==========
  const [timerMode, setTimerMode] = useState('TIMER'); // 'TIMER' (카운트다운) | 'STOPWATCH' (스톱워치)
  const [elapsedTime, setElapsedTime] = useState(0); // 스톱워치용 경과 시간

  // 실행 결과 상태
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  // 시선 추적/모니터링 상태
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(false);
  const [eyeTrackingReady, setEyeTrackingReady] = useState(false);
  const [monitoringSessionId, setMonitoringSessionId] = useState(null);

  // [Debug] 시선 추적 디버그 모드 상태
  const [eyeTrackingDebugMode, setEyeTrackingDebugMode] = useState(false);

  // 추적기 타입 선택 (WebGazer / MediaPipe)
  const [selectedTrackerType, setSelectedTrackerType] = useState(TRACKER_TYPES.MEDIAPIPE);

  // MediaPipe 전용 상태
  const [drowsinessState, setDrowsinessState] = useState({
    isDrowsy: false,
    perclos: 0,
    consecutiveClosedFrames: 0
  });
  const [multipleFacesState, setMultipleFacesState] = useState({
    faceCount: 0,
    detectedFaces: []
  });
  const drowsyViolationRecordedRef = useRef(false); // 졸음 위반 중복 기록 방지

  // [Phase 2] NO_FACE 경고 상태
  const [noFaceState, setNoFaceState] = useState({
    showNoFaceWarning: false,
    noFaceDuration: 0,
    noFaceProgress: 0
  });

  // 커스텀 Confirm 모달 상태 (전체화면 유지용)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null, // 취소 시 커스텀 동작 (null이면 기본 닫기)
    confirmText: '확인',
    cancelText: '취소'
  });

  // 풀이 모드: BASIC (자유 모드) vs FOCUS (집중 모드 - 시선 추적 포함)
  const solveMode = selectedMode || 'BASIC';

  // [Phase 2] 시간 감소 콜백 (패널티 시스템용)
  // timerEndTime을 조정하여 브라우저 스로틀링에도 정확하게 동작
  const handleTimeReduction = useCallback((seconds) => {
    setTimerEndTime(prev => {
      if (!prev) return prev;
      return prev - seconds * 1000; // 종료 시점을 앞당김
    });
    setTimeLeft(prev => Math.max(0, prev - seconds));
    console.log(`⏰ Time reduced by ${seconds / 60} minutes`);
  }, []);

  // [Phase 2] 자동 제출 콜백 (ref를 통해 최신 handleSubmit 호출)
  const handleAutoSubmit = useCallback(() => {
    if (handleSubmitRef.current) {
      handleSubmitRef.current();
    }
  }, []);

  // 집중 모드 위반 감지 훅
  const {
    showFullscreenWarning,
    showTabSwitchWarning,
    showMouseLeaveWarning,
    showDevtoolsWarning,
    violationCount,
    enterFullscreen,
    dismissFullscreenWarning,
    dismissTabSwitchWarning,
    dismissMouseLeaveWarning,
    dismissDevtoolsWarning
  } = useFocusViolationDetection({
    isActive: selectedMode === 'FOCUS' && solvingStarted,
    isDevtoolsCheckActive: solvingStarted, // 기본/집중 모드 모두 개발자도구 감지
    monitoringSessionId
  });

  // [Phase 2] 패널티 시스템 훅
  const {
    penaltyNotification,
    recordViolation,
    dismissNotification,
    getPenaltyStatus
  } = useViolationPenalty({
    isActive: selectedMode === 'FOCUS' && solvingStarted,
    currentTimeLeft: timeLeft,
    onTimeReduction: handleTimeReduction,
    onAutoSubmit: handleAutoSubmit
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

  // 경과 시간 계산 (제출용)
  const getElapsedTime = useCallback(() => {
    if (selectedMode === 'BASIC' && timerMode === 'STOPWATCH') {
      // 스톱워치 모드: 경과 시간 반환
      return elapsedTime;
    }
    // 타이머 모드 또는 집중 모드: startTime 기준
    if (!startTime) return 0;
    return Math.floor((new Date() - startTime) / 1000);
  }, [startTime, selectedMode, timerMode, elapsedTime]);

  // ========== 모드 선택 및 시작 핸들러 ==========

  // 모드 선택 완료 및 풀이 시작
  const handleStartSolving = useCallback((mode) => {
    setSelectedMode(mode);
    setShowModeSelection(false);

    if (mode === 'FOCUS') {
      // 집중 모드: 모드 선택 화면에서 타이머 설정 완료 후 바로 시작
      const timeInSeconds = customTimeMinutes * 60;
      setTimeLeft(timeInSeconds);
      setStartTime(new Date());
      setSolvingStarted(true);

      // 집중 모드: 전체화면 진입 + 시선 추적 자동 활성화
      // timerEndTime은 eyeTrackingReady 시점에 설정됨
      enterFullscreen();
      setEyeTrackingEnabled(true);
    } else {
      // 기본 모드: 바로 풀이 시작 (타이머는 페이지 내에서 수동 설정)
      setSolvingStarted(true);
      setStartTime(new Date());
      // 타이머 초기값 설정 (카운트다운용)
      setTimeLeft(customTimeMinutes * 60);
    }
  }, [customTimeMinutes, enterFullscreen]);


  // 집중 모드에서 시선 추적 준비 완료 시 타이머 자동 시작
  useEffect(() => {
    if (selectedMode === 'FOCUS' && eyeTrackingReady && solvingStarted && !isTimerRunning) {
      // 타이머 종료 시점 설정 (브라우저 스로틀링 방지)
      setTimerEndTime(Date.now() + timeLeft * 1000);
      setIsTimerRunning(true);
      console.log('🎯 집중 모드: 시선 추적 준비 완료, 타이머 자동 시작');
    }
  }, [selectedMode, eyeTrackingReady, solvingStarted, isTimerRunning, timeLeft]);

  // [Phase 2] 위반 이벤트를 패널티 시스템에 연결
  // 전체화면 이탈 위반
  useEffect(() => {
    if (showFullscreenWarning && selectedMode === 'FOCUS') {
      recordViolation('FULLSCREEN_EXIT');
    }
  }, [showFullscreenWarning, selectedMode, recordViolation]);

  // 탭 전환 위반
  useEffect(() => {
    if (showTabSwitchWarning && selectedMode === 'FOCUS') {
      recordViolation('TAB_SWITCH');
    }
  }, [showTabSwitchWarning, selectedMode, recordViolation]);

  // NO_FACE 15초 이상 위반 (심각한 위반) - 중복 기록 방지
  useEffect(() => {
    if (noFaceState.noFaceProgress >= 1 && selectedMode === 'FOCUS') {
      if (!noFaceSustainedRecordedRef.current) {
        noFaceSustainedRecordedRef.current = true;
        recordViolation('NO_FACE_SUSTAINED');
      }
    } else if (noFaceState.noFaceProgress < 1) {
      // 얼굴이 다시 감지되면 플래그 리셋 (다음 15초 미검출 시 다시 기록 가능)
      noFaceSustainedRecordedRef.current = false;
    }
  }, [noFaceState.noFaceProgress, selectedMode, recordViolation]);

  // 졸음 감지 위반 (MediaPipe only) - 중복 기록 방지
  useEffect(() => {
    if (drowsinessState.isDrowsy && selectedMode === 'FOCUS' && selectedTrackerType === TRACKER_TYPES.MEDIAPIPE) {
      if (!drowsyViolationRecordedRef.current) {
        drowsyViolationRecordedRef.current = true;
        recordViolation('DROWSINESS_DETECTED');
      }
    } else if (!drowsinessState.isDrowsy) {
      // 졸음 상태가 해제되면 플래그 리셋
      drowsyViolationRecordedRef.current = false;
    }
  }, [drowsinessState.isDrowsy, selectedMode, selectedTrackerType, recordViolation]);

  // 기본 모드에서 타이머 설정 변경 시 timeLeft 업데이트 (시작 전에만)
  useEffect(() => {
    if (selectedMode === 'BASIC' && !isTimerRunning && timerMode === 'TIMER') {
      setTimeLeft(customTimeMinutes * 60);
    }
  }, [customTimeMinutes, selectedMode, isTimerRunning, timerMode]);

  // 기본 모드 타이머/스톱워치 시작
  const handleStartTimer = useCallback(() => {
    if (selectedMode === 'BASIC') {
      if (timerMode === 'TIMER') {
        // 타이머 모드: 카운트다운
        const timeInSeconds = customTimeMinutes * 60;
        setTimeLeft(timeInSeconds);
        setTimerEndTime(Date.now() + timeInSeconds * 1000);
      } else {
        // 스톱워치 모드: 카운트업
        setElapsedTime(0);
        setStartTime(new Date());
      }
      setIsTimerRunning(true);
    }
  }, [selectedMode, customTimeMinutes, timerMode]);

  // 기본 모드 타이머/스톱워치 일시정지/재개
  const handleToggleTimer = useCallback(() => {
    if (isTimerRunning) {
      // 일시정지
      setIsTimerRunning(false);
      if (timerMode === 'STOPWATCH') {
        // 스톱워치: 현재 경과 시간 저장
        setElapsedTime(prev => prev);
      }
    } else {
      // 재개
      if (timerMode === 'TIMER') {
        // 타이머: 새로운 종료 시점 설정
        setTimerEndTime(Date.now() + timeLeft * 1000);
      } else {
        // 스톱워치: 시작 시간 재설정 (경과 시간 고려)
        setStartTime(new Date(Date.now() - elapsedTime * 1000));
      }
      setIsTimerRunning(true);
    }
  }, [isTimerRunning, timeLeft, timerMode, elapsedTime]);

  // 기본 모드 타이머/스톱워치 리셋
  const handleResetTimer = useCallback(() => {
    setIsTimerRunning(false);
    if (timerMode === 'TIMER') {
      const timeInSeconds = customTimeMinutes * 60;
      setTimeLeft(timeInSeconds);
      setTimerEndTime(null);
    } else {
      setElapsedTime(0);
    }
  }, [timerMode, customTimeMinutes]);

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
      // 변경사항 (2025-12-13): language (String) → languageId (Integer)
      const res = await submitCode({
        problemId: Number(problemId),
        languageId: selectedLanguageId, // LANGUAGES.LANGUAGE_ID (Judge0 API ID)
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
  }, [code, problemId, selectedLanguageId, navigate, getElapsedTime, eyeTrackingEnabled, solveMode, monitoringSessionId, timeLeft]);

  // [Phase 2] handleSubmit ref 업데이트 (자동 제출용)
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

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

        // 기본 언어 설정 (languageId와 languageName 모두 설정)
        // 변경사항 (2025-12-13): languageId 지원 추가, Python 3 → Python
        if (problemData.problemType === 'SQL') {
          setSelectedLanguage('SQL');
          const sqlLang = problemData.availableLanguages?.find(l => l.languageName === 'SQL');
          setSelectedLanguageId(sqlLang?.languageId || null);
        } else {
          // 기본 언어 설정 (Python)
          setSelectedLanguage('Python');
          const pythonLang = problemData.availableLanguages?.find(l => l.languageName === 'Python');
          setSelectedLanguageId(pythonLang?.languageId || null);
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

  // 타이머 효과 - 시간 기반 계산 (브라우저 스로틀링 방지)
  // 백그라운드 탭에서도 정확한 시간 계산을 위해 Date.now() 사용
  useEffect(() => {
    if (!isTimerRunning) return;

    // 타이머 모드 (카운트다운) - 집중 모드 또는 기본모드의 타이머
    if ((selectedMode === 'FOCUS' || timerMode === 'TIMER') && timerEndTime) {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((timerEndTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          setIsTimerRunning(false);

          if (selectedMode === 'FOCUS') {
            // 집중 모드: 자동 제출
            handleSubmit();
          } else {
            // 기본 모드: 확인 모달 표시
            setConfirmModal({
              isOpen: true,
              title: '⏰ 타이머 종료',
              message: '설정한 풀이 시간이 종료되었습니다.\n이대로 제출하시겠습니까?',
              confirmText: '제출하기',
              cancelText: '계속 풀기',
              onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                handleSubmit();
              },
              onCancel: () => {
                // 타이머 비활성화하고 계속 풀기
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setTimerEndTime(null);
              }
            });
          }
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }

    // 스톱워치 모드 (카운트업) - 기본 모드에서만
    if (selectedMode === 'BASIC' && timerMode === 'STOPWATCH' && startTime) {
      const updateStopwatch = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      };

      updateStopwatch();
      const interval = setInterval(updateStopwatch, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning, timerEndTime, handleSubmit, selectedMode, timerMode, startTime]);

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

  // 언어 변경 (커스텀 모달 사용 - 전체화면 유지)
  // 변경사항 (2025-12-13): languageId도 함께 업데이트
  const handleLanguageChange = (langName) => {
    // 현재 언어와 같으면 무시
    if (langName === selectedLanguage) return;

    setConfirmModal({
      isOpen: true,
      title: '언어 변경',
      message: `언어를 ${langName}로 변경하시겠습니까?\n현재 작성한 코드가 초기화됩니다.`,
      onConfirm: () => {
        setSelectedLanguage(langName);
        // languageId 찾아서 설정
        const langInfo = problem?.availableLanguages?.find(l => l.languageName === langName);
        setSelectedLanguageId(langInfo?.languageId || null);

        const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[langName] || langName;
        setCode(codeTemplates[templateKey] || codeTemplates['default'] || '// 코드를 작성하세요');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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
      // 변경사항 (2025-12-13): language (String) → languageId (Integer)
      const res = await runTestCode({
        problemId: Number(problemId),
        languageId: selectedLanguageId, // LANGUAGES.LANGUAGE_ID (Judge0 API ID)
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

  // 코드 초기화 (커스텀 모달 사용 - 전체화면 유지)
  const handleResetCode = () => {
    setConfirmModal({
      isOpen: true,
      title: '코드 초기화',
      message: '코드를 초기화하시겠습니까?\n현재 작성한 코드가 삭제됩니다.',
      onConfirm: () => {
        const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[selectedLanguage] || selectedLanguage;
        setCode(codeTemplates[templateKey] || codeTemplates['default'] || '// 코드를 작성하세요');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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

  // ===== 마크다운 텍스트 파싱 함수 =====
  const renderFormattedText = (text) => {
    if (!text) return null;

    // **text** 패턴을 찾아서 <strong>으로 변환
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-white">
            {boldText}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // ===== 섹션 렌더링 컴포넌트 =====
  const SectionCard = ({ title, icon, content, bgColor = 'bg-zinc-800/50' }) => {
    if (!content) return null;
    return (
      <div className={`${bgColor} rounded-lg p-4 border border-zinc-700`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold text-white">{title}</h4>
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

  // 파싱된 문제 섹션 (커스텀 훅으로 메모이제이션)
  const parsedSections = useParsedProblem(problem?.description);

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

  // MediaPipe 전용 콜백: 졸음 상태 변경
  const handleDrowsinessStateChange = useCallback((state) => {
    setDrowsinessState(state);
    if (state.isDrowsy) {
      console.log('😴 Drowsiness detected - PERCLOS:', (state.perclos * 100).toFixed(1) + '%');
    }
  }, []);

  // MediaPipe 전용 콜백: 다중 인물 감지
  const handleMultipleFacesDetected = useCallback((state) => {
    setMultipleFacesState(state);
    if (state.faceCount > 1) {
      console.log('👥 Multiple faces detected:', state.faceCount);
    }
  }, []);

  // [Debug] 시선 추적 디버그 모드 토글 핸들러
  const handleToggleEyeTrackingDebug = useCallback(() => {
    if (eyeTrackerRef.current?.toggleDebugMode) {
      eyeTrackerRef.current.toggleDebugMode();
      setEyeTrackingDebugMode(prev => !prev);
    }
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
        onStartSolving={handleStartSolving}
        onNavigateBack={() => navigate('/algorithm')}
        customTimeMinutes={customTimeMinutes}
        setCustomTimeMinutes={setCustomTimeMinutes}
        selectedTrackerType={selectedTrackerType}
        setSelectedTrackerType={setSelectedTrackerType}
      />
    );
  }


  return (
    <div className="h-screen bg-zinc-900 text-gray-100 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="bg-zinc-800 border-b border-zinc-700 flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">#{problem?.problemId || problemId} {problem?.title || '문제'}</h1>
              <p className="text-sm text-gray-400 mt-1">
                맞힌사람 {problem?.successCount || 0} • 제출 {problem?.totalAttempts || 0}
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

              {/* 타이머/스톱워치 표시 */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                <span className="text-sm">
                  {selectedMode === 'BASIC' ? (timerMode === 'TIMER' ? '타이머' : '스톱워치') : '남은 시간'}
                </span>
                <span className={`font-mono text-lg ${
                  selectedMode === 'FOCUS' || timerMode === 'TIMER'
                    ? (timeLeft <= 300 ? 'text-red-400' : 'text-yellow-400')
                    : 'text-cyan-400'
                }`}>
                  {selectedMode === 'FOCUS' || timerMode === 'TIMER'
                    ? formatTime(timeLeft)
                    : formatTime(elapsedTime)
                  }
                </span>
              </div>

              {/* 타이머 컨트롤 - 기본 모드에서만 수동 제어 가능 */}
              {selectedMode === 'BASIC' && (
                <div className="flex items-center gap-2">
                  {/* 타이머/스톱워치 모드 토글 */}
                  {!isTimerRunning && (
                    <div className="flex items-center bg-gray-200 dark:bg-zinc-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setTimerMode('TIMER')}
                        className={`px-2 py-1 rounded text-xs transition-all ${
                          timerMode === 'TIMER'
                            ? 'bg-yellow-600 text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        ⏱️ 타이머
                      </button>
                      <button
                        onClick={() => setTimerMode('STOPWATCH')}
                        className={`px-2 py-1 rounded text-xs transition-all ${
                          timerMode === 'STOPWATCH'
                            ? 'bg-cyan-600 text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        ⏱️ 스톱워치
                      </button>
                    </div>
                  )}

                  {/* 타이머 모드: 시간 설정 */}
                  {!isTimerRunning && timerMode === 'TIMER' && (
                    <>
                      {/* 프리셋 버튼 */}
                      <div className="flex items-center gap-1">
                        {[15, 30, 45, 60].map(time => (
                          <button
                            key={time}
                            onClick={() => setCustomTimeMinutes(time)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              customTimeMinutes === time
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-600'
                            }`}
                          >
                            {time}분
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={customTimeMinutes}
                        onChange={(e) => setCustomTimeMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 30)))}
                        className="w-14 px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded text-center text-xs"
                      />
                      <span className="text-gray-500 dark:text-gray-400 text-xs">분</span>
                    </>
                  )}

                  {/* 시작/일시정지/재개 버튼 */}
                  {!isTimerRunning ? (
                    <button
                      onClick={handleStartTimer}
                      className="px-3 py-1 rounded text-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                      시작
                    </button>
                  ) : (
                    <button
                      onClick={handleToggleTimer}
                      className="px-3 py-1 rounded text-sm bg-red-600 hover:bg-red-700 text-white"
                    >
                      일시정지
                    </button>
                  )}

                  {/* 리셋 버튼 - 실행 중이거나 경과 시간이 있을 때 */}
                  {(isTimerRunning || elapsedTime > 0 || (timerMode === 'TIMER' && timeLeft !== customTimeMinutes * 60)) && (
                    <button
                      onClick={handleResetTimer}
                      className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                      title="리셋"
                    >
                      ↺
                    </button>
                  )}
                </div>
              )}

              {/* 집중 모드 상태 표시 */}
              {selectedMode === 'FOCUS' && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedTrackerType === 'mediapipe'
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'bg-blue-900/50 text-blue-300'
                  }`}>
                    {selectedTrackerType === 'mediapipe' ? 'MediaPipe' : 'WebGazer'}
                  </span>
                  <span className={`text-sm ${eyeTrackingReady ? 'text-green-400' : 'text-yellow-400'}`}>
                    {eyeTrackingReady ? '추적 중' : selectedTrackerType === 'mediapipe' ? '준비 중...' : '캘리브레이션 중...'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 집중 모드 디버그 바 (상단 중앙) */}
      {selectedMode === 'FOCUS' && eyeTrackingReady && (
        <div className="bg-zinc-850 border-b border-zinc-700 py-2 flex-shrink-0">
          <div className="flex justify-center">
            <button
              onClick={handleToggleEyeTrackingDebug}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                eyeTrackingDebugMode
                  ? 'bg-green-600 text-white ring-2 ring-green-400 shadow-lg shadow-green-500/30'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600 hover:text-white'
              }`}
              title="웹캠 미리보기, 시선 위치 점, 얼굴 가이드 박스 표시"
            >
              <span className="text-lg">{eyeTrackingDebugMode ? '📹' : '🔍'}</span>
              <span>{eyeTrackingDebugMode ? '시선 추적 미리보기 ON' : '시선 추적 미리보기'}</span>
              {eyeTrackingDebugMode && (
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 container mx-auto px-6 py-4 min-h-0" ref={containerRef}>
        <div className="flex h-full gap-1">

          {/* 왼쪽: 문제 설명 */}
          <div className="bg-zinc-800 rounded-lg overflow-auto" style={{ width: `${leftPanelWidth}%` }}>
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">문제 설명</h2>

              {/* 제한 정보 표시 */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs border ${getDifficultyBadge(problem?.difficulty)}`}>
                  {problem?.difficulty || 'N/A'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700">
                  ⏱ 시간제한: {problem?.timeLimit || 1000}ms
                </span>
                <span className="px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700">
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
                    bgColor="bg-gray-50 dark:bg-zinc-900/30"
                  />

                  {/* 입력/출력 */}
                  <div className="grid grid-cols-1 gap-4">
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
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span>📋</span> 예제
                      </h3>
                      {problem.sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="bg-gray-100 dark:bg-zinc-900 rounded p-4 mb-3 border border-gray-300 dark:border-zinc-700">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">입력</p>
                              <pre className="text-sm bg-gray-900 dark:bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">출력</p>
                              <pre className="text-sm bg-gray-900 dark:bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.expectedOutput}</pre>
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
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span>📋</span> 예제
                      </h3>
                      {problem.sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="bg-gray-100 dark:bg-zinc-900 rounded p-4 mb-3 border border-gray-300 dark:border-zinc-700">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">입력</p>
                              <pre className="text-sm bg-gray-900 dark:bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">출력</p>
                              <pre className="text-sm bg-gray-900 dark:bg-zinc-950 p-2 rounded font-mono text-green-400">{tc.expectedOutput}</pre>
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
            className={`w-1 bg-gray-300 dark:bg-zinc-700 hover:bg-purple-500 cursor-col-resize transition-colors ${isHorizontalResizing ? 'bg-purple-500' : ''}`}
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
                  className="bg-gray-100 dark:bg-zinc-700 border-none rounded px-3 py-1 text-sm"
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
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded" title="복사">📋</button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded" title="전체화면">⛶</button>
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
              className={`h-1 bg-gray-300 dark:bg-zinc-700 hover:bg-purple-500 cursor-row-resize transition-colors flex-shrink-0 ${isVerticalResizing ? 'bg-purple-500' : ''}`}
              onMouseDown={handleVerticalResizeStart}
            >
              {/* 리사이저 핸들 표시 */}
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-0.5 bg-gray-400 dark:bg-zinc-500 rounded-full"></div>
              </div>
            </div>

            {/* ✅ 실행결과 영역 (수직 리사이저블) */}
            <div style={{ height: `${100 - editorHeight}%` }} className="flex flex-col min-h-0">
              <div className="p-3 bg-zinc-850 flex-1 overflow-auto">
                <p className="text-sm text-gray-400 mb-2">실행결과</p>

                {/* 프로그레스 바 */}
                {isRunning && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>⏳ 코드 실행 중...</span>
                      <span>{Math.round(runProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                        style={{ width: `${runProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-900 dark:bg-zinc-900 rounded p-3 h-full overflow-auto text-sm text-gray-100">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <span className="animate-spin">⚙️</span>
                      <span>Judge0 서버에서 코드를 실행하고 있습니다...</span>
                    </div>
                  ) : testResult ? (
                    testResult.error ? (
                      <span className="text-red-400">❌ {testResult.message}</span>
                    ) : (
                      <div>
                        <div className={`font-bold mb-2 ${testResult.overallResult === 'AC' ? 'text-green-400' : 'text-red-400'}`}>
                          {testResult.overallResult === 'AC' ? '✅ 정답!' : `❌ ${testResult.overallResult}`}
                          <span className="ml-2 text-gray-400 font-normal">
                            ({testResult.passedCount}/{testResult.totalCount} 통과)
                          </span>
                          {testResult.maxExecutionTime && (
                            <span className="ml-2 text-gray-500 font-normal text-xs">
                              실행시간: {testResult.maxExecutionTime}ms
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
                                출력: "{tc.actualOutput?.trim()}"
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
                    <span className="text-gray-500">💡 코드를 작성하고 "코드 실행" 버튼을 클릭하세요.</span>
                  )}
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700 bg-zinc-800 flex-shrink-0">
                <button onClick={handleResetCode} className="px-4 py-2 text-gray-400 hover:text-white">
                  초기화
                </button>
                <button onClick={handleTestRun} disabled={isRunning}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-50 flex items-center gap-2">
                  {isRunning ? (
                    <>
                      <span className="animate-spin">⚙️</span>
                      실행 중...
                    </>
                  ) : (
                    '코드 실행'
                  )}
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting || !code.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded font-medium disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? '제출 중...' : '✓ 제출 후 채점하기'}
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
          trackerType={selectedTrackerType}
          problemId={Number(problemId)}
          isEnabled={eyeTrackingEnabled}
          timeLimitMinutes={customTimeMinutes}
          onReady={handleEyeTrackerReady}
          onSessionStart={handleSessionStart}
          onSessionEnd={handleSessionEnd}
          onNoFaceStateChange={setNoFaceState}
          onDrowsinessStateChange={handleDrowsinessStateChange}
          onMultipleFacesDetected={handleMultipleFacesDetected}
        />
      )}

      {/* 집중 모드 경고 팝업 */}
      <ViolationWarnings
        showFullscreenWarning={showFullscreenWarning}
        showTabSwitchWarning={showTabSwitchWarning}
        showMouseLeaveWarning={showMouseLeaveWarning}
        showDevtoolsWarning={showDevtoolsWarning}
        violationCount={violationCount}
        onDismissFullscreen={dismissFullscreenWarning}
        onDismissTabSwitch={dismissTabSwitchWarning}
        onDismissMouseLeave={dismissMouseLeaveWarning}
        onDismissDevtools={dismissDevtoolsWarning}
        // [Phase 2] NO_FACE 경고 props
        showNoFaceWarning={noFaceState.showNoFaceWarning}
        noFaceDuration={noFaceState.noFaceDuration}
        noFaceProgress={noFaceState.noFaceProgress}
        // [MediaPipe] 졸음 감지 경고 props
        showDrowsinessWarning={drowsinessState.isDrowsy && selectedTrackerType === TRACKER_TYPES.MEDIAPIPE}
        drowsinessPerclos={drowsinessState.perclos}
        // [MediaPipe] 다중 인물 감지 경고 props
        showMultipleFacesWarning={multipleFacesState.faceCount > 1 && selectedTrackerType === TRACKER_TYPES.MEDIAPIPE}
        multipleFacesCount={multipleFacesState.faceCount}
      />

      {/* [Phase 2] 패널티 알림 */}
      <PenaltyNotification
        notification={penaltyNotification}
        onDismiss={dismissNotification}
        penaltyStatus={getPenaltyStatus()}
      />

      {/* 커스텀 Confirm 모달 (전체화면 유지용) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal(prev => ({ ...prev, isOpen: false })))}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />
    </div>
  );
};

export default ProblemSolve;