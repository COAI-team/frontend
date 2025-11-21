import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AI 문제 생성 페이지 - Step 2 버전
 */
const ProblemGenerator = () => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [selectedDifficulty, setSelectedDifficulty] = useState('BRONZE');
  const [selectedTopic, setSelectedTopic] = useState('구현');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 언어 선택 토글
  const handleLanguageChange = (language) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  // 모의 AI 문제 생성 (실제로는 작동하지 않음)
  const handleGenerate = () => {
    setIsGenerating(true);
    
    // 3초 후 완료 (모의)
    setTimeout(() => {
      setIsGenerating(false);
      alert('개발 중입니다! Day 5-6에 실제 AI 연동이 구현됩니다.');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ✨ AI 문제 생성기
            </h1>
            <p className="text-gray-600">
              원하는 조건으로 알고리즘 문제를 AI가 생성해드립니다
            </p>
          </div>

          {/* 네비게이션 */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/algorithm')}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← 문제 목록으로 돌아가기
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">AI 문제 생성</span>
          </div>

          {/* 개발 상태 표시 */}
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-8">
            <strong>🚧 개발 예정</strong> - Day 5-6에 Spring AI 연동과 함께 구현됩니다 
            <br />
            <small>현재는 UI 테스트만 가능합니다.</small>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* 설정 패널 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-6 text-lg flex items-center">
                ⚙️ 문제 설정
              </h3>
              
              <div className="space-y-6">
                {/* 난이도 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    🏆 난이도 선택
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'BRONZE', label: '🥉 BRONZE', color: 'border-orange-300 bg-orange-50', selectedColor: 'ring-orange-500 bg-orange-100' },
                      { value: 'SILVER', label: '🥈 SILVER', color: 'border-gray-300 bg-gray-50', selectedColor: 'ring-gray-500 bg-gray-100' },
                      { value: 'GOLD', label: '🥇 GOLD', color: 'border-yellow-300 bg-yellow-50', selectedColor: 'ring-yellow-500 bg-yellow-100' },
                      { value: 'PLATINUM', label: '💎 PLATINUM', color: 'border-cyan-300 bg-cyan-50', selectedColor: 'ring-cyan-500 bg-cyan-100' }
                    ].map((difficulty) => (
                      <label key={difficulty.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="difficulty"
                          value={difficulty.value}
                          checked={selectedDifficulty === difficulty.value}
                          onChange={(e) => setSelectedDifficulty(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`
                          px-4 py-3 rounded-lg border-2 text-center text-sm font-medium transition-all
                          ${selectedDifficulty === difficulty.value 
                            ? `${difficulty.selectedColor} ring-2` 
                            : `${difficulty.color} hover:shadow-sm`}
                        `}>
                          {difficulty.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 주제 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    📚 알고리즘 주제
                  </label>
                  <select 
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="구현">🔧 구현 (Implementation)</option>
                    <option value="동적 프로그래밍">📊 동적 프로그래밍 (DP)</option>
                    <option value="그리디 알고리즘">💡 그리디 알고리즘</option>
                    <option value="그래프 탐색">🕸️ 그래프 탐색 (BFS/DFS)</option>
                    <option value="문자열 처리">📝 문자열 처리</option>
                    <option value="정렬">📶 정렬 알고리즘</option>
                    <option value="이분 탐색">🔍 이분 탐색</option>
                    <option value="트리">🌳 트리 구조</option>
                  </select>
                </div>

                {/* 언어 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    💻 지원 언어 (복수 선택 가능)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Java', icon: '☕', color: 'bg-red-50 border-red-200 text-red-800' },
                      { name: 'Python', icon: '🐍', color: 'bg-green-50 border-green-200 text-green-800' },
                      { name: 'C++', icon: '⚡', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                      { name: 'JavaScript', icon: '🌟', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' }
                    ].map((lang) => (
                      <label key={lang.name} className="cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedLanguages.includes(lang.name)}
                          onChange={() => handleLanguageChange(lang.name)}
                          className="sr-only"
                        />
                        <div className={`
                          flex items-center justify-center px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all
                          ${selectedLanguages.includes(lang.name) 
                            ? `${lang.color} ring-2 ring-blue-500` 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:shadow-sm'}
                        `}>
                          <span className="mr-2">{lang.icon}</span>
                          {lang.name}
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedLanguages.length > 0 && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ 선택됨: {selectedLanguages.join(', ')}
                    </div>
                  )}
                </div>

                {/* 생성 버튼 */}
                <div className="pt-4">
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
                      isGenerating 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        🤖 AI가 문제를 생성하는 중...
                      </div>
                    ) : (
                      '🚀 AI 문제 생성하기'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 미리보기 패널 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-6 text-lg flex items-center">
                👀 문제 미리보기
              </h3>
              
              {isGenerating ? (
                // 생성 중일 때
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-blue-600 font-medium mb-2">AI가 문제를 생성하고 있습니다...</p>
                  <p className="text-gray-500 text-sm">잠시만 기다려주세요</p>
                </div>
              ) : (
                // 기본 상태
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">🤖</div>
                  <p className="text-gray-400 mb-2 text-lg">AI가 생성한 문제가</p>
                  <p className="text-gray-400 mb-8 text-lg">여기에 표시됩니다</p>
                  
                  {/* 현재 설정 표시 */}
                  <div className="bg-gray-50 p-6 rounded-lg text-left">
                    <h4 className="font-semibold mb-4 text-gray-800">현재 설정 요약:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">난이도:</span>
                        <span className="font-medium text-gray-800">{selectedDifficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">주제:</span>
                        <span className="font-medium text-gray-800">{selectedTopic}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">언어:</span>
                        <span className="font-medium text-gray-800">
                          {selectedLanguages.length > 0 ? selectedLanguages.join(', ') : '선택 안함'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2 완료 상태 */}
          <div className="mt-8">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
              <strong>✅ Step 2 테스트</strong> - ProblemGenerator 페이지가 정상적으로 로드되었습니다!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemGenerator;