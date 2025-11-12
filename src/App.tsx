import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import FreeboardList from "./pages/freeboard/FreeboardList";
import FreeboardDetail from "./pages/freeboard/FreeboardDetail";
import FreeboardWrite from "./pages/freeboard/FreeboardWrite";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/freeboard" element={<FreeboardList />} />
        <Route path="/freeboard/list" element={<FreeboardList />} />
        <Route path="/freeboard/:id" element={<FreeboardDetail />} />
        <Route path="/freeboard/write" element={<FreeboardWrite />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
