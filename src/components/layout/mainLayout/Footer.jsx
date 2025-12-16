import { memo, useMemo, useCallback } from "react";
import { FaGithub } from "react-icons/fa";
import { SiNotion } from "react-icons/si";
import { Link } from "react-router-dom";
import { useTheme } from "../../../context/theme/useTheme";

const Footer = () => {
  const { theme } = useTheme();

  // ✅ useMemo로 테마별 클래스 메모이제이션
  const footerClasses = useMemo(() => {
    const baseClasses = "transition-colors border-t py-3";
    const themeClass = theme === "light" ? "bg-gray-200" : "bg-gray-900";
    const borderClass = "border-gray-500";
    return `${themeClass} ${baseClasses} ${borderClass}`;
  }, [theme]);

  // ✅ useMemo로 텍스트 스타일
  const textClasses = useMemo(() =>
      theme === "light"
        ? "text-gray-700 hover:text-black"
        : "text-gray-400 hover:text-white",
    [theme]
  );

  // ✅ useMemo로 소셜 링크 (JSX 캐시)
  const socialLinks = useMemo(() => [
    {
      icon: <FaGithub key="github" aria-hidden="true" />,
      url: "https://github.com/CodeNemsy"
    },
    {
      icon: <SiNotion key="notion" aria-hidden="true" />,
      url: "https://www.notion.so/2929e814015e81c191cbe111381b2ea9?source=copy_link"
    },
  ], []);

  // ✅ useCallback으로 핸들러 (Link onClick 필요시)
  const handleSocialClick = useCallback((e, url) => {
    // 외부 링크용 추가 로직 (분석 등)
    window.open(url, '_blank', 'noopener,noreferrer');
    e.preventDefault();
  }, []);

  // ✅ useMemo로 현재 연도
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className={footerClasses} role="contentinfo">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* 좌측 영역 (카피라이트 포함) */}
        <div className="flex items-center h-full text-center md:text-left">
          <div className={`text-sm ${textClasses}`}>
            {'\u00A9'} {currentYear} COAI — All rights reserved.
          </div>
        </div>

        {/* 소셜 아이콘 */}
        <nav aria-label="소셜 미디어 링크" className="flex space-x-6 text-2xl">
          {socialLinks.map(({ icon, url }) => (
            <Link
              key={url} // ✅ URL을 key로 사용 (안정적)
              to={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${textClasses} transition-colors duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full p-1`}
              aria-label={`GitHub에서 ${url.includes('github') ? 'CodeNemsy' : 'Notion 페이지'} 방문`}
              onClick={(e) => handleSocialClick(e, url)}
            >
              {icon}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};

Footer.displayName = 'Footer';

export default memo(Footer);
