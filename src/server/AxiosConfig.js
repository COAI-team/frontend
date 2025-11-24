import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://localhost:9443/", 
    timeout: 10000,
    withCredentials: false,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
    (config) => {
        // ✔ localStorage 또는 sessionStorage 둘 중 하나에서 가져오기
        const token =
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log("[AxiosConfig] baseURL =", axiosInstance.defaults.baseURL);

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