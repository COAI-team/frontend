import axiosInstance from "../../server/AxiosConfig";

/**
 * 오늘의 문제 선착순 보너스 상태 조회
 * GET /api/algo/missions/bonus/status
 */
export const getSolveBonusStatus = async (problemId) => {
    try {
        const res = await axiosInstance.get('/algo/missions/bonus/status', {
            params: { problemId },
            _skipAuthRedirect: true, // 403 시 리다이렉트 방지
        });
        return res.data;
    } catch (err) {
        console.error('‼️[getSolveBonusStatus] 요청 실패:', err);
        const status = err.response?.status;
        // 401/403/404 등은 서버 배포 전/권한 문제로 간주하고 기본 구조 반환
        if (status) {
            return {
                error: true,
                code: err.response?.data?.code || status,
                message: err.response?.data?.message || '보너스 상태 조회 실패',
                data: {
                    currentCount: null,
                    limit: 3,
                    eligible: true,
                },
            };
        }
        return { error: true, message: '선착순 보너스 상태를 가져오는데 실패했습니다.' };
    }
};

// ============== 알고리즘 문제 관리 API ==============

/**
 * 문제 목록 조회
 */
export const getProblems = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        const { page = 1, size = 10, difficulty, source, keyword } = params;

        queryParams.append('page', page);
        queryParams.append('size', size);
        if (difficulty) queryParams.append('difficulty', difficulty);
        if (source) queryParams.append('source', source);
        if (keyword) queryParams.append('keyword', keyword);
        if (params.problemType) queryParams.append('problemType', params.problemType);

        const res = await axiosInstance.get(`/algo/problems?${queryParams}`);

        // 🔍 디버깅: 응답 전체 구조 확인
        console.log('✅ [getProblems] 전체 응답:', res);
        console.log('✅ [getProblems] res.data:', res.data);

        return res.data;
    } catch (err) {
        console.error("❌ [getProblems] 요청 실패:", err);
        console.error("❌ [getProblems] 에러 상세:", err.response);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "문제 목록을 가져오는데 실패했습니다." };
    }
};

/**
 * 문제 상세 조회
 */
