import axiosInstance from "../../server/AxiosConfig";

// ============== 알고리즘 문제 관리 API ==============

/**
 * 문제 목록 조회
 */
export const getProblems = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        const { page = 1, size = 10, difficulty, source, keyword, topic } = params;

        queryParams.append('page', page);
        queryParams.append('size', size);

        if (difficulty && difficulty !== '') {
            queryParams.append('difficulty', difficulty);
        }
        if (source && source !== '') {
            queryParams.append('source', source);
        }
        if (keyword && keyword.trim() !== '') {
            queryParams.append('keyword', keyword.trim());
        }
        // topic 파라미터 추가
        if (topic && topic !== '') {
            queryParams.append('topic', topic);
        }

        const url = `/algo/problems?${queryParams.toString()}`;
        const res = await axiosInstance.get(url);

        // ApiResponse 구조에서 실제 데이터 추출
        if (res.data && res.data.data) {
            return { data: res.data.data };
        }

        return res.data;
    } catch (err) {
        console.error("문제 목록 조회 실패:", err);
        
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
 */
export const submitCode = async (data) => {
    try {
        const res = await axiosInstance.post('/algo/submissions', {
            problemId: data.problemId,
            language: data.language,
            sourceCode: data.sourceCode,
            elapsedTime: data.elapsedTime,
            focusSessionId: data.focusSessionId || null
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
 * AI 문제 생성
 */
export const generateProblem = async (data) => {
    try {
        const res = await axiosInstance.post('/algo/problems/generate', {
            difficulty: data.difficulty,
            topic: data.topic,  
            language: data.language || 'ALL',
            additionalRequirements: data.additionalRequirements || null,
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

// ============== 집중 추적 API ==============

/**
 * 집중 세션 시작
 */
export const startFocusSession = async (problemId) => {
    try {
        const res = await axiosInstance.post('/algo/focus/start', { problemId });
        return res.data;
    } catch (err) {
        console.error('❌ [startFocusSession] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '세션 시작 실패' };
    }
};

/**
 * 집중 이벤트 전송
 */
export const sendFocusEvent = async (sessionId, eventData) => {
    try {
        const res = await axiosInstance.post('/algo/focus/events', {
            sessionId,
            ...eventData
        });
        return res.data;
    } catch (err) {
        console.error('❌ [sendFocusEvent] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '이벤트 전송 실패' };
    }
};

/**
 * 집중 세션 종료
 */
export const endFocusSession = async (sessionId) => {
    try {
        const res = await axiosInstance.post('/algo/focus/end', { sessionId });
        return res.data;
    } catch (err) {
        console.error('❌ [endFocusSession] 요청 실패:', err);
        return { error: true, message: err.response?.data?.message || '세션 종료 실패' };
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
    { value: 'PROGRAMMERS', label: '프로그래머스', icon: '💻' },
    { value: 'CUSTOM', label: '커스텀', icon: '✏️' },
];

export const LANGUAGE_OPTIONS = [
    { value: 'ALL', label: '모든 언어' },
    { value: 'JAVA', label: 'Java' },
    { value: 'PYTHON', label: 'Python' },
    { value: 'CPP', label: 'C++' },
    { value: 'JAVASCRIPT', label: 'JavaScript' },
];

export const TOPIC_OPTIONS = [
  { value: '배열', label: '배열' },
  { value: '다이나믹 프로그래밍', label: '다이나믹 프로그래밍' },
  { value: '그리디', label: '그리디' },
  { value: '그래프', label: '그래프' },
  { value: '구현', label: '구현' },
  { value: '수학', label: '수학' },
  { value: '문자열', label: '문자열' },
  { value: '정렬', label: '정렬' },
  { value: '탐색', label: '탐색' },
  { value: '시뮬레이션', label: '시뮬레이션' },
  { value: '재귀', label: '재귀' },
  { value: '백트래킹', label: '백트래킹' },
  { value: '너비우선탐색', label: '너비우선탐색 (BFS)' },
  { value: '깊이우선탐색', label: '깊이우선탐색 (DFS)' },
  { value: '이분탐색', label: '이분탐색' },
];

// Judge0 언어 ID 매핑
export const LANGUAGE_ID_MAP = {
    'javascript': 63,
    'python': 71,
    'java': 62,
    'cpp': 54,
    'c': 50
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