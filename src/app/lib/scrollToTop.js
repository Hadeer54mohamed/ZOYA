/** Force window to the top (used on full route changes). */
export function scrollPageToTop() {
  if (typeof window === "undefined") return;
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = 0;
  }
}

/** Beat browser/Next restoring the previous page scroll position after navigation. */
export function scrollPageToTopReliable() {
  scrollPageToTop();
  const delays = [0, 16, 50, 100, 200, 400, 700, 1000];
  const ids = delays.map((ms) => window.setTimeout(scrollPageToTop, ms));
  requestAnimationFrame(scrollPageToTop);
  requestAnimationFrame(() => requestAnimationFrame(scrollPageToTop));
  return () => ids.forEach((id) => window.clearTimeout(id));
}
