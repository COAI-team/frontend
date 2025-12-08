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
  { name: "코드 분석", href: "/codeAnalysis/new" },
  { name: "코드 분석 (No RAG)", href: "/codeAnalysis/norag" },
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
  const { user, logout, hydrated, accessToken } = useLogin();

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

  // Walking Moai Render State
  // localStorage 접근은 안전하게 try-catch가 없으므로, SSR환경이 아니라고 가정
  const [showMoai, setShowMoai] = useState(() => {
    if (typeof window !== 'undefined') {
       return JSON.parse(localStorage.getItem("walkingMoai") ?? "true");
    }
    return true;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setShowMoai(JSON.parse(localStorage.getItem("walkingMoai") ?? "true"));
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 크리스마스 시즌 체크 (12월)
  const isChristmas = new Date().getMonth() === 11;

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
      {/* 2 & 3. Walking Moai Animation */}
      {/* 2 & 3. Walking Moai Animation */}
      {showMoai && (
        <div className="header-banner-area">
          {Array.from({ length: Math.max(1, parseInt(localStorage.getItem("moaiCount") ?? "1")) }).map((_, i) => {
            // 랜덤 속도 (15s ~ 35s) 및 딜레이 (0s ~ 15s) 계산
            // useMemo를 쓰고 싶지만, 배열 길이가 바뀌면 재계산되어야 하므로 단순화. 
            // 단, 리렌더링 시마다 모아이가 튀는 것을 방지하기 위해 key를 인덱스로 쓰고, 값은 고정된 범위 내에서 랜덤이 좋음.
            // 여기서는 간단히 인덱스를 시드로 사용하여 유사 랜덤 생성
            const seed = i * 1337;
            const duration = 15 + (seed % 20) + "s"; 
            const delay = (seed % 15) + "s";
            
            return (
              <div 
                key={i} 
                className="walking-moai-container"
                style={{
                  "--walk-duration": duration,
                  "--walk-delay": delay
                }}
              >
                <div className={`moai-body ${isChristmas ? 'christmas' : ''}`}>🗿</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 relative z-20">
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
            accessToken={accessToken}
            hydrated={hydrated}
          />
        </div>
      </div>

      <MobileNav navigation={navigation} onLinkClick={handleLinkClick} />
    </Disclosure>
  );
}
