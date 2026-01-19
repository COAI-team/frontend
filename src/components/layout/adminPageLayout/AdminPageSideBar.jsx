import { memo, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../../context/theme/useTheme";
import {
  ChartBarIcon,
  UsersIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

// 컴포넌트 외부로 이동 (정적 데이터)
const adminMenu = [
  {
    name: "관리자",
    icon: ShieldCheckIcon,
    children: [
      {
        name: "배치 통계",
        href: "/admin/batch-stats",
        icon: ArrowTrendingUpIcon,
      },
      { name: "사용자 관리", href: "/admin/users", icon: UsersIcon },
      {
        name: "사용자 게시판 관리",
        href: "/admin/userboards",
        icon: ClipboardDocumentListIcon,
      },
      {
        name: "로그 보기",
        href: "/admin/logs",
        icon: ClipboardDocumentListIcon,
      },
    ],
  },
];

function AdminPageSideBar() {
  const location = useLocation();
  const { theme } = useTheme();

  // 안정화된 isActive 함수
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  // 클래스명 미리 계산 (렌더링마다 재생성 방지)
  const getItemClass = useCallback((href) => {
    const active = isActive(href);
    if (active) {
      return theme === "light"
        ? "bg-indigo-100 text-indigo-800"
        : "bg-indigo-600/30 text-indigo-300";
    }
    return theme === "light"
      ? "hover:bg-gray-100 text-gray-700"
      : "hover:bg-gray-800 text-gray-300";
  }, [theme, isActive]);

  // aside 클래스 미리 계산
  const asideClass = useMemo(
    () =>
      `w-64 border-r ${
        theme === "light"
          ? "border-slate-200/70 bg-white"
          : "border-slate-700/60 bg-gray-900"
      }`,
    [theme]
  );

  // 메뉴 항목들 미리 처리
  const renderedMenu = useMemo(() =>
      adminMenu.map((section) => {
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
                    key={child.href} // href로 변경 (고유성 보장)
                    to={child.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition ${getItemClass(child.href)}`}
                  >
                    <ChildIcon className="w-5 h-5" />
                    {child.name}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      }),
    [getItemClass]);

  return (
    <aside className={asideClass}>
      <nav className="flex flex-col space-y-6 p-4">
        {renderedMenu}
      </nav>
    </aside>
  );
}

export default memo(AdminPageSideBar);
