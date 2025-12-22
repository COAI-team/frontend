import { memo, useCallback, useMemo } from "react";

const GitHubLoginButton = () => {
  // ✅ useCallback으로 함수 메모이제이션
  const handleGitHubLogin = useCallback(() => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${globalThis.location.origin}/oauth/github/callback`;

    globalThis.location.href = `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=read:user user:email`;
  }, []); // 빈 의존성 배열 - 환경변수는 변경되지 않음

  // ✅ useMemo로 클래스명 메모이제이션 (선택사항 - 정적이므로 효과 미미)
  const buttonClassName = useMemo(() =>
      "bg-black dark:bg-gray-900 text-white px-3 py-2 rounded hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
    []
  );

  return (
    <button
      type="button"
      onClick={handleGitHubLogin}
      className={buttonClassName}
      aria-label="GitHub으로 로그인"
    >
            <span className="flex items-center gap-2">
                GitHub Login
            </span>
    </button>
  );
};

// ✅ React.memo로 불필요한 재렌더링 방지
export default memo(GitHubLoginButton);
