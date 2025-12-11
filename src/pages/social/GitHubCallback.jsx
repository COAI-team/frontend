import { useEffect, useRef, useState } from "react";
import { loginWithGithub, linkGithubAccount } from "../../service/user/User";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../context/login/useLogin";
import axiosInstance from "../../server/AxiosConfig";
import { saveAuth } from "../../utils/auth/token";
import AlertModal from "../../components/modal/AlertModal";

export default function GitHubCallback() {
    const navigate = useNavigate();
    const { login } = useLogin();
    const executedRef = useRef(false);

    const [alertModal, setAlertModal] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
        onConfirm: null,
        onCancel: null,
        confirmText: "확인",
        cancelText: "취소",
    });

    const showAlert = (
        type,
        title,
        message,
        onConfirm = null,
        onCancel = null,
        confirmText = "확인",
        cancelText = "취소"
    ) => {
        setAlertModal({
            open: true,
            type,
            title,
            message,
            onConfirm,
            onCancel,
            confirmText,
            cancelText,
        });
    };

    useEffect(() => {
        if (executedRef.current) return;
        executedRef.current = true;

        const processGithub = async () => {
            const url = new URL(globalThis.location.href);
            const code = url.searchParams.get("code");
            const mode = url.searchParams.get("state");

            if (!code) {
                showAlert("error", "GitHub 오류", "GitHub code가 존재하지 않습니다.");
                return;
            }

            const githubResult = await loginWithGithub(code, mode);

            if (githubResult?.error) {
                console.error("❌ GitHub 처리 실패:", githubResult.error);
                showAlert("error", "GitHub 처리 실패", githubResult.error);
                return;
            }

            /* -------------------------------------------------
                 🔗 GitHub 계정 연동 모드
            ------------------------------------------------- */
            if (mode === "link") {
                const accessToken = localStorage.getItem("accessToken");

                const linkResult = await linkGithubAccount(
                    githubResult.gitHubUser,
                    {
                        _skipAuth: true,
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (linkResult?.error) {
                    console.error("❌ GitHub 연동 실패:", linkResult.error);

                    showAlert(
                        "error",
                        "GitHub 연동 실패",
                        linkResult.error.response?.data?.message ||
                        "알 수 없는 오류가 발생했습니다.",
                        () => navigate("/profile")
                    );

                    return;
                }

                showAlert(
                    "success",
                    "연동 완료",
                    "GitHub 계정 연동이 완료되었습니다!",
                    () => navigate("/profile")
                );
                return;
            }

            /* -------------------------------------------------
                 🔐 GitHub 로그인 모드
            ------------------------------------------------- */

            const { loginResponse } = githubResult;

            /* -------------------------------------------------
                ⛔ 기존 일반 계정 존재 → GitHub 연동 필요
            -------------------------------------------------- */
            if (!loginResponse) {
                if (githubResult.needLink) {
                    // 1) 백엔드의 기존 계정 토큰 저장
                    saveAuth({
                        accessToken: githubResult.accessToken,
                        refreshToken: githubResult.refreshToken,
                    });

                    // 2) 기존 계정 정보 조회
                    let meResponse;
                    try {
                        meResponse = await axiosInstance.get("/users/me", {
                            headers: {
                                Authorization: `Bearer ${githubResult.accessToken}`,
                            },
                            _skipAuthRedirect: true,
                        });
                    } catch (err) {
                        console.error("❌ /users/me 실패:", err);
                        showAlert(
                            "error",
                            "사용자 정보 조회 실패",
                            "기존 계정 정보를 불러오지 못했습니다."
                        );
                        return;
                    }

                    const user = meResponse.data;

                    // ⭐ LoginProvider가 요구하는 구조에 맞게 전달
                    login(
                        {
                            accessToken: githubResult.accessToken,
                            refreshToken: githubResult.refreshToken,
                            user: user,
                        },
                        true
                    );

                    // 연동 여부 모달
                    showAlert(
                        "warning",
                        "기존 계정 발견",
                        "기존 일반 계정이 존재합니다. GitHub 계정을 연동하시겠습니까?",
                        async () => {
                            const accessToken = localStorage.getItem("accessToken");

                            const linkResult = await linkGithubAccount(
                                githubResult.gitHubUser,
                                {
                                    _skipAuth: true,
                                    headers: {
                                        Authorization: `Bearer ${accessToken}`,
                                    },
                                }
                            );

                            if (linkResult?.error) {
                                showAlert(
                                    "error",
                                    "연동 실패",
                                    linkResult.error.response?.data?.message ||
                                    "알 수 없는 오류입니다."
                                );
                                return;
                            }

                            showAlert(
                                "success",
                                "연동 완료",
                                "GitHub 계정이 성공적으로 연동되었습니다!",
                                () => navigate("/profile")
                            );
                        },
                        () => navigate("/signin"),
                        "연동하기",
                        "취소"
                    );

                    return;
                }

                showAlert("error", "로그인 오류", githubResult.message);
                return;
            }

            /* -------------------------------------------------
               🎉 정상 GitHub 로그인
            -------------------------------------------------- */
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

            showAlert("success", "로그인 성공", "GitHub 로그인에 성공했습니다!", () => {
                navigate("/");
            });
        };

        processGithub();
    }, [navigate, login]);

    return (
        <div className="flex items-center justify-center h-screen flex-col gap-4 text-lg">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            GitHub 인증 처리 중...

            <AlertModal
                open={alertModal.open}
                onClose={() =>
                    setAlertModal((prev) => ({ ...prev, open: false }))
                }
                onConfirm={alertModal.onConfirm}
                onCancel={alertModal.onCancel}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
                confirmText={alertModal.confirmText}
                cancelText={alertModal.cancelText}
            />
        </div>
    );
}