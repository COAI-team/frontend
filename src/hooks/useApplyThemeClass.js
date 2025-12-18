import {useTheme} from "../context/theme/useTheme";
import {useEffect} from "react";

export function useApplyThemeClass() {
  const {theme} = useTheme();

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    if (theme === "dark") {
      htmlElement.classList.add("dark");
      bodyElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
      bodyElement.classList.remove("dark");
    }
  }, [theme]);

  return theme;
}
