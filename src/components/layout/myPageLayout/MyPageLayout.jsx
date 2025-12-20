import { memo, useCallback, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MyPageSidebar from "./MyPageSidebar";
import { useLogin } from "../../../context/login/useLogin";
import AlertModal from "../../modal/AlertModal";

function MyPageLayout() {
  const { auth, hydrated } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  // 단일 useMemo로 경로 계산
  const redirectPath = useMemo(() => {
    const fullPath = `${location.pathname}${location.search || ""}`;
    return fullPath && fullPath !== "/" ? fullPath : "/mypage";
  }, [location]);

  // 안정화된 핸들러
  const handleGoSignin = useCallback(() => {
    navigate("/signin", { replace: true, state: { redirect: redirectPath } });
  }, [navigate, redirectPath]);

  // 인증 상태 미리 계산 (hydrated 체크 포함)
  const isAuthenticated = useMemo(() =>
      hydrated && !!auth?.accessToken,
    [hydrated, auth?.accessToken]
  );

  // 조기 리턴 최적화
  if (!hydrated) return null;

  if (!isAuthenticated) {
    return (
      <AlertModal
        open={true}
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
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default memo(MyPageLayout);
