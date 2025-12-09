import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionResult, completeMission } from '../../service/algorithm/AlgorithmApi';

/**
 * 간단한 마크다운 렌더러 컴포넌트
 * - ## 헤딩, **볼드**, - 리스트 지원
 */
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 ml-2 text-gray-700">
          {currentList.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  // 인라인 마크다운 처리 (**볼드**, `코드`)
  const renderInlineMarkdown = (text) => {
    if (!text) return text;

    // **볼드** 처리
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      // `코드` 처리
      const codeParts = part.split(/(`[^`]+`)/g);
      return codeParts.map((codePart, codeIdx) => {
        if (codePart.startsWith('`') && codePart.endsWith('`')) {
          return <code key={`${idx}-${codeIdx}`} className="bg-gray-100 px-1 rounded text-sm font-mono text-blue-600">{codePart.slice(1, -1)}</code>;
        }
        return codePart;
      });
    });
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // 빈 줄
    if (!trimmedLine) {
      flushList();
      elements.push(<div key={`br-${index}`} className="h-2" />);
      return;
    }

    // ## 헤딩 (h2)
    if (trimmedLine.startsWith('## ')) {
      flushList();
      const headingText = trimmedLine.slice(3);
      elements.push(
        <h3 key={`h2-${index}`} className="text-lg font-bold text-gray-900 mt-4 mb-2 flex items-center gap-2">
          {headingText}
        </h3>
      );
      return;
    }

    // ### 헤딩 (h3)
    if (trimmedLine.startsWith('### ')) {
      flushList();
      const headingText = trimmedLine.slice(4);
      elements.push(
        <h4 key={`h3-${index}`} className="text-md font-semibold text-gray-800 mt-3 mb-1">
          {headingText}
        </h4>
      );
      return;
    }

    // - 리스트 아이템
    if (trimmedLine.startsWith('- ')) {
      currentList.push(trimmedLine.slice(2));
      return;
    }

    // 일반 텍스트
    flushList();
    elements.push(
      <p key={`p-${index}`} className="text-gray-700 leading-relaxed">
        {renderInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
};

/**
 * 문제 설명 파싱 함수
 */
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

/**
 * 마크다운 텍스트 파싱 함수 (라이트 테마용)
 */
const renderFormattedText = (text) => {
  if (!text) return null;

  // **text** 패턴을 찾아서 <strong>으로 변환
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-gray-900">
          {boldText}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

/**
 * 섹션 카드 컴포넌트 (라이트 테마)
 */
const SectionCard = ({ title, icon, content, bgColor = 'bg-gray-50' }) => {
  if (!content) return null;
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {renderFormattedText(content)}
      </div>
    </div>
  );
};

/**
 * 코드 블록 컴포넌트 (라이트 테마)
 */
const CodeBlock = ({ title, icon, content }) => {
  if (!content) return null;
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span>{icon}</span>
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
      <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto">
        {content}
      </pre>
    </div>
  );
};

/**
 * 난이도 배지 스타일 (라이트 테마)
 */
const getDifficultyBadge = (diff) => {
  const styles = {
    'BRONZE': 'bg-orange-100 text-orange-800 border-orange-300',
    'SILVER': 'bg-gray-100 text-gray-800 border-gray-300',
    'GOLD': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'PLATINUM': 'bg-cyan-100 text-cyan-800 border-cyan-300'
  };
  return styles[diff] || 'bg-gray-100 text-gray-700 border-gray-300';
};

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
  const [showProblemDescription, setShowProblemDescription] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // 🎯 데일리 미션 완료 상태
  const [missionStatus, setMissionStatus] = useState({
    completed: false,
    message: null,
    rewardPoints: 0,
    error: null
  });

  // 폴링을 위한 Ref
  const pollingInterval = useRef(null);
  // 미션 완료 중복 호출 방지
  const missionCompletedRef = useRef(false);

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

      // 🔍 디버그 로그
      console.log('📊 채점 상태:', {
        judgeStatus: data.judgeStatus,
        judgeResult: data.judgeResult,
        aiFeedbackStatus: data.aiFeedbackStatus,
        isJudgeComplete,
        isAiComplete,
        missionAlreadyCompleted: missionCompletedRef.current
      });

      // 🎯 채점 완료(AC) 시 바로 데일리 미션 완료 처리 (AI 완료 기다리지 않음)
      if (isJudgeComplete && data.judgeResult === 'AC' && !missionCompletedRef.current) {
        missionCompletedRef.current = true;
        // TODO: 실제 로그인 구현 후 user.userId로 변경
        const testUserId = 3; // 개발용 테스트 userId
        console.log('🎯 미션 완료 API 호출 시작:', { missionType: 'PROBLEM_SOLVE', testUserId });
        try {
          const missionResult = await completeMission('PROBLEM_SOLVE', testUserId);
          console.log('🎯 미션 완료 API 응답 (전체):', JSON.stringify(missionResult, null, 2));

          // API 응답 구조 분석: 다양한 응답 패턴 처리
          // 패턴 1: { success: true, message, rewardPoints }
          // 패턴 2: { data: { success: true, ... } }
          // 패턴 3: { alreadyCompleted: true }
          // 패턴 4: { error: true, message }

          const result = missionResult.data || missionResult; // data wrapper 처리

          if (result.error) {
            console.warn('미션 완료 API 오류:', result.message);
            setMissionStatus(prev => ({ ...prev, error: result.message }));
          } else if (result.success || result.completed) {
            setMissionStatus({
              completed: true,
              message: result.message || '문제 풀기 미션 완료!',
              rewardPoints: result.rewardPoints || 0,
              error: null
            });
            console.log('✅ 미션 완료:', result.message, `+${result.rewardPoints || 0}P`);
          } else if (result.alreadyCompleted) {
            setMissionStatus({
              completed: true,
              message: '이미 완료된 미션입니다',
              rewardPoints: 0,
              error: null
            });
            console.log('ℹ️ 이미 완료된 미션');
          } else {
            // 에러가 아니면 성공으로 간주 (응답 구조가 예상과 다른 경우 대비)
            console.log('ℹ️ 예상치 못한 응답 구조, 성공으로 처리:', result);
            setMissionStatus({
              completed: true,
              message: '문제 풀기 미션 완료!',
              rewardPoints: 0,
              error: null
            });
          }
        } catch (missionErr) {
          console.warn('미션 완료 처리 실패:', missionErr);
          setMissionStatus(prev => ({ ...prev, error: '미션 완료 처리 실패' }));
        }
      }

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

  // 파싱된 문제 섹션
  const parsedSections = useMemo(() => {
    return parseProblemDescription(submission?.problemDescription);
  }, [submission?.problemDescription]);

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
          {/* 🎯 데일리 미션 완료 배너 */}
          {missionStatus.completed && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 text-white animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <h3 className="font-bold text-lg">데일리 미션 완료!</h3>
                    <p className="text-green-100 text-sm">
                      {missionStatus.message || '문제 풀기 미션을 완료했습니다'}
                    </p>
                  </div>
                </div>
                {missionStatus.rewardPoints > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-bold">+{missionStatus.rewardPoints}P</p>
                    <p className="text-green-100 text-xs">보상 포인트</p>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* 문제 설명 (접이식) */}
          {submission.problemDescription && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowProblemDescription(!showProblemDescription)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <h3 className="text-lg font-semibold text-gray-900">문제 설명</h3>
                  <span className={`px-3 py-1 rounded-full text-xs border ${getDifficultyBadge(submission.difficulty)}`}>
                    {submission.difficulty || 'N/A'}
                  </span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                  <span>{showProblemDescription ? '접기' : '펼치기'}</span>
                  <span className={`transform transition-transform ${showProblemDescription ? 'rotate-180' : ''}`}>▼</span>
                </button>
              </div>

              {showProblemDescription && (
                <div className="p-6 pt-0 border-t border-gray-100">
                  {/* 제한 정보 표시 */}
                  <div className="flex flex-wrap gap-3 mb-4 mt-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
                      ⏱ 시간제한: {submission.timeLimit || 1000}ms
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
                      💾 메모리제한: {submission.memoryLimit || 256}MB
                    </span>
                  </div>

                  {/* 구조화된 문제 내용 */}
                  {parsedSections && (parsedSections.description || parsedSections.input || parsedSections.output) ? (
                    <div className="space-y-4">
                      {/* 문제 설명 */}
                      <SectionCard
                        title="문제 설명"
                        icon="📝"
                        content={parsedSections.description}
                        bgColor="bg-gray-50"
                      />

                      {/* 입력/출력 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SectionCard
                          title="입력"
                          icon="📥"
                          content={parsedSections.input}
                          bgColor="bg-blue-50"
                        />
                        <SectionCard
                          title="출력"
                          icon="📤"
                          content={parsedSections.output}
                          bgColor="bg-green-50"
                        />
                      </div>

                      {/* 제한사항 */}
                      <SectionCard
                        title="제한사항"
                        icon="⚠️"
                        content={parsedSections.constraints}
                        bgColor="bg-yellow-50"
                      />

                      {/* 예제 입출력 */}
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
                    </div>
                  ) : (
                    /* 파싱 실패 시 원본 출력 */
                    <div className="prose prose-sm max-w-none">
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">
                        {renderFormattedText(submission.problemDescription)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

                {/* 테스트케이스 상세 결과 */}
                {submission.testCaseResults && submission.testCaseResults.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">📋 테스트케이스 결과</h4>
                    <div className="space-y-3">
                      {submission.testCaseResults.map((tc, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Test Case #{tc.testCaseNumber || idx + 1}
                            </span>
                            {tc.result === 'PASS' && (
                              <span className="text-green-600 text-sm flex items-center gap-1">
                                <span>✅</span>
                                <span>통과</span>
                              </span>
                            )}
                            {tc.result === 'FAIL' && (
                              <span className="text-red-600 text-sm flex items-center gap-1">
                                <span>❌</span>
                                <span>실패</span>
                              </span>
                            )}
                            {tc.result === 'ERROR' && (
                              <span className="text-orange-600 text-sm flex items-center gap-1">
                                <span>⚠️</span>
                                <span>에러</span>
                              </span>
                            )}
                            {!tc.result && (
                              <span className="text-gray-500 text-sm flex items-center gap-1">
                                <span className="animate-spin">⏳</span>
                                <span>채점 중...</span>
                              </span>
                            )}
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${tc.result === 'PASS'
                                ? 'bg-green-500'
                                : tc.result === 'FAIL'
                                  ? 'bg-red-500'
                                  : tc.result === 'ERROR'
                                    ? 'bg-orange-500'
                                    : 'bg-blue-500 animate-pulse'
                                }`}
                              style={{ width: tc.result ? '100%' : '60%' }}
                            ></div>
                          </div>
                          {tc.executionTime && (
                            <div className="text-xs text-gray-500 mt-1">
                              실행시간: {tc.executionTime}ms
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 채점 진행 중일 때 전체 프로그레스 바 */}
                {submission.judgeStatus === 'JUDGING' && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">전체 채점 진행률</span>
                      <span className="text-sm text-gray-600">
                        {submission.passedTestCount || 0}/{submission.totalTestCount || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500 animate-pulse"
                        style={{
                          width: `${submission.totalTestCount ? ((submission.passedTestCount || 0) / submission.totalTestCount) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
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
                  showAIFeedback ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                      {submission.aiFeedback ? (
                        <MarkdownRenderer content={submission.aiFeedback} />
                      ) : (
                        <p className="text-gray-500 text-center py-4">피드백이 없습니다.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>피드백을 보려면 '펼치기'를 클릭하세요.</p>
                    </div>
                  )
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