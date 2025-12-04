import axios, { AxiosError } from "axios";
import { getAuth, saveAuth, removeAuth } from "../utils/auth/token";

const API_URL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

// baseURL 한 번 더 강제
axiosInstance.defaults.baseURL = API_URL;

// =====================================================
// 1) 요청 인터셉터: AccessToken 자동 주입
// =====================================================
axiosInstance.interceptors.request.use(
    (config) => {
        const auth = getAuth();

        if (auth?.accessToken) {
            config.headers.Authorization = `Bearer ${auth.accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// =====================================================
// 2) 응답 인터셉터: Token 만료 처리 + 공통 401/403 핸들링
// =====================================================

let isRefreshing = false;
let refreshCallbacks = [];

const onTokenRefreshed = (newToken) => {
    refreshCallbacks.forEach((cb) => cb(newToken));
    refreshCallbacks = [];
};

const isExpired = (error) =>
    error?.response?.status === 401 &&
    error?.response?.data?.code === "TOKEN_EXPIRED";

async function refreshAccessToken(refreshToken) {
    const refreshUrl = `${API_URL}/users/refresh`;

    const res = await axios.post(
        refreshUrl,
        {},
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        }
    );

    return res.data.accessToken;
}

axiosInstance.interceptors.response.use(
    (res) => res,

    async (error) => {
        if (!error.response) {
            throw new AxiosError(
                "서버로부터 응답을 받지 못했습니다.",
                "NO_RESPONSE",
                error.config,
                error.request,
                { status: 0 }
            );
        }

        const originalRequest = error.config;

        // 2-1) AccessToken 만료 → refresh 후 재시도
        if (isExpired(error)) {
            const auth = getAuth();
            const refreshToken = auth?.refreshToken;

            if (!refreshToken) {
                removeAuth();
                globalThis.location.replace("/signin");
                return;
            }

            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const newAccessToken = await refreshAccessToken(refreshToken);

                    const updated = { ...auth, accessToken: newAccessToken };
                    saveAuth(updated);

                    isRefreshing = false;
                    onTokenRefreshed(newAccessToken);
                } catch (refreshError) {
                    console.error("Refresh 실패:", refreshError);

                    removeAuth();
                    globalThis.location.replace("/signin");
                    throw refreshError;
                }
            }

            return new Promise((resolve) => {
                refreshCallbacks.push((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(axiosInstance(originalRequest));
                });
            });
        }

        // 2-2) 만료가 아닌 401/403 → 로그인 만료 처리
        const status = error?.response?.status;
        const skipAuthRedirect =
            originalRequest?.headers?.["X-Skip-Auth-Redirect"] === "true" ||
            originalRequest?._skipAuthRedirect;

        if (!skipAuthRedirect && (status === 401 || status === 403)) {
            removeAuth();

            const currentPath =
                (globalThis.location?.pathname || "/") +
                (globalThis.location?.search || "");

            if (!originalRequest?._redirectedForAuth) {
                originalRequest._redirectedForAuth = true;
                const redirectParam = encodeURIComponent(currentPath);
                globalThis.location.replace(`/signin?redirect=${redirectParam}`);
            }
        }

        throw error;
    }
);

export default axiosInstance;
