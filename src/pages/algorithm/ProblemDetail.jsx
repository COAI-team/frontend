import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProblem } from '../../service/algorithm/algorithmApi';
import SharedSolutions from './SharedSolutions';

const ProblemDetail = () => {
    const { problemId } = useParams();
    const navigate = useNavigate();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        const fetchProblem = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getProblem(problemId);
                if (res.error) {
                    setError(res.message || '문제를 불러오는데 실패했습니다.');
                } else {
                    setProblem(res.Data || res.data || res);
                }
            } catch (err) {
                console.error('문제 상세 조회 에러:', err);
                setError('서버에 연결할 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (problemId) {
            fetchProblem();
        }
    }, [problemId]);

    const getDifficultyBadge = (diff) => {
        const styles = {
            'BRONZE': 'bg-orange-100 text-orange-800 border-orange-200',
            'SILVER': 'bg-gray-100 text-gray-800 border-gray-200',
            'GOLD': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'PLATINUM': 'bg-cyan-100 text-cyan-800 border-cyan-200'
        };
        return styles[diff] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">문제를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-xl mb-4">⚠️ {error}</p>
                    <Link to="/algorithm/problems" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        문제 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    if (!problem) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">

                {/* 상단 네비게이션 */}
                <div className="mb-6">
                    <Link to="/algorithm/problems" className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
                        ← 목록으로 돌아가기
                    </Link>
                </div>

                {/* 문제 헤더 */}
                <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDifficultyBadge(problem.algoProblemDifficulty)}`}>
                                    {problem.algoProblemDifficulty}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${problem.problemType === 'SQL'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}>
                                    {problem.problemType === 'SQL' ? 'DATABASE' : 'ALGORITHM'}
                                </span>
                                <span className="text-gray-500 text-sm">#{problem.algoProblemId}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">{problem.algoProblemTitle}</h1>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Link
                                to={`/algorithm/problems/${problemId}/solve`}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                            >
                                <span>🚀 문제 풀기</span>
                            </Link>
                        </div>
                    </div>

                    <div className="flex gap-6 text-sm text-gray-600 border-t pt-4 mt-4">
                        <div>
                            <span className="font-medium text-gray-900">시간 제한:</span> {problem.timelimit || 1000}ms
                        </div>
                        <div>
                            <span className="font-medium text-gray-900">메모리 제한:</span> {problem.memorylimit || 256}MB
                        </div>
                        <div>
                            <span className="font-medium text-gray-900">출처:</span> {problem.algoProblemSource || 'Unknown'}
                        </div>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="bg-white rounded-t-lg shadow-sm border border-b-0">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'description'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            문제 설명
                        </button>
                        <button
                            onClick={() => setActiveTab('solutions')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'solutions'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            다른 사람의 풀이
                        </button>
                    </div>
                </div>

                {/* 탭 컨텐츠 */}
                {activeTab === 'description' ? (
                    <>
                        {/* 문제 설명 */}
                        <div className="bg-white shadow-sm border border-t-0 p-8 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">문제 설명</h2>
                            <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {problem.algoProblemDescription}
                            </div>
                        </div>

                        {/* 예제 입출력 */}
                        {problem.testcases && problem.testcases.length > 0 && (
                            <div className="bg-white rounded-b-lg shadow-sm border p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">예제</h2>
                                <div className="space-y-6">
                                    {problem.testcases.filter(tc => tc.isSample).map((tc, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 mb-2">예제 입력 {idx + 1}</h3>
                                                <pre className="bg-gray-50 border rounded-md p-4 font-mono text-sm overflow-x-auto">
                                                    {tc.input}
                                                </pre>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 mb-2">예제 출력 {idx + 1}</h3>
                                                <pre className="bg-gray-50 border rounded-md p-4 font-mono text-sm overflow-x-auto">
                                                    {tc.expectedOutput}
                                                </pre>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <SharedSolutions problemId={problemId} />
                )}

            </div>
        </div>
    );
};

export default ProblemDetail;