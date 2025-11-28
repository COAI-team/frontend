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

/**
 * 저장된 파일 분석 요청 (스트리밍)
 * @param {Object} data
 * @param {Function} onChunk - 청크 수신 시 콜백 (chunk: string) => void
 */
export const analyzeStoredFileStream = async (data, onChunk) => {
    try {
        console.log("📨 [analyzeStoredFileStream] 요청 시작:", data);
        
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/analysis/analyze-stored/stream', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const lines = buffer.split("\n");
            // 마지막 라인은 불완전할 수 있으므로 버퍼에 남김
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith("data:")) {
                    let content = line.substring(5);
                    // data: 뒤에 아무것도 없으면 개행으로 처리 (Spring SSE 특성상)
                    if (content.length === 0) {
                        content = "\n";
                    }
                    onChunk(content);
                }
            }
        }
        
        // 남은 버퍼 처리
        if (buffer && buffer.startsWith("data:")) {
             let content = buffer.substring(5);
             if (content.length === 0) {
                 content = "\n";
             }
             onChunk(content);
        }
        
        console.log("✅ [analyzeStoredFileStream] 스트림 완료");
    } catch (err) {
        console.error("❌ [analyzeStoredFileStream] 요청 실패:", err);
        throw err;
    }
};
