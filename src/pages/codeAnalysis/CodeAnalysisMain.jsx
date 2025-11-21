import { useState } from 'react';
import { useTheme } from 'next-themes';
import CodeAnalysisModal from '../../components/codenose/CodeAnalysisModal';

const CodeAnalysisMain = () => {
    const { theme } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
            <div className="container mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className={`text-5xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        AI 코드 분석
                    </h1>
                    <p className={`text-xl ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        GitHub 레포지토리의 코드를 AI가 분석하여 개선점을 제안합니다
                    </p>
                </div>

                {/* Action Button */}
                <div className="flex justify-center mb-16">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                        새 분석 시작하기
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg`}>
                        <div className="text-3xl mb-4">🔍</div>
                        <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            코드 스멜 감지
                        </h3>
                        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            잠재적인 문제와 개선이 필요한 패턴을 자동으로 찾아냅니다.
                        </p>
                    </div>

                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg`}>
                        <div className="text-3xl mb-4">⚡</div>
                        <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            성능 최적화
                        </h3>
                        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            성능을 향상시킬 수 있는 구체적인 방법을 제시합니다.
                        </p>
                    </div>

                    <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg`}>
                        <div className="text-3xl mb-4">🎯</div>
                        <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            맞춤 분석
                        </h3>
                        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            분석 강도와 집중 영역을 자유롭게 선택할 수 있습니다.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <h2 className={`text-3xl font-bold text-center mb-12 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        분석 진행 과정
                    </h2>
                    <div className="space-y-6">
                        {[
                            { step: 1, title: 'GitHub ID 입력', desc: 'GitHub 사용자명을 입력하여 레포지토리 목록을 조회합니다.' },
                            { step: 2, title: 'Repository 선택', desc: '분석하고 싶은 레포지토리를 선택합니다.' },
                            { step: 3, title: '파일 선택', desc: '폴더 구조를 탐색하여 분석할 파일을 선택합니다.' },
                            { step: 4, title: '분석 옵션 설정', desc: '분석 강도, 집중 영역, 추가 요구사항을 설정합니다.' },
                            { step: 5, title: '결과 확인', desc: 'AI가 생성한 상세한 분석 결과와 개선 제안을 확인합니다.' }
                        ].map((item) => (
                            <div
                                key={item.step}
                                className={`flex items-start gap-4 p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow`}
                            >
                                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                                    {item.step}
                                </div>
                                <div>
                                    <h4 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {item.title}
                                    </h4>
                                    <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <CodeAnalysisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default CodeAnalysisMain;
