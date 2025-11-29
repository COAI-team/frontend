import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateProblem } from '../../service/algorithm/algorithmApi';
import TopicSelector from '../../components/algorithm/common/TopicSelector';

/**
 * AI 문제 생성 페이지
 */
const ProblemGenerator = () => {
  const navigate = useNavigate();

  // ===== 상태 관리 =====
  const [formData, setFormData] = useState({
    difficulty: 'BRONZE',
    topic: '',  // 주제 (한글 그대로 전송)
    language: 'JAVA',
    additionalRequirements: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedProblem, setGeneratedProblem] = useState(null);

  // ===== 옵션 =====
  const DIFFICULTY_OPTIONS = [
    { value: 'BRONZE', label: '브론즈 (초급)', color: 'orange', description: '기본 문법, 간단한 구현' },
    { value: 'SILVER', label: '실버 (초중급)', color: 'gray', description: '기본 알고리즘, 자료구조' },
    { value: 'GOLD', label: '골드 (중급)', color: 'yellow', description: '고급 알고리즘, 최적화' },
    { value: 'PLATINUM', label: '플래티넘 (고급)', color: 'blue', description: '복잡한 알고리즘, 수학적 사고' },
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'JAVA', label: 'Java' },
    { value: 'PYTHON', label: 'Python' },
    { value: 'CPP', label: 'C++' },
    { value: 'JAVASCRIPT', label: 'JavaScript' },
    { value: 'ALL', label: '모든 언어' },
  ];

  // ===== 난이도 색상 =====
  const getDifficultyColorClass = (difficulty) => {
    const colors = {
      BRONZE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
      SILVER: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
      GOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
      PLATINUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    };
    return colors[difficulty] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  };

  // ===== 핸들러 =====

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ===== 제출 처리 =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.topic || formData.topic.trim() === '') {
      setError("알고리즘 주제를 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGeneratedProblem(null);

      const payload = {
        difficulty: formData.difficulty,
        topic: formData.topic,  // 한글 그대로 전송
        language: formData.language,
        additionalRequirements: formData.additionalRequirements
      };

      console.log("AI 문제 생성 요청:", payload);

      const result = await generateProblem(payload);

      if (result.error) {
        setError(result.message || '문제 생성에 실패했습니다.');
        return;
      }

      setGeneratedProblem(result.data);

    } catch (err) {
      setError("문제 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 초기화
  const handleReset = () => {
    setFormData({
      difficulty: 'BRONZE',
      topic: '',
      language: 'JAVA',
      additionalRequirements: '',
    });
    setGeneratedProblem(null);
    setError(null);
  };

  const handleGoToProblemList = () => navigate('/algorithm/problems');
  const handleGoToProblemDetail = (id) => navigate(`/algorithm/problems/${id}`);

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* 돌아가기 */}
        <button
          onClick={handleGoToProblemList}
          className="mb-4 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 
                   flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          문제 목록으로
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">🤖 AI 문제 생성</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">원하는 난이도와 주제를 선택하면 AI가 문제를 생성합니다</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 왼쪽: 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">문제 생성 설정</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 난이도 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  난이도 <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('difficulty', option.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.difficulty === option.value
                          ? `${getDifficultyColorClass(option.value)} border-current`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 주제 선택 (TopicSelector) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  문제 주제 <span className="text-red-500">*</span>
                </label>

                <div className="p-4 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <TopicSelector
                    selectedTopic={formData.topic}
                    onTopicSelect={(topicValue) => handleInputChange('topic', topicValue)}
                  />

                  {/* 선택된 주제 표시 */}
                  {formData.topic && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">선택된 주제:</span>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 
                                   rounded-full text-sm font-medium border border-blue-200 dark:border-blue-700">
                        {formData.topic}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 언어 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  프로그래밍 언어
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  {LANGUAGE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 추가 요구사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  추가 요구사항 (선택)
                </label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                  placeholder="예: 초보자용으로 쉽게, 실무 면접 수준..."
                  rows={3}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              {/* 에러 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                              text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
                           text-white px-6 py-3 rounded-md font-semibold flex justify-center items-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>AI가 문제를 생성하는 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      <span>문제 생성하기</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 
                           hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md
                           text-gray-700 dark:text-gray-300 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  초기화
                </button>
              </div>
            </form>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">생성된 문제 미리보기</h2>

            {/* 빈 상태 */}
            {!generatedProblem && !loading && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-6xl mb-4">🤖</div>
                <p>문제 생성 버튼을 클릭하면</p>
                <p>AI가 문제를 보여줍니다.</p>
              </div>
            )}

            {/* 로딩 중 */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 
                              border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">AI가 문제를 생성하는 중...</p>
              </div>
            )}

            {/* 생성 완료 */}
            {generatedProblem && (
              <div className="space-y-4">
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColorClass(
                      generatedProblem.difficulty
                    )}`}
                  >
                    {generatedProblem.difficulty}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {generatedProblem.title}
                  </h3>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border dark:border-gray-600">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">문제 설명</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {generatedProblem.description}
                  </div>
                </div>

                {generatedProblem.testCaseCount && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ✅ 테스트케이스 {generatedProblem.testCaseCount}개 생성 완료
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/algorithm/problems/${generatedProblem.problemId}/solve`)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 
                             text-white py-3 rounded-md font-bold transition-colors"
                  >
                    바로 풀기
                  </button>
                  <button
                    onClick={() => handleGoToProblemDetail(generatedProblem.problemId)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
                             text-white py-3 rounded-md font-bold transition-colors"
                  >
                    상세 보기
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProblemGenerator;