const DEFAULT_FALLBACK = "/images/placeholder.jpg";

/** All image URLs for a color variant (supports `images[]` or legacy `image`). */
export function colorImageList(color, fallback = DEFAULT_FALLBACK) {
  if (!color) return [fallback];
  const list = Array.isArray(color.images)
    ? color.images.filter((u) => typeof u === "string" && u.trim().length > 0)
    : [];
  if (list.length > 0) return list;
  if (typeof color.image === "string" && color.image.trim())
    return [color.image.trim()];
  return [fallback];
}

/** First image URL — cart thumbnails, color rail previews, etc. */
export function colorPrimaryImage(color, fallback = DEFAULT_FALLBACK) {
  return colorImageList(color, fallback)[0];
}
