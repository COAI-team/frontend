import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Layout from "./component/layout/Layout";
import Main from "./pages/Main";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<Main />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>
);