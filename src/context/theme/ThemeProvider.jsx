import { useState, useEffect, useMemo } from 'react';
import { ThemeContext } from './ThemeContext';
import { ThemeContextPropTypes } from "../../utils/propTypes"

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        console.log("💾 저장된 테마:", savedTheme);
        setTheme(savedTheme);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        const body = document.body;

        // 1) html/body 클래스 정리
        root.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');

        root.classList.add(theme);   // html.className = 'dark' or 'light'
        body.classList.add(theme);   // body.className = 'dark' or 'light'

        // 2) data-* 속성 추가 (추가 사용 가능)
        root.dataset.theme = theme;
        root.dataset.mode = theme;

        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    const value = useMemo(
        () => ({ theme, setTheme, mounted }),
        [theme, mounted]
    );

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

ThemeProvider.propTypes = ThemeContextPropTypes;