import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Main from "./pages/Main";
import FreeboardList from "./pages/freeboard/FreeboardList";
import FreeboardDetail from "./pages/freeboard/FreeboardDetail";
import FreeboardWrite from "./pages/freeboard/FreeboardWrite";

const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/freeboard" element={<FreeboardList />} />
          <Route path="/freeboard/list" element={<FreeboardList />} />
          <Route path="/freeboard/:id" element={<FreeboardDetail />} />
          <Route path="/freeboard/write" element={<FreeboardWrite />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
