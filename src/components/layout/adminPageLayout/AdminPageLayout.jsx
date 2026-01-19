import { Outlet } from "react-router-dom";
import AdminPageSideBar from "./AdminPageSideBar";

export default function AdminPageLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-[#131313]">
      <AdminPageSideBar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
