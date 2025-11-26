import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../../components/algorithm/editor/CodeEditor';
import { codeTemplates } from '../../components/algorithm/editor/editorUtils';
import { useResizableLayout } from '../../hooks/algorithm/useResizableLayout';
import { startProblemSolve, submitCode, runTestCode } from '../../service/algorithm/algorithmApi';

/**
 * 문제 풀이 페이지 - 백엔드 API 연동 + 다크 테마
 * ✅ 수정: 백엔드 ProblemSolveResponseDto 필드명에 맞게 수정
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
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  
  // 타이머 상태
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  
  // 실행 결과 상태
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 리사이저블 레이아웃
  const { leftPanelWidth, isResizing, handleResizeStart, handleResize, handleResizeEnd, containerRef } = useResizableLayout(35, 20, 60);

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
        // ✅ 수정: Data (대문자 D) 필드 사용
        const responseData = res.Data || res.data || res;
        const submissionId = responseData?.algosubmissionId || responseData?.submissionId;
        navigate(`/algorithm/result/${submissionId}`);
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
        console.log('📥 API 응답:', res); // 디버깅용
        
        if (res.error) {
          setError(res.message);
          return;
        }
        
        // ✅ 수정: API 응답 구조에 맞게 데이터 설정
        // 백엔드 ApiResponse는 "Data" (대문자 D) 필드 사용
        const problemData = res.Data || res.data || res;
        console.log('📋 문제 데이터:', problemData); // 디버깅용
        setProblem(problemData);
        
        // ✅ 수정: 필드명 수정 (timelimit → timeLimit)
        // timeLimit은 ms 단위, 기본 30분(1800초)
        const limit = problemData.timeLimit ? Math.floor(problemData.timeLimit / 1000) : 1800;
        setTimeLeft(limit);
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

  // 리사이저 이벤트
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

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
    
    try {
      const res = await runTestCode({
        problemId: Number(problemId),
        language: selectedLanguage.toUpperCase(),
        sourceCode: code
      });
      
      console.log('🧪 테스트 결과:', res); // 디버깅용
      
      // ✅ 수정: 에러 체크 방식 개선
      if (res.error || (res.code && res.code !== '0000')) {
        setTestResult({ error: true, message: res.message || '테스트 실행 실패' });
      } else {
        // ✅ 수정: Data (대문자 D) 필드 사용
        setTestResult(res.Data || res.data || res);
      }
    } catch (err) {
      console.error('테스트 실행 오류:', err);
      setTestResult({ error: true, message: '테스트 실행 중 오류가 발생했습니다.' });
    } finally {
      setIsRunning(false);
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
              {/* ✅ 수정: algoProblemTitle → title */}
              <h1 className="text-xl font-bold">#{problemId} {problem?.title || '문제'}</h1>
              <p className="text-sm text-gray-400 mt-1">
                맞힌사람 {problem?.solvedCount || 0} • 제출한 사람 {problem?.submitCount || 0}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Eye Tracking 표시 */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm">Eye Tracking</span>
                <span className="font-mono">{formatTime(getElapsedTime())}</span>
              </div>
              
              {/* 제한시간 */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm">제한시간</span>
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
            {/* ✅ 수정: algoProblemDifficulty → difficulty */}
            <span className={getDifficultyColor(problem?.difficulty)}>
              {problem?.difficulty || 'N/A'}
            </span>
            <span className="text-gray-500">/</span>
            <span>{selectedLanguage.toUpperCase()}</span>
            <span className="text-gray-500">/</span>
            <span>AI_GENERATED</span>
            <span className="text-gray-500">/</span>
            {/* ✅ 수정: timelimit → timeLimit */}
            <span>제한시간 {problem?.timeLimit ? `${problem.timeLimit}ms` : '1000ms'}</span>
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
              
              <div className="prose prose-invert prose-sm max-w-none space-y-4">
                {/* ✅ 수정: algoProblemDescription → description */}
                <p className="text-gray-300 whitespace-pre-wrap">
                  {problem?.description || '문제 설명이 없습니다.'}
                </p>
                
                {/* ✅ 수정: testcases → sampleTestCases, inputData → input */}
                {problem?.sampleTestCases?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">예제</h3>
                    {problem.sampleTestCases.map((tc, idx) => (
                      <div key={idx} className="bg-zinc-900 rounded p-4 mb-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">입력</p>
                            {/* ✅ 수정: inputData → input */}
                            <pre className="text-sm bg-zinc-950 p-2 rounded">{tc.input}</pre>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">출력</p>
                            <pre className="text-sm bg-zinc-950 p-2 rounded">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 리사이저 */}
          <div className={`w-1 bg-zinc-700 hover:bg-purple-500 cursor-col-resize ${isResizing ? 'bg-purple-500' : ''}`}
            onMouseDown={handleResizeStart} />

          {/* 오른쪽: 코드 에디터 */}
          <div className="bg-zinc-800 rounded-lg flex flex-col overflow-hidden" style={{ width: `${100 - leftPanelWidth}%` }}>
            {/* 에디터 헤더 */}
            <div className="flex items-center justify-between p-3 border-b border-zinc-700">
              <div className="flex items-center gap-2">
                <select value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-zinc-700 border-none rounded px-3 py-1 text-sm">
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-zinc-700 rounded" title="복사">📋</button>
                <button className="p-2 hover:bg-zinc-700 rounded" title="전체화면">⛶</button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <CodeEditor
                language={selectedLanguage}
                value={code}
                onChange={setCode}
                onMount={handleEditorMount}
                height="100%"
                theme="vs-dark"
              />
            </div>

            {/* 실행결과 */}
            <div className="border-t border-zinc-700">
              <div className="p-3 bg-zinc-850">
                <p className="text-sm text-gray-400 mb-2">실행결과</p>
                <div className="bg-zinc-900 rounded p-3 h-[100px] overflow-auto text-sm">
                  {isRunning ? (
                    <span className="text-yellow-400">⏳ 실행 중...</span>
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
                        </div>
                        {testResult.testCaseResults?.map((tc, idx) => (
                          <div key={idx} className="text-xs mt-1">
                            <span className={tc.result === 'AC' ? 'text-green-400' : 'text-red-400'}>
                              TC{tc.testCaseNumber}: {tc.result}
                            </span>
                            {tc.errorMessage && (
                              <pre className="text-red-300 mt-1 text-xs whitespace-pre-wrap">{tc.errorMessage}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <span className="text-gray-500">실행결과가 여기에 표시됩니다.</span>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 버튼 - 항상 표시 */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-700 bg-zinc-800 flex-shrink-0">
              <button onClick={handleResetCode} className="px-4 py-2 text-gray-400 hover:text-white">
                초기화
              </button>
              <button onClick={handleTestRun} disabled={isRunning}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-50">
                코드 실행
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
  );
};

export default ProblemSolve;