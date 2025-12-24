import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useContext, useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../../service/user/User";
import AlertModal from "../../components/modal/AlertModal";
import { useAlert } from "../../hooks/common/useAlert";
import ResetPasswordModal from "../../components/modal/ResetPasswordModal";
import { LoginContext } from "../../context/login/LoginContext";
import LoadingButton from "../../components/button/LoadingButton";
import { useTheme } from "../../context/theme/useTheme";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login: loginContextLogin,
    setLoginResult,
    setIsAlertOpen,
  } = useContext(LoginContext);
  const { theme } = useTheme();
  const { alert, showAlert, closeAlert } = useAlert();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ 테마 클래스 최적화 (객체 조회)
  const THEME_CLASSES = useMemo(
    () => ({
      loginBtn:
        theme === "light"
          ? "bg-[#2DD4BF] hover:bg-[#24b3a6]"
          : "bg-[#FFFA99] hover:bg-[#e2e07c]",
      resetBtn:
        theme === "light"
          ? "text-[#04BDF2] hover:text-[#0398c2]"
          : "text-[#CC67FA] hover:text-[#a647d4]",
    }),
    [theme]
  );

  const redirect = useMemo(() => {
    const redirectParam =
      new URLSearchParams(location.search).get("redirect") || "/";
    return redirectParam.startsWith("/signin") ? "/" : redirectParam;
  }, [location.search]);

  // ✅ GitHub OAuth 로그인
  const handleGitHubLogin = useCallback(() => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;

    // 🔐 OAuth state 생성 (CSRF + mode)
    const stateObj = {
      nonce: crypto.randomUUID(),
      mode: "login", // ← 추후 "link"도 가능
    };

    const encodedState = btoa(JSON.stringify(stateObj));

    // CSRF 검증용 nonce 저장
    sessionStorage.setItem("github_oauth_state", stateObj.nonce);

    globalThis.location.href =
      "https://github.com/login/oauth/authorize" +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=read:user user:email` +
      `&state=${encodedState}`;
  }, []);

  // ✅ 핵심 수정: try-catch + finally로 최적화 API 호환
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);

      const email = e.target.email.value;
      const password = e.target.password.value;

      // ✅ 입력 검증
      if (!email || !password) {
        setIsLoading(false);
        showAlert({
          type: "warning",
          title: "입력이 필요합니다",
          message: "이메일과 비밀번호를 모두 입력해주세요.",
        });
        return;
      }

      try {
        // ✅ 최적화된 API (에러 throw)
        const result = await apiLogin({ userEmail: email, userPw: password });
        console.log("result ==>>", JSON.stringify(result, null, 2));

        // 현목 추가
        const role =
          result?.user?.userRole ||
          result?.user?.role ||
          result?.userRole ||
          result?.role ||
          "";
        const isAdmin = role === "ROLE_ADMIN";
        const nextPath = isAdmin ? "/admin/otp" : redirect;
        // ========

        // ✅ 로그인 성공
        setLoginResult(result);
        loginContextLogin(result, true);

        showAlert({
          type: "success",
          title: "로그인 성공",
          // ===== 현목 ======
          message: isAdmin // 여기 현목
            ? "관리자 OTP 확인 페이지로 이동합니다."
            : "환영합니다!",
          //=================
          onConfirm: () => {
            setIsAlertOpen(false);
            // === 현목 ===========
            navigate(nextPath);
            // ===navigate(redirect); ==>   navigate(nextPath);
          },
        });
      } catch (error) {
        // ✅ Axios 인터셉터가 처리한 에러 catch
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "로그인에 실패했습니다.";

        showAlert({
          type: "error",
          title: "로그인 실패",
          message: errorMessage,
        });
      } finally {
        // ✅ 로딩 상태 확실 종료
        setIsLoading(false);
      }
    },
    [
      showAlert,
      setLoginResult,
      loginContextLogin,
      setIsAlertOpen,
      navigate,
      redirect,
    ]
  );

  return (
    <div className="flex h-full overflow-hidden dark:bg-[#131313]">
      {/* 왼쪽 레이아웃 */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2e2e] rounded-xl shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-8">
          <div className="text-center">
            <h2 className="mt-2 text-2xl font-bold dark:text-white">로그인</h2>
            <p className="mt-2 text-sm dark:text-gray-400">
              아직 회원이 아니신가요?{" "}
              <Link
                to="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                회원가입 하기
              </Link>
            </p>
          </div>

          {/* FORM */}
          <div className="mt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium dark:text-gray-100"
                >
                  이메일 주소
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-2 block w-full rounded-md outline outline-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:bg-white/5 dark:text-white dark:border-white/20"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium dark:text-gray-100"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="mt-2 block w-full rounded-md outline outline-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:bg-white/5 dark:text-white dark:border-white/20"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-300"
                  >
                    {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                  </button>
                </div>
              </div>

              {/* PASSWORD RESET */}
              <div className="flex justify-end w-full">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className={`text-sm font-semibold ${THEME_CLASSES.resetBtn}`}
                >
                  비밀번호 재설정
                </button>
              </div>

              {/* LOGIN BUTTON */}
              <LoadingButton
                text="로그인"
                isLoading={isLoading}
                className={THEME_CLASSES.loginBtn}
              />
            </form>

            {/* 소셜 로그인 Divider */}
            <div className="mt-8">
              <div className="relative w-full flex items-center justify-center">
                <div className="grow border-t dark:border-gray-700"></div>
                <span className="px-4 text-sm font-medium dark:text-gray-300">
                  또는 다음으로 계속하기
                </span>
                <div className="grow border-t dark:border-gray-700"></div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center">
              {/* GitHub */}
              <button
                type="button"
                onClick={handleGitHubLogin}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-gray-100 hover:bg-gray-100 hover:border-gray-100">
                  <img
                    src="/socialLogos/GitHub.svg"
                    alt="github"
                    className="w-6 h-6"
                  />
                </div>
                <span className="mt-2 text-xs font-bold dark:text-gray-300">
                  GITHUB
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 이미지 */}
      <div className="hidden lg:block w-1/2 relative">
        <img
          alt=""
          src="/Main.gif"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <AlertModal
        open={alert.open}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />

      <ResetPasswordModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />
    </div>
  );
}
