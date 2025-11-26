"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AlertModal from "../../components/modal/AlertModal";
import {
    validateResetToken,
    confirmPasswordReset,
} from "../../service/user/User";

import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

/* ---- 비밀번호 규칙 검사 함수 (회원가입 페이지와 동일) ---- */
function getPasswordError(pw) {
    if (!pw) return "";

    const rules = [
        { test: pw.length >= 8 && pw.length <= 20, msg: "비밀번호는 8~20자여야 합니다." },
        { test: /[A-Z]/.test(pw), msg: "대문자가 최소 1개 포함되어야 합니다." },
        { test: /[A-Za-z]/.test(pw), msg: "영문자가 포함되어야 합니다." },
        { test: /\d/.test(pw), msg: "숫자가 포함되어야 합니다." },
        { test: /[!@#$%^&*()_+~\-={}[\]|;:"<>,.?/]/.test(pw), msg: "특수문자가 포함되어야 합니다." }
    ];

    const failed = rules.find((r) => !r.test);
    return failed ? failed.msg : "";
}

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [valid, setValid] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // 👁 비밀번호 보이기/숨기기
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const passwordError = getPasswordError(newPassword);
    const isPasswordMatch =
        confirmPassword.length > 0 && newPassword === confirmPassword;

    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
        onConfirm: null,
    });

    useEffect(() => {
        if (!token) {
            setValid(false);
            return;
        }

        async function validate() {
            try {
                const resp = await validateResetToken(token);
                setValid(resp.success);
            } catch (err) {
                console.error("비밀번호 변경 실패:", err);
                setAlert({
                    open: true,
                    type: "error",
                    title: "변경 실패",
                    message: err?.response?.data?.message || "오류가 발생했습니다.",
                });
            }
        }

        validate();
    }, [token]);

    const handleSubmit = async () => {
        if (passwordError) {
            return setAlert({
                open: true,
                type: "warning",
                title: "비밀번호 규칙 불충족",
                message: passwordError,
            });
        }

        if (!isPasswordMatch) {
            return setAlert({
                open: true,
                type: "warning",
                title: "비밀번호 불일치",
                message: "비밀번호가 서로 일치하지 않습니다.",
            });
        }

        try {
            await confirmPasswordReset(token, newPassword);

            setAlert({
                open: true,
                type: "success",
                title: "변경 완료",
                message: "비밀번호가 성공적으로 변경되었습니다.",
                onConfirm: () => navigate("/signin"),
            });
        } catch (err) {
            setAlert({
                open: true,
                type: "error",
                title: "변경 실패",
                message: err?.response?.data?.message || "오류가 발생했습니다.",
            });
        }
    };

    if (valid === null) {
        return (
            <div className="w-full flex justify-center mt-20 text-gray-500">
                토큰 확인 중...
            </div>
        );
    }

    if (valid === false) {
        return (
            <div className="w-full flex flex-col items-center mt-20">
                <h2 className="text-2xl font-bold text-red-600">유효하지 않은 링크입니다</h2>
                <p className="text-gray-400 mt-2">
                    비밀번호 재설정 링크가 만료되었거나 잘못되었습니다.
                </p>

                <button
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md"
                    onClick={() => navigate("/forgot-password")}
                >
                    다시 요청하기
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex justify-center items-center bg-neutral-900">
            <div className="w-full max-w-md p-8 bg-neutral-800 rounded-xl border border-neutral-600 shadow-xl">
                <h2 className="text-2xl font-bold text-center text-white">비밀번호 재설정</h2>

                <p className="text-sm text-center text-neutral-400 mt-2">
                    새 비밀번호를 입력해주세요.
                </p>

                {/* 새 비밀번호 */}
                <div className="mt-6">
                    <label className="block mb-1 text-sm font-medium text-white">
                        새 비밀번호
                    </label>

                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            className="
                                w-full px-3 py-2
                                border border-neutral-600 rounded-md
                                bg-neutral-700 text-white
                                focus:ring-2 focus:ring-blue-500 outline-none
                            "
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />

                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                        >
                            {showNewPassword ? (
                                <AiFillEyeInvisible size={22} />
                            ) : (
                                <AiFillEye size={22} />
                            )}
                        </button>
                    </div>

                    {/* 비밀번호 규칙 표시 */}
                    {newPassword.length > 0 && (
                        <p
                            className={`mt-1 text-xs ${
                                passwordError ? "text-red-400" : "text-green-400"
                            }`}
                        >
                            {passwordError || "사용 가능한 비밀번호입니다."}
                        </p>
                    )}
                </div>

                {/* 새 비밀번호 확인 */}
                <div className="mt-4">
                    <label className="block mb-1 text-sm font-medium text-white">
                        새 비밀번호 확인
                    </label>

                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="
                                w-full px-3 py-2
                                border border-neutral-600 rounded-md
                                bg-neutral-700 text-white
                                focus:ring-2 focus:ring-blue-500 outline-none
                            "
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                            {showConfirmPassword ? (
                                <AiFillEyeInvisible size={22} />
                            ) : (
                                <AiFillEye size={22} />
                            )}
                        </button>
                    </div>

                    {/* 비밀번호 일치 여부 */}
                    {confirmPassword.length > 0 && (
                        <p
                            className={`mt-1 text-xs ${
                                isPasswordMatch ? "text-green-400" : "text-red-400"
                            }`}
                        >
                            {isPasswordMatch
                                ? "비밀번호가 일치합니다."
                                : "비밀번호가 일치하지 않습니다."}
                        </p>
                    )}
                </div>

                {/* 제출 버튼 */}
                <button
                    onClick={handleSubmit}
                    className="mt-6 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                >
                    비밀번호 변경하기
                </button>
            </div>

            <AlertModal
                open={alert.open}
                onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
                onConfirm={alert.onConfirm}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />
        </div>
    );
}