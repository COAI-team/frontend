import { useEffect } from "react";
import { loginWithGithub } from "../../service/user/User";
import { useNavigate } from "react-router-dom";

export default function GitHubCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const processGithubLogin = async () => {
            const url = new URL(globalThis.location.href);
            const code = url.searchParams.get("code");

            // 🔥 code가 제거된 뒤 StrictMode 두 번째 실행에서는 출력 안 하도록
            if (!code) {
                if (!sessionStorage.getItem("githubLoginDone")) {
                    console.warn("❌ GitHub OAuth code 없음");
                }
                return;
            }

            // 코드 재실행 방지를 위한 플래그
            sessionStorage.setItem("githubLoginDone", "true");

            // URL에서 code 제거
            url.searchParams.delete("code");
            globalThis.history.replaceState({}, "", url.toString());

            console.log("📨 GitHub 로그인 요청 시작:", code);
            const result = await loginWithGithub(code);

            console.log("🎉 GitHub 로그인 성공:", result);

            sessionStorage.setItem("accessToken", result.accessToken);
            sessionStorage.setItem("refreshToken", result.refreshToken);

            navigate("/");
        };

        processGithubLogin();
    }, [navigate]);

    return (
        <div style={{ padding: "20px", fontSize: "18px" }}>
            GitHub 로그인 처리 중...
        </div>
    );
}