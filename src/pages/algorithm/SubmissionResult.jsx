import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionResult } from '../../service/algorithm/algorithmApi';

/**
 * 제출 결과 페이지 - 실시간 업데이트 버전
 */
const SubmissionResult = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAIFeedback, setShowAIFeedback] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // 폴링을 위한 Ref
  const pollingInterval = useRef(null);

  // 데이터 조회 함수
  const fetchResult = async () => {
    try {
      const res = await getSubmissionResult(submissionId);

      if (res.error) {
        // 아직 처리 중이거나 찾을 수 없는 경우 등
        console.warn('제출 결과 조회 실패:', res.message);
        // 404가 아니면 계속 폴링할 수도 있지만, 여기서는 에러 처리
        if (res.code === 'ALGO_404') { // 가정: 404 코드
          setError(res.message);
          stopPolling();
        }
        return;
      }

      const data = res.Data || res.data || res;
      setSubmission(data);
      setLoading(false);

      // 채점 완료 및 AI 평가 완료 여부 확인
      // judgeStatus: PENDING, JUDGING, COMPLETED, ERROR
      // aiFeedbackStatus: PENDING, PROCESSING, COMPLETED, ERROR

      const isJudgeComplete = data.judgeStatus === 'COMPLETED' || data.judgeStatus === 'ERROR';
      const isAiComplete = data.aiFeedbackStatus === 'COMPLETED' || data.aiFeedbackStatus === 'ERROR';

      // 둘 다 완료되면 폴링 중지
      if (isJudgeComplete && isAiComplete) {
        stopPolling();
      }

    } catch (err) {
      console.error('제출 결과 조회 중 오류:', err);
      setError('서버 연결 오류가 발생했습니다.');
      stopPolling();
    }
  };

  const startPolling = () => {
    // 즉시 실행
    fetchResult();
    // 주기적 실행 (2초마다)
    pollingInterval.current = setInterval(fetchResult, 2000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  useEffect(() => {
    if (submissionId) {
      startPolling();
    }
    return () => stopPolling();
  }, [submissionId]);


  // 결과 색상 및 아이콘
  const getResultInfo = (result) => {
    switch (result) {
      case 'AC': return { color: 'text-green-600', bg: 'bg-green-100', icon: '✅', text: 'Accepted' };
      case 'WA': return { color: 'text-red-600', bg: 'bg-red-100', icon: '❌', text: 'Wrong Answer' };
      case 'TLE': return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⏰', text: 'Time Limit Exceeded' };
      case 'MLE': return { color: 'text-purple-600', bg: 'bg-purple-100', icon: '💾', text: 'Memory Limit Exceeded' };
      case 'CE': return { color: 'text-orange-600', bg: 'bg-orange-100', icon: '⚠️', text: 'Compilation Error' };
      case 'RE': return { color: 'text-red-600', bg: 'bg-red-100', icon: '💥', text: 'Runtime Error' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-100', icon: '⏳', text: 'Judging...' };
    }
  };

  // 공유하기
  const handleShare = () => {
    setIsSharing(true);
    setTimeout(() => {
      setIsSharing(false);
      alert('개발 중입니다! 공유 기능이 곧 구현됩니다.');
    }, 1500);
  };

  // 다시 풀기
  const handleRetry = () => {
    if (submission?.problemId) {
      navigate(`/algorithm/problems/${submission.problemId}/solve`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">채점 결과를 불러오는 중...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">⚠️ {error}</p>
          <button onClick={() => navigate('/algorithm')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            문제 목록으로
          </button>
        </div>
      </div>
    );
  }

  if (!submission) return null;

  const resultInfo = getResultInfo(submission.judgeResult);

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
                className={`px-4 py-2 rounded transition-colors ${isSharing
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

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 결과 요약 카드 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 문제 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">📝 문제</h3>
                <p className="text-lg font-semibold text-gray-900">{submission.problemTitle}</p>
                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800`}>
                  {submission.difficulty || 'N/A'}
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
                  {submission.passedTestCount || 0}/{submission.totalTestCount || 0}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${submission.judgeResult === 'AC' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${submission.totalTestCount ? (submission.passedTestCount / submission.totalTestCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* AI 점수 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">🤖 AI 점수</h3>
                {submission.aiFeedbackStatus === 'COMPLETED' ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900">{submission.aiScore || 0}/100</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${submission.aiScore || 0}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="animate-spin">⚙️</span>
                    <span>분석 중...</span>
                  </div>
                )}
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
                    <span className="font-mono text-gray-900">{submission.executionTime ? `${submission.executionTime}s` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">메모리 사용량:</span>
                    <span className="font-mono text-gray-900">{submission.memoryUsage ? `${submission.memoryUsage}KB` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">사용 언어:</span>
                    <span className="font-medium text-gray-900">{submission.language}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">제출 시간:</span>
                    <span className="font-mono text-gray-900">{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* 테스트케이스 상세 (데이터가 있다면) */}
                {/* 현재 API 응답 구조에 따라 다를 수 있음. 일단 생략하거나 추후 추가 */}
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

                {submission.aiFeedbackStatus === 'COMPLETED' ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">📊 종합 평가</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 whitespace-pre-wrap">{submission.aiFeedback || '피드백이 없습니다.'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                    <p>AI가 코드를 분석하고 있습니다...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 제출된 코드 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💻 제출된 코드</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-100 text-sm font-mono">
                  <code>{submission.sourceCode}</code>
                </pre>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-gray-600 text-sm">
                  언어: {submission.language} |
                  문자 수: {submission.sourceCode?.length || 0}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(submission.sourceCode)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  📋 코드 복사
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SubmissionResult;