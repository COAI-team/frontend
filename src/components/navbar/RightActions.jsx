import { useCallback, useMemo, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import Dropdown from "../dropdown/Dropdown";
import { useTheme } from "../../context/theme/useTheme";
import { RightActionsPropTypes } from "../../utils/propTypes";

const RightActions = ({ user, logout, BASE_URL, hydrated }) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // ✅ useMemo로 이미지 URL 메모이제이션 (캐시 버퍼 제거)
  const profileImage = useMemo(() => {
    if (typeof user?.image === "string" && user.image.startsWith("http")) {
      return user.image;
    } else if (user?.image) {
      return `${BASE_URL}${user.image}`;
    }
    return "/default-profile.png";
  }, [user?.image, BASE_URL]);

  // ✅ useMemo로 사용자 표시 조건
  const showUser = useMemo(() =>
      hydrated && !!user,
    [hydrated, user]
  );

  // ✅ useCallback으로 테마 토글 함수
  const handleThemeToggle = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }, [theme, setTheme]);

  // ✅ useCallback으로 로그아웃 함수
  const handleLogout = useCallback(() => {
    logout?.();
    navigate("/");
  }, [logout, navigate]);

  // ✅ useMemo로 관리자 여부
  const isAdmin = useMemo(() =>
      user?.role === "ROLE_ADMIN",
    [user?.role]
  );

  // ✅ useMemo로 드롭다운 아이템 배열 (재생성 방지)
  const dropdownItems = useMemo(() => [
    { label: "마이페이지", href: "/mypage" },
    ...(isAdmin ? [{ label: "관리자 페이지", href: "/admin" }] : []),
    {
      label: "로그아웃",
      onClick: handleLogout,
    },
  ], [isAdmin, handleLogout]);

  // ✅ useMemo로 테마 아이콘 결정
  const ThemeIcon = useMemo(() =>
      theme === "dark" ? SunIcon : MoonIcon,
    [theme]
  );

  return (
    <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 sm:static sm:pr-0 sm:ml-6">
      {/* 다크모드 토글 */}
      <button
        type="button"
        onClick={handleThemeToggle}
        className={
          "rounded-md p-1.5 hover:scale-110 transition-all" +
          (theme === "dark"
            ? "text-white"              // SunIcon일 때 (dark 테마일 때) 흰색
            : "text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white")
        }
        aria-label="테마 토글"
        aria-pressed={theme === "dark"}
      >
        <ThemeIcon className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* 사용자 메뉴 */}
      {showUser ? (
        <Dropdown
          button={
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200">
              <img
                src={profileImage}
                className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow-sm"
                alt={`${user.nickname} 프로필 이미지`}
                width="32"
                height="32"
                loading="lazy"
              />
              <span className="text-sm font-bold dark:text-white truncate max-w-30">
                                {user.nickname}
                            </span>
            </div>
          }
          items={dropdownItems}
        />
      ) : (
        <Link
          to="/signin"
          className="ml-2 rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="로그인 페이지로 이동"
        >
          로그인
        </Link>
      )}
    </div>
  );
};

RightActions.propTypes = RightActionsPropTypes;

export default memo(RightActions);
