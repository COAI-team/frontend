import {createRoot} from "react-dom/client";
import "./index.css";
import {ThemeProvider} from "./context/theme/ThemeProvider";
import LoginProvider from "./context/login/LoginProvider";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/next"
// 레이아웃 및 메인
import Layout from "./components/layout/mainLayout/Layout";
import Main from "./pages/Main";
import PricingPage from "./pages/payment/PricingPage";
import PaymentPage from "./pages/payment/PaymentPage";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFail from "./pages/payment/PaymentFail";

// 사용자 관련
import SignIn from "./pages/user/SignIn";
import SignUp from "./pages/user/SignUp";
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
import ProblemLearn from "./pages/algorithm/ProblemLearn";
import SubmissionResult from "./pages/algorithm/SubmissionResult";
import MySubmissions from "./pages/algorithm/MySubmissions";
import AlgorithmTutorial from "./pages/algorithm/AlgorithmTutorial";
import AlgorithmTutorial2 from "./pages/algorithm/AlgorithmTutorial2";
import AlgorithmTutorial3 from "./pages/algorithm/AlgorithmTutorial3";
import AlgorithmTutorialGenerator from "./pages/algorithm/AlgorithmTutorialGenerator";
import AlgorithmTutorialMode from "./pages/algorithm/AlgorithmTutorialMode";
import AlgorithmTutorialSolve from "./pages/algorithm/AlgorithmTutorialSolve";
import AlgorithmTutorialResult from "./pages/algorithm/AlgorithmTutorialResult";
import DailyMission from "./pages/myPage/DailyMission";

// 코드 분석 도메인
import CodeAnalysisMain from "./pages/codeAnalysis/CodeAnalysisMain";
import AnalysisPage from "./pages/codeAnalysis/AnalysisPage";
import MistakeReportPage from "./pages/myPage/MistakeReportPage";

import CodeAnalysisTutorial3 from "./pages/codeAnalysis/CodeAnalysisTutorial3";

// 코드게시판
import CodeboardList from "./pages/codeboard/CodeboardList";
import CodeboardDetail from "./pages/codeboard/CodeboardDetail";
import CodeboardWrite from "./pages/codeboard/CodeboardWrite";
import CodeboardEdit from "./pages/codeboard/CodeboardEdit";

// 마이페이지 레이아웃
import MyPageLayout from "./components/layout/myPageLayout/MyPageLayout";
import ProfilePage from "./pages/myPage/ProfilePage";
import BillingPage from "./pages/myPage/BillingPage";
import DashboardPage from "./pages/myPage/DashboardPage";

