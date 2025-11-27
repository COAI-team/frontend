import {useState, useEffect} from "react";
import {AiFillGithub} from "react-icons/ai";
import {getUserInfo, updateMyInfo, updateEmail} from "../../service/user/User";
import {useLogin} from "../../context/LoginContext";
import {useNavigate} from "react-router-dom";

// 외부 컴포넌트 import
import ViewModeCard from "../../components/card/ViewModeCard";
import EditModeCard from "../../components/card/EditModeCard";

export default function ProfilePage() {
    const navigate = useNavigate();
    const {accessToken} = useLogin();

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

    // 이메일 마스킹
    const maskEmail = (email) => {
        if (!email.includes("@")) return email;
        const [id, domain] = email.split("@");
        return `${id.slice(0, 2)}****@${domain}`;
    };

    // 사용자 정보 로딩
    useEffect(() => {
        if (!accessToken) return navigate("/signin");

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

    // 프로필 이미지 변경
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProfile((prev) => ({
            ...prev,
            image: file,
            preview: URL.createObjectURL(file),
        }));
    };

    // 저장 버튼 클릭 처리 — 백엔드 API 호출
    const handleSave = async () => {
        console.log("📌 [프로필 저장 요청]:", profile);

        /** 1) 이메일이 변경된 경우 먼저 이메일 업데이트 */
        if (profile.email !== originalEmail) {
            const emailResult = await updateEmail(profile.email);

            if (!emailResult || emailResult.error) {
                alert("❌ 이메일 변경 중 오류가 발생했습니다.");
                console.error(emailResult);
                return;
            }

            alert("📧 이메일이 성공적으로 변경되었습니다!");
            setOriginalEmail(profile.email);
        }

        /** 2) 이름/닉네임/이미지 수정 */
        const result = await updateMyInfo(accessToken, {
            name: profile.name,
            nickname: profile.nickname,
            image: profile.image,
        });

        if (!result || result.error) {
            alert("❌ 프로필 저장 중 오류가 발생했습니다.");
            console.error(result);
            return;
        }

        alert("✅ 프로필 정보가 업데이트되었습니다.");

        // 화면 다시 로드 (이미지 반영)
        setProfile((prev) => ({
            ...prev,
            preview: result.user?.profileImageUrl || prev.preview,
        }));

        setEditMode(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-6">

            {/* 페이지 제목 */}
            <h1 className="text-xl font-bold mb-4">기본정보</h1>

            {/* 보기 / 수정 모드 */}
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
                    onEdit={() => setEditMode(true)}
                />
            )}

            {/* Github 연동 */}
            <div className="mt-14">
                <h2 className="text-xl font-semibold mb-4">계정 연동</h2>

                <div className="border rounded-2xl shadow-sm divide-y">
                    <div className="flex items-center justify-between p-4">

                        {/* 아이콘 + Github */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white">
                                <AiFillGithub className="w-7 h-7 text-black" />
                            </div>
                            <span className="text-lg font-medium">Github</span>
                        </div>

                        {/* 오른쪽 버튼 */}
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