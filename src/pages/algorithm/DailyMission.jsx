import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    getTodayMissions,
    getUsageInfo,
    getUserLevel,
    ALGO_LEVEL_INFO,
    MISSION_TYPE_INFO,
    DIFFICULTY_OPTIONS
} from '../../service/algorithm/AlgorithmApi';
import UsageDisplay from '../../components/algorithm/mission/UsageDisplay';
import UserLevelBadge from '../../components/algorithm/mission/UserLevelBadge';
import { useLogin } from '../../context/useLogin';

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

    const navigate = useNavigate();

    // ===== 데이터 로딩 =====
    const loadData = useCallback(async () => {
        // 로그인 체크
        if (!isLoggedIn || !user?.userId) {
            setLoading(false);
            return;
        }

        const userId = user.userId;

        try {
            setLoading(true);
            setError(null);

            // 병렬로 데이터 로딩 (testUserId 전달)
            const [missionsResult, usageResult, levelResult] = await Promise.all([
                getTodayMissions(userId),
                getUsageInfo(userId),
                getUserLevel(userId)
            ]);

            // 미션 데이터 설정
            if (missionsResult.error) {
                console.warn('미션 로딩 실패:', missionsResult.message);
            } else {
                setMissions(missionsResult.data || []);
            }

            // 사용량 데이터 설정
            if (usageResult.error) {
                console.warn('사용량 로딩 실패:', usageResult.message);
            } else {
                setUsageInfo(usageResult.data);
            }

            // 레벨 데이터 설정
            if (levelResult.error) {
                console.warn('레벨 로딩 실패:', levelResult.message);
            } else {
                setUserLevel(levelResult.data);
            }

        } catch (err) {
            console.error('데이터 로딩 에러:', err);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, user]);

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

    // hydration 완료 전 로딩 표시
    if (!hydrated) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">로딩 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 로그인이 안 되어 있을 때
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            오늘의 미션
                        </h1>
                        <p className="text-gray-600">
                            매일 미션을 완료하고 포인트를 획득하세요!
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                        <div className="text-6xl mb-4">🔐</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            로그인이 필요합니다
                        </h2>
                        <p className="text-gray-600 mb-6">
                            데일리 미션에 참여하려면 로그인해주세요.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                to="/signin"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                                로그인하기
                            </Link>
                            <Link
                                to="/signup"
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                            >
                                회원가입
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        오늘의 미션
                    </h1>
                    <p className="text-gray-600">
                        매일 미션을 완료하고 포인트를 획득하세요!
                    </p>
                </div>

                {/* 로딩 상태 */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
                    </div>
                )}

                {/* 에러 상태 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                        <p className="font-medium">오류가 발생했습니다</p>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={loadData}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* 상단 정보 카드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* 레벨 정보 */}
                            <UserLevelBadge userLevel={userLevel} />

                            {/* 사용량 정보 */}
                            <UsageDisplay usageInfo={usageInfo} />
                        </div>

                        {/* 미션 진행 상황 */}
                        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    미션 진행률
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {completedCount} / {totalMissions} 완료
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
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
                                <p className="mt-3 text-center text-green-600 font-medium">
                                    오늘의 모든 미션을 완료했습니다!
                                </p>
                            )}
                        </div>

                        {/* 미션 목록 */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                오늘의 미션 목록
                            </h2>

                            {missions.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                                    <p className="text-gray-500">
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
                                            className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
                                                isCompleted
                                                    ? 'opacity-70 cursor-default'
                                                    : 'hover:shadow-md cursor-pointer hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    {/* 아이콘 */}
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                                        isCompleted
                                                            ? 'bg-green-100'
                                                            : 'bg-blue-100'
                                                    }`}>
                                                        {isCompleted ? '✅' : typeInfo.icon}
                                                    </div>

                                                    {/* 미션 정보 */}
                                                    <div>
                                                        <h3 className={`font-semibold text-lg ${
                                                            isCompleted
                                                                ? 'text-gray-500 line-through'
                                                                : 'text-gray-900'
                                                        }`}>
                                                            {typeInfo.name || mission.missionType}
                                                        </h3>
                                                        <p className="text-gray-500 text-sm mt-1">
                                                            {typeInfo.description}
                                                        </p>

                                                        {/* 문제 정보 (PROBLEM_SOLVE인 경우) */}
                                                        {mission.missionType === 'PROBLEM_SOLVE' && mission.problemTitle && (
                                                            <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                                                <p className="text-sm text-gray-700">
                                                                    <span className="font-medium">문제:</span> {mission.problemTitle}
                                                                </p>
                                                                {mission.problemDifficulty && (
                                                                    <p className="text-sm text-gray-500">
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
                                                            ? 'text-green-600'
                                                            : 'text-yellow-600'
                                                    }`}>
                                                        +{mission.rewardPoints}P
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {isCompleted ? '획득 완료' : '보상'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 완료 시간 */}
                                            {isCompleted && mission.completedAt && (
                                                <div className="mt-3 pt-3 border-t text-sm text-gray-400">
                                                    완료 시간: {new Date(mission.completedAt).toLocaleTimeString('ko-KR')}
                                                </div>
                                            )}

                                            {/* 미완료 시 안내 */}
                                            {!isCompleted && (
                                                <div className="mt-4 pt-3 border-t">
                                                    <span className="text-blue-600 text-sm font-medium">
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
        </div>
    );
};

export default DailyMission;