//관리자 레이아웃
import AdminPageLayout from "./components/layout/adminPageLayout/AdminPageLayout";
import AdminStatsDashboard from "./pages/admin/AdminStatsDashboard";
import AdminBatchTestDashboard from "./pages/admin/AdminBatchTestDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserBoards from "./pages/admin/AdminUserBoards";
import AdminLogs from "./pages/admin/AdminLogs";

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <LoginProvider>
      <BrowserRouter>
        <SpeedInsights />
        <Analytics/>
        <Routes>
          {/* GitHub OAuth Callback (레이아웃 없이) */}
          <Route path="/auth/github/callback" element={<GitHubCallback/>}/>

          {/* 옛날 payments 경로 대응 */}
          <Route path="/payments/*" element={<Navigate to="/pricing" replace/>}/>

          {/* 비밀번호 재설정 페이지 */}
          <Route path="reset-password" element={<ResetPasswordPage/>}/>
          {/* 알고리즘 문제풀이 페이지 */}
          <Route path="algorithm/problems/:problemId/solve" element={<ProblemSolve/>}/>
          <Route path="algorithm/problems/:problemId/learn" element={<ProblemLearn/>}/>

          {/* 기본 레이아웃 */}
          <Route path="/" element={<Layout/>}>
            {/* 메인 */}
            <Route index element={<Main/>}/>

            {/* 로그인/회원가입 */}
            <Route path="signin" element={<SignIn/>}/>
            <Route path="signup" element={<SignUp/>}/>

            {/* 마이페이지 */}
            <Route path="mypage" element={<MyPageLayout/>}>
              <Route index element={<Navigate to="profile" replace/>}/>
              <Route path="profile" element={<ProfilePage/>}/>
              <Route path="billing" element={<BillingPage/>}/>
              <Route path="dashboard" element={<DashboardPage/>}/>
              <Route path="daily-mission" element={<DailyMission/>}/>
              <Route path="algo-history" element={<MySubmissions/>}/>
            </Route>

            {/* 관리자 */}
            <Route path="admin" element={<AdminPageLayout/>}>
              <Route index element={<Navigate to="stats" replace/>}/>
              <Route path="stats" element={<AdminStatsDashboard/>}/>
              <Route path="users" element={<AdminUsers/>}/>
              <Route path="userboards" element={<AdminUserBoards/>}/>
            </Route>

            {/* 자유게시판 - 리스트를 레이아웃으로 */}
            <Route path="freeboard" element={<FreeboardList/>}/>
            <Route path="freeboard/write" element={<FreeboardWrite/>}/>
            <Route path="freeboard/edit/:id" element={<FreeboardEdit/>}/>
            <Route path="freeboard/:id" element={<FreeboardDetail/>}/>

            {/* 코드게시판 - 리스트를 레이아웃으로 */}
            <Route path="codeboard" element={<CodeboardList/>}/>
            <Route path="codeboard/write/:analysisId" element={<CodeboardWrite/>}/>
            <Route path="codeboard/edit/:id" element={<CodeboardEdit/>}/>
            <Route path="codeboard/:id" element={<CodeboardDetail/>}/>

            {/* 결제 */}
            <Route path="pricing" element={<PricingPage/>}/>
            <Route path="buy" element={<PaymentPage/>}/>
            <Route path="payment/success" element={<PaymentSuccess/>}/>
            <Route path="payment/fail" element={<PaymentFail/>}/>

            {/* 알고리즘 튜토리얼 */}
            <Route path="tutorial" element={<AlgorithmTutorial/>}/>
            <Route path="tutorial2" element={<AlgorithmTutorial2/>}/>
            <Route path="tutorial3" element={<AlgorithmTutorial3/>}/>
            <Route path="algorithm/tutorial/generator" element={<AlgorithmTutorialGenerator/>}/>
            <Route path="algorithm/tutorial/mode" element={<AlgorithmTutorialMode/>}/>
            <Route path="algorithm/tutorial/solve" element={<AlgorithmTutorialSolve/>}/>
            <Route path="algorithm/tutorial/result" element={<AlgorithmTutorialResult/>}/>

            {/* 알고리즘 */}
            <Route path="algorithm" element={<ProblemList/>}/>
            <Route path="algorithm/problems" element={<ProblemList/>}/>
            <Route path="algorithm/problems/:problemId" element={<ProblemDetail/>}/>
            <Route path="algorithm/problems/generate" element={<ProblemGenerator/>}/>
            <Route path="algorithm/submissions/:submissionId" element={<SubmissionResult/>}/>
            <Route path="algorithm/my-submissions" element={<MySubmissions/>}/>

            {/* 코드 분석 (CodeNose) */}
            <Route path="codeAnalysis" element={<CodeAnalysisMain/>}/>
            <Route path="codeAnalysis/new" element={<AnalysisPage/>}/>
            <Route path="codeAnalysis/:analysisId" element={<AnalysisPage/>}/>
            

            <Route path="codeAnalysis/tutorial3" element={<CodeAnalysisTutorial3/>}/>

            {/* 멘탈 케어 (Repetitive Mistake Report) */}
            <Route path="mistake-report" element={<MistakeReportPage/>}/>
          </Route>

          {/* 잘못된 경로는 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </LoginProvider>
  </ThemeProvider>
);
