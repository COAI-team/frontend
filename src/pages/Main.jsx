import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../context/useLogin";
import axiosInstance from "../server/AxiosConfig";
import { useTheme } from "next-themes";

export default function Main() {
  const { theme } = useTheme();
  const { user } = useLogin();
  const navigate = useNavigate();

  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 인기 게시글 가져오기 (로그인 시)
  useEffect(() => {
    if (user) {
      fetchPopularPosts();
    }
  }, [user]);

  const fetchPopularPosts = async () => {
    try {
      setLoading(true);
      // 조회수 순으로 정렬하여 상위 6개 가져오기
      const response = await axiosInstance.get("/freeboard/list", {
        params: {
          page: 1,
          size: 6,
          sort: "views", 
        },
      });
      setPopularPosts(response.data.content || []);
    } catch (error) {
      console.error("인기 게시글 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // --- Components ---

  // --- Components ---

  // Custom Hook for Scroll Reveal
  const useScrollReveal = () => {
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        { threshold: 0.2, rootMargin: "0px 0px -50px 0px" } // Trigger slightly before element is effectively visible
      );

      const elements = document.querySelectorAll(".reveal-on-scroll");
      elements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, []);
  };

  // 1. Guest Landing Page (Apple-Style Scroll)
  const GuestLandingPage = () => {
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
             {/* Moai & Title */}
            <div className="relative group moai-spinner-container">
              <div className="text-[150px] md:text-[200px] leading-none select-none filter drop-shadow-2xl cursor-default moai-spinner">
                🗿
              </div>
              <div className="absolute -right-16 -top-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-lg transform rotate-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">"코드 꼬라지 하고는..."</p>
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500">
              CodeNose
            </h1>
            <p className="text-2xl md:text-3xl text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
              Your code smells.<br/>
              <span className="font-semibold text-gray-900 dark:text-white">We tell you where.</span>
            </p>
            
            <div className="pt-10 animate-bounce">
              <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            </div>
          </div>
        </section>

        {/* Section 2: Input (The "Problem") */}
        <section className="min-h-screen flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10">
          <div className="flex-1 space-y-6 text-left reveal-on-scroll">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              It puts the code<br/>in the box.
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Don't be shy. Paste your spaghetti code. <br/>
              Our advanced analysis engine (and the Moai) is ready to judge.
            </p>
          </div>
          <div className="flex-1 w-full reveal-on-scroll delay-200">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#1e1e1e] border border-gray-700">
              <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-gray-700 space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-6 font-mono text-sm text-gray-300 leading-relaxed overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
                <pre>
{`function absolutelyTerribleCode(data) {
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
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: The Scan (The "Features") */}
        <section className="min-h-screen flex flex-col md:flex-row-reverse items-center justify-center w-full max-w-7xl mx-auto px-6 py-20 gap-10 bg-gray-50 dark:bg-gray-900/30 rounded-3xl my-20">
          <div className="flex-1 space-y-6 text-left reveal-on-scroll">
            <div className="text-blue-500 font-bold tracking-wide uppercase">Deep Scan</div>
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              We judge it silently.<br/>(And loudly).
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Detects O(n!) complexity, SQL Injection vulnerabilities,<br/>
              and pure laziness.
            </p>
            <ul className="space-y-3 mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
              <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Complexity Analysis</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Refactoring Suggestions</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Security Vulnerabilities</li>
            </ul>
          </div>
          <div className="flex-1 w-full flex justify-center reveal-on-scroll delay-200">
             <div className="relative w-full max-w-md aspect-[4/5] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col items-center justify-center p-8">
                {/* Scan Animation */}
                <div className="animate-scan"></div>
                
                <div className="text-9xl mb-6 filter drop-shadow-xl">🗿</div>
                <div className="w-full space-y-3">
                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto animate-pulse delay-100"></div>
                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto animate-pulse delay-200"></div>
                </div>
                <div className="mt-8 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold animate-bounce">
                  "CRITICAL: Too many loops!"
                </div>
             </div>
          </div>
        </section>

        {/* Section 4: Result (The "Value") & CTA */}
        <section className="min-h-screen flex flex-col items-center justify-center w-full px-6 py-20 text-center">
          <div className="reveal-on-scroll space-y-6 max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Get the Truth.
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-300">
              Stop guessing. Start refactoring.
            </p>
            
            <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/codeAnalysis/new" className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl rounded-full font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center">
                <span>Start Analyzing</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link to="/algorithm" className="px-8 py-4 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xl rounded-full font-bold transition-all flex items-center justify-center">
                <span>Check Algorithms</span>
              </Link>
            </div>
             <p className="mt-6 text-sm text-gray-400">
               * Emotional damage from Moai is not covered by insurance.
             </p>
          </div>
        </section>
      </div>
    );
  };

  // 2. 대시보드 섹션 (Logged In)
  const DashboardSection = () => (
    <section className="w-full max-w-7xl mx-auto px-4 py-10 space-y-12">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <div className="text-6xl filter drop-shadow-md">🗿</div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              환영합니다, <span className="text-blue-600 dark:text-blue-400">{user.nickname || "개발자"}</span>님.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              오늘도 <span className="line-through opacity-50">스파게티</span> 코드를 요리하고 계신가요?
            </p>
          </div>
        </div>
        <div className="flex space-x-4 mt-6 md:mt-0">
          <Link to="/codeAnalysis/new" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/30">
            분석 요청
          </Link>
          <Link to="/freeboard/write" className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors">
            글쓰기
          </Link>
        </div>
      </div>

      {/* Popular Posts */}
      <div className="space-y-6">
        <div className="flex items-end justify-between border-b pb-4 border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🔥 지금 핫한 망한 코드들</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              다른 사람들의 고통을 즐겨보세요. (인기 게시글)
            </p>
          </div>
          <Link to="/freeboard/list" className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center">
            전체보기
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : popularPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <div className="text-4xl mb-4">🍃</div>
            <p>아직 핫한 글이 없네요. 첫 번째 장작을 넣어주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularPosts.map((post) => (
              <div 
                key={post.freeboardId} 
                onClick={() => navigate(`/freeboard/${post.freeboardId}`)}
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {post.category || "자유"}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(post.freeboardCreatedAt)}</span>
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1 group-hover:text-blue-500 transition-colors">
                  {post.freeboardTitle}
                </h4>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-6 h-10">
                   {post.freeboardSummary || "내용이 없습니다. 제목이 곧 내용인 상남자 스타일."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-2 text-xs">
                      {post.userNickname?.charAt(0) || "U"}
                    </div>
                    {post.userNickname}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    <span className="flex items-center"><span className="mr-1">👀</span> {post.freeboardClick}</span>
                    <span className="flex items-center text-red-400"><span className="mr-1">♥</span> {post.likeCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <main className={`min-h-screen transition-colors duration-300 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#0a0a0a]'}`}>
      <div className="w-full h-full flex flex-col items-center">
        {user ? <DashboardSection /> : <GuestLandingPage />}
      </div>
    </main>
  );
}