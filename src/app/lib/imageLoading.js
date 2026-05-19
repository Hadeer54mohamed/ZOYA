/**
 * Above-the-fold / LCP images.
 * Next/Image `priority` auto-adds preload + disables lazy load.
 */
export function eagerImageProps() {
  return { priority: true, fetchPriority: "high" };
}

/** Below-the-fold images. */
export function lazyImageProps() {
  return {
    loading: "lazy",
    fetchPriority: "auto",
  };
}

export function imageLoadingProps(eager = false) {
  return eager ? eagerImageProps() : lazyImageProps();
}

/** First row on listing grids (4-up on lg). */
export const ABOVE_FOLD_PRODUCT_COUNT = 4;
