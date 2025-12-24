import {useEffect, useState} from "react";
import {AiFillGithub} from "react-icons/ai";
import {
  deactivateUser,
  disconnectGithub,
  getGithubUserInfo,
  getUserInfo,
  restoreUser,
  updateMyInfo
} from "../../service/user/User";
import {useLogin} from "../../context/login/useLogin";
import {useNavigate} from "react-router-dom";
import AlertModal from "../../components/modal/AlertModal";
import { useAlert } from "../../hooks/common/useAlert";
import ViewModeCard from "../../components/card/ViewModeCard";
import EditModeCard from "../../components/card/EditModeCard";
import GitHubAutoCommitSettings from "../../components/github/GitHubAutoCommitSettings";
import axiosInstance from "../../server/AxiosConfig";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, accessToken, setUser, refreshSubscription } = useLogin();
  const { alert, showAlert, closeAlert } = useAlert();
  const [editMode, setEditMode] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    nickname: "",
    email: "",
    preview: null,
    image: null,
    githubId: "",
    githubToken: "",
    hasGithubToken: false,
  });

  const [githubConnected, setGithubConnected] = useState(false);

  // MCP 관련 상태
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpToken, setMcpToken] = useState(null);
  const [mcpLoading, setMcpLoading] = useState(false);

  const maskEmail = (email) => {
    if (!email?.includes("@")) return email;
    const [id, domain] = email.split("@");
    return `${id.slice(0, 2)}****@${domain}`;
  };

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const tier = user?.subscriptionTier ?? "FREE";

  const tierLabelMap = {
    FREE: "Free",
    BASIC: "Basic",
    PRO: "Pro",
  };

  const subscriptionText = `현재 구독 요금제: ${tierLabelMap[tier]}`;
  const subscriptionTone = "primary";

  /** 🔥 사용자 기본 정보 불러오기 */
  useEffect(() => {
    const loadUserInfo = async () => {
      const res = await getUserInfo(accessToken);
      if (!res || res.error) return;

      setProfile({
        name: res.userName,
        nickname: res.userNickname || "",
        email: res.userEmail,
        preview: res.userImage || null,
        image: null,
        githubId: res.githubId || "",
        githubToken: "", // 보안상 토큰은 비워둠 (입력 시에만 값 존재)
        hasGithubToken: res.hasGithubToken || false,
      });

      setIsDeleted(res.isDeleted || false);

      /** 🔥 GitHub 연동 상태 가져오기 */
      const github = await getGithubUserInfo();
      if (!github.error) {
        setGithubConnected(github.linked); // ✔ linked 사용
      }
    };

    loadUserInfo();
  }, [accessToken, navigate]);

  /** 🔥 GitHub OAuth 연결 */
  const handleGithubConnect = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;

    console.log("🔗 [GitHub Connect] 버튼 클릭");
    console.log("🔗 clientId:", clientId);
    console.log("🔗 redirectUri:", redirectUri);

    globalThis.location.href =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&state=link`;
  };


  /** 🔥 GitHub 연결 해제 */
  const handleGithubDisconnect = async () => {
    const res = await disconnectGithub();

    if (res.error) {
      showAlert({
        type: "error",
        message: "GitHub 연결 해제에 실패했습니다.",
      });
      return;
    }

    showAlert({
      type: "success",
      message: "GitHub 연결이 해제되었습니다.",
    });
    setGithubConnected(false);
  };

  /** 🔥 프로필 이미지 변경 */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfile((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  /** 🔥 정보 저장 */
  const handleSave = async () => {
    const result = await updateMyInfo({
      name: profile.name,
      nickname: profile.nickname,
      image: profile.image,
      githubId: profile.githubId,
      githubToken: profile.githubToken,
    });

    if (!result || result.error) {
      showAlert({
        type: "error", // warning -> error 수정 (저장 실패이므로)
        title: "저장 실패",
        message: "프로필 저장에 실패했습니다.",
      });
      return;
    }

    showAlert({
      type: "success",
      message: "프로필이 성공적으로 저장되었습니다.",
    });

    setUser({
      userName: result.user.userName,
      userNickname: result.user.userNickname,
      userImage: result.user.userImage,
    });

    setProfile((prev) => ({
      ...prev,
      preview: result.user.userImage,
      image: null,
      githubId: result.user.githubId, // 업데이트된 값 반영
      hasGithubToken: result.user.hasGithubToken,
      githubToken: "", // 저장 후 입력창 초기화
    }));

    setEditMode(false);
  };

  /** 🔥 탈퇴 처리 */
  const handleDeactivate = () => {
    setDeleteModalOpen(true);
  };

  const confirmDeactivate = async () => {
    const res = await deactivateUser(accessToken);

    if (res.error) {
      showAlert({
        type: "error",
        title: "탈퇴 실패",
        message: "탈퇴 처리 중 오류가 발생했습니다.",
      });
      return;
    }

    showAlert({
      type: "warning",
      title: "회원 탈퇴 완료",
      message: "탈퇴가 완료되었습니다. 90일 이내에 계정을 복구할 수 있습니다.",
    });

    setIsDeleted(true);
    setUser(null);
  };

  /** 🔥 계정 복구 */
  const handleRestore = async () => {
    const res = await restoreUser(accessToken);

    if (res.error) {
      showAlert({
        type: "error",
        title: "계정 복구 실패",
        message: "계정을 복구하는 데 실패했습니다.",
      });
      return;
    }

    showAlert({
      type: "success",
      title: "계정 복구 완료",
      message: "계정이 성공적으로 복구되었습니다.",
    });

    setIsDeleted(false);
  };

  /** ⚡ MCP 토큰 발급/조회 */
  const handleGetMcpToken = async () => {
    try {
      setMcpLoading(true);

      const res = await axiosInstance.post("/api/mcp/token");
      setMcpToken(res.data.mcpToken);
      setShowMcpModal(true);
    } catch (err) {
      console.error("Failed to issue MCP token", err);

      showAlert({
        type: "error",
        title: "MCP 토큰 발급 실패",
        message: "MCP 토큰을 발급하는 데 실패했습니다.",
      });
    } finally {
      setMcpLoading(false);
    }
  };

  /** ⚡ MCP 토큰 재발급 */
  const handleRegenerateMcpToken = async () => {
    try {
      setMcpLoading(true);

      const res = await axiosInstance.put("/api/mcp/token/regenerate");
      setMcpToken(res.data.mcpToken);

      showAlert({
        type: "success",
        title: "MCP 토큰 재생성 완료",
        message: "MCP 토큰이 재생성되었습니다. 기존 연결은 더 이상 작동하지 않습니다.",
      });
    } catch (err) {
      console.error("Failed to regenerate MCP token", err);

      showAlert({
        type: "error",
        title: "MCP 토큰 재생성 실패",
        message: "MCP 토큰을 재생성하는 데 실패했습니다.",
      });
    } finally {
      setMcpLoading(false);
    }
  };

  /** MCP 설정 JSON 생성 */
  const mcpConfigJson = mcpToken ? JSON.stringify({
    mcpServers: {
      "coai": {
        "command": "npx",
        "args": [
          "-y",
          "github:SungilBang12/codenose-mcp" 
      ],
        "env": {
          "COAI_SERVER_URL": "https://api.co-ai.run/api/mcp/analyze",
          "COAI_MCP_TOKEN": mcpToken
        }
      }
    }
  }, null, 2) : "";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">기본정보</h1>

      {editMode ? (
        <EditModeCard
          profile={profile}
          setProfile={setProfile}
          handleImageChange={handleImageChange}
          onCancel={() => setEditMode(false)}
          onSave={handleSave}
        />
      ) : (
        <ViewModeCard
          profile={profile}
          maskEmail={maskEmail}
          subscriptionInfo={{
            text: subscriptionText,
            tone: subscriptionTone,
          }}
          onEdit={() => setEditMode(true)}
        />
      )}

      {/* 계정 연동 */}
      <div className="mt-14">
        <h2 className="text-xl font-semibold mb-4">계정 연동</h2>

        <div className="border border-[#e2e8f0] dark:border-[#2e2e2e] rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] divide-y divide-[#e2e8f0] dark:divide-[#2e2e2e]">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white">
                <AiFillGithub className="w-7 h-7 text-black"/>
              </div>
              <span className="text-lg font-medium">Github</span>
            </div>

            <div>
              {githubConnected ? (
                <button
                  onClick={handleGithubDisconnect}
                  className="px-4 py-1 border rounded-md "
                >
                  연결 해제
                </button>
              ) : (
                <button
                  onClick={handleGithubConnect} // ✔ 연결하기
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                >
                  연결하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* GitHub 자동커밋 설정 */}
        <GitHubAutoCommitSettings githubConnected={githubConnected} />

        <div className="border border-[#e2e8f0] dark:border-[#2e2e2e] rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-6 flex flex-col gap-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-lg">모아이 대량 발생</h3>
              <p className="text-gray-500 text-sm">최대 {JSON.parse(localStorage.getItem("moaiCount") ?? "1")}마리의
                모아이가 출현합니다.</p>
            </div>
            <span className="font-bold text-lg text-blue-600">
                             {JSON.parse(localStorage.getItem("moaiCount") ?? "1")} 마리
                        </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={JSON.parse(localStorage.getItem("moaiCount") ?? "1")}
            onChange={(e) => {
              localStorage.setItem("moaiCount", e.target.value);
              globalThis.dispatchEvent(new Event("storage"));
              setProfile({...profile});
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
          />
          <div className="flex items-center justify-between p-4 border-t border-[#e2e8f0] dark:border-[#2e2e2e] pt-4 mt-4">
            <div>
              <h3 className="font-medium text-lg">뿅뿅 모아이</h3>
              <p className="text-gray-500 text-sm">화면에 모아이가 뿅뿅거립니다.</p>
            </div>
            <label
              htmlFor="walkingMoai"
              className="relative inline-flex items-center cursor-pointer"
            >
              {/* 접근성용 레이블 */}
              <span className="sr-only">워킹 모아이 설정</span>

              <input
                type="checkbox"
                className="sr-only peer"
                checked={JSON.parse(localStorage.getItem("walkingMoai") ?? "true")}
                onChange={(e) => {
                  localStorage.setItem("walkingMoai", e.target.checked);
                  globalThis.dispatchEvent(new Event("storage"));
                  setProfile({ ...profile });
                }}
              />

              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                    peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full
                    peer dark:bg-gray-700 peer-checked:after:translate-x-full
                    peer-checked:after:border-white after:content-[''] after:absolute
                    after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all
                    dark:border-gray-600 peer-checked:bg-blue-600">
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* MCP 연결 설정 */}
      <div className="mt-14">
        <h2 className="text-xl font-semibold mb-4">🔌 Local AI 연결 (MCP)</h2>

        <div className="border border-[#e2e8f0] dark:border-[#2e2e2e] rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-6 space-y-4">
          <p className="text-gray-500 text-sm">
            Claude Desktop이나 다른 MCP 호환 클라이언트에서 CodeNose AI를 사용할 수 있습니다.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleGetMcpToken}
              disabled={mcpLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
            >
              {mcpLoading ? '처리 중...' : '연결 설정 보기'}
            </button>

            {mcpToken && (
              <button
                onClick={handleRegenerateMcpToken}
                disabled={mcpLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                토큰 재생성
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400">
            토큰을 재생성하면 기존 연결이 무효화됩니다. 새 토큰으로 설정 파일을 업데이트해야 합니다.
          </p>
        </div>
      </div>

      {/* MCP Connect Modal */}
      {showMcpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative animate-fade-in-up border border-gray-700">
            <button 
              onClick={() => setShowMcpModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-xl font-bold mb-4 text-indigo-400">⚡️ Connect CodeNose AI to Your IDE</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Copy the configuration below and add it to your <code className="bg-gray-700 px-1 rounded">claude_desktop_config.json</code> file.
            </p>

            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto font-mono border border-gray-700">
                {mcpConfigJson}
              </pre>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(mcpConfigJson);
                    showAlert({
                      type: "success",
                      message: "클립보드에 복사되었습니다!",
                    });
                  } catch (err) {
                    console.error("Clipboard copy failed", err);
                    showAlert({
                      type: "error",
                      message: "클립보드 복사에 실패했습니다.",
                    });
                  }
                }}
                className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleRegenerateMcpToken}
                disabled={mcpLoading}
                className="px-3 py-1 bg-orange-500 hover:bg-orange-400 text-white text-sm rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {mcpLoading ? '처리 중...' : '🔄 토큰 재생성'}
              </button>
              <button 
                onClick={() => setShowMcpModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계정 관리 */}
      <div className="mt-14">
        <h2 className="text-xl font-semibold mb-4">계정 관리</h2>

        <div className="border border-[#e2e8f0] dark:border-[#2e2e2e] rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-6">
          <div className="flex justify-end">
            {isDeleted ? (
              <button
                className="px-4 py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 cursor-pointer"
                onClick={handleRestore}
              >
                계정 복구하기
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 cursor-pointer"
                onClick={handleDeactivate}
              >
                회원 탈퇴
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 탈퇴 확인 모달 */}
      <AlertModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeactivate}
        type="warning"
        title="회원 탈퇴"
        message="정말 탈퇴하시겠습니까? 90일 이후 영구 삭제됩니다."
        confirmText="탈퇴하기"
      />

      {/* 일반 알림 모달 */}
      <AlertModal
        open={alert.open}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
        type={alert.type}
        title={alert.title || "알림"}
        message={alert.message}
      />
    </div>
  );
}
