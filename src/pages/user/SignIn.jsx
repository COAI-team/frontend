import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaGithub } from "react-icons/fa";
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../../service/user/User";
import AlertModal from "../../components/modal/AlertModal";
import ResetPasswordModal from "../../components/modal/ResetPasswordModal";
import { LoginContext } from "../../context/LoginContext";
import { useTheme } from "next-themes";

export default function SignIn() {
    const navigate = useNavigate();
    const { login: loginContextLogin, setLoginResult } = useContext(LoginContext);
    const { theme } = useTheme();
    const [resetModalOpen, setResetModalOpen] = useState(false);

    const [alertModal, setAlertModal] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
    });

    // ⭐ 추가: 비밀번호 보이기/숨기기 state
    const [showPassword, setShowPassword] = useState(false);

    const loginBtnColor = theme === "light" ? "bg-[#2DD4BF] hover:bg-[#24b3a6]" : "bg-[#FFFA99] hover:bg-[#e2e07c]";
    const resetBtnColor = theme === "light" ? "text-[#04BDF2] hover:text-[#0398c2]" : "text-[#CC67FA] hover:text-[#a647d4]";

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        if (!email || !password) {
            setAlertModal({
                open: true,
                type: "warning",
                title: "입력이 필요합니다",
                message: "이메일과 비밀번호를 모두 입력해주세요.",
            });
            return;
        }

        const result = await apiLogin({ email, password });

        if (result.error) {
            setAlertModal({
                open: true,
                type: "error",
                title: "로그인 실패",
                message: result.error.response?.data?.message || "로그인 중 오류가 발생했습니다.",
            });
            return;
        }

        setLoginResult(result);
        loginContextLogin(result);

        sessionStorage.setItem("accessToken", result.accessToken);
        sessionStorage.setItem("refreshToken", result.refreshToken);

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

            {/* 왼쪽 레이아웃 */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
                <div className="mx-auto w-full max-w-sm border dark:border-gray-700 rounded-xl shadow-lg p-8 dark:bg-gray-900">
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
                                <label htmlFor="email" className="block text-sm font-medium dark:text-gray-100">
                                    이메일 주소
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 placeholder:text-gray-400
                                    focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                                    placeholder="이메일을 입력하세요"
                                />
                            </div>

                            {/* PASSWORD (수정됨!) */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium dark:text-gray-100">
                                    비밀번호
                                </label>

                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="mt-2 block w-full rounded-md bg-white px-3 py-2 pr-10 text-gray-900 outline outline-gray-300 placeholder:text-gray-400
                                        focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                                        placeholder="비밀번호를 입력하세요"
                                    />

                                    {/* 👁 눈 아이콘 토글 */}
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
                                    className={`text-sm font-semibold ${resetBtnColor}`}
                                >
                                    비밀번호 재설정
                                </button>
                            </div>

                            {/* LOGIN BUTTON */}
                            <button
                                type="submit"
                                className={`flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-black ${loginBtnColor}`}
                            >
                                로그인
                            </button>
                        </form>

                        {/* 소셜 로그인 */}
                        <div className="mt-8">
                            <div className="relative w-full flex items-center justify-center">
                                <div className="flex-grow border-t dark:border-gray-700"></div>
                                <span className="px-4 text-sm font-medium dark:text-gray-300">
                                    또는 다음으로 계속하기
                                </span>
                                <div className="flex-grow border-t dark:border-gray-700"></div>
                            </div>
                        </div>

                        {/* GitHub 로그인 버튼 */}
                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 w-full rounded-md border dark:border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                            >
                                <FaGithub className="text-xl" />
                                GitHub로 계속하기
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
                open={alertModal.open}
                onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
                onConfirm={alertModal.onConfirm}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
            />

            <ResetPasswordModal
                open={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
            />
        </div>
    );
}