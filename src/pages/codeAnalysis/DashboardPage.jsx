import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../server/AxiosConfig';
import { getSmellKeyword, getScoreBadgeColor } from '../../utils/codeAnalysisUtils';

const DashboardPage = () => {
    const [patterns, setPatterns] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [trends, setTrends] = useState({ data: [], patterns: [] });
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
    const [selectedPattern, setSelectedPattern] = useState(null);
    const [patternDetails, setPatternDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    const userId = 1;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const patternsResponse = await axiosInstance.get(`/api/insights/patterns/${userId}`);
                const historyResponse = await axiosInstance.get(`/api/insights/history/${userId}`);
                const trendsResponse = await axiosInstance.get(`/api/insights/trends/${userId}`);
                
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

    // Randomized Word Cloud Data
    const wordCloudData = useMemo(() => {
        if (!trends.data.length || !trends.data[currentMonthIndex]) return [];

        const currentMonthData = trends.data[currentMonthIndex];
        const activePatterns = trends.patterns.filter(p => currentMonthData[p] > 0);
        
        if (activePatterns.length === 0) return [];

        const maxInMonth = Math.max(...activePatterns.map(p => currentMonthData[p]));
        
        // Seeded-like randomization (stable for the same data)
        return activePatterns.map((pattern, i) => {
            const count = currentMonthData[pattern];
            const size = 0.8 + ((count / maxInMonth) * 2.0); // 0.8rem to 2.8rem
            const rotation = (i * 37) % 30 - 15; // -15 to +15 degrees deterministic
            const margin = (i * 13) % 4 + 1; // 1 to 4 margin
            
            // Shuffle order deterministically
            const order = (i * 7) % 100;

            return {
                text: pattern,
                count,
                size,
                rotation,
                margin,
                order,
                color: ["text-indigo-400", "text-green-400", "text-yellow-400", "text-orange-400", "text-blue-400", "text-teal-400"][i % 6]
            };
        }).sort((a, b) => a.order - b.order); // Randomize order
    }, [trends, currentMonthIndex]);


    if (loading) {
        return <div className="flex justify-center items-center h-64 text-white">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-10">{error}</div>;
    }

    const maxFrequency = Math.max(...(Array.isArray(patterns) ? patterns : []).map(p => p.frequency), 1);

    return (
        <div className="container mx-auto px-4 py-8 text-white">
            <h1 className="text-3xl font-bold mb-8">My Coding Dashboard</h1>

            {/* Top Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                
                {/* 1. Overall Frequency Bar Chart (Horizontal) */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Most Common Code Smells (Top 5)</h2>
                    <p className="text-sm text-gray-400 mb-6">Click a bar to view details</p>
                    
                    <div className="space-y-4">
                        {patterns.slice(0, 5).map((pattern, index) => (
                            <div 
                                key={pattern.patternType} 
                                className="group cursor-pointer"
                                onClick={() => fetchPatternDetails(pattern.patternType)}
                            >
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-300 group-hover:text-white">{pattern.patternType}</span>
                                    <span className="text-gray-400">{pattern.frequency}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div 
                                        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 group-hover:bg-indigo-400" 
                                        style={{ width: `${(pattern.frequency / maxFrequency) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {patterns.length === 0 && <p className="text-gray-500 text-center">No patterns found.</p>}
                    </div>
                </div>

                {/* 2. Monthly Trends Word Cloud */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Monthly Trends</h2>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentMonthIndex === 0}
                                className="p-1 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="font-mono font-bold min-w-[80px] text-center">
                                {trends.data[currentMonthIndex]?.month || 'No Data'}
                            </span>
                            <button 
                                onClick={() => setCurrentMonthIndex(prev => Math.min(trends.data.length - 1, prev + 1))}
                                disabled={currentMonthIndex === trends.data.length - 1 || trends.data.length === 0}
                                className="p-1 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center min-h-[250px] relative overflow-hidden bg-gray-900/50 rounded-lg p-4">
                        {wordCloudData.length > 0 ? (
                            <div className="flex flex-wrap justify-center items-center content-center h-full w-full">
                                {wordCloudData.map((item) => (
                                    <span 
                                        key={item.text}
                                        className={`transition-all duration-500 hover:scale-110 cursor-pointer font-bold ${item.color} hover:text-white hover:z-10`}
                                        style={{ 
                                            fontSize: `${item.size}rem`, 
                                            transform: `rotate(${item.rotation}deg)`,
                                            margin: `${item.margin * 0.25}rem`,
                                            opacity: 0.85
                                        }}
                                        title={`${item.text}: ${item.count}`}
                                    >
                                        {item.text}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500">No data for this month</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Details & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Detail View (Takes up 2 columns) */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg min-h-[400px]">
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedPattern ? `Details: ${selectedPattern}` : "Select a pattern to view details"}
                    </h2>
                    
                    {loadingDetails ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : selectedPattern && patternDetails.length === 0 ? (
                        <p className="text-gray-400">No details found for this pattern.</p>
                    ) : selectedPattern ? (
                        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {patternDetails.map((detail, idx) => (
                                <div key={idx} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm text-blue-300 font-mono break-all">{detail.filePath}</span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{new Date(detail.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mb-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            detail.severity === 'CRITICAL' ? 'bg-red-900 text-red-200' :
                                            detail.severity === 'MAJOR' ? 'bg-orange-900 text-orange-200' :
                                            'bg-blue-900 text-blue-200'
                                        }`}>
                                            {detail.severity}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 mb-3 text-sm">{detail.description}</p>
                                    {detail.code && (
                                        <div className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                                            <pre className="text-green-400 font-mono">
                                                <code>{detail.code}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <p>Click on a bar in the "Most Common Code Smells" chart</p>
                            <p>to see specific code examples here.</p>
                        </div>
                    )}
                </div>

                {/* Recent History (Takes up 1 column) */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Recent Analysis</h2>
                    <div className="space-y-4">
                        {history.slice(0, 5).map(item => (
                            <div key={item.analysisId} className="bg-gray-700 p-4 rounded border-l-4 border-blue-500 hover:bg-gray-600 transition-colors cursor-pointer">
                                <p className="font-semibold truncate text-sm mb-1" title={item.filePath}>
                                    {item.filePath.split('/').pop()}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${getScoreBadgeColor(item.aiScore)}`}>
                                        {getSmellKeyword(item.aiScore).text.split(' ')[1]}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && <p className="text-gray-500 text-sm">No analysis history yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
