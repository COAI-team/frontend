import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// 레이아웃 및 메인
import Layout from "./components/layout/mainLayout/Layout";
import Main from "./pages/Main";

// 결제 관련
import PricingPage from "./pages/payment/PricingPage";
import PaymentPage from "./pages/payment/PaymentPage";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFail from "./pages/payment/PaymentFail";

// 사용자 관련
import SignIn from "./pages/user/SignIn";
import SignUp from "./pages/user/SignUp";
import LoginProvider from "./context/LoginProvider";
import ResetPasswordPage from "./pages/user/ResetPasswordPage";

// GitHub OAuth Callback
import GitHubCallback from "./pages/social/GitHubCallback";

// 자유게시판
import FreeboardList from "./pages/freeboard/FreeboardList";
import FreeboardDetail from "./pages/freeboard/FreeboardDetail";
import FreeboardWrite from "./pages/freeboard/FreeboardWrite";
import FreeboardEdit from "./pages/freeboard/FreeboardEdit";

// 알고리즘 도메인
import ProblemList from "./pages/algorithm/ProblemList";
import ProblemDetail from "./pages/algorithm/ProblemDetail";
import ProblemGenerator from "./pages/algorithm/ProblemGenerator";
import ProblemSolve from "./pages/algorithm/ProblemSolve";
import SubmissionResult from "./pages/algorithm/SubmissionResult";
import MySubmissions from "./pages/algorithm/MySubmissions";

// 코드 분석 도메인
import CodeAnalysisMain from "./pages/codeAnalysis/CodeAnalysisMain";
import AnalysisPage from "./pages/codeAnalysis/AnalysisPage";
import AnalysisPageWithoutRag from "./pages/codeAnalysis/AnalysisPageWithoutRag";

// 코드게시판
import CodeboardWrite from "./pages/codeboard/CodeboardWrite";
import CodeboardDetail from "./pages/codeboard/CodeboardDetail";

// 마이페이지 레이아웃
import MyPageLayout from "./components/layout/myPageLayout/MyPageLayout";
import ProfilePage from "./pages/myPage/ProfilePage";
import BillingPage from "./pages/myPage/BillingPage";
import DashboardPage from "./pages/myPage/DashboardPage";

//관리자 레이아웃
import AdminPageLayout from "./components/layout/adminPageLayout/AdminPageLayout";
import AdminStatsDashboard from "./pages/admin/AdminStatsDashboard";
import AdminUsers from "./pages/admin/AdminUsers";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <LoginProvider>
            <BrowserRouter>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                >
                    <Routes>
                        {/* GitHub OAuth Callback Route (최상단에 추가됨) */}
                        <Route path="/auth/github/callback" element={<GitHubCallback />} />

                        {/* 옛날 payments 경로 대응 */}
                        <Route
                            path="/payments/*"
                            element={<Navigate to="/pages/payment/pricing" replace />}
                        />

                        {/* 비밀번호 재설정 페이지 */}
                        <Route path="reset-password" element={<ResetPasswordPage />} />
                        {/* 알고리즘 문제풀이 페이지 */}
                        <Route path="algorithm/problems/:problemId/solve" element={<ProblemSolve />}/>

                        {/* 기본 레이아웃 */}
                        <Route path="/" element={<Layout />}>
                            {/* 메인 */}
                            <Route index element={<Main />} />

                            {/* 로그인/회원가입 */}
                            <Route path="signin" element={<SignIn />} />
                            <Route path="signup" element={<SignUp />} />

              {/* 마이페이지 */}
              <Route path="mypage" element={<MyPageLayout />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
              </Route>

                            <Route path="admin" element={<AdminPageLayout />}>
                                <Route index element={<Navigate to="stats" replace />} />
                                <Route path="stats" element={<AdminStatsDashboard />} />
                                <Route path="users" element={<AdminUsers />} />
                            </Route>

                            {/* 자유게시판 */}
                            <Route path="freeboard/list" element={<FreeboardList />} />
                            <Route path="freeboard/write" element={<FreeboardWrite />} />
                            <Route path="freeboard/edit/:id" element={<FreeboardEdit />} />
                            <Route path="freeboard/:id" element={<FreeboardDetail />} />

                            {/* 코드게시판 */}
                            <Route path="codeboard/write" element={<CodeboardWrite />} />
                            <Route path="codeboard/write/:analysisId" element={<CodeboardWrite />} />
                            <Route path="codeboard/:id" element={<CodeboardDetail />} />

                            {/* 결제 */}
                            <Route path="pages/payment/pricing" element={<PricingPage />} />
                            <Route path="pages/payment/buy" element={<PaymentPage />} />
                            <Route
                                path="pages/payment/PaymentSuccess"
                                element={<PaymentSuccess />}
                            />
                            <Route
                                path="pages/payment/PaymentFail"
                                element={<PaymentFail />}
                            />

                            {/* 알고리즘 */}
                            <Route path="algorithm" element={<ProblemList />} />
                            <Route path="algorithm/problems" element={<ProblemList />} />
                            <Route
                                path="algorithm/problems/:problemId"
                                element={<ProblemDetail />}
                            />
                            <Route
                                path="algorithm/problems/generate"
                                element={<ProblemGenerator />}
                            />

              
                            <Route
                                path="algorithm/submissions/:submissionId"
                                element={<SubmissionResult />}
                            />
                            <Route
                                path="algorithm/my-submissions"
                                element={<MySubmissions />}
                            />

                            {/* 코드 분석 (CodeNose) */}
                          <Route path="codeAnalysis" element={<CodeAnalysisMain />} />
                          <Route path="codeAnalysis/new" element={<AnalysisPage />} />
                          <Route path="codeAnalysis/norag" element={<AnalysisPageWithoutRag />} />
                          <Route
                            path="codeAnalysis/:analysisId"
                            element={<AnalysisPage />}
                          />
                          <Route path="codeboard/write" element={<CodeboardWrite />} />
                          <Route path="codeboard/write/:analysisId" element={<CodeboardWrite />} />
                        </Route>

                        {/* 잘못된 경로는 홈으로 */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ThemeProvider>
            </BrowserRouter>
        </LoginProvider>
    </StrictMode>
);