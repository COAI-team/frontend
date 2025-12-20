import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import CodeEditor from '../../components/algorithm/editor/CodeEditor';
import { codeTemplates, LANGUAGE_MAP, LANGUAGE_NAME_TO_TEMPLATE_KEY } from '../../components/algorithm/editor/editorUtils';
import { useResizableLayout, useVerticalResizable } from '../../hooks/algorithm/useResizableLayout';
import { useFocusViolationDetection } from '../../hooks/algorithm/useFocusViolationDetection';
import { startProblemSolve, submitCode, runTestCode, getUsageInfo, getProblem } from '../../service/algorithm/algorithmApi';
import { useLogin } from '../../context/login/useLogin';
import EyeTracker, { TRACKER_TYPES } from '../../components/algorithm/eye-tracking/EyeTracker';
import ModeSelectionScreen from '../../components/algorithm/ModeSelectionScreen';
import ViolationWarnings from '../../components/algorithm/ViolationWarnings';
import PenaltyNotification from '../../components/algorithm/PenaltyNotification';
import ConfirmModal from '../../components/algorithm/ConfirmModal';
import { useViolationPenalty } from '../../hooks/algorithm/useViolationPenalty';
import { useApplyThemeClass } from '../../hooks/useApplyThemeClass';
import { extractPureDescription, renderFormattedText } from '../../components/algorithm/problem/markdownUtils';
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";
import '../../styles/ProblemDetail.css';
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
  const {problemId} = useParams();
  const navigate = useNavigate();
  const { user } = useLogin();
  const editorRef = useRef(null);
  const eyeTrackerRef = useRef(null); // 시선 추적 ref
  const handleSubmitRef = useRef(null); // 자동 제출용 ref (stale closure 방지)
  const noFaceSustainedRecordedRef = useRef(false); // NO_FACE_SUSTAINED 중복 기록 방지

  // 테마 적용 (이 페이지는 Layout 밖에 있어서 직접 호출 필요)
  useApplyThemeClass();

  // 커스텀 Alert 훅
  const { alert, showAlert, closeAlert } = useAlert();
  
  // 문제 데이터 상태
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 구독 및 사용량 제한 상태
  const [usageInfo, setUsageInfo] = useState(null);
  const rawTier = user?.subscriptionTier;
  const subscriptionTier = rawTier === 'BASIC' || rawTier === 'PRO' ? rawTier : 'FREE';
  const isUsageLimitExceeded = usageInfo && !usageInfo.isSubscriber && usageInfo.remaining <= 0;

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
  const [isTimerHovered, setIsTimerHovered] = useState(false); // 타이머 hover 상태 (시간 편집용)
  const [editingTimeValue, setEditingTimeValue] = useState(''); // 편집 중인 시간 문자열
  const [isEditingTime, setIsEditingTime] = useState(false); // 시간 편집 중 여부

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

  // [집중도 게이지] 실시간 집중도 점수 표시
  const [showFocusGauge, setShowFocusGauge] = useState(false);

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
  const [livenessWarning, setLivenessWarning] = useState(false); // 깜빡임 없음 경고 (사진/영상 감지)
  const livenessViolationRecordedRef = useRef(false); // 깜빡임 없음 위반 중복 기록 방지

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
  } = useResizableLayout(45, 20, 60);

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
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime, selectedMode, timerMode, elapsedTime]);

  // ========== 모드 선택 및 시작 핸들러 ==========

  // 모드 선택 완료 및 풀이 시작
  const handleStartSolving = useCallback((mode) => {
    // 학습 모드: 별도 페이지로 이동
    if (mode === 'LEARN') {
      navigate(`/algorithm/problems/${problemId}/learn`);
      return;
    }

    setSelectedMode(mode);
    setShowModeSelection(false);

    if (mode === 'FOCUS') {
      // 집중 모드: 모드 선택 화면에서 타이머 설정 완료 후 바로 시작
      const timeInSeconds = customTimeMinutes * 60;
      setTimeLeft(timeInSeconds);
      setStartTime(new Date());
      setSolvingStarted(true);

      // 디버그 모드 초기화 (캘리브레이션 후 미리보기 OFF 상태로 시작)
      setEyeTrackingDebugMode(false);
      setEyeTrackingReady(false);
      // 이전 세션의 디버그 UI 요소 정리
      const oldDebugContainer = document.getElementById('mediapipeDebugContainer');
      if (oldDebugContainer) oldDebugContainer.remove();
      const oldGazeDot = document.getElementById('mediapipeGazeDot');
      if (oldGazeDot) oldGazeDot.remove();

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
  }, [customTimeMinutes, enterFullscreen, navigate, problemId]);


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

  // 깜빡임 없음 위반 (MediaPipe only, Liveness 검증) - 중복 기록 방지
  useEffect(() => {
    if (livenessWarning && selectedMode === 'FOCUS' && selectedTrackerType === TRACKER_TYPES.MEDIAPIPE) {
      if (!livenessViolationRecordedRef.current) {
        livenessViolationRecordedRef.current = true;
        recordViolation('NO_BLINK_SUSTAINED');
      }
    } else if (!livenessWarning) {
      // 경고 상태가 해제되면 플래그 리셋
      livenessViolationRecordedRef.current = false;
    }
  }, [livenessWarning, selectedMode, selectedTrackerType, recordViolation]);

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

  // 모드 선택 페이지로 돌아가기 (확인창 포함)
  const handleBackToModeSelection = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: '모드 선택으로 돌아가기',
      message: '이 페이지에서 나가면 기존에 작성한 코드는 사라집니다.\n그래도 나가겠습니까?',
      confirmText: '나가기',
      cancelText: '취소',
      onConfirm: async () => {
        setConfirmModal(prev => ({...prev, isOpen: false}));

        // 시선 추적 세션 종료 (handleSubmit과 동일한 패턴)
        if (eyeTrackingEnabled && eyeTrackerRef.current) {
          await eyeTrackerRef.current.stopTracking(timeLeft);
          setEyeTrackingEnabled(false);
          setMonitoringSessionId(null);
        }

        // 디버그 모드 UI 요소 정리 (document.body에 직접 추가된 요소들)
        const debugContainer = document.getElementById('mediapipeDebugContainer');
        if (debugContainer) debugContainer.remove();
        const gazeDot = document.getElementById('mediapipeGazeDot');
        if (gazeDot) gazeDot.remove();

        // 상태 초기화
        setShowModeSelection(true);
        setSelectedMode(null);
        setSolvingStarted(false);
        setIsTimerRunning(false);
        setEyeTrackingDebugMode(false); // 디버그 모드 초기화
        setEyeTrackingReady(false); // 추적 준비 상태 초기화
        setCode('');
        setTestResult(null);
      },
      onCancel: () => {
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  }, [timeLeft, eyeTrackingEnabled]);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    if (!showModeSelection && solvingStarted) {
      // popstate 이벤트 (브라우저 뒤로가기 버튼)
      const handlePopState = (e) => {
        e.preventDefault();
        // 히스토리에 다시 추가하여 페이지 이탈 방지
        globalThis.history.pushState(null, '', globalThis.location.href);
        handleBackToModeSelection();
      };

      // 키보드 뒤로가기 (Cmd+[ 또는 Ctrl+[)
      const handleKeyDown = (e) => {
        // Mac: Cmd+[, globalThiss/Linux: Ctrl+[
        if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          handleBackToModeSelection();
        }
      };

      // 히스토리에 현재 상태 추가 (뒤로가기 시 popstate 트리거용)
      globalThis.history.pushState(null, '', globalThis.location.href);

      globalThis.addEventListener('popstate', handlePopState);
      globalThis.addEventListener('keydown', handleKeyDown);

      return () => {
        globalThis.removeEventListener('popstate', handlePopState);
        globalThis.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showModeSelection, solvingStarted, handleBackToModeSelection]);

  // 코드 제출
  // 변경: solveMode, monitoringSessionId 추가
  const handleSubmit = useCallback(async () => {
    if (!code.trim()) {
      showAlert({
        type: 'warning',
        title: '코드 없음',
        message: '코드를 작성한 후 제출해주세요.'
      });
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
        showAlert({
          type: 'error',
          title: '제출 실패',
          message: res.message || '코드 제출에 실패했습니다.'
        });
      } else {
        const responseData = res.Data || res.data || res;
        const submissionId = responseData?.algosubmissionId || responseData?.submissionId;
        navigate(`/algorithm/submissions/${submissionId}`);
      }
    } catch {
      showAlert({
        type: 'error',
        title: '오류 발생',
        message: '코드 제출 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, monitoringSessionId, solveMode, eyeTrackingEnabled, showAlert, timeLeft, problemId, selectedLanguageId, getElapsedTime, alert, navigate]);

  // [Phase 2] handleSubmit ref 업데이트 (자동 제출용)
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // 로그인 여부 확인
  const isLoggedIn = !!user?.userId;

  // 문제 데이터 로드
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      setError(null);

      try {
        // 비회원인 경우: 공개 API(getProblem)로 문제 데이터만 조회
        // 회원인 경우: startProblemSolve API로 풀이 시작
        if (!user?.userId) {
          console.log('📥 비회원 - 문제 데이터만 조회');
          const res = await getProblem(problemId);

          if (res.error) {
            setError(res.message);
            return;
          }

          const problemData = res.Data || res.data || res;
          console.log('📋 문제 데이터 (비회원):', problemData);

          // 문제 데이터 설정 (풀이는 시작하지 않음)
          setProblem({
            ...problemData,
            problemId: problemData.algoProblemId,
            title: problemData.algoProblemTitle,
            description: problemData.algoProblemDescription,
            difficulty: problemData.algoProblemDifficulty,
          });
        } else {
          // 회원인 경우: 기존 로직
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
        }
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
  }, [problemId, user?.userId]);

  // 사용량 정보 조회
  useEffect(() => {
    const fetchUsageInfo = async () => {
      if (!user?.userId) return;
      try {
        const response = await getUsageInfo(user.userId);
        if (response.data) {
          setUsageInfo(response.data);
        }
      } catch (err) {
        console.error('사용량 조회 실패:', err);
      }
    };
    fetchUsageInfo();
  }, [user?.userId]);

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
                setConfirmModal(prev => ({...prev, isOpen: false}));
                handleSubmit();
              },
              onCancel: () => {
                // 타이머 비활성화하고 계속 풀기
                setConfirmModal(prev => ({...prev, isOpen: false}));
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

  // 초기 코드 설정 (집중모드에서는 빈 코드, 기본모드에서는 템플릿)
  useEffect(() => {
    if (selectedMode === 'FOCUS') {
      // 집중모드: 빈 코드
      setCode('');
      console.log(`[ProblemSolve] FOCUS mode - empty code`);
    } else {
      // 기본모드: 템플릿 제공
      const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[selectedLanguage] || selectedLanguage;
      const template = codeTemplates[templateKey] || codeTemplates['default'] || '// 코드를 작성하세요';
      console.log(`[ProblemSolve] Loading template for language: ${selectedLanguage}`, {
        templateKey,
        hasTemplate: !!codeTemplates[templateKey],
        templateLength: template.length
      });
      setCode(template);
    }
  }, [selectedLanguage, selectedMode]);

  // 시간 포맷팅 (HH:MM:SS)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

        // 집중모드에서는 빈 코드, 기본모드에서는 템플릿 제공
        if (selectedMode === 'FOCUS') {
          setCode('');
        } else {
          const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[langName] || langName;
          setCode(codeTemplates[templateKey] || codeTemplates['default'] || '// 코드를 작성하세요');
        }
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  // 코드 테스트 실행
  const handleTestRun = async () => {
    if (!code.trim()) {
      showAlert({
        type: 'warning',
        title: '입력 필요',
        message: '코드를 작성해주세요!'
      });
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
        setTestResult({error: true, message: res.message || '테스트 실행 실패'});
      } else {
        setTestResult(res.Data || res.data || res);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setRunProgress(0);
      console.error('테스트 실행 오류:', err);
      setTestResult({error: true, message: '테스트 실행 중 오류가 발생했습니다.'});
    } finally {
      setTimeout(() => {
        setIsRunning(false);
        setRunProgress(0);
      }, 500);
    }
  };

  // 에디터 마운트
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = {editor, monaco};
  };

  // 코드 초기화 (커스텀 모달 사용 - 전체화면 유지)
  const handleResetCode = () => {
    setConfirmModal({
      isOpen: true,
      title: '코드 초기화',
      message: '코드를 초기화하시겠습니까?\n현재 작성한 코드가 삭제됩니다.',
      onConfirm: () => {
        // 집중모드에서는 빈 코드, 기본모드에서는 템플릿 제공
        if (selectedMode === 'FOCUS') {
          setCode('');
        } else {
          const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[selectedLanguage] || selectedLanguage;
          setCode(codeTemplates[templateKey] || codeTemplates['default'] || '// 코드를 작성하세요');
        }
        setConfirmModal(prev => ({...prev, isOpen: false}));
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

  const getProblemTypeBadgeClass = (type) => {
    return type === 'SQL' ? 'badge-database' : 'badge-algorithm';
};

  // 구조화된 문제 섹션 존재 여부 (백엔드에서 직접 제공)
  const hasStructuredSections = problem?.inputFormat || problem?.outputFormat || problem?.constraints || problem?.sampleTestCases?.length > 0;

  // 필터링된 언어 목록 (useMemo로 캐싱 - 렌더링 중 반복 계산 방지)
  const filteredLanguages = useMemo(() => {
    if (!problem?.availableLanguages) return [];

    const seen = new Set();
    const filtered = problem.availableLanguages.filter(lang => {
      if (seen.has(lang.languageName)) return false;
      seen.add(lang.languageName);
      // 백엔드에서 제공하는 언어 목록을 신뢰 (ALLOWED_LANGUAGES 하드코딩 제거)
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

  // MediaPipe 전용 콜백: 깜빡임 없음 경고 (Liveness 검증)
  const handleLivenessWarningChange = useCallback((isWarning) => {
    setLivenessWarning(isWarning);
    if (isWarning) {
      console.log('👁️ Liveness warning: No blink detected for 30+ seconds');
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
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
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
          <button onClick={() => navigate('/algorithm')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
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
        // 구독 및 사용량 제한 props
        subscriptionTier={subscriptionTier}
        isUsageLimitExceeded={isUsageLimitExceeded}
        usageInfo={usageInfo}
        // 로그인 여부 props
        isLoggedIn={isLoggedIn}
      />
    );
  }


  return (
    <div className="h-screen bg-zinc-900 text-gray-100 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="bg-zinc-800 border-b border-zinc-700 shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 모드 선택으로 돌아가기 버튼 */}
              <button
                onClick={handleBackToModeSelection}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                ← 모드 선택
              </button>
              <div>
                <h1
                  className="text-xl font-bold text-white">#{problem?.problemId || problemId} {problem?.title || '문제'}</h1>
                <p className="text-sm text-gray-400 mt-1">
                  맞힌사람 {problem?.successCount || 0} • 제출 {problem?.totalAttempts || 0}
                </p>
              </div>
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
                <span
                  className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                <span className="text-sm">
                  {selectedMode === 'BASIC' ? (timerMode === 'TIMER' ? '타이머' : '스톱워치') : '남은 시간'}
                </span>

                {/* 기본 모드 + 타이머 + 실행 전: hover 시 시간 편집 (시:분만, 초는 00 고정) */}
                {selectedMode === 'BASIC' && timerMode === 'TIMER' && !isTimerRunning ? (
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setIsTimerHovered(true);
                      if (!isEditingTime) {
                        // 시:분만 편집 (HH:MM 형식)
                        const hours = Math.floor(timeLeft / 3600);
                        const mins = Math.floor((timeLeft % 3600) / 60);
                        setEditingTimeValue(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
                      }
                    }}
                    onMouseLeave={() => {
                      // 편집 중이면 값 적용
                      if (isEditingTime) {
                        const match = editingTimeValue.match(/^(\d{1,2}):(\d{1,2})$/);
                        if (match) {
                          const hours = Math.min(3, parseInt(match[1]) || 0);
                          const mins = Math.min(59, parseInt(match[2]) || 0);
                          const totalSeconds = Math.max(0, Math.min(10800, hours * 3600 + mins * 60));
                          setTimeLeft(totalSeconds);
                          setCustomTimeMinutes(hours * 60 + mins);
                        }
                        setIsEditingTime(false);
                      }
                      setIsTimerHovered(false);
                    }}
                  >
                    <div className={`text-center font-mono text-lg px-2 py-1 rounded transition-all w-32 ${
                      isTimerHovered
                        ? 'bg-zinc-600 ring-2 ring-yellow-500/50'
                        : 'bg-zinc-700/50 hover:bg-zinc-700'
                    }`}>
                      {isTimerHovered ? (
                        <div className="flex items-center justify-center">
                          <input
                            type="text"
                            value={isEditingTime ? editingTimeValue : (() => {
                              const hours = Math.floor(timeLeft / 3600);
                              const mins = Math.floor((timeLeft % 3600) / 60);
                              return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                            })()}
                            onFocus={() => {
                              setIsEditingTime(true);
                              const hours = Math.floor(timeLeft / 3600);
                              const mins = Math.floor((timeLeft % 3600) / 60);
                              setEditingTimeValue(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
                            }}
                            onChange={(e) => {
                              // 숫자와 콜론만 허용, 최대 5자 (HH:MM)
                              const value = e.target.value.replace(/[^0-9:]/g, '').slice(0, 5);
                              setEditingTimeValue(value);
                            }}
                            onBlur={() => {
                              const match = editingTimeValue.match(/^(\d{1,2}):(\d{1,2})$/);
                              if (match) {
                                const hours = Math.min(3, parseInt(match[1]) || 0);
                                const mins = Math.min(59, parseInt(match[2]) || 0);
                                const totalSeconds = Math.max(0, Math.min(10800, hours * 3600 + mins * 60));
                                setTimeLeft(totalSeconds);
                                setCustomTimeMinutes(hours * 60 + mins);
                              }
                              setIsEditingTime(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const match = editingTimeValue.match(/^(\d{1,2}):(\d{1,2})$/);
                                if (match) {
                                  const hours = Math.min(3, parseInt(match[1]) || 0);
                                  const mins = Math.min(59, parseInt(match[2]) || 0);
                                  const totalSeconds = Math.max(0, Math.min(10800, hours * 3600 + mins * 60));
                                  setTimeLeft(totalSeconds);
                                  setCustomTimeMinutes(hours * 60 + mins);
                                }
                                setIsEditingTime(false);
                                e.target.blur();
                              }
                            }}
                            className="w-14 bg-transparent text-yellow-400 text-center outline-none font-mono text-lg"
                          />
                          <span className="text-gray-500 font-mono text-lg">:00</span>
                        </div>
                      ) : (
                        <span className="text-yellow-400 cursor-pointer" title="마우스를 올려 시간 수정">
                          {formatTime(timeLeft)}
                        </span>
                      )}
                    </div>
                    {isTimerHovered && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs text-gray-500 whitespace-nowrap">
                        최대 3시간 (03:00)
                      </div>
                    )}
                  </div>
                ) : (
                  <span className={`font-mono text-lg w-28 text-center inline-block ${
                    selectedMode === 'FOCUS' || timerMode === 'TIMER'
                      ? (timeLeft <= 300 ? 'text-red-400' : 'text-yellow-400')
                      : 'text-cyan-400'
                  }`}>
                    {selectedMode === 'FOCUS' || timerMode === 'TIMER'
                      ? formatTime(timeLeft)
                      : formatTime(elapsedTime)
                    }
                  </span>
                )}

                {/* 집중도 게이지 토글 - 집중 모드 + MediaPipe + 추적 준비 완료 시 */}
                {selectedMode === 'FOCUS' && eyeTrackingReady && selectedTrackerType === 'mediapipe' && (
                  <div className="relative group ml-3">
                    <button
                      onClick={() => setShowFocusGauge(prev => !prev)}
                      className={`w-8 h-8 rounded-lg text-base transition-all flex items-center justify-center ${
                        showFocusGauge
                          ? 'bg-emerald-600/80 text-white ring-1 ring-emerald-400 shadow-lg shadow-emerald-500/20 cursor-pointer'
                          : 'bg-zinc-700/80 text-gray-400 hover:bg-zinc-600 hover:text-white cursor-pointer'
                      }`}
                    >
                      {showFocusGauge ? '🚨' : '🚨'}
                    </button>
                    {/* 호버 툴팁 - 아래에 표시 */}
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-zinc-700 z-50">
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-900"></div>
                      집중도 게이지 {showFocusGauge ? '숨기기' : '보기'}
                      <div className="text-gray-400 mt-0.5">실시간 집중 정도를 확인</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 타이머 컨트롤 - 기본 모드에서만 수동 제어 가능 */}
              {selectedMode === 'BASIC' && (
                <div className="flex items-center gap-2">
                  {/* 타이머/스톱워치 모드 토글 */}
                  {!isTimerRunning && (
                    <div className="flex items-center bg-zinc-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setTimerMode('TIMER')}
                        className={`px-2 py-1 rounded text-xs transition-all ${
                          timerMode === 'TIMER'
                            ? 'bg-yellow-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        } cursor-pointer`}
                      >
                        ⏱️ 타이머
                      </button>
                      <button
                        onClick={() => setTimerMode('STOPWATCH')}
                        className={`px-2 py-1 rounded text-xs transition-all ${
                          timerMode === 'STOPWATCH'
                            ? 'bg-cyan-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        } cursor-pointer`}
                      >
                        ⏱️ 스톱워치
                      </button>
                    </div>
                  )}

                  {/* 시작/일시정지/재개 버튼 */}
                  {isTimerRunning ? (
                    <button
                      onClick={handleToggleTimer}
                      className="px-3 py-1 rounded text-sm bg-red-600 hover:bg-red-700 text-white"
                    >
                      일시정지
                    </button>
                  ) : (
                    <button
                      onClick={handleStartTimer}
                      className="px-3 py-1 rounded text-sm bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    >
                      시작
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

              {/* 집중 모드 상태 표시는 상단 중앙 바로 이동됨 */}
            </div>
          </div>
        </div>
      </div>

      {/* 집중 모드 상태 바 (상단 중앙) */}
      {selectedMode === 'FOCUS' && (
        <div className="bg-zinc-850 border-b border-zinc-700 py-2 flex-shrink-0">
          <div className="flex justify-center items-center gap-4">
            {/* 추적기 상태 표시 */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg">
              <span className={`text-xs px-2 py-0.5 rounded ${
                selectedTrackerType === 'mediapipe'
                  ? 'bg-purple-900/50 text-purple-300'
                  : 'bg-blue-900/50 text-blue-300'
              }`}>
                {selectedTrackerType === 'mediapipe' ? 'MediaPipe' : 'WebGazer'}
              </span>
              <span
                className={`flex items-center gap-1.5 text-sm font-medium ${eyeTrackingReady ? 'text-green-400' : 'text-yellow-400'}`}>
                {eyeTrackingReady && (
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                )}
                {eyeTrackingReady ? '추적 중' : selectedTrackerType === 'mediapipe' ? '준비 중...' : '캘리브레이션 중...'}
              </span>
            </div>

            {/* 디버그 버튼 (추적 준비 완료 시에만) */}
            {eyeTrackingReady && (
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
                <span>{eyeTrackingDebugMode ? '미리보기 ON' : '미리보기'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 container mx-auto px-6 py-4 min-h-0" ref={containerRef}>
        <div className="flex h-full gap-1">

          {/* 왼쪽: 문제 설명 */}
          <div className="bg-zinc-800 rounded-lg overflow-auto" style={{width: `${leftPanelWidth}%`}}>
            <div className="p-6">
              {/* 문제 설명 제목 + 제한 정보 (같은 줄) */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white">문제 설명</h2>
                <div className="flex flex-wrap gap-2 justify-end">
                  <span className={`px-3 py-1 rounded-full text-xs border ${getDifficultyBadge(problem?.difficulty)}`}>
                    {problem?.difficulty || 'N/A'}
                  </span>
                  <span className={`badge ${getProblemTypeBadgeClass(problem.problemType)}`}>
                      {problem.problemType === 'SQL' ? 'DATABASE' : 'ALGORITHM'}
                  </span>
                  {/* 문제 태그 - ProblemDetail.jsx와 동일한 스타일 */}
                  {problem?.algoProblemTags && (() => {
                    try {
                      const tags = JSON.parse(problem.algoProblemTags);
                      return tags.map((tag, idx) => (
                        <span key={idx} className="badge badge-tag">
                          {tag}
                        </span>
                      ));
                    } catch {
                      return <span className="badge badge-tag">{problem.algoProblemTags}</span>;
                    }
                  })()}
                </div>
              </div>

              {/* 구조화된 문제 내용 - 백엔드에서 직접 제공된 필드 사용 */}
              {hasStructuredSections ? (
                <div className="problem-content-area problem-solve-dark">
                  {/* 문제 설명 */}
                  <div className="section-card section-description">
                    <div className="section-header">
                      <span className="section-icon">📋</span>
                      <h2 className="section-title">문제 설명</h2>
                    </div>
                    <div className="section-content">
                      {renderFormattedText(
                        problem?.inputFormat
                          ? extractPureDescription(problem?.description)
                          : problem?.description
                      )}
                    </div>
                  </div>

                  {/* 입력/출력 그리드 */}
                  {(problem?.inputFormat || problem?.outputFormat) && (
                    <div className="io-grid">
                      {problem?.inputFormat && (
                        <div className="section-card section-input">
                          <div className="section-header">
                            <span className="section-icon">📥</span>
                            <h2 className="section-title">입력</h2>
                          </div>
                          <div className="section-content">
                            {renderFormattedText(problem.inputFormat)}
                          </div>
                        </div>
                      )}
                      {problem?.outputFormat && (
                        <div className="section-card section-output">
                          <div className="section-header">
                            <span className="section-icon">📤</span>
                            <h2 className="section-title">출력</h2>
                          </div>
                          <div className="section-content">
                            {renderFormattedText(problem.outputFormat)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 제한사항 */}
                  {problem?.constraints && (
                    <div className="section-card section-constraints">
                      <div className="section-header">
                        <span className="section-icon">⚠️</span>
                        <h2 className="section-title">제한 사항</h2>
                      </div>
                      <div className="section-content">
                        {renderFormattedText(problem.constraints)}
                      </div>
                    </div>
                  )}

                  {/* 예제 입출력 - DB에서 가져온 샘플 테스트케이스 */}
                  {problem?.sampleTestCases?.length > 0 && (
                    <div className="examples-section">
                      <h2 className="section-title">예제 입출력</h2>
                      <div className="examples-container">
                        {problem.sampleTestCases.map((tc, idx) => (
                          <div key={idx} className="example-grid">
                            <div className="example-item">
                              <h3 className="example-label">📝 예제 입력 {idx + 1}</h3>
                              <pre className="example-code">{tc.input}</pre>
                            </div>
                            <div className="example-item">
                              <h3 className="example-label">✅ 예제 출력 {idx + 1}</h3>
                              <pre className="example-code">{tc.expectedOutput}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* 구조화된 필드가 없는 경우 원본 출력 */
                <div className="problem-content-area problem-solve-dark">
                  <div className="section-card section-description">
                    <div className="section-header">
                      <span className="section-icon">📋</span>
                      <h2 className="section-title">문제 설명</h2>
                    </div>
                    <div className="section-content">
                      {renderFormattedText(problem?.description) || '문제 설명이 없습니다.'}
                    </div>
                  </div>

                  {problem?.sampleTestCases?.length > 0 && (
                    <div className="examples-section">
                      <h2 className="section-title">예제 입출력</h2>
                      <div className="examples-container">
                        {problem.sampleTestCases.map((tc, idx) => (
                          <div key={idx} className="example-grid">
                            <div className="example-item">
                              <h3 className="example-label">📝 예제 입력 {idx + 1}</h3>
                              <pre className="example-code">{tc.input}</pre>
                            </div>
                            <div className="example-item">
                              <h3 className="example-label">✅ 예제 출력 {idx + 1}</h3>
                              <pre className="example-code">{tc.expectedOutput}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
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
            style={{width: `${100 - leftPanelWidth}%`}}
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
                    (⏱ 시간제한: {problem.availableLanguages.find(l => l.languageName === selectedLanguage)?.timeLimit}ms /
                    💾 메모리제한: {problem.availableLanguages.find(l => l.languageName === selectedLanguage)?.memoryLimit}MB)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(code);
                        // 복사 성공 시 버튼 텍스트 임시 변경
                        const btn = document.getElementById('copyCodeBtn');
                        if (btn) {
                          btn.textContent = '✓';
                          setTimeout(() => {
                            btn.textContent = '📋';
                          }, 1500);
                        }
                      } catch (err) {
                        console.error('복사 실패:', err);
                      }
                    }}
                    id="copyCodeBtn"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded cursor-pointer"
                  >
                    📋
                  </button>
                  {/* 호버 툴팁 */}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-zinc-700 z-50">
                    복사
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ 에디터 영역 (수직 리사이저블) */}
            <div style={{height: `${editorHeight}%`}} className="min-h-0">
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
            <div style={{height: `${100 - editorHeight}%`}} className="flex flex-col min-h-0">
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
                        className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                        style={{width: `${runProgress}%`}}
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
                      <div className="space-y-3">
                        {/* 상단: 간략한 결과 요약 */}
                        <div className="flex items-center gap-3 pb-2 border-b border-zinc-700">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            testResult.overallResult === 'AC'
                              ? 'bg-green-900/50 text-green-400 border border-green-700'
                              : 'bg-red-900/50 text-red-400 border border-red-700'
                          }`}>
                            {testResult.overallResult === 'AC' ? '통과' : testResult.overallResult}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {testResult.passedCount}/{testResult.totalCount} 테스트 통과
                          </span>
                          {testResult.maxExecutionTime > 0 && (
                            <span className="text-gray-600 text-xs">
                              {testResult.maxExecutionTime}ms
                            </span>
                          )}
                        </div>

                        {/* 각 테스트케이스 출력 */}
                        {testResult.testCaseResults?.map((tc, idx) => (
                          <div key={idx} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                            {/* TC 헤더 */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-gray-400 text-xs font-medium">테스트 {tc.testCaseNumber}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                tc.result === 'AC'
                                  ? 'bg-green-900/30 text-green-500'
                                  : 'bg-red-900/30 text-red-500'
                              }`}>
                                {tc.result}
                              </span>
                              {tc.executionTime && (
                                <span className="text-gray-600 text-[10px]">{tc.executionTime}ms</span>
                              )}
                            </div>

                            {/* 입력 */}
                            {tc.input && (
                              <div className="mb-2">
                                <span className="text-gray-500 text-[10px] uppercase tracking-wide">입력</span>
                                <pre className="mt-1 p-2 bg-zinc-900 rounded text-xs text-cyan-400 font-mono overflow-x-auto whitespace-pre-wrap">
                                  {tc.input}
                                </pre>
                              </div>
                            )}

                            {/* 출력 (항상 표시) */}
                            <div className="mb-2">
                              <span className="text-gray-500 text-[10px] uppercase tracking-wide">출력</span>
                              <pre className={`mt-1 p-2 bg-zinc-900 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
                                tc.actualOutput ? 'text-green-400' : 'text-gray-600 italic'
                              }`}>
                                {tc.actualOutput?.trim() || '(출력 없음)'}
                              </pre>
                            </div>

                            {/* 기대 출력 (틀렸을 때만 표시) */}
                            {tc.result !== 'AC' && tc.expectedOutput && (
                              <div className="mb-2">
                                <span className="text-gray-500 text-[10px] uppercase tracking-wide">기대 출력</span>
                                <pre className="mt-1 p-2 bg-zinc-900 rounded text-xs text-yellow-400 font-mono overflow-x-auto whitespace-pre-wrap">
                                  {tc.expectedOutput}
                                </pre>
                              </div>
                            )}

                            {/* 에러 메시지 */}
                            {tc.errorMessage && (
                              <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-900/50">
                                <pre className="text-red-300 text-xs whitespace-pre-wrap">
                                  {tc.errorMessage}
                                </pre>
                              </div>
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
              <div
                className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700 bg-zinc-800 flex-shrink-0">
                <button onClick={handleResetCode} className="px-4 py-2 text-gray-400 hover:text-white cursor-pointer">
                  초기화
                </button>
                <button onClick={handleTestRun} disabled={isRunning}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-50 flex items-center gap-2 cursor-pointer">
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
                        className="px-6 py-2 bg-linear-to-r from-purple-500 to-pink-500 rounded font-medium disabled:opacity-50 flex items-center gap-2 cursor-pointer">
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
          onLivenessWarningChange={handleLivenessWarningChange}
          skipCalibration={true}
          showFocusGauge={showFocusGauge}
          focusGaugePosition="right-center"
          focusGaugeCompact={false}
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
        // [MediaPipe] 깜빡임 없음 경고 props (Liveness 검증)
        showLivenessWarning={livenessWarning && selectedTrackerType === TRACKER_TYPES.MEDIAPIPE}
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
        onCancel={confirmModal.onCancel || (() => setConfirmModal(prev => ({...prev, isOpen: false})))}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />

      {/* 🔔 AlertModal (단순 알림 전용) */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </div>
  );
};

export default ProblemSolve;
