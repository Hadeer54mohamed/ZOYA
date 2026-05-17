"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function themeAriaLabel(theme) {
  if (theme === "system") {
    return "Theme follows device. Click for light mode.";
  }
  if (theme === "light") {
    return "Light mode. Click for dark mode.";
  }
  return "Dark mode. Click to follow device.";
}

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const iconKey =
    theme === "system" ? "system" : theme === "dark" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={themeAriaLabel(theme)}
      className={`group relative flex items-center justify-center h-10 w-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30 transition-all active:scale-95 ${className}`}
    >
      <span
        key={iconKey}
        className="absolute inset-0 flex items-center justify-center animate-theme-icon"
      >
        {theme === "system" ? (
          <Monitor
            size={15}
            className="text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors"
          />
        ) : theme === "dark" ? (
          <Moon
            size={15}
            className="text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors"
          />
        ) : (
          <Sun
            size={16}
            className="text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors"
          />
        )}
      </span>
    </button>
  );
}
