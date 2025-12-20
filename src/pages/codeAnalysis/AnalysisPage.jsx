import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

import RepositorySelector from '../../components/github/RepositorySelector';
import BranchSelector from '../../components/github/BranchSelector';
import FileTree from '../../components/github/FileTree';
import AnalysisForm from '../../components/github/AnalysisForm';
import { saveFile, analyzeStoredFile, getAnalysisResult } from '../../service/codeAnalysis/analysisApi';
import { getUsageInfo } from '../../service/algorithm/algorithmApi';
import AnalysisLoading from '../../components/codeAnalysis/AnalysisLoading';
import axiosInstance from '../../server/AxiosConfig';
import { getSmellKeyword, getScoreBadgeColor } from '../../utils/codeAnalysisUtils';

import { getAuth } from "../../utils/auth/token";
import AlertModal from "../../components/modal/AlertModal";


const AnalysisPage = () => {
    const { user } = useLogin();
    const { analysisId } = useParams();

    const navigate = useNavigate();

    // Auth State
    const [isAuthed, setIsAuthed] = useState(!!getAuth()?.accessToken);
    const [showLoginAlert, setShowLoginAlert] = useState(false);

    useEffect(() => {
        const authed = !!getAuth()?.accessToken;
        setIsAuthed(authed);
        if (!authed) {
            setShowLoginAlert(true);
        }
    }, []);
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

    // RAG Toggle State
    const [useRag, setUseRag] = useState(true);
    const [ragMessage, setRagMessage] = useState("");

    // 사용량 제한 상태
    const [usageInfo, setUsageInfo] = useState(null);
    const rawTier = user?.subscriptionTier;
    const subscriptionTier = rawTier === 'BASIC' || rawTier === 'PRO' ? rawTier : 'FREE';
    const isUsageLimitExceeded = usageInfo && !usageInfo.isSubscriber && usageInfo.remaining <= 0;
    
    // RAG Message Logic
    useEffect(() => {
        if (useRag) {
            setRagMessage("당신의 기록을 파묘하여 좀 더 개인화 된 코드 분석을 진행합니다. 이 모든 것은 당신을 위한 거랍니다...음뫄하하하");
        } else {
            setRagMessage("당신의 기록은 뒤로 하고, 있는 그대로의 코드를 분석합니다. 그래요. 과거가 뭐가 중요한가요?");
        }
        
        // 메시지 3초 후 사라지게 하려면 아래 코드 추가 (원하는 UX에 따라 결정, User Request는 '비동기로 표시'라고만 함)
        // const timer = setTimeout(() => setRagMessage(""), 5000); 
        // return () => clearTimeout(timer);
    }, [useRag]);

    // Smart Suggestion Logic (Move to onSearch handler)
    const handleOwnerSearch = (owner, isOwnRepo) => {
        if (!owner) return;

        // isOwnRepo: RepositorySelector에서 사용자의 githubId와 비교한 결과
        // 본인 레포일 경우만 RAG 활성화 유지, 다른 사용자면 noRAG로 전환
        if (!isOwnRepo) {
            setUseRag(false);
        }
        // 사용자가 자유롭게 토글할 수 있도록, 본인 레포일 때는 기존 상태 유지
    };

    // 사용량 정보 조회
    useEffect(() => {
        const fetchUsageInfo = async () => {
            if (!user?.userId) return;
            try {
                const response = await getUsageInfo(user.userId);
                if (response.data) {
                    setUsageInfo(response.data);
                }
            } catch (err) {
                console.error('사용량 조회 실패:', err);
            }
        };
        fetchUsageInfo();
    }, [user?.userId]);

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
                userId: user?.userId 
            });

            // 2. 분석 요청 (동기 -> 결과 한 번에 수신)
            const response = await analyzeStoredFile({
                analysisId: saveResponse.data.fileId,
                repositoryUrl: selectedRepo.url,
                filePath: selectedFile.path,
                analysisTypes: formState.analysisTypes,
                toneLevel: formState.toneLevel,
                customRequirements: formState.customRequirements,
                userId: user?.userId 
            });

            const accumulated = response.data; // API returns success(data) or just data depending on ApiResponse wrapping. 
            // The controller returns ApiResponse.success(result), so response.data should be the ApiResponse object.
            // And analysisApi.js: return res.data;
            // So 'response' here is 'res.data' from axios, which is the ApiResponse JSON. 
            // The actual content is in response.data (if ApiResponse has 'data' field).
            // Wait, analyzeStoredFile in analysisApi.js returns res.data.
            // So 'response' variable here holds the body of the HTTP response.
            // The body is ApiResponse<String>. So response.data is the string content (the analysis result).
            // Let's verify ApiResponse structure. Usually it has 'status', 'message', 'data'.
            // So accumulated = response.data;


            // 3. 결과 파싱
            try {
                const jsonStr = cleanMarkdownCodeBlock(accumulated);
                const result = JSON.parse(jsonStr);
                setAnalysisResult(result);
                
                // 백엔드에서 이미 analysisId를 포함해서 보냄
                setAnalysisResult(result);

                // // 분석 결과 저장 API 호출
                // const saveAnalysisResponse = await axiosInstance.post('/analysis/save', {
                //     fileId: saveResponse.data.fileId,  // 1단계에서 받은 fileId
                //     repositoryUrl: selectedRepo.url,
                //     filePath: selectedFile.path,
                //     analysisResult: result  // 파싱된 결과 객체
                // });
                
                // const savedAnalysisId = saveAnalysisResponse.data.data.analysisId;  // ApiResponse 구조 고려
                
                // // URL 업데이트
                // navigate(`/codeAnalysis/${savedAnalysisId}`);
                
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

    const resolvedAnalysisId = analysisResult?.analysisId ?? analysisId; // 게시판 글쓰기 버튼

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
                                    <RepositorySelector onSelect={handleRepoSelect} onSearch={handleOwnerSearch} />
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
                            <div className="p-0 overflow-hidden">
                                <textarea
                                    value={fileContent}
                                    readOnly
                                    className="w-full h-[600px] p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] resize-none focus:outline-none overflow-auto"
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
                                
                                {/* RAG Toggle Switch */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-700">RAG (과거 이력 참조) 모드</span>
                                        <button 
                                            onClick={() => setUseRag(!useRag)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useRag ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useRag ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    
                                    {/* Async Message Area */}
                                    <div className={`text-sm transition-all duration-500 ease-in-out ${ragMessage ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'}`}>
                                       <p className={`p-2 rounded ${useRag ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                                           {ragMessage}
                                       </p>
                                    </div>
                                </div>

                                <AnalysisForm onSubmit={handleAnalysisSubmit} isLoading={isLoading} disabled={isUsageLimitExceeded} />
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 로딩 상태 (New Premium UX) */}
                        {isLoading && <AnalysisLoading />}

                        {/* 분석 결과 */}
                        {!isLoading && analysisResult && (
                            <div className="rounded-lg shadow-sm border p-6 bg-white dark:bg-gray-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        분석 결과
                                    </h2>
                                    {analysisResult && (
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreBadgeColor(analysisResult.aiScore)}`}>
                                                {getSmellKeyword(analysisResult.aiScore).text}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* RAG References Section */}
                                {analysisResult.relatedAnalysisIds && (
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                        <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                            📚 참고된 과거 분석 이력 (RAG Context)
                                        </h3>
                                        <div className="space-y-2">
                                            {(() => {
                                                try {
                                                    const refs = typeof analysisResult.relatedAnalysisIds === 'string' 
                                                        ? JSON.parse(analysisResult.relatedAnalysisIds) 
                                                        : analysisResult.relatedAnalysisIds;
                                                    
                                                    if (!refs || refs.length === 0) return <span className="text-xs text-blue-600">참조된 과거 이력이 없습니다.</span>;

                                                    return refs.map((ref, idx) => (
                                                        <div key={idx} 
                                                            className="flex items-center justify-between bg-white p-2 rounded border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                                                            onClick={() => window.open(`/codeAnalysis/result/${ref.id}`, '_blank')}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono bg-blue-100 text-blue-700 px-1 rounded">REF #{idx + 1}</span>
                                                                <span className="text-sm font-medium text-gray-700">{ref.fileName}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-400">{new Date(ref.timestamp).toLocaleString()}</span>
                                                        </div>
                                                    ));
                                                } catch (e) {
                                                    return <span className="text-xs text-red-400">참조 데이터 로드 실패</span>;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                )}

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
                                                    <div className="p-3 border-b text-sm font-medium flex justify-between items-center">
                                                        <span>제안 #{idx + 1}</span>
                                                        {suggestion.habitContext && (
                                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold animate-pulse">
                                                                👀 {suggestion.habitContext}
                                                            </span>
                                                        )}
                                                    </div>
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

                                {resolvedAnalysisId && (
                                    <div className="mt-6 pt-6 border-t flex justify-center gap-3">
                                        <button
                                            onClick={() => window.location.href = '/codeAnalysis/new'}
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            새로운 분석하기
                                        </button>

                                        <button
                                            onClick={() => navigate(`/codeboard/write/${resolvedAnalysisId}`)}
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            분석결과 공유하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertModal
                open={showLoginAlert}
                onClose={() => setShowLoginAlert(false)}
                onConfirm={() =>
                    navigate("/signin", {
                        replace: true,
                        state: { redirect: "/codeAnalysis" },
                    })
                }
                type="warning"
                title="로그인이 필요합니다"
                message={"서비스를 이용하려면 로그인이 필요합니다.\n로그인 화면으로 이동합니다."}
                confirmText="확인"
            />
        </div>
    );
};

export default AnalysisPage;