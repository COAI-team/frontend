import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
    FaChartLine, 
    FaArrowRight, 
    FaFire,
    FaCrown,
    FaRegSmileBeam,
    FaBrain,
    FaLaptopCode,
    FaSearch
} from "react-icons/fa";

export default function LoggedInMain({ user, userStats, popularPosts, loading, onPostClick }) {
    // 시간대별 환영 메시지
    const getTimeBasedGreeting = (name) => {
        const hour = new Date().getHours();
        const displayName = name || "Master Coder";

        if (hour >= 6 && hour < 12) {
            // 오전 (06~12시)
            return {
                greeting: "좋은 아침입니다,",
                message: `오늘 첫 번째 로직 설계로 성장의 발판을 마련해 보세요. 🚀`,
                name: displayName
            };
        } else if (hour >= 12 && hour < 18) {
            // 오후 (12~18시)
            return {
                greeting: "나른한 오후를 깨우는 도전!",
                message: `더 효율적인 코드를 향한 한계에 도전해 볼까요?`,
                name: displayName
            };
        } else if (hour >= 18 && hour < 24) {
            // 저녁 (18~00시)
            return {
                greeting: "오늘의 노력은 기록으로 남습니다.",
                message: `오늘 분석한 코드가 내일의 강력한 무기가 될 거예요.`,
                name: displayName
            };
        } else {
            // 심야 (00~06시)
            return {
                greeting: "모두가 멈춘 시간,",
                message: `이 고요한 몰입이 당신을 특별한 개발자로 만듭니다.`,
                name: displayName,
                suffix: "은 나아가고 있군요."
            };
        }
    };

    const greetingData = getTimeBasedGreeting(user?.nickname);

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0, scale: 0.95 },
        show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 50 } }
    };

    // News Ticker Logic
    const [newsIndex, setNewsIndex] = useState(0);

    useEffect(() => {
        if (!popularPosts || popularPosts.length === 0) return;
        const interval = setInterval(() => {
            setNewsIndex((prev) => (prev + 1) % Math.min(popularPosts.length, 5));
        }, 5000);
        return () => clearInterval(interval);
    }, [popularPosts]);

    const currentPost = popularPosts && popularPosts.length > 0 ? popularPosts[newsIndex] : null;

    return (
        <div className="w-full min-h-screen font-sans overflow-hidden bg-[#F1F5F9] dark:bg-[#050505] text-slate-800 dark:text-slate-100 relative selection:bg-indigo-500 selection:text-white">
            
            {/* 1. Enhanced Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-fuchsia-900/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '3s'}}></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-cyan-400/10 dark:bg-cyan-900/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '5s'}}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 lg:py-16">
                {/* 2. Header / Greeting with Daily Stats */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-10 flex flex-col lg:flex-row items-end justify-between gap-6"
                >
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {greetingData.greeting} <br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-sm">
                                {greetingData.name}
                            </span>
                            <span className="text-slate-900 dark:text-white">님{greetingData.suffix || ""}</span>
                            <p className="text-base md:text-lg font-medium text-slate-600 dark:text-slate-400 mt-3">
                                {greetingData.message}
                            </p>
                        </h1>
                    </div>
                    
                    {/* Quick Stats Overlay (Real Data) */}
                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-white/80 dark:bg-white/5 rounded-2xl backdrop-blur-md border border-white/40 dark:border-white/20 shadow-lg flex flex-col items-center min-w-[100px]">
                            <span className="text-xs text-slate-400 font-bold uppercase">Rank</span>
                            <span className="text-xl font-bold text-slate-800 dark:text-white">
                                {userStats?.level?.rankName || "Newbie"}
                            </span>
                        </div>
                        <div className="px-6 py-3 bg-white/80 dark:bg-white/5 rounded-2xl backdrop-blur-md border border-white/40 dark:border-white/20 shadow-lg flex flex-col items-center min-w-[100px]">
                            <span className="text-xs text-slate-400 font-bold uppercase">EXP</span>
                            <span className="text-xl font-bold text-indigo-500">
                                {userStats?.exp?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Bento Grid Layout */}
                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-5 lg:gap-6 h-auto md:h-[600px]"
                >
                    {/* Block A: Command Center (Main Action Hub) - Spans 2 cols, 2 rows */}
                    <motion.div variants={item} className="col-span-1 md:col-span-2 row-span-2 relative rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        
                        <div className="p-6 pb-2">
                             <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                <FaLaptopCode className="text-indigo-500"/> Creation Hub
                             </h2>
                        </div>

                        {/* Split Action Area */}
                        <div className="flex-1 grid grid-rows-2 h-full">
                            
                            {/* Action 1: Code Analysis */}
                            <Link to="/codeAnalysis/new" className="group relative flex items-center justify-between p-6 m-4 mt-0 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20 hover:bg-white hover:border-indigo-300 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-500/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg">
                                <div className="relative z-10 flex gap-5 items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-indigo-900 text-indigo-500 flex items-center justify-center text-3xl shadow-md group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                        <FaSearch />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 mb-1 transition-colors">AI Code Analysis</h3>
                                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium group-hover:text-indigo-500/80 dark:group-hover:text-indigo-300/80">Deep scan for bugs & smells</p>
                                    </div>
                                </div>
                                <div className="relative z-10 w-12 h-12 rounded-full border-2 border-indigo-200 dark:border-indigo-700 flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white transition-all">
                                    <FaArrowRight className="text-indigo-400 group-hover:text-white"/>
                                </div>
                                {/* Hover Effect Background - lighter */}
                                <div className="absolute inset-0 bg-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>
                            </Link>

                            {/* Action 2: Algorithm Practice */}
                             <Link to="/algorithm" className="group relative flex items-center justify-between p-6 m-4 mt-0 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/20 hover:bg-white hover:border-emerald-300 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg">
                                <div className="relative z-10 flex gap-5 items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-emerald-900 text-emerald-500 flex items-center justify-center text-3xl shadow-md group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                        <FaBrain />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 mb-1 transition-colors">Algorithm Arena</h3>
                                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium group-hover:text-emerald-500/80 dark:group-hover:text-emerald-300/80">Solve problems & Rank up</p>
                                    </div>
                                </div>
                                <div className="relative z-10 w-12 h-12 rounded-full border-2 border-emerald-200 dark:border-emerald-700 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all">
                                    <FaArrowRight className="text-emerald-400 group-hover:text-white"/>
                                </div>
                                {/* Hover Effect Background - lighter */}
                                <div className="absolute inset-0 bg-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Block B: Performance Stat (KPI) - Spans 1 col */}
                    <motion.div variants={item} className="col-span-1 row-span-1 relative rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                        <Link to="/mypage/dashboard" className="absolute inset-0 z-20"></Link>
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FaChartLine className="text-8xl text-slate-900 dark:text-white transform rotate-12"/>
                        </div>
                        
                        <div className="relative z-10">
                            <div className="p-3 w-fit bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                                <FaCrown className="text-xl" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Solved</h3>
                            <div className="text-5xl font-extrabold text-slate-900 dark:text-white">
                                {userStats?.totalSolved || 0}
                            </div>
                            <div className="mt-2 text-xs font-semibold text-green-500 flex items-center gap-1 bg-green-50 dark:bg-green-900/30 w-fit px-2 py-1 rounded-lg">
                                <FaArrowRight className="rotate-[-45deg]"/> Problems
                            </div>
                        </div>
                    </motion.div>

                    {/* Block C: Streak / Goals - Spans 1 col */}
                    <motion.div variants={item} className="col-span-1 row-span-1 relative rounded-[2.5rem] overflow-hidden shadow-lg group bg-gradient-to-br from-indigo-500 to-blue-600">
                        <Link to="/mypage/daily-mission" className="absolute inset-0 z-20"></Link>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30"></div>
                        
                        <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                    <FaFire className="text-xl text-yellow-300" />
                                </div>
                                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">WEEKLY GOAL</span>
                            </div>
                            <div>
                                <div className="text-4xl font-black mb-1">12 <span className="text-lg font-medium opacity-80">problems</span></div>
                                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-400 h-full w-[70%]"></div>
                                </div>
                                <p className="text-xs mt-2 opacity-80">You're on fire! Keep going.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Block D: Community News - Spans 2 cols, 1 row */}
                    <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 relative rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 shadow-lg flex flex-col">
                        <div className="flex items-center justify-between mb-4 px-2">
                             <h3 className="text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Updates
                             </h3>
                             <Link to="/freeboard" className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors">View All</Link>
                        </div>

                        {/* Slider Container */}
                        <div className="flex-1 relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-700/50">
                             {loading ? (
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                             ) : currentPost ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentPost.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.5 }}
                                        onClick={() => onPostClick(currentPost)}
                                        className="absolute inset-0 p-6 flex flex-col justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                                                currentPost.type === 'code' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {currentPost.type === 'code' ? 'Codeboard' : 'Freeboard'}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(currentPost.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-2">
                                            {currentPost.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-[10px] flex items-center justify-center font-bold text-indigo-600">
                                                    {currentPost.author?.[0] || "U"}
                                                </div>
                                                <span className="font-medium">{currentPost.author || "User"}</span>
                                            </div>
                                            <span className="flex items-center gap-1"><FaRegSmileBeam/> {currentPost.views} views</span>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    No updates available.
                                </div>
                             )}
                        </div>
                        {/* Progress Indicator */}
                        <div className="flex justify-center gap-1 mt-3">
                            {popularPosts.slice(0, 5).map((_, idx) => (
                                <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === newsIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
}
