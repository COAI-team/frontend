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
        const res = await axiosInstance.post("/users/register", payload, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return res.data;
    } catch (err) {
        console.error("❌ [signup] axios error:", err);

        if (err.response && err.response.data) {
            return {
                error: true,
                code: err.response.data.code,
                message: err.response.data.message
            };
        }
        return { error: true, message: "Unknown error" };
    }
};

// 유저 정보 가져오기
export const getUserInfo = async (accessToken) => {
    try {
        const res = await axiosInstance.get("/users/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return res.data;
    } catch (err) {
        console.error("❌ getUserInfo 오류:", err);
        return { error: err };
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

export const validateResetToken = async (token) => {
    try {
        const res = await axiosInstance.get(`/users/password/reset/validate?token=${token}`);
        return res.data;
    } catch (err) {
        return {error: err};
    }
};

export const confirmPasswordReset = async (token, newPassword) => {
    try {
        const res = await axiosInstance.post("/users/password/reset/confirm", {
            token,
            newPassword,
        });
        return res.data;
    } catch (err) {
        return {error: err};
    }
};

// 회원 정보 수정 (이름 / 닉네임 / 프로필 이미지)
export const updateMyInfo = async (accessToken, payload) => {
    try {
        const formData = new FormData();

        // DTO 필드들 추가
        if (payload.name) formData.append("name", payload.name);
        if (payload.nickname) formData.append("nickname", payload.nickname);

        // 이미지 파일(optional)
        if (payload.image) formData.append("image", payload.image);

        const res = await axiosInstance.put("/users/me", formData, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    } catch (err) {
        console.error("❌ [updateMyInfo] 오류:", err);
        return { error: true, detail: err.response?.data };
    }
};

// 이메일 변경
export const updateEmail = async (newEmail) => {
    try {
        const res = await axiosInstance.put("/users/me/email", {
            newEmail: newEmail
        });

        return res.data;
    } catch (err) {
        console.error("❌ [updateEmail] 오류:", err.response?.data);
        return { error: true, detail: err.response?.data };
    }
};