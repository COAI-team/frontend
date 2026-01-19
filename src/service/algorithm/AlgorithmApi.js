import axiosInstance from "../../server/AxiosConfig";
import { getAuth } from "../../utils/auth/token";

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
        const { 
            page = 1,  // 프론트엔드는 1-based
            size = 10, 
            difficulty, 
            keyword, 
            topic,
            solved
        } = params;

        // 백엔드는 0-based이므로 page - 1 전송
        queryParams.append('page', page - 1);
        queryParams.append('size', size);
        if (difficulty) queryParams.append('difficulty', difficulty);
        if (keyword && keyword.trim()) queryParams.append('keyword', keyword.trim());
        if (topic) queryParams.append('tags', topic);
        if (solved) queryParams.append('solved', solved);

        const res = await axiosInstance.get(`/algo/problems?${queryParams}`);
        console.log('✅ [getProblems] 응답:', res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getProblems] 요청 실패:", err);
        console.error("❌ 에러 데이터:", err.response?.data);
        
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
    const status = err.response?.status;
    const data = err.response?.data;

    // 서버가 JSON이 아니라 문자열/HTML/빈 응답 줄 수도 있어서 안전하게 처리
    const message =
      (typeof data === "string" ? data : data?.message) ||
      err.message ||
      "문제 풀이를 시작할 수 없습니다.";

    console.error("❌ [startProblemSolve] 요청 실패:", { status, data, err });

    return {
      error: true,
      status,
      code: (typeof data === "object" && data) ? data.code : undefined,
      message,
      raw: data, // 필요 없으면 빼도 됨
    };
  }
};

/**
 * 코드 제출
 * 변경사항 (2025-12-13): language (String) → languageId (Integer)
 */
