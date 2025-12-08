import { Disclosure } from "@headlessui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLogin } from "../../../context/useLogin";
import { useTheme } from "next-themes";
import MobileNav from "../../navbar/MobileNav";
import MobileMenuButton from "../../button/MobileMenuButton";
import Logo from "../../navbar/Logo";
import { NavLinks } from "../../navbar/NavLinks";
import RightActions from "../../navbar/RightActions";

const initialNavigation = [
  { name: "코드 분석", href: "/codeAnalysis" },
  { name: "알고리즘", href: "/algorithm" },
  { name: "자유게시판", href: "/freeboard" },
  { name: "코드게시판", href: "/codeboard" },
  { name: "결제", href: "/payments" },
  { name: "관리자", href: "/admin" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [navigation, setNavigation] = useState(
    initialNavigation.map((item) => ({ ...item, current: false }))
  );

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL;
  const { user, logout } = useLogin();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setNavigation((prev) =>
      prev.map((i) => ({
        ...i,
        current: i.href === location.pathname,
      }))
    );
  }, [location.pathname]);

  const handleLinkClick = (href) => {
    setNavigation((prev) =>
      prev.map((i) => ({
        ...i,
        current: i.href === href,
      }))
    );
  };

  if (!mounted) return null;

  return (
    <Disclosure
      as="nav"
      className={`relative transition-colors border-b border-gray-500 
                ${
                  theme === "light"
                    ? "bg-white text-gray-700"
                    : "bg-gray-800/50 text-gray-300"
                }
                dark:after:absolute dark:after:bottom-0 dark:after:h-px dark:after:w-full dark:after:bg-white/10`}
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <MobileMenuButton theme={theme} />

          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <Logo theme={theme} />

            <div className="hidden sm:flex sm:flex-1 sm:justify-center">
              <div className="flex space-x-6">
                <NavLinks
                  navigation={navigation}
                  onLinkClick={handleLinkClick}
                />
              </div>
            </div>
          </div>

          <RightActions
            theme={theme}
            setTheme={setTheme}
            user={user}
            logout={logout}
            navigate={navigate}
            BASE_URL={BASE_URL}
          />
        </div>
      </div>

      <MobileNav navigation={navigation} onLinkClick={handleLinkClick} />
    </Disclosure>
  );
}
