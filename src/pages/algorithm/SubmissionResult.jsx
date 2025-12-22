import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionResult, completeMission, updateSharingStatus } from '../../service/algorithm/AlgorithmApi';
import { commitToGithub, getGithubSettings } from '../../service/github/GithubApi';
import { AiFillGithub } from 'react-icons/ai';
import { useLogin } from '../../context/login/useLogin';
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";
import { extractPureDescription, renderFormattedText } from '../../components/algorithm/problem/markdownUtils';
import Editor from '@monaco-editor/react';
import "../../styles/SubmissionResult.css";
import "../../styles/ProblemDetail.css";

/**
 * 간단한 마크다운 렌더러 컴포넌트
 * - ## 헤딩, **볼드**, - 리스트 지원
 */
const MarkdownRenderer = ({content}) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 ml-2 text-gray-700 dark:text-gray-300">
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
        return <strong key={idx}
                       className="font-semibold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>;
      }
      // `코드` 처리
      const codeParts = part.split(/(`[^`]+`)/g);
      return codeParts.map((codePart, codeIdx) => {
        if (codePart.startsWith('`') && codePart.endsWith('`')) {
          return <code key={`${idx}-${codeIdx}`}
                       className="bg-gray-100 dark:bg-zinc-700 px-1 rounded text-sm font-mono text-blue-600 dark:text-blue-400">{codePart.slice(1, -1)}</code>;
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
      elements.push(<div key={`br-${index}`} className="h-2"/>);
      return;
    }

    // ## 헤딩 (h2)
    if (trimmedLine.startsWith('## ')) {
      flushList();
      const headingText = trimmedLine.slice(3);
      elements.push(
        <h3 key={`h2-${index}`}
            className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 flex items-center gap-2">
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
        <h4 key={`h3-${index}`} className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-1">
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
      <p key={`p-${index}`} className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {renderInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
};

/**
 * 난이도 배지 클래스 반환
 */
const getDifficultyBadgeClass = (diff) => {
  const classes = {
    'BRONZE': 'badge-bronze',
    'SILVER': 'badge-silver',
    'GOLD': 'badge-gold',
    'PLATINUM': 'badge-platinum'
  };
  return classes[diff] || 'badge-silver';
};

/**
 * 문제 타입 배지 클래스 반환
 */
const getProblemTypeBadgeClass = (type) => {
  return type === 'SQL' ? 'badge-database' : 'badge-algorithm';
};

/**
 * 언어 이름을 Monaco Editor 언어 ID로 변환
 */
const getMonacoLanguage = (languageName) => {
  const languageMap = {
    'Python': 'python',
    'Python3': 'python',
    'Java': 'java',
    'C': 'c',
    'C++': 'cpp',
    'C#': 'csharp',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'Go': 'go',
    'Rust': 'rust',
    'Ruby': 'ruby',
    'Swift': 'swift',
    'Kotlin': 'kotlin',
    'SQL': 'sql',
    'MySQL': 'sql'
  };
  return languageMap[languageName] || 'plaintext';
};

/**
 * 제출 결과 페이지 - 실시간 업데이트 버전
 */
const SubmissionResult = () => {
  const {submissionId} = useParams();
  const navigate = useNavigate();
  const { user } = useLogin();

  // [Tutorial Redirection]
  // Redirect to tutorial if accessing 'Submission Result' and relevant sections not completed
  useEffect(() => {
    if (user) {
      // 1. Check if user is "new" (created today or tomorrow)
      // const createdDate = new Date(user.createdAt);
      // const today = new Date();
      // const tomorrow = new Date(today);
      // tomorrow.setDate(tomorrow.getDate() + 1);

      // const isSameDate = (d1, d2) => 
      //     d1.getFullYear() === d2.getFullYear() &&
      //     d1.getMonth() === d2.getMonth() &&
      //     d1.getDate() === d2.getDate();

      // const isCreatedTodayOrTomorrow = isSameDate(createdDate, today) || isSameDate(createdDate, tomorrow);

      // if (!isCreatedTodayOrTomorrow) {
      //   return; // Skip redirection for old users
      // }

      // 2. Check tutorial progress for Part 4 (Result)
      const TUTORIAL_KEY = 'coai_algorithm_tutorial_v3_4';
      const saved = localStorage.getItem(TUTORIAL_KEY);
      
      let shouldRedirect = true;

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.tutorialCompleted) {
             shouldRedirect = false;
          }
        } catch (e) {
            // Ignore error
        }
      }

      if (shouldRedirect) {
        navigate(`/algorithm/tutorial/result?submissionId=${submissionId}`, { replace: true });
      }
    }
  }, [user, submissionId, navigate]);

  // Alert 훅
  const {alert, showAlert, closeAlert} = useAlert();

  // 상태 관리
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAIFeedback, setShowAIFeedback] = useState(true);
  const [showProblemDescription, setShowProblemDescription] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // GitHub 커밋 상태
  const [githubSettings, setGithubSettings] = useState(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitStatus, setCommitStatus] = useState({success: null, message: '', url: ''});

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
  // 자동 커밋 중복 호출 방지
  const autoCommitTriggeredRef = useRef(false);
  // 이전 AI 피드백 상태 추적 (자동 커밋 윈도우 판단용)
  const prevAiFeedbackStatusRef = useRef(null);
  // 자동 커밋 윈도우 활성화 여부 (AI 완료 후 3초 이내만 true)
  const [autoCommitWindowActive, setAutoCommitWindowActive] = useState(false);

  // Monaco Editor 테마 (다크/라이트 모드 연동)
  const [editorTheme, setEditorTheme] = useState(
    document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'
  );

  // 다크/라이트 모드 변경 감지
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setEditorTheme(isDark ? 'vs-dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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
        if (!user?.userId) {
          console.warn('로그인되지 않은 상태에서 미션 완료 처리 스킵');
        } else {
        console.log('🎯 미션 완료 API 호출 시작:', { missionType: 'PROBLEM_SOLVE', userId: user.userId });
        try {
          const missionResult = await completeMission('PROBLEM_SOLVE', user.userId);
          console.log('🎯 미션 완료 API 응답 (전체):', JSON.stringify(missionResult, null, 2));

          // API 응답 구조 분석: 다양한 응답 패턴 처리
          // 패턴 1: { success: true, message, rewardPoints }
          // 패턴 2: { data: { success: true, ... } }
          // 패턴 3: { alreadyCompleted: true }
          // 패턴 4: { error: true, message }

          const result = missionResult.data || missionResult; // data wrapper 처리

          if (result.error) {
            console.warn('미션 완료 API 오류:', result.message);
            setMissionStatus(prev => ({...prev, error: result.message}));
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
        } catch (error_) {
          console.warn('미션 완료 처리 실패:', error_);
          setMissionStatus(prev => ({...prev, error: '미션 완료 처리 실패'}));
        }
        }
      }

      // 🚀 AI 피드백이 방금 완료된 경우 자동 커밋 윈도우 활성화 (3초)
      const prevAiStatus = prevAiFeedbackStatusRef.current;
      if (
        data.aiFeedbackStatus === 'COMPLETED' &&
        prevAiStatus !== null &&
        prevAiStatus !== 'COMPLETED' &&
        data.judgeResult === 'AC' &&
        !data.githubCommitUrl &&
        !autoCommitTriggeredRef.current
      ) {
        console.log('🚀 자동 커밋 윈도우 활성화 (3초)');
        setAutoCommitWindowActive(true);

        // 3초 후 윈도우 비활성화
        setTimeout(() => {
          console.log('⏰ 자동 커밋 윈도우 만료');
          setAutoCommitWindowActive(false);
        }, 3000);
      }

      // 이전 AI 상태 업데이트
      prevAiFeedbackStatusRef.current = data.aiFeedbackStatus;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  // GitHub 설정 로드
  useEffect(() => {
    const loadGithubSettings = async () => {
      const res = await getGithubSettings();
      if (!res.error) {
        setGithubSettings(res);
      }
    };
    loadGithubSettings();
  }, []);

  // 🚀 자동 커밋 처리 (AC + AI 완료 + 자동커밋 활성화 + 윈도우 활성화 시)
  useEffect(() => {
    const performAutoCommit = async () => {
      // 자동 커밋 조건 체크
      if (!submission) return;
      if (!githubSettings?.autoCommitEnabled) return; // 자동 커밋 비활성화
      if (!githubSettings?.githubRepoName) return; // 저장소 미설정
      if (submission.githubCommitUrl) return; // 이미 커밋됨
      if (submission.judgeResult !== 'AC') return; // 정답이 아님
      if (submission.aiFeedbackStatus !== 'COMPLETED') return; // AI 피드백 미완료
      if (autoCommitTriggeredRef.current) return; // 이미 자동 커밋 시도함
      if (isCommitting) return; // 커밋 진행 중
      if (!autoCommitWindowActive) return; // ⏰ 자동 커밋 윈도우 비활성화 (이전 제출 방지)

      // 자동 커밋 실행
      autoCommitTriggeredRef.current = true;
      console.log('🚀 자동 커밋 시작...');

      setIsCommitting(true);
      setCommitStatus({success: null, message: '자동 커밋 중...', url: ''});

      const res = await commitToGithub(submissionId);

      setIsCommitting(false);

      if (res.error) {
        setCommitStatus({
          success: false,
          message: res.message || '자동 커밋에 실패했습니다.',
          url: ''
        });
        console.error('❌ 자동 커밋 실패:', res.message);
      } else {
        setCommitStatus({
          success: true,
          message: '자동 커밋이 완료되었습니다!',
          url: res.commitUrl || ''
        });
        setSubmission(prev => ({...prev, githubCommitUrl: res.commitUrl}));
        console.log('✅ 자동 커밋 완료:', res.commitUrl);
      }

      // 5초 후 메시지 숨기기
      setTimeout(() => {
        setCommitStatus(prev => ({...prev, success: null}));
      }, 5000);
    };

    performAutoCommit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.judgeResult, submission?.aiFeedbackStatus, submission?.githubCommitUrl, githubSettings?.autoCommitEnabled, githubSettings?.githubRepoName, autoCommitWindowActive]);

  // GitHub 커밋 핸들러 (수동)
  const handleGithubCommit = async () => {
    if (!submissionId) return;

    setIsCommitting(true);
    setCommitStatus({success: null, message: '', url: ''});

    const res = await commitToGithub(submissionId);

    setIsCommitting(false);

    if (res.error) {
      setCommitStatus({
        success: false,
        message: res.message || '커밋에 실패했습니다.',
        url: ''
      });
    } else {
      setCommitStatus({
        success: true,
        message: '커밋이 완료되었습니다!',
        url: res.commitUrl || ''
      });
      // submission 상태 업데이트 (커밋 URL 반영)
      setSubmission(prev => ({...prev, githubCommitUrl: res.commitUrl}));
    }

    // 3초 후 메시지 숨기기
    setTimeout(() => {
      setCommitStatus(prev => ({...prev, success: null}));
    }, 5000);
  };

  // GitHub 커밋 버튼 활성화 조건
  const canCommitToGithub = () => {
    if (!submission) return false;
    if (!githubSettings?.githubRepoName) return false; // 저장소 미설정
    if (submission.githubCommitUrl) return false; // 이미 커밋됨
    if (submission.judgeResult !== 'AC') return false; // 정답이 아님
    if (submission.aiFeedbackStatus !== 'COMPLETED') return false; // AI 피드백 미완료
    return true;
  };

  // GitHub 커밋 버튼 비활성화 이유
  const getGithubButtonDisabledReason = () => {
    if (!submission) return '';
    if (submission.githubCommitUrl) return ''; // 이미 커밋됨 (링크로 표시)
    if (!githubSettings?.githubRepoName) return '저장소 미설정';
    if (submission.judgeResult !== 'AC') return '정답만 커밋 가능';
    if (submission.aiFeedbackStatus !== 'COMPLETED') return 'AI 분석 대기 중...';
    return '';
  };

  // 결과 색상 및 아이콘
  const getResultInfo = (result) => {
    switch (result) {
      case 'AC':
        return {color: 'text-green-600', bg: 'bg-green-100', icon: '✅', text: 'Accepted'};
      case 'WA':
        return {color: 'text-red-600', bg: 'bg-red-100', icon: '❌', text: 'Wrong Answer'};
      case 'TLE':
        return {color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⏰', text: 'Time Limit Exceeded'};
      case 'MLE':
        return {color: 'text-purple-600', bg: 'bg-purple-100', icon: '💾', text: 'Memory Limit Exceeded'};
      case 'CE':
        return {color: 'text-orange-600', bg: 'bg-orange-100', icon: '⚠️', text: 'Compilation Error'};
      case 'RE':
        return {color: 'text-red-600', bg: 'bg-red-100', icon: '💥', text: 'Runtime Error'};
      default:
        return {color: 'text-gray-600', bg: 'bg-gray-100', icon: '⏳', text: 'Judging...'};
    }
  };

  // 구조화된 문제 섹션 존재 여부 (백엔드에서 직접 제공)
  const hasStructuredSections = submission?.inputFormat || submission?.outputFormat || submission?.constraints;

  // 공유하기
  const handleShare = async () => {
    if (!submission) return;

    // AC가 아니면 경고
    if (submission.judgeResult !== 'AC') {
      showAlert({
        type: 'warning',
        title: '공유 불가',
        message: '통과한 문제만 공유가 가능합니다.'
      });
      return;
    }

    setIsSharing(true);

    try {
      const response = await updateSharingStatus(submission.submissionId, true);

      if (response.error) {
        showAlert({
          type: 'error',
          title: '공유 실패',
          message: response.message || '공유 설정에 실패했습니다.'
        });
      } else {
        setSubmission(prev => ({...prev, isShared: true}));

        // 확인 다이얼로그
        const goToSolutions = globalThis.confirm('제출 결과를 공유했습니다! 확인하시겠습니까?');

        if (goToSolutions) {
          navigate(`/algorithm/problems/${submission.problemId}`, {
            state: {activeTab: 'solutions'}
          });
        }
      }
    } catch (error) {
      console.error('공유하기 실패:', error);
      showAlert({
        type: 'error',
        title: '공유 오류',
        message: '공유 설정 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSharing(false);
    }
  };

  // 다시 풀기
  const handleRetry = () => {
    if (submission?.problemId) {
      navigate(`/algorithm/problems/${submission.problemId}/solve`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#131313] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sub text-lg">채점 결과를 불러오는 중...</p>
          <p className="text-muted text-sm mt-2">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#131313] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-xl mb-4">⚠️ {error}</p>
          <button onClick={() => navigate('/algorithm')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            문제 목록으로
          </button>
        </div>
      </div>
    );
  }

  if (!submission) return null;

  const resultInfo = getResultInfo(submission.judgeResult);

  return (
    <div className="min-h-screen bg-white dark:bg-[#131313] submission-result-page">
      {/* 상단 헤더 */}
      <div className="bg-white dark:bg-[#1f1f1f] shadow-sm border-b border-gray-200 dark:border-[#2e2e2e] submission-header-panel">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 네비게이션 */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/algorithm')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                ← 문제 목록
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <h1 className="text-lg font-semibold text-main">
                📊 제출 결과
              </h1>
              <span className="text-muted">제출 #{submissionId}</span>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors btn-primary"
              >
                🔄 다시 풀기
              </button>

              {/* GitHub 커밋 버튼 - 항상 표시 */}
              {submission.githubCommitUrl && submission.githubCommitUrl.length > 0 ? (
                // 이미 커밋된 경우: 커밋 보기 링크
                <a
                  href={submission.githubCommitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2 btn-github"
                >
                  <AiFillGithub className="w-5 h-5"/>
                  커밋 보기
                </a>
              ) : !githubSettings?.githubRepoName ? (
                // 저장소 미설정: 설정 페이지로 이동
                <button
                  onClick={() => navigate('/mypage/profile')}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors flex items-center gap-2 btn-secondary"
                  title="프로필에서 GitHub 저장소를 설정해주세요"
                >
                  <AiFillGithub className="w-5 h-5"/>
                  저장소 설정
                </button>
              ) : githubSettings?.autoCommitEnabled && (isCommitting || submission.judgeResult !== 'AC' || submission.aiFeedbackStatus !== 'COMPLETED' || autoCommitWindowActive) ? (
                // 자동 커밋 활성화 상태 (자동 커밋 진행 중이거나 윈도우 활성화 중)
                isCommitting ? (
                  // 자동 커밋 진행 중
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-800 text-white rounded cursor-wait flex items-center gap-2 animate-pulse"
                  >
                    <AiFillGithub className="w-5 h-5 animate-spin"/>
                    자동 커밋 중...
                  </button>
                ) : submission.judgeResult !== 'AC' ? (
                  // 정답이 아님
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed flex items-center gap-2"
                    title="정답(AC)일 때만 자동 커밋됩니다"
                  >
                    <AiFillGithub className="w-5 h-5"/>
                    정답만 커밋 가능
                  </button>
                ) : submission.aiFeedbackStatus !== 'COMPLETED' ? (
                  // AI 피드백 대기 중
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-600 text-gray-300 rounded cursor-wait flex items-center gap-2"
                    title="AI 분석 완료 후 자동으로 커밋됩니다"
                  >
                    <AiFillGithub className="w-5 h-5"/>
                    <span className="flex items-center gap-1">
                      <span className="animate-spin text-xs">⏳</span>
                      자동 커밋 대기 중
                    </span>
                  </button>
                ) : (
                  // 자동 커밋 조건 충족 (곧 커밋됨)
                  <button
                    disabled
                    className="px-4 py-2 bg-green-600 text-white rounded cursor-wait flex items-center gap-2"
                  >
                    <AiFillGithub className="w-5 h-5"/>
                    자동 커밋 준비 중...
                  </button>
                )
              ) : canCommitToGithub() ? (
                // 수동 커밋 가능: 활성화된 버튼
                <button
                  onClick={handleGithubCommit}
                  disabled={isCommitting}
                  className={`px-4 py-2 rounded transition-colors flex items-center gap-2 btn-github ${
                    isCommitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  <AiFillGithub className="w-5 h-5"/>
                  {isCommitting ? '커밋 중...' : 'GitHub 커밋'}
                </button>
              ) : (
                // 수동 커밋 불가: 비활성화된 버튼 (항상 표시)
                <button
                  disabled
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed flex items-center gap-2 btn-github"
                  title={getGithubButtonDisabledReason()}
                >
                  <AiFillGithub className="w-5 h-5"/>
                  <span>{getGithubButtonDisabledReason() || 'GitHub 커밋'}</span>
                </button>
              )}

              {submission.isShared ? (
                // 이미 공유된 경우: 공유한 내용 보러가기
                <button
                  onClick={() => navigate(`/algorithm/problems/${submission.problemId}`, {
                    state: { activeTab: 'solutions' }
                  })}
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors btn-primary"
                >
                  📤 공유한 내용 보러가기
                </button>
              ) : (
                // 미공유인 경우: 공유하기 버튼
                <button
                  onClick={handleShare}
                  disabled={isSharing || submission.judgeResult !== 'AC'}
                  className={`px-4 py-2 rounded transition-colors btn-share ${
                    isSharing || submission.judgeResult !== 'AC'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  title={submission.judgeResult !== 'AC' ? '통과한 문제만 공유가 가능합니다.' : ''}
                >
                  {isSharing ? '공유 중...' : '📤 공유하기'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 🎯 데일리 미션 완료 배너 */}
          {missionStatus.completed && (
            <div
              className="bg-linear-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 text-white animate-pulse">
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

          {/* 🏆 획득 XP 배너 (AC 제출 시에만 표시) */}
          {submission.judgeResult === 'AC' && submission.earnedXp > 0 && (
            <div className="bg-linear-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✨</span>
                  <div>
                    <h3 className="font-bold text-lg">경험치 획득!</h3>
                    <p className="text-purple-100 text-sm">
                      {submission.isFirstSolve ? '🎉 첫 정답 보너스 1.5배 적용!' : '문제를 정답 처리하여 XP를 획득했습니다'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">+{submission.earnedXp} XP</p>
                  <p className="text-purple-100 text-xs">
                    {submission.isFirstSolve ? '첫 정답 보너스' : '문제 풀이 보상'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GitHub 커밋 상태 배너 */}
          {commitStatus.success !== null && (
            <div className={`rounded-lg shadow-lg p-4 flex items-center justify-between ${
              commitStatus.success
                ? 'bg-linear-to-r from-gray-700 to-gray-800 text-white'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              <div className="flex items-center gap-3">
                <AiFillGithub className="w-8 h-8"/>
                <div>
                  <h3 className="font-bold">{commitStatus.success ? 'GitHub 커밋 완료!' : '커밋 실패'}</h3>
                  <p className={`text-sm ${commitStatus.success ? 'text-gray-300' : ''}`}>
                    {commitStatus.message}
                  </p>
                </div>
              </div>
              {commitStatus.success && commitStatus.url && (
                <a
                  href={commitStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-100 transition-colors font-medium"
                >
                  커밋 보기 →
                </a>
              )}
            </div>
          )}

          {/* 결과 요약 카드 */}
          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-[#2e2e2e] p-6 submission-summary-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 문제 정보 */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">📝 문제</h3>
                <p
                  onClick={() => navigate(`/algorithm/problems/${submission.problemId}`)}
                  className="text-lg font-semibold text-main cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span
                    className="text-blue-600 dark:text-blue-400 hover:underline">#{submission.problemId}</span> {submission.problemTitle}
                </p>
                {/* 배지: 난이도, 출제분야, 알고리즘 유형 */}
                <div className="problem-badges mt-2 flex flex-wrap gap-1">
                  <span className={`badge ${getDifficultyBadgeClass(submission.difficulty)}`}>
                    {submission.difficulty || 'N/A'}
                  </span>
                  <span className={`badge ${getProblemTypeBadgeClass(submission.problemType)}`}>
                    {submission.problemType === 'SQL' ? 'DATABASE' : 'ALGORITHM'}
                  </span>
                  {/* 알고리즘 유형 태그 - 여러 필드명 지원 */}
                  {(submission.algoProblemTags || submission.tags || submission.problemTags) && (() => {
                    const tagsData = submission.algoProblemTags || submission.tags || submission.problemTags;
                    try {
                      const tags = typeof tagsData === 'string' ? JSON.parse(tagsData) : tagsData;
                      if (Array.isArray(tags)) {
                        return tags.map((tag, idx) => (
                          <span key={idx} className="badge badge-tag">
                            {tag}
                          </span>
                        ));
                      }
                      return <span className="badge badge-tag">{tagsData}</span>;
                    } catch {
                      return <span className="badge badge-tag">{tagsData}</span>;
                    }
                  })()}
                </div>
              </div>

              {/* 판정 결과 */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">⚖️ 판정</h3>
                <div className={`inline-flex items-center px-3 py-2 rounded-lg ${resultInfo.bg} result-badge-${submission.judgeResult?.toLowerCase() || 'default'}`}>
                  <span className="text-xl mr-2">{resultInfo.icon}</span>
                  <span className={`font-semibold ${resultInfo.color}`}>{resultInfo.text}</span>
                </div>
              </div>

              {/* 테스트 통과율 */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">🧪 테스트</h3>
                <p className="text-lg font-semibold text-main">
                  {submission.passedTestCount || 0}/{submission.totalTestCount || 0}
                </p>
                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-1 progress-bar-bg">
                  <div
                    className={`h-2 rounded-full ${submission.judgeResult === 'AC' ? 'bg-green-500 progress-bar-success' : 'bg-red-500 progress-bar-error'}`}
                    style={{width: `${submission.totalTestCount ? (submission.passedTestCount / submission.totalTestCount) * 100 : 0}%`}}
                  ></div>
                </div>
              </div>

              {/* AI 점수 */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-2">🤖 AI 점수</h3>
                {submission.aiFeedbackStatus === 'COMPLETED' ? (
                  <>
                    <p className="text-lg font-semibold text-main">{submission.aiScore || 0}/100</p>
                    <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-1 progress-bar-bg">
                      <div
                        className="bg-blue-500 h-2 rounded-full progress-bar-info"
                        style={{width: `${submission.aiScore || 0}%`}}
                      ></div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-muted">
                    <span className="animate-spin">⚙️</span>
                    <span>분석 중...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 문제 설명 (접이식) */}
          {submission.problemDescription && (
            <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-[#2e2e2e] problem-description-section">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors section-header"
                onClick={() => setShowProblemDescription(!showProblemDescription)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <h3 className="text-lg font-semibold text-main">문제 설명</h3>
                </div>
                <button
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center gap-1">
                  <span>{showProblemDescription ? '접기' : '펼치기'}</span>
                  <span
                    className={`transform transition-transform ${showProblemDescription ? 'rotate-180' : ''}`}>▼</span>
                </button>
              </div>

              {showProblemDescription && (
                <div className="problem-content-area p-6 pt-4">
                  {/* 구조화된 문제 내용 */}
                  {hasStructuredSections ? (
                    <>
                      {/* 문제 설명 */}
                      <div className="section-card section-description">
                        <div className="section-header">
                          <span className="section-icon">📋</span>
                          <h2 className="section-title">문제 설명</h2>
                        </div>
                        <div className="section-content">
                          {renderFormattedText(
                            submission.inputFormat
                              ? extractPureDescription(submission.problemDescription)
                              : submission.problemDescription
                          )}
                        </div>
                      </div>

                      {/* 입력/출력 그리드 */}
                      {(submission.inputFormat || submission.outputFormat) && (
                        <div className="io-grid">
                          {submission.inputFormat && (
                            <div className="section-card section-input">
                              <div className="section-header">
                                <span className="section-icon">📥</span>
                                <h2 className="section-title">입력</h2>
                              </div>
                              <div className="section-content">
                                {renderFormattedText(submission.inputFormat)}
                              </div>
                            </div>
                          )}
                          {submission.outputFormat && (
                            <div className="section-card section-output">
                              <div className="section-header">
                                <span className="section-icon">📤</span>
                                <h2 className="section-title">출력</h2>
                              </div>
                              <div className="section-content">
                                {renderFormattedText(submission.outputFormat)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 제한사항 */}
                      {submission.constraints && (
                        <div className="section-card section-constraints">
                          <div className="section-header">
                            <span className="section-icon">⚠️</span>
                            <h2 className="section-title">제한 사항</h2>
                          </div>
                          <div className="section-content">
                            {renderFormattedText(submission.constraints)}
                          </div>
                        </div>
                      )}

                      {/* 예제 입출력 */}
                      {submission.testCaseResults && submission.testCaseResults.length > 0 && (
                        <div className="examples-section">
                          <h2 className="section-title" style={{ marginBottom: '1rem' }}>예제 입출력</h2>
                          <div className="examples-container">
                            <div className="example-grid">
                              <div className="example-item">
                                <h3 className="example-label">📝 예제 입력 1</h3>
                                <pre className="example-code">
                                  {submission.testCaseResults[0]?.input}
                                </pre>
                              </div>
                              <div className="example-item">
                                <h3 className="example-label">✅ 예제 출력 1</h3>
                                <pre className="example-code">
                                  {submission.testCaseResults[0]?.expectedOutput}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* 구조화된 필드가 없을 시 원본 출력 */
                    <div className="section-card section-description">
                      <div className="section-header">
                        <span className="section-icon">📋</span>
                        <h2 className="section-title">문제 설명</h2>
                      </div>
                      <div className="section-content">
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
            {/* 왼쪽 열: 실행 결과 + 제출된 코드 */}
            <div className="space-y-6">
              {/* 실행 결과 */}
              <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-[#2e2e2e] execution-result-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-main mb-4">📈 실행 결과</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted">실행 시간:</span>
                      <span
                        className="font-mono text-main">{submission.executionTime ? `${submission.executionTime}s` : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted">메모리 사용량:</span>
                      <span
                        className="font-mono text-main">{submission.memoryUsage ? `${submission.memoryUsage}KB` : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted">사용 언어:</span>
                      <span className="font-medium text-main">{submission.languageName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted">제출 시간:</span>
                      <span className="font-mono text-main">{new Date(submission.submittedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 테스트케이스 상세 결과 */}
                  {submission.testCaseResults && submission.testCaseResults.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-main mb-3">📋 테스트케이스 결과</h4>
                      <div className="space-y-3">
                        {submission.testCaseResults.map((tc, idx) => (
                          <div key={idx}
                               className={`border border-gray-200 dark:border-[#2e2e2e] rounded-lg p-3 bg-gray-50 dark:bg-[#2a2a2a] testcase-item ${tc.result === 'PASS' ? 'testcase-pass' : tc.result === 'FAIL' ? 'testcase-fail' : tc.result === 'ERROR' ? 'testcase-error' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-sub">
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
                                <span className="text-muted text-sm flex items-center gap-1">
                                  <span className="animate-spin">⏳</span>
                                  <span>채점 중...</span>
                                </span>
                              )}
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 dark:bg-zinc-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${tc.result === 'PASS'
                                  ? 'bg-green-500'
                                  : tc.result === 'FAIL'
                                    ? 'bg-red-500'
                                    : tc.result === 'ERROR'
                                      ? 'bg-orange-500'
                                      : 'bg-blue-500 animate-pulse'
                                }`}
                                style={{width: tc.result ? '100%' : '60%'}}
                              ></div>
                            </div>
                            {tc.executionTime && (
                              <div className="text-xs text-muted mt-1">
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
                        <span className="text-sm font-medium text-sub">전체 채점 진행률</span>
                        <span className="text-sm text-muted">
                          {submission.passedTestCount || 0}/{submission.totalTestCount || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
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

              {/* 제출된 코드 */}
              <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-[#2e2e2e] submitted-code-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-main mb-4">💻 제출된 코드</h3>
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-[#2e2e2e]">
                    <Editor
                      height="400px"
                      language={getMonacoLanguage(submission.languageName)}
                      value={submission.sourceCode || '// 코드 없음'}
                      theme={editorTheme}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'off',
                        folding: true,
                        wordWrap: 'on',
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        scrollbar: {
                          vertical: 'auto',
                          horizontal: 'auto'
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-muted text-sm">
                      언어: {submission.languageName} |
                      문자 수: {submission.sourceCode?.length || 0}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(submission.sourceCode)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                    >
                      📋 코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI 피드백 */}
            <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-[#2e2e2e] ai-feedback-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-main">🤖 AI 피드백</h3>
                  <button
                    onClick={() => setShowAIFeedback(!showAIFeedback)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    {showAIFeedback ? '접기' : '펼치기'}
                  </button>
                </div>

                {submission.aiFeedbackStatus === 'COMPLETED' ? (
                  showAIFeedback ? (
                    <div
                      className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 ai-feedback-content">
                      {submission.aiFeedback ? (
                        <MarkdownRenderer content={submission.aiFeedback}/>
                      ) : (
                        <p className="text-muted text-center py-4">피드백이 없습니다.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <p>피드백을 보려면 '펼치기'를 클릭하세요.</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                    <p>AI가 코드를 분석하고 있습니다...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 집중 모드 모니터링 통계 */}
          {submission.solveMode === 'FOCUS' && submission.monitoringStats && (
            <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-[#2e2e2e] focus-monitoring-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-main">👁️ 집중 모드 모니터링 결과</h3>
                  {submission.monitoringStats.autoSubmitted && (
                    <span
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                      자동 제출됨
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 전체화면 이탈 */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">🖥️</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.fullscreenExitCount || 0}
                    </div>
                    <div className="text-xs text-muted">전체화면 이탈</div>
                  </div>

                  {/* 탭 전환 */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">📑</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.tabSwitchCount || 0}
                    </div>
                    <div className="text-xs text-muted">탭 전환</div>
                  </div>

                  {/* 얼굴 미검출 (15초 이상) */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">👤</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.noFaceCount || 0}
                    </div>
                    <div className="text-xs text-muted">얼굴 미검출</div>
                  </div>

                  {/* 마우스 이탈 */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">🖱️</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.mouseLeaveCount || 0}
                    </div>
                    <div className="text-xs text-muted">마우스 이탈</div>
                  </div>

                  {/* 졸음 감지 */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">😴</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.sleepingCount || 0}
                    </div>
                    <div className="text-xs text-muted">졸음 감지</div>
                  </div>

                  {/* 다중 인물 감지 */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">👥</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.multipleFacesCount || 0}
                    </div>
                    <div className="text-xs text-muted">다중 인물</div>
                  </div>

                  {/* 깜빡임 없음 (Liveness 감지) */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">🖼️</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.maskDetectedCount || 0}
                    </div>
                    <div className="text-xs text-muted">깜빡임 없음</div>
                  </div>

                  {/* 시선 이탈 */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 text-center monitoring-stat-item">
                    <div className="text-2xl mb-1">👀</div>
                    <div className="text-2xl font-bold text-main">
                      {submission.monitoringStats.gazeAwayCount || 0}
                    </div>
                    <div className="text-xs text-muted">시선 이탈</div>
                  </div>
                </div>

                {/* 집중도 점수 통계 */}
                {(submission.monitoringStats.focusAvgScore != null || submission.monitoringStats.focusFinalScore != null) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2e2e2e]">
                    <h4 className="text-md font-semibold text-main mb-4 flex items-center gap-2">
                      📊 집중도 점수
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* 평균 집중도 */}
                      <div
                        className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 text-center border border-blue-100 dark:border-blue-800 focus-score-card focus-score-card-blue">
                        <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">평균 점수</div>
                        <div className={`text-2xl font-bold ${
                          (submission.monitoringStats.focusAvgScore || 0) >= 50 ? 'text-green-600' :
                            (submission.monitoringStats.focusAvgScore || 0) >= 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {submission.monitoringStats.focusAvgScore?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-xs text-muted">(-100 ~ +100)</div>
                      </div>

                      {/* 최종 집중도 */}
                      <div
                        className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-4 text-center border border-green-100 dark:border-green-800 focus-score-card focus-score-card-green">
                        <div className="text-sm text-green-600 dark:text-green-400 mb-1">최종 점수</div>
                        <div className={`text-2xl font-bold ${
                          (submission.monitoringStats.focusFinalScore || 0) >= 50 ? 'text-green-600' :
                            (submission.monitoringStats.focusFinalScore || 0) >= 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {submission.monitoringStats.focusFinalScore?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-xs text-muted">제출 시점</div>
                      </div>

                      {/* 집중 시간 비율 */}
                      <div
                        className="bg-linear-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg p-4 text-center border border-purple-100 dark:border-purple-800 focus-score-card focus-score-card-purple">
                        <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">집중 시간</div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {submission.monitoringStats.focusFocusedPercentage?.toFixed(1) || '0.0'}%
                        </div>
                        <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                            style={{width: `${submission.monitoringStats.focusFocusedPercentage || 0}%`}}
                          ></div>
                        </div>
                      </div>

                      {/* 고집중 시간 비율 */}
                      <div
                        className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg p-4 text-center border border-amber-100 dark:border-amber-800 focus-score-card focus-score-card-amber">
                        <div className="text-sm text-amber-600 dark:text-amber-400 mb-1">고집중 시간</div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                          {submission.monitoringStats.focusHighFocusPercentage?.toFixed(1) || '0.0'}%
                        </div>
                        <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                            style={{width: `${submission.monitoringStats.focusHighFocusPercentage || 0}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* 집중 시간 상세 (ms → 분:초 변환) */}
                    {(submission.monitoringStats.focusTotalTime || submission.monitoringStats.focusFocusedTime) && (
                      <div className="mt-4 text-sm text-muted flex items-center gap-4">
                        <span>
                          총 측정 시간: <span className="font-medium text-main">
                            {Math.floor((submission.monitoringStats.focusTotalTime || 0) / 60000)}분 {Math.floor(((submission.monitoringStats.focusTotalTime || 0) % 60000) / 1000)}초
                          </span>
                        </span>
                        <span>
                          집중 상태 시간: <span className="font-medium text-main">
                            {Math.floor((submission.monitoringStats.focusFocusedTime || 0) / 60000)}분 {Math.floor(((submission.monitoringStats.focusFocusedTime || 0) % 60000) / 1000)}초
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 요약 통계 */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2e2e2e]">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted">
                        총 위반: <span
                        className="font-bold text-main">{submission.monitoringStats.totalViolations || 0}회</span>
                      </span>
                      <span className="text-muted">
                        경고 표시: <span
                        className="font-bold text-main">{submission.monitoringStats.warningShownCount || 0}회</span>
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (submission.monitoringStats.totalViolations || 0) === 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 stats-badge-perfect'
                        : (submission.monitoringStats.totalViolations || 0) <= 3
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 stats-badge-good'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 stats-badge-warning'
                    }`}>
                      {(submission.monitoringStats.totalViolations || 0) === 0
                        ? '완벽한 집중!'
                        : (submission.monitoringStats.totalViolations || 0) <= 3
                          ? '양호'
                          : '주의 필요'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  * 집중 모드 모니터링 결과는 점수에 반영되지 않습니다. (정보 제공 목적)
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
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

export default SubmissionResult;
