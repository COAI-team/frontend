import axiosInstance from "../../server/AxiosConfig";

// ✅ FormData 공통 헬퍼 (중복 제거)
const createFormData = (payload) => {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("userName", payload.name);
  if (payload.nickname !== undefined) formData.append("userNickname", payload.nickname);
  if (payload.image instanceof File) formData.append("image", payload.image);
  if (payload.githubId !== undefined) formData.append("githubId", payload.githubId);
  if (payload.githubToken !== undefined) formData.append("githubToken", payload.githubToken);
  return formData;
};

// ✅ 기본 API (인터셉터가 토큰 + 에러 처리)
export const login = (payload) =>
  axiosInstance.post("/users/login", payload).then(res => res.data);

export const signup = (payload) =>
  axiosInstance.post("/users/register", payload).then(res => res.data);

export const getUserInfo = () =>
  axiosInstance.get("/users/me", {
    headers: {"X-Skip-Auth-Redirect": "true"},
    _skipAuthRedirect: true
  }).then(res => res.data);

export const deactivateUser = () =>
  axiosInstance.delete("/users/me").then(res => res.data);

export const restoreUser = () =>
  axiosInstance.put("/users/me/restore").then(res => res.data);

// ✅ 이메일 API
export const sendEmailCode = (email) =>
  axiosInstance.post("/email/send", `email=${email}`, {
    headers: {"Content-Type": "application/x-www-form-urlencoded"}
  }).then(res => res.data);

export const verifyEmailCode = (email, code) =>
  axiosInstance.post(`/email/verify?email=${email}&code=${code}`).then(res => res.data);

// ✅ 비밀번호 재설정
export const requestPasswordReset = (email) =>
  axiosInstance.post("/users/password/reset/request", { email }).then(res => res.data);

export const validateResetToken = (token) =>
  axiosInstance.get(`/users/password/reset/validate?token=${token}`).then(res => res.data);

export const confirmPasswordReset = (token, newPassword) =>
  axiosInstance.post("/users/password/reset/confirm", {
    token,
    newUserPw: newPassword
  }).then(res => res.data);

// ✅ 회원 정보 수정 (FormData 최적화)
export const updateMyInfo = (payload) =>
  axiosInstance.put("/users/me", createFormData(payload)).then(res => res.data);

// ✅ GitHub API
export const loginWithGithub = async (code, mode) => {
  try {
    const query = mode ? `?code=${code}&mode=${mode}` : `?code=${code}`;
    const response = await axiosInstance.get(`/auth/github/callback${query}`, {
      _skipAuthRedirect: true
    });
    return response.data;
  } catch (error) {
    console.error("❌ [GitHub Login] 오류:", error);

    return {
      error: {
        message: error.response?.data?.message || error.message || "GitHub 로그인에 실패했습니다.",
        response: error.response,
        status: error.response?.status
      }
    };
  }
};

export const getGithubUserInfo = () =>
  axiosInstance.get("/auth/github/user", {
    headers: {"X-Skip-Auth-Redirect": "true"}
  }).then(res => res.data);

export const disconnectGithub = () =>
  axiosInstance.post("/auth/github/disconnect", {}).then(res => res.data);

export const linkGithubAccount = (gitHubUser) =>
  axiosInstance.post("/users/github/link", gitHubUser).then(res => res.data);
