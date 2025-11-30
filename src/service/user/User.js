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
        return { error: err };
    }
};

// 회원가입
export const signup = async (payload) => {
    try {
        const res = await axiosInstance.post("/users/register", payload, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data;
    } catch (err) {
        console.error("❌ [signup] 오류:", err);
        return { error: true };
    }
};

// 유저 정보 가져오기 (🔥 accessToken 제거)
export const getUserInfo = async () => {
    try {
        const res = await axiosInstance.get("/users/me");
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
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        return res.data;
    } catch (err) {
        return { error: err };
    }
};

// 이메일 인증번호 확인
export const verifyEmailCode = async (email, code) => {
    try {
        const res = await axiosInstance.post(
            `/email/verify?email=${email}&code=${code}`
        );
        return res.data;
    } catch (err) {
        return { error: err };
    }
};

// 임시 비밀번호 발급
export const requestPasswordReset = async (email) => {
    try {
        const res = await axiosInstance.post("/users/password/reset/request", {
            email,
        });
        return res.data;
    } catch (err) {
        return { error: err };
    }
};

// 토큰 검증
export const validateResetToken = async (token) => {
    try {
        const res = await axiosInstance.get(
            `/users/password/reset/validate?token=${token}`
        );
        return res.data;
    } catch (err) {
        return { error: err };
    }
};

// 비밀번호 재설정
export const confirmPasswordReset = async (token, newPassword) => {
    try {
        const res = await axiosInstance.post("/users/password/reset/confirm", {
            token,
            newPassword,
        });
        return res.data;
    } catch (err) {
        return { error: err };
    }
};

// 회원 정보 수정 (🔥 accessToken 제거)
export const updateMyInfo = async (payload) => {
    try {
        const formData = new FormData();
        if (payload.name) formData.append("name", payload.name);
        if (payload.nickname) formData.append("nickname", payload.nickname);
        if (payload.image) formData.append("image", payload.image);

        const res = await axiosInstance.put("/users/me", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return res.data;
    } catch (err) {
        return { error: true, detail: err.response?.data };
    }
};

// 이메일 변경
export const updateEmail = async (newEmail) => {
    try {
        const res = await axiosInstance.put("/users/me/email", {
            newEmail,
        });
        return res.data;
    } catch (err) {
        return { error: true, detail: err.response?.data };
    }
};

// 회원 탈퇴 (accessToken 제거)
export const deactivateUser = async () => {
    try {
        const res = await axiosInstance.delete("/users/me");
        return res.data;
    } catch (err) {
        console.error(err);
        return { error: true };
    }
};

// 계정 복구 (accessToken 제거)
export const restoreUser = async () => {
    try {
        const res = await axiosInstance.put("/users/me/restore");
        return res.data;
    } catch (err) {
        console.error(err);
        return { error: true };
    }
};

// GitHub OAuth 로그인 (🔥 GET + /auth/github/callback 로 수정)
export const loginWithGithub = async (code) => {
    try {
        const res = await axiosInstance.get(`/auth/github/callback?code=${code}`);
        return res.data;
    } catch (err) {
        console.error("❌ [GitHub Login] 오류:", err);
        return { error: err };
    }
};