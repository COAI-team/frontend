import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import AlertModal from '../../components/modal/AlertModal';
import axiosInstance from '../../server/AxiosConfig';
import {useLogin} from '../../context/login/useLogin';
import ReactMarkdown from 'react-markdown';
import {useAlert} from "../../hooks/common/useAlert.js";

const MistakeReportPage = () => {
  const navigate = useNavigate();
  const {user} = useLogin();
  const {alert, showAlert, closeAlert} = useAlert();
  const userId = user?.userId;

  const [reportData, setReportData] = useState(null); // Parsed JSON object
  const [mistakeDetails, setMistakeDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quizStarted, setQuizStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch AI Report
        const reportRes = await axiosInstance.get(`/api/mistakes/report/${userId}`);
        let rawContent = reportRes.data;

        // Parse JSON if it's a string (e.g. Markdown code block)
        if (typeof rawContent === 'string') {
          // Remove markdown fences ```json ... ``` or ``` ... ```
          rawContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
          try {
            const parsed = JSON.parse(rawContent);
            setReportData(parsed);
          } catch (e) {
            console.error("Failed to parse report JSON", e);
            // Fallback if parsing fails (shouldn't happen with correct prompt)
            setReportData({
              title: "Report Parsing Error",
              description: "AI 리포트를 불러왔으나 형식이 올바르지 않습니다.",
              raw: rawContent
            });
          }
        } else {
          setReportData(rawContent);
        }

        // 2. Fetch Helper Code Details (Evidence)
        // If the user has critical mistakes, this will return their details.
        const detailsRes = await axiosInstance.get(`/api/mistakes/details/${userId}`);
        console.log("Fetched Mistake Details:", detailsRes.data);
        setMistakeDetails(detailsRes.data);

        setError(null);
      } catch (err) {
        console.error("Failed to fetch mistake report", err);
        setError("리포트를 생성하는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    console.log("Current User ID:", userId);
    fetchData();
  }, [userId]);

  const handleSubmitQuiz = async () => {
    if (!reportData?.quiz || reportData.quiz.length === 0) return;

    const questions = reportData.quiz;
    const correctCount = questions.filter(
      (q) => userAnswers[q.id] === q.answer
    ).length;

    const isPass = correctCount === questions.length;

    if (isPass) {
      try {
        await axiosInstance.post(`/api/mistakes/solve-quiz/${userId}`);
      } catch (err) {
        console.error("Failed to submit quiz result", err);
      }
    }

    showAlert({
      type: isPass ? "success" : "danger",
      title: isPass ? "통과 (PASS)" : "불합격 (FAIL)",
      message: isPass
        ? "좋아, 이제 좀 사람 같네. 이번엔 봐주겠지만... 다음에 또 그러면 그땐 진짜 파묻는다. (경고가 해제되었습니다)"
        : "장난하냐? 아직도 정신 못 차렸네. 다시 공부하고 와.",
      confirmText: isPass ? "채굴장으로 복귀" : "처음부터 다시 하기",
      onConfirm: () => {
        if (isPass) {
          navigate("/");
        } else {
          setQuizStarted(false);
          setUserAnswers({});
        }
      },
    });
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setUserAnswers({});
  };

  if (loading) return <div
    className="flex justify-center items-center h-screen text-2xl font-bold animate-pulse text-red-600">선생님이 생활기록부를
    뒤적거리는 중...</div>;
  if (error) return <div className="text-center mt-20 text-red-500 font-bold text-xl">{error}</div>;
  if (!reportData) return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">No
    Report Data Found.</div>;

  const {title, description, danger, fix, quiz} = reportData;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-mono relative overflow-hidden">
      {/* Background Effect */}
      <div
        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-8 border-b-4 border-red-600 pb-4">
          <h1
            className="text-4xl md:text-5xl font-black text-red-500 mb-2 uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
            {title || "WAKE UP CALL"}
          </h1>
          <p className="text-xl text-gray-400">
            "정신 차려. 이대로 가면 너 큰일 난다."
          </p>
        </div>

        {!quizStarted ? (
          <div className="animate-fade-in-up space-y-8">
            {/* 1. Analysis */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              <h3 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2 text-blue-400">분석 (Analysis)</h3>
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown>{description}</ReactMarkdown>
              </div>
            </div>

            {/* 2. Danger */}
            <div className="bg-gray-800/80 rounded-xl p-6 shadow-xl border-l-8 border-red-600">
              <h3 className="text-2xl font-bold mb-4 text-red-500">⚠️ 위험성 (Danger)</h3>
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown>{danger}</ReactMarkdown>
              </div>
            </div>

            {/* 3. Fix */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-green-700/50">
              <h3 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2 text-green-400">✅ 해결책 (Solution)</h3>
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown>{fix}</ReactMarkdown>
              </div>
            </div>

            {/* 4. Evidence (Code Snippets) */}
            {mistakeDetails.length > 0 ? (
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-yellow-500 mb-6 flex items-center gap-3">
                  <span>🔍 증거 자료 (Your Dirty Laundry)</span>
                </h2>
                <div className="space-y-6">
                  {mistakeDetails.map((detail, idx) => (
                    <div key={idx}
                         className="bg-gray-800/50 border border-yellow-600/30 rounded-lg p-6 relative overflow-hidden group hover:border-yellow-500/80 transition-all">
                      <div className="absolute top-0 left-0 bg-yellow-600 text-black font-bold px-3 py-1 text-xs">
                        EVIDENCE #{idx + 1}
                      </div>
                      <div className="mt-4 mb-2 flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-yellow-200">{detail.mistakeType}</h3>
                          <p className="text-sm text-gray-400 font-mono">{detail.filePath}</p>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(detail.createdAt).toLocaleDateString()}</span>
                      </div>

                      {detail.description && (
                        <p className="text-gray-300 text-sm mb-4 italic">
                          "{detail.description}"
                        </p>
                      )}

                      <div className="bg-black/80 rounded p-4 overflow-x-auto border-l-4 border-red-500">
                                                <pre className="text-sm text-red-300 font-mono">
                                                    <code>{detail.code}</code>
                                                </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-12 bg-gray-800 rounded-xl p-8 border border-gray-700 text-center opacity-70">
                <h2 className="text-2xl font-bold text-gray-500 mb-2">🔍 증거 자료 없음 (No Evidence Found)</h2>
                <p className="text-gray-400">
                  아직 치명적인 실수가 발견되지 않았거나, 데이터가 부족합니다.<br/>
                  (혹은 정말로 완벽한 코드인가요?)
                </p>
              </div>
            )}

            {/* Start Quiz Button */}
            <div className="text-center py-10">
              <button
                onClick={handleStartQuiz}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-full text-2xl shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:scale-105 transition-transform animate-pulse"
              >
                생존 퀴즈 시작하기 (Start Survival Quiz)
              </button>
              <p className="mt-4 text-gray-500 text-sm">※ 100점을 맞아야만 경고가 해제됩니다.</p>
            </div>
          </div>
        ) : (
          // Quiz Interface
          <div className="max-w-3xl w-full mx-auto animate-fade-in-up">
            <h2 className="text-3xl font-bold mb-8 text-center text-red-500">📝 생존을 위한 O/X 퀴즈</h2>
            <div className="space-y-8">
              {quiz && quiz.map((q) => (
                <div key={q.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
                  <p className="text-xl font-medium mb-6 leading-relaxed">Q. {q.question}</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setUserAnswers(prev => ({...prev, [q.id]: true}))}
                      className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all transform active:scale-95 ${
                        userAnswers[q.id] === true
                          ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      O (True)
                    </button>
                    <button
                      onClick={() => setUserAnswers(prev => ({...prev, [q.id]: false}))}
                      className={`flex-1 py-4 rounded-lg font-bold text-xl transition-all transform active:scale-95 ${
                        userAnswers[q.id] === false
                          ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      X (False)
                    </button>
                  </div>
                  {/* Debugging or Hints can go here */}
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmitQuiz}
              disabled={!quiz || Object.keys(userAnswers).length < quiz.length}
              className="w-full mt-12 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-xl transition-all shadow-xl"
            >
              제출하고 살아남기
            </button>
          </div>
        )}

        {/* Result Modal */}
        <AlertModal
          open={alert.open}
          onClose={closeAlert}
          onConfirm={alert.onConfirm}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          confirmText={alert.confirmText}
        />
      </div>
    </div>
  );
};

export default MistakeReportPage;
