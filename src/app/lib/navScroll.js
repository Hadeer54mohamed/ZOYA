export const NAV_OFFSET = -100;
export const PENDING_SECTION_KEY = "zoya-nav-section";

const scrollState = {
  generation: 0,
  targetId: "",
  retryTimer: null,
  rafId: null,
};

function clearScrollTimers() {
  if (scrollState.retryTimer) clearTimeout(scrollState.retryTimer);
  if (scrollState.rafId) cancelAnimationFrame(scrollState.rafId);
  scrollState.retryTimer = null;
  scrollState.rafId = null;
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/** ~0.9–1.8s depending on distance — visible smooth, not too slow. */
function durationForDistance(px) {
  const abs = Math.abs(px);
  return Math.min(1800, Math.max(900, 700 + abs * 0.45));
}

function getTargetScrollY(el) {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - margin);
}

function animateScrollTo(y, gen, duration) {
  const startY = window.scrollY;
  const diff = y - startY;
  if (Math.abs(diff) < 3) return;

  const start = performance.now();

  const tick = (now) => {
    if (gen !== scrollState.generation) return;
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + diff * easeOutCubic(t));
    if (t < 1) scrollState.rafId = requestAnimationFrame(tick);
  };

  scrollState.rafId = requestAnimationFrame(tick);
}

function jumpToSection(id) {
  if (id === "home") {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: getTargetScrollY(el), left: 0, behavior: "instant" });
}

/**
 * Wait until lazy sections finish mounting so we scroll once to the right Y.
 */
function whenTargetStable(id, gen, callback, attempt = 0) {
  const el = document.getElementById(id);
  if (!el) {
    if (attempt < 30) {
      scrollState.rafId = requestAnimationFrame(() =>
        whenTargetStable(id, gen, callback, attempt + 1),
      );
    }
    return;
  }

  const y = getTargetScrollY(el);
  if (attempt === 0) {
    scrollState._probeY = y;
    scrollState._stable = 0;
  }

  if (Math.abs(y - scrollState._probeY) < 3) {
    scrollState._stable += 1;
  } else {
    scrollState._probeY = y;
    scrollState._stable = 0;
  }

  if (scrollState._stable >= 2 || attempt >= 24) {
    callback(y);
    return;
  }

  scrollState.rafId = requestAnimationFrame(() =>
    whenTargetStable(id, gen, callback, attempt + 1),
  );
}

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
  if (sectionId === "reels" && getHashId() === "contact") return true;
  try {
    const pending = sessionStorage.getItem(PENDING_SECTION_KEY);
    if (pending === sectionId) return true;
    if (sectionId === "reels" && pending === "contact") return true;
  } catch {
    return false;
  }
  return false;
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
  if (sectionId === "contact") {
    window.dispatchEvent(
      new CustomEvent("zoya:section-navigate", { detail: { id: "reels" } }),
    );
  }
}

/**
 * Smooth scroll to a home section. Pass { instant: true } only for hash repair.
 */
export function scrollToSection(id, attempt = 0, options = {}) {
  if (!id || typeof window === "undefined") return;

  const smooth = options.instant !== true;
  const isNewTarget = scrollState.targetId !== id || options.instant;

  if (isNewTarget) {
    scrollState.generation += 1;
    scrollState.targetId = id;
    scrollState._probeY = null;
    scrollState._stable = 0;
    clearScrollTimers();
  }

  const gen = scrollState.generation;
  revealSectionForNav(id);

  if (!smooth) {
    jumpToSection(id);
    return;
  }

  whenTargetStable(id, gen, (targetY) => {
    if (gen !== scrollState.generation) return;
    const el = document.getElementById(id);
    if (!el) {
      if (attempt < 20) {
        scrollState.retryTimer = setTimeout(
          () => scrollToSection(id, attempt + 1, options),
          80,
        );
      }
      return;
    }
    animateScrollTo(targetY, gen, durationForDistance(targetY - window.scrollY));
  });
}

export function queueSectionForHome(sectionId) {
  try {
    sessionStorage.setItem(PENDING_SECTION_KEY, sectionId);
  } catch {
    /* ignore */
  }
}

export function hasPendingSection() {
  try {
    return Boolean(sessionStorage.getItem(PENDING_SECTION_KEY));
  } catch {
    return false;
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

export function navigateToSection(sectionId, pathname, router) {
  if (!sectionId) return;
  if (pathname === "/") {
    setSectionHash(sectionId);
    scrollToSection(sectionId);
    return;
  }
  queueSectionForHome(sectionId);
  router.push("/", { scroll: false });
}

export function repairMalformedHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  if (!hash.slice(1).includes("#")) return;
  const id = getHashId();
  if (id) setSectionHash(id);
}
