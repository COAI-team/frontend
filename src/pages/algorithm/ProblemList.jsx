import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 알고리즘 문제 목록 페이지 - Step 1 버전
 */
const ProblemList = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧩 알고리즘 문제 목록
          </h1>
          <p className="text-gray-600 mb-8">
            AI 생성 문제와 BOJ 문제를 풀어보세요
          </p>

          {/* 임시 개발 중 표시 */}
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
            <strong>🚧 개발 중</strong> - Day 3-4에 구현될 예정입니다
          </div>
        </div>

        {/* 기본 레이아웃 미리보기 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 필터 섹션 */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">🔍 필터</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">난이도</label>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">🥉 BRONZE</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">🥈 SILVER</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">🥇 GOLD</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">💎 PLATINUM</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">출처</label>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">🤖 AI 생성</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">📚 BOJ</span>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">✏️ 커스텀</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 문제 목록 섹션 */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="font-semibold text-lg">📝 문제 목록</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/algorithm/problems/generate')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    ✨ AI 문제 생성
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                    🔄 새로고침
                  </button>
                </div>
              </div>

              {/* 검색바 */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="문제 제목이나 태그로 검색..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 샘플 문제 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 1, title: '두 수의 합', difficulty: 'BRONZE', source: 'BOJ', tags: ['구현', '수학'] },
                  { id: 2, title: '피보나치 수', difficulty: 'SILVER', source: 'AI_GENERATED', tags: ['동적프로그래밍'] },
                  { id: 3, title: '최단경로', difficulty: 'GOLD', source: 'CUSTOM', tags: ['그래프', '다익스트라'] },
                  { id: 4, title: '문자열 처리', difficulty: 'BRONZE', source: 'AI_GENERATED', tags: ['문자열', '구현'] }
                ].map((problem) => (
                  <div key={problem.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{problem.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          problem.difficulty === 'BRONZE' ? 'bg-orange-100 text-orange-800' :
                          problem.difficulty === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                          problem.difficulty === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-cyan-100 text-cyan-800'
                        }`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {problem.source === 'AI_GENERATED' ? '🤖' :
                           problem.source === 'BOJ' ? '📚' : '✏️'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {problem.title}에 대한 문제 설명이 여기에 표시됩니다...
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2 text-xs">
                        {problem.tags.map((tag) => (
                          <span key={tag} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => navigate(`/algorithm/problems/${problem.id}/solve`)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        풀기 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <button className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                    이전
                  </button>
                  <button className="px-3 py-2 text-sm bg-blue-500 text-white rounded">
                    1
                  </button>
                  <button className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                    2
                  </button>
                  <button className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                    다음
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-8 text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>✅ Step 1 테스트</strong> - ProblemList 페이지가 정상적으로 로드되었습니다!
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemList;