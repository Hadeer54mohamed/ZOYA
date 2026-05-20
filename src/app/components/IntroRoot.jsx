"use client";

import dynamic from "next/dynamic";
import { isMobileViewport } from "../lib/introSession";

const IntroLoader = dynamic(() => import("./IntroLoader"), { ssr: false });

/**
 * Client boundary for deferred desktop intro (root layout).
 * Mobile: never loads IntroLoader chunk — avoids idle-callback race on iOS Safari.
 */
export default function IntroRoot() {
  if (isMobileViewport()) return null;
  return <IntroLoader />;
}
