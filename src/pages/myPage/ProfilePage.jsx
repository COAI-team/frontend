import {useState, useEffect} from "react";
import {FcCamera} from "react-icons/fc";
import {UserCircleIcon} from "@heroicons/react/24/solid";
import {getUserInfo} from "../../service/user/User";
import {useTheme} from "next-themes";
import {useLogin} from "../../context/LoginContext";
import {useNavigate} from "react-router-dom";

export default function ProfilePage() {
    const {theme} = useTheme();
    const navigate = useNavigate();
    const {user} = useLogin();

    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    // 🔵 Github 연결 여부
    const [githubConnected, setGithubConnected] = useState(false);
    const [githubUsername, setGithubUsername] = useState("");

    // 로그인 체크
    useEffect(() => {
        if (!user) navigate("/signin");
    }, [user, navigate]);

    // 기본 사용자 정보
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setNickname(user.nickname || "");
            setEmail(user.email || "");

            // 프사 설정
            const imgUrl = user.image || user.profileImageUrl;
            if (imgUrl) setPreview(imgUrl.startsWith("http") ? imgUrl : `${imgUrl}`);

            // ⭐ GitHub 정보 세팅
            setGithubConnected(user.githubConnected || false);
            setGithubUsername(user.githubUsername || "");
        }
    }, [user]);

    // 서버에서 최신 사용자 정보 로드
    useEffect(() => {
        const fetchUserInfo = async () => {
            const res = await getUserInfo();
            if (res && !res.error) {
                setName(res.name || "");
                setNickname(res.nickname || "");
                setEmail(res.email || "");

                const imgUrl = res.image || res.profileImageUrl;
                if (imgUrl) setPreview(imgUrl);

                // ⭐ GitHub 정보 업데이트
                setGithubConnected(res.githubConnected || false);
                setGithubUsername(res.githubUsername || "");
            }
        };
        fetchUserInfo();
    }, []);

    // 이미지 업로드
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // 프로필 저장
    const handleSaveProfile = () => {
        console.log("프로필 저장 요청:", {name, nickname, image});
        alert("프로필 업데이트 API 연동 필요");
    };

    // 이메일 저장
    const handleSaveEmail = () => {
        console.log("이메일 변경 요청:", email);
        alert("이메일 변경 API 연동 필요");
    };

    const connectGithub = () => {
        globalThis.location.href = "https://github.com/login/oauth/authorize?..."; // GitHub OAuth URL
    };

    const disconnectGithub = () => {
        alert("GitHub 계정 연결 해제 API 필요");
        // disconnect endpoint 호출 후 setGithubConnected(false);
    };

    // 버튼 색상
    const profileBtn = theme === "light" ? "bg-[#2DD4BF]" : "bg-[#FFFA99]";
    const emailBtn = theme === "light" ? "bg-[#CC67FA]" : "bg-[#2DD4BF]";
    const cameraBtn = theme === "light" ? "bg-[#04BDF2]" : "bg-[#CC67FA]";

    return (
        <div
            className="max-w-2xl mx-auto p-10 border rounded-xl shadow-md dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">

            <h1 className="text-2xl font-bold mb-8">계정 / 프로필 관리</h1>

            <h2 className="text-xl font-semibold mb-4">프로필 정보</h2>

            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center mb-10">
                <label htmlFor="profileImage" className="relative cursor-pointer">
                    <div
                        className="w-28 h-28 rounded-full overflow-hidden bg-gray-400 dark:bg-gray-700 flex items-center justify-center">
                        {preview ? (
                            <img src={preview} alt="preview" className="w-full h-full object-cover"/>
                        ) : (
                            <UserCircleIcon className="w-20 h-20 dark:text-gray-300"/>
                        )}
                    </div>

                    <div className={`${cameraBtn} absolute -bottom-2 -right-2 p-2 rounded-full shadow-md`}>
                        <FcCamera className="w-5 h-5 text-white"/>
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
                    <label
                        htmlFor="name"
                        className="block font-medium mb-2">이름</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>
                <div>
                    <label
                        htmlFor="nickname"
                        className="block font-medium mb-2">닉네임</label>
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

            {/* ⭐ GitHub 연동 상태 */}
            <div className="mt-14">
                <h2 className="text-xl font-semibold mb-4">GitHub 연동</h2>

                <div className="p-4 border rounded-lg dark:border-gray-700dark:bg-gray-800">
                    {githubConnected ? (
                        <>
                            <p className="font-medium text-green-500">🔵 GitHub 계정이 연결되어 있습니다.</p>
                            {githubUsername && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    연결된 GitHub: <b>{githubUsername}</b>
                                </p>
                            )}
                            <button
                                onClick={disconnectGithub}
                                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400"
                            >
                                연결 해제
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="font-medium text-red-500">🔴 GitHub 계정이 연결되지 않았습니다.</p>
                            <button
                                onClick={connectGithub}
                                className="mt-4 px-4 py-2 border rounded-lg transition"
                            >
                                GitHub 연동하기
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}