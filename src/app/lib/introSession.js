export const INTRO_SESSION_KEY = "zoya-intro-seen";
export const DESKTOP_MIN_WIDTH_PX = 768;

export function hasSeenIntro() {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Strict mobile gate — matches layout breakpoint (innerWidth, not matchMedia alone). */
export function isMobileViewport() {
  if (typeof window === "undefined") return true;
  return window.innerWidth < DESKTOP_MIN_WIDTH_PX;
}

export function isDesktopViewport() {
  return !isMobileViewport();
}

/** Defer non-critical work until after first paint (Hero LCP). Desktop only. */
export function afterFirstPaint(callback) {
  if (typeof window === "undefined") return () => {};
  const run = () => callback();
  if ("requestIdleCallback" in window) {
    const id = requestIdleCallback(run, { timeout: 2500 });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 1);
  return () => window.clearTimeout(id);
}
