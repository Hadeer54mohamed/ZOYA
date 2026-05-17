export const NAV_OFFSET = -100;
export const PENDING_SECTION_KEY = "zoya-nav-section";

const scrollState = {
  generation: 0,
  retryTimer: null,
  settleTimer: null,
  rafId: null,
};

function clearScrollTimers() {
  if (scrollState.retryTimer) clearTimeout(scrollState.retryTimer);
  if (scrollState.settleTimer) clearTimeout(scrollState.settleTimer);
  if (scrollState.rafId) cancelAnimationFrame(scrollState.rafId);
  scrollState.retryTimer = null;
  scrollState.settleTimer = null;
  scrollState.rafId = null;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutQuint(t) {
  return 1 - (1 - t) ** 5;
}

/** Longer on big jumps — feels calmer than a fixed fast duration. */
function durationForDistance(px, { min = 1300, max = 2800, perPx = 0.75 } = {}) {
  return Math.min(max, Math.max(min, min + Math.abs(px) * perPx));
}

function getTargetScrollY(el) {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return el.getBoundingClientRect().top + window.scrollY - margin;
}

/** Custom eased scroll — avoids the hard jump from scrollIntoView + auto snap. */
function animateScrollTo(y, gen, duration = 1400) {
  const startY = window.scrollY;
  const diff = y - startY;
  if (Math.abs(diff) < 2) return;

  if (prefersReducedMotion()) {
    window.scrollTo(0, y);
    return;
  }

  const start = performance.now();

  const tick = (now) => {
    if (gen !== scrollState.generation) return;
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + diff * easeOutQuint(t));
    if (t < 1) {
      scrollState.rafId = requestAnimationFrame(tick);
    }
  };

  scrollState.rafId = requestAnimationFrame(tick);
}

function scrollElementIntoView(el, gen) {
  if (!el) return 0;

  if (prefersReducedMotion()) {
    el.scrollIntoView({ block: "start" });
    return 0;
  }

  const targetY = getTargetScrollY(el);
  const duration = durationForDistance(targetY - window.scrollY);
  animateScrollTo(targetY, gen, duration);
  return duration;
}

/** Gentle nudge if lazy content shifted layout after the main animation. */
function softSettle(id, gen) {
  const el = document.getElementById(id);
  if (!el || gen !== scrollState.generation) return;

  const targetY = getTargetScrollY(el);
  const drift = targetY - window.scrollY;
  if (Math.abs(drift) > 12) {
    const duration = durationForDistance(drift, {
      min: 520,
      max: 950,
      perPx: 0.55,
    });
    animateScrollTo(targetY, gen, duration);
  }
}

/** Parse first section id from hash (fixes malformed `#a#b` URLs). */
export function getHashId() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash;
  if (!hash || hash === "#") return "";
  const first = hash.slice(1).split("#")[0].trim();
  return first ? decodeURIComponent(first) : "";
}

export function shouldEagerMountSection(sectionId) {
  if (!sectionId || typeof window === "undefined") return false;
  if (getHashId() === sectionId) return true;
  try {
    return sessionStorage.getItem(PENDING_SECTION_KEY) === sectionId;
  } catch {
    return false;
  }
}

export function setSectionHash(sectionId) {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "/";
  const next = sectionId ? `${path}#${encodeURIComponent(sectionId)}` : path;
  window.history.replaceState(null, "", next);
}

export function revealSectionForNav(sectionId) {
  if (!sectionId || typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("zoya:section-navigate", { detail: { id: sectionId } }),
  );
}

export function scrollToSection(id, attempt = 0) {
  if (!id || typeof window === "undefined") return;

  const gen = ++scrollState.generation;
  clearScrollTimers();
  revealSectionForNav(id);

  const run = () => {
    if (gen !== scrollState.generation) return;

    const el = document.getElementById(id);
    if (!el) {
      if (attempt < 50) {
        scrollState.retryTimer = setTimeout(
          () => scrollToSection(id, attempt + 1),
          80,
        );
      }
      return;
    }

    const duration = scrollElementIntoView(el, gen);

    if (!prefersReducedMotion()) {
      scrollState.settleTimer = setTimeout(
        () => softSettle(id, gen),
        duration + 120,
      );
    }
  };

  const delay = attempt === 0 ? 100 : 0;
  scrollState.retryTimer = setTimeout(() => {
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, delay);
}

export function queueSectionForHome(sectionId) {
  try {
    sessionStorage.setItem(PENDING_SECTION_KEY, sectionId);
  } catch {
    /* ignore */
  }
}

export function consumePendingSection() {
  try {
    const id = sessionStorage.getItem(PENDING_SECTION_KEY);
    if (id) sessionStorage.removeItem(PENDING_SECTION_KEY);
    return id || "";
  } catch {
    return "";
  }
}

/** Normalize malformed hashes (`#a#b`) and scroll — safe from any page. */
export function navigateToSection(sectionId, pathname, router) {
  if (!sectionId) return;
  if (pathname === "/") {
    setSectionHash(sectionId);
    scrollToSection(sectionId);
    return;
  }
  queueSectionForHome(sectionId);
  router.push("/");
}

export function repairMalformedHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  if (!hash.slice(1).includes("#")) return;
  const id = getHashId();
  if (id) setSectionHash(id);
}
