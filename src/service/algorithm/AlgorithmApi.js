import axiosInstance from "../../server/AxiosConfig";

// ============== 알고리즘 문제 관리 API ==============

/**
 * 문제 목록 조회
 * @param {Object} params - 쿼리 파라미터
 * @param {number} params.page - 페이지 번호 (기본: 1)
 * @param {number} params.size - 페이지 크기 (기본: 10)
 * @param {string} params.difficulty - 난이도 필터
 * @param {string} params.source - 출처 필터
 * @param {string} params.keyword - 검색 키워드
 */
export const getProblems = async (params = {}) => {
    try {
        console.log("📨 [getProblems] 요청 시작:", params);

        const queryParams = new URLSearchParams();
        
        // 기본값 설정
        const { page = 1, size = 10, difficulty, source, keyword } = params;
        
        queryParams.append('page', page);
        queryParams.append('size', size);
        
        if (difficulty) queryParams.append('difficulty', difficulty);
        if (source) queryParams.append('source', source);
        if (keyword) queryParams.append('keyword', keyword);
        
        const res = await axiosInstance.get(`/algo/problems?${queryParams}`);

        console.log("✅ [getProblems] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getProblems] 요청 실패:", err);
        
        // 백엔드에서 내려준 코드/메시지가 있는 경우 그대로 반환
        if (err.response && err.response.data) {
            return {
                error: true,
                code: err.response.data.code,
                message: err.response.data.message
            };
        }

        return { error: true, message: "문제 목록을 가져오는데 실패했습니다." };
    }
};

/**
 * 문제 상세 조회
 * @param {number} problemId - 문제 ID
 */
export const getProblem = async (problemId) => {
    try {
        console.log("📨 [getProblem] 요청 시작:", problemId);

        const res = await axiosInstance.get(`/algo/problems/${problemId}`);

        console.log("✅ [getProblem] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getProblem] 요청 실패:", err);

        if (err.response && err.response.data) {
            return {
                error: true,
                code: err.response.data.code,
                message: err.response.data.message
            };
        }

        return { error: true, message: "문제 상세 정보를 가져오는데 실패했습니다." };
    }
};

/**
 * 문제 존재 여부 확인
 * @param {number} problemId - 문제 ID
 */
export const checkProblemExists = async (problemId) => {
    try {
        console.log("📨 [checkProblemExists] 요청 시작:", problemId);

        await axiosInstance.head(`/algo/problems/${problemId}`);

        console.log("✅ [checkProblemExists] 문제 존재 확인");
        return { success: true, exists: true };
    } catch (err) {
        console.error("❌ [checkProblemExists] 요청 실패:", err);

        if (err.response?.status === 404) {
            return { success: true, exists: false };
        }

        return { error: true, message: "문제 존재 여부 확인에 실패했습니다." };
    }
};

/**
 * AI 문제 생성
 * @param {Object} data - 생성 요청 데이터
 * @returns {Promise<Object>} 생성 결과
 */
export const generateProblem = async (data) => {
    try {
      const response = await axiosInstance.post('/algo/problems/generate', {
        difficulty: data.difficulty,
        topic: data.topic,
        language: data.language || 'ALL',
        additionalRequirements: data.additionalRequirements || null,
      });
      return response.data;
    } catch (error) {
      console.error('AI 문제 생성 실패:', error);
      return {
        error: true,
        message: error.response?.data?.message || '문제 생성에 실패했습니다.'
      };
    }
  };

/**
 * 서버 헬스 체크
 */
export const healthCheck = async () => {
    try {
        console.log("📨 [healthCheck] 요청 시작");

        const res = await axiosInstance.get('/algo/problems/health');

        console.log("✅ [healthCheck] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [healthCheck] 요청 실패:", err);
        return { error: true, message: "서버에 연결할 수 없습니다." };
    }
};

// ============== 문제 필터링/검색 관련 ==============

/**
 * 난이도별 문제 조회
 * @param {string} difficulty - 난이도
 * @param {Object} options - 추가 옵션
 */
export const getProblemsByDifficulty = async (difficulty, options = {}) => {
    return getProblems({ difficulty, ...options });
};

/**
 * 출처별 문제 조회
 * @param {string} source - 출처
 * @param {Object} options - 추가 옵션
 */
export const getProblemsBySource = async (source, options = {}) => {
    return getProblems({ source, ...options });
};

/**
 * 키워드 검색
 * @param {string} keyword - 검색 키워드
 * @param {Object} options - 추가 옵션
 */
export const searchProblems = async (keyword, options = {}) => {
    return getProblems({ keyword, ...options });
};

// ============== 상수 정의 ==============

// 난이도 옵션
export const DIFFICULTY_OPTIONS = [
    { value: '', label: '전체', color: 'gray' },
    { value: 'BRONZE', label: '브론즈', color: 'amber' },
    { value: 'SILVER', label: '실버', color: 'gray' },
    { value: 'GOLD', label: '골드', color: 'yellow' },
    { value: 'PLATINUM', label: '플래티넘', color: 'cyan' },
];

// 출처 옵션
export const SOURCE_OPTIONS = [
    { value: '', label: '전체', icon: '🔍' },
    { value: 'AI_GENERATED', label: 'AI 생성', icon: '🤖' },
    { value: 'BOJ', label: '백준', icon: '🏛️' },
    { value: 'CUSTOM', label: '커스텀', icon: '✏️' },
];

// 언어 옵션 (AI 생성용)
export const LANGUAGE_OPTIONS = [
    { value: 'ALL', label: '모든 언어' },
    { value: 'JAVA', label: 'Java' },
    { value: 'PYTHON', label: 'Python' },
    { value: 'CPP', label: 'C++' },
    { value: 'JAVASCRIPT', label: 'JavaScript' },
];

// 주제 옵션 (AI 생성용)
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

// 페이지 크기 옵션
export const PAGE_SIZE_OPTIONS = [
    { value: 5, label: '5개씩' },
    { value: 10, label: '10개씩' },
    { value: 20, label: '20개씩' },
    { value: 50, label: '50개씩' },
];

// 정렬 옵션
export const SORT_OPTIONS = [
    { value: 'recent', label: '최신순' },
    { value: 'difficulty', label: '난이도순' },
    { value: 'title', label: '제목순' },
    { value: 'popular', label: '인기순' },
];