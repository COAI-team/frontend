import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../../components/algorithm/editor/CodeEditor';
import {
  codeTemplates,
  LANGUAGE_MAP,
  LANGUAGE_NAME_TO_TEMPLATE_KEY,
  ALLOWED_LANGUAGES
} from '../../components/algorithm/editor/editorUtils';
import { startProblemSolve, runTestCode } from '../../service/algorithm/algorithmApi';
import { useTutorWebSocket } from '../../hooks/algorithm/useTutorWebSocket';
import { useLogin } from '../../context/useLogin';

const TUTOR_AUTO_INTERVAL_MS = 8000;

/** 마크다운 굵게(**텍스트**) 처리 */
function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const bold = part.slice(2, -2);
      return (
        <strong key={idx} className="text-gray-100">
          {bold}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const SectionCard = ({ title, icon, content, bgColor = 'bg-zinc-900/50' }) => {
  if (!content) return null;
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-zinc-700`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="font-semibold text-gray-200">{title}</h4>
      </div>
      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
        {renderFormattedText(content)}
      </div>
    </div>
  );
};

const CodeBlock = ({ title, icon, content }) => {
  if (!content) return null;
  return (
    <div className="bg-zinc-950 rounded-lg overflow-hidden border border-zinc-700">
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <span>{icon}</span>
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
      <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto">
        {content}
      </pre>
    </div>
  );
};

const parseProblemDescription = (description) => {
  if (!description) return null;

  const sections = {
    description: '',
    input: '',
    output: '',
    constraints: '',
    exampleInput: '',
    exampleOutput: ''
  };

  const patterns = {
    input: /(?:^|\n)(?:\*\*)?(?:입력|Input)(?:\*\*)?\s*:?\s*\n?/i,
    output: /(?:^|\n)(?:\*\*)?(?:출력|Output)(?:\*\*)?\s*:?\s*\n?/i,
    constraints: /(?:^|\n)(?:\*\*)?(?:제한|제한사항|Constraints?)(?:\*\*)?\s*:?\s*\n?/i,
    exampleInput: /(?:^|\n)(?:\*\*)?(?:예제 입력|Sample Input|Example Input)(?:\*\*)?\s*\d*\s*:?\s*\n?/i,
    exampleOutput:
      /(?:^|\n)(?:\*\*)?(?:예제 출력|Sample Output|Example Output)(?:\*\*)?\s*\d*\s*:?\s*\n?/i
  };

  const found = [];
  Object.entries(patterns).forEach(([key, regex]) => {
    const match = regex.exec(description);
    if (match) {
      found.push({ key, index: match.index, length: match[0].length });
    }
  });

  found.sort((a, b) => a.index - b.index);

  if (found.length === 0) {
    sections.description = description.trim();
    return sections;
  }

  const first = found[0];
  sections.description = description.slice(0, first.index).trim();

  for (let i = 0; i < found.length; i += 1) {
    const current = found[i];
    const next = found[i + 1];
    const content = description
      .slice(current.index + current.length, next ? next.index : description.length)
      .trim();
    sections[current.key] = content;
  }

  return sections;
};

const getDifficultyBadge = (diff) => {
  const styles = {
    BRONZE: 'bg-orange-900/50 text-orange-400 border-orange-700',
    SILVER: 'bg-gray-700/50 text-gray-300 border-gray-600',
    GOLD: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
    PLATINUM: 'bg-cyan-900/50 text-cyan-400 border-cyan-700',
    DIAMOND: 'bg-blue-900/50 text-blue-300 border-blue-700'
  };
  return styles[diff || ''] || 'bg-gray-700/50 text-gray-400 border-gray-600';
};

const QUESTION_COOLDOWN_MS = 5000;

const ProblemLearn = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { user } = useLogin();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLanguage, setSelectedLanguage] = useState('Python 3');
  const [code, setCode] = useState('');

  const [tutorQuestion, setTutorQuestion] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [tutorFontSize, setTutorFontSize] = useState('14px');
  const [tutorTextColor, setTutorTextColor] = useState('#e5e7eb');

  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [lastJudgeResult, setLastJudgeResult] = useState(null);
  const [lastJudgeSource, setLastJudgeSource] = useState('');

  const [questionCooldownUntil, setQuestionCooldownUntil] = useState(null);
  const [questionCooldownRemaining, setQuestionCooldownRemaining] = useState(0);

  // 채팅 스크롤 상태
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);

  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  const currentUserId = user?.userId ?? user?.id ?? null;
  const rawTier = user?.subscriptionTier;
  const subscriptionTier = rawTier === 'BASIC' || rawTier === 'PRO' ? rawTier : 'FREE';
  const isFree = subscriptionTier === 'FREE';
  const isBasic = subscriptionTier === 'BASIC';
  const isPro = subscriptionTier === 'PRO';

  // ===== 문제 데이터 로드 =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await startProblemSolve(problemId);
        const data = res?.data || res;
        setProblem(data);

        const defaultLang =
          data?.defaultLanguage && LANGUAGE_MAP[data.defaultLanguage]
            ? LANGUAGE_MAP[data.defaultLanguage]
            : 'Python 3';
        setSelectedLanguage(defaultLang);

        const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[defaultLang] || 'python';
        setCode(codeTemplates[templateKey] || '');
      } catch (err) {
        console.error(err);
        setError('문제를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (problemId) fetchData();
  }, [problemId]);

  const filteredLanguages = useMemo(() => {
    const allowedSet =
      ALLOWED_LANGUAGES instanceof Set
        ? ALLOWED_LANGUAGES
        : new Set(Array.isArray(ALLOWED_LANGUAGES) ? ALLOWED_LANGUAGES : []);

    if (problem?.availableLanguages?.length) {
      const seen = new Set();
      return problem.availableLanguages
        .map((lang) => lang.languageName || lang)
        .filter((langName) => {
          if (!langName || seen.has(langName)) return false;
          seen.add(langName);
          if (!allowedSet.has(langName)) return false;
          const monacoLang = LANGUAGE_MAP[langName];
          return monacoLang && monacoLang !== 'plaintext';
        });
    }
    return Array.from(allowedSet);
  }, [problem]);

  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    const templateKey = LANGUAGE_NAME_TO_TEMPLATE_KEY[newLang] || 'python';
    setCode(codeTemplates[templateKey] || '');
    setHasRunOnce(false);
    setLastJudgeResult(null);
    setLastJudgeSource('');
  }, []);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleCodeChange = useCallback(
    (value) => {
      setCode(value);
      if (value !== lastJudgeSource) {
        setHasRunOnce(false);
        setLastJudgeResult(null);
      }
    },
    [lastJudgeSource]
  );

  // ===== Tutor WebSocket =====
  const autoEnabled =
    !!currentUserId && isPro && hasRunOnce && lastJudgeResult !== 'AC';

  const {
    status: tutorStatus,
    messages: tutorMessages,
    sendUserQuestion,
    isPending
  } = useTutorWebSocket({
    problemId: Number(problemId),
    userId: currentUserId,
    language: selectedLanguage,
    code,
    enableAuto: autoEnabled,
    autoIntervalMs: TUTOR_AUTO_INTERVAL_MS
  });

  const mappedTutorMessages = useMemo(
    () =>
      tutorMessages.map((msg) => ({
        role: 'TUTOR',
        type: msg.type || 'HINT',
        triggerType: msg.triggerType || 'INFO',
        content: msg.content || 'No content provided.',
        createdAt: msg._receivedAt || new Date().toISOString()
      })),
    [tutorMessages]
  );

  const allMessages = useMemo(
    () =>
      [...localMessages, ...mappedTutorMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [localMessages, mappedTutorMessages]
  );

  /** 맨 아래로 스크롤 */
  const scrollToBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const target = chatContainerRef.current;
      if (!target) return;
      target.scrollTop = target.scrollHeight;
      setAutoScrollEnabled(true);
      setHasNewMessages(false);
      setLastSeenMessageCount(allMessages.length);
    });
  }, [allMessages.length]);

  /** 스크롤 이벤트 핸들러 */
  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const isBottom = distanceFromBottom <= 4;

    setAutoScrollEnabled(isBottom);
    if (isBottom) {
      setHasNewMessages(false);
      setLastSeenMessageCount(allMessages.length);
    }
  }, [allMessages.length]);

  /** 새 메시지 도착 시 */
  useEffect(() => {
    if (allMessages.length === 0) return;

    if (autoScrollEnabled) {
      scrollToBottom();
      setLastSeenMessageCount(allMessages.length);
      setHasNewMessages(false);
    } else if (allMessages.length > lastSeenMessageCount) {
      setHasNewMessages(true);
    }
  }, [allMessages, autoScrollEnabled, lastSeenMessageCount, scrollToBottom]);

  // 질문 쿨타임 타이머
  useEffect(() => {
    if (!questionCooldownUntil) {
      setQuestionCooldownRemaining(0);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const diff = questionCooldownUntil - now;
      if (diff <= 0) {
        setQuestionCooldownUntil(null);
        setQuestionCooldownRemaining(0);
        return;
      }
      setQuestionCooldownRemaining(Math.ceil(diff / 1000));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [questionCooldownUntil]);

  const handleSendTutorQuestion = useCallback(async () => {
    const trimmed = tutorQuestion.trim();
    if (!trimmed || !currentUserId || tutorStatus !== 'CONNECTED' || isFree) return;

    setLocalMessages((prev) => [
      ...prev,
      {
        role: 'USER',
        type: 'QUESTION',
        triggerType: 'USER',
        content: trimmed,
        createdAt: new Date().toISOString()
      }
    ]);

    let judgeMeta;

    try {
      const res = await runTestCode({
        problemId: Number(problemId),
        language: selectedLanguage,
        sourceCode: code
      });
      const data = res?.data || res;
      judgeMeta = {
        judgeResult: data?.overallResult ?? null,
        passedCount: data?.passedCount ?? null,
        totalCount: data?.totalCount ?? null
      };
      setHasRunOnce(true);
      setLastJudgeSource(code);
      setLastJudgeResult(data?.overallResult ?? null);
    } catch (e) {
      // 조용히 무시, judgeMeta 없이도 Tutor는 동작
    }

    sendUserQuestion(trimmed, judgeMeta);
    setTutorQuestion('');
    setQuestionCooldownUntil(Date.now() + QUESTION_COOLDOWN_MS);
    scrollToBottom();
  }, [
    tutorQuestion,
    currentUserId,
    tutorStatus,
    isFree,
    problemId,
    selectedLanguage,
    code,
    sendUserQuestion,
    scrollToBottom
  ]);

  const tutorStatusDotClass = useMemo(() => {
    switch (tutorStatus) {
      case 'CONNECTED':
        return 'bg-green-400';
      case 'CONNECTING':
        return 'bg-yellow-400';
      case 'ERROR':
        return 'bg-red-400';
      default:
        return 'bg-gray-500';
    }
  }, [tutorStatus]);

  const tutorStatusText = useMemo(() => {
    switch (tutorStatus) {
      case 'CONNECTED':
        return 'Connected';
      case 'CONNECTING':
        return 'Connecting';
      case 'ERROR':
        return 'Error';
      default:
        return 'Disconnected';
    }
  }, [tutorStatus]);

  const isQuestionOnCooldown =
    questionCooldownUntil !== null && questionCooldownUntil > Date.now();

  const tutorPlaceholder = !currentUserId
    ? 'Login to send questions.'
    : isFree
      ? 'Live Tutor는 Basic / Pro 구독에서 이용 가능합니다.'
      : isQuestionOnCooldown
        ? `${questionCooldownRemaining}초 뒤에 질문을 다시 보낼 수 있습니다.`
        : 'Ask the tutor a question...';

  const canSend =
    !!tutorQuestion.trim() &&
    tutorStatus === 'CONNECTED' &&
    !!currentUserId &&
    !isFree &&
    !isQuestionOnCooldown;

  // ===== 테스트 실행 =====
  const runTests = useCallback(async () => {
    setIsRunning(true);
    setRunProgress(0);
    try {
      const res = await runTestCode({
        problemId: Number(problemId),
        language: selectedLanguage,
        sourceCode: code
      });
      const data = res?.data || res;
      setTestResult(data);
      setHasRunOnce(true);
      setLastJudgeSource(code);
      setLastJudgeResult(data?.overallResult ?? null);
    } catch {
      setTestResult({ error: true, message: '테스트 실행 중 오류가 발생했습니다.' });
    } finally {
      setIsRunning(false);
      setRunProgress(100);
    }
  }, [problemId, selectedLanguage, code]);

  const parsedSections = useMemo(
    () => parseProblemDescription(problem?.description),
    [problem?.description]
  );

  if (loading) {
    return (
      <div className="h-screen bg-zinc-900 text-gray-100 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-zinc-900 text-gray-100 flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-900 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 shrink-0">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              #{problem?.problemId || problemId} {problem?.title || '문제'}
            </h1>
            <p className="text-sm text-gray-400">
              맞힌 사람 {problem?.solvedUserCount ?? 0} • 제출한 사람{' '}
              {problem?.submittedCount ?? 0}
            </p>
            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-purple-700 text-white">
              학습 모드
            </span>
          </div>
          <button
            onClick={() => navigate(`/algorithm/problems/${problemId}/solve`)}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
          >
            ← 풀이 모드로
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 py-6 h-full">
          <div className="grid grid-cols-12 gap-4 items-stretch h-full">
            {/* 문제 설명 */}
            <div className="col-span-3 h-full">
              <div className="bg-zinc-850 rounded border border-zinc-700 p-4 h-full overflow-auto space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-3">문제 설명</h2>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 rounded border text-xs ${getDifficultyBadge(
                        problem?.difficulty
                      )}`}
                    >
                      {problem?.difficulty || 'UNKNOWN'}
                    </span>
                    <span className="px-2 py-1 rounded border border-blue-800 bg-blue-900/30 text-xs text-blue-200">
                      시간제한: {(problem?.timeLimit || problem?.timelimit || 0) || 0}ms
                    </span>
                    <span className="px-2 py-1 rounded border border-emerald-800 bg-emerald-900/30 text-xs text-emerald-200">
                      메모리제한: {(problem?.memoryLimit || problem?.memorylimit || 0) || 0}MB
                    </span>
                  </div>
                </div>

                {parsedSections ? (
                  <div className="space-y-4">
                    <SectionCard
                      title="문제 설명"
                      icon="📄"
                      content={parsedSections.description || '문제 설명이 없습니다.'}
                      bgColor="bg-zinc-900/30"
                    />

                    <div className="grid grid-cols-1 gap-4">
                      <SectionCard
                        title="입력"
                        icon="⌨️"
                        content={parsedSections.input}
                        bgColor="bg-blue-900/20"
                      />
                      <SectionCard
                        title="출력"
                        icon="🖨️"
                        content={parsedSections.output}
                        bgColor="bg-green-900/20"
                      />
                    </div>

                    <SectionCard
                      title="제한사항"
                      icon="🪢"
                      content={parsedSections.constraints}
                      bgColor="bg-yellow-900/20"
                    />

                    {(parsedSections.exampleInput || parsedSections.exampleOutput) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CodeBlock
                          title="예제 입력"
                          icon="📜"
                          content={parsedSections.exampleInput}
                        />
                        <CodeBlock
                          title="예제 출력"
                          icon="📤"
                          content={parsedSections.exampleOutput}
                        />
                      </div>
                    )}

                    {!parsedSections.exampleInput &&
                      !parsedSections.exampleOutput &&
                      problem?.sampleTestCases?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                            <span>📄</span> 예제
                          </h3>
                          {problem.sampleTestCases.map((tc, idx) => (
                            <div
                              key={idx}
                              className="bg-zinc-900 rounded p-4 mb-3 border border-zinc-700"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">입력</p>
                                  <pre className="text-sm bg-zinc-950 p-2 rounded font-mono text-green-400 whitespace-pre-wrap">
                                    {tc.input}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">출력</p>
                                  <pre className="text-sm bg-zinc-950 p-2 rounded font-mono text-green-400 whitespace-pre-wrap">
                                    {tc.expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">문제 설명을 불러올 수 없습니다.</p>
                )}
              </div>
            </div>

            {/* 에디터 + 실행결과 */}
            <div className="col-span-6 h-full">
              <div className="bg-zinc-850 rounded border border-zinc-700 p-4 h-full flex flex-col">
                {/* 언어 선택 */}
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-gray-300">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
                  >
                    {filteredLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 코드 에디터 */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CodeEditor
                    language={selectedLanguage}
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorMount}
                    height="100%"
                    theme="vs-dark"
                  />
                </div>

                {/* Execution Result */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col">
                  <p className="text-sm text-gray-400 mb-2">Execution Result</p>

                  {isRunning && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Running test code...</span>
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

                  <div className="text-sm max-h-[170px] overflow-auto">
                    {isRunning ? (
                      <div className="flex items-center gap-2 text-yellow-400 mt-1 text-xs">
                        <span className="animate-spin">...</span>
                        <span>Running code on Judge0 server...</span>
                      </div>
                    ) : testResult ? (
                      testResult.error ? (
                        <span className="text-red-400">Error: {testResult.message}</span>
                      ) : (
                        <div>
                          <div
                            className={`font-bold mb-2 ${
                              testResult.overallResult === 'AC'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {testResult.overallResult === 'AC'
                              ? 'Accepted!'
                              : `Result: ${testResult.overallResult}`}
                            <span className="ml-2 text-gray-400 font-normal">
                              ({testResult.passedCount}/{testResult.totalCount} passed)
                            </span>
                            {testResult.maxExecutionTime && (
                              <span className="ml-2 text-gray-500 font-normal text-xs">
                                Time: {testResult.maxExecutionTime}ms
                              </span>
                            )}
                          </div>
                          {testResult.testCaseResults?.map((tc, idx) => (
                            <div key={idx} className="text-xs mt-1">
                              <span
                                className={tc.result === 'AC' ? 'text-green-400' : 'text-red-400'}
                              >
                                TC{tc.testCaseNumber}: {tc.result}
                              </span>
                              {tc.result !== 'AC' && tc.actualOutput && (
                                <span className="text-gray-500 ml-2">
                                  Output: "{tc.actualOutput?.trim()}"
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
                      <span className="text-gray-500 text-xs">
                        Write code and press &quot;Run Code&quot; to see results.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      onClick={runTests}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded disabled:opacity-50 flex items-center gap-2 text-sm"
                      disabled={isRunning}
                    >
                      {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Tutor */}
            <div className="col-span-3 h-full">
              <div className="bg-zinc-900 rounded border border-zinc-700 p-3 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2 gap-3 flex-nowrap">
                  <div className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${tutorStatusDotClass}`} />
                    <span className="text-sm font-semibold">Live Tutor</span>
                    <span className="text-xs text-gray-500">
                      AUTO hints every {Math.floor(TUTOR_AUTO_INTERVAL_MS / 1000)}s
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {tutorStatusText}
                  </span>
                </div>

                {/* 채팅 영역 */}
                <div className="relative flex-1 min-h-0 mt-2">
                  {/* 실제 스크롤 되는 박스 */}
                  <div
                    ref={chatContainerRef}
                    onScroll={handleChatScroll}
                    className="absolute inset-0 bg-zinc-950 rounded p-3 text-sm space-y-2 border border-zinc-800 overflow-y-auto"
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                      <label className="flex items-center gap-1">
                        Font
                        <select
                          value={tutorFontSize}
                          onChange={(e) => setTutorFontSize(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                        >
                          <option value="12px">12px</option>
                          <option value="14px">14px</option>
                          <option value="16px">16px</option>
                          <option value="18px">18px</option>
                        </select>
                      </label>
                      <label className="flex items-
                        center gap-1">
                        Color
                        <input
                          type="color"
                          value={tutorTextColor}
                          onChange={(e) => setTutorTextColor(e.target.value)}
                          className="w-16 h-7 bg-transparent border border-zinc-700 rounded"
                        />
                      </label>
                    </div>

                    {allMessages.length === 0 ? (
                      <p className="text-gray-500 text-xs">
                        No tutor messages yet. Auto hints will appear when your code stays stable.
                      </p>
                    ) : (
                      <>
                        {allMessages.map((msg, idx) => {
                          const isUser = msg.role === 'USER';

                          // 라벨 계산
                          let label = '';
                          let rightLabel = null;

                          if (isUser) {
                            label = 'QUESTION';
                          } else {
                            const type = msg.type || 'HINT';
                            const trigger = msg.triggerType || '';

                            if (type === 'HINT' && trigger === 'AUTO') {
                              label = 'HINT';
                              rightLabel = 'AUTO';
                            } else if (type === 'HINT' && (!trigger || trigger === 'USER')) {
                              label = 'ANSWER';
                            } else {
                              label = type.toUpperCase();
                              if (trigger && trigger.toUpperCase() !== label) {
                                rightLabel = trigger.toUpperCase();
                              }
                            }
                          }

                          return (
                            <div
                              key={`${msg.role}-${idx}-${msg.createdAt}`}
                              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`p-2 rounded border max-w-[90%] ${
                                  isUser
                                    ? 'bg-purple-700 text-white border-purple-500'
                                    : 'bg-zinc-900 text-gray-200 border-zinc-800'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                  <span
                                    className={`font-semibold tracking-wide ${
                                      isUser ? 'text-purple-50' : 'text-purple-200'
                                    }`}
                                  >
                                    {label}
                                  </span>
                                  {rightLabel && !isUser && (
                                    <span className="px-1.5 py-0.5 rounded-full border border-purple-400/70 text-[10px] text-purple-100">
                                      {rightLabel}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="whitespace-pre-wrap"
                                  style={{ fontSize: tutorFontSize, color: tutorTextColor }}
                                >
                                  {msg.content || 'No content provided.'}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {isPending && (
                          <div className="flex justify-start mt-1">
                            <div className="p-2 rounded border max-w-[80%] bg-zinc-900 text-gray-400 border-zinc-700 text-xs flex items-center gap-2">
                              <span className="animate-spin leading-none">●</span>
                              <span className="flex gap-0.5">
                                {'튜터가 답변을 작성 중입니다...'.split('').map((ch, i) => (
                                  <span
                                    key={`${ch}-${i}`}
                                    className="inline-block animate-bounce"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                  >
                                    {ch}
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 아래 화살표 / NEW 버튼 */}
                  {!autoScrollEnabled && (
                    <button
                      onClick={scrollToBottom}
                      className="absolute right-4 bottom-4 z-10 px-3 py-1 rounded-full bg-purple-600 text-white text-xs shadow-lg flex items-center gap-1"
                    >
                      <span className="text-lg leading-none">↓</span>
                      {hasNewMessages && <span>NEW</span>}
                    </button>
                  )}
                </div>

                {/* 입력 영역 */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={tutorQuestion}
                    onChange={(e) => setTutorQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (canSend) {
                          handleSendTutorQuestion();
                        }
                      }
                    }}
                    placeholder={tutorPlaceholder}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-60"
                    disabled={
                      tutorStatus !== 'CONNECTED' || !currentUserId || isFree || isQuestionOnCooldown
                    }
                    title={
                      isQuestionOnCooldown ? '질문은 5초에 한 번만 보낼 수 있습니다.' : ''
                    }
                  />
                  <button
                    onClick={handleSendTutorQuestion}
                    disabled={!canSend}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>

                {/* 티어 안내 */}
                {!currentUserId && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Login to use the tutor feature.
                  </p>
                )}
                {currentUserId && isFree && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Live Tutor는 Basic / Pro 구독에서 이용할 수 있습니다.
                  </p>
                )}
                {currentUserId && isBasic && (
                  <p className="text-xs text-gray-400 mt-2">
                    Basic 플랜: 직접 질문은 가능하지만 자동 힌트는 Pro에서만 제공됩니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemLearn;

