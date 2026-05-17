"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  consumePendingSection,
  getHashId,
  repairMalformedHash,
  scrollToSection,
  setSectionHash,
} from "../lib/navScroll";

export default function HashScroller() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    repairMalformedHash();

    let timerId;

    const run = () => {
      const id = consumePendingSection() || getHashId();
      if (!id) return;
      setSectionHash(id);
      scrollToSection(id);
    };

    timerId = window.setTimeout(run, 80);

    const onHashChange = () => {
      if (timerId) window.clearTimeout(timerId);
      repairMalformedHash();
      const id = getHashId();
      if (!id) return;
      setSectionHash(id);
      scrollToSection(id);
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [pathname]);

  return null;
}
