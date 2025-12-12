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
        const { page = 1, size = 10, difficulty, source, keyword, topic, problemType } = params;

        queryParams.append('page', page);
        queryParams.append('size', size);
        if (difficulty) queryParams.append('difficulty', difficulty);
        if (source) queryParams.append('source', source);
        if (keyword) queryParams.append('keyword', keyword);
        if (topic) queryParams.append('topic', topic);
        if (problemType) queryParams.append('problemType', problemType);

        const res = await axiosInstance.get(`/algo/problems?${queryParams}`);

        console.log('✅ [getProblems] 응답:', res.data);

        return res.data;
    } catch (err) {
        console.error("❌ [getProblems] 요청 실패:", err);
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
 * 문제 풀이 시작
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
 * 코드 제출
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
 * 내 제출 이력 조회
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
 * 문제별 공유된 제출 목록 조회 (다른 사람의 풀이)
 */
export const getSharedSubmissions = async (problemId, page = 1, size = 20) => {
    try {
        const res = await axiosInstance.get(`/algo/problems/${problemId}/solutions`, {
            params: { page, size }
        });
        return res.data;
    } catch (err) {
        console.error("❌ [getSharedSubmissions] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "공유된 풀이를 불러오는데 실패했습니다." };
    }
};

/**
 * 제출 공유 상태 변경
 */
export const updateSharingStatus = async (submissionId, isShared) => {
    try {
        const res = await axiosInstance.patch(
            `/algo/submissions/${submissionId}/visibility`,
            null,
            { params: { isShared } }
        );
        return res.data;
    } catch (err) {
        console.error("❌ [updateSharingStatus] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "공유 상태 변경에 실패했습니다." };
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
 * AI 문제 생성 (검증 파이프라인 포함) - 일반 HTTP 방식
 * - 구조 검증, 유사도 검사, 코드 실행 검증, 시간 비율 검증 수행
 * - Self-Correction을 통한 자동 수정 시도
 * - LLM API + 검증 시간으로 인해 타임아웃을 120초로 설정
 */
export const generateProblem = async (data) => {
    try {
        const res = await axiosInstance.post('/algo/problems/generate/validated', {
            difficulty: data.difficulty,
            problemType: data.problemType || 'ALGORITHM',
            topic: data.topic,
            additionalRequirements: data.additionalRequirements || null,
        }, {
            timeout: 120000
        });
        return res.data;
    } catch (err) {
        console.error('❌ [generateProblem] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '문제 생성에 실패했습니다.' };
    }
};

/**
 * AI 문제 생성 (SSE 스트리밍 방식)
 * - Server-Sent Events를 통해 실시간 진행 상황 수신
 * - 각 단계별 진행률을 콜백으로 전달
 *
 * @param {Object} data - 문제 생성 요청 데이터
 * @param {Object} callbacks - 콜백 함수들
 * @param {Function} callbacks.onStep - 진행 단계 업데이트 시 호출
 * @param {Function} callbacks.onComplete - 완료 시 호출
 * @param {Function} callbacks.onError - 에러 발생 시 호출
 * @returns {Function} SSE 연결 종료 함수
 */
export const generateProblemWithSSE = (data, callbacks) => {
    const { onStep, onComplete, onError } = callbacks;

    // URL 쿼리 파라미터 구성
    const params = new URLSearchParams({
        difficulty: data.difficulty,
        topic: data.topic,
        problemType: data.problemType || 'ALGORITHM',
    });

    if (data.additionalRequirements) {
        params.append('additionalRequirements', data.additionalRequirements);
    }

    // API 베이스 URL 가져오기
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:9443';
    const sseUrl = `${baseURL}/algo/problems/generate/stream?${params.toString()}`;

    console.log('🔗 [SSE] 연결 시작:', sseUrl);

    // EventSource 생성 (SSE 연결)
    const eventSource = new EventSource(sseUrl, {
        withCredentials: true  // 쿠키/인증 정보 포함
    });

    // 메시지 수신 핸들러
    eventSource.onmessage = (event) => {
        try {
            // 백엔드에서 "data: " prefix가 중복 추가될 수 있으므로 제거
            let rawData = event.data;
            if (rawData.startsWith('data: ')) {
                rawData = rawData.substring(6).trim();
            }

            const eventData = JSON.parse(rawData);
            console.log('📨 [SSE] 이벤트 수신:', eventData);

            switch (eventData.type) {
                case 'STEP':
                    // 진행 단계 업데이트
                    if (onStep) {
                        onStep(eventData.message);
                    }
                    break;

                case 'COMPLETE':
                    // 완료 - 생성된 문제 데이터 전달
                    console.log('✅ [SSE] 문제 생성 완료:', eventData.data);
                    if (onComplete) {
                        onComplete(eventData.data);
                    }
                    eventSource.close();
                    break;

                case 'ERROR':
                    // 에러 발생
                    console.error('❌ [SSE] 에러:', eventData.message);
                    if (onError) {
                        onError(eventData.message);
                    }
                    eventSource.close();
                    break;

                default:
                    console.warn('⚠️ [SSE] 알 수 없는 이벤트 타입:', eventData.type);
            }
        } catch (parseError) {
            console.error('❌ [SSE] 이벤트 파싱 실패:', parseError, event.data);
        }
    };

    // 연결 열림 핸들러
    eventSource.onopen = () => {
        console.log('✅ [SSE] 연결 성공');
    };

    // 에러 핸들러
    eventSource.onerror = (error) => {
        console.error('❌ [SSE] 연결 에러:', error);

        // readyState 체크: 0=CONNECTING, 1=OPEN, 2=CLOSED
        if (eventSource.readyState === EventSource.CLOSED) {
            console.log('🔌 [SSE] 연결 종료됨');
        } else {
            // 연결 에러 발생 시 콜백 호출
            if (onError) {
                onError('서버 연결이 끊어졌습니다. 다시 시도해주세요.');
            }
        }
        eventSource.close();
    };

    // 연결 종료 함수 반환 (컴포넌트 언마운트 시 정리용)
    return () => {
        console.log('🔌 [SSE] 수동 연결 종료');
        eventSource.close();
    };
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

// ============== 모니터링 API ==============

/**
 * 모니터링 세션 시작
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
 * 모니터링 세션 종료
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

// ============== 데일리 미션 API ==============

/**
 * 오늘의 미션 조회
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

export const PROBLEM_TYPE_OPTIONS = [
    { value: '', label: '전체' },
    { value: 'ALGORITHM', label: '알고리즘' },
    { value: 'SQL', label: 'DATABASE' },
];

export const LANGUAGE_OPTIONS = [
    { value: 'ALL', label: '모든 언어' },
    { value: 'C (Clang)', label: 'C (Clang)' },
    { value: 'C11', label: 'C11 (GCC)' },
    { value: 'C++17', label: 'C++17 (GCC)' },
    { value: 'C++20', label: 'C++20 (GCC)' },
    { value: 'Java 17', label: 'Java 17' },
    { value: 'Java 11', label: 'Java 11' },
    { value: 'Python 3', label: 'Python 3' },
    { value: 'PyPy3', label: 'PyPy3' },
    { value: 'node.js', label: 'Node.js' },
    { value: 'TypeScript', label: 'TypeScript' },
    { value: 'Go', label: 'Go' },
    { value: 'Rust', label: 'Rust' },
    { value: 'Kotlin (JVM)', label: 'Kotlin' },
    { value: 'Swift', label: 'Swift' },
    { value: 'C#', label: 'C# (Mono)' },
    { value: 'PHP', label: 'PHP' },
    { value: 'Ruby', label: 'Ruby' },
    { value: 'SQL', label: 'SQL (SQLite)' },
    { value: 'Bash', label: 'Bash' },
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
