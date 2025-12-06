import { useEffect, useRef } from "react";
import { loginWithGithub, linkGithubAccount } from "../../service/user/User";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../context/useLogin";
import { saveAuth } from "../../utils/auth/token";

export default function GitHubCallback() {
    const navigate = useNavigate();
    const { login } = useLogin();
    const executedRef = useRef(false); // 🔥 중복 실행 방지

    useEffect(() => {
        if (executedRef.current) return;
        executedRef.current = true;

        const processGithub = async () => {
            const url = new URL(globalThis.location.href);
            const code = url.searchParams.get("code");
            const mode = url.searchParams.get("state");

            if (!code) {
                console.error("❌ GitHub code 없음");
                return;
            }

            console.log("📨 GitHub 요청 시작:", { code, mode });

            const githubResult = await loginWithGithub(code, mode);

            if (githubResult?.error) {
                console.error("❌ GitHub 처리 실패", githubResult.error);
                return;
            }

            // 🔗 연동 모드 (state=link)
            if (mode === "link") {
                console.log("🔗 연동 모드 GitHubUserResponse =", githubResult);

                const linkResult = await linkGithubAccount(githubResult.gitHubUser);

                if (linkResult?.error) {
                    console.error("❌ GitHub 연동 실패", linkResult.error);
                    return;
                }

                alert("🎉 GitHub 계정 연동 완료!");
                navigate("/profile");
                return;
            }

            // 🔐 로그인 모드 — loginResponse만 추출
            const { loginResponse } = githubResult;

            if (!loginResponse) {
                console.error("❌ loginResponse 누락됨:", githubResult);
                return;
            }

            saveAuth(loginResponse);
            login(loginResponse, true);

            navigate("/");
        };

        processGithub();
    }, [navigate, login]);

    return (
        <div style={{ padding: "20px", fontSize: "18px" }}>
            GitHub 인증 처리 중...
        </div>
    );
}