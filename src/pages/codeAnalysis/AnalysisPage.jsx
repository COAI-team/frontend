import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import RepositorySelector from '../../components/github/RepositorySelector';
import BranchSelector from '../../components/github/BranchSelector';
import FileTree from '../../components/github/FileTree';
import AnalysisForm from '../../components/github/AnalysisForm';
import { saveFile, analyzeStoredFile, getAnalysisResult, analyzeStoredFileStream } from '../../service/codeAnalysis/analysisApi';
import axiosInstance from '../../server/AxiosConfig';

const AnalysisPage = () => {
    const { analysisId } = useParams();
    const navigate = useNavigate();
    const isNew = !analysisId;

    // Selection State
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');

    // Analysis State
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [streamedContent, setStreamedContent] = useState('');
    const [error, setError] = useState(null);



    // Load existing analysis if ID is present
    useEffect(() => {
        if (!isNew) {
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
        }
    }, [analysisId, isNew]);

    // Fetch file content when file is selected
    useEffect(() => {
        if (!selectedFile || !selectedRepo) return;

        const fetchContent = async () => {
            try {
                // TODO: GithubService API 사용
                const response = await axiosInstance.get(`/api/github/repos/${selectedRepo.owner}/${selectedRepo.name}/content`, {
                    params: { path: selectedFile.path }
                });
                setFileContent(response.data.content);
            } catch (err) {
                console.error("Failed to fetch file content:", err);
                setFileContent('// Failed to load content');
            }
        };
        fetchContent();
    }, [selectedFile, selectedRepo]);

    const handleRepoSelect = (repo) => {
        setSelectedRepo(repo);
        setSelectedBranch(null);
        setSelectedFile(null);
        setFileContent('');
    };

    const handleBranchSelect = (branch) => {
        setSelectedBranch(branch);
        setSelectedFile(null);
        setFileContent('');
    };

    const cleanMarkdownCodeBlock = (text) => {
        if (!text) return "{}";
        const trimmed = text.trim();
        const firstBrace = trimmed.indexOf("{");
        const lastBrace = trimmed.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    };

    const handleAnalysisSubmit = async (formState) => {
        if (!selectedFile || !selectedRepo) return;

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setStreamedContent('');

        try {
            // 1. 파일 저장
            const saveResponse = await saveFile({
                repositoryUrl: selectedRepo.url,
                owner: selectedRepo.owner,
                repo: selectedRepo.name,
                filePath: selectedFile.path,
                userId: 1 // TODO: Auth Context
            });

            // 2. 분석 요청 (스트리밍)
            let accumulated = "";
            await analyzeStoredFileStream({
                analysisId: saveResponse.data.fileId,
                repositoryUrl: selectedRepo.url,
                filePath: selectedFile.path,
                analysisTypes: formState.analysisTypes,
                toneLevel: formState.toneLevel,
                customRequirements: formState.customRequirements,
                userId: 1
            }, (chunk) => {
                accumulated += chunk;
                setStreamedContent(prev => prev + chunk);
            });

            // 3. 결과 파싱
            try {
                const jsonStr = cleanMarkdownCodeBlock(accumulated);
                const result = JSON.parse(jsonStr);
                setAnalysisResult(result);
            } catch (parseErr) {
                console.error("JSON Parse Error:", parseErr);
                console.log("Raw Content:", accumulated);
                // 파싱 실패 시 원본 텍스트라도 보여주기 위해 더미 객체에 넣거나 에러 처리
                setError("분석 결과를 처리하는 중 오류가 발생했습니다. (JSON 파싱 실패)");
            }
            
        } catch (err) {
            console.error(err);
            setError("분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* 상단 헤더 */}
            <div className="shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/codeAnalysis')}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                ← 목록으로
                            </button>
                            <span >|</span>
                            <h1 className="text-lg font-semibold">
                                {isNew ? '✨ 새 코드 분석' : '📊 분석 결과 리포트'}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* 왼쪽 패널: 파일 선택 및 코드 뷰어 */}
                    <div className="space-y-6">
                        {isNew && (
                            <div className="rounded-lg shadow-sm border p-6">
                                <h2 className="text-lg font-semibold mb-4">📂 파일 선택</h2>
                                <div className="space-y-4">
                                    <RepositorySelector onSelect={handleRepoSelect} />
                                    {selectedRepo && <BranchSelector repository={selectedRepo} onSelect={handleBranchSelect} />}
                                    {selectedBranch && <FileTree repository={selectedRepo} branch={selectedBranch} onSelect={setSelectedFile} />}
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg shadow-sm border overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-semibold">
                                    💻 코드 뷰어 {selectedFile && `- ${selectedFile.path}`}
                                </h3>
                                <span className="text-xs">ReadOnly</span>
                            </div>
                            <div className="p-0">
                                <textarea
                                    value={fileContent}
                                    readOnly
                                    className="w-full h-[600px] p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] resize-none focus:outline-none"
                                    placeholder={isNew ? "파일을 선택하면 코드가 여기에 표시됩니다." : "코드를 불러오는 중..."}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽 패널: 분석 설정 및 결과 */}
                    <div className="space-y-6">
                        {isNew && !analysisResult && !isLoading && (
                            <div className="rounded-lg shadow-sm border p-6">
                                <h2 className="text-lg font-semibold mb-4">⚙️ 분석 설정</h2>
                                <AnalysisForm onSubmit={handleAnalysisSubmit} isLoading={isLoading} />
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 스트리밍 중이거나 결과가 있을 때 */}
                        {(isLoading || analysisResult) && (
                            <div className="rounded-lg shadow-sm border p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        {isLoading ? '분석 중...' : '분석 결과'}
                                    </h2>
                                    {analysisResult && (
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                                            AI Score: {analysisResult.aiScore || 'N/A'}
                                        </span>
                                    )}
                                </div>

                                {/* 스트리밍 출력 (로딩 중일 때 표시) */}
                                {isLoading && (
                                    <div className="mb-6 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap">
                                        {streamedContent || "분석을 시작합니다..."}
                                        <span className="animate-pulse">_</span>
                                    </div>
                                )}

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
                                
                                {isNew && !isLoading && (
                                    <div className="mt-6 pt-6 border-t text-center">
                                        <button 
                                            onClick={() => navigate('/codeAnalysis')}
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            목록으로 돌아가기
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
