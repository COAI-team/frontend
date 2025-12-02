import { Outlet } from "react-router-dom";
import MyPageSidebar from "./MyPageSidebar";

export default function MyPageLayout() {
    return (
        <div className="flex min-h-screen">
            <MyPageSidebar />

            {/* 오른쪽: 스크롤 가능한 영역 */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}