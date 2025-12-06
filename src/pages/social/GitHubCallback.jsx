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
    });

    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertModal({ open: true, type, title, message, onConfirm });
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

            // 🔗 연동 모드
            if (mode === "link") {
                const linkResult = await linkGithubAccount(githubResult.gitHubUser);

                if (linkResult?.error) {
                    console.error("❌ GitHub 연동 실패:", linkResult.error);

                    showAlert(
                        "error",
                        "GitHub 연동 실패",
                        linkResult.error.response?.data?.message || "알 수 없는 오류가 발생했습니다.",
                        () => navigate("/profile")   // ← 확인 버튼 클릭 시 이동!
                    );

                    return;
                }

                showAlert("success", "연동 완료", "GitHub 계정 연동이 완료되었습니다!", () => {
                    navigate("/profile");
                });
                return;
            }

            // 🔐 로그인 모드
            const { loginResponse } = githubResult;

            if (!loginResponse) {
                console.error("❌ loginResponse 누락:", githubResult);
                showAlert("error", "로그인 오류", "서버에서 loginResponse를 받지 못했습니다.");
                return;
            }

            saveAuth(loginResponse);
            login(loginResponse, true);

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
                    setAlertModal((prev) => ({ ...prev, open: false, onConfirm: null }))
                }
                onConfirm={alertModal.onConfirm}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
            />
        </div>
    );
}