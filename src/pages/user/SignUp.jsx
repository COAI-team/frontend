import {useState, useRef} from "react";
import {signup, sendEmailCode, verifyEmailCode} from "../../service/ApiServices";

export default function SignUp() {
    const [profilePreview, setProfilePreview] = useState(null);
    const [profileFile, setProfileFile] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [remainingTime, setRemainingTime] = useState(null);
    const timerRef = useRef(null);

    const [isVerified, setIsVerified] = useState(false);
    const [code, setCode] = useState("");

    // 비밀번호 조건 체크
    const isMinLength = password.length >= 8 && password.length <= 20;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+~\-={}[\]|;:"<>,.?/]/.test(password);

    const isPasswordMatch = password === passwordConfirm;

    let passwordMessage = "";
    if (password.length > 0) {
        if (!isMinLength) passwordMessage = "비밀번호의 길이가 8~20자가 되어야 합니다.";
        else if (!hasUpper) passwordMessage = "비밀번호에 대문자가 최소 1개 포함되어야 합니다.";
        else if (!hasLetter) passwordMessage = "비밀번호에 영문이 포함되어야 합니다.";
        else if (!hasNumber) passwordMessage = "비밀번호에 숫자가 포함되어야 합니다.";
        else if (!hasSpecial) passwordMessage = "비밀번호에 특수문자가 포함되어야 합니다.";
    }

    // 이메일 인증번호 발송
    const handleSendEmail = async () => {
        const email = document.getElementById("email").value;

        if (!email) {
            alert("이메일을 입력해주세요!");
            return;
        }

        const result = await sendEmailCode(email);

        if (result.error) {
            alert("인증번호 발송 실패!");
            return;
        }

        startTimer(result.expireAt);
        setIsVerified(false);
        alert("인증번호가 발송되었습니다!");
    };

    // 타이머
    const startTimer = (expireTime) => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const now = Date.now();
            const diff = expireTime - now;

            if (diff <= 0) {
                setRemainingTime("만료됨");
                clearInterval(timerRef.current);
                return;
            }

            const m = Math.floor(diff / 1000 / 60);
            const s = Math.floor((diff / 1000) % 60);
            setRemainingTime(`${m}:${s < 10 ? "0" + s : s}`);
        }, 1000);
    };

    // 이메일 인증 확인
    const handleVerifyCode = async () => {
        const email = document.getElementById("email").value;

        if (!email || !code) {
            alert("이메일과 인증번호를 입력해주세요.");
            return;
        }

        const result = await verifyEmailCode(email, code);

        if (result === "인증 성공") {
            setIsVerified(true);
            alert("이메일 인증 성공!");
        } else {
            setIsVerified(false);
            alert("인증번호가 올바르지 않습니다.");
        }
    };

    // 회원가입 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified) {
            alert("이메일 인증을 완료해주세요!");
            return;
        }

        if (passwordMessage) {
            alert(passwordMessage);
            return;
        }

        if (!isPasswordMatch) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        const form = e.target;
        const name = form.name.value;
        const nickname = form.nickname.value;
        const email = form.email.value;
        const profileImage = form.profileImage?.files[0] ?? null;

        const formData = new FormData();
        formData.append("name", name);
        formData.append("nickname", nickname);
        formData.append("email", email);
        formData.append("password", password);
        if (profileFile) {
            formData.append("profileImage", profileFile);
        }

        // ✅ FormData 디버깅 로그
        console.log("📤 [handleSubmit] FormData 내용 확인 ↓↓↓");
        for (let [key, value] of formData.entries()) {
            console.log(" -", key, value);
        }

        const res = await signup(formData);

        if (res.error) {
            alert("회원가입 실패! 서버 오류가 발생했습니다.");
        } else {
            alert("회원가입 성공!");
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left image */}
            <div className="hidden lg:block w-1/2 relative">
                <img
                    alt=""
                    src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?auto=format&fit=crop&w=1908&q=80"
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
                <div
                    className="mx-auto w-full max-w-xl border dark:border-gray-700 rounded-xl shadow-lg p-8 dark:bg-gray-900">

                    <h2 className="mt-2 text-2xl font-bold dark:text-white text-center">
                        회원가입
                    </h2>

                    {/* 프로필 */}
                    <div className="flex justify-center mt-6">
                        <div className="relative w-28 h-28">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                {profilePreview ? (
                                    <img src={profilePreview} className="object-cover w-full h-full" alt=""/>
                                ) : (
                                    <div
                                        className="flex items-center justify-center w-full h-full text-gray-500 text-sm dark:text-gray-300">
                                        미리보기
                                    </div>
                                )}
                            </div>

                            <label
                                htmlFor="profileImage"
                                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shadow-lg cursor-pointer"
                            >
                                📷
                            </label>

                            <input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setProfilePreview(URL.createObjectURL(file));
                                        setProfileFile(file); // ← 저장
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit} encType="multipart/form-data">

                        {/* 이름 + 닉네임 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium dark:text-gray-100">이름</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                                    placeholder="이름 입력"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="nickname"
                                    className="block text-sm font-medium dark:text-gray-100">닉네임</label>
                                <input
                                    id="nickname"
                                    name="nickname"
                                    type="text"
                                    required
                                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                                    placeholder="닉네임 입력"
                                />
                            </div>
                        </div>

                        {/* 이메일 + 인증 */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium dark:text-gray-100">이메일</label>

                            <div className="mt-2 flex gap-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="flex-1 rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                                    placeholder="이메일 입력"
                                />

                                <button
                                    type="button"
                                    onClick={handleSendEmail}
                                    className="whitespace-nowrap rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    인증번호 발송
                                </button>
                            </div>

                            {remainingTime && (
                                <p className="mt-1 text-sm text-red-500">남은 시간: {remainingTime}</p>
                            )}

                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="인증번호 입력"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="flex-1 rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                                />

                                <button
                                    type="button"
                                    onClick={handleVerifyCode}
                                    className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500"
                                >
                                    인증 확인
                                </button>
                            </div>

                            {isVerified && (
                                <p className="mt-1 text-sm text-green-400">✔ 이메일 인증 성공!</p>
                            )}
                        </div>

                        {/* 비밀번호 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium dark:text-gray-100">비밀번호</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                                    placeholder="비밀번호 입력"
                                />

                                {passwordMessage && (
                                    <p className="mt-1 text-xs text-red-500">{passwordMessage}</p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="passwordConfirm"
                                    className="block text-sm font-medium dark:text-gray-100">비밀번호 확인</label>
                                <input
                                    id="passwordConfirm"
                                    name="passwordConfirm"
                                    type="password"
                                    required
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                                    placeholder="비밀번호 재입력"
                                />

                                {!isPasswordMatch && passwordConfirm.length > 0 && (
                                    <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                                )}
                            </div>
                        </div>

                        {/* 제출 */}
                        <button
                            type="submit"
                            disabled={!isVerified}
                            className={`mt-4 flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold 
                                ${
                                isVerified
                                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            회원가입 하기
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
