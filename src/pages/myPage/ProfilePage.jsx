import { useState, useEffect } from "react";
import { CameraIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { getUserInfo, updatePassword } from "../../service/user/User";
import { useTheme } from "next-themes";
import { useLogin } from "../../context/LoginContext";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const { user, accessToken } = useLogin(); // ⭐ accessToken 사용!

    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ⭐ 로그인 안 된 사용자는 로그인 페이지로 이동
    useEffect(() => {
        if (!user) navigate("/signin");
    }, [user, navigate]);

    // ⭐ 기본 사용자 정보 (Context 기반)
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setNickname(user.nickname || "");
            setEmail(user.email || "");
            setPreview(user.image || null);
        }
    }, [user]);

    // ⭐ 서버에서 최신 사용자 정보 불러오기
    useEffect(() => {
        const fetchUserInfo = async () => {
            const res = await getUserInfo(); // axiosInstance가 자동으로 토큰 적용

            if (res && !res.error) {
                setName(res.name || "");
                setNickname(res.nickname || "");
                setEmail(res.email || "");
                setPreview(res.image || res.profileImageUrl || null);
            }
        };

        fetchUserInfo();
    }, []);

    // 이미지 선택 핸들러
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // ⭐ 프로필 저장
    const handleSaveProfile = () => {
        console.log("프로필 저장 요청:", { name, nickname, image });
        alert("프로필 업데이트 API 연동 필요");
    };

    // ⭐ 이메일 변경
    const handleSaveEmail = () => {
        console.log("이메일 변경 요청:", email);
        alert("이메일 변경 API 연동 필요");
    };

    // ⭐ 비밀번호 변경 (토큰 필수!)
    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        if (!accessToken) {
            alert("로그인이 필요합니다.");
            navigate("/signin");
            return;
        }

        const result = await updatePassword(
            {
                oldPassword,
                newPassword,
            },
            user?.accessToken  // 또는 accessToken
        );

        console.log(result, "비밀번호 변경 결과");

        if (result.error) {
            alert(result.message || "비밀번호 변경 실패");
            return;
        }

        alert("비밀번호가 성공적으로 변경되었습니다.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    // 🎨 테마별 버튼 컬러
    const profileBtn = theme === "light" ? "bg-[#2DD4BF]" : "bg-[#FFFA99]";
    const emailBtn = theme === "light" ? "bg-[#CC67FA]" : "bg-[#2DD4BF]";
    const pwBtn = theme === "light" ? "bg-[#FF90CD]" : "bg-[#FF90CD]";
    const cameraBtn = theme === "light" ? "bg-[#04BDF2]" : "bg-[#CC67FA]";

    return (
        <div className="max-w-2xl mx-auto p-10 border rounded-xl shadow-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">

            <h1 className="text-2xl font-bold mb-8">계정 / 프로필 관리</h1>

            <h2 className="text-xl font-semibold mb-4">프로필 정보</h2>

            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center mb-10">
                <label htmlFor="profileImage" className="relative cursor-pointer">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-400 dark:bg-gray-700 flex items-center justify-center">
                        {preview ? (
                            <img src={preview} alt="preview" className="w-full h-full object-cover"/>
                        ) : (
                            <UserCircleIcon className="w-20 h-20 dark:text-gray-300"/>
                        )}
                    </div>

                    <div className={`${cameraBtn} absolute -bottom-2 -right-2 p-2 rounded-full shadow-md`}>
                        <CameraIcon className="w-5 h-5 text-white"/>
                    </div>

                    <input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                </label>
            </div>

            {/* 이름/닉네임 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                    <label className="block font-medium mb-2">이름</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>
                <div>
                    <label className="block font-medium mb-2">닉네임</label>
                    <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>
            </div>

            <button
                onClick={handleSaveProfile}
                className={`${profileBtn} mt-6 px-6 py-2 text-black rounded-lg hover:opacity-80`}
            >
                프로필 저장
            </button>

            {/* 이메일 변경 */}
            <div className="mt-12">
                <h2 className="text-xl font-semibold mb-4">이메일 변경</h2>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="새 이메일을 입력하세요"
                />

                <button
                    onClick={handleSaveEmail}
                    className={`${emailBtn} px-6 py-2 text-black rounded-lg hover:opacity-80`}
                >
                    이메일 저장
                </button>
            </div>

            {/* 비밀번호 변경 */}
            <div className="mt-12">
                <h2 className="text-xl font-semibold mb-4">비밀번호 변경</h2>

                <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="현재 비밀번호"
                />

                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="새 비밀번호"
                />

                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="새 비밀번호 확인"
                />

                <button
                    onClick={handleChangePassword}
                    className={`${pwBtn} px-6 py-2 text-black rounded-lg hover:opacity-80`}
                >
                    비밀번호 저장
                </button>
            </div>
        </div>
    );
}