import { useState, useEffect, useCallback, useRef } from 'react';
import { startProblemSolve, submitCode, runTestCode } from '../../service/algorithm/AlgorithmApi';
import { codeTemplates } from '../../components/algorithm/editor/editorUtils';

/**
 * 문제 풀이 상태 관리 커스텀 훅
 *
 * 변경사항:
 * - solveMode 지원 추가 (BASIC/FOCUS)
 * - monitoringSessionId 지원 추가
 *
 * @param {number} problemId - 문제 ID
 * @param {object} options - 옵션
 * @param {string} options.solveMode - 풀이 모드 ('BASIC' | 'FOCUS')
 * @param {string} options.monitoringSessionId - 모니터링 세션 ID (FOCUS 모드일 때)
 */
export const useProblemSolve = (problemId, options = {}) => {
  const { solveMode = 'BASIC', monitoringSessionId = null } = options;

  // 문제 데이터 상태
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 에디터 상태
  const [language, setLanguage] = useState('python');
  // 집중모드에서는 빈 코드, 기본모드에서는 템플릿 제공
  const [code, setCode] = useState(solveMode === 'FOCUS' ? '' : codeTemplates.python);

  // 타이머 상태
  const [timeLimit, setTimeLimit] = useState(1800);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const startTimeRef = useRef(null);

  // 실행/제출 상태
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // 문제 데이터 로드
  const fetchProblem = useCallback(async () => {
    if (!problemId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await startProblemSolve(problemId);
      
      if (res.error) {
        setError(res.message);
        return;
      }
      
      const data = res.data || res;
      setProblem(data);
      
      // 제한시간 설정 (ms → 초, 기본 30분)
      const limit = data.timelimit ? Math.floor(data.timelimit / 1000) : 1800;
      setTimeLimit(limit);
      setTimeLeft(limit);
      startTimeRef.current = new Date();
      
    } catch {
      setError('문제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  // 초기 로드
  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  // 타이머 효과
  useEffect(() => {
    if (!isTimerRunning) return;
    
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // 언어 변경 시 코드 템플릿 업데이트 (집중모드에서는 빈 코드)
  useEffect(() => {
    if (solveMode === 'FOCUS') {
      setCode('');
    } else {
      setCode(codeTemplates[language] || '');
    }
  }, [language, solveMode]);

  // 경과 시간 계산
  const getElapsedTime = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Math.floor((new Date() - startTimeRef.current) / 1000);
  }, []);

  // 언어 변경 (확인 포함)
  const changeLanguage = useCallback((newLang, skipConfirm = false) => {
    if (skipConfirm || window.confirm(`언어를 ${newLang.toUpperCase()}로 변경하시겠습니까?\n현재 작성한 코드가 초기화됩니다.`)) {
      setLanguage(newLang);
      // 집중모드에서는 빈 코드, 기본모드에서는 템플릿 제공
      setCode(solveMode === 'FOCUS' ? '' : (codeTemplates[newLang] || ''));
      return true;
    }
    return false;
  }, [solveMode]);

  // 코드 초기화
  const resetCode = useCallback((skipConfirm = false) => {
    if (skipConfirm || window.confirm('코드를 초기화하시겠습니까?')) {
      // 집중모드에서는 빈 코드, 기본모드에서는 템플릿 제공
      setCode(solveMode === 'FOCUS' ? '' : (codeTemplates[language] || ''));
      setTestResult(null);
      return true;
    }
    return false;
  }, [language, solveMode]);

  // 타이머 토글
  const toggleTimer = useCallback(() => {
    setIsTimerRunning(prev => !prev);
  }, []);

  // 타이머 시작
  const startTimer = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = new Date();
    }
    setIsTimerRunning(true);
  }, []);

  // 타이머 정지
  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  // 코드 테스트 실행
  const runTest = useCallback(async () => {
    if (!code.trim()) {
      return { error: true, message: '코드를 작성해주세요!' };
    }
    
    setIsRunning(true);
    setTestResult(null);
    
    try {
      const res = await runTestCode({
        problemId: Number(problemId),
        language: language.toUpperCase(),
        sourceCode: code
      });
      
      const result = res.error ? res : (res.data || res);
      setTestResult(result);
      return result;
    } catch {
      const errorResult = { error: true, message: '테스트 실행 중 오류가 발생했습니다.' };
      setTestResult(errorResult);
      return errorResult;
    } finally {
      setIsRunning(false);
    }
  }, [code, problemId, language]);

  // 코드 제출
  // 변경: solveMode, monitoringSessionId 지원 추가
  const submit = useCallback(async (submitOptions = {}) => {
    if (!code.trim()) {
      return { error: true, message: '코드를 작성해주세요!' };
    }

    setIsSubmitting(true);
    stopTimer();

    // 옵션에서 전달받거나 기본값 사용
    const finalSolveMode = submitOptions.solveMode || solveMode;
    const finalMonitoringSessionId = submitOptions.monitoringSessionId || monitoringSessionId;

    try {
      const res = await submitCode({
        problemId: Number(problemId),
        language: language.toUpperCase(),
        sourceCode: code,
        elapsedTime: getElapsedTime(),
        solveMode: finalSolveMode,
        monitoringSessionId: finalSolveMode === 'FOCUS' ? finalMonitoringSessionId : null
      });

      if (res.error) {
        setSubmissionResult({ error: true, message: res.message });
        return res;
      }

      const result = res.data || res;
      setSubmissionResult(result);
      return result;
    } catch {
      const errorResult = { error: true, message: '코드 제출 중 오류가 발생했습니다.' };
      setSubmissionResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  }, [code, problemId, language, getElapsedTime, stopTimer, solveMode, monitoringSessionId]);

  // 시간 포맷팅
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // 문제 데이터
    problem,
    loading,
    error,
    refetch: fetchProblem,
    
    // 에디터 상태
    language,
    code,
    setCode,
    changeLanguage,
    resetCode,
    
    // 타이머 상태
    timeLimit,
    timeLeft,
    isTimerRunning,
    toggleTimer,
    startTimer,
    stopTimer,
    getElapsedTime,
    formatTime,
    
    // 실행/제출 상태
    testResult,
    isRunning,
    isSubmitting,
    submissionResult,
    runTest,
    submit,
    
    // 유틸리티
    isTimeWarning: timeLeft <= 300,
    isTimeUp: timeLeft <= 0,
    hasCode: code.trim().length > 0,
    codeStats: {
      lines: code.split('\n').length,
      chars: code.length
    }
  };
};

export default useProblemSolve;
