import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { ThemeContextPropTypes } from "../../utils/propTypes";

// 상수 및 캐싱
const THEME_KEY = 'theme';
const DEFAULT_THEME = 'light';
const VALID_THEMES = new Set(['light', 'dark']); // Set 사용

// DOM 요소 캐싱
const getRootElements = (() => {
  let cachedRoot = null;
  let cachedBody = null;
  return () => {
    if (!cachedRoot) cachedRoot = document.documentElement;
    if (!cachedBody) cachedBody = document.body;
    return { root: cachedRoot, body: cachedBody };
  };
})();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);
  const themeRef = useRef(theme);

  // 초기 테마 로드 ✅ .has() 사용
  const loadTheme = useCallback(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const validTheme = VALID_THEMES.has(savedTheme) ? savedTheme : DEFAULT_THEME; // ✅ includes → has
    themeRef.current = validTheme;
    setTheme(validTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  // 테마 적용 최적화
  useEffect(() => {
    if (!mounted) return;

    const rafId = requestAnimationFrame(() => {
      const { root, body } = getRootElements();

      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');
      root.classList.add(theme);
      body.classList.add(theme);

      root.dataset.theme = theme;
      root.dataset.mode = theme;

      localStorage.setItem(THEME_KEY, theme);
    });

    return () => cancelAnimationFrame(rafId);
  }, [theme, mounted]);

  // 안정화된 setTheme 함수 ✅ .has() 사용
  const stableSetTheme = useCallback((newTheme) => {
    const validTheme = VALID_THEMES.has(newTheme) ? newTheme : DEFAULT_THEME; // ✅ includes → has
    themeRef.current = validTheme;
    setTheme(validTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme: stableSetTheme, mounted }),
    [theme, stableSetTheme, mounted]
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
