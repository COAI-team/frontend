import { useEffect } from "react";
import { loginWithGithub } from "../../service/user/User";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../context/useLogin";

export default function GitHubCallback() {
    const navigate = useNavigate();
    const { login } = useLogin();   // 🔥 추가

    useEffect(() => {
        const processGithubLogin = async () => {
            const url = new URL(globalThis.location.href);
            const code = url.searchParams.get("code");

            if (!code) {
                if (!sessionStorage.getItem("githubLoginDone")) {
                    console.warn("❌ GitHub OAuth code 없음");
                }
                return;
            }

            sessionStorage.setItem("githubLoginDone", "true");

            // URL에서 code 제거
            url.searchParams.delete("code");
            globalThis.history.replaceState({}, "", url.toString());

            console.log("📨 GitHub 로그인 요청 시작:", code);
            const result = await loginWithGithub(code);

            console.log("🎉 GitHub 로그인 성공:", result);

            login(result, true);

            navigate("/");
        };

        processGithubLogin();
    }, [navigate, login]);

    return (
        <div style={{ padding: "20px", fontSize: "18px" }}>
            GitHub 로그인 처리 중...
        </div>
    );
}