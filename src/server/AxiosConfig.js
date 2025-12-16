import axios, {AxiosError} from "axios";
import {getAuth, saveAuth, removeAuth} from "../utils/auth/token";

const API_URL = import.meta.env.VITE_API_URL;
//const API_URL = "http://localhost:9443";
export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  withCredentials: true, // 쿠키 기반 인증(HTTPS 포함) 유지
});

// baseURL 한 번 더 강제
axiosInstance.defaults.baseURL = API_URL;
axiosInstance.defaults.withCredentials = true;

// =====================================================
// 1) 요청 인터셉터: AccessToken 자동 주입
// =====================================================
axiosInstance.interceptors.request.use(
  (config) => {

    // ⛔ 1) _skipAuth 요청은 토큰 주입 건너뛰기 (GitHub 연동용)
    if (config._skipAuth === true) {
      return config;
    }

    // ⛔ 2) 평소에는 자동 토큰 주입
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

const onTokenRefreshFailed = (error) => {
  refreshCallbacks.forEach((cb) => cb(null, error));
  refreshCallbacks = [];
};

const isExpired = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;

  return status === 401 && code === "TOKEN_EXPIRED";
};

async function refreshAccessToken(refreshToken) {
  const refreshUrl = `${API_URL}/users/refresh`;

  try {
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
  } catch (error) {
    console.error('❌ Refresh 실패:', {
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
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
        {status: 0}
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

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshCallbacks.push((token, err) => {
            if (err) {
              reject(err);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const newAccessToken = await refreshAccessToken(refreshToken);

        const updated = {...auth, accessToken: newAccessToken};
        saveAuth(updated);

        onTokenRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        onTokenRefreshFailed(refreshError);

        removeAuth();
        globalThis.location.replace("/signin");
        throw refreshError;

      } finally {
        isRefreshing = false;
      }
    }

    // 2-2) 만료가 아닌 401/403 → 로그인 만료 처리
    const status = error?.response?.status;
    const skipAuthRedirect =
      originalRequest?.headers?.["X-Skip-Auth-Redirect"] === "true" ||
      originalRequest?._skipAuthRedirect;

    const currentPath = globalThis.location?.pathname || "/";

    if (currentPath.startsWith("/signin")) {
      throw error;
    }

    // 공개 GET 엔드포인트 체크
    const isPublicGetRequest = (request) => {
      if (request.method?.toUpperCase() !== 'GET') return false;

      const publicPaths = [
        '/freeboard',
        '/codeboard',
        '/like',
        '/comment',
        '/algo',
        '/analysis',
        '/api/analysis'
      ];

      const url = request.url || '';
      return publicPaths.some(path => url.includes(path));
    };

    // 공개 GET 요청이면 리다이렉트하지 않음
    if (isPublicGetRequest(originalRequest) && (status === 401 || status === 403)) {
      throw error;
    }

    if (!skipAuthRedirect && (status === 401 || status === 403)) {
      removeAuth();

      const redirectParam = encodeURIComponent(
        currentPath + (globalThis.location?.search || "")
      );

      if (!originalRequest?._redirectedForAuth) {
        originalRequest._redirectedForAuth = true;
        globalThis.location.replace(`/signin?redirect=${redirectParam}`);
      }
    }

    throw error;
  }
);

export default axiosInstance;
