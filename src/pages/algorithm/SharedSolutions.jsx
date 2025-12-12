import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSharedSubmissions } from '../../service/algorithm/algorithmApi';

const SharedSolutions = ({ problemId }) => {
    const navigate = useNavigate();
    
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    
    const PAGE_SIZE = 20;

    useEffect(() => {
        fetchSharedSolutions();
    }, [problemId, page]);

    const fetchSharedSolutions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getSharedSubmissions(problemId, page, PAGE_SIZE);
            
            if (response.error) {
                throw new Error(response.message || '공유된 풀이를 불러오는데 실패했습니다.');
            }
            
            const pageData = response.data;
            
            setSolutions(pageData.content || []);
            setTotalPages(pageData.totalPages || 0);
            setHasNext(pageData.hasNext || false);
            
        } catch (err) {
            console.error('공유된 풀이 로딩 실패:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (result) => {
        switch (result) {
            case 'AC':
                return 'text-green-600 bg-green-50';
            case 'WA':
                return 'text-red-600 bg-red-50';
            case 'TLE':
                return 'text-orange-600 bg-orange-50';
            case 'MLE':
                return 'text-purple-600 bg-purple-50';
            case 'RE':
                return 'text-yellow-600 bg-yellow-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusText = (result) => {
        switch (result) {
            case 'AC':
                return '맞았습니다';
            case 'WA':
                return '틀렸습니다';
            case 'TLE':
                return '시간 초과';
            case 'MLE':
                return '메모리 초과';
            case 'RE':
                return '런타임 에러';
            default:
                return result || '채점 중';
        }
    };

    const handleSolutionClick = (submissionId) => {
        navigate(`/algorithm/submissions/${submissionId}`);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading && page === 1) {
        return (
            <div className="bg-white rounded-b-lg shadow-sm border border-t-0 p-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">풀이를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-b-lg shadow-sm border border-t-0 p-8">
                <div className="text-center py-12">
                    <p className="text-red-600 mb-4">⚠️ {error}</p>
                    <button
                        onClick={fetchSharedSolutions}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-b-lg shadow-sm border border-t-0">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">다른 사람의 풀이</h2>
                    <p className="text-sm text-gray-600">
                        총 {solutions.length}개의 풀이
                    </p>
                </div>

                {solutions.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                        아직 공유된 풀이가 없습니다.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            제출 번호
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            결과
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            언어
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            점수
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            메모리 / 시간
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            제출 일시
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {solutions.map((solution) => (
                                        <tr
                                            key={solution.submissionId}
                                            onClick={() => handleSolutionClick(solution.submissionId)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                #{solution.submissionId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(solution.judgeResult)}`}>
                                                    {getStatusText(solution.judgeResult)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {solution.language}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {solution.finalScore ? `${solution.finalScore}점` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {solution.memoryUsage ? `${Math.round(solution.memoryUsage / 1024)}KB` : '-'} /
                                                {solution.executionTime ? ` ${solution.executionTime}ms` : ' -'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {solution.submittedAt ? format(new Date(solution.submittedAt), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-center items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    이전
                                </button>
                                
                                <span className="px-4 py-2 text-sm text-gray-700">
                                    {page} / {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={!hasNext}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SharedSolutions;