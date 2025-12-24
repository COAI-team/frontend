import {useEffect, useRef, useCallback} from "react";
import {loginWithGithub, linkGithubAccount} from "../../service/user/User";
import {useNavigate} from "react-router-dom";
import {useLogin} from "../../context/login/useLogin";
import axiosInstance from "../../server/AxiosConfig";
import {saveAuth} from "../../utils/auth/token";
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";

export default function GitHubCallback() {
  const navigate = useNavigate();
  const {login} = useLogin();
  const {alert, showAlert, closeAlert} = useAlert();
  const executedRef = useRef(false);

  /* 🔗 GitHub 계정 연동 */
  const handleLinkGithubAccount = useCallback(
    async (gitHubUser, accessToken) => {
      const linkResult = await linkGithubAccount(gitHubUser, {
        _skipAuth: true,
        headers: {Authorization: `Bearer ${accessToken}`},
      });

      console.log("linkResult",linkResult)

      if (linkResult?.error) {
        showAlert({
          type: "error",
          title: "GitHub 연동 실패",
          message:
            linkResult.error.response?.data?.message ??
            "알 수 없는 오류가 발생했습니다.",
          onConfirm: () => navigate("/profile"),
        });
        return false;
      }

      showAlert({
        type: "success",
        title: "연동 완료",
        message: "GitHub 계정 연동이 완료되었습니다!",
        onConfirm: () => navigate("/profile"),
      });

      return true;
    },
    [showAlert, navigate]
  );

  /* 👤 기존 계정 정보 조회 */
  const fetchUserInfo = useCallback(
    async (accessToken) => {
      try {
        const res = await axiosInstance.get("/users/me", {
          headers: {Authorization: `Bearer ${accessToken}`},
          _skipAuthRedirect: true,
        });
        return {success: true, user: res.data};
      } catch (err) {
        console.error("❌ 사용자 정보 조회 실패:", err);

        showAlert({
          type: "error",
          title: "사용자 정보 조회 실패",
          message: "기존 계정 정보를 불러오지 못했습니다.",
        });

        return {success: false};
      }
    },
    [showAlert]
  );

  /* 🔗 link 모드 */
  const handleLinkMode = useCallback(
    async (githubResult) => {
      const accessToken = localStorage.getItem("accessToken");
      await handleLinkGithubAccount(githubResult.gitHubUser, accessToken);
    },
    [handleLinkGithubAccount]
  );

  /* ⚠️ 기존 계정 존재 → 연동 필요 */
  const handleNeedLink = useCallback(
    async (githubResult) => {
      saveAuth({
        accessToken: githubResult.accessToken,
        refreshToken: githubResult.refreshToken,
      });

      const userInfoResult = await fetchUserInfo(githubResult.accessToken);
      if (!userInfoResult.success) return;

      login(
        {
          accessToken: githubResult.accessToken,
          refreshToken: githubResult.refreshToken,
          user: userInfoResult.user,
        },
        true
      );

      showAlert({
        type: "warning",
        title: "기존 계정 발견",
        message: "기존 계정이 존재합니다. GitHub 계정을 연동하시겠습니까?",
        onConfirm: async () => {
          const accessToken = localStorage.getItem("accessToken");
          const linkResult = await linkGithubAccount(githubResult.gitHubUser, {
            _skipAuth: true,
            headers: {Authorization: `Bearer ${accessToken}`},
          });

          if (linkResult?.error) {
            showAlert({
              type: "error",
              title: "연동 실패",
              message:
                linkResult.error.response?.data?.message ??
                "알 수 없는 오류입니다.",
            });
            return;
          }

          showAlert({
            type: "success",
            title: "연동 완료",
            message: "GitHub 계정이 성공적으로 연동되었습니다!",
            onConfirm: () => navigate("/profile"),
          });
        },
        onCancel: () => navigate("/signin"),
      });
    },
    [fetchUserInfo, login, showAlert, navigate]
  );

  /* 🎉 정상 로그인 */
  const handleSuccessfulLogin = useCallback(
    (loginResponse) => {
      saveAuth({
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
      });

      login(
        {
          accessToken: loginResponse.accessToken,
          refreshToken: loginResponse.refreshToken,
          user: loginResponse.user,
        },
        true
      );

      showAlert({
        type: "success",
        title: "로그인 성공",
        message: "GitHub 로그인에 성공했습니다!",
        onConfirm: () => navigate("/"),
      });
    },
    [login, showAlert, navigate]
  );

  /* 🚀 메인 처리 */
  const processGithub = useCallback(async () => {
    const url = new URL(globalThis.location.href);
    const code = url.searchParams.get("code");
    const mode = url.searchParams.get("mode");

    if (!code) {
      showAlert({
        type: "error",
        title: "GitHub 오류",
        message: "GitHub code가 존재하지 않습니다.",
      });
      return;
    }

    try {
      const githubResult = await loginWithGithub(code, mode);

      if (githubResult?.error) {
        showAlert({
          type: "error",
          title: "GitHub 처리 실패",
          message:
            githubResult.error.response?.data?.message ??
            githubResult.error.message ??
            "GitHub 로그인 중 오류가 발생했습니다.",
        });
        return;
      }

      if (mode === "link") {
        await handleLinkMode(githubResult);
        return;
      }

      if (!githubResult.loginResponse) {
        if (githubResult.needLink) {
          await handleNeedLink(githubResult);
          return;
        }

        showAlert({
          type: "error",
          title: "로그인 오류",
          message: githubResult.message ?? "알 수 없는 오류",
        });
        return;
      }

      handleSuccessfulLogin(githubResult.loginResponse);
    } catch (err) {
      showAlert({
        type: "error",
        title: "오류 발생",
        message:
          err.response?.data?.message ??
          err.message ??
          "GitHub 로그인 처리 중 오류가 발생했습니다.",
      });
    }
  }, [
    showAlert,
    handleLinkMode,
    handleNeedLink,
    handleSuccessfulLogin,
  ]);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;
    processGithub();
  }, [processGithub]);

  return (
    <div className="flex items-center justify-center h-screen flex-col gap-4 text-lg">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"/>
      GitHub 인증 처리 중...

      <AlertModal
        open={alert.open}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
}
