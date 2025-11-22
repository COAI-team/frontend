import { useState, useEffect } from "react";
import { CameraIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { getUserInfo } from "../../service/user/User";

export default function ProfilePage() {
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    // ⬇️ 페이지 로드 시 유저 정보 불러오기
    useEffect(() => {
        const fetchUser = async () => {
            const res = await getUserInfo();

            if (res && !res.error) {
                console.log("📌 불러온 유저 정보:", res);

                setName(res.name || "");
                setNickname(res.nickname || "");
                setEmail(res.email || "");

                // 프로필 이미지 있는 경우 미리보기로 표시
                if (res.profileImageUrl) {
                    setPreview(res.profileImageUrl);
                }
            }
        };

        fetchUser();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = () => {
        console.log("프로필 정보 저장:", { name, nickname, image });
    };

    const handleSaveEmail = () => {
        console.log("이메일 변경:", email);
    };

    return (
        <div
            className="max-w-2xl mx-auto p-10 border rounded-xl shadow-md
                       dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
        >
            <h1 className="text-2xl font-bold mb-8">계정 / 프로필 관리</h1>

            <h2 className="text-xl font-semibold mb-4">프로필 정보</h2>

            <div className="flex flex-col items-center mb-10">
                <label htmlFor="profileImage" className="relative cursor-pointer">
                    <div
                        className="w-28 h-28 rounded-full overflow-hidden bg-gray-400 dark:bg-gray-700 flex items-center justify-center">
                        {preview ? (
                            <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-20 h-20 dark:text-gray-300" />
                        )}
                    </div>

                    <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-full shadow-md">
                        <CameraIcon className="w-5 h-5 text-white" />
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

            {/* 이름 + 닉네임 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                <div>
                    <label className="block font-medium mb-2">이름</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="이름을 입력하세요"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-2">닉네임</label>
                    <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="닉네임을 입력하세요"
                    />
                </div>
            </div>

            <button
                onClick={handleSaveProfile}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    이메일 저장
                </button>
            </div>
        </div>
    );
}