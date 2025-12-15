import axiosInstance from "../../server/AxiosConfig";

/**
 * GitHub 자동커밋 설정 API
 * @since 2025-12-13
 */

// GitHub 설정 조회
export const getGithubSettings = async () => {
    try {
        const res = await axiosInstance.get("/github/settings");
        return res.data;
    } catch (err) {
        console.error("❌ [getGithubSettings] 오류:", err);
        return { error: true, message: err.response?.data?.message || "설정 조회 실패" };
    }
};

// GitHub 설정 저장
export const saveGithubSettings = async (settings) => {
    try {
        const res = await axiosInstance.post("/github/settings", settings);
        return res.data;
    } catch (err) {
        console.error("❌ [saveGithubSettings] 오류:", err);
        return { error: true, message: err.response?.data?.message || "설정 저장 실패" };
    }
};

// 자동 커밋 토글
export const toggleAutoCommit = async (enabled) => {
    try {
        const res = await axiosInstance.post("/github/settings/auto-commit", { enabled });
        return res.data;
    } catch (err) {
        console.error("❌ [toggleAutoCommit] 오류:", err);
        return { error: true, message: err.response?.data?.message || "설정 변경 실패" };
    }
};

// 저장소 목록 조회
export const listGithubRepositories = async () => {
    try {
        const res = await axiosInstance.get("/github/repositories");
        return res.data;
    } catch (err) {
        console.error("❌ [listGithubRepositories] 오류:", err);
        return { error: true, message: err.response?.data?.message || "저장소 목록 조회 실패" };
    }
};

// 새 저장소 생성
export const createGithubRepository = async (repoName, isPrivate = true) => {
    try {
        const res = await axiosInstance.post("/github/repositories/create", {
            repoName,
            isPrivate
        });
        return res.data;
    } catch (err) {
        console.error("❌ [createGithubRepository] 오류:", err);
        return { error: true, message: err.response?.data?.message || "저장소 생성 실패" };
    }
};

// 기존 저장소 선택
export const selectGithubRepository = async (repoName, repoUrl) => {
    try {
        const res = await axiosInstance.post("/github/repositories/select", {
            repoName,
            repoUrl
        });
        return res.data;
    } catch (err) {
        console.error("❌ [selectGithubRepository] 오류:", err);
        return { error: true, message: err.response?.data?.message || "저장소 선택 실패" };
    }
};

// 제출 결과 GitHub 커밋
export const commitToGithub = async (submissionId) => {
    try {
        const res = await axiosInstance.post(`/github/commit/${submissionId}`);
        return res.data;
    } catch (err) {
        console.error("❌ [commitToGithub] 오류:", err);
        return { error: true, message: err.response?.data?.message || "커밋 실패" };
    }
};
