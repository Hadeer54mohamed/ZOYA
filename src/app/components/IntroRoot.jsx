"use client";

import dynamic from "next/dynamic";

const IntroLoader = dynamic(() => import("./IntroLoader"), { ssr: false });

/** Client boundary for deferred desktop intro (used from root layout). */
export default function IntroRoot() {
  return <IntroLoader />;
}
