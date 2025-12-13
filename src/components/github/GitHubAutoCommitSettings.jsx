import { useState, useEffect } from "react";
import { AiFillGithub } from "react-icons/ai";
import {
    getGithubSettings,
    toggleAutoCommit,
    listGithubRepositories,
    createGithubRepository,
    selectGithubRepository
} from "../../service/github/GithubApi";

/**
 * GitHub 자동커밋 설정 컴포넌트
 * 프로필 페이지에서 사용
 */
export default function GitHubAutoCommitSettings({ githubConnected }) {
    const [settings, setSettings] = useState({
        autoCommitEnabled: false,
        githubRepoName: "",
        githubRepoUrl: ""
    });
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [repoLoading, setRepoLoading] = useState(false);
    const [showRepoModal, setShowRepoModal] = useState(false);
    const [newRepoName, setNewRepoName] = useState("");
    const [isPrivate, setIsPrivate] = useState(true);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // 설정 로드
    useEffect(() => {
        if (githubConnected) {
            loadSettings();
        } else {
            setLoading(false);
        }
    }, [githubConnected]);

    const loadSettings = async () => {
        setLoading(true);
        const res = await getGithubSettings();
        if (!res.error) {
            setSettings({
                autoCommitEnabled: res.autoCommitEnabled || false,
                githubRepoName: res.githubRepoName || "",
                githubRepoUrl: res.githubRepoUrl || ""
            });
        }
        setLoading(false);
    };

    // 저장소 목록 로드
    const loadRepositories = async () => {
        setRepoLoading(true);
        const res = await listGithubRepositories();
        if (!res.error && res.repositories) {
            setRepositories(res.repositories);
        }
        setRepoLoading(false);
    };

    // 자동 커밋 토글
    const handleToggleAutoCommit = async () => {
        const newValue = !settings.autoCommitEnabled;
        const res = await toggleAutoCommit(newValue);
        if (!res.error) {
            setSettings(prev => ({ ...prev, autoCommitEnabled: res.autoCommitEnabled }));
            showMessage("success", newValue ? "자동 커밋이 활성화되었습니다." : "자동 커밋이 비활성화되었습니다.");
        } else {
            showMessage("error", res.message);
        }
    };

    // 저장소 선택 모달 열기
    const handleOpenRepoModal = () => {
        setShowRepoModal(true);
        loadRepositories();
    };

    // 저장소 선택
    const handleSelectRepo = async (repo) => {
        const res = await selectGithubRepository(repo.name, repo.htmlUrl);
        if (!res.error) {
            setSettings(prev => ({
                ...prev,
                githubRepoName: repo.name,
                githubRepoUrl: repo.htmlUrl
            }));
            setShowRepoModal(false);
            showMessage("success", `${repo.name} 저장소가 선택되었습니다.`);
        } else {
            showMessage("error", res.message);
        }
    };

    // 새 저장소 생성
    const handleCreateRepo = async () => {
        if (!newRepoName.trim()) {
            showMessage("error", "저장소 이름을 입력해주세요.");
            return;
        }

        setCreating(true);
        const res = await createGithubRepository(newRepoName.trim(), isPrivate);
        setCreating(false);

        if (!res.error && res.repository) {
            setSettings(prev => ({
                ...prev,
                githubRepoName: res.repository.name,
                githubRepoUrl: res.repository.htmlUrl
            }));
            setShowRepoModal(false);
            setNewRepoName("");
            showMessage("success", `${res.repository.name} 저장소가 생성되었습니다.`);
        } else {
            showMessage("error", res.message);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    if (!githubConnected) {
        return (
            <div className="border rounded-2xl shadow-sm p-6 mt-4 bg-gray-50 dark:bg-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                    <AiFillGithub className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">GitHub 자동커밋</h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    GitHub 자동커밋 기능을 사용하려면 먼저 GitHub 계정을 연결해주세요.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="border rounded-2xl shadow-sm p-6 mt-4">
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">로딩 중...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="border rounded-2xl shadow-sm p-6 mt-4">
                <div className="flex items-center gap-3 mb-4">
                    <AiFillGithub className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">GitHub 자동커밋</h3>
                </div>

                {/* 알림 메시지 */}
                {message.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                        message.type === "success"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* 저장소 설정 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        연결된 저장소
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 dark:bg-zinc-700 dark:border-zinc-600">
                            {settings.githubRepoName ? (
                                <a
                                    href={settings.githubRepoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {settings.githubRepoName}
                                </a>
                            ) : (
                                <span className="text-gray-400">저장소를 선택해주세요</span>
                            )}
                        </div>
                        <button
                            onClick={handleOpenRepoModal}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        >
                            {settings.githubRepoName ? "변경" : "선택"}
                        </button>
                    </div>
                </div>

                {/* ��동 커밋 토글 */}
                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-zinc-600">
                    <div>
                        <h4 className="font-medium">자동 커밋</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            문제를 맞히면 자동으로 GitHub에 커밋합니다.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.autoCommitEnabled}
                            onChange={handleToggleAutoCommit}
                            disabled={!settings.githubRepoName}
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-colors
                            ${settings.githubRepoName
                                ? "bg-gray-200 peer-checked:bg-blue-600 dark:bg-gray-700 peer-checked:dark:bg-blue-600"
                                : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                            }
                            peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300
                            dark:peer-focus:ring-blue-800
                            after:content-[''] after:absolute after:top-0.5 after:left-0.5
                            after:bg-white after:border-gray-300 after:border after:rounded-full
                            after:h-5 after:w-5 after:transition-all
                            peer-checked:after:translate-x-full peer-checked:after:border-white`}
                        ></div>
                    </label>
                </div>

                {!settings.githubRepoName && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        * 자동 커밋을 사용하려면 먼저 저장소를 선택해주세요.
                    </p>
                )}
            </div>

            {/* 저장소 선택 모달 */}
            {showRepoModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b dark:border-zinc-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold">저장소 선택</h3>
                                <button
                                    onClick={() => setShowRepoModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            {/* 새 저장소 생성 */}
                            <div className="mb-6 p-4 border rounded-lg dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700">
                                <h4 className="font-medium mb-3">새 저장소 생성</h4>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newRepoName}
                                        onChange={(e) => setNewRepoName(e.target.value)}
                                        placeholder="저장소 이름 (예: coai-algorithm)"
                                        className="flex-1 px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-600"
                                    />
                                    <button
                                        onClick={handleCreateRepo}
                                        disabled={creating || !newRepoName.trim()}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {creating ? "생성 중..." : "생성"}
                                    </button>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        className="rounded"
                                    />
                                    비공개 저장소로 생성
                                </label>
                            </div>

                            {/* 기존 저장소 목록 */}
                            <h4 className="font-medium mb-3">기존 저장소 선택</h4>
                            {repoLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-gray-500">저장소 목록 로딩 중...</span>
                                </div>
                            ) : repositories.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    저장소가 없습니다. 새로 생성해주세요.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {repositories.map((repo) => (
                                        <div
                                            key={repo.id || repo.name}
                                            onClick={() => handleSelectRepo(repo)}
                                            className={`p-3 border rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                                                settings.githubRepoName === repo.name
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "dark:border-zinc-600"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">{repo.name}</span>
                                                    {repo.isPrivate && (
                                                        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 dark:bg-zinc-600 rounded">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                                {settings.githubRepoName === repo.name && (
                                                    <span className="text-blue-600">✓</span>
                                                )}
                                            </div>
                                            {repo.description && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {repo.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t dark:border-zinc-700 bg-gray-50 dark:bg-zinc-700">
                            <button
                                onClick={() => setShowRepoModal(false)}
                                className="w-full px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-600 dark:border-zinc-500"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
