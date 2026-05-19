export const INTRO_SESSION_KEY = "zoya-intro-seen";
export const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

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

export function isDesktopViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

/** Defer non-critical work until after first paint (Hero LCP). */
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
