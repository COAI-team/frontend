import { useTheme } from "../context/theme/useTheme";
import { useEffect } from "react";

export function useApplyThemeClass() {
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

    return theme; // 🔥 theme 값을 반환
}