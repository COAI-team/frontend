import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function Layout() {
    const { theme } = useTheme();

    useEffect(() => {
        if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        }
    }, [theme]);

    let layoutBg = "";
    if (theme === "light") {
        layoutBg = "text-black"; // 밝을 때: 연한 배경 + 어두운 텍스트
    } else {
        layoutBg = "text-white"; // 어두울 때: 짙은 배경 + 밝은 텍스트
    }

    return (
        <div className={`flex flex-col h-screen overflow-hidden transition-colors ${layoutBg}`}>
            {/* 상단 고정 Navbar */}
            <Navbar />

            {/* 본문 영역 */}
            <div className="flex flex-1 overflow-hidden">
                {/* Main + Footer 스크롤 영역 */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <main className="flex-1">
                        {/*본문(WriteEditor) 콘텐츠를 화면 중앙에 고정하기 위한 Wrapper*/}
                        <div className="max-w-[900px] mx-auto px-6 pt-10 pb-20"></div>
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}