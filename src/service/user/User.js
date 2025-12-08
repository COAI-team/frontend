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

// 유저 정보 가져오기 (accessToken 검증 포함)
export const getUserInfo = async () => {
    try {
        const res = await axiosInstance.get("/users/me", {
            headers: { "X-Skip-Auth-Redirect": "true" },
            _skipAuthRedirect: true,
        });
        if (res?.data?.error) {
            throw res.data.error;
        }
        return res.data;
    } catch (err) {
        console.error("❌ getUserInfo 오류:", err);
        throw err;
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

    // 🔥 백엔드 DTO 필드명에 맞추기
    formData.append("userName", payload.name ?? "");
    formData.append("userNickname", payload.nickname ?? "");

    // 파일이 있을 때만 추가
    if (payload.image instanceof File) {
      formData.append("image", payload.image);
    }

    const res = await axiosInstance.put("/users/me", formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    return res.data;
  } catch (err) {
    console.error("❌ updateMyInfo error:", err.response?.data);
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

// GitHub 연동 정보 조회
export const getGithubUserInfo = async () => {
  try {
    console.log("📨 [getGithubUserInfo] 요청 시작");

    const res = await axiosInstance.get("/auth/github/user", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "X-Skip-Auth-Redirect": "true",
      },
      _skipAuthRedirect: true,
    });

    console.log("✅ [getGithubUserInfo] 성공:", res.data);

    return res.data;
  } catch (err) {
    console.error("❌ [getGithubUserInfo] 요청 실패:", err);
    return { error: err };
  }
};

// 🔥 GitHub 계정 연동 해제
export const disconnectGithub = async () => {
  try {
    const res = await axiosInstance.post(
      "/auth/github/disconnect",
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("❌ [GitHub Disconnect] 오류:", err);
    return { error: err };
  }
};
