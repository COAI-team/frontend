import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../server/AxiosConfig';
import { getSmellKeyword, getScoreBadgeColor } from '../../utils/codeAnalysisUtils';
import { useLogin } from '../../context/login/useLogin';
import WordCloudChart from '../../components/charts/WordCloudChart';
import "./css/dashboard.css";

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useLogin();
    const [patterns, setPatterns] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [trends, setTrends] = useState({ data: [], patterns: [] });
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
    const [selectedPattern, setSelectedPattern] = useState(null);
    const [patternDetails, setPatternDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [wordCloudData, setWordCloudData] = useState([]);
    
    const [showMistakeAlert, setShowMistakeAlert] = useState(false);
    
    const userId = user?.userId;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const patternsResponse = await axiosInstance.get(`/api/insights/patterns/${userId}`);
                const historyResponse = await axiosInstance.get(`/api/insights/history/${userId}`);
                const trendsResponse = await axiosInstance.get(`/api/insights/trends/${userId}`);
                
                // [NEW] Check Mistake Alert Status
                const statusResponse = await axiosInstance.get(`/api/mistakes/status/${userId}`);
                setShowMistakeAlert(statusResponse.data);

                setPatterns(Array.isArray(patternsResponse.data) ? patternsResponse.data : []);
                setHistory(Array.isArray(historyResponse.data) ? historyResponse.data : []);
                setTrends({
                    data: Array.isArray(trendsResponse.data?.data) ? trendsResponse.data.data : [],
                    patterns: Array.from(trendsResponse.data?.patterns || [])
                });
                setError(null);
            } catch (err) {
                setError('Failed to fetch dashboard data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const fetchPatternDetails = async (patternName) => {
        try {
            setSelectedPattern(patternName);
            setLoadingDetails(true);
            const res = await axiosInstance.get(`/api/insights/patterns/${userId}/detail?pattern=${encodeURIComponent(patternName)}`);
            setPatternDetails(res.data);
        } catch (err) {
            console.error("Failed to fetch details", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Fetch Word Cloud Image
    useEffect(() => {
        const fetchWordCloud = async () => {
            if (!trends.data.length || !trends.data[currentMonthIndex]) return;
            
            const monthStr = trends.data[currentMonthIndex].month; // "YYYY-MM"
            const [year, month] = monthStr.split('-');

            try {
                const response = await axiosInstance.get(`/api/insights/wordcloud`, {
                    params: { year, month }
                });
                if (response.status === 204) {
                    setWordCloudData([]);
                } else {
                    setWordCloudData(response.data);
                }
            } catch (err) {
                console.error("Failed to fetch word cloud", err);
                setWordCloudData([]);
            }
        };

        fetchWordCloud();
    }, [trends, currentMonthIndex]);


    if (loading) {
        return <div className="flex justify-center items-center h-64 text-main">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-10">{error}</div>;
    }

    const maxFrequency = Math.max(...(Array.isArray(patterns) ? patterns : []).map(p => p.frequency), 1);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 dashboard-page relative">
            <div className="flex justify-between items-center mb-1">
                <h1 className="text-2xl font-bold">My Coding Dashboard</h1>
                <div className="flex gap-2">
                   
                </div>
            </div>
            <p className="text-sm dashboard-text-sub">나의 코딩 습관과 패턴을 한눈에 확인하세요.</p>

            {/* 🚨 상습적인 실수 경고 배너 (데모) */}
            {showMistakeAlert && (
                <div 
                    onClick={() => navigate('/mistake-report')}
                    className="cursor-pointer bg-red-900/80 border-2 border-red-600 rounded-lg p-6 flex items-center justify-between shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:bg-red-900 transition-all transform hover:scale-[1.01]"
                >
                    <div className="flex items-center gap-4">
                        <div className="text-4xl animate-bounce">🤬</div>
                        <div>
                            <h2 className="text-xl font-bold text-red-200">나 더 이상 못참겠다. 이게 하루이틀이야?</h2>
                            <p className="text-red-300">너 내가 강의 준비해 놨으니까, 이거 얼른 공부하고 와. 파묻어버리기 전에.</p>
                        </div>
                    </div>
                    <div className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-500 animate-pulse">
                        교육 현장으로 끌려가기 &rarr;
                    </div>
                </div>
            )}

            {/* Top Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                
                {/* 1. Overall Frequency Bar Chart (Horizontal) */}
                <div className="dashboard-panel p-6 rounded-xl shadow-sm">
                    <h2 className="dashboard-card-title">Most Common Code Smells (Top 5)</h2>
                    <p className="text-sm dashboard-text-sub mb-6">Click a bar to view details</p>
                    
                    <div className="space-y-4">
                        {patterns.filter(p => p.patternType !== 'Analysis Summary').slice(0, 5).map((pattern, index) => (
                            <div 
                                key={pattern.patternType} 
                                className="group cursor-pointer"
                                onClick={() => fetchPatternDetails(pattern.patternType)}
                            >
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium group-hover:text-indigo-500 transition-colors">{pattern.patternType}</span>
                                    <span className="dashboard-text-sub">{pattern.frequency}</span>
                                </div>
                                <div className="w-full dashboard-chart-bar-bg rounded-full h-2.5">
                                    <div 
                                        className="dashboard-chart-bar-fill h-2.5 rounded-full transition-all duration-500" 
                                        style={{ width: `${(pattern.frequency / maxFrequency) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {patterns.length === 0 && <p className="dashboard-text-sub text-center">No patterns found.</p>}
                    </div>
                </div>

                {/* 2. Monthly Trends Word Cloud */}
                <div className="dashboard-panel p-6 rounded-xl shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="dashboard-card-title mb-0">Monthly Trends</h2>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentMonthIndex === 0}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="font-mono font-bold min-w-20 text-center">
                                {trends.data[currentMonthIndex]?.month || 'No Data'}
                            </span>
                            <button 
                                onClick={() => setCurrentMonthIndex(prev => Math.min(trends.data.length - 1, prev + 1))}
                                disabled={currentMonthIndex === trends.data.length - 1 || trends.data.length === 0}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center min-h-62.5 relative overflow-hidden rounded-lg p-2">
                        {wordCloudData && wordCloudData.length > 0 ? (
                            <WordCloudChart 
                                data={wordCloudData} 
                                onWordClick={(name) => {
                                    setSelectedPattern(name);
                                    fetchPatternDetails(name);
                                }}
                            />
                        ) : (
                            <div className="dashboard-text-sub">No data for this month</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Details & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Detail View (Takes up 2 columns) */}
                <div className="lg:col-span-2 dashboard-panel p-6 rounded-xl shadow-sm min-h-100">
                    <h2 className="dashboard-card-title mb-4">
                        {selectedPattern ? `Details: ${selectedPattern}` : "Select a pattern to view details"}
                    </h2>
                    
                    {loadingDetails ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : selectedPattern && patternDetails.length === 0 ? (
                        <p className="dashboard-text-sub">No details found for this pattern.</p>
                    ) : selectedPattern ? (
                        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {patternDetails.map((detail, idx) => (
                                <div key={idx} className="dashboard-list-item p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-mono break-all text-indigo-600 dark:text-indigo-400">{detail.filePath}</span>
                                        <span className="text-xs dashboard-text-sub whitespace-nowrap ml-2">{new Date(detail.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mb-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            detail.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
                                            detail.severity === 'MAJOR' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                        }`}>
                                            {detail.severity}
                                        </span>
                                    </div>
                                    <p className="mb-3 text-sm">{detail.description}</p>
                                    {detail.code && (
                                        <div className="bg-gray-100 dark:bg-gray-950 p-3 rounded text-xs overflow-x-auto border border-gray-200 dark:border-gray-800">
                                            <pre className="font-mono text-gray-800 dark:text-gray-200">
                                                <code>{detail.code}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 dashboard-text-sub">
                            <p>Click on a bar in the "Most Common Code Smells" chart</p>
                            <p>to see specific code examples here.</p>
                        </div>
                    )}
                </div>

                {/* Recent History (Takes up 1 column) */}
                <div className="dashboard-panel p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 
                            className="dashboard-card-title mb-0 cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => navigate('/codeAnalysis')}
                        >
                            Recent Analysis
                        </h2>
                        <span 
                            className="text-xs text-indigo-500 cursor-pointer hover:underline"
                            onClick={() => navigate('/codeAnalysis')}
                        >
                            View All &rarr;
                        </span>
                    </div>
                    <div className="space-y-4">
                        {history.slice(0, 5).map(item => (
                            <div 
                                key={item.analysisId} 
                                className="dashboard-list-item p-4 rounded border-l-4 border-indigo-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => navigate(`/codeAnalysis/${item.analysisId}`)}
                            >
                                <p className="font-semibold truncate text-sm mb-1" title={item.filePath}>
                                    {item.filePath.split('/').pop()}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs dashboard-text-sub">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${getScoreBadgeColor(item.aiScore)}`}>
                                        {getSmellKeyword(item.aiScore).text.split(' ')[1]}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && <p className="dashboard-text-sub text-sm">No analysis history yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
