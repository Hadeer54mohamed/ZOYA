"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const modes = {
  light: {
    label: "Day",
    tagline: "Bright. Clean. Bold.",
    bg: "from-white via-[#fff5fa] to-[#ffe3ee]",
    ring: "ring-black/10",
    glow: "#FF4DA3",
    Icon: Sun,
  },
  dark: {
    label: "Night",
    tagline: "Deep. Moody. Sleek.",
    bg: "from-black via-[#050505] to-[#1a0010]",
    ring: "ring-white/10",
    glow: "#FF4DA3",
    Icon: Moon,
  },
};

export default function InteractiveSection() {
  const { theme, toggleTheme, mounted } = useTheme();
  const current = modes[theme] ?? modes.dark;

  const handleSelect = (next) => {
    if (!mounted || next === theme) return;
    toggleTheme();
  };

  return (
    <section
      className={`relative py-32 overflow-hidden bg-gradient-to-b transition-colors duration-700 ${current.bg}`}
    >
      {/* Dynamic Glow */}
      <motion.div
        key={theme}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute w-[500px] h-[500px] blur-[140px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: current.glow }}
      />

      {/* Floating accent glow */}
      <motion.div
        animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute w-[300px] h-[300px] blur-[120px] rounded-full top-[25%] right-[10%] opacity-20 bg-[#ff7eb6]"
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase mb-4 font-bold"
        >
          ● Live Experience
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-black dark:text-white text-5xl md:text-7xl font-black tracking-tight"
        >
          Choose Your Mode
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-black/60 dark:text-white/50 max-w-xl mx-auto mt-4 text-sm leading-relaxed"
        >
          Flip between Day and Night — the whole store shifts with you.
        </motion.p>

        {/* Mode Toggle Cards */}
        <div className="flex justify-center gap-4 md:gap-6 mt-14 flex-wrap">
          {Object.entries(modes).map(([key, mode]) => {
            const isActive = theme === key;
            const Icon = mode.Icon;
            return (
              <motion.button
                key={key}
                onClick={() => handleSelect(key)}
                whileHover={!isActive ? { scale: 1.04, y: -4 } : {}}
                whileTap={{ scale: 0.97 }}
                aria-pressed={isActive}
                className={`group relative overflow-hidden rounded-3xl px-8 py-6 min-w-[160px] flex flex-col items-center gap-3 border backdrop-blur-xl transition-colors duration-500 ${
                  isActive
                    ? "bg-black dark:bg-white border-transparent shadow-[0_20px_60px_-10px_rgba(255,77,163,0.45)]"
                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-[#FF4DA3]/40"
                }`}
              >
                {/* Active highlight */}
                {isActive && (
                  <motion.div
                    layoutId="mode-highlight"
                    className="absolute inset-0 bg-gradient-to-br from-[#FF4DA3]/25 to-transparent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <div
                  className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-[#FF4DA3] text-black"
                      : "bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/70 group-hover:text-[#FF4DA3]"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={key + (isActive ? "-on" : "")}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon size={20} strokeWidth={1.8} />
                    </motion.span>
                  </AnimatePresence>
                </div>

                <span
                  className={`relative z-10 text-xs font-black uppercase tracking-[0.3em] transition-colors ${
                    isActive
                      ? "text-white dark:text-black"
                      : "text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white"
                  }`}
                >
                  {mode.label}
                </span>

                <span
                  className={`relative z-10 text-[10px] tracking-wide transition-colors ${
                    isActive
                      ? "text-white/60 dark:text-black/60"
                      : "text-black/40 dark:text-white/40"
                  }`}
                >
                  {mode.tagline}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Dynamic Preview */}
        <div className="mt-20 min-h-[120px] flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-black/40 dark:text-white/40">
            Current Mode
          </p>

          <AnimatePresence mode="wait">
            <motion.h3
              key={theme}
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-6xl font-black italic mt-4 text-black dark:text-white"
            >
              {current.label}
            </motion.h3>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`${theme}-tag`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-black/60 dark:text-white/60 text-sm mt-3 tracking-wide"
            >
              {current.tagline}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
