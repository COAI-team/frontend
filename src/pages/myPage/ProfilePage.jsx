import {useEffect, useState, useCallback, useMemo} from "react";
import {AiFillGithub} from "react-icons/ai";
import {
  deactivateUser,
  disconnectGithub,
  getGithubUserInfo,
  getUserInfo,
  restoreUser,
  updateMyInfo
} from "../../service/user/User";
import {fetchSubscriptions} from "../../service/payment/PaymentApi";
import {useLogin} from "../../context/login/useLogin";
import {useNavigate} from "react-router-dom";
import AlertModal from "../../components/modal/AlertModal";
import ViewModeCard from "../../components/card/ViewModeCard";
import EditModeCard from "../../components/card/EditModeCard";
import GitHubAutoCommitSettings from "../../components/github/GitHubAutoCommitSettings";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { accessToken, setUser } = useLogin();
  const [editMode, setEditMode] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

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

  const [subscription, setSubscription] = useState({code: "FREE", label: "Free"});
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [githubConnected, setGithubConnected] = useState(false);

  // ✅ localStorage 값을 위한 별도 상태 추가
  const [moaiCount, setMoaiCount] = useState(() =>
    JSON.parse(localStorage.getItem("moaiCount") ?? "1")
  );
  const [walkingMoaiEnabled, setWalkingMoaiEnabled] = useState(() =>
    JSON.parse(localStorage.getItem("walkingMoai") ?? "true")
  );

  // ✅ useCallback으로 모달 열기 함수 메모이제이션
  const openModal = useCallback((msg) => {
    setModalMsg(msg);
    setModalOpen(true);
  }, []);

  // ✅ useCallback으로 이메일 마스킹 함수 메모이제이션
  const maskEmail = useCallback((email) => {
    if (!email?.includes("@")) return email;
    const [id, domain] = email.split("@");
    return `${id.slice(0, 2)}****@${domain}`;
  }, []);

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
        githubToken: "",
        hasGithubToken: res.hasGithubToken || false,
      });

      setIsDeleted(res.isDeleted || false);

      /** 🔥 GitHub 연동 상태 가져오기 */
      const github = await getGithubUserInfo();
      if (!github.error) {
        setGithubConnected(github.linked);
      }
    };

    loadUserInfo();
  }, [accessToken, navigate]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!accessToken) {
        setSubscription({code: "FREE", label: "Free"});
        setSubscriptionLoading(false);
        return;
      }

      setSubscriptionLoading(true);
      setSubscriptionError("");

      try {
        const res = await fetchSubscriptions();

        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length === 0) {
          setSubscription({code: "FREE", label: "Free"});
          return;
        }

        const active =
          list.find((item) => (item.status || "").toUpperCase() === "ACTIVE") ||
          list[0];

        const code = (active.subscriptionType || active.planCode || "FREE").toUpperCase();
        const labels = {
          PRO: "Pro",
          BASIC: "Basic",
        };

        const label = labels[code] ?? "Free";

        setSubscription({code, label});
      } catch {
        setSubscriptionError("구독 정보를 불러오지 못했습니다.");
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, [accessToken]);

  // ✅ storage 이벤트 리스너 추가 (다른 탭/창에서 변경 감지)
  useEffect(() => {
    const handleStorageChange = () => {
      setMoaiCount(JSON.parse(localStorage.getItem("moaiCount") ?? "1"));
      setWalkingMoaiEnabled(JSON.parse(localStorage.getItem("walkingMoai") ?? "true"));
    };

    globalThis.addEventListener("storage", handleStorageChange);

    return () => {
      globalThis.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /** 🔥 GitHub OAuth 연결 */
  const handleGithubConnect = useCallback(() => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;

    globalThis.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=link`;
  }, []);

  /** 🔥 GitHub 연결 해제 */
  const handleGithubDisconnect = useCallback(async () => {
    const res = await disconnectGithub();

    if (res.error) {
      openModal("❌ GitHub 연결 해제 실패");
      return;
    }

    openModal("🔌 GitHub 연결이 해제되었습니다.");
    setGithubConnected(false);
  }, [openModal]);

  /** 🔥 프로필 이미지 변경 */
  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfile((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  }, []);

  /** 🔥 정보 저장 */
  const handleSave = useCallback(async () => {
    const result = await updateMyInfo({
      name: profile.name,
      nickname: profile.nickname,
      image: profile.image,
      githubId: profile.githubId,
      githubToken: profile.githubToken,
    });

    if (!result || result.error) {
      openModal("❌ 프로필 저장 실패");
      return;
    }

    openModal("✅ 프로필 저장 성공!");

    setUser({
      userName: result.user.userName,
      userNickname: result.user.userNickname,
      userImage: result.user.userImage,
    });

    setProfile((prev) => ({
      ...prev,
      preview: result.user.userImage,
      image: null,
      githubId: result.user.githubId,
      hasGithubToken: result.user.hasGithubToken,
      githubToken: "",
    }));

    setEditMode(false);
  }, [profile.name, profile.nickname, profile.image, profile.githubId, profile.githubToken, openModal, setUser]);

  /** 🔥 탈퇴 처리 */
  const handleDeactivate = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  const confirmDeactivate = useCallback(async () => {
    const res = await deactivateUser(accessToken);
    if (res.error) {
      openModal("❌ 탈퇴 처리 중 오류");
      return;
    }

    openModal("😢 탈퇴가 완료되었습니다. 90일 동안 복구 가능합니다.");
    setIsDeleted(true);
    setUser(null);
  }, [accessToken, openModal, setUser]);

  /** 🔥 계정 복구 */
  const handleRestore = useCallback(async () => {
    const res = await restoreUser(accessToken);
    if (res.error) {
      openModal("❌ 계정 복구 실패");
      return;
    }

    openModal("🎉 계정이 복구되었습니다!");
    setIsDeleted(false);
  }, [accessToken, openModal]);

  // ✅ useMemo로 구독 정보 텍스트 및 톤 계산 최적화
  const subscriptionInfo = useMemo(() => {
    let tone;
    let text;

    if (subscriptionError) {
      tone = "error";
      text = subscriptionError;
    } else if (subscriptionLoading) {
      tone = "muted";
      text = "구독 정보를 불러오는 중...";
    } else {
      tone = "primary";
      text = `현재 구독 요금제: ${subscription.label}`;
    }

    return { text, tone };
  }, [subscriptionError, subscriptionLoading, subscription.label]);

  // ✅ useCallback으로 모아이 수량 변경 핸들러 메모이제이션
  const handleMoaiCountChange = useCallback((e) => {
    const value = e.target.value;
    localStorage.setItem("moaiCount", value);
    globalThis.dispatchEvent(new Event("storage"));
    setMoaiCount(JSON.parse(value));
  }, []);

  // ✅ useCallback으로 워킹 모아이 토글 핸들러 메모이제이션
  const handleWalkingMoaiToggle = useCallback((e) => {
    const checked = e.target.checked;
    localStorage.setItem("walkingMoai", checked);
    globalThis.dispatchEvent(new Event("storage"));
    setWalkingMoaiEnabled(checked);
  }, []);

  // ✅ useCallback으로 모달 닫기 핸들러 메모이제이션
  const handleDeleteModalClose = useCallback(() => {
    setDeleteModalOpen(false);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleEditModeCancel = useCallback(() => {
    setEditMode(false);
  }, []);

  const handleEditModeToggle = useCallback(() => {
    setEditMode(true);
  }, []);

  // ✅ 프로필 이미지 URL 정리
  useEffect(() => {
    return () => {
      if (profile.preview && profile.image) {
        URL.revokeObjectURL(profile.preview);
      }
    };
  }, [profile.preview, profile.image]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">기본정보</h1>

      {editMode ? (
        <EditModeCard
          profile={profile}
          setProfile={setProfile}
          handleImageChange={handleImageChange}
          onCancel={handleEditModeCancel}
          onSave={handleSave}
        />
      ) : (
        <ViewModeCard
          profile={profile}
          maskEmail={maskEmail}
          subscriptionInfo={subscriptionInfo}
          onEdit={handleEditModeToggle}
        />
      )}

      {/* 계정 연동 */}
      <div className="mt-14">
        <h2 className="text-xl font-semibold mb-4">계정 연동</h2>

        <div className="border rounded-2xl shadow-sm divide-y">
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
                  onClick={handleGithubConnect}
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

        <div className="border rounded-2xl shadow-sm p-6 flex flex-col gap-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-lg">모아이 대량 발생</h3>
              <p className="text-gray-500 text-sm">최대 {moaiCount}마리의 모아이가 출현합니다.</p>
            </div>
            <span className="font-bold text-lg text-blue-600">
              {moaiCount} 마리
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={moaiCount}
            onChange={handleMoaiCountChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
          />
          <div className="flex items-center justify-between p-4 border-t pt-4 mt-4">
            <div>
              <h3 className="font-medium text-lg">뿅뿅 모아이</h3>
              <p className="text-gray-500 text-sm">화면에 모아이가 뿅뿅거립니다.</p>
            </div>
            <label
              htmlFor="walkingMoai"
              className="relative inline-flex items-center cursor-pointer"
            >
              <span className="sr-only">워킹 모아이 설정</span>

              <input
                type="checkbox"
                id="walkingMoai"
                className="sr-only peer"
                checked={walkingMoaiEnabled}
                onChange={handleWalkingMoaiToggle}
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

      {/* 계정 관리 */}
      <div className="mt-14">
        <h2 className="text-xl font-semibold mb-4">계정 관리</h2>

        <div className="border rounded-2xl shadow-sm p-6">
          <div className="flex justify-end">
            {isDeleted ? (
              <button
                className="px-4 py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                onClick={handleRestore}
              >
                계정 복구하기
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
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
        onClose={handleDeleteModalClose}
        onConfirm={confirmDeactivate}
        type="warning"
        title="회원 탈퇴"
        message="정말 탈퇴하시겠습니까? 90일 이후 영구 삭제됩니다."
        confirmText="탈퇴하기"
      />

      {/* 일반 알림 모달 */}
      <AlertModal
        open={modalOpen}
        onClose={handleModalClose}
        title="알림"
        message={modalMsg}
        confirmText="확인"
      />
    </div>
  );
}
