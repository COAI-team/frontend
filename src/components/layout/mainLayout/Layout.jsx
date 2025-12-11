import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatbotButton from "../../button/ChatbotButton";
import ScrollToTopButton from "../../button/ScrollToTopButton";

export default function Layout() {
    // 모든 훅 제거 - ThemeProvider에서 처리
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
            <ChatbotButton />
        </div>
    );
}
