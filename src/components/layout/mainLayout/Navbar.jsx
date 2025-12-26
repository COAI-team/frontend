import { Disclosure } from "@headlessui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLogin } from "../../../context/login/useLogin";
import { useTheme } from "../../../context/theme/useTheme";
import MobileNav from "../../navbar/MobileNav";
import MobileMenuButton from "../../button/MobileMenuButton";
import Logo from "../../navbar/Logo";
import NavLinks from "../../navbar/NavLinks";
import RightActions from "../../navbar/RightActions";

const initialNavigation = [
  { name: "코드 분석", href: "/codeAnalysis/new" },
  { name: "알고리즘", href: "/algorithm" },
  { name: "1vs1", href: "/battle" },
  { name: "자유게시판", href: "/freeboard" },
  { name: "코드게시판", href: "/codeboard" },
  { name: "결제", href: "/payments" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [navigation, setNavigation] = useState(
    initialNavigation.map((item) => ({ ...item, current: false }))
  );

  const { theme, setTheme } = useTheme();
  const { user, logout, hydrated, accessToken } = useLogin();
  const [mounted, setMounted] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL;

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

  const [showMoai, setShowMoai] = useState(() => {
    if (globalThis.window === undefined) return true;
    return JSON.parse(localStorage.getItem("walkingMoai") ?? "true");
  });

  useEffect(() => {
    const handler = () => {
      setShowMoai(JSON.parse(localStorage.getItem("walkingMoai") ?? "true"));
    };
    globalThis.addEventListener("storage", handler);
    return () => globalThis.removeEventListener("storage", handler);
  }, []);

  if (!mounted) return null;

  return (
    <Disclosure
      as="nav"
      className="relative z-50 bg-white text-gray-900 border-b border-gray-200
      dark:bg-[#0a0a0a] dark:text-white"
    >
      <>
        {/* ===== Moai Banner ===== */}
        {showMoai && (
          <div className="header-banner-area">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={`snow-${i}`}
                className="snowflake"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ===== Navbar ===== */}
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <MobileMenuButton theme={theme} />

            <div className="flex flex-1 items-center justify-center sm:justify-start">
              <Logo theme={theme} />

              <div className="hidden sm:flex sm:flex-1 sm:justify-center">
                <NavLinks
                  navigation={navigation}
                  onLinkClick={handleLinkClick}
                  themeKey={theme}
                />
              </div>
            </div>

            <RightActions
              theme={theme}
              setTheme={setTheme}
              user={user}
              logout={logout}
              navigate={navigate}
              BASE_URL={BASE_URL}
              accessToken={accessToken}
              hydrated={hydrated}
            />
          </div>
        </div>

        {/* ===== Mobile Menu ===== */}
        <MobileNav navigation={navigation} onLinkClick={handleLinkClick} />
      </>
    </Disclosure>
  );
}
