import {useState, useContext} from "react";
import {Link, useNavigate} from "react-router-dom";
import {login as apiLogin} from "../../service/ApiServices";
import AlertModal from "../../components/modal/AlertModal";
import {LoginContext} from "../../context/LoginContext.js";

export default function SignIn() {
    const navigate = useNavigate();

    const {setLoginResult, login: loginContextLogin} = useContext(LoginContext);

    const [alertModal, setAlertModal] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
    });

    // 로그인 처리
    const handleLogin = async (e) => {
        e.preventDefault();

        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;

        console.log("📥 [handleLogin] 입력값:", {email, password});

        if (!email || !password) {
            setAlertModal({
                open: true,
                type: "warning",
                title: "입력이 필요합니다",
                message: "이메일과 비밀번호를 모두 입력해주세요.",
            });
            return;
        }

        // API 요청
        console.log("📨 login() 요청:", {email, password});
        const result = await apiLogin({email, password});

        console.log("📩 login() 응답:", result);

        if (result.error) {
            setAlertModal({
                open: true,
                type: "error",
                title: "로그인 실패",
                message:
                    result.error.response?.data?.message ||
                    "로그인 중 오류가 발생했습니다.",
            });
            return;
        }

        // Context 저장
        setLoginResult(result);
        loginContextLogin(result.user);
        console.log("🟢 user 저장됨:", result.user);

        // ⭐ 토큰 저장 (remember-me 제거 → sessionStorage만 사용)
        const {accessToken, refreshToken} = result;
        console.log("🔑 받은 토큰:", {accessToken, refreshToken});

        sessionStorage.setItem("accessToken", accessToken);
        sessionStorage.setItem("refreshToken", refreshToken);
        console.log("🧊 Token 저장됨 (sessionStorage 고정)");

        setAlertModal({
            open: true,
            type: "success",
            title: "로그인 성공",
            message: "환영합니다!",
            onConfirm: () => navigate("/"),
        });
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16">

                <div
                    className="mx-auto w-full max-w-sm border dark:border-gray-700 rounded-xl shadow-lg p-8 dark:bg-gray-900">

                    <div className="mx-auto w-full max-w-sm text-center">
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

                    <div className="mt-6">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium dark:text-gray-100">
                                    이메일 주소
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        className="block w-full rounded-md bg-white px-3 py-2 text-gray-900
                                        outline outline-gray-300 placeholder:text-gray-400
                                        focus:outline-2 focus:outline-indigo-600
                                        dark:bg-white/5 dark:text-white dark:outline-white/10
                                        dark:focus:outline-indigo-500"
                                        placeholder="이메일을 입력하세요"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium dark:text-gray-100">
                                    비밀번호
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        className="block w-full rounded-md bg-white px-3 py-2 text-gray-900
                                        outline outline-gray-300 placeholder:text-gray-400
                                        focus:outline-2 focus:outline-indigo-600
                                        dark:bg-white/5 dark:text-white dark:outline-white/10
                                        dark:focus:outline-indigo-500"
                                        placeholder="비밀번호를 입력하세요"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500
        dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    비밀번호 재설정
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-600
                                px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500
                                dark:bg-indigo-500 dark:hover:bg-indigo-400"
                            >
                                로그인하기
                            </button>
                        </form>

                        {/* 소셜 로그인 */}
                        <div className="mt-8">
                            <div className="relative w-full">
                                <div className="flex items-center justify-center">
                                    <div className="flex-grow border-t dark:border-gray-700"></div>
                                    <span className="px-4 text-sm font-medium dark:text-gray-300">
                                        또는 다음으로 계속하기
                                    </span>
                                    <div className="flex-grow border-t dark:border-gray-700"></div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1">
                                <Link
                                    to="/github-login"
                                    className="flex w-full items-center justify-center gap-3 rounded-md
                                    bg-white px-3 py-2 text-sm font-semibold text-gray-900
                                    shadow hover:bg-gray-50 border border-gray-300
                                    dark:bg-white/10 dark:text-white dark:border-white/20"
                                >
                                    <svg
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        aria-hidden="true"
                                        className="h-5 w-5 fill-[#24292F] dark:fill-white"
                                    >
                                        <path
                                            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.424 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"/>
                                    </svg>
                                    <span>GitHub로 계속하기</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right */}
            <div className="hidden lg:block w-1/2 relative">
                <img
                    alt=""
                    src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?auto=format&fit=crop&w=1908&q=80"
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>

            {/* AlertModal */}
            <AlertModal
                open={alertModal.open}
                onClose={() => setAlertModal(prev => ({...prev, open: false}))}
                onConfirm={alertModal.onConfirm}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
            />
        </div>
    );
}