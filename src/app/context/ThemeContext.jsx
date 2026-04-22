"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "zoya-theme";
const COOKIE_KEY = "zoya-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setCookie(name, value) {
  try {
    document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch (_) {}
}

function readCookie(name) {
  try {
    const match = document.cookie.match(
      new RegExp("(^|; )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  } catch (_) {
    return null;
  }
}

export function ThemeProvider({ initialTheme = "dark", children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const fromCookie = readCookie(COOKIE_KEY);
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      const initial =
        fromCookie ||
        fromStorage ||
        (document.documentElement.classList.contains("dark")
          ? "dark"
          : "light");
      setTheme(initial);
    } catch (_) {
      setTheme(initialTheme);
    } finally {
      setMounted(true);
    }
  }, [initialTheme]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
    setCookie(COOKIE_KEY, theme);
  }, [theme, mounted]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "dark", toggleTheme: () => {}, mounted: false };
  }
  return ctx;
};
