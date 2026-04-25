"use client";

import { useEffect } from "react";

const NAV_OFFSET = -100;

export default function HashScroller() {
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (!hash) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (!el) return;
      const y =
        el.getBoundingClientRect().top + window.pageYOffset + NAV_OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
