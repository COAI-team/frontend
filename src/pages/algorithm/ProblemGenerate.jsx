// src/pages/algorithm/ProblemGenerate.jsx
import React, { useState } from 'react';
import NavBar from '../../components/common/NavBar';

const ProblemGenerate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    difficulty: '',
    topic: '',
    language: 'python'
  });

  const [generatedProblem, setGeneratedProblem] = useState(null);

  const difficulties = [
    { value: 'EASY', label: '쉬움', color: 'text-green-400' },
    { value: 'MEDIUM', label: '보통', color: 'text-yellow-400' },
    { value: 'HARD', label: '어려움', color: 'text-red-400' }
  ];

  const topics = [
    '구현', '브루트포스', '그리디', '다이나믹 프로그래밍',
    'BFS/DFS', '그래프', '트리', '정렬', '이분탐색'
  ];

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'cpp', label: 'C++' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.difficulty || !formData.topic) {
      alert('난이도와 주제를 선택해주세요.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const mockProblem = {
        problemId: "1234",
        title: "두 수의 합",
        description: `Company | Product Designer
                    Aug 2022 - Present
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.

                    Company | Product Designer
                    Month 2021 - Present
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.

                    Company | Product Designer
                    Month 2020 - Present
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.

                    Company | Product Designer
                    Month 2022 - Present
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.`,
        exampleInput: "1 2",
        exampleOutput: "3",
        createdAt: "방금 전"
      };
      setGeneratedProblem(mockProblem);
      setIsLoading(false);
    }, 2000);
  };

  const handleStartSolving = () => {
    if (generatedProblem) {
      alert('문제 풀이 페이지로 이동합니다.');
    }
  };

  // 스타일 정의
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#161513',
    fontFamily: "'Inter', sans-serif"
  };

  const mainContainerStyle = {
    width: '956px',
    height: '904px',
    background: 'rgba(24, 24, 27, 0.2)',
    border: '1px solid #27272A',
    borderRadius: '8px'
  };

  const headerStyle = {
    padding: '20px 20px 40px',
    gap: '10px',
    height: '107px',
    borderBottom: '1px solid #27272A'
  };

  const titleStyle = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: '18px',
    lineHeight: '22px',
    color: '#FAFAFA'
  };

  const statsStyle = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    lineHeight: '15px',
    color: '#71717A'
  };

  const tagStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '15px',
    color: '#71717A'
  };

  const problemPreviewStyle = {
    fontSize: '16.343px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '-0.02em',
    color: '#FFFFFF'
  };

  const companyHeaderStyle = {
    fontSize: '12.7112px',
    fontWeight: 500,
    lineHeight: '142.02%',
    letterSpacing: '-0.02em',
    textTransform: 'capitalize',
    color: '#FFFFFF'
  };

  const companyDateStyle = {
    fontSize: '10.8953px',
    fontWeight: 400,
    lineHeight: '13px',
    textTransform: 'capitalize',
    color: '#AEAEAE'
  };

  const companyDescStyle = {
    fontSize: '9.98738px',
    fontWeight: 400,
    lineHeight: '142.02%',
    letterSpacing: '-0.02em',
    textTransform: 'lowercase',
    color: '#AEAEAE'
  };

  const buttonGradientStyle = {
    background: 'linear-gradient(99.15deg, #FFF1B7 0.37%, #FF92CC 61.12%, #CE69F7 99.24%)',
    color: '#042F2E',
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    fontWeight: 500
  };

  const borderButtonStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    color: '#71717A',
    border: '1px solid #27272A'
  };

  return (
    <div style={containerStyle}>
      <NavBar />

      <div className="flex justify-center pt-4">
        <div style={mainContainerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div className="flex items-center justify-between">
              <h1 style={titleStyle}>
                #{generatedProblem?.problemId || '새 문제'} 문제
              </h1>

              <div className="flex items-center gap-2">
                <span style={statsStyle}>맞힌사람 232</span>
                <div className="w-1 h-1 rounded-full" style={{ background: '#52525B' }}></div>
                <span style={statsStyle}>제출한 사람 500</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div style={{
                width: '16px',
                height: '16px',
                border: '1.6px solid #FF90CD'
              }}></div>
              <span style={tagStyle}>
                난이도 / 언어 / 유형 / 제한시간
              </span>
            </div>
          </div>

          {!generatedProblem ? (
            // 문제 생성 폼
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-8 text-white">AI 문제 생성</h2>

              {/* 난이도 선택 */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4 text-white">난이도 선택</label>
                <div className="grid grid-cols-3 gap-4">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => handleInputChange('difficulty', diff.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.difficulty === diff.value
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className={`text-lg font-semibold ${diff.color}`}>
                        {diff.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 주제 선택 */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4 text-white">알고리즘 주제</label>
                <div className="grid grid-cols-3 gap-3">
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleInputChange('topic', topic)}
                      className={`p-3 rounded-lg border transition-all text-white ${
                        formData.topic === topic
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* 언어 선택 */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4 text-white">프로그래밍 언어</label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={handleGenerate}
                disabled={isLoading || !formData.difficulty || !formData.topic}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-white"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    AI 문제 생성 중...
                  </div>
                ) : (
                  'AI 문제 생성하기'
                )}
              </button>
            </div>
          ) : (
            // 생성된 문제 미리보기
            <div className="p-8 flex flex-col h-full">
              <h3 style={problemPreviewStyle} className="mb-6">
                문제 미리보기
              </h3>

              <div className="flex-1 space-y-6">
                {/* Company sections */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={companyHeaderStyle}>Company</span>
                    <div style={{
                      width: '0px',
                      height: '15.44px',
                      border: '0.907943px solid #E8E8E8'
                    }}></div>
                    <span style={companyHeaderStyle}>Product Designer</span>
                  </div>
                  <div style={companyDateStyle}>Aug 2022 - Present</div>
                  <div style={companyDescStyle} className="mt-2">
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={companyHeaderStyle}>Company</span>
                    <div style={{
                      width: '0px',
                      height: '15.44px',
                      border: '0.907943px solid #E8E8E8'
                    }}></div>
                    <span style={companyHeaderStyle}>Product Designer</span>
                  </div>
                  <div style={companyDateStyle}>month 2021 - Present</div>
                  <div style={companyDescStyle} className="mt-2">
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={companyHeaderStyle}>Company</span>
                    <div style={{
                      width: '0px',
                      height: '15.44px',
                      border: '0.907943px solid #E8E8E8'
                    }}></div>
                    <span style={companyHeaderStyle}>Product Designer</span>
                  </div>
                  <div style={companyDateStyle}>Month 2020 - Present</div>
                  <div style={companyDescStyle} className="mt-2">
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={companyHeaderStyle}>Company</span>
                    <div style={{
                      width: '0px',
                      height: '15.44px',
                      border: '0.907943px solid #E8E8E8'
                    }}></div>
                    <span style={companyHeaderStyle}>Product Designer</span>
                  </div>
                  <div style={companyDateStyle}>Month 2022 - Present</div>
                  <div style={companyDescStyle} className="mt-2">
                    collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                  </div>
                </div>
              </div>

              {/* 구분선 */}
              <div style={{
                width: '666px',
                height: '0px',
                border: '1px solid #27272A',
                margin: '20px auto',
                transform: 'rotate(180deg)'
              }}></div>

              {/* 버튼들 */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setGeneratedProblem(null)}
                  className="px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  style={borderButtonStyle}
                >
                  문제 다시 생성(1번만 가능)
                </button>

                <button
                  onClick={handleStartSolving}
                  className="px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={buttonGradientStyle}
                >
                  ✓ 문제 풀러 가기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemGenerate;