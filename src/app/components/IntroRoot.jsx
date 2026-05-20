"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { hasSeenIntro, isMobileViewport } from "../lib/introSession";

const IntroLoaderDesktop = dynamic(() => import("./IntroLoaderDesktop"), {
  ssr: false,
});

/**
 * Desktop-only intro. SSR + first client paint always null — avoids hydration mismatch
 * from window.innerWidth checks and dynamic(ssr:false) placeholders.
 */
export default function IntroRoot() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (isMobileViewport() || hasSeenIntro()) return;
    setShowIntro(true);
  }, []);

  if (!showIntro) return null;
  return <IntroLoaderDesktop />;
}
