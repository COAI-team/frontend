import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../server/AxiosConfig';
import WriteEditor from '../../components/editor/WriteEditor';
import { getAnalysisResult } from '../../service/codeAnalysis/analysisApi';
import { getSmellKeyword, getScoreBadgeColor } from '../../utils/codeAnalysisUtils';

const CodeboardWrite = () => {
    const { analysisId } = useParams();
    const navigate = useNavigate();

    // 분석 결과 상태
    const [fileContent, setFileContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // 분석 결과 로드
    useEffect(() => {
        const loadAnalysis = async () => {
            try {
                setIsLoading(true);
                const result = await getAnalysisResult(analysisId);
                const data = result.data;
                setAnalysisResult(data);
                
                // 파일 내용 로드
                if (data.repositoryUrl && data.filePath) {
                    try {
                        const parts = data.repositoryUrl.split('/');
                        const owner = parts[parts.length - 2];
                        const repo = parts[parts.length - 1];
                        
                        const contentRes = await axiosInstance.get(`/api/github/repos/${owner}/${repo}/content`, {
                            params: { path: data.filePath }
                        });
                        setFileContent(contentRes.data.content);
                    } catch (contentErr) {
                        console.error("Failed to load file content:", contentErr);
                        setFileContent("// 파일 내용을 불러올 수 없습니다.");
                    }
                }
            } catch (err) {
                setError("분석 결과를 불러오는데 실패했습니다.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAnalysis();
    }, [analysisId]);

    const handleSubmit = ({ title, content, representImage, tags }) => {
        const blocks = [{
            id: `block-${Date.now()}`,
            type: "tiptap",
            content: content,
            order: 0
        }];

        console.log("📤 전송할 데이터:", {
            title: title,
            blocks: blocks,
            representImage: representImage || null,
            tags: tags || [],
            analysisId: analysisId
        });

        axiosInstance
            .post("/codeboard", {
                title: title,
                blocks: blocks,
                representImage: representImage || null,
                tags: tags || [],
                analysisId: analysisId
            })
            .then((response) => {
                console.log("✅ 응답:", response.data);
                alert("게시글이 등록되었습니다.");
                navigate("/codeboard/list");
            })
            .catch((err) => {
                console.error("등록 실패:", err);
                console.error("에러 상세:", err.response?.data);
            });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">분석 결과를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error || !analysisResult) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl mb-4">{error || "분석 결과를 찾을 수 없습니다."}</p>
                    <button
                        onClick={() => navigate('/codeAnalysis')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        코드분석 홈으로
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* 상단 헤더 */}
            <div className="shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                ← 뒤로가기
                            </button>
                            <span>|</span>
                            <h1 className="text-lg font-semibold">
                                💬 코드리뷰 게시글 작성
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* 왼쪽 패널: 코드 뷰어 + 분석 결과 */}
                    <div className="space-y-6">
                        {/* 코드 뷰어 */}
                        <div className="rounded-lg shadow-sm border overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-semibold">
                                    💻 코드 뷰어 - {analysisResult.filePath}
                                </h3>
                                <span className="text-xs">ReadOnly</span>
                            </div>
                            <div className="p-0">
                                <textarea
                                    value={fileContent}
                                    readOnly
                                    className="w-full h-[600px] p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] resize-none focus:outline-none"
                                    placeholder="코드를 불러오는 중..."
                                />
                            </div>
                        </div>

                        {/* 분석 결과 */}
                        <div className="rounded-lg shadow-sm border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">
                                    📊 분석 결과
                                </h2>
                                {analysisResult && (
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreBadgeColor(analysisResult.aiScore)}`}>
                                            {getSmellKeyword(analysisResult.aiScore).text}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {analysisResult && (
                                <div className="space-y-6">
                                    {/* Code Smells */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-600 mb-3">🚨 발견된 문제점 (Code Smells)</h3>
                                        <div className="space-y-3">
                                            {analysisResult.codeSmells && (typeof analysisResult.codeSmells === 'string' ? JSON.parse(analysisResult.codeSmells) : analysisResult.codeSmells).map((smell, idx) => (
                                                <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded">
                                                    <div className="font-medium text-red-800">{smell.name}</div>
                                                    <div className="text-sm text-red-600 mt-1">{smell.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-600 mb-3">💡 개선 제안</h3>
                                        <div className="space-y-4">
                                            {analysisResult.suggestions && (typeof analysisResult.suggestions === 'string' ? JSON.parse(analysisResult.suggestions) : analysisResult.suggestions).map((suggestion, idx) => (
                                                <div key={idx} className="border rounded-lg overflow-hidden">
                                                    <div className="p-3 border-b text-sm font-medium">제안 #{idx + 1}</div>
                                                    <div className="p-3 bg-white">
                                                        <div className="text-xs text-gray-500 mb-1">변경 전:</div>
                                                        <pre className="bg-red-50 p-2 rounded text-xs mb-3 overflow-x-auto text-red-700">
                                                            {suggestion.problematicSnippet || suggestion.problematicCode}
                                                        </pre>
                                                        <div className="text-xs text-gray-500 mb-1">변경 후:</div>
                                                        <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto text-green-700">
                                                            {suggestion.proposedReplacement}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽 패널: 글쓰기 영역 */}
                    <div className="space-y-6">
                        <WriteEditor onSubmit={handleSubmit} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeboardWrite;