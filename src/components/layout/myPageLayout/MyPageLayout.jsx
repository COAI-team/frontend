import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import MyPageSidebar from "./MyPageSidebar";
import { useLogin } from "../../../context/useLogin";
import AlertModal from "../../modal/AlertModal";

export default function MyPageLayout() {
    const { auth, hydrated } = useLogin();
    const navigate = useNavigate();
    const location = useLocation();
    const [modalOpen, setModalOpen] = useState(false);

    const redirectPath = useMemo(() => {
        const fullPath = `${location.pathname}${location.search || ""}`;
        return fullPath && fullPath !== "/" ? fullPath : "/mypage";
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (!hydrated) return;
        if (!auth?.accessToken) {
            setModalOpen(true);
        }
    }, [hydrated, auth]);

    const handleGoSignin = () => {
        navigate("/signin", { replace: true, state: { redirect: redirectPath } });
    };

    if (!hydrated) return null;

    if (!auth?.accessToken) {
        return (
            <AlertModal
                open={modalOpen}
                onClose={handleGoSignin}
                onConfirm={handleGoSignin}
                type="warning"
                title="로그인이 필요합니다"
                message="마이페이지는 로그인 후 이용 가능합니다. 로그인 화면으로 이동합니다."
                confirmText="로그인하기"
            />
        );
    }

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