export const getProblem = async (problemId) => {
    try {
        const res = await axiosInstance.get(`/algo/problems/${problemId}`);
        return res.data;
    } catch (err) {
        console.error("❌ [getProblem] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "문제 상세 정보를 가져오는데 실패했습니다." };
    }
};

/**
 * 문제 풀이 시작 (ALG-04)
 * 세션 시작 및 문제 데이터 반환
 */
export const startProblemSolve = async (problemId) => {
    try {
        const res = await axiosInstance.get(`/algo/problems/${problemId}/solve`);
        return res.data;
    } catch (err) {
        console.error("❌ [startProblemSolve] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "문제 풀이를 시작할 수 없습니다." };
    }
};

/**
 * 코드 제출 (ALG-07)
 *
 * 변경사항:
 * - focusSessionId → monitoringSessionId
 * - solveMode 추가 (BASIC/FOCUS)
 */
export const submitCode = async (data) => {
    try {
        const res = await axiosInstance.post('/algo/submissions', {
            problemId: data.problemId,
            language: data.language,
            sourceCode: data.sourceCode,
            elapsedTime: data.elapsedTime,
            solveMode: data.solveMode || 'BASIC',
            monitoringSessionId: data.monitoringSessionId || null
        });
        return res.data;
    } catch (err) {
        console.error("❌ [submitCode] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "코드 제출에 실패했습니다." };
    }
};

/**
 * 제출 결과 조회
 */
export const getSubmissionResult = async (submissionId) => {
    try {
        const res = await axiosInstance.get(`/algo/submissions/${submissionId}`);
        return res.data;
    } catch (err) {
        console.error("❌ [getSubmissionResult] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "제출 결과를 가져올 수 없습니다." };
    }
};

/**
 * 내 제출 이력 조회 (ALG-11)
 */
export const getMySubmissions = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        const { page = 0, size = 20 } = params;

        queryParams.append('page', page);
        queryParams.append('size', size);

        const res = await axiosInstance.get(`/algo/submissions/my?${queryParams}`);
        console.log('✅ [getMySubmissions] 응답:', res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getMySubmissions] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "제출 이력을 가져오는데 실패했습니다." };
    }
};

/**
 * 코드 테스트 실행 (샘플 테스트케이스만)
 */
export const runTestCode = async (data) => {
    try {
        const res = await axiosInstance.post('/algo/submissions/test', {
            problemId: data.problemId,
            language: data.language,
            sourceCode: data.sourceCode
        });
        return res.data;
    } catch (err) {
        console.error("❌ [runTestCode] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "테스트 실행에 실패했습니다." };
    }
};

/**
 * AI 문제 생성 (검증 파이프라인 포함)
 * - 구조 검증, 유사도 검사, 코드 실행 검증, 시간 비율 검증 수행
 * - Self-Correction을 통한 자동 수정 시도
 * - LLM API + 검증 시간으로 인해 타임아웃을 120초로 설정
 */
export const generateProblem = async (data) => {
    try {
        // const res = await axiosInstance.post('/algo/problems/generate', {
        const res = await axiosInstance.post('/algo/problems/generate/validated', {
            difficulty: data.difficulty,
            problemType: data.problemType || 'ALGORITHM',
            topic: data.topic,
            additionalRequirements: data.additionalRequirements || null,
        }, {
            timeout: 120000  // 120초 타임아웃 (LLM 호출 + 검증 시간 고려)
        });
        return res.data;
    } catch (err) {
        console.error('❌ [generateProblem] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '문제 생성에 실패했습니다.' };
    }
};

/**
 * 서버 헬스 체크
 */
export const healthCheck = async () => {
    try {
        const res = await axiosInstance.get('/algo/problems/health');
        return res.data;
    } catch {
        return { error: true, message: "서버에 연결할 수 없습니다." };
    }
};

// ============== 모니터링 API (구 집중 추적) ==============
// 변경사항:
// - /algo/focus/* → /algo/monitoring/*
// - focusSession → monitoringSession
// - 모니터링은 점수에 미반영 (정보 제공 및 경고 목적)

/**
 * 모니터링 세션 시작 (집중 모드 진입)
 * @param {number} problemId - 문제 ID
 * @param {number} timeLimitMinutes - 제한 시간 (분)
 */
export const startMonitoringSession = async (problemId, timeLimitMinutes = 30) => {
    try {
        const res = await axiosInstance.post('/algo/monitoring/start', {
            problemId,
            timeLimitMinutes
        });
        return res.data;
    } catch (err) {
        console.error('❌ [startMonitoringSession] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '모니터링 세션 시작 실패' };
    }
};

/**
 * 위반 이벤트 전송
 * @param {string} sessionId - 세션 ID
 * @param {string} violationType - 위반 유형 (GAZE_AWAY, SLEEPING, NO_FACE, etc.)
 * @param {object} details - 추가 상세 정보 (선택)
 */
export const sendMonitoringViolation = async (sessionId, violationType, details = {}) => {
    try {
        const res = await axiosInstance.post('/algo/monitoring/violation', {
            sessionId,
            violationType,
            details
        });
        return res.data;
    } catch (err) {
        console.error('❌ [sendMonitoringViolation] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '위반 이벤트 전송 실패' };
    }
};

/**
 * 경고 표시 기록
 * @param {string} sessionId - 세션 ID
 */
export const recordMonitoringWarning = async (sessionId) => {
    try {
        const res = await axiosInstance.post('/algo/monitoring/warning', { sessionId });
        return res.data;
    } catch (err) {
        console.error('❌ [recordMonitoringWarning] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '경고 기록 실패' };
    }
};

/**
 * 모니터링 세션 종료 (정상 제출)
 * @param {string} sessionId - 세션 ID
 * @param {number} remainingSeconds - 남은 시간 (초)
 */
export const endMonitoringSession = async (sessionId, remainingSeconds = null) => {
    try {
        const res = await axiosInstance.post('/algo/monitoring/end', {
            sessionId,
            remainingSeconds
        });
        return res.data;
    } catch (err) {
        console.error('❌ [endMonitoringSession] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '모니터링 세션 종료 실패' };
    }
};

/**
 * 시간 초과 자동 제출 처리
 * @param {string} sessionId - 세션 ID
 */
export const handleMonitoringTimeout = async (sessionId) => {
    try {
        const res = await axiosInstance.post('/algo/monitoring/timeout', { sessionId });
        return res.data;
    } catch (err) {
        console.error('❌ [handleMonitoringTimeout] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '시간 초과 처리 실패' };
    }
};

/**
 * 모니터링 세션 정보 조회
 * @param {string} sessionId - 세션 ID
 */
export const getMonitoringSession = async (sessionId) => {
    try {
        const res = await axiosInstance.get(`/algo/monitoring/${sessionId}`);
        return res.data;
    } catch (err) {
        console.error('❌ [getMonitoringSession] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '세션 조회 실패' };
    }
};

/**
 * 사용자의 활성 모니터링 세션 조회
 * @param {number} problemId - 문제 ID
 */
export const getActiveMonitoringSession = async (problemId) => {
    try {
        const res = await axiosInstance.get(`/algo/monitoring/active?problemId=${problemId}`);
        return res.data;
    } catch (err) {
        console.error('❌ [getActiveMonitoringSession] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '활성 세션 조회 실패' };
    }
};

// ============== 하위 호환성을 위한 별칭 (Deprecated) ==============
// TODO: 이전 코드에서 사용 중인 경우 점진적으로 제거
export const startFocusSession = startMonitoringSession;
export const sendFocusEvent = (sessionId, eventData) =>
    sendMonitoringViolation(sessionId, eventData.type, { details: eventData.details, duration: eventData.duration });
export const endFocusSession = (sessionId) => endMonitoringSession(sessionId);

// ============== 상수 정의 ==============

export const DIFFICULTY_OPTIONS = [
    { value: '', label: '전체', color: 'gray' },
    { value: 'BRONZE', label: '브론즈', color: 'amber' },
    { value: 'SILVER', label: '실버', color: 'gray' },
    { value: 'GOLD', label: '골드', color: 'yellow' },
    { value: 'PLATINUM', label: '플래티넘', color: 'cyan' },
];

export const SOURCE_OPTIONS = [
    { value: '', label: '전체', icon: '🔍' },
    { value: 'AI_GENERATED', label: 'AI 생성', icon: '🤖' },
    { value: 'BOJ', label: '백준', icon: '🏛️' },
    { value: 'CUSTOM', label: '커스텀', icon: '✏️' },
];

export const LANGUAGE_OPTIONS = [
    { value: 'ALL', label: '모든 언어' },
    // C/C++
    { value: 'C (Clang)', label: 'C (Clang)' },
    { value: 'C11', label: 'C11 (GCC)' },
    { value: 'C++17', label: 'C++17 (GCC)' },
    { value: 'C++20', label: 'C++20 (GCC)' },
    // Java
    { value: 'Java 17', label: 'Java 17' },
    { value: 'Java 11', label: 'Java 11' },
    // Python
    { value: 'Python 3', label: 'Python 3' },
    { value: 'PyPy3', label: 'PyPy3' },
    // JS/TS
    { value: 'node.js', label: 'Node.js' },
    { value: 'TypeScript', label: 'TypeScript' },
    // Others
    { value: 'Go', label: 'Go' },
    { value: 'Rust', label: 'Rust' },
    { value: 'Kotlin (JVM)', label: 'Kotlin' },
    { value: 'Swift', label: 'Swift' },
    { value: 'C#', label: 'C# (Mono)' },
    { value: 'PHP', label: 'PHP' },
    { value: 'Ruby', label: 'Ruby' },
    { value: 'SQL', label: 'SQL (SQLite)' },
    // Additional
    { value: 'Bash', label: 'Bash' },
    { value: 'Assembly (64bit)', label: 'Assembly' },
    { value: 'D', label: 'D' },
    { value: 'Fortran', label: 'Fortran' },
    { value: 'Haskell', label: 'Haskell' },
    { value: 'Lua', label: 'Lua' },
    { value: 'Objective-C', label: 'Objective-C' },
    { value: 'OCaml', label: 'OCaml' },
    { value: 'Pascal', label: 'Pascal' },
    { value: 'Perl', label: 'Perl' },
    { value: 'R', label: 'R' },
    { value: 'Scala', label: 'Scala' },
];

export const TOPIC_OPTIONS = [
    { value: '수학', label: '수학' },
    { value: 'DP', label: '다이나믹 프로그래밍' },
    { value: '그래프', label: '그래프' },
    { value: '구현', label: '구현' },
    { value: '그리디', label: '그리디' },
    { value: 'BFS', label: '너비우선탐색' },
    { value: 'DFS', label: '깊이우선탐색' },
    { value: '이분탐색', label: '이분탐색' },
    { value: '문자열', label: '문자열' },
];

// Judge0 언어 ID 매핑 (참고용, 실제 매핑은 백엔드 Judge0Service에서 처리)
export const LANGUAGE_ID_MAP = {
    'C (Clang)': 104,
    'C11': 50,
    'C++17': 54,
    'C++20': 54,
    'Java 17': 91,
    'Java 11': 62,
    'Python 3': 113,
    'PyPy3': 113,
    'node.js': 102,
    'TypeScript': 101,
    'Go': 107,
    'Rust': 108,
    'Kotlin (JVM)': 111,
    'Swift': 83,
    'C#': 51,
    'PHP': 98,
    'Ruby': 72,
    'SQL': 82,
    'Bash': 46,
    'Assembly (64bit)': 45,
    'D': 56,
    'Fortran': 59,
    'Haskell': 61,
    'Lua': 64,
    'Objective-C': 79,
    'OCaml': 65,
    'Pascal': 67,
    'Perl': 85,
    'R': 99,
    'Scala': 112
};

// ============== 데일리 미션 API (Phase 6-1) ==============

/**
 * 오늘의 미션 조회
 * GET /api/algo/missions/today
 * @param {number} userId - 사용자 ID (개발용 testUserId)
 */
export const getTodayMissions = async (userId) => {
    try {
        const params = userId ? { testUserId: userId } : {};
        const res = await axiosInstance.get('/algo/missions/today', { params });
        return res.data;
    } catch (err) {
        console.error('❌ [getTodayMissions] 요청 실패:', err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: '미션 정보를 가져오는데 실패했습니다.' };
    }
};

/**
 * 미션 완료 처리
 * POST /api/algo/missions/complete
 * @param {string} missionType - 미션 타입
 * @param {number} userId - 사용자 ID (개발용 testUserId)
 */
export const completeMission = async (missionType, userId) => {
    try {
        const body = { missionType };
        if (userId) {
            body.testUserId = userId;
        }
        const res = await axiosInstance.post('/algo/missions/complete', body);
        return res.data;
    } catch (err) {
        console.error('❌ [completeMission] 요청 실패:', err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: '미션 완료 처리에 실패했습니다.' };
    }
};

/**
 * 사용량 정보 조회
 * GET /api/algo/missions/usage
 * @param {number} userId - 사용자 ID (개발용 testUserId)
 */
export const getUsageInfo = async (userId) => {
    try {
        const params = userId ? { testUserId: userId } : {};
        const res = await axiosInstance.get('/algo/missions/usage', { params });
        return res.data;
    } catch (err) {
        console.error('❌ [getUsageInfo] 요청 실패:', err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: '사용량 정보를 가져오는데 실패했습니다.' };
    }
};

/**
 * 사용자 알고리즘 레벨 조회
 * GET /api/algo/missions/level
 * @param {number} userId - 사용자 ID (개발용 testUserId)
 */
export const getUserLevel = async (userId) => {
    try {
        const params = userId ? { testUserId: userId } : {};
        const res = await axiosInstance.get('/algo/missions/level', { params });
        return res.data;
    } catch (err) {
        console.error('❌ [getUserLevel] 요청 실패:', err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: '레벨 정보를 가져오는데 실패했습니다.' };
    }
};

// ============== 레벨 상수 정의 ==============

export const ALGO_LEVEL_INFO = {
    EMERALD: {
        name: '에메랄드',
        color: 'emerald',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300',
        icon: '💎',
        minSolved: 0,
        rewardPoints: 10
    },
    SAPPHIRE: {
        name: '사파이어',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        icon: '💠',
        minSolved: 20,
        rewardPoints: 20
    },
    RUBY: {
        name: '루비',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        icon: '🔴',
        minSolved: 50,
        rewardPoints: 30
    },
    DIAMOND: {
        name: '다이아몬드',
        color: 'cyan',
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-700',
        borderColor: 'border-cyan-300',
        icon: '💎',
        minSolved: 100,
        rewardPoints: 50
    }
};

export const MISSION_TYPE_INFO = {
    PROBLEM_GENERATE: {
        name: 'AI 문제 생성',
        description: 'AI를 이용해 새로운 문제를 생성하세요',
        icon: '🤖',
        link: '/algorithm/problems/generate'
    },
    PROBLEM_SOLVE: {
        name: '문제 풀기',
        description: '오늘의 추천 문제를 풀어보세요',
        icon: '💻',
        linkPrefix: '/algorithm/problems/'
    }
};

// 페이지 크기 옵션 (ProblemList.jsx에서 사용)
export const PAGE_SIZE_OPTIONS = [
    { value: 5, label: '5개씩' },
    { value: 10, label: '10개씩' },
    { value: 20, label: '20개씩' },
    { value: 50, label: '50개씩' },
];

// 정렬 옵션 (ProblemList.jsx에서 사용)
export const SORT_OPTIONS = [
    { value: 'recent', label: '최신순' },
    { value: 'difficulty', label: '난이도순' },
    { value: 'title', label: '제목순' },
    { value: 'popular', label: '인기순' },
];
