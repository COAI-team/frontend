import { useState } from "react";

export default function ProfilePage() {
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

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
        <div className="max-w-2xl mx-auto p-6 border rounded-xl shadow-md bg-white dark:bg-gray-900">
            <h1 className="text-2xl font-bold mb-8">계정 / 프로필 관리</h1>

            {/* 프로필 이미지 */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">프로필 정보</h2>

                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    프로필 이미지
                </label>

                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                        {preview ? (
                            <img
                                src={preview}
                                alt="preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No Image
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block"
                    />
                </div>

                {/* 이름 */}
                <div className="mt-6">
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                        이름
                    </label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800"
                        placeholder="이름을 입력하세요"
                    />
                </div>

                {/* 닉네임 */}
                <div className="mt-6">
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                        닉네임
                    </label>
                    <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800"
                        placeholder="닉네임을 입력하세요"
                    />
                </div>

                <button
                    onClick={handleSaveProfile}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    프로필 저장
                </button>
            </div>

            {/* 이메일 변경 */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">이메일 변경</h2>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-gray-800"
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