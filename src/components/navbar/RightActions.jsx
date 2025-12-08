import { RightActionsPropTypes } from "../../utils/propTypes";
import { Link } from "react-router-dom";
import { BellIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import Dropdown from "../dropdown/Dropdown";

export default function RightActions({
  theme,
  setTheme,
  user,
  logout,
  navigate,
  BASE_URL,
  accessToken,
  hydrated,
}) {
  let rawImage;

  if (typeof user?.image === "string" && user.image.startsWith("http")) {
        rawImage = user.image;
    } else if (user?.image) {
        rawImage = `${BASE_URL}${user.image}`;
    } else {
        rawImage = "/default-profile.png";
    }

  const profileImage = rawImage + "?t=" + Date.now();
  const showUser = hydrated && !!user && !!accessToken;

  return (
    <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 sm:static sm:pr-0 sm:ml-6">
            {/* 알림 버튼 */}
            <button
                className={`relative rounded-full p-1 
                focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500
                ${theme === "light" ? "text-gray-700 hover:text-black" : "text-gray-300 hover:text-white"}`}
            >
                <BellIcon className="size-6" />
            </button>

            {/* 다크모드 토글 */}
            <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className={`rounded-md p-1.5 hover:scale-110 transition-transform
                ${theme === "light" ? "text-gray-700 hover:text-black" : "text-gray-300 hover:text-white"}`}
            >
                {theme === "light" ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

      {/* 사용자 메뉴 */}
      {showUser ? (
        <Dropdown
          button={
            <div className="flex items-center gap-2 cursor-pointer">
                            <img
                                src={profileImage}
                                className="w-8 h-8 rounded-full object-cover border border-gray-300"
                                alt="프로필"
                            />
                            <span className="text-sm font-bold">{user.nickname}</span>
                        </div>
                    }
                    items={[
                        { label: "마이페이지", href: "/mypage" },
                        ...(user.role === "ROLE_ADMIN" ? [{ label: "관리자 페이지", href: "/admin" }] : []),
                        {
                            label: "로그아웃",
                            onClick: () => {
                                logout();
                                navigate("/");
                            },
                        },
                    ]}
                />
            ) : (
                <Link
                    to="/signin"
                    className={`ml-2 rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm
                    ${
                        theme === "light"
                            ? "bg-indigo-600 text-white hover:bg-indigo-500"
                            : "bg-indigo-500 text-white hover:bg-indigo-400"
                    }`}
                >
                    로그인
                </Link>
            )}
        </div>
    );
}

RightActions.propTypes = RightActionsPropTypes;
