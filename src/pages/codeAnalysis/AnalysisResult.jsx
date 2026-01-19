import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from "../../context/theme/useTheme";
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { getScoreColor, getSmellKeyword, getToneEmoji } from '../../utils/codeAnalysisUtils';

const AnalysisResult = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const { aiScore, codeSmells = [], suggestions = [], styleAnalysis } = parsedResult;

    const smellInfo = getSmellKeyword(aiScore);

    // Get data from navigation state
    const { analysisResult, repoName, filePath, toneLevel } = location.state || {};

    // Parse analysis result if it's a string
    let parsedResult = null;
    try {
        if (analysisResult && analysisResult.Data) {
            parsedResult = typeof analysisResult.Data === 'string'
                ? JSON.parse(analysisResult.Data)
                : analysisResult.Data;
        }
    } catch (err) {
        console.error('Failed to parse analysis result:', err);
    }

    // Redirect if no data
    if (!analysisResult || !parsedResult) {
        return (
            <div className={`min-h-screen flex items-center justify-center`}>
                <div className="text-center">
                    <p className={`text-xl mb-4`}>
                        분석 결과를 찾을 수 없습니다.
                    </p>
                    <button
                        onClick={() => navigate('/code-analysis')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                        코드분석 홈으로
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-12`}>
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className={`text-4xl font-bold`}>
                            분석 결과
                        </h1>
                        <button
                            onClick={() => navigate('/code-analysis')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            새 분석 시작
                        </button>
                    </div>
                    <p className={`text-lg`}>
                        {repoName} / {filePath}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-600">
                            피드백 강도:
                        </span>
                        <span className="text-2xl">{getToneEmoji(toneLevel)}</span>
                    </div>
                </div>

                {/* AI Score (Smell Keyword) */}
                <div className={`p-8 rounded-lg shadow-lg mb-8`}>
                    <div className="text-center">
                        <h2 className={`text-2xl font-bold mb-6`}>
                            AI 코드 냄새 판독
                        </h2>
                        
                        {/* Keyword Display */}
                        <div className={`text-5xl md:text-6xl font-bold mb-4 ${getScoreColor(aiScore)} transition-colors duration-300`}>
                            {smellInfo.text}
                        </div>
                        
                        {/* Description */}
                        <p className={`text-xl font-medium mb-6`}>
                            {smellInfo.desc}
                        </p>
                    </div>
                </div>

                {/* Coding DNA / Style Analysis */}
                {styleAnalysis && (
                    <div className={`p-8 rounded-lg shadow-lg mb-8 border ${
                        theme === 'light' 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' 
                            : 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-800'
                    }`}>
                        <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3`}>
                            <span className="text-3xl">🧬</span>
                            <div>
                                My Coding DNA
                                <span className="block text-sm font-normal text-gray-500 mt-1">
                                    AI가 분석한 당신의 코딩 스타일입니다.
                                </span>
                            </div>
                        </h2>
                        
                        {/* Summary */}
                        {styleAnalysis.summary && (
                            <div className={`mb-8 p-4 rounded-lg ${
                                theme === 'light' ? 'bg-white/60' : 'bg-black/20'
                            }`}>
                                <p className={`text-lg font-medium leading-relaxed ${
                                    theme === 'light' ? 'text-indigo-900' : 'text-indigo-200'
                                }`}>
                                    "{styleAnalysis.summary}"
                                </p>
                            </div>
                        )}

                        {/* Style Grid */}
                        {styleAnalysis.styleProfile && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(styleAnalysis.styleProfile).map(([key, value]) => (
                                    <div 
                                        key={key} 
                                        className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                                            theme === 'light'
                                                ? 'bg-white border-blue-100 hover:border-blue-300'
                                                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                        }`}
                                    >
                                        <h3 className={`text-xs uppercase tracking-wider font-bold mb-2 opacity-70 ${
                                            theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                                        }`}>
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </h3>
                                        <p className={`text-sm font-medium leading-relaxed ${
                                            theme === 'light' ? 'text-gray-800' : 'text-gray-200'
                                        }`}>
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Code Smells */}
                {codeSmells.length > 0 && (
                    <div className={`p-6 rounded-lg shadow-lg mb-8`}>
                        <div className="flex items-center gap-3 mb-6">
                            <XCircleIcon className="w-8 h-8 text-red-500" />
                            <h2 className={`text-2xl font-bold`}>
                                발견된 문제점
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {codeSmells.map((smell, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border ${
                                        theme === 'light'
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-red-900/20 border-red-800'
                                    }`}
                                >
                                    <h3 className={`font-bold mb-2`}>
                                        {smell.name}
                                    </h3>
                                    <p className="text-red-800">
                                        {smell.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className={`p-6 rounded-lg shadow-lg mb-8`}>
                        <div className="flex items-center gap-3 mb-6">
                            <LightBulbIcon className="w-8 h-8 text-yellow-500" />
                            <h2 className={`text-2xl font-bold`}>
                                개선 제안
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`p-5 rounded-lg border`}
                                >
                                    <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        제안 {index + 1}
                                    </h3>

                                    {suggestion.problematicSnippet && (
                                        <div className="mb-4">
                                            <p className={`text-sm font-semibold mb-2`}>
                                                문제가 있는 코드:
                                            </p>
                                            <pre className={`p-3 rounded text-sm overflow-x-auto `}>
                                                {suggestion.problematicSnippet}
                                            </pre>
                                        </div>
                                    )}

                                    {suggestion.proposedReplacement && (
                                        <div>
                                            <p className={`text-sm font-semibold mb-2`}>
                                                개선된 코드:
                                            </p>
                                            <pre className={`p-3 rounded text-sm overflow-x-auto `}>
                                                {suggestion.proposedReplacement}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Issues Found */}
                {codeSmells.length === 0 && suggestions.length === 0 && (
                    <div className={`p-8 rounded-lg shadow-lg text-center`}>
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className={`text-2xl font-bold mb-2`}>
                            완벽합니다!
                        </h3>
                        <p className="text-gray-600">
                            특별한 문제점이나 개선사항이 발견되지 않았습니다.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => globalThis.print()}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold ${
                            theme === 'light'
                                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                        } transition-colors`}
                    >
                        결과 인쇄
                    </button>
                    <button
                        onClick={() => navigate('/code-analysis')}
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        다른 파일 분석하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisResult;
