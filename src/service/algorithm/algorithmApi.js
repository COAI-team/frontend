/**
 * 알고리즘 API 서비스
 * 백엔드 알고리즘 도메인과 통신하는 모든 API 함수들
 * 위치: src/service/algorithm/algorithmApi.js
 */

import axios from 'axios';

// API 기본 설정
const BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:9443';

// Axios 인스턴스 생성 (알고리즘 전용)
const algorithmApi = axios.create({
  baseURL: `${BASE_URL}/algo`,
  timeout: 30000, // 30초 (AI 호출 고려)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (JWT 토큰 자동 추가)
algorithmApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
algorithmApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 토큰 만료 처리
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ================================
// 문제 관리 API
// ================================

/**
 * 문제 목록 조회
 * @param {Object} params - 조회 파라미터
 * @param {string} params.difficulty - 난이도 필터
 * @param {string} params.source - 출처 필터
 * @param {string} params.keyword - 검색 키워드
 * @param {number} params.page - 페이지 번호
 * @param {number} params.size - 페이지 크기
 */
export const getProblems = async (params = {}) => {
  try {
    const response = await algorithmApi.get('/problems', { params });
    return response.data;
  } catch (error) {
    console.error('문제 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 문제 상세 조회
 * @param {number} problemId - 문제 ID
 */
export const getProblem = async (problemId) => {
  try {
    const response = await algorithmApi.get(`/problems/${problemId}`);
    return response.data;
  } catch (error) {
    console.error('문제 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * AI 문제 생성 요청
 * @param {Object} requestData - 문제 생성 요청 데이터
 * @param {string} requestData.difficulty - 난이도
 * @param {string} requestData.topic - 주제
 * @param {string} requestData.language - 언어
 */
export const generateProblem = async (requestData) => {
  try {
    const response = await algorithmApi.post('/problems/generate', requestData);
    return response.data;
  } catch (error) {
    console.error('AI 문제 생성 실패:', error);
    throw error;
  }
};

// ================================
// 문제 풀이 API
// ================================

/**
 * 문제 풀이 세션 시작
 * @param {number} problemId - 문제 ID
 */
export const startSolvingSession = async (problemId) => {
  try {
    const response = await algorithmApi.get(`/problems/${problemId}/solve`);
    return response.data;
  } catch (error) {
    console.error('문제 풀이 세션 시작 실패:', error);
    throw error;
  }
};

/**
 * 코드 제출
 * @param {Object} submissionData - 제출 데이터
 * @param {number} submissionData.problemId - 문제 ID
 * @param {string} submissionData.language - 언어
 * @param {string} submissionData.sourceCode - 소스코드
 * @param {number} submissionData.elapsedTime - 소요 시간
 */
export const submitCode = async (submissionData) => {
  try {
    const response = await algorithmApi.post('/submissions', submissionData);
    return response.data;
  } catch (error) {
    console.error('코드 제출 실패:', error);
    throw error;
  }
};

/**
 * 제출 결과 조회
 * @param {number} submissionId - 제출 ID
 */
export const getSubmissionResult = async (submissionId) => {
  try {
    const response = await algorithmApi.get(`/submissions/${submissionId}`);
    return response.data;
  } catch (error) {
    console.error('제출 결과 조회 실패:', error);
    throw error;
  }
};

// ================================
// 집중도 추적 API (Eye Tracking)
// ================================

/**
 * 집중도 추적 세션 시작
 * @param {Object} sessionData - 세션 데이터
 */
export const startFocusSession = async (sessionData) => {
  try {
    const response = await algorithmApi.post('/focus/sessions', sessionData);
    return response.data;
  } catch (error) {
    console.error('집중도 세션 시작 실패:', error);
    throw error;
  }
};

/**
 * 집중도 이벤트 전송 (배치)
 * @param {Array} events - 집중도 이벤트 배열
 */
export const sendFocusEvents = async (events) => {
  try {
    const response = await algorithmApi.post('/focus/events/batch', { events });
    return response.data;
  } catch (error) {
    console.error('집중도 이벤트 전송 실패:', error);
    throw error;
  }
};

// ================================
// 랭킹 API
// ================================

/**
 * 랭킹 조회
 * @param {Object} params - 랭킹 조회 파라미터
 */
export const getRankings = async (params = {}) => {
  try {
    const response = await algorithmApi.get('/rankings', { params });
    return response.data;
  } catch (error) {
    console.error('랭킹 조회 실패:', error);
    throw error;
  }
};

/**
 * 내 랭킹 조회
 */
export const getMyRanking = async () => {
  try {
    const response = await algorithmApi.get('/rankings/me');
    return response.data;
  } catch (error) {
    console.error('내 랭킹 조회 실패:', error);
    throw error;
  }
};

// ================================
// GitHub 연동 API
// ================================

/**
 * GitHub 레포지토리 목록 조회
 */
export const getGithubRepositories = async () => {
  try {
    const response = await algorithmApi.get('/github/repositories');
    return response.data;
  } catch (error) {
    console.error('GitHub 레포지토리 조회 실패:', error);
    throw error;
  }
};

/**
 * GitHub 자동 커밋
 * @param {Object} commitData - 커밋 데이터
 */
export const commitToGithub = async (commitData) => {
  try {
    const response = await algorithmApi.post('/github/commit', commitData);
    return response.data;
  } catch (error) {
    console.error('GitHub 커밋 실패:', error);
    throw error;
  }
};

// 기본 export
export default algorithmApi;