import { Outlet } from "react-router-dom";
import Navbar from "../layout/Navbar.js";
import Footer from "../layout/Footer.js";

export default function Layout() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* 상단 고정 Navbar */}
            <Navbar />

            {/* 본문 영역 */}
            <div className="flex flex-1 overflow-hidden pt-16 bg-gray-50">
                {/* Main + Footer 스크롤 영역 */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <main className="flex-1 p-6">
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
