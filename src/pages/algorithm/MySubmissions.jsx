import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMySubmissions } from '../../service/algorithm/algorithmApi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const MySubmissions = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    useEffect(() => {
        fetchSubmissions();
    }, [page]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const response = await getMySubmissions({ page, size: PAGE_SIZE });

            if (response.error) {
                throw new Error(response.message);
            }

            const newSubmissions = response.data || [];
            if (page === 0) {
                setSubmissions(newSubmissions);
            } else {
                setSubmissions(prev => [...prev, ...newSubmissions]);
            }

            setHasMore(newSubmissions.length === PAGE_SIZE);
        } catch (err) {
            console.error('제출 이력 로딩 실패:', err);
            setError('제출 이력을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (result) => {
        switch (result) {
            case 'AC': return 'text-green-600 bg-green-50';
            case 'WA': return 'text-red-600 bg-red-50';
            case 'TLE': return 'text-orange-600 bg-orange-50';
            case 'MLE': return 'text-purple-600 bg-purple-50';
            case 'RE': return 'text-yellow-600 bg-yellow-50';
            case 'CE': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusText = (result) => {
        switch (result) {
            case 'AC': return '맞았습니다';
            case 'WA': return '틀렸습니다';
            case 'TLE': return '시간 초과';
            case 'MLE': return '메모리 초과';
            case 'RE': return '런타임 에러';
            case 'CE': return '컴파일 에러';
            default: return result || '채점 중';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">내 제출 이력</h1>
                <p className="mt-2 text-sm text-gray-600">
                    지금까지 제출한 알고리즘 문제 풀이 기록입니다.
                </p>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-600">
                    {error}
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        제출 번호
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        문제
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        결과
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        언어
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        메모리 / 시간
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        제출 일시
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {submissions.map((submission) => (
                                    <tr
                                        key={submission.submissionId}
                                        onClick={() => navigate(`/algorithm/submissions/${submission.submissionId}`)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{submission.submissionId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {submission.problemTitle}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.judgeResult)}`}>
                                                {getStatusText(submission.judgeResult)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.language}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.memoryUsage ? `${Math.round(submission.memoryUsage / 1024)}KB` : '-'} /
                                            {submission.executionTime ? ` ${submission.executionTime}ms` : ' -'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(submission.submittedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {submissions.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500">
                            제출 이력이 없습니다.
                        </div>
                    )}

                    {hasMore && (
                        <div className="bg-gray-50 px-4 py-4 sm:px-6 text-center border-t border-gray-200">
                            <button
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={loading}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                            >
                                {loading ? '로딩 중...' : '더 보기'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MySubmissions;
