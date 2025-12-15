import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
    UserIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    ChartBarIcon,
    PresentationChartLineIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const myMenu = [
    {
        name: "프로필",
        icon: UserIcon,
        children: [
            { name: "프로필 설정", href: "/mypage/profile", icon: UserCircleIcon },
        ],
    },
    {
        name: "미션",
        icon: CalendarDaysIcon,
        children: [
            { name: "오늘의 미션", href: "/mypage/daily-mission", icon: CheckCircleIcon },
        ],
    },
    {
        name: "결제/구독",
        icon: CreditCardIcon,
        children: [
            { name: "결제·구독 관리", href: "/mypage/billing", icon: Cog6ToothIcon },
        ],
    },
    {
        name: "대시 보드",
        icon: ChartBarIcon,
        children: [
            { name: "코드 분석", href: "/mypage/dashboard", icon: PresentationChartLineIcon },
        ],
    },
    {
        name: "학습 기록",
        icon: ClipboardDocumentListIcon,
        children: [
            { name: "알고리즘 풀이 기록", href: "/mypage/algo-history", icon: ClipboardDocumentListIcon },
        ],
    },
];

export default function MyPageSidebar() {
    const location = useLocation();
    const { theme } = useTheme();

    const isActive = (href) => location.pathname === href;

    const getItemClass = (href) => {
        const active = isActive(href);

        if (active) {
            return theme === "light"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-indigo-600/30 text-indigo-300";
        }
        return theme === "light"
            ? "hover:bg-gray-100 text-gray-800"
            : "hover:bg-gray-800 text-gray-300";
    };

    return (
        <aside
            className={`w-64 border-r 
                ${theme === "light" ? "border-black bg-white" : "border-gray-700 bg-gray-900"}
            `}
        >
            <nav className="flex flex-col space-y-6 p-4">
                {myMenu.map((section) => {
                    const ParentIcon = section.icon;

                    return (
                        <div key={section.name} className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 px-2 py-1 text-lg font-bold">
                                <ParentIcon className="w-6 h-6" />
                                {section.name}
                            </div>

                            <div className="flex flex-col space-y-1 ml-2">
                                {section.children.map((child) => {
                                    const ChildIcon = child.icon;

                                    return (
                                        <Link
                                            key={child.name}
                                            to={child.href}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition ${getItemClass(
                                                child.href
                                            )}`}
                                        >
                                            <ChildIcon className="w-5 h-5" />
                                            {child.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
