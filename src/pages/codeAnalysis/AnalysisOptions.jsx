import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import axiosInstance from '../../server/AxiosConfig';

const AnalysisOptions = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    // Get data from navigation state
    const { analysisId, repositoryUrl, filePath, fileContent, repoName } = location.state || {};

    // Analysis options state
    const [analysisTypes, setAnalysisTypes] = useState(['code_smell']);
    const [toneLevel, setToneLevel] = useState(3);
    const [customRequirements, setCustomRequirements] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    // Analysis type options
    const analysisOptions = [
        { id: 'code_smell', label: 'Code Smells', desc: '코드의 나쁜 패턴과 냄새를 감지합니다' },
        { id: 'design_pattern', label: 'Design Patterns', desc: '디자인 패턴 활용도를 분석합니다' },
        { id: 'performance', label: 'Performance', desc: '성능 최적화 포인트를 찾습니다' },
        { id: 'best_practices', label: 'Best Practices', desc: '업계 표준 및 모범 사례를 검토합니다' },
        { id: 'security', label: 'Security', desc: '보안 취약점을 점검합니다' },
    ];

    // Tone level descriptions
    const toneLevels = [
        { level: 1, label: '매우 부드러움', desc: '격려와 유머를 곁들인 친근한 피드백', emoji: '😊' },
        { level: 2, label: '친근함', desc: '도움이 되고 가벼운 농담이 있는 톤', emoji: '🙂' },
        { level: 3, label: '중립적', desc: '전문적이고 균형잡힌 피드백 (권장)', emoji: '😐' },
        { level: 4, label: '엄격함', desc: '직설적이고 풍자적인 유머가 있는 톤', emoji: '😠' },
        { level: 5, label: '매우 엄격함', desc: '까다롭고 심술궂은 고양이 같은 톤', emoji: '😾' },
    ];

    // Handle analysis type checkbox change
    const handleTypeChange = (typeId) => {
        setAnalysisTypes(prev =>
            prev.includes(typeId)
                ? prev.filter(t => t !== typeId)
                : [...prev, typeId]
        );
    };

    // Submit analysis request
    const handleSubmitAnalysis = async () => {
        if (analysisTypes.length === 0) {
            setError('최소 하나의 분석 유형을 선택해주세요.');
            return;
        }

        setIsAnalyzing(true);
        setError('');

        try {
            // API: POST /api/analysis/analyze-stored
            const response = await axiosInstance.post('/analysis/analyze-stored', {
                repositoryUrl,
                filePath,
                fileContent,
                analysisTypes,
                toneLevel,
                customRequirements,
                analysisId,
                userId: 1 // TODO: Get from auth context
            });

            console.log('Analysis response:', response.data);

            // Navigate to results page with analysis data
            navigate('/code-analysis/result', {
                state: {
                    analysisResult: response.data.data || response.data,
                    repoName,
                    filePath,
                    toneLevel
                }
            });
        } catch (err) {
            console.error('Analysis failed:', err);
            setError('분석 요청에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Redirect if no state data
    if (!analysisId || !fileContent) {
        return (
            <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
                <div className="text-center">
                    <p className={`text-xl mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        잘못된 접근입니다.
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

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'} py-12`}>
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-4xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        분석 옵션 설정
                    </h1>
                    <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {repoName} / {filePath}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Analysis Types Section */}
                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg`}>
                        <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            1. 분석 유형 선택
                        </h2>
                        <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            중점적으로 분석할 항목을 선택하세요 (복수 선택 가능)
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            {analysisOptions.map((option) => (
                                <label
                                    key={option.id}
                                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        analysisTypes.includes(option.id)
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : theme === 'light'
                                                ? 'border-gray-300 hover:border-gray-400'
                                                : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={analysisTypes.includes(option.id)}
                                        onChange={() => handleTypeChange(option.id)}
                                        className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <div className="ml-3">
                                        <div className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                            {option.label}
                                        </div>
                                        <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {option.desc}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Tone Level Section */}
                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg`}>
                        <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            2. 피드백 강도 선택
                        </h2>
                        <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            AI의 피드백 톤을 선택하세요
                        </p>
                        <div className="space-y-3">
                            {toneLevels.map((tone) => (
                                <label
                                    key={tone.level}
                                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        toneLevel === tone.level
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : theme === 'light'
                                                ? 'border-gray-300 hover:border-gray-400'
                                                : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="tone"
                                        checked={toneLevel === tone.level}
                                        onChange={() => setToneLevel(tone.level)}
                                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{tone.emoji}</span>
                                            <span className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                {tone.label}
                                            </span>
                                        </div>
                                        <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {tone.desc}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Custom Requirements Section */}
                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg`}>
                        <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            3. 추가 요구사항 (선택사항)
                        </h2>
                        <p className={`mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            특별히 집중해서 분석해야 할 부분이 있다면 입력해주세요
                        </p>
                        <textarea
                            value={customRequirements}
                            onChange={(e) => setCustomRequirements(e.target.value)}
                            rows="4"
                            placeholder="예: 변수명 컨벤션과 매직 넘버를 중점적으로 검토해주세요"
                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                theme === 'light'
                                    ? 'bg-gray-50 border-gray-300 text-gray-900'
                                    : 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            }`}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/code-analysis')}
                            className={`flex-1 px-6 py-4 rounded-lg font-semibold ${
                                theme === 'light'
                                    ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            } transition-colors`}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmitAnalysis}
                            disabled={isAnalyzing || analysisTypes.length === 0}
                            className="flex-1 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {isAnalyzing ? '분석 중...' : '분석 시작'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisOptions;
