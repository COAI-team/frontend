import { ALGO_LEVEL_INFO } from '../../../service/algorithm/AlgorithmApi';

/**
 * 사용자 알고리즘 레벨 표시 컴포넌트
 * - 레벨 뱃지 (EMERALD/SAPPHIRE/RUBY/DIAMOND)
 * - 현재 XP / 총 XP
 * - 연속 풀이 스트릭
 * - 다음 레벨까지 진행률 (XP 기반)
 *
 * 변경사항 (2025-12-17): XP 기반 레벨 시스템 도입
 * - totalSolved 대신 totalXp 기반 진행률 표시
 * - 레벨 임계값: EMERALD(0), SAPPHIRE(300), RUBY(1000), DIAMOND(3000)
 */
const UserLevelBadge = ({ userLevel }) => {
    if (!userLevel) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    나의 레벨
                </h3>
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded-full w-12 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
            </div>
        );
    }

    const { algoLevel, totalXp = 0, totalSolved, currentStreak, maxStreak } = userLevel;
    const levelInfo = ALGO_LEVEL_INFO[algoLevel] || ALGO_LEVEL_INFO.EMERALD;

    // 다음 레벨 계산 (XP 기반)
    const getNextLevelInfo = () => {
        const levels = ['EMERALD', 'SAPPHIRE', 'RUBY', 'DIAMOND'];
        const currentIndex = levels.indexOf(algoLevel);

        if (currentIndex === levels.length - 1) {
            return null; // 최고 레벨
        }

        const nextLevel = levels[currentIndex + 1];
        const nextLevelInfo = ALGO_LEVEL_INFO[nextLevel];
        return {
            level: nextLevel,
            info: nextLevelInfo,
            remainingXp: nextLevelInfo.requiredXp - totalXp
        };
    };

    const nextLevel = getNextLevelInfo();

    // 현재 레벨 내 진행률 계산 (XP 기반)
    const getProgressPercent = () => {
        if (!nextLevel) return 100; // 최고 레벨

        const currentMin = levelInfo.requiredXp;
        const nextMin = nextLevel.info.requiredXp;
        const progress = totalXp - currentMin;
        const total = nextMin - currentMin;

        return Math.min((progress / total) * 100, 100);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                나의 레벨
            </h3>

            {/* 레벨 뱃지 */}
            <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${levelInfo.bgColor} mb-3`}>
                    <span className="text-4xl">{levelInfo.icon}</span>
                </div>
                <div className={`text-xl font-bold ${levelInfo.textColor}`}>
                    {levelInfo.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                    미션 보상: +{levelInfo.rewardPoints}P
                </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="text-center p-2 bg-gray-50 rounded-md">
                    <div className="text-lg font-bold text-blue-600">
                        {totalXp.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                        총 XP
                    </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-md">
                    <div className="text-lg font-bold text-orange-500">
                        {currentStreak}일
                    </div>
                    <div className="text-xs text-gray-500">
                        연속
                    </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-md">
                    <div className="text-lg font-bold text-gray-600">
                        {totalSolved}
                    </div>
                    <div className="text-xs text-gray-500">
                        총 풀이
                    </div>
                </div>
            </div>

            {/* 다음 레벨 진행률 */}
            {nextLevel ? (
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">
                            다음 레벨까지
                        </span>
                        <span className={nextLevel.info.textColor}>
                            {nextLevel.info.name}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500`}
                            style={{
                                width: `${getProgressPercent()}%`,
                                backgroundColor: getProgressBarColor(algoLevel)
                            }}
                        ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center">
                        {nextLevel.remainingXp.toLocaleString()} XP 더 모으면 레벨업!
                    </div>
                </div>
            ) : (
                <div className="text-center py-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-md">
                    <span className="text-cyan-600 font-medium">
                        최고 레벨 달성!
                    </span>
                </div>
            )}

            {/* 레벨 안내 */}
            <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-400 text-center">
                    XP 기준: EMERALD(0) → SAPPHIRE(300) → RUBY(1000) → DIAMOND(3000)
                </div>
            </div>
        </div>
    );
};

/**
 * 레벨에 따른 진행 바 색상
 */
const getProgressBarColor = (level) => {
    switch (level) {
        case 'EMERALD':
            return '#10b981'; // emerald-500
        case 'SAPPHIRE':
            return '#3b82f6'; // blue-500
        case 'RUBY':
            return '#ef4444'; // red-500
        case 'DIAMOND':
            return '#06b6d4'; // cyan-500
        default:
            return '#10b981';
    }
};

export default UserLevelBadge;
