import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function Layout() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className={`flex flex-col h-screen overflow-hidden`}>
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1">
            <Outlet />
          </main>
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
