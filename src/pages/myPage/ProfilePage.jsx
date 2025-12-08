import { useState, useEffect } from "react";
import { AiFillGithub } from "react-icons/ai";
import {
    getUserInfo,
    updateMyInfo,
    restoreUser,
    deactivateUser,
    getGithubUserInfo,
    disconnectGithub
} from "../../service/user/User";
import { fetchSubscriptions } from "../../service/payment/PaymentApi";
import { useLogin } from "../../context/useLogin";
import { useNavigate } from "react-router-dom";
import AlertModal from "../../components/modal/AlertModal";
import ViewModeCard from "../../components/card/ViewModeCard";
import EditModeCard from "../../components/card/EditModeCard";

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, accessToken, setUser } = useLogin();

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
    });

    const [subscription, setSubscription] = useState({ code: "FREE", label: "Free" });
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [subscriptionError, setSubscriptionError] = useState("");
    const [githubConnected, setGithubConnected] = useState(false);

    const openModal = (msg) => {
        setModalMsg(msg);
        setModalOpen(true);
    };

    const maskEmail = (email) => {
        if (!email?.includes("@")) return email;
        const [id, domain] = email.split("@");
        return `${id.slice(0, 2)}****@${domain}`;
    };

    /** 🔥 GitHub 연동 상태 확인 함수 — useEffect 위로 이동 */
    const checkGithubLink = async () => {
        const github = await getGithubUserInfo();
        if (!github.error) {
            setGithubConnected(github.linked);
        }
    };

    /** 🔥 사용자 기본 정보 불러오기 */
    useEffect(() => {
        if (!accessToken) return;

        // 이미 user 정보가 LoginProvider에 있는 경우
        if (user) {
            setProfile({
                name: user.userName,
                nickname: user.userNickname || "",
                email: user.userEmail,
                preview: user.userImage || null,
                image: null,
            });

            setIsDeleted(user.isDeleted || false);

            // 🔥 GitHub OAuth 로그인 → 자동으로 연동됨
            if (user.oauthProvider === "GITHUB") {
                setGithubConnected(true);
            } else {
                checkGithubLink(); // 🔥 문제 해결됨
            }

            return;
        }

        // user가 없고 accessToken만 있는 경우 서버 호출
        const loadUserInfo = async () => {
            const res = await getUserInfo();
            if (!res || res.error) return;

            const normalizedUser = {
                userName: res.userName,
                userNickname: res.userNickname,
                userEmail: res.userEmail,
                userImage: res.userImage,
                isDeleted: res.isDeleted,
                oauthProvider: res.oauthProvider, // 🔥 중요
            };

            setUser(normalizedUser);

            setProfile({
                name: res.userName,
                nickname: res.userNickname || "",
                email: res.userEmail,
                preview: res.userImage || null,
                image: null,
            });

            setIsDeleted(res.isDeleted || false);

            if (normalizedUser.oauthProvider === "GITHUB") {
                setGithubConnected(true);
            } else {
                checkGithubLink(); // 🔥 정상 작동
            }
        };

        loadUserInfo();
    }, [accessToken, user, navigate, setUser]);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!accessToken) {
                setSubscription({ code: "FREE", label: "Free" });
                setSubscriptionLoading(false);
                return;
            }

            setSubscriptionLoading(true);
            setSubscriptionError("");

            try {
                const res = await fetchSubscriptions();

                const list = Array.isArray(res.data) ? res.data : [];
                if (list.length === 0) {
                    setSubscription({ code: "FREE", label: "Free" });
                    return;
                }

                const active =
                    list.find((item) => (item.status || "").toUpperCase() === "ACTIVE") ||
                    list[0];

                const code = (active.subscriptionType || active.planCode || "FREE").toUpperCase();
                const label = code === "PRO" ? "Pro" : code === "BASIC" ? "Basic" : "Free";

                setSubscription({ code, label });
            } catch (err) {
                setSubscriptionError("구독 정보를 불러오지 못했습니다.");
            } finally {
                setSubscriptionLoading(false);
            }
        };

        fetchSubscription();
    }, [accessToken]);

    /** 🔥 GitHub OAuth 연결 */
    const handleGithubConnect = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;

        globalThis.location.href =
            `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=link`;
    };

    /** 🔥 GitHub 연결 해제 */
    const handleGithubDisconnect = async () => {
        const res = await disconnectGithub();

        if (res.error) {
            openModal("❌ GitHub 연결 해제 실패");
            return;
        }

        openModal("🔌 GitHub 연결이 해제되었습니다.");
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
        }));

        setEditMode(false);
    };

    /** 🔥 탈퇴 처리 */
    const handleDeactivate = () => setDeleteModalOpen(true);

    const confirmDeactivate = async () => {
        const res = await deactivateUser(accessToken);
        if (res.error) {
            openModal("❌ 탈퇴 처리 중 오류");
            return;
        }

        openModal("😢 탈퇴가 완료되었습니다. 90일 동안 복구 가능합니다.");
        setIsDeleted(true);
        setUser(null);
    };

    /** 🔥 계정 복구 */
    const handleRestore = async () => {
        const res = await restoreUser(accessToken);
        if (res.error) {
            openModal("❌ 계정 복구 실패");
            return;
        }

        openModal("🎉 계정이 복구되었습니다!");
        setIsDeleted(false);
    };

    const subscriptionTone = subscriptionError
        ? "error"
        : subscriptionLoading
        ? "muted"
        : "primary";

    const subscriptionText = subscriptionLoading
        ? "구독 정보를 불러오는 중..."
        : subscriptionError
        ? subscriptionError
        : `현재 구독 요금제: ${subscription.label}`;

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
                    subscriptionInfo={{ text: subscriptionText, tone: subscriptionTone }}
                    onEdit={() => setEditMode(true)}
                />
            )}

            {/* 계정 연동 */}
            <div className="mt-14">
                <h2 className="text-xl font-semibold mb-4">계정 연동</h2>

                <div className="border rounded-2xl shadow-sm divide-y">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white">
                                <AiFillGithub className="w-7 h-7 text-black" />
                            </div>
                            <span className="text-lg font-medium">Github</span>
                        </div>

                        <div>
                            {githubConnected ? (
                                <button
                                    onClick={handleGithubDisconnect}
                                    className="px-4 py-1 border rounded-md hover:bg-gray-100"
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
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={JSON.parse(localStorage.getItem("walkingMoai") ?? "true")}
                                onChange={(e) => {
                                    localStorage.setItem("walkingMoai", e.target.checked);
                                    window.dispatchEvent(new Event("storage"));
                                    setProfile({...profile}); 
                                }}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
                </div>

                <div className="border rounded-2xl shadow-sm p-6 flex flex-col gap-4 mt-4">
                     <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-medium text-lg">모아이 대량 발생</h3>
                            <p className="text-gray-500 text-sm">최대 {JSON.parse(localStorage.getItem("moaiCount") ?? "1")}마리의 모아이가 출현합니다.</p>
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
                            window.dispatchEvent(new Event("storage"));
                            setProfile({...profile});
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                     />
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
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeactivate}
                type="warning"
                title="회원 탈퇴"
                message="정말 탈퇴하시겠습니까? 90일 이후 영구 삭제됩니다."
                confirmText="탈퇴하기"
            />

            {/* 일반 알림 모달 */}
            <AlertModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="알림"
                message={modalMsg}
                confirmText="확인"
            />
        </div>
    );
}
