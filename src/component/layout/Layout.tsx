import { Outlet } from "react-router-dom";
import Navbar from "../layout/Navbar.js";
import Footer from "../layout/Footer.js";
import { useTheme } from "next-themes";

export default function Layout() {
    const { theme } = useTheme();

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
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}