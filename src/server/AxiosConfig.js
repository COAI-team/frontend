import axios, { AxiosError } from "axios";
import { getAuth, saveAuth, removeAuth } from "../utils/auth/token";

const API_URL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

// 강제로 baseURL 적용
axiosInstance.defaults.baseURL = API_URL;

// =====================================================
// 1) 요청 인터셉터 — AccessToken 자동 주입
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
// 2) 응답 인터셉터 — Token 만료 처리
// =====================================================

let isRefreshing = false;
let refreshCallbacks = [];

function onTokenRefreshed(newToken) {
    refreshCallbacks.forEach((cb) => cb(newToken));
    refreshCallbacks = [];
}

function isExpired(error) {
    return (
        error?.response?.status === 401 &&
        error?.response?.data?.code === "TOKEN_EXPIRED"
    );
}

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
                "서버와 연결되지 않았습니다.",
                "NO_RESPONSE",
                error.config,
                error.request,
                { status: 0 }
            );
        }

        const originalRequest = error.config;

        // 🔥 AccessToken 만료 처리
        if (isExpired(error)) {
            console.warn("⚠ AccessToken expired → Refreshing...");

            const auth = getAuth();
            const refreshToken = auth?.refreshToken;

            if (!refreshToken) {
                removeAuth();
                globalThis.location.replace("/signin");
                return;
            }

            // Refresh 로직 단독 실행
            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const newAccessToken = await refreshAccessToken(refreshToken);

                    const updated = { ...auth, accessToken: newAccessToken };
                    saveAuth(updated);

                    isRefreshing = false;
                    onTokenRefreshed(newAccessToken);
                } catch (refreshError) {
                    console.error("❌ Refresh 실패:", refreshError);

                    removeAuth();
                    globalThis.location.replace("/signin");
                    throw refreshError;
                }
            }

            // Refresh 완료될 때까지 대기 후 재요청
            return new Promise((resolve) => {
                refreshCallbacks.push((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(axiosInstance(originalRequest));
                });
            });
        }

        throw error;
    }
);

export default axiosInstance;