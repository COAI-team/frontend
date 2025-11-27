import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../../components/algorithm/editor/CodeEditor';
import { codeTemplates } from '../../components/algorithm/editor/editorUtils';
import { useResizableLayout, useVerticalResizable } from '../../hooks/algorithm/useResizableLayout';
import { startProblemSolve, submitCode, runTestCode } from '../../service/algorithm/algorithmApi';

/**
 * 문제 풀이 페이지 - 백엔드 API 연동 + 다크 테마
 * ✅ 수평(좌우) + 수직(상하) 리사이저 지원
 */
const ProblemSolve = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // 문제 데이터 상태
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 에디터 상태
  const [selectedLanguage, setSelectedLanguage] = useState('python');
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

  // 코드 제출
  const handleSubmit = useCallback(async () => {
    if (!code.trim()) {
      alert('코드를 작성해주세요!');
      return;
    }

    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const res = await submitCode({
        problemId: Number(problemId),
        language: selectedLanguage.toUpperCase(),
        sourceCode: code,
        elapsedTime: getElapsedTime()
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
  }, [code, problemId, selectedLanguage, navigate, getElapsedTime]);

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
        setProblem(problemData);
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
    setCode(codeTemplates[selectedLanguage] || '');
  }, [selectedLanguage]);

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 언어 변경
  const handleLanguageChange = (lang) => {
    if (window.confirm(`언어를 ${lang.toUpperCase()}로 변경하시겠습니까?\n현재 작성한 코드가 초기화됩니다.`)) {
      setSelectedLanguage(lang);
      setCode(codeTemplates[lang] || '');
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
        language: selectedLanguage.toUpperCase(),
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
      setCode(codeTemplates[selectedLanguage] || '');
    }
  };

  // 난이도 색상
  const getDifficultyColor = (diff) => {
    const colors = {
      'BRONZE': 'text-orange-400',
      'SILVER': 'text-gray-400',
      'GOLD': 'text-yellow-400',
      'PLATINUM': 'text-cyan-400'
    };
    return colors[diff] || 'text-gray-400';
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
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm">Eye Tracking</span>
                <span className="font-mono">{formatTime(getElapsedTime())}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm">풀이 시간</span>
                <span className={`font-mono ${timeLeft <= 300 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <button onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-3 py-1 rounded text-sm ${isTimerRunning ? 'bg-red-600' : 'bg-green-600'}`}>
                {isTimerRunning ? '일시정지' : '시작'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 문제 메타 정보 바 */}
      <div className="bg-purple-900/30 border-b border-purple-800/50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-purple-400">&lt;&gt;</span>
            <span className={getDifficultyColor(problem?.difficulty)}>
              {problem?.difficulty || 'N/A'}
            </span>
            <span className="text-gray-500">/</span>
            <span>{selectedLanguage.toUpperCase()}</span>
            <span className="text-gray-500">/</span>
            <span>AI_GENERATED</span>
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

              <div className="prose prose-invert prose-sm max-w-none space-y-4">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {problem?.description || '문제 설명이 없습니다.'}
                </p>

                {problem?.sampleTestCases?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-white">예제</h3>
                    {problem.sampleTestCases.map((tc, idx) => (
                      <div key={idx} className="bg-zinc-900 rounded p-4 mb-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">입력</p>
                            <pre className="text-sm bg-zinc-950 p-2 rounded font-mono">{tc.input}</pre>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">출력</p>
                            <pre className="text-sm bg-zinc-950 p-2 rounded font-mono">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <select value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-zinc-700 border-none rounded px-3 py-1 text-sm">
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
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

            {/* ✅ 실행결과 영역 (수직 리사이저블) */}
            <div style={{ height: `${100 - editorHeight}%` }} className="flex flex-col min-h-0">
              <div className="p-3 bg-zinc-850 flex-1 overflow-auto">
                <p className="text-sm text-gray-400 mb-2">실행결과</p>

                {/* 프로그레스 바 */}
                {isRunning && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>⏳ 코드 실행 중...</span>
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

                <div className="bg-zinc-900 rounded p-3 h-full overflow-auto text-sm">
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
    </div>
  );
};

export default ProblemSolve;