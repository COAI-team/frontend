import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ChartBarIcon,
  UsersIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const adminMenu = [
  {
    name: "관리자",
    icon: ShieldCheckIcon,
    children: [
      { name: "통계 대시보드", href: "/admin/stats", icon: ChartBarIcon },
      { name: "사용자 관리", href: "/admin/users", icon: UsersIcon },
      {
        name: "사용자 게시판 관리",
        href: "/admin/userboards",
        icon: ClipboardDocumentListIcon,
      },
    ],
  },
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
      className={`w-64 border-r 
                ${
                  theme === "light"
                    ? "border-black bg-white"
                    : "border-gray-700 bg-gray-900"
                }
            `}
    >
      <nav className="flex flex-col space-y-6 p-4">
        {adminMenu.map((section) => {
          const ParentIcon = section.icon;

          return (
            <div key={section.name} className="flex flex-col gap-2">
              {/* 부문메뉴 */}
              <div className="flex items-center gap-3 px-2 py-1 text-lg font-bold">
                <ParentIcon className="w-6 h-6" />
                {section.name}
              </div>

              {/* 자식 메뉴 */}
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
