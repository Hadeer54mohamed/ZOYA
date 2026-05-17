"use client";

import { useEffect, useRef, useState } from "react";
import { shouldEagerMountSection } from "../lib/navScroll";

/**
 * Renders children only after the block enters the viewport — defers JS/CSS until needed.
 * When `sectionId` is set, the anchor stays in the DOM for hash / nav scrolling.
 */
export default function LazyInView({
  children,
  className = "",
  rootMargin = "200px 0px",
  minHeight = "1px",
  sectionId,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() =>
    shouldEagerMountSection(sectionId),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    if (!sectionId) return;
    const onNav = (e) => {
      if (e.detail?.id === sectionId) setVisible(true);
    };
    window.addEventListener("zoya:section-navigate", onNav);
    return () => window.removeEventListener("zoya:section-navigate", onNav);
  }, [sectionId]);

  const anchorClass = sectionId
    ? `scroll-mt-28 ${className}`.trim()
    : className;

  return (
    <div
      id={sectionId || undefined}
      ref={ref}
      className={anchorClass}
      style={{ minHeight }}
    >
      {visible ? children : null}
    </div>
  );
}
