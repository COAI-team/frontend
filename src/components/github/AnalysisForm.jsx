import React, { useState } from 'react';
import { useTheme } from "../../context/theme/useTheme";
import { Info } from 'lucide-react';

const analysisOptions = [
    { id: 'code_smell', label: 'Code Smells', desc: '코드의 나쁜 패턴과 냄새를 감지합니다' },
    { id: 'design_pattern', label: 'Design Patterns', desc: '디자인 패턴 활용도를 분석합니다' },
    { id: 'performance', label: 'Performance', desc: '성능 최적화 포인트를 찾습니다' },
    { id: 'best_practices', label: 'Best Practices', desc: '업계 표준 및 모범 사례를 검토합니다' },
    { id: 'security', label: 'Security', desc: '보안 취약점을 점검합니다' },
];

const toneLevels = [
    { level: 1, label: '매우 부드러움', desc: '격려와 유머를 곁들인 친근한 피드백', emoji: '😊' },
    { level: 2, label: '친근함', desc: '도움이 되고 가벼운 농담이 있는 톤', emoji: '🙂' },
    { level: 3, label: '중립적', desc: '전문적이고 균형잡힌 피드백 (권장)', emoji: '😐' },
    { level: 4, label: '엄격함', desc: '직설적이고 풍자적인 유머가 있는 톤', emoji: '😠' },
    { level: 5, label: '매우 엄격함', desc: '까다롭고 심술궂은 고양이 같은 톤', emoji: '😾' },
];

const AnalysisForm = ({ onSubmit, isLoading }) => {
    const { theme } = useTheme();
    const [selectedTypes, setSelectedTypes] = useState(['code_smell']);
    const [toneLevel, setToneLevel] = useState(3);
    const [customRequirements, setCustomRequirements] = useState('');

    // Hover states
    const [hoveredOption, setHoveredOption] = useState(null);
    const [hoveredTone, setHoveredTone] = useState(null);

    const handleTypeChange = (optionId) => {
        setSelectedTypes(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            analysisTypes: selectedTypes,
            toneLevel,
            customRequirements,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            {/* Analysis Types Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4">1. 분석 유형 선택</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {analysisOptions.map((option) => (
                        <div
                            key={option.id}
                            className={`relative transition-all duration-200 ${
                                hoveredOption === option.id ? 'z-[500]' : 'z-0'
                            }`}
                            onMouseEnter={() => setHoveredOption(option.id)}
                            onMouseLeave={() => setHoveredOption(null)}
                        >
                            <label
                                className={`flex items-start p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                    selectedTypes.includes(option.id)
                                        ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500'
                                        : theme === 'light'
                                            ? 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                            : 'border-gray-700 hover:border-indigo-700 hover:bg-gray-800'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.includes(option.id)}
                                    onChange={() => handleTypeChange(option.id)}
                                    className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                            {option.label}
                                        </span>
                                        <Info className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                                    </div>
                                </div>
                            </label>

                            {/* Floating Tooltip */}
                            {hoveredOption === option.id && (
                                <div className={`absolute z-[500] left-0 right-0 -top-16 mx-auto w-full p-3 rounded-lg shadow-xl transform transition-all duration-200 pointer-events-none ${
                                    theme === 'light' 
                                        ? 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700' 
                                        : 'bg-gray-800/90 backdrop-blur-sm border border-gray-700 text-gray-200'
                                }`}>
                                    <div className="text-sm text-center font-medium">
                                        {option.desc}
                                    </div>
                                    {/* Arrow */}
                                    <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 border-b border-r ${
                                        theme === 'light'
                                            ? 'bg-white border-gray-200'
                                            : 'bg-gray-800 border-gray-700'
                                    }`}></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tone Level Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4">2. 피드백 강도 선택</h3>
                <div className="space-y-3">
                    {toneLevels.map((tone) => (
                        <div
                            key={tone.level}
                            className={`relative transition-all duration-200 ${
                                hoveredTone === tone.level ? 'z-[500]' : 'z-0'
                            }`}
                            onMouseEnter={() => setHoveredTone(tone.level)}
                            onMouseLeave={() => setHoveredTone(null)}
                        >
                            <label
                                className={`flex items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                    toneLevel === tone.level
                                        ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500'
                                        : theme === 'light'
                                            ? 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                            : 'border-gray-700 hover:border-indigo-700 hover:bg-gray-800'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="tone"
                                    checked={toneLevel === tone.level}
                                    onChange={() => setToneLevel(tone.level)}
                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{tone.emoji}</span>
                                            <span className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                {tone.label}
                                            </span>
                                        </div>
                                        <Info className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                                    </div>
                                </div>
                            </label>

                            {/* Floating Tooltip */}
                            {hoveredTone === tone.level && (
                                <div className={`absolute z-[500] left-0 right-0 -top-16 mx-auto w-full p-3 rounded-lg shadow-xl transform transition-all duration-200 pointer-events-none ${
                                    theme === 'light' 
                                        ? 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700' 
                                        : 'bg-gray-800/90 backdrop-blur-sm border border-gray-700 text-gray-200'
                                }`}>
                                    <div className="text-sm text-center font-medium">
                                        {tone.desc}
                                    </div>
                                    {/* Arrow */}
                                    <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 border-b border-r ${
                                        theme === 'light'
                                            ? 'bg-white border-gray-200'
                                            : 'bg-gray-800 border-gray-700'
                                    }`}></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Requirements Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4">3. 추가 요구사항 (선택사항)</h3>
                <textarea
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    rows="3"
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        theme === 'light'
                            ? 'bg-gray-50 border-gray-300 text-gray-900'
                            : 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    }`}
                    placeholder="예: 변수명 컨벤션과 매직 넘버를 중점적으로 검토해주세요"
                />
            </div>
            
            <button
                type="submit"
                disabled={isLoading || selectedTypes.length === 0}
                className="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors shadow-md"
            >
                {isLoading ? '분석 중...' : '분석 시작'}
            </button>
        </form>
    );
};

export default AnalysisForm;
