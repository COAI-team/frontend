import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useLogin } from "../../../context/LoginContext";

export default function MyPageSidebar() {
    const location = useLocation();
    const { theme } = useTheme();
    const { user } = useLogin();

    const menuItems = [
        {
            type: "group",
            name: "프로필",
            children: [
                { name: "프로필 설정", href: "/mypage/profile" },
            ]
        },
    ];

    const isActive = (href) => location.pathname === href;

    const getMenuItemClass = (href) => {
        const active = isActive(href);

        if (active) {
            return theme === "light"
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "bg-indigo-600/40 text-indigo-200 font-semibold";
        }

        return theme === "light"
            ? "hover:bg-gray-100 font-medium"
            : "hover:bg-gray-800 font-medium";
    };

    const getProfileImage = () => {
        if (!user?.image) return "/default-profile.png";
        if (user.image.startsWith("http")) return user.image;
        return `${import.meta.env.VITE_API_URL}${user.image}`;
    };

    return (
        <aside
            className={`w-64 h-screen border-r flex flex-col ${
                theme === "light"
                    ? "bg-white border-black text-gray-800"
                    : "bg-gray-900 border-gray-700 text-gray-100"
            }`}
        >
            {/* 프로필 영역 */}
            <div className="flex flex-col items-center py-6">
                <img
                    src={getProfileImage()}
                    className="w-20 h-20 rounded-full object-cover border mb-3"
                    alt="profile"
                />
                <h2 className="text-lg font-semibold">{user?.nickname || "사용자"}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <hr className="my-6 w-full" />

            {/* 메뉴 */}
            <nav className="flex flex-col px-6 space-y-6">

                {menuItems.map((section) => (
                    <div key={section.type} className="flex flex-col">

                        {/* 단일 메뉴 */}
                        {section.type === "single" && (
                            <Link
                                to={section.href}
                                className={`px-3 py-2 rounded-lg transition ${getMenuItemClass(section.href)}`}
                            >
                                {section.name}
                            </Link>
                        )}

                        {/* 그룹 메뉴 */}
                        {section.type === "group" && (
                            <>
                                {/* 부모 제목 */}
                                <p className="text-base font-bold mb-2">
                                    {section.name}
                                </p>

                                {/* 자식 메뉴 */}
                                <div className="flex flex-col space-y-1 ml-1">
                                    {section.children.map((child) => (
                                        <Link
                                            key={child.href}
                                            to={child.href}
                                            className={`px-3 py-2 rounded-lg transition ${getMenuItemClass(child.href)}`}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
