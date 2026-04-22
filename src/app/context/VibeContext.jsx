"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Central vibe registry — used across the whole app.
export const vibes = {
  street: {
    label: "Street",
    tagline: "Raw. Real. Relentless.",
    heroLine: "Wear Your Identity",
    color: "#FF4DA3",
    colorSoft: "#ff7eb6",
    bg: "from-[#050505] via-[#0a0005] to-[#1a0010]",
    bgLight: "from-white via-[#fff5fa] to-[#ffe3ee]",
    drop: "Drop 01 // SS'26",
  },
  dark: {
    label: "Dark",
    tagline: "Silence speaks volumes.",
    heroLine: "Into the Shadow",
    color: "#ffffff",
    colorSoft: "#b0b0b0",
    bg: "from-black via-[#050505] to-black",
    bgLight: "from-white via-[#f5f5f5] to-[#eeeeee]",
    drop: "Noir Capsule",
  },
  neon: {
    label: "Neon",
    tagline: "Future is loud.",
    heroLine: "Glow Different",
    color: "#00FFF0",
    colorSoft: "#7afff5",
    bg: "from-black via-[#001a1a] to-black",
    bgLight: "from-white via-[#e6ffff] to-[#b8feff]",
    drop: "Cyber Drop",
  },
};

export const vibeKeys = Object.keys(vibes);

const STORAGE_KEY = "zoya_vibe";
const VibeContext = createContext(null);

export function VibeProvider({ children }) {
  const [vibe, setVibe] = useState("street");
  const [transitioning, setTransitioning] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && vibes[saved]) setVibe(saved);
    } catch {}
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, vibe);
    } catch {}
  }, [vibe, hydrated]);

  // Cinematic switch: overlay covers screen, THEN vibe changes under it, THEN overlay exits.
  const changeVibe = useCallback(
    (next) => {
      if (!vibes[next] || next === vibe || transitioning) return;
      setTransitioning(true);

      // swap the vibe while overlay is fully covering the screen
      window.setTimeout(() => {
        setVibe(next);
      }, 450);

      // end transition after overlay exits
      window.setTimeout(() => {
        setTransitioning(false);
      }, 1100);
    },
    [vibe, transitioning]
  );

  const currentVibe = vibes[vibe];

  const value = {
    vibe,
    setVibe: changeVibe,
    changeVibe,
    currentVibe,
    vibes,
    vibeKeys,
    transitioning,
    hydrated,
  };

  return <VibeContext.Provider value={value}>{children}</VibeContext.Provider>;
}

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) {
    throw new Error("useVibe must be used inside <VibeProvider>");
  }
  return ctx;
}
