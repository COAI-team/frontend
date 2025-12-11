import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    getTodayMissions,
    getUsageInfo,
    getUserLevel,
    getSolveBonusStatus,
    MISSION_TYPE_INFO,
    DIFFICULTY_OPTIONS
} from '../../service/algorithm/AlgorithmApi';
import UsageDisplay from '../../components/algorithm/mission/UsageDisplay';
import UserLevelBadge from '../../components/algorithm/mission/UserLevelBadge';
import { useLogin } from '../../context/login/useLogin';

const DailyMission = () => {
    // ===== 로그인 상태 확인 =====
    const { user, hydrated, accessToken } = useLogin();
    const isLoggedIn = !!user;

    // 디버깅 로그
    console.log('🔍 [DailyMission] 상태 확인:', {
        hydrated,
        isLoggedIn,
        user: user ? { id: user.userId, email: user.userEmail } : null,
        hasAccessToken: !!accessToken,
        localStorageAuth: !!localStorage.getItem('auth')
    });

    // ===== 상태 관리 =====
    const [missions, setMissions] = useState([]);
    const [usageInfo, setUsageInfo] = useState(null);
    const [userLevel, setUserLevel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [bonusStatusMap, setBonusStatusMap] = useState({});

    const navigate = useNavigate();

    const fetchBonusStatuses = useCallback(async (missionList) => {
        const targets = missionList.filter(
            (m) => m.missionType === 'PROBLEM_SOLVE' && m.problemId
        );
        if (targets.length === 0) {
            setBonusStatusMap({});
            return;
        }

        try {
            const results = await Promise.all(
                targets.map(async (m) => {
                    const res = await getSolveBonusStatus(m.problemId);
                    if (res?.error && !res.data) return null;
                    return {
                        key: m.missionId || m.problemId,
                        data: res.data || res
                    };
                })
            );

            const map = {};
            results.forEach((item) => {
                if (item?.key && item.data) {
                    map[item.key] = item.data;
                }
            });
            setBonusStatusMap(map);
        } catch (e) {
            console.error('보너스 상태 조회 실패:', e);
        }
    }, []);

    // ===== 데이터 로딩 =====
    const loadData = useCallback(async (showRefreshing = false) => {
        // 로그인 체크
        if (!isLoggedIn || !user?.userId) {
            setLoading(false);
            return;
        }

        const userId = user.userId;

        try {
            if (showRefreshing) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            console.log('📡 [DailyMission] 데이터 로딩 시작 - userId:', userId);

            // 병렬로 데이터 로딩 (testUserId 전달)
            const [missionsResult, usageResult, levelResult] = await Promise.all([
                getTodayMissions(userId),
                getUsageInfo(userId),
                getUserLevel(userId)
            ]);

            console.log('📊 [DailyMission] API 응답:', {
                missions: missionsResult,
                usage: usageResult,
                level: levelResult
            });

            // 미션 데이터 설정
            if (missionsResult.error) {
                console.warn('미션 로딩 실패:', missionsResult.message);
            } else {
                const missionData = missionsResult.data || [];
                setMissions(missionData);
                fetchBonusStatuses(missionData);
            }

            // 사용량 데이터 설정
            if (usageResult.error) {
                console.warn('사용량 로딩 실패:', usageResult.message);
            } else {
                console.log('✅ [DailyMission] 사용량 데이터:', usageResult.data);
                setUsageInfo(usageResult.data);
            }

            // 레벨 데이터 설정
            if (levelResult.error) {
                console.warn('레벨 로딩 실패:', levelResult.message);
            } else {
                console.log('✅ [DailyMission] 레벨 데이터:', levelResult.data);
                setUserLevel(levelResult.data);
            }

            setLastUpdated(new Date());

        } catch (err) {
            console.error('데이터 로딩 에러:', err);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [isLoggedIn, user, fetchBonusStatuses]);

    // 수동 새로고침 핸들러
    const handleRefresh = () => {
        loadData(true);
    };

    // hydrated 상태와 로그인 상태가 확인되면 데이터 로딩
    useEffect(() => {
        if (hydrated) {
            loadData();
        }
    }, [hydrated, loadData]);

    // 🔄 페이지 포커스 시 데이터 새로고침 (미션 완료 후 돌아왔을 때)
    useEffect(() => {
        const handleFocus = () => {
            if (hydrated && isLoggedIn) {
                console.log('🔄 페이지 포커스 - 데이터 새로고침');
                loadData();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && hydrated && isLoggedIn) {
                console.log('🔄 탭 활성화 - 데이터 새로고침');
                loadData();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [hydrated, isLoggedIn, loadData]);

    // ===== 미션 카드 클릭 핸들러 =====
    const handleMissionClick = (mission) => {
        if (mission.completed) return;

        const typeInfo = MISSION_TYPE_INFO[mission.missionType];
        if (mission.missionType === 'PROBLEM_GENERATE') {
            navigate(typeInfo.link);
        } else if (mission.missionType === 'PROBLEM_SOLVE' && mission.problemId) {
            navigate(`${typeInfo.linkPrefix}${mission.problemId}`);
        }
    };

    // ===== 난이도 라벨 가져오기 =====
    const getDifficultyLabel = (difficulty) => {
        const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
        return option ? option.label : difficulty;
    };

    // ===== 완료된 미션 수 계산 =====
    const completedCount = missions.filter(m => m.completed).length;
    const totalMissions = missions.length;

    // ===== 렌더링 =====

    // hydration 완료 전 또는 로딩 중 표시
    if (!hydrated || loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-muted">데이터를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-main mb-2">
                                오늘의 미션
                            </h1>
                            <p className="text-muted">
                                매일 미션을 완료하고 포인트를 획득하세요!
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                                    isRefreshing
                                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                                {isRefreshing ? '새로고침 중...' : '새로고침'}
                            </button>
                            {lastUpdated && (
                                <span className="text-xs text-muted">
                                    마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 에러 상태 */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-6">
                        <p className="font-medium">오류가 발생했습니다</p>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={loadData}
                            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {!error && (
                    <>
                        {/* 상단 정보 카드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* 레벨 정보 */}
                            <UserLevelBadge userLevel={userLevel} />

                            {/* 사용량 정보 */}
                            <UsageDisplay usageInfo={usageInfo} />
                        </div>

                        {/* 미션 진행 상황 */}
                        <div className="bg-panel rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-main">
                                    미션 진행률
                                </h2>
                                <span className="text-sm text-muted">
                                    {completedCount} / {totalMissions} 완료
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: totalMissions > 0
                                            ? `${(completedCount / totalMissions) * 100}%`
                                            : '0%'
                                    }}
                                ></div>
                            </div>
                            {completedCount === totalMissions && totalMissions > 0 && (
                                <p className="mt-3 text-center text-green-600 dark:text-green-400 font-medium">
                                    오늘의 모든 미션을 완료했습니다!
                                </p>
                            )}
                        </div>

                        {/* 미션 목록 */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-main">
                                오늘의 미션 목록
                            </h2>

                            {missions.length === 0 ? (
                                <div className="bg-panel rounded-lg shadow-sm border dark:border-gray-700 p-8 text-center">
                                    <p className="text-muted">
                                        오늘의 미션이 없습니다.
                                    </p>
                                </div>
                            ) : (
                                missions.map((mission, index) => {
                                    const typeInfo = MISSION_TYPE_INFO[mission.missionType] || {};
                                    const isCompleted = mission.completed;

                                    return (
                                        <div
                                            key={mission.missionId || index}
                                            onClick={() => handleMissionClick(mission)}
                                            className={`bg-panel rounded-lg shadow-sm border dark:border-gray-700 p-6 transition-all ${
                                                isCompleted
                                                    ? 'opacity-70 cursor-default'
                                                    : 'hover:shadow-md cursor-pointer hover:border-blue-300 dark:hover:border-blue-500'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    {/* 아이콘 */}
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                                        isCompleted
                                                            ? 'bg-green-100 dark:bg-green-900/30'
                                                            : 'bg-blue-100 dark:bg-blue-900/30'
                                                    }`}>
                                                        {isCompleted ? '✅' : typeInfo.icon}
                                                    </div>

                                                    {/* 미션 정보 */}
                                                    <div>
                                                        <h3 className={`font-semibold text-lg ${
                                                            isCompleted
                                                                ? 'text-muted line-through'
                                                                : 'text-main'
                                                        }`}>
                                                            {typeInfo.name || mission.missionType}
                                                        </h3>
                                                        <p className="text-muted text-sm mt-1">
                                                            {typeInfo.description}
                                                        </p>

                                                        {/* 문제 정보 (PROBLEM_SOLVE인 경우) */}
                                                        {mission.missionType === 'PROBLEM_SOLVE' && mission.problemTitle && (
                                                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                                <p className="text-sm text-sub">
                                                                    <span className="font-medium">문제:</span> {mission.problemTitle}
                                                                </p>
                                                                {mission.problemDifficulty && (
                                                                    <p className="text-sm text-muted">
                                                                        <span className="font-medium">난이도:</span>{' '}
                                                                        {getDifficultyLabel(mission.problemDifficulty)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 보상 포인트 */}
                                                <div className="text-right">
                                                    <div className={`text-lg font-bold ${
                                                        isCompleted
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-yellow-600 dark:text-yellow-400'
                                                    }`}>
                                                        +{mission.rewardPoints}P
                                                    </div>
                                                    <div className="text-xs text-muted mt-1">
                                                        {isCompleted ? '획득 완료' : '보상'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 선착순 보너스 상태 (문제 풀이 미션 전용) */}
                                            {mission.missionType === 'PROBLEM_SOLVE' && (
                                                <div className="mt-3 text-sm">
                                                    {(() => {
                                                        const bonusKey = mission.missionId || mission.problemId;
                                                        const bonusStatus = bonusStatusMap[bonusKey];
                                                        const current = bonusStatus?.currentCount ?? 0;
                                                        const limit = bonusStatus?.limit ?? 3;

                                                        if (!bonusStatus) {
                                                            return (
                                                                <span className="text-gray-500 dark:text-gray-400">
                                                                    선착순 보너스 상태 확인 중...
                                                                </span>
                                                            );
                                                        }

                                                        if (isCompleted) {
                                                            return (
                                                                <span className="text-green-600 dark:text-green-400 font-medium">
                                                                    오늘 {current}번째로 보너스 지급 완료 ({current}/{limit}명)
                                                                </span>
                                                            );
                                                        }

                                                        if (bonusStatus.eligible) {
                                                            return (
                                                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                                    선착순 보너스 가능 ({current}/{limit}명)
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                                                보너스 마감 ({current}/{limit}명)
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {/* 완료 시간 */}
                                            {isCompleted && mission.completedAt && (
                                                <div className="mt-3 pt-3 border-t dark:border-gray-700 text-sm text-muted">
                                                    완료 시간: {new Date(mission.completedAt).toLocaleTimeString('ko-KR')}
                                                </div>
                                            )}

                                            {/* 미완료 시 안내 */}
                                            {!isCompleted && (
                                                <div className="mt-4 pt-3 border-t dark:border-gray-700">
                                                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                                        클릭하여 미션 시작하기 →
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* 하단 링크 */}
                        <div className="mt-8 flex justify-center gap-4">
                            <Link
                                to="/algorithm/problems"
                                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                            >
                                문제 목록 보기
                            </Link>
                            <Link
                                to="/algorithm/problems/generate"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                                AI 문제 생성
                            </Link>
                        </div>
                    </>
                )}
        </div>
    );
};

export default DailyMission;
