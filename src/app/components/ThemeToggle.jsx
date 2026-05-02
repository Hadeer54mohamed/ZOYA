"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative flex items-center justify-center h-10 w-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30 transition-all active:scale-95 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mounted ? (isDark ? "moon" : "sun") : "init"}
          initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
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
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
