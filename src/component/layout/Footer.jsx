import { FaGithub } from "react-icons/fa";
import { SiNotion } from "react-icons/si";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

export default function Footer() {
    const { theme } = useTheme();

    // ✅ 테마별 스타일 정의
    const footerStyle = theme === "light" ? "bg-gray-200" : "bg-gray-900";
    const textStyle =
        theme === "light" ? "text-gray-700 hover:text-black" : "text-gray-400 hover:text-white";
    const borderStyle = "border-gray-500";

    // ✅ 공통 소셜 링크 데이터
    const socialLinks = [
        { icon: <FaGithub />, url: "https://github.com/CodeNemsy" },
        { icon: <SiNotion />, url: "https://www.notion.so/2929e814015e81c191cbe111381b2ea9?source=copy_link" },
    ];

    return (
        <footer className={`${footerStyle} transition-colors border-t ${borderStyle} py-10`}>
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                {/* 좌측 이름 및 설명 */}
                <div className="text-center md:text-left">
                    <h2 className={`font-bold text-xl ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                        CodeNemsy
                    </h2>
                    <p className="text-sm mt-1 opacity-80">
                        Creating code with purpose and design with passion.
                    </p>
                </div>

                {/* ✅ 소셜 아이콘 렌더링 (중복 제거) */}
                <div className="flex space-x-6 text-2xl">
                    {socialLinks.map((link, index) => (
                        <Link
                            key={index}
                            to={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={textStyle}
                        >
                            {link.icon}
                        </Link>
                    ))}
                </div>
            </div>

            {/* 하단 카피라이트 */}
            <div className={`mt-6 border-t ${borderStyle} pt-4 text-center text-sm ${textStyle}`}>
                {'\u00A9'} {new Date().getFullYear()} CodeNemsy — All rights reserved.
            </div>
        </footer>
    );
}