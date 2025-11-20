import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "/api",
    timeout: 10000,
    withCredentials: false,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("[Axios Error]", error);
        return Promise.reject(error);
    }
);

export default axiosInstance;
