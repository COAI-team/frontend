import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./component/layout/Layout";
import Main from "./pages/Main";

// 자유게시판 관련 컴포넌트
import FreeboardList from "./pages/freeboard/FreeboardList";
import FreeboardDetail from "./pages/freeboard/FreeboardDetail";
import FreeboardWrite from "./pages/freeboard/FreeboardWrite";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Main />} />
            <Route path="freeboard/list" element={<FreeboardList />} />
            <Route path="freeboard/write" element={<FreeboardWrite />} />
            <Route path="freeboard/:id" element={<FreeboardDetail />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);