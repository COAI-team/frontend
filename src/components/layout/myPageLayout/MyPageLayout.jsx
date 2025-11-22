import { Outlet } from "react-router-dom";
import MyPageSidebar from "./MyPageSidebar";

export default function MyPageLayout() {
    return (
        <div className="flex">
            <MyPageSidebar />
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
}
