"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { forceUnlockBodyScroll } from "../lib/bodyScrollLock";
import {
  afterFirstPaint,
  hasSeenIntro,
  isDesktopViewport,
} from "../lib/introSession";

const Intro = dynamic(() => import("./Intro"), { ssr: false });

/**
 * Desktop-only intro gate (>= 768px).
 * - No Intro chunk on mobile
 * - Skips load if session already saw intro
 * - Defers until idle so Hero H1 can paint first (LCP)
 */
export default function IntroLoader() {
  const [mountIntro, setMountIntro] = useState(false);

  useEffect(() => {
    if (!isDesktopViewport() || hasSeenIntro()) return;

    return afterFirstPaint(() => {
      if (!isDesktopViewport() || hasSeenIntro()) return;
      setMountIntro(true);
    });
  }, []);

  useEffect(() => () => forceUnlockBodyScroll(), []);

  if (!mountIntro) return null;
  return <Intro />;
}
