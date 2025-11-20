import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/layout/Layout";
import Main from "./pages/Main";

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
            <LoginProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout/>}>
                            <Route index element={<Main/>}/>

                            {/* 사용자 관련 라우트 */}
                            <Route path="signin" element={<SignIn/>}/>
                            <Route path="signup" element={<SignUp/>}/>

                            {/* 자유게시판 라우트 */}
                            <Route path="freeboard/list" element={<FreeboardList/>}/>
                            <Route path="freeboard/write" element={<FreeboardWrite/>}/>
                            <Route path="freeboard/:id" element={<FreeboardDetail/>}/>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </LoginProvider>
        </ThemeProvider>
    </StrictMode>
);