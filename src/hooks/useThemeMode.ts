import { useEffect, useState } from "react";
import type { ThemeMode } from "../playground-config";

const resolveInitialTheme = (): ThemeMode => {
  const storedTheme = window.localStorage.getItem("theme-mode");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeMode = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("theme-mode", themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return {
    themeMode,
    toggleTheme,
  };
};
