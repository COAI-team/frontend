export default function GitHubLoginButton() {
    const handleGitHubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = `${globalThis.location.origin}/oauth/github/callback`;

        globalThis.location.href = `https://github.com/login/oauth/authorize` +
            `?client_id=${clientId}` +
            `&redirect_uri=${redirectUri}` +
            `&scope=read:user user:email`;
    };

    return (
        <button
            onClick={handleGitHubLogin}
            className="bg-black text-white px-3 py-2 rounded"
        >
            GitHub Login
        </button>
    );
}