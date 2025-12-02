import { useState, useEffect } from "react";
import { AiFillGithub } from "react-icons/ai";
import { getUserInfo, updateMyInfo, restoreUser, deactivateUser } from "../../service/user/User";
import { useLogin } from "../../context/useLogin";
import { useNavigate } from "react-router-dom";
import AlertModal from "../../components/modal/AlertModal";
import ViewModeCard from "../../components/card/ViewModeCard";
import EditModeCard from "../../components/card/EditModeCard";

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
    });

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

    /** 🔥 사용자 기본 정보 불러오기 */
    useEffect(() => {
        const loadUserInfo = async () => {
            const res = await getUserInfo(accessToken);
            if (!res || res.error) return;

            setProfile({
                name: res.userName,
                nickname: res.userNickname || "",
                email: res.userEmail,
                preview: res.userImage || null,  // 🔥 정리됨!
                image: null,
            });

            setGithubConnected(res.githubConnected || false);
            setIsDeleted(res.isDeleted || false);
        };

        loadUserInfo();
    }, [accessToken, navigate]);

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
        console.log("📌 [프로필 저장 요청]:", profile);

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

        /** 🔥 Navbar 업데이트 — 백엔드 응답 필드 기준 */
        setUser({
            userName: result.user.userName,
            userNickname: result.user.userNickname,
            userImage: result.user.userImage,
        });

        /** 🔥 로컬에서도 즉시 적용 */
        setProfile((prev) => ({
            ...prev,
            preview: result.user.userImage,
            image: null,
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
            openModal("❌ 탈퇴 처리 중 오류 발생");
            return;
        }

        openModal("😢 탈퇴가 완료되었습니다. 90일 동안 복구하실 수 있습니다.");
        setIsDeleted(true);
        setUser(null);
    };

    /** 🔥 계정 복구 */
    const handleRestore = async () => {
        const res = await restoreUser(accessToken);
        if (res.error) {
            openModal("❌ 복구 처리 중 오류 발생");
            return;
        }

        openModal("🎉 계정이 복구되었습니다!");
        setIsDeleted(false);
    };

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
                <ViewModeCard profile={profile} maskEmail={maskEmail} onEdit={() => setEditMode(true)} />
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
                                <button className="px-4 py-1 border rounded-md hover:bg-gray-100">
                                    연결 해제
                                </button>
                            ) : (
                                <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200">
                                    연결하기
                                </button>
                            )}
                        </div>
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