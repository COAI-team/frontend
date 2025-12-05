import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateProblem } from '../../service/algorithm/algorithmApi';

/**
 * AI 문제 생성 페이지
 */
const ProblemGenerator = () => {
  const navigate = useNavigate();

  // ===== 상태 관리 =====
  const [formData, setFormData] = useState({
    difficulty: 'BRONZE',
    topic: '',
    additionalRequirements: '',
    problemType: 'ALGORITHM', // ALGORITHM, SQL
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedProblem, setGeneratedProblem] = useState(null);

  // ===== 상수 정의 =====
  const DIFFICULTY_OPTIONS = [
    { value: 'BRONZE', label: '브론즈 (초급)', color: 'orange', description: '기본 문법, 간단한 구현' },
    { value: 'SILVER', label: '실버 (초중급)', color: 'gray', description: '기본 알고리즘, 자료구조' },
    { value: 'GOLD', label: '골드 (중급)', color: 'yellow', description: '고급 알고리즘, 최적화' },
    { value: 'PLATINUM', label: '플래티넘 (고급)', color: 'blue', description: '복잡한 알고리즘, 수학적 사고' },
  ];



  const TOPIC_SUGGESTIONS_ALGO = [
    '배열', 'DP', '그리디', '그래프', '구현', '수학',
    '문자열', '정렬', '탐색', '시뮬레이션', '재귀', '백트래킹'
  ];

  const TOPIC_SUGGESTIONS_SQL = [
    'SELECT', 'GROUP BY', 'String, Date', 'JOIN', 'SUM, MAX, MIN', 'IS NULL'
  ];

  // ===== 이벤트 핸들러 =====
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTopicSuggestionClick = (topic) => {
    setFormData(prev => ({
      ...prev,
      topic: topic
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.topic.trim()) {
      setError('문제 주제를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGeneratedProblem(null);

      console.log('AI 문제 생성 요청:', formData);

      const result = await generateProblem(formData);

      if (result.error) {
        setError(result.message || '문제 생성에 실패했습니다.');
        return;
      }

      console.log('AI 문제 생성 성공:', result.data);
      setGeneratedProblem(result.data);

    } catch (err) {
      console.error('문제 생성 에러:', err);
      setError('문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      difficulty: 'BRONZE',
      topic: '',
      additionalRequirements: '',
      problemType: 'ALGORITHM',
    });
    setGeneratedProblem(null);
    setError(null);
  };

  const handleGoToProblemList = () => {
    navigate('/algorithm/problems');
  };

  const handleGoToProblemDetail = (problemId) => {
    navigate(`/algorithm/problems/${problemId}`);
  };

  // ===== 난이도 색상 헬퍼 =====
  const getDifficultyColorClass = (difficulty) => {
    const colors = {
      BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
      SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
      GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PLATINUM: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={handleGoToProblemList}
            className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            문제 목록으로
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI 문제 생성</h1>
          <p className="text-gray-600">원하는 난이도와 주제를 선택하면 AI가 문제를 생성합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 문제 생성 폼 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">문제 생성 설정</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 난이도 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  난이도 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('difficulty', option.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.difficulty === option.value
                        ? `${getDifficultyColorClass(option.value)} border-current`
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 문제 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  문제 유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('problemType', 'ALGORITHM')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.problemType === 'ALGORITHM'
                        ? 'bg-blue-50 text-blue-800 border-blue-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-semibold">알고리즘</div>
                    <div className="text-xs text-gray-600 mt-1">자료구조, 알고리즘 문제</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('problemType', 'SQL')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.problemType === 'SQL'
                        ? 'bg-green-50 text-green-800 border-green-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-semibold">SQL</div>
                    <div className="text-xs text-gray-600 mt-1">데이터베이스 쿼리 문제</div>
                  </button>
                </div>
              </div>

              {/* 주제 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  문제 주제 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(formData.problemType === 'SQL' ? TOPIC_SUGGESTIONS_SQL : TOPIC_SUGGESTIONS_ALGO).map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicSuggestionClick(topic)}
                      className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                        formData.topic === topic
                          ? 'bg-blue-50 text-blue-800 border-blue-500 font-semibold'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                {formData.topic && (
                  <div className="mt-3 text-sm text-blue-600">
                    선택된 주제: <span className="font-semibold">{formData.topic}</span>
                  </div>
                )}
              </div>

              {/* 추가 요구사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 요구사항 (선택)
                </label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                  placeholder="예: 초보자용으로 쉽게, 실무 면접 수준..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* 버튼 그룹 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
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
                  className="px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-md font-semibold transition-colors"
                >
                  초기화
                </button>
              </div>
            </form>
          </div>

          {/* 오른쪽: 생성된 문제 미리보기 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">생성된 문제 미리보기</h2>

            {!generatedProblem && !loading && (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>문제 생성 버튼을 클릭하면</p>
                <p>AI가 생성한 문제가 여기에 표시됩니다</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">AI가 문제를 생성하고 있습니다...</p>
                <p className="text-sm text-gray-500 mt-2">약 3-5초 소요됩니다</p>
              </div>
            )}

            {generatedProblem && (
              <div className="space-y-4">
                {/* 문제 제목 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColorClass(generatedProblem.difficulty)}`}>
                      {generatedProblem.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">
                      문제 ID: #{generatedProblem.problemId}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{generatedProblem.title}</h3>
                </div>

                {/* 문제 설명 미리보기 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">문제 설명</div>
                  <div className="text-sm text-gray-600 line-clamp-6 whitespace-pre-wrap">
                    {generatedProblem.description}
                  </div>
                </div>

                {/* 생성 정보 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">테스트케이스</div>
                      <div className="font-semibold text-gray-900">{generatedProblem.testCaseCount}개</div>
                    </div>
                    <div>
                      <div className="text-gray-600">생성 시간</div>
                      <div className="font-semibold text-gray-900">{generatedProblem.generationTime?.toFixed(2)}초</div>
                    </div>
                  </div>
                </div>

                {/* 성공 메시지 */}
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <p className="font-medium">✅ 문제가 성공적으로 생성되었습니다!</p>
                  <p className="text-sm mt-1">이제 문제 목록에서 확인하거나 바로 풀이를 시작할 수 있습니다.</p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate(`/algorithm/problems/${generatedProblem.problemId}/solve`)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-md font-bold shadow-md transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <span>🚀</span>
                    <span>바로 문제 풀러 가기</span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGoToProblemDetail(generatedProblem.problemId)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold transition-colors"
                    >
                      문제 상세 보기
                    </button>
                    <button
                      onClick={handleGoToProblemList}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md font-semibold transition-colors"
                    >
                      문제 목록으로
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div >
      </div >
    </div >
  );
};

export default ProblemGenerator;