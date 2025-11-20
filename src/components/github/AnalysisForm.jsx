import React, { useState } from 'react';

const analysisOptions = [
    { id: 'code_smell', label: 'Code Smells' },
    { id: 'design_pattern', label: 'Design Patterns' },
    { id: 'performance', label: 'Performance' },
    { id: 'readability', label: 'Readability' },
    { id: 'security', label: 'Security Vulnerabilities' },
];

const toneLevels = [
    { level: 1, label: 'Gentle' },
    { level: 2, label: 'Friendly' },
    { level: 3, label: 'Neutral' },
    { level: 4, label: 'Strict' },
    { level: 5, label: 'Grumpy Cat' },
];

const AnalysisForm = ({ onSubmit, isLoading }) => {
    const [selectedTypes, setSelectedTypes] = useState(['code_smell']);
    const [toneLevel, setToneLevel] = useState(3);
    const [customRequirements, setCustomRequirements] = useState('');

    const handleTypeChange = (e) => {
        const { value, checked } = e.target;
        setSelectedTypes(prev =>
            checked ? [...prev, value] : prev.filter(item => item !== value)
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
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
                <h3 className="text-lg font-semibold">4. Select Analysis Focus</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                    {analysisOptions.map(opt => (
                        <label key={opt.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                value={opt.id}
                                checked={selectedTypes.includes(opt.id)}
                                onChange={handleTypeChange}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold">5. Set Review Tone</h3>
                <div className="mt-2 space-y-1">
                    {toneLevels.map(item => (
                        <label key={item.level} className="flex items-center space-x-3">
                             <input
                                type="radio"
                                name="tone"
                                value={item.level}
                                checked={toneLevel === item.level}
                                onChange={(e) => setToneLevel(parseInt(e.target.value))}
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold">6. Custom Requirements (Optional)</h3>
                <textarea
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    rows="3"
                    className="w-full mt-2 p-2 border rounded bg-gray-700 text-white"
                    placeholder="e.g., 'Focus on variable naming conventions.'"
                />
            </div>
            
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 disabled:bg-gray-500"
            >
                {isLoading ? 'Analyzing...' : 'Analyze Code'}
            </button>
        </form>
    );
};

export default AnalysisForm;
