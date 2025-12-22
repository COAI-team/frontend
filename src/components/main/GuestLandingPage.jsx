import { Link } from "react-router-dom";
import { useScrollReveal } from './ScrollReveal.jsx';

export default function GuestLandingPage() {
  useScrollReveal();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Section 1: Hero (Intro) */}
      <section className="min-h-screen flex flex-col items-center justify-center relative w-full overflow-hidden px-6">
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="z-10 text-center space-y-8 reveal-on-scroll">
          <div className="relative group moai-spinner-container">
            <div className="text-[150px] md:text-[200px] leading-none select-none filter drop-shadow-2xl cursor-default moai-spinner">🗿</div>
            <div className="absolute -right-16 -top-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-lg transform rotate-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">"코드 꼬라지 하고는..."</p>
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500">
            CodeNose
          </h1>
          <p className="text-2xl md:text-3xl text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
            당신의 코드 냄새를 맡아드립니다.<br/>
            <span className="font-semibold text-gray-900 dark:text-white">어디가 문제인지 알려드릴게요.</span>
          </p>
          <div className="pt-10 animate-bounce">
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* Section 2: Input (The "Problem") */}
      <section className="min-h-screen flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10">
        <div className="flex-1 space-y-6 text-left reveal-on-scroll">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">일단 코드를<br/>채워 넣어보세요.</h2>
          <p className="text-xl text-gray-500 dark:text-gray-400">부끄러워 마세요. 그 스파게티 코드, 다 압니다. <br/>고도로 발달된 분석 엔진(과 모아이)이 평가할 준비가 되었습니다.</p>
        </div>
        <div className="flex-1 w-full reveal-on-scroll delay-200">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#1e1e1e] border border-gray-700">
            <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-gray-700 space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="p-6 font-mono text-sm text-gray-300 leading-relaxed overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-50 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
              <pre>{`function absolutelyTerribleCode(data) {
  var i = 0;
  for (i = 0; i < data.length; i++) {
    if (data[i] == 'bad') {
      console.log('found it');
      // deeply nested callback hell
      setTimeout(() => {
        // ... magic numbers
        if (i > 10) return false;
      }, 1000);
    }
  }
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The Scan (The "Features") */}
      <section className="min-h-screen flex flex-col md:flex-row-reverse items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10 bg-gray-50 dark:bg-gray-900/30 rounded-3xl my-20">
        <div className="flex-1 space-y-6 text-left reveal-on-scroll">
          <div className="text-blue-500 font-bold tracking-wide uppercase">Deep Scan</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">조용히 평가합니다.<br/>(때로는 신랄하게).</h2>
          <p className="text-xl text-gray-500 dark:text-gray-400">O(n!) 복잡도, SQL 인젝션 취약점,<br/>그리고 당신의 순수한 게으름까지 탐지합니다.</p>
          <ul className="space-y-3 mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 복잡도 분석</li>
            <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 리팩토링 제안</li>
            <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 보안 취약점 점검</li>
          </ul>
        </div>
        <div className="flex-1 w-full flex justify-center reveal-on-scroll delay-200">
          <div className="relative w-full max-w-md aspect-4/5 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col items-center justify-center p-8">
            <div className="animate-scan"></div>
            <div className="text-9xl mb-6 filter drop-shadow-xl">🗿</div>
            <div className="w-full space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto animate-pulse delay-100"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto animate-pulse delay-200"></div>
            </div>
            <div className="mt-8 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold animate-bounce">"경고: 반복문이 너무 많아!"</div>
          </div>
        </div>
      </section>

      {/* Section 4: Algorithm Intro - Bridge */}
      <section className="min-h-screen flex flex-col items-center justify-center w-full px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15 dark:opacity-10">
          <div className="absolute top-20 right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="reveal-on-scroll space-y-8 max-w-4xl mx-auto z-10">
          <div className="text-6xl md:text-8xl leading-none select-none filter drop-shadow-lg">
            🗿 → 🎄
          </div>
          <h2 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-pink-600">
            코드 분석을 넘어,<br/>
            <span className="text-green-600">당신만의 알고리즘 문제를.</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
            AI가 만든 문제로 실력을 키우고,<br/>
            집중 모드로 몰입하고,<br/>
            AI 피드백으로 성장하세요.
          </p>
          <div className="pt-6 animate-bounce">
            <svg className="w-8 h-8 mx-auto text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* Section 5: AI 문제 생성 */}
      <section className="min-h-screen flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10">
        <div className="flex-1 space-y-6 text-left reveal-on-scroll">
          <div className="text-purple-500 font-bold tracking-wide uppercase flex items-center gap-2">
            <span>🎅</span> AI Problem Generator
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            산타도 풀다 포기한<br/>
            <span className="text-purple-600">나만의 문제</span>를 만들어봐.
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            브론즈부터 플래티넘까지, 원하는 난이도와 알고리즘 유형을 선택하면<br/>
            AI가 즉시 새로운 문제를 생성합니다. <span className="text-purple-500 font-semibold">무한한 연습 기회!</span>
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">🥉 브론즈</span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">🥈 실버</span>
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">🥇 골드</span>
            <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-medium">💎 플래티넘</span>
          </div>
        </div>
        <div className="flex-1 w-full reveal-on-scroll delay-200">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center mb-6">
              <span className="text-6xl">🎄</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">시즌 스토리 테마</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-3 transform hover:scale-102 transition-transform">
                <span className="text-2xl">🎅</span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">산타의 선물 배달</p>
                  <p className="text-xs text-gray-500">경로 최적화, 굴뚝 탐색</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-3 transform hover:scale-102 transition-transform">
                <span className="text-2xl">⛄</span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">눈싸움 대작전</p>
                  <p className="text-xs text-gray-500">눈덩이 전략, 진영 구축</p>
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-3 transform hover:scale-102 transition-transform">
                <span className="text-2xl">🎄</span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">크리스마스 트리 장식</p>
                  <p className="text-xs text-gray-500">장식 배치, 전구 연결</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">* 계절마다 새로운 테마가 추가됩니다!</p>
          </div>
        </div>
      </section>

      {/* Section 6: 시선 추적 & 집중 모드 */}
      <section className="min-h-screen flex flex-col md:flex-row-reverse items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-3xl my-20">
        <div className="flex-1 space-y-6 text-left reveal-on-scroll">
          <div className="text-indigo-500 font-bold tracking-wide uppercase flex items-center gap-2">
            <span>👁️</span> Focus Mode
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            집중하고 있니?<br/>
            <span className="text-indigo-600">내가 보고 있어.</span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            시선 추적 기술로 당신의 집중도를 실시간 모니터링.<br/>
            화면 이탈, 졸음, 다른 탭 전환까지 모두 감지합니다.
          </p>
          <ul className="space-y-3 mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2"><span className="text-indigo-500">👀</span> 시선 이탈 감지</li>
            <li className="flex items-center gap-2"><span className="text-indigo-500">😴</span> 졸음 감지 (PERCLOS)</li>
            <li className="flex items-center gap-2"><span className="text-indigo-500">👥</span> 다중 인물 감지</li>
            <li className="flex items-center gap-2"><span className="text-indigo-500">🖥️</span> 전체화면 이탈 감지</li>
          </ul>
        </div>
        <div className="flex-1 w-full flex justify-center reveal-on-scroll delay-200">
          <div className="relative w-full max-w-md aspect-square bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-700 overflow-hidden flex flex-col items-center justify-center p-8">
            {/* Animated scan line */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent animate-pulse"></div>

            {/* Eye tracking visualization */}
            <div className="relative">
              <div className="text-8xl mb-4 animate-pulse">👁️</div>
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
            </div>

            {/* Focus gauge */}
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>집중도</span>
                <span className="text-green-400">87%</span>
              </div>
              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{width: '87%'}}></div>
              </div>
            </div>

            {/* Warning badges */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">✓ 시선 정상</span>
              <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">✓ 전체화면</span>
              <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">✓ 깨어있음</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: 학습 모드 */}
      <section className="min-h-screen flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10">
        <div className="flex-1 space-y-6 text-left reveal-on-scroll">
          <div className="text-green-500 font-bold tracking-wide uppercase flex items-center gap-2">
            <span>🎓</span> Learn Mode
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            막히면 물어봐.<br/>
            <span className="text-green-600">AI 튜터가 옆에 있어.</span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            학습 모드에서는 AI 튜터가 실시간으로 힌트를 제공합니다.<br/>
            정답을 알려주지 않고, <span className="text-green-500 font-semibold">스스로 해결할 수 있도록</span> 도와줘요.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>💡</span> 단계별 힌트
            </div>
            <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>🤔</span> 질문하기
            </div>
            <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>📝</span> 연습 전용
            </div>
          </div>
        </div>
        <div className="flex-1 w-full reveal-on-scroll delay-200">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {/* Chat-like interface mockup */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">AI 튜터</span>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">온라인</span>
            </div>
            <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">나</div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 max-w-xs">
                  <p className="text-sm text-gray-800 dark:text-gray-200">이 문제에서 어떤 자료구조를 써야 할지 모르겠어요...</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 max-w-xs">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    좋은 질문이에요! 🎄<br/><br/>
                    힌트: 이 문제에서 <span className="font-semibold">중복을 제거</span>하면서 <span className="font-semibold">순서를 유지</span>해야 해요.<br/><br/>
                    어떤 자료구조가 이 두 가지를 모두 만족할까요?
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">🤖</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: AI 피드백 */}
      <section className="min-h-screen flex flex-col md:flex-row-reverse items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl my-20">
        <div className="flex-1 space-y-6 text-left reveal-on-scroll">
          <div className="text-amber-500 font-bold tracking-wide uppercase flex items-center gap-2">
            <span>🤖</span> AI Feedback
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            제출하면 끝?<br/>
            <span className="text-amber-600">아니, 시작이야.</span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            코드를 제출하면 AI가 꼼꼼하게 분석합니다.<br/>
            시간복잡도, 공간복잡도, 코드 스타일, 개선점까지.
          </p>
          <ul className="space-y-3 mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2"><span className="text-amber-500">⚡</span> 시간/공간 복잡도 분석</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">🎯</span> 코드 개선 제안</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">📊</span> AI 점수 (0-100)</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">🐙</span> GitHub 자동 커밋</li>
          </ul>
        </div>
        <div className="flex-1 w-full flex justify-center reveal-on-scroll delay-200">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-bold text-lg">Accepted!</p>
                  <p className="text-green-100 text-sm">테스트 5/5 통과</p>
                </div>
              </div>
            </div>

            {/* AI Score */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">AI 점수</span>
                <span className="text-2xl font-bold text-amber-500">92/100</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{width: '92%'}}></div>
              </div>
            </div>

            {/* Feedback preview */}
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">시간복잡도</span>: O(n log n) - 효율적입니다!</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500">💡</span>
                <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">개선점</span>: 변수명을 더 명확하게 지으면 좋겠어요.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-500">🚀</span>
                <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">다음 단계</span>: 메모이제이션을 적용해보세요!</p>
              </div>
            </div>

            {/* XP Badge */}
            <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <span className="text-purple-700 dark:text-purple-300 font-semibold">첫 정답 보너스!</span>
                </div>
                <span className="text-purple-600 dark:text-purple-400 font-bold">+150 XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Final CTA */}
      <section className="min-h-screen flex flex-col items-center justify-center w-full px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="reveal-on-scroll space-y-6 max-w-4xl mx-auto z-10">
          <div className="text-8xl md:text-9xl leading-none select-none filter drop-shadow-2xl mb-4">
            🗿
          </div>
          <h2 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-purple-600 to-pink-600">
            준비됐어?
          </h2>
          <p className="text-2xl text-gray-600 dark:text-gray-300">
            코드 분석부터 알고리즘 마스터까지.<br/>
            <span className="font-semibold text-purple-600 dark:text-purple-400">모아이가 지켜보고 있다.</span>
          </p>
          <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/codeAnalysis/new" className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl rounded-full font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center">
              <span>🔍 코드 분석 시작</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link to="/algorithm/generate" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl rounded-full font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center">
              <span>🎄 AI 문제 생성</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <Link to="/algorithm" className="inline-block mt-4 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            또는 문제 목록 둘러보기 →
          </Link>
          <p className="mt-8 text-sm text-gray-400">* 모아이로 인한 정신적 피해는 보험 적용이 안 됩니다. 🗿</p>
        </div>
      </section>
    </div>
  );
}
