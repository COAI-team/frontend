import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * 제출 결과 페이지 - Step 4 버전
 */
const SubmissionResult = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // 페이지 로딩 효과 (모의)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 샘플 제출 결과 데이터 (실제로는 API에서 가져옴)
  const submissionData = {
    456: {
      problem: { id: 1, title: '두 수의 합', difficulty: 'BRONZE' },
      judge: { result: 'AC', passedTests: 10, totalTests: 10, executionTime: 0.001, memory: 1024 },
      ai: { score: 85, feedback: '코드가 깔끔하고 이해하기 쉽습니다. 변수명이 명확하고 로직이 간단합니다.', suggestions: ['더 효율적인 알고리즘 고려', '예외 처리 추가'] },
      code: 'function solution(a, b) {\n    return a + b;\n}\n\nconsole.log(solution(5, 3));',
      language: 'javascript',
      submittedAt: '2025-11-21 14:30:25',
      elapsedTime: 180
    },
    789: {
      problem: { id: 2, title: '피보나치 수', difficulty: 'SILVER' },
      judge: { result: 'WA', passedTests: 7, totalTests: 10, executionTime: 0.045, memory: 2048 },
      ai: { score: 65, feedback: '기본 로직은 맞지만 큰 수에 대한 처리가 부족합니다.', suggestions: ['동적 프로그래밍 최적화', '메모이제이션 적용'] },
      code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
      language: 'python',
      submittedAt: '2025-11-21 14:25:10',
      elapsedTime: 420
    }
  };

  const currentSubmission = submissionData[submissionId] || submissionData['456'];

  // 결과 색상 및 아이콘
  const getResultInfo = (result) => {
    switch(result) {
      case 'AC': return { color: 'text-green-600', bg: 'bg-green-100', icon: '✅', text: 'Accepted' };
      case 'WA': return { color: 'text-red-600', bg: 'bg-red-100', icon: '❌', text: 'Wrong Answer' };
      case 'TLE': return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⏰', text: 'Time Limit Exceeded' };
      case 'MLE': return { color: 'text-purple-600', bg: 'bg-purple-100', icon: '💾', text: 'Memory Limit Exceeded' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-100', icon: '⏳', text: 'Pending' };
    }
  };

  const resultInfo = getResultInfo(currentSubmission.judge.result);

  // 공유하기
  const handleShare = () => {
    setIsSharing(true);
    setTimeout(() => {
      setIsSharing(false);
      alert('개발 중입니다! Day 12-13에 공유 기능이 구현됩니다.');
    }, 1500);
  };

  // 다시 풀기
  const handleRetry = () => {
    navigate(`/algorithm/problems/${currentSubmission.problem.id}/solve`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">채점 결과를 불러오는 중...</p>
          <p className="text-gray-500 text-sm mt-2">제출 ID: {submissionId}</p>
        </div>
      </div>
    );
  }

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
                📊 제출 결과
              </h1>
              <span className="text-gray-500">제출 #{submissionId}</span>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                🔄 다시 풀기
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing}
                className={`px-4 py-2 rounded transition-colors ${
                  isSharing 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isSharing ? '공유 중...' : '📤 공유하기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 개발 상태 알림 */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>🚧 개발 예정</strong> - Day 12-13에 AI 평가와 함께 구현됩니다
          <br />
          <small>현재는 샘플 데이터로 테스트 중입니다.</small>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 pb-8">
        <div className="space-y-6">
          {/* 결과 요약 카드 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 문제 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">📝 문제</h3>
                <p className="text-lg font-semibold text-gray-900">{currentSubmission.problem.title}</p>
                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                  currentSubmission.problem.difficulty === 'BRONZE' ? 'bg-orange-100 text-orange-800' :
                  currentSubmission.problem.difficulty === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                  currentSubmission.problem.difficulty === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-cyan-100 text-cyan-800'
                }`}>
                  {currentSubmission.problem.difficulty}
                </span>
              </div>

              {/* 판정 결과 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">⚖️ 판정</h3>
                <div className={`inline-flex items-center px-3 py-2 rounded-lg ${resultInfo.bg}`}>
                  <span className="text-xl mr-2">{resultInfo.icon}</span>
                  <span className={`font-semibold ${resultInfo.color}`}>{resultInfo.text}</span>
                </div>
              </div>

              {/* 테스트 통과율 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">🧪 테스트</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSubmission.judge.passedTests}/{currentSubmission.judge.totalTests}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${currentSubmission.judge.result === 'AC' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${(currentSubmission.judge.passedTests / currentSubmission.judge.totalTests) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* AI 점수 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">🤖 AI 점수</h3>
                <p className="text-lg font-semibold text-gray-900">{currentSubmission.ai.score}/100</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${currentSubmission.ai.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 상세 결과 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 실행 결과 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 실행 결과</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">실행 시간:</span>
                    <span className="font-mono text-gray-900">{currentSubmission.judge.executionTime}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">메모리 사용량:</span>
                    <span className="font-mono text-gray-900">{currentSubmission.judge.memory}KB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">사용 언어:</span>
                    <span className="font-medium text-gray-900">{currentSubmission.language.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">제출 시간:</span>
                    <span className="font-mono text-gray-900">{currentSubmission.submittedAt}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">풀이 시간:</span>
                    <span className="font-mono text-gray-900">{Math.floor(currentSubmission.elapsedTime / 60)}분 {currentSubmission.elapsedTime % 60}초</span>
                  </div>
                </div>

                {/* 테스트케이스 상세 */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">테스트케이스 결과</h4>
                  <div className="space-y-2">
                    {Array.from({ length: currentSubmission.judge.totalTests }, (_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">테스트 {i + 1}</span>
                        <span className={`text-sm font-medium ${
                          i < currentSubmission.judge.passedTests ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {i < currentSubmission.judge.passedTests ? '✅ 통과' : '❌ 실패'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI 피드백 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🤖 AI 피드백</h3>
                  <button
                    onClick={() => setShowAIFeedback(!showAIFeedback)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {showAIFeedback ? '접기' : '펼치기'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">📊 종합 평가</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800">{currentSubmission.ai.feedback}</p>
                    </div>
                  </div>

                  {showAIFeedback && (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">💡 개선 제안</h4>
                        <ul className="space-y-2">
                          {currentSubmission.ai.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-yellow-500 mr-2 mt-1">💡</span>
                              <span className="text-gray-700">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">📈 점수 상세</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">가독성:</span>
                            <span className="font-mono">85/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">효율성:</span>
                            <span className="font-mono">80/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">정확성:</span>
                            <span className="font-mono">90/100</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 제출된 코드 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💻 제출된 코드</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-100 text-sm font-mono">
                  <code>{currentSubmission.code}</code>
                </pre>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-gray-600 text-sm">
                  언어: {currentSubmission.language.toUpperCase()} | 
                  줄 수: {currentSubmission.code.split('\n').length} | 
                  문자 수: {currentSubmission.code.length}
                </span>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  📋 코드 복사
                </button>
              </div>
            </div>
          </div>

          {/* Step 4 완료 상태 */}
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            <strong>✅ Step 4 테스트</strong> - SubmissionResult 페이지가 정상적으로 로드되었습니다! (제출 ID: {submissionId})
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionResult;