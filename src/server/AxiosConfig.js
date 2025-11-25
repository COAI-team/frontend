import axios, { AxiosError } from "axios";

const axiosInstance = axios.create({
    baseURL: "https://114.204.9.108:10443",
    timeout: 10000,
});

// -----------------------
// 1) 요청 인터셉터: AccessToken 자동 추가
// -----------------------
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        throw error;
    }
);

// -----------------------
// 2) 응답 인터셉터 (401 → 자동 토큰 재발급)
// -----------------------

let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
    for (const cb of refreshSubscribers) {
        cb(newToken);
    }
    refreshSubscribers = [];
}

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {

        const originalRequest = error.config;

        // 서버 응답 없음 (CORS/HTTPS/network fail)
        if (!error.response) {
            console.error("❌ No server response:", error);

            throw new AxiosError(
                "서버에 연결할 수 없습니다.",
                "NO_RESPONSE",
                error.config,
                error.request,
                {
                    status: 0,
                    data: { message: "서버에 연결할 수 없습니다." }
                }
            );
        }

        const { status, data } = error.response;

        // -----------------------------------------
        // 🔄 AccessToken 만료 (401 + TOKEN_EXPIRED)
        // -----------------------------------------
        if (status === 401 && data?.code === "TOKEN_EXPIRED") {
            console.warn("⛔ AccessToken expired → Refreshing...");

            // 동시에 여러 요청이 실패하면 첫 요청만 Refresh 실행
            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const refreshToken = localStorage.getItem("refreshToken");
                    if (!refreshToken) {
                        console.error("❌ Refresh Token 없음 → 로그인 페이지 이동");
                        localStorage.removeItem("accessToken");
                        globalThis.location.replace("/login");
                        return;
                    }

                    // Backend 스펙에 맞는 Refresh 호출
                    const res = await axios.post(
                        "https://114.204.9.108:10443/users/refresh",
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${refreshToken}`
                            }
                        }
                    );

                    const newAccessToken = res.data.accessToken;
                    console.log("🔄 새 AccessToken:", newAccessToken);

                    localStorage.setItem("accessToken", newAccessToken);

                    isRefreshing = false;
                    onTokenRefreshed(newAccessToken);

                } catch (refreshError) {
                    console.error("❌ Refresh Token expired or invalid.");

                    isRefreshing = false;
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");

                    globalThis.location.replace("/login");
                    throw refreshError;
                }
            }

            // Refresh 진행 중이면 기다렸다가 다시 실행
            return new Promise((resolve) => {
                refreshSubscribers.push((token) => {
                    if (!originalRequest.headers) {
                        originalRequest.headers = {};
                    }
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(axiosInstance(originalRequest));
                });
            });
        }

        // 기본 에러 처리
        throw error;
    }
);

export default axiosInstance;