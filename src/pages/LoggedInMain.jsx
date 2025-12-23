import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
    FaChartLine,
    FaArrowRight,
    FaFire,
    FaCrown,
    FaRegSmileBeam,
    FaBrain,
    FaLaptopCode,
    FaSearch,
    FaCheck,
    FaNetworkWired
} from "react-icons/fa";
import { getUserLevel, getTodayMissions, MISSION_TYPE_INFO, ALGO_LEVEL_INFO } from "../service/algorithm/AlgorithmApi";

// 레벨별 이미지 경로 매핑
const LEVEL_IMAGES = {
    EMERALD: '/LevelImg/emerald.png',
    SAPPHIRE: '/LevelImg/sapphire.png',
    RUBY: '/LevelImg/ruby.png',
    DIAMOND: '/LevelImg/diamond.png'
};

export default function LoggedInMain({ user, userStats, popularPosts, loading, onPostClick }) {
    // 사용자 레벨 및 미션 상태
    const [userLevel, setUserLevel] = useState(null);
    const [missions, setMissions] = useState([]);
    const [missionLoading, setMissionLoading] = useState(true);
    const navigate = useNavigate();
    const [expandedExp, setExpandedExp] = useState(false);
    const [currentBoardType, setCurrentBoardType] = useState('free');

    // 5초마다 자유 ↔ 코드 자동 전환
    useEffect(() => {
        if (popularPosts.length === 0) return;
        
        const timer = setInterval(() => {
            setCurrentBoardType(prev => prev === 'free' ? 'code' : 'free');
        }, 5000);
        
        return () => clearInterval(timer);
    }, [popularPosts.length]);

    const currentBoardPosts = popularPosts.filter(
        post => post.type === currentBoardType
    );

    // 데이터 로딩
    const loadUserData = useCallback(async () => {
        if (!user?.userId) {
            setMissionLoading(false);
            return;
        }

        try {
            setMissionLoading(true);
            const [levelResult, missionsResult] = await Promise.all([
                getUserLevel(user.userId),
                getTodayMissions(user.userId)
            ]);

            if (!levelResult.error && levelResult.data) {
                setUserLevel(levelResult.data);
            }

            if (!missionsResult.error && missionsResult.data) {
                setMissions(missionsResult.data);
            }
        } catch (err) {
            console.error('LoggedInMain 데이터 로딩 실패:', err);
        } finally {
            setMissionLoading(false);
        }
    }, [user?.userId]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    // 미션 진행률 계산
    const completedCount = missions.filter(m => m.completed).length;
    const totalMissions = missions.length;

    // 미션 클릭 핸들러
    const handleMissionClick = (mission) => {
        if (mission.completed) return;

        const typeInfo = MISSION_TYPE_INFO[mission.missionType];
        if (mission.missionType === 'PROBLEM_GENERATE') {
            navigate(typeInfo.link);
        } else if (mission.missionType === 'PROBLEM_SOLVE' && mission.problemId) {
            navigate(`${typeInfo.linkPrefix}${mission.problemId}`);
        }
    };

    // 시간대별 환영 메시지
    const getTimeBasedGreeting = (name) => {
        const hour = new Date().getHours();
        const displayName = name || "Master Coder";

        if (hour >= 6 && hour < 12) {
            return {
                greeting: "좋은 아침입니다,",
                message: `오늘 첫 번째 로직 설계로 성장의 발판을 마련해 보세요. 🚀`,
                name: displayName
            };
        } else if (hour >= 12 && hour < 18) {
            return {
                greeting: "나른한 오후를 깨우는 도전!",
                message: `더 효율적인 코드를 향한 한계에 도전해 볼까요?`,
                name: displayName
            };
        } else if (hour >= 18 && hour < 24) {
            return {
                greeting: "오늘의 노력은 기록으로 남습니다.",
                message: `오늘 분석한 코드가 내일의 강력한 무기가 될 거예요.`,
                name: displayName
            };
        } else {
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
        <div className="w-full min-h-screen font-sans overflow-hidden bg-white dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-100 relative selection:bg-indigo-500 selection:text-white">
            
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
                        <div className="px-4 py-3 bg-white/80 dark:bg-white/5 rounded-2xl backdrop-blur-md border border-white/40 dark:border-transparent shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center gap-3 min-w-[100px]">
                            {userLevel?.algoLevel && LEVEL_IMAGES[userLevel.algoLevel] && (
                                <img
                                    src={LEVEL_IMAGES[userLevel.algoLevel]}
                                    alt={userLevel.algoLevel}
                                    className="w-10 h-10 object-contain"
                                />
                            )}
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-slate-400 font-bold uppercase">Level</span>
                                <span className="text-xl font-bold text-slate-800 dark:text-white">
                                    {ALGO_LEVEL_INFO[userLevel?.algoLevel]?.name || userStats?.level?.rankName || "Newbie"}
                                </span>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-white/80 dark:bg-white/5 rounded-2xl backdrop-blur-md border border-white/40 dark:border-transparent shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col items-center min-w-[100px]">
                            <span className="text-xs text-slate-400 font-bold uppercase">EXP</span>
                            <span className="text-xl font-bold text-indigo-500">
                                {(userLevel?.totalXp ?? userStats?.exp ?? 0).toLocaleString()}
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
                    {/* Block A: Command Center */}
                    <motion.div variants={item} className="col-span-1 md:col-span-2 row-span-2 relative rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-[#111] shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        
                        <div className="p-6 pb-2">
                             <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                <FaLaptopCode className="text-indigo-500"/> 바로 시작하기
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
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 mb-1 transition-colors">AI 코드 분석</h3>
                                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium group-hover:text-indigo-500/80 dark:group-hover:text-indigo-300/80">버그와 코드 스멜, AI가 찾아드립니다</p>
                                    </div>
                                </div>
                                <div className="relative z-10 w-12 h-12 rounded-full border-2 border-indigo-200 dark:border-indigo-700 flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white transition-all">
                                    <FaArrowRight className="text-indigo-400 group-hover:text-white"/>
                                </div>
                                <div className="absolute inset-0 bg-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>
                            </Link>

                            {/* Action 2: Algorithm Practice */}
                             <Link to="/algorithm" className="group relative flex items-center justify-between p-6 m-4 mt-0 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/20 hover:bg-white hover:border-emerald-300 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg">
                                <div className="relative z-10 flex gap-5 items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-emerald-900 text-emerald-500 flex items-center justify-center text-3xl shadow-md group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                        <FaBrain />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 mb-1 transition-colors">알고리즘 풀이</h3>
                                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium group-hover:text-emerald-500/80 dark:group-hover:text-emerald-300/80">AI가 만든 문제로 실력 UP</p>
                                    </div>
                                </div>
                                <div className="relative z-10 w-12 h-12 rounded-full border-2 border-emerald-200 dark:border-emerald-700 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all">
                                    <FaArrowRight className="text-emerald-400 group-hover:text-white"/>
                                </div>
                                <div className="absolute inset-0 bg-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Block B: MCP Intro */}
                    <motion.div variants={item} className="col-span-1 row-span-1 relative rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                        <Link to="/mypage/profile" className="absolute inset-0 z-20"></Link>
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FaNetworkWired className="text-8xl text-slate-900 dark:text-white transform rotate-12"/>
                        </div>
                        
                        <div className="relative z-10">
                            <div className="p-3 w-fit bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                                <FaNetworkWired className="text-xl" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">MCP Service</h3>
                            <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                Connect
                            </div>
                            <div className="mt-2 text-xs font-semibold text-blue-500 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 w-fit px-2 py-1 rounded-lg">
                                <FaArrowRight className="-rotate-45"/> Model Context Protocol
                            </div>
                        </div>
                    </motion.div>

                    {/* Block C: Daily Mission */}
                    <motion.div variants={item} className="col-span-1 row-span-1 relative rounded-[2.5rem] overflow-hidden shadow-lg bg-gradient-to-br from-indigo-500 to-blue-600">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 pointer-events-none"></div>

                        <div className="relative z-10 p-6 h-full flex flex-col text-white">
                            {/* 헤더 + 진행률 바 */}
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                                            <FaFire className="text-sm text-yellow-300" />
                                        </div>
                                        <span className="text-xs font-bold">DAILY MISSION</span>
                                    </div>
                                    <span className="text-xs font-medium opacity-80">{completedCount}/{totalMissions}</span>
                                </div>
                                {/* 진행률 바 */}
                                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-yellow-400 h-full transition-all duration-500"
                                        style={{ width: totalMissions > 0 ? `${(completedCount / totalMissions) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>

                            {missionLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {/* 미션 목록 */}
                                    <div className="space-y-2 flex-1 overflow-y-auto">
                                        {missions.length === 0 ? (
                                            <div className="text-xs opacity-70 text-center py-4">오늘의 미션이 없습니다</div>
                                        ) : (
                                            missions.map((mission, idx) => {
                                                const typeInfo = MISSION_TYPE_INFO[mission.missionType] || {};
                                                return (
                                                    <div
                                                        key={mission.missionId || idx}
                                                        onClick={() => handleMissionClick(mission)}
                                                        className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                                                            mission.completed
                                                                ? 'bg-white/10 opacity-60 cursor-default'
                                                                : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                                                        }`}
                                                    >
                                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                                                            mission.completed ? 'bg-green-400/40' : 'bg-white/20'
                                                        }`}>
                                                            {mission.completed ? <FaCheck className="text-[10px]" /> : typeInfo.icon?.charAt(0) || '📋'}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className={`text-xs font-medium truncate block ${mission.completed ? 'line-through' : ''}`}>
                                                                {typeInfo.name || mission.missionType}
                                                            </span>
                                                            {mission.problemTitle && (
                                                                <span className="text-[10px] opacity-70 truncate block">{mission.problemTitle}</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${mission.completed ? 'text-green-300' : 'text-yellow-300'}`}>
                                                            +{mission.rewardPoints}P
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Block D: Community News */}
                    <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 relative rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-[#111] p-4 pb-3 shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col pt-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                주간 인기글
                            </h3>
                            <div className="flex gap-1.5">
                                <Link 
                                    to="/freeboard" 
                                    className={`text-[10px] font-semibold transition-colors ${
                                        currentBoardType === 'free' 
                                        ? 'text-indigo-600 dark:text-indigo-400' 
                                        : 'text-slate-400 hover:text-indigo-500'
                                    }`}
                                >
                                    자유게시판
                                </Link>
                                <span className="text-slate-300 dark:text-slate-700 text-[10px]">|</span>
                                <Link 
                                    to="/codeboard" 
                                    className={`text-[10px] font-semibold transition-colors ${
                                        currentBoardType === 'code' 
                                        ? 'text-emerald-600 dark:text-emerald-400' 
                                        : 'text-slate-400 hover:text-emerald-500'
                                    }`}
                                >
                                    코드게시판
                                </Link>
                            </div>
                        </div>

                        {/* Slider Container */}
                        <div className="relative">
                            {loading ? (
                                <div className="w-full h-32 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                                </div>
                            ) : currentBoardPosts.length > 0 ? (
                                <div className="relative group">
                                    {/* Navigation Buttons */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentBoardType(currentBoardType === 'free' ? 'code' : 'free');
                                        }}
                                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="이전 게시판"
                                    >
                                        <svg className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentBoardType(currentBoardType === 'free' ? 'code' : 'free');
                                        }}
                                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="다음 게시판"
                                    >
                                        <svg className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Content List */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentBoardType}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4 }}
                                            className="flex flex-col gap-2"
                                        >
                                            {currentBoardPosts.slice(0, 3).map((post, idx) => (
                                                <div
                                                    key={post.id}
                                                    onClick={() => onPostClick(post)}
                                                    className="p-2 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {/* Ranking Badge */}
                                                        <div className="flex items-center justify-center w-5 h-5 rounded bg-yellow-500/20 dark:bg-yellow-900/30 flex-shrink-0 mt-0.5">
                                                            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                                                                {idx + 1}
                                                            </span>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Title + Date */}
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-1 min-w-0">
                                                                    {post.title}
                                                                </h4>
                                                                <span className="text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                                                                    {new Date(post.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>

                                                            {/* Content Preview */}
                                                            <p className="text-[9px] text-slate-600 dark:text-slate-400 line-clamp-1 mb-0.5 leading-relaxed">
                                                                {post.plainText && post.plainText !== '내용 없음'
                                                                    ? (post.plainText.length > 50 
                                                                        ? post.plainText.substring(0, 50) + '...' 
                                                                        : post.plainText)
                                                                    : '내용이 없습니다'}
                                                            </p>

                                                            {/* Footer: Author + Stats */}
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[7px] font-bold">
                                                                        {post.author?.[0]?.toUpperCase() || "?"}
                                                                    </div>
                                                                    <span className="text-[8px] text-slate-600 dark:text-slate-400">
                                                                        {post.author}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-500">
                                                                    <span className="flex items-center gap-0.5">
                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                        {post.views || 0}
                                                                    </span>
                                                                    <span className="flex items-center gap-0.5">
                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                        </svg>
                                                                        {post.likes || 0}
                                                                    </span>
                                                                    <span className="flex items-center gap-0.5">
                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                        </svg>
                                                                        {post.comments || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right: Image */}
                                                        {post.image && (
                                                            <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                                                                <img 
                                                                    src={post.image} 
                                                                    alt={post.title}
                                                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Progress Indicator */}
                                    <div className="flex justify-center gap-1.5 mt-2">
                                        <button
                                            onClick={() => setCurrentBoardType('free')}
                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                currentBoardType === 'free' 
                                                ? 'w-6 bg-indigo-500' 
                                                : 'w-1 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                                            }`}
                                            aria-label="자유게시판으로 이동"
                                        />
                                        <button
                                            onClick={() => setCurrentBoardType('code')}
                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                currentBoardType === 'code' 
                                                ? 'w-6 bg-emerald-500' 
                                                : 'w-1 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                                            }`}
                                            aria-label="코드게시판으로 이동"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-32 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                    <svg className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="text-xs font-medium">아직 인기글이 없습니다</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
}