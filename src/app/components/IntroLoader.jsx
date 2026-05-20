"use client";

import { isMobileViewport } from "../lib/introSession";
import IntroLoaderDesktop from "./IntroLoaderDesktop";

/**
 * Desktop-only intro — mobile bails out before any effects or idle callbacks run.
 */
export default function IntroLoader() {
  if (isMobileViewport()) return null;
  return <IntroLoaderDesktop />;
}
