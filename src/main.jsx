import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {ThemeProvider} from "next-themes";

// 레이아웃 및 메인
import Layout from "./components/layout/mainLayout/Layout";
import Main from "./pages/Main";

// 결제 관련
import PricingPage from "./pages/payment/PricingPage.jsx";
import PaymentPage from "./pages/payment/PaymentPage.jsx";
import PaymentSuccess from "./pages/payment/PaymentSuccess.jsx";
import PaymentFail from "./pages/payment/PaymentFail.jsx";

// 사용자 관련
import SignIn from "./pages/user/SignIn";
import SignUp from "./pages/user/SignUp";
import {LoginProvider} from "./context/LoginContext.js";

// 자유게시판
import FreeboardList from "./pages/freeboard/FreeboardList";
import FreeboardDetail from "./pages/freeboard/FreeboardDetail";
import FreeboardWrite from "./pages/freeboard/FreeboardWrite";

// 알고리즘 도메인
import ProblemList from "./pages/algorithm/ProblemList";
import ProblemGenerator from "./pages/algorithm/ProblemGenerator";
import ProblemSolve from "./pages/algorithm/ProblemSolve";
import SubmissionResult from "./pages/algorithm/SubmissionResult";

// 마이페이지 레이아웃
import MyPageLayout from "./components/layout/myPageLayout/MyPageLayout";
import ProfilePage from "./pages/mypage/ProfilePage";

//관리자 레이아웃
import AdminPageLayout from "./components/layout/adminPageLayout/AdminPageLayout";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <LoginProvider>
            <BrowserRouter>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                    <Routes>

                        {/* 옛날 payments 경로 대응 */}
                        <Route
                            path="/payments/*"
                            element={<Navigate to="/pages/payment/pricing" replace/>}
                        />

                        {/* 기본 레이아웃 */}
                        <Route path="/" element={<Layout/>}>

                            {/* 메인 */}
                            <Route index element={<Main/>}/>

                            {/* 로그인/회원가입 */}
                            <Route path="signin" element={<SignIn/>}/>
                            <Route path="signup" element={<SignUp/>}/>

                            {/* 마이페이지 */}
                            <Route path="mypage" element={<MyPageLayout/>}>
                                <Route index element={<Navigate to="profile" replace />} />
                                <Route path="profile" element={<ProfilePage/>} />
                            </Route>

                            <Route path="admin" element={<AdminPageLayout/>}>
                            </Route>

                            {/* 자유게시판 */}
                            <Route path="freeboard/list" element={<FreeboardList/>}/>
                            <Route path="freeboard/write" element={<FreeboardWrite/>}/>
                            <Route path="freeboard/:id" element={<FreeboardDetail/>}/>

                            {/* 결제 */}
                            <Route path="pages/payment/pricing" element={<PricingPage/>}/>
                            <Route path="pages/payment/buy" element={<PaymentPage/>}/>
                            <Route path="pages/payment/PaymentSuccess" element={<PaymentSuccess/>}/>
                            <Route path="pages/payment/PaymentFail" element={<PaymentFail/>}/>

                            {/* 알고리즘 */}
                            <Route path="algorithm" element={<ProblemList/>}/>
                            <Route path="algorithm/problems" element={<ProblemList/>}/>
                            <Route path="algorithm/problems/generate" element={<ProblemGenerator/>}/>
                            <Route path="algorithm/problems/:problemId/solve" element={<ProblemSolve/>}/>
                            <Route path="algorithm/submissions/:submissionId" element={<SubmissionResult/>}/>

                        </Route>

                        {/* 잘못된 경로는 홈으로 */}
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Routes>
                </ThemeProvider>
            </BrowserRouter>
        </LoginProvider>
    </StrictMode>
);