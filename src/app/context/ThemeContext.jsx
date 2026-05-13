"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "zoya-theme";
const COOKIE_KEY = "zoya-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function normalizePreference(value) {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

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

function computeResolved(theme, systemDark) {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return systemDark ? "dark" : "light";
}

export function ThemeProvider({ initialTheme = "system", children }) {
  const [theme, setTheme] = useState(() => normalizePreference(initialTheme));
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    let stored = null;
    try {
      stored = readCookie(COOKIE_KEY) || localStorage.getItem(STORAGE_KEY);
    } catch (_) {}
    setTheme(normalizePreference(stored || initialTheme));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    setMounted(true);

    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [initialTheme]);

  const resolvedTheme = useMemo(
    () => computeResolved(theme, systemDark),
    [theme, systemDark]
  );

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
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
  }, [theme, resolvedTheme, mounted]);

  const toggleTheme = () =>
    setTheme((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, toggleTheme, mounted }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system",
      resolvedTheme: "light",
      toggleTheme: () => {},
      mounted: false,
    };
  }
  return ctx;
};
