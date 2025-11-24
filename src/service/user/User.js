import axiosInstance from "../../server/AxiosConfig";

// 로그인
export const login = async (payload) => {
    try {
        console.log("📨 [login] 요청 시작:", payload);

        const res = await axiosInstance.post("/users/login", payload);

        console.log("✅ [login] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [login] 요청 실패:", err);
        return {error: err};
    }
};
// 회원가입
export const signup = async (payload) => {
    try {
        const res = await axiosInstance.post("/users/register", payload);
        return res.data;
    } catch (err) {
        console.error("❌ [signup] axios error:", err);

        // 🔥 백엔드에서 내려준 코드/메시지 있는 경우 그대로 반환
        if (err.response && err.response.data) {
            return {
                error: true,
                code: err.response.data.code,
                message: err.response.data.message
            };
        }

        return {error: true, message: "Unknown error"};
    }
};

// 유저 정보 가져오기
export const getUserInfo = async () => {
    try {
        console.log("📨 [getUserInfo] 요청 시작");

        const res = await axiosInstance.get("/user/me");

        console.log("✅ [getUserInfo] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [getUserInfo] 요청 실패:", err);
        return {error: err};
    }
};

// 이메일 인증번호 발송
export const sendEmailCode = async (email) => {
    try {
        const params = new URLSearchParams();
        params.append("email", email);

        const res = await axiosInstance.post("/email/send", params, {
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
        });

        return res.data;
    } catch (err) {
        return {error: err};
    }
};

// 이메일 인증번호 확인
export const verifyEmailCode = async (email, code) => {
    try {
        console.log("📨 [verifyEmailCode] 요청 시작");
        console.log("➡️ 요청 URL:", `/email/verify?email=${email}&code=${code}`);

        const res = await axiosInstance.post(`/email/verify?email=${email}&code=${code}`);

        console.log("✅ [verifyEmailCode] 응답 성공:", res);
        console.log("📄 응답 데이터:", res.data);

        return res.data; // "인증 성공" 또는 "인증 실패"
    } catch (err) {
        console.error("❌ [verifyEmailCode] 요청 실패:", err);
        return {error: err};
    }
};

// 임시 비밀번호 발급 요청
export const requestPasswordReset = async (email) => {
    try {
        const res = await axiosInstance.post("/users/password/reset/request", {
            email: email,
        });
        return res.data;
    } catch (err) {
        return {error: err};
    }
};

export const updatePassword = async (payload, accessToken) => {
    try {
        console.log("📨 [updatePassword] 요청 시작:", payload);

        const res = await axiosInstance.put(
            "/users/password/update",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // ⭐ 토큰 직접 추가
                },
            }
        );

        console.log("✅ [updatePassword] 응답 성공:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ [updatePassword] 요청 실패:", err);

// 1) 서버가 응답을 준 경우(err.response가 존재)
        if (err.response && err.response.data) {
            return {
                error: true,
                message: err.response.data.message,  // 백엔드에서 내려준 메시지
                code: err.response.data.code,        // 백엔드의 에러 코드
            };
        }

// 2) 서버 응답조차 없거나 알 수 없는 오류
        return {
            error: true,
            message: "Unknown error"
        };
    }
};