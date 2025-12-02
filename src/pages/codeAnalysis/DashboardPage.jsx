import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
    const [patterns, setPatterns] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = 1; // Hardcoded for now

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const patternsResponse = await axiosInstance.get(`/api/insights/patterns/${userId}`);
                const historyResponse = await axiosInstance.get(`/api/insights/history/${userId}`);
                setPatterns(patternsResponse.data);
                setHistory(historyResponse.data);
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

    if (loading) {
        return <p>Loading dashboard...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Coding Dashboard</h1>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Most Common Code Smells</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={patterns}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="patternType" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="frequency" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4">Recent Analysis History</h2>
                <div className="space-y-4">
                    {history.slice(0, 5).map(item => (
                        <div key={item.analysisId} className="bg-gray-800 p-4 rounded">
                            <p className="font-semibold">{item.filePath}</p>
                            <p>Score: {item.aiScore}</p>
                            <p className="text-sm text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
