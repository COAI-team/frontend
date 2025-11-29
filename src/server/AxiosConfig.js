import axios, { AxiosError } from "axios";

export const axiosInstance = axios.create({
    // baseURL: "/api",
    baseURL: "http://localhost:8090",
    timeout: 10000,
});

// 강제로 baseURL 설정 (로그에서 /로 나오는 문제 방지) .. 안돌아간다면 아래 주석하고 해보세요.. 
// axiosInstance.defaults.baseURL = "https://localhost:9443";

// =====================================================
// 1) 요청 시 AccessToken 자동 주입
// =====================================================
axiosInstance.interceptors.request.use(
    (config) => {
        const saved = localStorage.getItem("auth") || sessionStorage.getItem("auth");

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const token = parsed?.accessToken;

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (err) {
                console.error("⚠ auth 파싱 실패 → 초기화", err);

                localStorage.removeItem("auth");
                sessionStorage.removeItem("auth");
            }
        }
        // 디버깅 로그 강화
        console.log(`[AxiosConfig] Request to: ${config.baseURL}${config.url}`);

        return config;
    },
    (error) => Promise.reject(error)
);

// =====================================================
// 2) 응답 인터셉터 — AccessToken 만료 처리
// =====================================================

let isRefreshing = false;
let refreshSubscribers = [];

// 모든 구독자에게 새 토큰 적용
function onTokenRefreshed(newToken) {
    for (const cb of refreshSubscribers) {
        cb(newToken);
    }
    refreshSubscribers = [];
}

// 에러가 AccessToken 만료인지 판별
function isTokenExpiredError(error) {
    return (
        error?.response?.status === 401 &&
        error?.response?.data?.code === "TOKEN_EXPIRED"
    );
}

// 저장된 auth 가져오기
function loadAuth() {
    const raw = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
}

// auth 저장
function saveAuth(data) {
    if (localStorage.getItem("auth")) {
        localStorage.setItem("auth", JSON.stringify(data));
    } else {
        sessionStorage.setItem("auth", JSON.stringify(data));
    }
}

// refresh 토큰으로 AccessToken 재발급
async function requestNewAccessToken(refreshToken) {
    const res = await axios.post(
        // "https://114.204.9.108:10443/users/refresh",
        "https://localhost:9443/users/refresh", // ✅ localhost로 변경
        {},
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        }
    );

    return res.data.accessToken;
}

// =====================================================
// 응답 인터셉터 본문
// =====================================================
axiosInstance.interceptors.response.use(
    (response) => response,

    async (error) => {
        // 서버 응답 자체 없음
        if (!error.response) {
            console.error("❌ No server response:", error);

            throw new AxiosError(
                "서버에 연결할 수 없습니다.",
                "NO_RESPONSE",
                error.config,
                error.request,
                {
                    status: 0,
                    data: { message: "서버에 연결할 수 없습니다." },
                }
            );
        }

        const originalRequest = error.config;

        // --------------------------------------------------
        // 🔥 AccessToken 만료 케이스
        // --------------------------------------------------
        if (isTokenExpiredError(error)) {
            console.warn("⛔ AccessToken expired → Refreshing...");

            const parsed = loadAuth();
            const refreshToken = parsed?.refreshToken;

            if (!refreshToken) {
                console.error("❌ RefreshToken 없음 → 로그아웃");
                localStorage.removeItem("auth");
                sessionStorage.removeItem("auth");
                globalThis.location.replace("/signin");
                return;
            }

            // 🔹 최초 요청만 refresh 실행
            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const newAccessToken = await requestNewAccessToken(refreshToken);

                    // auth 업데이트
                    const updatedAuth = { ...parsed, accessToken: newAccessToken };
                    saveAuth(updatedAuth);

                    isRefreshing = false;
                    onTokenRefreshed(newAccessToken);
                } catch (error_) {
                    console.error("❌ RefreshToken invalid:", error_);

                    isRefreshing = false;
                    localStorage.removeItem("auth");
                    sessionStorage.removeItem("auth");

                    globalThis.location.replace("/signin");
                    throw error_;
                }
            }

            // 🔹 refresh 진행 중 → 새 토큰 적용 후 retry
            return new Promise((resolve) => {
                refreshSubscribers.push((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(axiosInstance(originalRequest));
                });
            });
        }

        // --------------------------------------------------
        // 다른 에러는 그대로 throw
        // --------------------------------------------------
        throw error;
    }
);

export default axiosInstance;