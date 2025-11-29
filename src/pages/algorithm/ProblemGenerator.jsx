import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateProblem } from '../../service/algorithm/algorithmApi';

/**
 * AI 문제 생성 페이지
 */
const ProblemGenerator = () => {
  const navigate = useNavigate();

  // ===== Topic 매핑 테이블 =====
  const TOPIC_ENUM_MAP = {
    "배열": "ARRAY",
    "DP": "DP",
    "그리디": "GREEDY",
    "그래프": "GRAPH",
    "구현": "IMPLEMENTATION",
    "수학": "MATH",
    "문자열": "STRING",
    "정렬": "SORTING",
    "탐색": "SEARCH",
    "시뮬레이션": "SIMULATION",
    "재귀": "RECURSION",
    "백트래킹": "BACKTRACKING",
    "BFS": "BFS",
    "DFS": "DFS",
    "이분탐색": "BINARY_SEARCH",
  };

  // ===== 상태 관리 =====
  const [formData, setFormData] = useState({
    difficulty: 'BRONZE',
    topic: '',        // 화면 표시용 (한글)
    topicEnum: '',    // API 전송용 (ENUM)
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

  const TOPIC_SUGGESTIONS = [
    '배열', 'DP', '그리디', '그래프', '구현', '수학',
    '문자열', '정렬', '탐색', '시뮬레이션', '재귀', '백트래킹',
    'BFS', 'DFS', '이분탐색'
  ];

  // ===== 난이도 색상 =====
  const getDifficultyColorClass = (difficulty) => {
    const colors = {
      BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
      SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
      GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PLATINUM: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ===== 핸들러 =====

  // 추천 태그 클릭 시 ENUM 자동 적용
  const handleTopicSuggestionClick = (topic) => {
    setFormData(prev => ({
      ...prev,
      topic,                     // 한글 그대로 표시
      topicEnum: TOPIC_ENUM_MAP[topic] || ''  // ENUM 저장
    }));
  };

  // 텍스트 입력 → 한글 입력하면 ENUM 자동 매핑
  const handleTopicInput = (value) => {
    const trimmed = value.trim();

    setFormData(prev => ({
      ...prev,
      topic: trimmed,                        // 화면 표시용
      topicEnum: TOPIC_ENUM_MAP[trimmed] || ''  // ENUM 전송용
    }));
  };

  // formData 필드 변경 공통 처리
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
    if (!formData.topicEnum) {
      setError("알고리즘 주제를 올바르게 입력하거나 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGeneratedProblem(null);

      const payload = {
        difficulty: formData.difficulty,
        topic: formData.topicEnum,
        language: formData.language,
        additionalRequirements: formData.additionalRequirements
      };

      console.log("AI 문제 생성 요청 (백엔드로 보내는 값):", payload);

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
      topicEnum: '',
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* 돌아가기 */}
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
        <p className="text-gray-600 mb-8">원하는 난이도와 주제를 선택하면 AI가 문제를 생성합니다</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 왼쪽: 설정 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">문제 생성 설정</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 난이도 */}
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
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.difficulty === option.value
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

              {/* 주제 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문제 주제 <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => handleTopicInput(e.target.value)}
                  placeholder="예: 배열, 그래프, DP ..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />

                {/* 추천 */}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">추천 주제:</div>
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_SUGGESTIONS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleTopicSuggestionClick(topic)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 언어 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로그래밍 언어
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 요구사항 (선택)
                </label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                  placeholder="예: 초보자용으로 쉽게, 실무 면접 수준..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 에러 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold flex justify-center gap-2"
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
                  className="px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-md"
                >
                  초기화
                </button>
              </div>
            </form>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">생성된 문제 미리보기</h2>

            {!generatedProblem && !loading && (
              <div className="text-center py-12 text-gray-500">
                <p>문제 생성 버튼을 클릭하면 AI가 문제를 보여줍니다.</p>
              </div>
            )}

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
                  <h3 className="text-2xl font-bold mt-2">{generatedProblem.title}</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium mb-2">문제 설명</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {generatedProblem.description}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/algorithm/problems/${generatedProblem.problemId}/solve`)}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-md font-bold"
                  >
                    바로 풀기
                  </button>
                  <button
                    onClick={() => handleGoToProblemDetail(generatedProblem.problemId)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-md font-bold"
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
