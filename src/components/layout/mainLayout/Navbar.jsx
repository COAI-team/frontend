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
<<<<<<< HEAD
    if (globalThis.window === undefined) return true;
=======
    if (typeof window === "undefined") return true;
>>>>>>> c849fc9 (nav에러 _수정)
    return JSON.parse(localStorage.getItem("walkingMoai") ?? "true");
  });

  useEffect(() => {
    const handler = () => {
      setShowMoai(JSON.parse(localStorage.getItem("walkingMoai") ?? "true"));
    };
<<<<<<< HEAD
    globalThis.addEventListener("storage", handleStorageChange);
    return () => globalThis.removeEventListener("storage", handleStorageChange);
=======
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
>>>>>>> c849fc9 (nav에러 _수정)
  }, []);

  if (!mounted) return null;

  return (
    <Disclosure
      as="nav"
<<<<<<< HEAD
      className="relative z-50 bg-white text-gray-900 border-b border-gray-200 shadow-sm
        dark:bg-[#0a0a0a] dark:text-white dark:border-transparent
        dark:shadow-[0_1px_3px_0_rgba(255,255,255,0.05),0_1px_2px_-1px_rgba(255,255,255,0.03)]"
    >
      {/* Walking Moai Animation */}
      {showMoai && (
        <div className="header-banner-area">
          {/* Snowflakes */}
          {Array.from({ length: 50 }).map((_, i) => {
            const style = {
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              opacity: Math.random(),
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
            };
            return <div key={`snow-${i}`} className="snowflake" style={style} />;
          })}

          {/* Snow Floor */}
          <div className="snow-floor"></div>

          {/* Moai Characters */}
          {Array.from({
            length: Math.max(1, Number.parseInt(localStorage.getItem("moaiCount") ?? "1")),
          }).map((_, i) => {
            const seed = i * 1337;
            const duration = `${15 + (seed % 20)}s`;
            const delay = `${(seed % 15)}s`;
            const key = `moai-${i}`;
            const randomVal = (seed * 9301 + 49297) % 233280 % 100;

            let content = <div className="moai-body text-[40px]">🗿</div>;
            let animationName = "walkAcrossScreen";

            if (randomVal < 5) {
              content = (
                <img
                  src="/assets/images/moai_rudolph.png"
                  alt="Rudolph Moai"
                  className="moai-body h-12.5 w-auto object-contain"
                  style={{ transform: "scaleX(-1)" }}
                />
              );
              animationName = "walkAcrossScreenReverse";
            } else if (randomVal < 15) {
              content = (
                <img
                  src="/assets/images/moai_santa.png"
                  alt="Santa Moai"
                  className="moai-body h-12.5 w-auto object-contain"
                />
              );
            }

            return (
              <div
                key={key}
                className="walking-moai-container"
                style={{
                  "--walk-duration": duration,
                  "--walk-delay": delay,
                  animationName,
                }}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Content */}
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 relative z-20">
        <div className="relative flex h-16 items-center justify-between">
          <MobileMenuButton theme={theme} />

          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <Logo theme={theme} />

            <div className="hidden sm:flex sm:flex-1 sm:justify-center">
              <div className="flex space-x-6">
=======
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
>>>>>>> c849fc9 (nav에러 _수정)
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
