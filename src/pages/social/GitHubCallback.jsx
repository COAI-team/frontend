import { useEffect, useRef, useState } from "react";
import { loginWithGithub, linkGithubAccount } from "../../service/user/User";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../context/useLogin";
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

            // 🔗 GitHub 계정 연동 모드
            if (mode === "link") {
                const linkResult = await linkGithubAccount(githubResult.gitHubUser);

                if (linkResult?.error) {
                    console.error("❌ GitHub 연동 실패:", linkResult.error);

                    showAlert(
                        "error",
                        "GitHub 연동 실패",
                        linkResult.error.response?.data?.message || "알 수 없는 오류가 발생했습니다.",
                        () => navigate("/profile")
                    );

                    return;
                }

                showAlert("success", "연동 완료", "GitHub 계정 연동이 완료되었습니다!", () => {
                    navigate("/profile");
                });
                return;
            }

            // 🔐 GitHub 로그인 모드
            const { loginResponse } = githubResult;

            // ⛔ 기존 계정 존재 → GitHub 연동 여부 확인 모달
            if (!loginResponse) {
                if (githubResult.message?.includes("기존 일반 계정")) {
                    showAlert(
                        "warning",
                        "기존 계정 발견",
                        "기존 일반 계정이 존재합니다. GitHub 계정을 연동하시겠습니까?",
                        async () => {
                            // 🔥 실제 연동 호출
                            const linkResult = await linkGithubAccount(githubResult.gitHubUser);

                            if (linkResult?.error) {
                                showAlert(
                                    "error",
                                    "연동 실패",
                                    linkResult.error.response?.data?.message || "알 수 없는 오류입니다."
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
                        () => navigate("/signin"), // 취소할 때
                        "연동하기",
                        "취소"
                    );
                    return;
                }

                showAlert("error", "로그인 오류", githubResult.message);
                return;
            }

            // 정상 로그인
            saveAuth(loginResponse.accessToken, loginResponse.refreshToken);
            login(loginResponse.user, true);

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