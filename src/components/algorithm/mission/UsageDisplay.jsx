import { Link } from 'react-router-dom';

/**
 * 사용량 제한 표시 컴포넌트
 * - 무료 사용자: 일일 사용량 / 한도 표시 + 진행바
 * - 구독자: 무제한 표시
 */
const UsageDisplay = ({ usageInfo }) => {
    if (!usageInfo) {
        return (
            <div className="rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-[#e2e8f0] dark:border-[#2e2e2e] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    오늘의 사용량
                </h3>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
                </div>
            </div>
        );
    }

    const { generateCount, solveCount, analysisCount = 0, totalUsage, remaining, isSubscriber } = usageInfo;
    const dailyLimit = 3; // 무료 사용자 일일 한도
    const usagePercent = isSubscriber ? 0 : Math.min((totalUsage / dailyLimit) * 100, 100);

    return (
        <div className="rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-[#e2e8f0] dark:border-[#2e2e2e] p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    오늘의 사용량
                </h3>
                {isSubscriber && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-medium rounded-full">
                        Premium
                    </span>
                )}
            </div>

            {isSubscriber ? (
                // 구독자 표시
                <div className="text-center py-4">
                    <div className="text-3xl mb-2">∞</div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">무제한 이용 가능</p>
                    <p className="text-sm text-gray-400 mt-1">
                        프리미엄 회원 혜택
                    </p>
                </div>
            ) : (
                // 무료 사용자 표시
                <>
                    {/* 사용량 바 */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">
                                {totalUsage} / {dailyLimit} 회 사용
                            </span>
                            <span className={`font-medium ${
                                remaining === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                                {remaining > 0 ? `${remaining}회 남음` : '한도 도달'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                    remaining === 0 ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* 사용량 상세 */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-md p-3">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {generateCount}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                문제 생성
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-md p-3">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {solveCount}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                문제 풀이
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-md p-3">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {analysisCount}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                코드 분석
                            </div>
                        </div>
                    </div>

                    {/* 한도 초과 시 구독 안내 */}
                    {remaining === 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                일일 무료 사용량을 모두 사용했습니다.
                            </p>
                            <Link
                                to="/pricing"
                                className="text-sm text-yellow-600 dark:text-yellow-500 hover:text-yellow-800 dark:hover:text-yellow-300 font-medium underline mt-1 inline-block"
                            >
                                구독권 업그레이드하러 가기 →
                            </Link>
                        </div>
                    )}
                </>
            )}

            {/* 안내 문구 */}
            <div className="mt-4 pt-4 border-t border-[#e2e8f0] dark:border-[#2e2e2e] text-xs text-gray-400 text-center">
                사용량은 매일 자정에 초기화됩니다
            </div>
        </div>
    );
};

export default UsageDisplay;
