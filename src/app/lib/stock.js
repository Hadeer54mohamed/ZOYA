// Stock helpers for admin/server use only — storefront products do not include
// stockEntries (inventory is dashboard + Sanity Studio only).
// Mirrors the server-side rules used in `sanity/lib/products.reserveStock`:
//   • A product with NO stockEntries on any color = untracked → always available.
//   • A product WITH stockEntries on some colors = tracked → strictly enforced.
//     A (color, size) combo is available only if its entry exists AND its
//     stock > 0. Combos missing from stockEntries are treated as unavailable.
//
// Threshold for "low stock" — keep in sync with the admin analytics view.
export { LOW_STOCK_THRESHOLD } from "./inventoryAlerts";

export function isProductStockTracked(product) {
  if (!product || !Array.isArray(product.colors)) return false;
  return product.colors.some(
    (c) => Array.isArray(c?.stockEntries) && c.stockEntries.length > 0
  );
}

/**
 * How many units are available for a given (color, size).
 * Returns:
 *   • Infinity if the product isn't tracking stock at all
 *   • a number ≥ 0 otherwise (0 = out of stock or combo not listed)
 */
export function getAvailableStock(product, color, size) {
  if (!isProductStockTracked(product)) return Infinity;
  const colorName =
    typeof color === "string" ? color : color?.name || "";
  const sizeName = (size || "").toString();
  const colorObj =
    product.colors?.find((c) => (c?.name || "") === colorName) || null;
  if (!colorObj) return 0;
  const entries = Array.isArray(colorObj.stockEntries) ? colorObj.stockEntries : [];
  if (entries.length === 0) {
    // This specific color isn't tracked while others are → treat as out of stock
    // to be safe (the admin probably forgot to fill it in).
    return 0;
  }
  const entry = entries.find((e) => (e?.size || "") === sizeName);
  if (!entry) return 0;
  return Math.max(0, Number(entry.stock) || 0);
}

export function isVariantAvailable(product, color, size) {
  return getAvailableStock(product, color, size) > 0;
}

/** Returns the first size that's actually available for the given color. */
export function firstAvailableSize(product, color, fallbackSize) {
  if (!isProductStockTracked(product)) {
    return fallbackSize ?? product?.sizes?.[0] ?? null;
  }
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  for (const s of sizes) {
    if (isVariantAvailable(product, color, s)) return s;
  }
  return null; // entire color is sold out
}

export function isColorFullySoldOut(product, color) {
  if (!isProductStockTracked(product)) return false;
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  return sizes.every((s) => !isVariantAvailable(product, color, s));
}
