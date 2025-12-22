import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    getTodayMissions,
    getUsageInfo,
    getUserLevel,
    getSolveBonusStatus,
    getContributions,
    MISSION_TYPE_INFO,
    DIFFICULTY_OPTIONS
} from '../../service/algorithm/AlgorithmApi';
import UsageDisplay from '../../components/algorithm/mission/UsageDisplay';
import UserLevelBadge from '../../components/algorithm/mission/UserLevelBadge';
import { useLogin } from '../../context/login/useLogin';
import '../../styles/DailyMission.css';

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
    const [contributions, setContributions] = useState([]);  // 잔디 캘린더용
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
            const [missionsResult, usageResult, levelResult, contributionsResult] = await Promise.all([
                getTodayMissions(userId),
                getUsageInfo(userId),
                getUserLevel(userId),
                getContributions(userId, 12)  // 12개월치 잔디 데이터
            ]);

            console.log('📊 [DailyMission] API 응답:', {
                missions: missionsResult,
                usage: usageResult,
                level: levelResult,
                contributions: contributionsResult
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

            // 잔디 캘린더 데이터 설정
            if (contributionsResult.error) {
                console.warn('잔디 캘린더 로딩 실패:', contributionsResult.message);
            } else {
                console.log('✅ [DailyMission] 잔디 캘린더 데이터:', contributionsResult.data);
                setContributions(contributionsResult.data || []);
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
        <div className="max-w-4xl mx-auto daily-mission-page">
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
                            <div className="user-level-container">
                                <UserLevelBadge userLevel={userLevel} />
                            </div>

                            {/* 사용량 정보 */}
                            <div className="usage-display-container">
                                <UsageDisplay usageInfo={usageInfo} />
                            </div>
                        </div>

                        {/* 🌱 GitHub 스타일 잔디 캘린더 */}
                        <div className="bg-panel rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6 grass-calendar-container">
                            <div className="flex items-center justify-between mb-4 calendar-header pb-0">
                                <h2 className="text-lg font-semibold text-main flex items-center gap-2">
                                    🌱 문제 풀이 기록
                                </h2>
                                <span className="text-sm text-muted">
                                    {new Date().getFullYear()}년
                                </span>
                            </div>

                            {/* 잔디 캘린더 그리드 - 클릭 이벤트 버블링 차단 */}
                            <div className="overflow-x-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="min-w-[720px]">
                                    {(() => {
                                        // 로컬 날짜 포맷 함수 (timezone 문제 해결: toISOString()은 UTC 반환)
                                        const formatLocalDate = (date) => {
                                            const year = date.getFullYear();
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const day = String(date.getDate()).padStart(2, '0');
                                            return `${year}-${month}-${day}`;
                                        };

                                        // 날짜별 데이터를 Map으로 변환
                                        const dataMap = new Map();
                                        contributions.forEach(item => {
                                            // solveDate 필드 처리 (다양한 형식 지원)
                                            const dateStr = item.solveDate?.split?.('T')[0] || String(item.solveDate);
                                            const count = Number(item.solveCount) || 0;
                                            dataMap.set(dateStr, count);
                                        });

                                        // 디버깅: 날짜 매칭 확인
                                        console.log('📅 캘린더 dataMap:', Object.fromEntries(dataMap));

                                        // 올해 1월 1일부터 12월 31일까지 표시
                                        const currentYear = new Date().getFullYear();
                                        const startDate = new Date(currentYear, 0, 1);  // 1월 1일
                                        const endDate = new Date(currentYear, 11, 31);  // 12월 31일
                                        const today = new Date();

                                        const weeks = [];
                                        let currentWeek = [];

                                        // 월 라벨 위치 계산용
                                        const monthPositions = [];
                                        let lastMonth = -1;

                                        // 1월 1일의 요일에 따라 첫 주 패딩 추가
                                        const firstDayOfWeek = startDate.getDay();
                                        if (firstDayOfWeek !== 0) {
                                            for (let j = 0; j < firstDayOfWeek; j++) {
                                                currentWeek.push({ empty: true });
                                            }
                                        }

                                        // 1월 1일부터 12월 31일까지 순회
                                        const currentDate = new Date(startDate);
                                        while (currentDate <= endDate) {
                                            // 로컬 날짜 형식 사용 (toISOString은 UTC로 변환되어 날짜 불일치 발생)
                                            const dateStr = formatLocalDate(currentDate);
                                            const count = dataMap.get(dateStr) || 0;
                                            const dayOfWeek = currentDate.getDay();
                                            const month = currentDate.getMonth();
                                            const isFuture = currentDate > today;

                                            currentWeek.push({
                                                date: dateStr,
                                                count,
                                                month,
                                                day: currentDate.getDate(),
                                                isFuture
                                            });

                                            // 토요일이면 주 완료
                                            if (dayOfWeek === 6) {
                                                // 해당 주의 첫 날짜 기준으로 월 위치 기록
                                                const weekFirstDay = currentWeek.find(d => !d.empty);
                                                if (weekFirstDay && weekFirstDay.month !== lastMonth) {
                                                    monthPositions.push({ month: weekFirstDay.month, weekIdx: weeks.length });
                                                    lastMonth = weekFirstDay.month;
                                                }
                                                weeks.push(currentWeek);
                                                currentWeek = [];
                                            }

                                            currentDate.setDate(currentDate.getDate() + 1);
                                        }

                                        // 마지막 주 처리
                                        if (currentWeek.length > 0) {
                                            // 마지막 주 패딩 (토요일까지 채우기)
                                            while (currentWeek.length < 7) {
                                                currentWeek.push({ empty: true });
                                            }
                                            const weekFirstDay = currentWeek.find(d => !d.empty);
                                            if (weekFirstDay && weekFirstDay.month !== lastMonth) {
                                                monthPositions.push({ month: weekFirstDay.month, weekIdx: weeks.length });
                                            }
                                            weeks.push(currentWeek);
                                        }

                                        // 색상 결정 함수 (CSS 클래스 사용)
                                        const getGrassCellClass = (count, isFuture) => {
                                            if (isFuture) return 'grass-cell-future';
                                            if (count === 0) return 'grass-cell-empty';
                                            if (count === 1) return 'grass-cell-level1';
                                            if (count === 2) return 'grass-cell-level2';
                                            if (count <= 4) return 'grass-cell-level3';
                                            return 'grass-cell-level4';
                                        };

                                        // 월 이름
                                        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

                                        // 총 풀이 수 및 활동일 계산 (올해 데이터만)
                                        const yearStart = `${currentYear}-01-01`;
                                        const yearEnd = `${currentYear}-12-31`;
                                        const thisYearData = contributions.filter(c => {
                                            const d = c.solveDate?.split?.('T')[0] || String(c.solveDate);
                                            return d >= yearStart && d <= yearEnd;
                                        });
                                        const activeDays = thisYearData.filter(c => (Number(c.solveCount) || 0) > 0).length;

                                        // 툴팁 포맷 함수 (중복 제외 문제 수 표시)
                                        const formatTooltip = (day) => {
                                            if (day.empty) return '';
                                            const month = day.month + 1;
                                            const dayNum = day.day;
                                            if (day.isFuture) return `${month}월 ${dayNum}일`;
                                            if (day.count === 0) return `${month}월 ${dayNum}일: 풀이 없음`;
                                            return `${month}월 ${dayNum}일: ${day.count}개 문제 정답 (중복 제외)`;
                                        };

                                        return (
                                            <>
                                                {/* 월 라벨 - 동적 위치 */}
                                                <div className="flex mb-2 text-xs text-muted relative h-4" style={{ marginLeft: '24px' }}>
                                                    {monthPositions.map((pos, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="absolute"
                                                            style={{ left: `${pos.weekIdx * 13}px` }}
                                                        >
                                                            {monthNames[pos.month]}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* 요일 라벨 + 잔디 그리드 */}
                                                <div className="flex">
                                                    {/* 요일 라벨 */}
                                                    <div className="flex flex-col text-xs text-muted mr-2 justify-around h-[88px] w-[16px]">
                                                        <span>월</span>
                                                        <span>수</span>
                                                        <span>금</span>
                                                    </div>

                                                    {/* 잔디 그리드 */}
                                                    <div className="flex gap-[2px]">
                                                        {weeks.map((week, weekIdx) => (
                                                            <div key={weekIdx} className="flex flex-col gap-[2px]">
                                                                {week.map((day, dayIdx) => (
                                                                    <div
                                                                        key={dayIdx}
                                                                        className={`w-[11px] h-[11px] rounded-[2px] cursor-default group relative ${
                                                                            day.empty ? 'bg-transparent' : getGrassCellClass(day.count, day.isFuture)
                                                                        }`}
                                                                    >
                                                                        {/* CSS 툴팁 (네이티브 title 대체 - 작은 요소에서 더 잘 보임) */}
                                                                        {!day.empty && (
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                                                                                bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900
                                                                                text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                                                                                pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                                                                                {formatTooltip(day)}
                                                                                {/* 툴팁 화살표 */}
                                                                                <div className="absolute top-full left-1/2 -translate-x-1/2
                                                                                    border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 통계 + 범례 */}
                                                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between text-sm">
                                                    {/* 통계 (좌측) */}
                                                    <div className="text-muted">
                                                        올해 활동일 <span className="font-bold text-main">{activeDays}</span>일
                                                    </div>

                                                    {/* 범례 (우측) */}
                                                    <div className="flex items-center gap-1 text-xs text-muted">
                                                        <span>적음</span>
                                                        <div className="legend-cell-empty"></div>
                                                        <div className="legend-cell-level1"></div>
                                                        <div className="legend-cell-level2"></div>
                                                        <div className="legend-cell-level3"></div>
                                                        <div className="legend-cell-level4"></div>
                                                        <span>많음</span>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </>
                )}
        </div>
    );
};

export default DailyMission;
