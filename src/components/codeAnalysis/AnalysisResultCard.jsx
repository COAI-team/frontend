import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSmellKeyword, getScoreBadgeColor } from '../../utils/codeAnalysisUtils';

const AnalysisResultCard = ({ analysisResult, isRagMode, onNewAnalysis, onShare, resolvedAnalysisId, scoreCardRef, issueListRef, aiFixRef }) => {
    const navigate = useNavigate();

    if (!analysisResult) return null;

    return (
        <div className="rounded-lg shadow-sm border border-[#e2e8f0] dark:border-[#3f3f46] p-6">
            <div ref={scoreCardRef} className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                    분석 결과
                </h2>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreBadgeColor(analysisResult.aiScore)}`}>
                        {getSmellKeyword(analysisResult.aiScore).text}
                    </span>
                </div>
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
                <div ref={issueListRef}>
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
                {/* Suggestions */}
                {(() => {
                    // Check if isRagMode is explicitly provided (for new analysis w/ toggle state)
                    // If undefined, fallback to checking relatedAnalysisIds (legacy/historical view)
                    let showRagContext = isRagMode;

                    if (showRagContext === undefined) {
                         const refs = typeof analysisResult.relatedAnalysisIds === 'string' 
                            ? JSON.parse(analysisResult.relatedAnalysisIds) 
                            : analysisResult.relatedAnalysisIds;
                        showRagContext = refs && refs.length > 0;
                    }

                    return (
                        <div ref={aiFixRef}>
                            <h3 className="text-lg font-semibold text-green-600 mb-3">💡 개선 제안</h3>
                            <div className="space-y-4">
                                {analysisResult.suggestions && (typeof analysisResult.suggestions === 'string' ? JSON.parse(analysisResult.suggestions) : analysisResult.suggestions).map((suggestion, idx) => (
                                    <div key={idx} className="border border-[#e2e8f0] dark:border-[#3f3f46] rounded-lg overflow-hidden">
                                        <div className="p-3 border border-[#e2e8f0] dark:border-[#3f3f46] text-sm font-medium flex justify-between items-center">
                                            <span>제안 #{idx + 1}</span>
                                            {suggestion.habitContext && showRagContext && (
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
                    );
                })()}
            </div>

            {resolvedAnalysisId && (
                <div className="mt-6 pt-6 border-t border-[#e2e8f0] dark:border-[#3f3f46] p-6 flex justify-center gap-3 ">
                    <button
                        onClick={onNewAnalysis || (() => window.location.href = '/codeAnalysis/new')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        새로운 분석하기
                    </button>

                    <button
                        onClick={onShare || (() => navigate(`/codeboard/write/${resolvedAnalysisId}`))}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        분석결과 공유하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnalysisResultCard;
