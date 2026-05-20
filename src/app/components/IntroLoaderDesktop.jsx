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
 * Loaded only when IntroRoot passes the mobile guard.
 */
export default function IntroLoaderDesktop() {
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
