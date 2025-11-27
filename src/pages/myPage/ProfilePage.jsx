import { useState, useEffect } from "react";
import { AiFillGithub } from "react-icons/ai";
import { getUserInfo, updateMyInfo, updateEmail } from "../../service/user/User";
import { useLogin } from "../../context/useLogin";
import { useNavigate } from "react-router-dom";

import ViewModeCard from "../../components/card/ViewModeCard";
import EditModeCard from "../../components/card/EditModeCard";

export default function ProfilePage() {
    const navigate = useNavigate();
    const { accessToken, setUser } = useLogin();

    const [editMode, setEditMode] = useState(false);

    const [profile, setProfile] = useState({
        name: "",
        nickname: "",
        email: "",
        preview: null,
        image: null,
    });

    const [originalEmail, setOriginalEmail] = useState("");
    const [githubConnected, setGithubConnected] = useState(false);

    const maskEmail = (email) => {
        if (!email.includes("@")) return email;
        const [id, domain] = email.split("@");
        return `${id.slice(0, 2)}****@${domain}`;
    };

    useEffect(() => {
        const loadUserInfo = async () => {
            const res = await getUserInfo(accessToken);
            if (!res || res.error) return;

            setProfile({
                name: res.name,
                nickname: res.nickname || "",
                email: res.email,
                preview: res.profileImageUrl || res.image || null,
                image: null,
            });

            setOriginalEmail(res.email);
            setGithubConnected(res.githubConnected || false);
        };

        loadUserInfo();
    }, [accessToken, navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProfile((prev) => ({
            ...prev,
            image: file,
            preview: URL.createObjectURL(file),
        }));
    };

    const handleSave = async () => {
        console.log("📌 [프로필 저장 요청]:", profile);

        if (profile.email !== originalEmail) {
            const emailResult = await updateEmail(profile.email);
            if (!emailResult || emailResult.error) {
                alert("❌ 이메일 변경 중 오류 발생");
                return;
            }
            setOriginalEmail(profile.email);
        }

        const result = await updateMyInfo(accessToken, {
            name: profile.name,
            nickname: profile.nickname,
            image: profile.image,
        });

        if (!result || result.error) {
            alert("❌ 프로필 저장 실패");
            return;
        }

        alert("✅ 프로필 저장 성공!");

        // LoginContext 업데이트 → Navbar 즉시 반영
        setUser({
            name: result.user.name,
            nickname: result.user.nickname,
            image: result.user.image, // 🔥 캐싱 방지용 URL은 Navbar에서 처리
        });

        setProfile((prev) => ({
            ...prev,
            preview: result.user.image,
        }));

        setEditMode(false);
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

        </div>
    );
}