import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';

const DashboardPage = () => {
    const [patterns, setPatterns] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [trends, setTrends] = useState({ data: [], patterns: [] });
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
                
                setPatterns(patternsResponse.data);
                setHistory(historyResponse.data);
                setTrends({
                    data: trendsResponse.data.data,
                    patterns: Array.from(trendsResponse.data.patterns || [])
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

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-white">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-10">{error}</div>;
    }

    // Colors for the chart
    const colors = ["bg-indigo-500", "bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-blue-500", "bg-teal-500"];

    // Calculate max values for scaling
    const maxFrequency = Math.max(...patterns.map(p => p.frequency), 1);
    const maxTrendTotal = Math.max(...trends.data.map(d => d.total), 1);

    return (
        <div className="container mx-auto px-4 py-8 text-white">
            <h1 className="text-3xl font-bold mb-8">My Coding Dashboard</h1>

            {/* Top Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                
                {/* 1. Overall Frequency Bar Chart (Horizontal) */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Most Common Code Smells</h2>
                    <p className="text-sm text-gray-400 mb-6">Click a bar to view details</p>
                    
                    <div className="space-y-4">
                        {patterns.map((pattern, index) => (
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

                {/* 2. Monthly Trends Chart (Vertical Stacked) */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Monthly Trends</h2>
                    
                    <div className="flex items-end justify-between h-64 space-x-4 mt-8 pb-4">
                        {trends.data.map((monthData) => (
                            <div key={monthData.month} className="flex flex-col items-center flex-1 h-full justify-end group">
                                <div className="w-full max-w-[40px] flex flex-col-reverse h-full justify-end relative">
                                    {/* Tooltip-ish overlay on hover could go here, but keeping it simple */}
                                    
                                    {/* Stacked Bars */}
                                    {trends.patterns.map((pattern, idx) => {
                                        const count = monthData[pattern] || 0;
                                        if (count === 0) return null;
                                        const heightPercent = (count / maxTrendTotal) * 100;
                                        
                                        return (
                                            <div 
                                                key={pattern}
                                                className={`${colors[idx % colors.length]} w-full transition-all duration-300 hover:opacity-80`}
                                                style={{ height: `${heightPercent}%` }}
                                                title={`${pattern}: ${count}`}
                                            ></div>
                                        );
                                    })}
                                </div>
                                <span className="text-xs text-gray-400 mt-2 rotate-0 truncate w-full text-center">{monthData.month}</span>
                            </div>
                        ))}
                        {trends.data.length === 0 && <div className="w-full text-center text-gray-500 self-center">No trend data available.</div>}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                        {trends.patterns.map((pattern, idx) => (
                            <div key={pattern} className="flex items-center text-xs text-gray-300">
                                <span className={`w-3 h-3 rounded-full mr-1 ${colors[idx % colors.length]}`}></span>
                                {pattern}
                            </div>
                        ))}
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
                                    <span className={`text-xs font-bold ${
                                        item.aiScore >= 80 ? 'text-green-400' :
                                        item.aiScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                        Score: {item.aiScore}
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
