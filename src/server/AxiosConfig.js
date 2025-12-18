import axios, { AxiosError } from "axios";
import { getAuth, saveAuth, removeAuth } from "../utils/auth/token";

const API_URL = import.meta.env.VITE_API_URL;

const PUBLIC_PATHS = new Set([
  '/freeboard', '/codeboard', '/like', '/comment',
  '/algo', '/analysis', '/api/analysis'
]);

const REFRESH_URL = `${API_URL}/users/refresh`;

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  withCredentials: true, // 쿠키 기반 인증(HTTPS 포함) 유지
});

axiosInstance.defaults.baseURL = API_URL;
axiosInstance.defaults.withCredentials = true;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getAuthHeaders = () => {
  const auth = getAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
};

const isPublicGetRequest = (config) => {
  if (config.method?.toUpperCase() !== 'GET') return false;
  return PUBLIC_PATHS.has(config.url?.split('?')[0]?.split('/').pop());
};

const refreshAccessToken = async () => {
  const auth = getAuth();
  if (!auth?.refreshToken) throw new AxiosError('No refresh token');

  const response = await axios.post(REFRESH_URL, {}, {
    headers: { Authorization: `Bearer ${auth.refreshToken}` },
  });

  const newToken = response.data.accessToken;
  saveAuth({ ...auth, accessToken: newToken });
  return newToken;
};

// ✅ 요청 인터셉터: Promise.reject → throw
axiosInstance.interceptors.request.use(
  (config) => {
    if (config._skipAuth) return config;
    Object.assign(config.headers, getAuthHeaders());
    return config;
  },
  (error) => {
    throw error;  // ✅ 수정1
  }
);

// ✅ 응답 인터셉터: 모든 Promise.reject → throw
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalConfig = error.config;

    if (!error.response) {
      throw new AxiosError("서버 연결 실패", "NETWORK_ERROR", originalConfig);
    }

    const { status } = error.response;
    const isTokenExpired = status === 401 && error.response.data?.code === "TOKEN_EXPIRED";

    if (isTokenExpired && !originalConfig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject
          });
        })
          .then((token) => {
            originalConfig.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalConfig);
          })
          .catch((err) => {
            throw err;
          });
      }

      originalConfig._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalConfig);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeAuth();
        globalThis.location.replace("/signin");
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    // ✅ 권한 에러 처리
    if (status === 401 && !isPublicGetRequest(originalConfig)) {
      const skipRedirect =
        originalConfig._skipAuthRedirect ||
        originalConfig.headers['X-Skip-Auth-Redirect'] === 'true';

      // 🔐 진짜 인증 만료만 로그인 이동
      if (!skipRedirect && !globalThis.location.pathname.startsWith('/signin')) {
        removeAuth();
        const redirectUrl = encodeURIComponent(
          globalThis.location.pathname + globalThis.location.search
        );
        globalThis.location.replace(`/signin?redirect=${redirectUrl}`);
      }
    }

    throw error;
  }
);

export default axiosInstance;
