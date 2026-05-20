"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { hasSeenIntro, isMobileViewport } from "../lib/introSession";

const IntroLoaderDesktop = dynamic(() => import("./IntroLoaderDesktop"), {
  ssr: false,
});

/**
 * Desktop-only intro gate — mounts after hydration only (safe for SSR).
 */
export default function IntroLoader() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (isMobileViewport() || hasSeenIntro()) return;
    setShowIntro(true);
  }, []);

  if (!showIntro) return null;
  return <IntroLoaderDesktop />;
}
