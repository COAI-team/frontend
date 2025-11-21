import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/layout/Layout";
import Main from "./pages/Main";

// 결제 관련
import PricingPage from "./pages/payment/PricingPage.jsx";
import PaymentPage from "./pages/payment/PaymentPage.jsx";
import PaymentSuccess from "./pages/payment/PaymentSuccess.jsx";
import PaymentFail from "./pages/payment/PaymentFail.jsx";


// 사용자 관련 컴포넌트
import SignIn from "./pages/user/SignIn";
import SignUp from "./pages/user/SignUp";

// 자유게시판 관련 컴포넌트
import FreeboardList from "./pages/freeboard/FreeboardList";
import FreeboardDetail from "./pages/freeboard/FreeboardDetail";
import FreeboardWrite from "./pages/freeboard/FreeboardWrite";

import { LoginProvider } from "./context/LoginContext.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <Routes>
          {/* 🔹 옛날 /payments 또는 /payments/... 로 들어오는 모든 경로 처리 */}
          <Route
            path="/payments/*"
            element={<Navigate to="/pages/payment/pricing" replace />}
          />

          {/* 🔹 기본 레이아웃 아래 라우트들 */}
          <Route path="/" element={<Layout />}>
            {/* 메인 */}
            <Route index element={<Main />} />

            {/* 자유게시판 */}
            <Route path="freeboard/list" element={<FreeboardList />} />
            <Route path="freeboard/write" element={<FreeboardWrite />} />
            <Route path="freeboard/:id" element={<FreeboardDetail />} />

            {/* 결제 */}
            <Route path="pages/payment/pricing" element={<PricingPage />} />
            <Route path="pages/payment/buy" element={<PaymentPage />} />
            <Route path="pages/payment/PaymentSuccess" element={<PaymentSuccess />} />
            <Route path="pages/payment/PaymentFail" element={<PaymentFail />} />
          </Route>

          {/* 🔹 혹시 모를 나머지 이상한 경로는 전부 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
