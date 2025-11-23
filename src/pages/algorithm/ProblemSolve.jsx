import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../../components/algorithm/editor/CodeEditor';
import { codeTemplates, editorUtils } from '../../components/algorithm/editor/editorUtils';

/**
 * 문제 풀이 페이지 - 리사이저블 레이아웃 완전 수정 버전
 */
const ProblemSolve = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  
  // 상태 관리
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800); // 30분
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  // 화면 분할 상태 관리
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // 좌측 패널 너비 (%)
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // 리사이저 드래그 시작
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // 리사이저 드래그 중
  const handleResize = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // 최소/최대 너비 제한 (20% ~ 80%)
    const minWidth = containerWidth * 0.2;
    const maxWidth = containerWidth * 0.8;
    
    const clampedX = Math.max(minWidth, Math.min(maxWidth, mouseX));
    const newLeftPanelWidth = (clampedX / containerWidth) * 100;
    
    setLeftPanelWidth(newLeftPanelWidth);
  }, [isResizing]);

  // 리사이저 드래그 종료
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 리사이저 이벤트 리스너
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

  // 코드 제출 (useCallback 적용)
  const handleSubmit = useCallback(() => {
    if (!code.trim()) {
      alert('코드를 작성해주세요!');
      return;
    }
    
    setIsTimerRunning(false);
    
    const submissionId = Math.floor(Math.random() * 1000) + 1;
    const elapsedTime = 1800 - timeLeft;
    const elapsedMinutes = Math.floor(elapsedTime / 60);
    const elapsedSeconds = elapsedTime % 60;
    
    alert(`개발 중입니다!\nDay 10-11에 Judge0 API 연동과 함께 구현됩니다.\n\n모의 제출 정보:\n- 제출 ID: ${submissionId}\n- 언어: ${selectedLanguage.toUpperCase()}\n- 소요 시간: ${elapsedMinutes}분 ${elapsedSeconds}초\n- 코드 길이: ${code.length}자`);
  }, [code, timeLeft, selectedLanguage]);

  // 타이머 시작/정지
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  // 타이머 효과
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (!isTimerRunning && timeLeft !== 0) {
      clearInterval(interval);
    }

    if (timeLeft === 0 && isTimerRunning) {
      handleSubmit();
      setIsTimerRunning(false);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, handleSubmit]);

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 언어 변경
  const handleLanguageChange = (language) => {
    const confirmChange = window.confirm(
      `언어를 ${language.toUpperCase()}로 변경하시겠습니까?\n현재 작성한 코드가 초기화됩니다.`
    );
    
    if (confirmChange) {
      setSelectedLanguage(language);
      setCode(codeTemplates[language] || '');
    }
  };

  // 초기 코드 설정
  useEffect(() => {
    setCode(codeTemplates[selectedLanguage] || '');
  }, [selectedLanguage]);

  // 코드 변경 핸들러
  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  // 에디터 마운트 핸들러
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = { editor, monaco };
    setIsEditorReady(true);
    
    setTimeout(() => {
      editorUtils.focusEditor(editor);
    }, 100);
  };

  // 코드 포맷팅
  const handleFormatCode = () => {
    if (editorRef.current?.editor) {
      editorUtils.formatCode(editorRef.current.editor);
    }
  };

  // 코드 초기화
  const handleResetCode = () => {
    const confirmReset = window.confirm('코드를 초기화하시겠습니까?\n현재 작성한 코드가 모두 사라집니다.');
    if (confirmReset) {
      setCode(codeTemplates[selectedLanguage] || '');
    }
  };

  // 코드 복사
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('코드가 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('복사 실패:', err);
      alert('코드 복사에 실패했습니다.');
    }
  };

  // 테스트 실행
  const handleTestRun = () => {
    if (!code.trim()) {
      alert('코드를 작성해주세요!');
      return;
    }
    
    alert('테스트 실행 기능은 Day 10-11에 구현됩니다!\n\n현재 코드:\n' + code.substring(0, 200) + (code.length > 200 ? '...' : ''));
  };

  // 샘플 문제 데이터
  const problemData = {
    1: { title: '두 수의 합', difficulty: 'BRONZE', description: '두 정수를 입력받아 합을 출력하는 프로그램을 작성하시오.' },
    2: { title: '피보나치 수', difficulty: 'SILVER', description: 'n번째 피보나치 수를 구하는 프로그램을 작성하시오.' },
    3: { title: '최단경로', difficulty: 'GOLD', description: '그래프에서 최단경로를 구하는 프로그램을 작성하시오.' },
    123: { title: '테스트 문제', difficulty: 'BRONZE', description: '이것은 Monaco Editor 테스트를 위한 샘플 문제입니다.' }
  };

  const currentProblem = problemData[problemId] || problemData['123'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 네비게이션 */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/algorithm')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← 문제 목록
              </button>
              <span className="text-gray-300">|</span>
              <h1 className="text-lg font-semibold text-gray-900">
                💻 문제 풀이
              </h1>
              <span className="text-gray-500">문제 #{problemId}</span>
            </div>

            {/* 타이머 */}
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg font-mono text-lg ${
                timeLeft <= 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
              <button
                onClick={toggleTimer}
                className={`px-4 py-2 rounded-lg text-white ${
                  isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isTimerRunning ? '⏸️ 일시정지' : '▶️ 시작'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 리사이저블 레이아웃 상태 알림 */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>✅ 리사이저블 레이아웃 적용</strong> - 두 패널 사이의 바를 드래그하여 화면 크기를 조절하세요
          <br />
          <small>좌측: 문제 설명 ({leftPanelWidth.toFixed(1)}%) | 우측: 코드 에디터 ({(100 - leftPanelWidth).toFixed(1)}%)</small>
        </div>
      </div>

      {/* 메인 컨텐츠 - 올바른 리사이저블 레이아웃 */}
      <div className="container mx-auto px-4 pb-8" ref={containerRef}>
        <div className="flex h-[calc(100vh-200px)] gap-1">
          
          {/* 좌측: 문제 설명 패널 (단일) */}
          <div 
            className="bg-white rounded-lg shadow-sm border overflow-auto"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{currentProblem.title}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentProblem.difficulty === 'BRONZE' ? 'bg-orange-100 text-orange-800' :
                  currentProblem.difficulty === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                  currentProblem.difficulty === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-cyan-100 text-cyan-800'
                }`}>
                  {currentProblem.difficulty}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📋 문제 설명</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {currentProblem.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📥 입력</h3>
                  <p className="text-gray-700">
                    첫째 줄에 정수 N이 주어진다. (1 ≤ N ≤ 100)
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📤 출력</h3>
                  <p className="text-gray-700">
                    조건에 맞는 결과를 출력한다.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🔍 예제</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-1">입력</h4>
                        <pre className="text-sm bg-white p-2 rounded border">5</pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-1">출력</h4>
                        <pre className="text-sm bg-white p-2 rounded border">120</pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">⚠️ 제한사항</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• 시간 제한: 1초</li>
                    <li>• 메모리 제한: 128MB</li>
                    <li>• 제출 제한: 없음</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 중앙: 리사이저 바 */}
          <div 
            className={`w-2 bg-gray-300 hover:bg-blue-400 cursor-col-resize rounded transition-colors duration-200 flex items-center justify-center group ${
              isResizing ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleResizeStart}
            title="드래그하여 화면 크기 조절"
          >
            <div className="w-1 h-8 bg-gray-500 rounded group-hover:bg-white transition-colors duration-200"></div>
          </div>

          {/* 우측: 코드 에디터 패널 */}
          <div 
            className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            {/* 에디터 헤더 및 툴바 */}
            <div className="p-6 flex-shrink-0">
              {/* 에디터 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">💻 Monaco Editor</h3>
                
                {/* 언어 선택 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">언어:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
              </div>

              {/* 에디터 툴바 */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handleResetCode}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    disabled={!isEditorReady}
                  >
                    🔄 초기화
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    📋 복사
                  </button>
                  <button
                    onClick={handleFormatCode}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                    disabled={!isEditorReady}
                  >
                    ✨ 포맷팅
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleTestRun}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    🧪 테스트 실행
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
                    disabled={!code.trim()}
                  >
                    🚀 제출
                  </button>
                </div>
              </div>
            </div>

            {/* Monaco Editor - 확장 가능한 영역 */}
            <div className="flex-1 border-t border-gray-200 overflow-hidden">
              <CodeEditor
                language={selectedLanguage}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                height="100%"
                theme="vs-dark"
                className="h-full"
              />
            </div>

            {/* 에디터 상태 및 통계 */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">상태:</span>
                  <span className="ml-2 font-medium">
                    {isEditorReady ? '🟢 준비됨' : '🟡 로딩중'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">줄 수:</span>
                  <span className="ml-2 font-mono">{code.split('\n').length}</span>
                </div>
                <div>
                  <span className="text-gray-600">문자 수:</span>
                  <span className="ml-2 font-mono">{code.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">언어:</span>
                  <span className="ml-2 font-medium">{selectedLanguage.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolve;