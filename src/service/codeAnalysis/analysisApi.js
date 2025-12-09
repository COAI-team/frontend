import axiosInstance from "../../server/AxiosConfig";

// ============== 코드 분석(CodeNose) API ==============

/**
 * GitHub 파일 내용 저장 (1단계)
 * @param {Object} data
 * @param {string} data.repositoryUrl
 * @param {string} data.owner
 * @param {string} data.repo
 * @param {string} data.filePath
 * @param {number} data.userId
 */
export const saveFile = async (data) => {
    try {
        console.log("📨 [saveFile] 요청 시작:", data);
        const res = await axiosInstance.post('/api/github/save-file', data);
        console.log("✅ [saveFile] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [saveFile] 요청 실패:", err);
        throw err;
    }
};

/**
 * 저장된 파일 분석 요청 (2단계)
 * @param {Object} data
 * @param {string} data.repositoryUrl
 * @param {string} data.filePath
 * @param {string[]} data.analysisTypes
 * @param {number} data.toneLevel
 * @param {string} data.customRequirements
 * @param {number} data.userId
 */
export const analyzeStoredFile = async (data) => {
    try {
        console.log("📨 [analyzeStoredFile] 요청 시작:", data);
        const res = await axiosInstance.post('/analysis/analyze-stored', data);
        console.log("✅ [analyzeStoredFile] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [analyzeStoredFile] 요청 실패:", err);
        throw err;
    }
};

/**
 * 분석 이력 조회 (목록)
 * @param {number} userId
 */
export const getAnalysisHistory = async (userId) => {
    try {
        console.log("📨 [getAnalysisHistory] 요청 시작:", userId);
        const res = await axiosInstance.get(`/analysis/history/${userId}`);
        console.log("✅ [getAnalysisHistory] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getAnalysisHistory] 요청 실패:", err);
        throw err;
    }
};

/**
 * 분석 결과 상세 조회
 * @param {string} analysisId
 */
export const getAnalysisResult = async (analysisId) => {
    try {
        console.log("📨 [getAnalysisResult] 요청 시작:", analysisId);
        const res = await axiosInstance.get(`/analysis/result/${analysisId}`);
        console.log("✅ [getAnalysisResult] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getAnalysisResult] 요청 실패:", err);
        throw err;
    }
};

// Auth Token Helper
const getAuthToken = () => {
    const saved = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return parsed?.accessToken;
        } catch (e) {
            return null;
        }
    }
    return null;
};


