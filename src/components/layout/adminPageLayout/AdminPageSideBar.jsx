import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
    ChartBarIcon,
    UsersIcon,
    Cog6ToothIcon,
    HomeIcon,
} from "@heroicons/react/24/outline";

const adminMenu = [
    { name: "관리자 홈", href: "/admin", icon: HomeIcon },
    { name: "유저 관리", href: "/admin/users", icon: UsersIcon },
    { name: "통계 대시보드", href: "/admin/stats", icon: ChartBarIcon },
    { name: "설정", href: "/admin/settings", icon: Cog6ToothIcon },
];

export default function AdminPageSideBar() {
    const location = useLocation();
    const { theme } = useTheme();

    const isActive = (path) => location.pathname === path;

    const getItemClass = (href) => {
        const active = isActive(href);

        if (active) {
            return theme === "light"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-indigo-600/30 text-indigo-300";
        } else {
            return theme === "light"
                ? "hover:bg-gray-100 text-gray-700"
                : "hover:bg-gray-800 text-gray-300";
        }
    };

    return (
        <aside
            className={`h-screen w-64 border-r 
                ${theme === "light" ? "border-black bg-white" : "border-gray-700 bg-gray-900"}
            `}
        >
            <nav className="flex flex-col space-y-1 p-4">
                {adminMenu.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition ${getItemClass(item.href)}`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}