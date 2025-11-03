import { Outlet } from 'react-router-dom';
import Navbar from '../navbar/Navbar.js';

export default function Layout() {
    return (
        <>
            <Navbar />
            <main>
                <Outlet />
            </main>
        </>
    )
}