import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnalysisHistory } from '../../service/codeAnalysis/analysisApi';
import { getScoreBadgeColor, getSmellKeyword } from '../../utils/codeAnalysisUtils';
import { useLogin } from '../../context/login/useLogin'; // useLogin 추가

const CodeAnalysisMain = () => {
    const { user, isLogin } = useLogin(); // user 정보 가져오기
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const userId = user?.userId;

    useEffect(() => {
        // 로그인이 안되어있거나 userId가 없으면 로딩만 끄고 리턴 (또는 로그인 페이지로 리다이렉트 가능)
        if (!userId) {
             // 만약 로그인이 필요한 페이지라면 여기서 체크
             if (loading && !isLogin) {
                 // 로그인 상태 확인 후에도 로그인이 아니라면? 
                 // 일단 여기서는 리스트를 비우고 로딩 끝냄
                 setLoading(false);
             }
            return;
        }

        const loadHistory = async () => {
            try {
                setLoading(true);
                // 실제 사용자 ID 사용
                const result = await getAnalysisHistory(userId);
                
                if (result.data && Array.isArray(result.data)) {
                    setHistory(result.data);
                } else {
                    setHistory([]);
                }
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadHistory();
        }
    }, [userId]); // userId가 변경되면(로드되면) 실행

    const handleCardClick = (analysisId) => {
        navigate(`/codeAnalysis/${analysisId}`);
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-6xl mx-auto px-4">
                
                {/* 헤더 섹션 */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">코드 분석 이력</h1>
                        <p>AI가 분석한 코드 리포트를 확인하세요</p>
                    </div>
                    <Link
                        to="/codeAnalysis/new"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                        ✨ 새 분석 시작하기
                    </Link>
                </div>

                {/* 리스트 섹션 */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2">분석 이력을 불러오는 중...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <div className="text-center py-20 rounded-lg border border-dashed border-gray-300">
                                <p className="text-lg mb-4">아직 분석된 코드가 없습니다.</p>
                                <Link
                                    to="/codeAnalysis/new"
                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    첫 번째 분석을 시작해보세요! →
                                </Link>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item.analysisId}
                                    onClick={() => handleCardClick(item.analysisId)}
                                    className="rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer p-6 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getScoreBadgeColor(item.aiScore)}`}>
                                                    {getSmellKeyword(item.aiScore).text.split(' ')[1]}
                                                </span>
                                                <h3 className="text-lg font-semibold group-hover:text-indigo-600 transition-colors">
                                                    {item.filePath.split('/').pop()}
                                                </h3>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1">
                                                    📂 {item.filePath}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    📅 {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    🎭 톤 레벨: {item.toneLevel}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="group-hover:text-indigo-600 transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeAnalysisMain;
