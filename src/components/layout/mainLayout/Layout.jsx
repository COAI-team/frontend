import {Outlet} from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

import { useApplyThemeClass } from "../../../hooks/useApplyThemeClass";

export default function Layout() {
    useApplyThemeClass();
    return (
        <div className={`flex flex-col h-screen overflow-hidden`}>
            <Navbar/>
            {/* 본문 영역 */}
            <div className="flex flex-1 overflow-hidden">
                {/* Main + Footer 스크롤 영역 */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <main className="flex-1">
                        {/*본문(WriteEditor) 콘텐츠를 화면 중앙에 고정하기 위한 Wrapper*/}
                        <div className="mx-auto px-6"></div>
                        <Outlet/>
                    </main>
                    <Footer/>
                </div>
            </div>
        </div>
    );
}