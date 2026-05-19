"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hasPendingSection } from "../lib/navScroll";
import { scrollPageToTop, scrollPageToTopReliable } from "../lib/scrollToTop";

function shouldResetScroll(pathname) {
  if (pathname === "/") {
    return !(
      typeof window !== "undefined" &&
      (window.location.hash || hasPendingSection())
    );
  }
  return true;
}

export default function ScrollToTopOnLoad() {
  const pathname = usePathname();
  const prevPathRef = useRef(null);
  const cancelReliableRef = useRef(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (prevPathRef.current === pathname) return;
    if (shouldResetScroll(pathname)) {
      scrollPageToTop();
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prevPathRef.current === pathname) return;

    prevPathRef.current = pathname;
    cancelReliableRef.current?.();
    cancelReliableRef.current = null;

    if (shouldResetScroll(pathname)) {
      cancelReliableRef.current = scrollPageToTopReliable();
    }

    return () => {
      cancelReliableRef.current?.();
      cancelReliableRef.current = null;
    };
  }, [pathname]);

  return null;
}
