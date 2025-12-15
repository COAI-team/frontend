import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatbotButton from "../../button/ChatbotButton";
import ScrollToTopButton from "../../button/ScrollToTopButton";

export default function Layout() {
    const { pathname } = useLocation();

    // 챗봇을 노출할 경로만 true
    const showChatbot =
        pathname === "/" ||                    // 메인/온보딩
        pathname.startsWith("/pricing") ||     // 요금제
        pathname.startsWith("/buy") ||         // 결제
        pathname.startsWith("/mypage") ||      // 마이페이지
        pathname.startsWith("/admin");         // 관리자

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-y-auto" id="scrollArea">
                    <main className="flex-1">
                        <div className="mx-auto px-6"></div>
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
            <ScrollToTopButton />
            {showChatbot && <ChatbotButton />}
        </div>
    );
}