export const submitCode = async (data) => {
    try {
        const res = await axiosInstance.post('/algo/submissions', {
            problemId: data.problemId,
            languageId: data.languageId,  // LANGUAGES.LANGUAGE_ID (Judge0 API ID)
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
 * 지원 언어 목록 조회
 * GET /api/algo/languages
 *
 * 프론트엔드에서 언어 드롭다운을 동적으로 구성하기 위해 사용
 */
export const getLanguages = async () => {
    try {
        const res = await axiosInstance.get('/algo/languages');
        console.log('✅ [getLanguages] 응답:', res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getLanguages] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "언어 목록을 가져오는데 실패했습니다." };
    }
};

/**
 * 알고리즘 토픽 목록 조회
 * GET /api/algo/problems/topics
 *
 * 카테고리별로 그룹화된 토픽 목록을 반환
 * 응답 형식: [{ category: "자료구조", topics: [{ value: "HASH", displayName: "해시" }, ...] }, ...]
 */
export const getTopics = async () => {
    try {
        const res = await axiosInstance.get('/algo/problems/topics');
        console.log('✅ [getTopics] 응답:', res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getTopics] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "토픽 목록을 가져오는데 실패했습니다." };
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
 * 변경사항 (2025-12-13): language (String) → languageId (Integer)
 */
export const runTestCode = async (data) => {
    try {
        const res = await axiosInstance.post('/algo/submissions/test', {
            problemId: data.problemId,
            languageId: data.languageId,  // LANGUAGES.LANGUAGE_ID (Judge0 API ID)
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
 * AI 문제 생성 (SSE 스트리밍 방식 - 검증 파이프라인 포함)
 * - Server-Sent Events를 통해 실시간 진행 상황 수신
 * - RAG 기반 Few-shot 학습 + 4단계 검증 파이프라인 적용
 * - 각 단계별 진행률을 콜백으로 전달
 *
 * @param {Object} data - 문제 생성 요청 데이터
 * @param {Object} callbacks - 콜백 함수들
 * @param {Function} callbacks.onStep - 진행 단계 업데이트 시 호출 (message, percentage)
 * @param {Function} callbacks.onComplete - 완료 시 호출
 * @param {Function} callbacks.onError - 에러 발생 시 호출
 * @returns {Function} SSE 연결 종료 함수
 */
export const generateProblemWithSSE = (data, callbacks) => {
    const { onStep, onComplete, onError } = callbacks;

    // 로그인된 사용자 ID 가져오기 (Rate Limit 추적용)
    const auth = getAuth();
    const userId = auth?.user?.userId;

    // URL 쿼리 파라미터 구성
    const params = new URLSearchParams({
        difficulty: data.difficulty,
        topic: data.topic,
        problemType: data.problemType || 'ALGORITHM',
    });

    if (data.additionalRequirements) {
        params.append('additionalRequirements', data.additionalRequirements);
    }

    // userId가 있으면 파라미터에 추가 (SSE는 Authorization 헤더 전송 불가)
    if (userId) {
        params.append('userId', userId);
    }

    // API 베이스 URL 가져오기 (검증 포함 스트리밍 엔드포인트 사용)
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:9443';
    const sseUrl = `${baseURL}/algo/problems/generate/validated/stream?${params.toString()}`;

    console.log('🔗 [SSE] 검증 포함 스트리밍 연결 시작:', sseUrl);

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
                    // 기존 방식 (AIProblemGeneratorService)
                    if (onStep) {
                        onStep(eventData.message);
                    }
                    break;

                case 'PROGRESS':
                    // 검증 파이프라인 진행률 (ProblemGenerationOrchestrator)
                    console.log(`📊 [SSE] 진행률: ${eventData.percentage}% - ${eventData.message}`);
                    if (onStep) {
                        onStep(eventData.message, eventData.percentage);
                    }
                    break;

                case 'COMPLETE':
                    // 완료 - 생성된 문제 데이터 전달
                    console.log('✅ [SSE] 문제 생성 완료:', eventData);
                    if (onComplete) {
                        // 검증 파이프라인은 eventData 자체에 데이터가 있음 (data 래핑 없음)
                        const completeData = eventData.data || eventData;
                        onComplete({
                            problemId: completeData.problemId,
                            title: completeData.title,
                            description: completeData.description,
                            difficulty: completeData.difficulty,
                            testCaseCount: completeData.testCaseCount,
                            generationTime: completeData.generationTime,
                            validationResults: completeData.validationResults,
                            hasValidationCode: completeData.hasValidationCode
                        });
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

/**
 * 문제 통계 정보 조회
 * GET /api/algo/problems/statistics
 * 
 * @returns {Object} 통계 데이터
 * - totalProblems: 전체 문제 수
 * - solvedProblems: 내가 푼 문제 수
 * - averageAccuracy: 평균 정답률
 * - totalAttempts: 총 응시자 (누적 풀이 횟수)
 */
export const getAlgorithmStatistics = async () => {
    try {
        const res = await axiosInstance.get('/algo/problems/statistics');
        console.log('✅ [getAlgorithmStatistics] 응답:', res.data);
        return res.data.data || res.data;
    } catch (err) {
        console.error("❌ [getAlgorithmStatistics] 요청 실패:", err);
        if (err.response?.data) {
            return { 
                error: true, 
                code: err.response.data.code, 
                message: err.response.data.message 
            };
        }
        return { 
            error: true, 
            message: "통계 정보를 가져오는데 실패했습니다." 
        };
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
 * @param {string} sessionId - 모니터링 세션 ID
 * @param {number|null} remainingSeconds - 남은 시간 (초)
 * @param {object|null} focusScoreStats - 집중도 점수 통계 (선택)
 *   - avgScore: 평균 점수 (-100 ~ 100)
 *   - finalScore: 최종 점수 (-100 ~ 100)
 *   - focusedPercentage: 집중 시간 비율 (%)
 *   - highFocusPercentage: 높은 집중 시간 비율 (%)
 *   - totalTime: 총 시간 (초)
 *   - focusedTime: 집중 시간 (초)
 */
export const endMonitoringSession = async (sessionId, remainingSeconds = null, focusScoreStats = null) => {
    try {
        const requestBody = {
            sessionId,
            remainingSeconds
        };

        // 집중도 점수 통계가 있으면 포함
        if (focusScoreStats) {
            requestBody.focusScoreStats = {
                avgScore: focusScoreStats.avgScore || 0,
                finalScore: focusScoreStats.finalScore || focusScoreStats.currentScore || 0,
                focusedPercentage: focusScoreStats.focusedPercentage || 0,
                highFocusPercentage: focusScoreStats.highFocusPercentage || 0,
                totalTime: focusScoreStats.totalTime || 0,
                focusedTime: focusScoreStats.focusedTime || 0
            };
        }

        const res = await axiosInstance.post('/algo/monitoring/end', requestBody);
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

/**
 * 일별 문제 풀이 수 조회 (GitHub 잔디 캘린더용)
 * @param {number} userId - 사용자 ID (테스트용)
 * @param {number} months - 조회할 개월 수 (기본 12)
 */
export const getContributions = async (userId, months = 12) => {
    try {
        const params = { months };
        if (userId) params.testUserId = userId;
        const res = await axiosInstance.get('/algo/missions/contributions', { params });
        return res.data;
    } catch (err) {
        console.error('❌ [getContributions] 요청 실패:', err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: '잔디 캘린더 데이터를 가져오는데 실패했습니다.' };
    }
};

// ============== 문제 풀 (Pre-generation Pool) API ==============

/**
 * 풀에서 문제 꺼내기 (SSE 스트리밍)
 * - 풀에 문제가 있으면 즉시 반환 (< 1초)
 * - 풀이 비어있으면 실시간 생성으로 자동 전환 (진행률 표시)
 * - 문제 반환 후 비동기로 풀 자동 보충
 *
 * @param {Object} data - 요청 데이터
 * @param {string} data.difficulty - 난이도 (BRONZE, SILVER, GOLD, PLATINUM)
 * @param {string} data.topic - 알고리즘 주제 (displayName)
 * @param {string} data.theme - 스토리 테마 (SANTA_DELIVERY 등)
 * @param {Object} callbacks - 콜백 함수들
 * @param {Function} callbacks.onStep - 진행 단계 업데이트 시 호출 (message, percentage)
 * @param {Function} callbacks.onComplete - 완료 시 호출
 * @param {Function} callbacks.onError - 에러 발생 시 호출
 * @returns {Function} SSE 연결 종료 함수
 */
export const drawProblemFromPool = (data, callbacks) => {
    const { onStep, onComplete, onError } = callbacks;

    // 로그인된 사용자 ID 가져오기 (ALGO_CREATER 저장용)
    const auth = getAuth();
    const userId = auth?.user?.userId;

    // URL 쿼리 파라미터 구성
    const params = new URLSearchParams({
        difficulty: data.difficulty,
        topic: data.topic,
        theme: data.theme || data.storyTheme,  // storyTheme도 지원
    });

    // userId가 있으면 파라미터에 추가
    if (userId) {
        params.append('userId', userId);
    }

    // API 베이스 URL 가져오기
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:9443';
    const sseUrl = `${baseURL}/algo/pool/draw/stream?${params.toString()}`;

    console.log('🔗 [Pool SSE] 풀에서 문제 꺼내기 연결:', sseUrl);

    // EventSource 생성 (SSE 연결)
    const eventSource = new EventSource(sseUrl, {
        withCredentials: true
    });

    // 메시지 수신 핸들러
    eventSource.onmessage = (event) => {
        try {
            let rawData = event.data;
            if (rawData.startsWith('data: ')) {
                rawData = rawData.substring(6).trim();
            }

            const eventData = JSON.parse(rawData);
            console.log('📨 [Pool SSE] 이벤트 수신:', eventData);

            switch (eventData.type) {
                case 'PROGRESS':
                    // 실시간 생성 시 진행률 (풀이 비어있을 때만)
                    console.log(`📊 [Pool SSE] 진행률: ${eventData.percentage}% - ${eventData.message}`);
                    if (onStep) {
                        onStep(eventData.message, eventData.percentage);
                    }
                    break;

                case 'COMPLETE': {
                    // 완료 - 풀에서 즉시 반환 또는 실시간 생성 완료
                    const fromPool = eventData.fromPool;
                    console.log(`✅ [Pool SSE] 문제 전달 완료 - ${fromPool ? '풀에서 즉시 반환' : '실시간 생성'}`);

                    if (onComplete) {
                        onComplete({
                            problemId: eventData.problemId,
                            title: eventData.title,
                            description: eventData.description,
                            difficulty: eventData.difficulty,
                            testCaseCount: eventData.testCaseCount,
                            generationTime: eventData.generationTime,
                            fromPool: fromPool,  // 풀에서 온 문제인지 여부
                            fetchTime: eventData.fetchTime  // 풀에서 가져온 응답 시간
                        });
                    }
                    eventSource.close();
                    break;
                }

                case 'ERROR':
                    console.error('❌ [Pool SSE] 에러:', eventData.message);
                    if (onError) {
                        onError(eventData.message);
                    }
                    eventSource.close();
                    break;

                default:
                    console.warn('⚠️ [Pool SSE] 알 수 없는 이벤트 타입:', eventData.type);
            }
        } catch (parseError) {
            console.error('❌ [Pool SSE] 이벤트 파싱 실패:', parseError, event.data);
        }
    };

    eventSource.onopen = () => {
        console.log('✅ [Pool SSE] 연결 성공');
    };

    eventSource.onerror = (error) => {
        console.error('❌ [Pool SSE] 연결 에러:', error);
        if (eventSource.readyState === EventSource.CLOSED) {
            console.log('🔌 [Pool SSE] 연결 종료됨');
        } else {
            if (onError) {
                onError('서버 연결이 끊어졌습니다. 다시 시도해주세요.');
            }
        }
        eventSource.close();
    };

    return () => {
        console.log('🔌 [Pool SSE] 수동 연결 종료');
        eventSource.close();
    };
};

/**
 * 풀 상태 조회
 * GET /api/algo/pool/status
 */
export const getPoolStatus = async () => {
    try {
        const res = await axiosInstance.get('/algo/pool/status');
        console.log('✅ [getPoolStatus] 응답:', res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getPoolStatus] 요청 실패:", err);
        if (err.response?.data) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        return { error: true, message: "풀 상태를 가져오는데 실패했습니다." };
    }
};

// ============== 상수 정의 ==============

export const DIFFICULTY_OPTIONS = [
    { value: '', label: '난이도 전체', color: 'gray' },
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

/**
 * 언어 옵션 목록 (필터용)
 *
 * @deprecated 문제 풀이 시 사용 가능한 언어는 백엔드에서 동적으로 제공됩니다.
 * startProblemSolve API 응답의 availableLanguages 필드를 사용하세요.
 * 각 언어는 { languageId, languageName, timeLimit, memoryLimit } 형태입니다.
 *
 * 변경사항 (2025-12-13):
 * - 백엔드에서 availableLanguages를 languageId (Integer) 기반으로 제공
 * - 이 상수는 필터링/검색 용도로만 유지
 */
export const LANGUAGE_OPTIONS = [
    { id: 51, label: 'C#', piston: 'csharp.net' },
    { id: 82, label: 'SQLite', piston: 'sqlite3' },
    { id: 83, label: 'Swift', piston: 'swift' },
    { id: 91, label: 'Java', piston: 'java' },
    { id: 93, label: 'JavaScript', piston: 'javascript' },
    { id: 94, label: 'TypeScript', piston: 'typescript' },
    { id: 100, label: 'Python', piston: 'python' },
    { id: 105, label: 'C++', piston: 'c++' },
    { id: 106, label: 'Go', piston: 'go' },
    { id: 108, label: 'Rust', piston: 'rust' },
    { id: 111, label: 'Kotlin', piston: 'kotlin' },
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

/**
 * 알고리즘 레벨 정보
 *
 * 변경사항 (2025-12-17): XP 기반 레벨 시스템으로 전환
 * - minSolved 대신 requiredXp 사용 (XP 기반 레벨 산정)
 * - 레벨 임계값: EMERALD(0), SAPPHIRE(300), RUBY(1000), DIAMOND(3000)
 * - XP 획득: BRONZE=10, SILVER=25, GOLD=50, PLATINUM=100 (첫 정답 +50%)
 */
export const ALGO_LEVEL_INFO = {
    EMERALD: {
        name: '에메랄드',
        color: 'emerald',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300',
        icon: '💎',
        requiredXp: 0,
        rewardPoints: 10
    },
    SAPPHIRE: {
        name: '사파이어',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        icon: '💠',
        requiredXp: 300,
        rewardPoints: 15
    },
    RUBY: {
        name: '루비',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        icon: '🔴',
        requiredXp: 1000,
        rewardPoints: 25
    },
    DIAMOND: {
        name: '다이아몬드',
        color: 'cyan',
        bgColor: 'bg-cyan-100',
        textColor: 'text-cyan-700',
        borderColor: 'border-cyan-300',
        icon: '💎',
        requiredXp: 3000,
        rewardPoints: 40
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
