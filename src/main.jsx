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

// 알고리즘 도메인 컴포넌트
import ProblemList from "./pages/algorithm/ProblemList";
import ProblemGenerator from "./pages/algorithm/ProblemGenerator";
import ProblemSolve from "./pages/algorithm/ProblemSolve"; 
import SubmissionResult from "./pages/algorithm/SubmissionResult";  

import { LoginProvider } from "./context/LoginContext.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* ThemeProvider는 앱 전체의 루트에 있어야 한다 */}
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <BrowserRouter>
        <LoginProvider>
          <Routes>

            <Route
              path="/payments/*"
              element={<Navigate to="/pages/payment/pricing" replace />}
            />

            <Route path="/" element={<Layout />}>
              <Route index element={<Main />} />

              {/* 결제 */}
              <Route path="pages/payment/pricing" element={<PricingPage />} />
              <Route path="pages/payment/buy" element={<PaymentPage />} />
              <Route path="pages/payment/PaymentSuccess" element={<PaymentSuccess />} />
              <Route path="pages/payment/PaymentFail" element={<PaymentFail />} />

              {/* 알고리즘 */}
              <Route path="algorithm" element={<ProblemList />} />
              <Route path="algorithm/problems" element={<ProblemList />} />
              <Route path="algorithm/problems/generate" element={<ProblemGenerator />} />
              {/* 알고리즘 문제 상세페이지(임시) */}
              <Route path="algorithm/problems/:id" element={<ProblemSolve/>}/>
              <Route path="algorithm/problems/:problemId/solve" element={<ProblemSolve />} />
              <Route path="algorithm/submissions/:submissionId" element={<SubmissionResult />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </LoginProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
