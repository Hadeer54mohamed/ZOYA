let lockCount = 0;
let savedHtmlOverflow = "";
let savedBodyOverflow = "";

/** Ref-counted scroll lock (Intro, Search, Cart, QuickView). */
export function lockBodyScroll() {
  if (typeof document === "undefined") return () => {};
  lockCount += 1;
  if (lockCount === 1) {
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  return () => unlockBodyScroll();
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.overflow = savedHtmlOverflow;
    document.body.style.overflow = savedBodyOverflow;
  }
}

/** Safety net after route changes or stuck overlays. */
export function forceUnlockBodyScroll() {
  if (typeof document === "undefined") return;
  lockCount = 0;
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}
