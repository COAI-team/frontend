import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

import { useApplyThemeClass } from "../../../hooks/useApplyThemeClass";
import ChatbotButton from "../../button/ChatbotButton";
import ScrollToTopButton from "../../button/ScrollToTopButton";

export default function Layout() {
    useApplyThemeClass();

    return (
        <div className={`flex flex-col h-screen overflow-hidden`}>
            <Navbar/>

            {/* 본문 영역 */}
            <div className="flex flex-1 overflow-hidden">
                {/* Main + Footer 스크롤 영역 */}
                <div className="flex-1 flex flex-col overflow-y-auto" id="scrollArea">
                    <main className="flex-1">
                        {/* 본문 콘텐츠 Wrapper */}
                        <div className="mx-auto px-6"></div>
                        <Outlet/>
                    </main>

                    <Footer/>
                </div>
            </div>

            <ScrollToTopButton />
            <ChatbotButton />
        </div>
    );
}