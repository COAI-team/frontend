import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * 문제 풀이 페이지 - Step 3 버전
 */
const ProblemSolve = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  
  // 상태 관리
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800); // 30분
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // 언어별 기본 코드 템플릿
  const codeTemplates = {
    javascript: '// JavaScript 코드를 작성하세요\nfunction solution() {\n    // 여기에 코드를 작성하세요\n}\n\nconsolution();',
    python: '# Python 코드를 작성하세요\ndef solution():\n    # 여기에 코드를 작성하세요\n    pass\n\nsolution()',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        // Java 코드를 작성하세요\n        \n    }\n}',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // C++ 코드를 작성하세요\n    \n    return 0;\n}'
  };

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
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // 시간 포맷팅 (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 언어 변경
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(codeTemplates[language]);
  };

  // 초기 코드 설정
  useEffect(() => {
    setCode(codeTemplates[selectedLanguage]);
  }, []);

  // 코드 제출
  const handleSubmit = () => {
    if (!code.trim()) {
      alert('코드를 작성해주세요!');
      return;
    }
    
    const submissionId = Math.floor(Math.random() * 1000) + 1;
    alert(`개발 중입니다!\nDay 10-11에 Judge0 API 연동과 함께 구현됩니다.\n\n모의 제출 ID: ${submissionId}`);
    
    // 실제로는 결과 페이지로 이동
    // navigate(`/algorithm/submissions/${submissionId}`);
  };

  // 샘플 문제 데이터 (실제로는 API에서 가져옴)
  const problemData = {
    1: { title: '두 수의 합', difficulty: 'BRONZE', description: '두 정수를 입력받아 합을 출력하는 프로그램을 작성하시오.' },
    2: { title: '피보나치 수', difficulty: 'SILVER', description: 'n번째 피보나치 수를 구하는 프로그램을 작성하시오.' },
    3: { title: '최단경로', difficulty: 'GOLD', description: '그래프에서 최단경로를 구하는 프로그램을 작성하시오.' },
    123: { title: '테스트 문제', difficulty: 'BRONZE', description: '이것은 Step 3 테스트를 위한 샘플 문제입니다.' }
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

      {/* 개발 상태 알림 */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <strong>🚧 개발 예정</strong> - Day 8-9에 Monaco Editor와 함께 구현됩니다
          <br />
          <small>현재는 기본 텍스트에어리어로 테스트 중입니다.</small>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 문제 설명 패널 */}
          <div className="bg-white rounded-lg shadow-sm border">
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

          {/* 코드 에디터 패널 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              {/* 에디터 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">💻 코드 에디터</h3>
                
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

              {/* 코드 에디터 (텍스트에어리어) */}
              <div className="mb-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="여기에 코드를 작성하세요..."
                  className="w-full h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  style={{ 
                    backgroundColor: '#1e1e1e', 
                    color: '#d4d4d4',
                    fontFamily: '"Fira Code", "Monaco", "Menlo", monospace'
                  }}
                />
              </div>

              {/* 에디터 툴바 */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCode(codeTemplates[selectedLanguage])}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    🔄 초기화
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                    📋 복사
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                    🧪 테스트 실행
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
                  >
                    🚀 제출
                  </button>
                </div>
              </div>

              {/* 코드 통계 */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
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

        {/* Step 3 완료 상태 */}
        <div className="mt-6">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            <strong>✅ Step 3 테스트</strong> - ProblemSolve 페이지가 정상적으로 로드되었습니다! (문제 ID: {problemId})
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolve;