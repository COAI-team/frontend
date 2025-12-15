import {RightActionsPropTypes} from "../../utils/propTypes";
import {Link, useNavigate} from "react-router-dom";
import {MoonIcon, SunIcon} from "@heroicons/react/24/outline";
import Dropdown from "../dropdown/Dropdown";
import { useTheme } from "../../context/theme/useTheme";

export default function RightActions({ user, logout, BASE_URL, hydrated }) {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    let rawImage;
    if (typeof user?.image === "string" && user.image.startsWith("http")) {
        rawImage = user.image;
    } else if (user?.image) {
        rawImage = `${BASE_URL}${user.image}`;
    } else {
        rawImage = "/default-profile.png";
    }

    const profileImage = rawImage + "?t=" + Date.now();
    const showUser = hydrated && !!user;

    return (
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 sm:static sm:pr-0 sm:ml-6">
            {/* 다크모드 토글 */}
            <button
                onClick={() => {
                    const newTheme = theme === "light" ? "dark" : "light";
                    setTheme(newTheme);
                }}
                className="rounded-md p-1.5 hover:scale-110 transition-transform
             text-gray-700 dark:text-gray-300
             hover:text-black dark:hover:text-white"
                aria-label="테마 토글"
            >
                {theme === "dark" ? (
                    // 다크모드일 때: 해 아이콘 (라이트로 전환 의미)
                    <SunIcon className="w-5 h-5 text-white" />
                ) : (
                    // 라이트모드일 때: 달 아이콘 (다크로 전환 의미)
                    <MoonIcon className="w-5 h-5" />
                )}
            </button>

            {/* 사용자 메뉴 */}
            {showUser ? (
                <Dropdown
                    button={
                        <div className="flex items-center gap-2 cursor-pointer">
                            <img
                                src={profileImage}
                                className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                                alt="프로필"
                            />
                            <span className="text-sm font-bold dark:text-white">
                                {user.nickname}
                            </span>
                        </div>
                    }
                    items={[
                        {label: "마이페이지", href: "/mypage"},
                        ...(user.role === "ROLE_ADMIN" ? [{label: "관리자 페이지", href: "/admin"}] : []),
                        {
                            label: "로그아웃",
                            onClick: () => {
                                logout?.();
                                navigate("/");
                            },
                        },
                    ]}
                />
            ) : (
                <Link
                    to="/signin"
                    className="ml-2 rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm
                               bg-indigo-600 hover:bg-indigo-500 text-white
                               dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                    로그인
                </Link>
            )}
        </div>
    );
}

RightActions.propTypes = RightActionsPropTypes;