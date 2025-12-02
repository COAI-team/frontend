import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const AnalysisResult = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

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
            <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
                <div className="text-center">
                    <p className={`text-xl mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        분석 결과를 찾을 수 없습니다.
                    </p>
                    <button
                        onClick={() => navigate('/code-analysis')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        코드분석 홈으로
                    </button>
                </div>
            </div>
        );
    }

    const { aiScore, codeSmells = [], suggestions = [] } = parsedResult;

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Get tone level emoji
    const getToneEmoji = (level) => {
        const emojis = { 1: '😊', 2: '🙂', 3: '😐', 4: '😠', 5: '😾' };
        return emojis[level] || '😐';
    };

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'} py-12`}>
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className={`text-4xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            분석 결과
                        </h1>
                        <button
                            onClick={() => navigate('/code-analysis')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            새 분석 시작
                        </button>
                    </div>
                    <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {repoName} / {filePath}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            피드백 강도:
                        </span>
                        <span className="text-2xl">{getToneEmoji(toneLevel)}</span>
                    </div>
                </div>

                {/* AI Score */}
                <div className={`p-8 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg mb-8`}>
                    <div className="text-center">
                        <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            AI 평가 점수
                        </h2>
                        <div className={`text-7xl font-bold mb-2 ${getScoreColor(aiScore)}`}>
                            {aiScore}
                        </div>
                        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            / 100점
                        </p>
                        {aiScore >= 80 && (
                            <p className="mt-4 text-green-500 font-semibold">
                                훌륭한 코드입니다!
                            </p>
                        )}
                        {aiScore >= 60 && aiScore < 80 && (
                            <p className="mt-4 text-yellow-500 font-semibold">
                                양호한 코드이지만 개선의 여지가 있습니다.
                            </p>
                        )}
                        {aiScore < 60 && (
                            <p className="mt-4 text-red-500 font-semibold">
                                개선이 필요한 부분이 많습니다.
                            </p>
                        )}
                    </div>
                </div>

                {/* Code Smells */}
                {codeSmells.length > 0 && (
                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg mb-8`}>
                        <div className="flex items-center gap-3 mb-6">
                            <XCircleIcon className="w-8 h-8 text-red-500" />
                            <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
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
                                    <h3 className={`font-bold mb-2 ${theme === 'light' ? 'text-red-900' : 'text-red-400'}`}>
                                        {smell.name}
                                    </h3>
                                    <p className={theme === 'light' ? 'text-red-800' : 'text-red-300'}>
                                        {smell.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg mb-8`}>
                        <div className="flex items-center gap-3 mb-6">
                            <LightBulbIcon className="w-8 h-8 text-yellow-500" />
                            <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                개선 제안
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`p-5 rounded-lg border ${
                                        theme === 'light'
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-blue-900/20 border-blue-800'
                                    }`}
                                >
                                    <h3 className={`font-bold mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-blue-900' : 'text-blue-400'}`}>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        제안 {index + 1}
                                    </h3>

                                    {suggestion.problematicSnippet && (
                                        <div className="mb-4">
                                            <p className={`text-sm font-semibold mb-2 ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>
                                                문제가 있는 코드:
                                            </p>
                                            <pre className={`p-3 rounded text-sm overflow-x-auto ${
                                                theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-gray-300'
                                            }`}>
                                                {suggestion.problematicSnippet}
                                            </pre>
                                        </div>
                                    )}

                                    {suggestion.proposedReplacement && (
                                        <div>
                                            <p className={`text-sm font-semibold mb-2 ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>
                                                개선된 코드:
                                            </p>
                                            <pre className={`p-3 rounded text-sm overflow-x-auto ${
                                                theme === 'light' ? 'bg-green-100 text-gray-900' : 'bg-green-900/30 text-gray-300'
                                            }`}>
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
                    <div className={`p-8 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg text-center`}>
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            완벽합니다!
                        </h3>
                        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            특별한 문제점이나 개선사항이 발견되지 않았습니다.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => window.print()}
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
