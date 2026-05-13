import { client } from "./client";
import { urlFor } from "./image";
import { writeClient, hasWriteToken } from "./writeClient";

/** Normalize legacy string or new string[] from Sanity. */
function normalizeHomeSliderColors(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

const PRODUCTS_QUERY = /* groq */ `
  *[_type == "product"] | order(coalesce(order, 100) asc, _createdAt asc) {
    "id": slug.current,
    name,
    "category": category->title,
    price,
    originalPrice,
    description,
    badge,
    homeSliderColor,
    sizes,
    "colors": colors[]{
      name,
      "value": coalesce(value.hex, value),
      "images": images[]{
        _key,
        asset,
        hotspot,
        crop
      },
      "stockEntries": stockEntries[]{
        size,
        stock,
        initialStock
      }
    }
  }
`;

const CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"] | order(coalesce(order, 100) asc, title asc) {
    "id": _id,
    title
  }
`;

function mapProduct(raw) {
  if (!raw) return null;
  const price = raw.price ?? 0;
  const originalPrice =
    typeof raw.originalPrice === "number" && raw.originalPrice > price
      ? raw.originalPrice
      : null;
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category || "Uncategorized",
    price,
    originalPrice,
    description: raw.description || "",
    badge: raw.badge || null,
    homeSliderColor: normalizeHomeSliderColors(raw.homeSliderColor),
    sizes: Array.isArray(raw.sizes) && raw.sizes.length ? raw.sizes : ["S", "M", "L"],
    colors: (raw.colors || []).map((c) => ({
      name: c?.name || "Default",
      value: c?.value || "#000000",
      images: (c?.images || [])
        .map((img) => {
          try {
            return urlFor(img).width(1200).quality(85).auto("format").url();
          } catch {
            return null;
          }
        })
        .filter(Boolean),
      stockEntries: Array.isArray(c?.stockEntries)
        ? c.stockEntries
            .filter((s) => s && typeof s.size === "string")
            .map((s) => ({
              size: s.size,
              stock: Number(s.stock) || 0,
              initialStock:
                typeof s.initialStock === "number" ? s.initialStock : null,
            }))
        : [],
    })),
  };
}

export async function getAllProducts() {
  try {
    const data = await client.fetch(
      PRODUCTS_QUERY,
      {},
      { next: { revalidate: 0 } }
    );
    return (data || []).map(mapProduct).filter((p) => p && p.id);
  } catch (err) {
    console.error("[sanity] getAllProducts failed:", err?.message || err);
    return [];
  }
}

export async function getAllCategories() {
  try {
    const data = await client.fetch(
      CATEGORIES_QUERY,
      {},
      { next: { revalidate: 0 } }
    );
    const titles = (data || []).map((c) => c.title).filter(Boolean);
    return ["All", ...titles];
  } catch (err) {
    console.error("[sanity] getAllCategories failed:", err?.message || err);
    return ["All"];
  }
}

export async function getProductById(id) {
  const list = await getAllProducts();
  return list.find((p) => String(p.id) === String(id)) || null;
}

/** Most recently created product (by Sanity `_createdAt`). Images come from the first color’s first image — there is no top-level `images` on `product` in this studio schema. */
const LATEST_PRODUCT_QUERY = /* groq */ `
  *[_type == "product"] | order(_createdAt desc)[0]{
    _id,
    "id": slug.current,
    name,
    description,
    price,
    "category": category->title,
    "firstImage": colors[0].images[0]
  }
`;

function mapNewsletterProductRow(raw) {
  if (!raw?.id) return null;
  let image = null;
  if (raw.firstImage) {
    try {
      image = urlFor(raw.firstImage)
        .width(1200)
        .quality(85)
        .auto("format")
        .url();
    } catch {
      image = null;
    }
  }
  return {
    _id: raw._id,
    id: raw.id,
    name: raw.name,
    description: raw.description || "",
    category: raw.category || "",
    image,
    price: raw.price ?? 0,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${raw.id}`,
  };
}

export async function getLatestProduct() {
  try {
    const raw = await client.fetch(
      LATEST_PRODUCT_QUERY,
      {},
      { next: { revalidate: 0 } }
    );
    return mapNewsletterProductRow(raw);
  } catch (err) {
    console.error("[sanity] getLatestProduct failed:", err?.message || err);
    return null;
  }
}

/** Same shape as `getLatestProduct` but for a specific product slug (newsletter / admin pick). */
const PRODUCT_BY_SLUG_FOR_NEWSLETTER_QUERY = /* groq */ `
  *[_type == "product" && slug.current == $slug][0]{
    _id,
    "id": slug.current,
    name,
    description,
    price,
    "category": category->title,
    "firstImage": colors[0].images[0]
  }
`;

export async function getProductForNewsletterBySlug(slug) {
  const id = String(slug ?? "").trim();
  if (!id) return null;
  try {
    const raw = await client.fetch(
      PRODUCT_BY_SLUG_FOR_NEWSLETTER_QUERY,
      { slug: id },
      { next: { revalidate: 0 } }
    );
    return mapNewsletterProductRow(raw);
  } catch (err) {
    console.error(
      "[sanity] getProductForNewsletterBySlug failed:",
      err?.message || err
    );
    return null;
  }
}

export async function getRelatedProducts(id, limit = 4) {
  const list = await getAllProducts();
  const current = list.find((p) => String(p.id) === String(id));
  if (!current) return [];
  const same = list.filter(
    (p) => p.category === current.category && p.id !== current.id
  );
  const others = list.filter(
    (p) => p.category !== current.category && p.id !== current.id
  );
  return [...same, ...others].slice(0, limit);
}

/**
 * Server-only. Returns a map { [productId]: { cost, price } } for the given ids.
 * - cost is `null` when the product has no cost configured in Sanity yet.
 * - returns `null` (instead of an object) if the Sanity request itself failed.
 *
 * Cost is sensitive — never call this from the client or include it in any
 * response sent to the browser.
 */
export async function getProductCostsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return {};
  const unique = [...new Set(ids.map(String))];
  try {
    const data = await client.fetch(
      /* groq */ `*[_type == "product" && slug.current in $ids]{
        "id": slug.current,
        price,
        cost
      }`,
      { ids: unique },
      { next: { revalidate: 0 } }
    );
    const map = {};
    for (const row of data || []) {
      if (!row?.id) continue;
      const hasCost = typeof row.cost === "number" && Number.isFinite(row.cost);
      map[row.id] = {
        price: Number(row.price ?? 0),
        cost: hasCost ? Number(row.cost) : null,
      };
    }
    return map;
  } catch (err) {
    console.error("[sanity] getProductCostsByIds failed:", err?.message || err);
    return null;
  }
}

export function getPrimaryImage(product) {
  return product?.colors?.[0]?.images?.[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK
// ─────────────────────────────────────────────────────────────────────────────
//
// Stock model: each `color` has an optional `stockEntries` array; each entry is
// { _key, size, stock, initialStock? }. Stock is opt-in per product:
//   • product without stockEntries → unlimited (no enforcement, no analytics).
//   • product with stockEntries    → strictly enforced. A combo not listed, or
//     listed with stock 0, blocks the order.
//
// Decrement runs as a Sanity transaction so multiple items either all succeed
// or all fail — no half-decremented stock when an order goes through.

const STOCK_LOOKUP_QUERY = /* groq */ `
  *[_type == "product" && slug.current in $ids]{
    _id,
    "id": slug.current,
    name,
    "colors": colors[]{
      _key,
      name,
      "stockEntries": stockEntries[]{
        _key,
        size,
        stock,
        initialStock
      }
    }
  }
`;

function colorNameOf(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  return (raw.name || "").toString().trim();
}

/**
 * Server-only. Returns a structured map for the admin analytics view:
 *   { [productId]: {
 *       name,
 *       tracked: boolean,            // false = product not using stock yet
 *       totalStock, totalInitial,
 *       byColor: [{ name, totalStock, totalInitial, sizes: [{size, stock, initialStock}] }]
 *   } }
 * Returns `null` if the request itself failed.
 */
export async function getProductStockMap() {
  try {
    const data = await client.fetch(
      /* groq */ `*[_type == "product"]{
        "id": slug.current,
        name,
        "colors": colors[]{
          name,
          "images": images[]{
            asset,
            hotspot,
            crop
          },
          "stockEntries": stockEntries[]{ size, stock, initialStock }
        }
      }`,
      {},
      { next: { revalidate: 0 } }
    );
    const map = {};
    for (const row of data || []) {
      if (!row?.id) continue;
      let totalStock = 0;
      let totalInitial = 0;
      let tracked = false;
      let image = null;

      const primaryImage = row?.colors?.[0]?.images?.[0];
      if (primaryImage) {
        try {
          image = urlFor(primaryImage)
            .width(1200)
            .quality(85)
            .auto("format")
            .url();
        } catch {
          image = null;
        }
      }
      const byColor = (row.colors || []).map((c) => {
        const sizes = (c?.stockEntries || [])
          .filter((s) => s && typeof s.size === "string")
          .map((s) => ({
            size: s.size,
            stock: Number(s.stock) || 0,
            initialStock:
              typeof s.initialStock === "number" ? s.initialStock : null,
          }));
        const colorTotalStock = sizes.reduce((sum, s) => sum + s.stock, 0);
        const colorTotalInitial = sizes.reduce(
          (sum, s) => sum + (s.initialStock ?? 0),
          0
        );
        if (sizes.length > 0) tracked = true;
        totalStock += colorTotalStock;
        totalInitial += colorTotalInitial;
        return {
          name: c?.name || "Default",
          totalStock: colorTotalStock,
          totalInitial: colorTotalInitial,
          sizes,
        };
      });
      map[row.id] = {
        name: row.name || row.id,
        image,
        tracked,
        totalStock,
        totalInitial,
        byColor,
      };
    }
    return map;
  } catch (err) {
    console.error("[sanity] getProductStockMap failed:", err?.message || err);
    return null;
  }
}

/**
 * Server-only. Atomically decrements stock for every line item.
 *
 * Behavior (intentionally permissive):
 *   • Orders are NEVER rejected for stock reasons. We always commit the
 *     decrement so the dashboard reflects what was actually sold.
 *   • Stock is allowed to go negative — that's our signal that the admin
 *     oversold and needs to restock urgently.
 *   • Untracked products and unknown variants are skipped silently (we just
 *     don't decrement them).
 *
 * The returned `alerts` array surfaces any variant whose post-order stock is
 * ≤ 0 so the API layer can flag the order/notify the admin.
 *
 * `items` shape: [{ id, name, color, size, quantity }]
 *
 * Returns:
 *   { ok: true, applied: [...], alerts: [...] }
 *   { ok: false, code, error } only on infrastructure failure
 *     code = "fetch_failed" | "patch_failed"
 */
export async function reserveStock(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: true, applied: [], alerts: [] };
  }

  if (!hasWriteToken) {
    // Without a write token we can't mutate stock at all (e.g. dev without
    // a Sanity write token). Carry on as if no tracking exists.
    return { ok: true, applied: [], alerts: [], skipped: "no_token" };
  }

  const ids = [...new Set(items.map((it) => String(it.id)))];

  let products;
  try {
    products = await client.fetch(STOCK_LOOKUP_QUERY, { ids });
  } catch (err) {
    console.error("[sanity] reserveStock fetch failed:", err?.message || err);
    return { ok: false, code: "fetch_failed", error: "Could not verify stock." };
  }

  const productById = new Map(
    (products || []).map((p) => [String(p.id), p])
  );

  // Group desired qty by (productId, colorKey, stockKey) so a cart with
  // duplicate lines (e.g. two of the same variant added separately) is
  // decremented in one patch.
  const decByEntry = new Map(); // key = `${_id}|${colorKey}|${stockKey}` → { qty, before, meta }
  const alerts = [];

  for (const it of items) {
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 0));
    const product = productById.get(String(it.id));
    if (!product) {
      // Product no longer exists in Sanity (deleted between cart and order).
      // Don't reject — just flag so the admin can investigate.
      alerts.push({
        id: it.id,
        name: it.name,
        color: colorNameOf(it.color),
        size: it.size || "",
        before: null,
        after: null,
        ordered: qty,
        reason: "product_missing",
      });
      continue;
    }

    const colors = Array.isArray(product.colors) ? product.colors : [];
    const productHasStock = colors.some(
      (c) => Array.isArray(c?.stockEntries) && c.stockEntries.length > 0
    );
    if (!productHasStock) {
      // Product opted out of stock tracking — skip silently.
      continue;
    }

    const wantedColor = colorNameOf(it.color);
    const wantedSize = (it.size || "").toString().trim();

    const colorMatch =
      colors.find((c) => (c?.name || "").trim() === wantedColor) ||
      (wantedColor === "" ? colors[0] : null);

    if (!colorMatch) {
      alerts.push({
        id: product.id,
        name: product.name,
        color: wantedColor,
        size: wantedSize,
        before: null,
        after: null,
        ordered: qty,
        reason: "color_not_found",
      });
      continue;
    }

    const entries = Array.isArray(colorMatch.stockEntries)
      ? colorMatch.stockEntries
      : [];
    const entryMatch = entries.find(
      (e) => (e?.size || "").toString().trim() === wantedSize
    );
    if (!entryMatch) {
      alerts.push({
        id: product.id,
        name: product.name,
        color: wantedColor,
        size: wantedSize,
        before: null,
        after: null,
        ordered: qty,
        reason: "size_not_listed",
      });
      continue;
    }

    const key = `${product._id}|${colorMatch._key}|${entryMatch._key}`;
    const existing = decByEntry.get(key);
    const before = existing ? existing.before : Number(entryMatch.stock) || 0;
    const totalQty = (existing?.qty || 0) + qty;
    decByEntry.set(key, {
      qty: totalQty,
      before,
      meta: {
        id: product.id,
        name: product.name,
        color: wantedColor,
        size: wantedSize,
      },
    });
  }

  if (decByEntry.size === 0) {
    return { ok: true, applied: [], alerts };
  }

  // Build a single transaction: one patch per (product, color, stockEntry).
  const tx = writeClient.transaction();
  const applied = [];
  for (const [key, info] of decByEntry.entries()) {
    const [productId, colorKey, stockKey] = key.split("|");
    tx.patch(productId, (p) =>
      p.dec({
        [`colors[_key=="${colorKey}"].stockEntries[_key=="${stockKey}"].stock`]:
          info.qty,
      })
    );
    applied.push({ productId, colorKey, stockKey, qty: info.qty });

    // Compute the post-order stock and surface any variant that hit / went
    // below zero so the admin gets an alert.
    const after = info.before - info.qty;
    if (after <= 0) {
      alerts.push({
        ...info.meta,
        before: info.before,
        after,
        ordered: info.qty,
        reason: after < 0 ? "oversold" : "depleted",
      });
    }
  }

  try {
    await tx.commit({ visibility: "async" });
    return { ok: true, applied, alerts };
  } catch (err) {
    console.error("[sanity] reserveStock commit failed:", err?.message || err);
    return {
      ok: false,
      code: "patch_failed",
      error: "Could not update stock. Please try again.",
    };
  }
}

/**
 * Server-only. The inverse of `reserveStock` — used when an order is
 * cancelled, so the units that were debited from inventory get restored.
 *
 * Same shape & behaviour as `reserveStock`:
 *   • Untracked products are skipped silently.
 *   • Missing colors/sizes (e.g. the variant was removed in Sanity since the
 *     order was placed) are skipped with a warn log instead of failing —
 *     refusing a cancellation rollback because of a deleted variant would be
 *     worse than the rollback being slightly incomplete.
 */
export async function restoreStock(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: true, applied: [] };
  }

  if (!hasWriteToken) {
    return { ok: true, applied: [], skipped: "no_token" };
  }

  const ids = [...new Set(items.map((it) => String(it.id)))];

  let products;
  try {
    products = await client.fetch(STOCK_LOOKUP_QUERY, { ids });
  } catch (err) {
    console.error("[sanity] restoreStock fetch failed:", err?.message || err);
    return { ok: false, code: "fetch_failed", error: "Could not restore stock." };
  }

  const productById = new Map((products || []).map((p) => [String(p.id), p]));
  const incByEntry = new Map();

  for (const it of items) {
    const qty = Math.max(0, Math.floor(Number(it.quantity) || 0));
    if (qty === 0) continue;
    const product = productById.get(String(it.id));
    if (!product) {
      console.warn(
        "[sanity] restoreStock: product no longer exists, skipping:",
        it.id
      );
      continue;
    }

    const colors = Array.isArray(product.colors) ? product.colors : [];
    const productHasStock = colors.some(
      (c) => Array.isArray(c?.stockEntries) && c.stockEntries.length > 0
    );
    if (!productHasStock) continue;

    const wantedColor = colorNameOf(it.color);
    const wantedSize = (it.size || "").toString().trim();
    const colorMatch =
      colors.find((c) => (c?.name || "").trim() === wantedColor) ||
      (wantedColor === "" ? colors[0] : null);
    if (!colorMatch) {
      console.warn(
        "[sanity] restoreStock: color not found, skipping:",
        product.name,
        wantedColor
      );
      continue;
    }
    const entries = Array.isArray(colorMatch.stockEntries)
      ? colorMatch.stockEntries
      : [];
    const entryMatch = entries.find(
      (e) => (e?.size || "").toString().trim() === wantedSize
    );
    if (!entryMatch) {
      console.warn(
        "[sanity] restoreStock: size not found, skipping:",
        product.name,
        wantedColor,
        wantedSize
      );
      continue;
    }
    const key = `${product._id}|${colorMatch._key}|${entryMatch._key}`;
    incByEntry.set(key, (incByEntry.get(key) || 0) + qty);
  }

  if (incByEntry.size === 0) {
    return { ok: true, applied: [] };
  }

  const tx = writeClient.transaction();
  const applied = [];
  for (const [key, qty] of incByEntry.entries()) {
    const [productId, colorKey, stockKey] = key.split("|");
    tx.patch(productId, (p) =>
      p.inc({
        [`colors[_key=="${colorKey}"].stockEntries[_key=="${stockKey}"].stock`]:
          qty,
      })
    );
    applied.push({ productId, colorKey, stockKey, qty });
  }

  try {
    await tx.commit({ visibility: "async" });
    return { ok: true, applied };
  } catch (err) {
    console.error("[sanity] restoreStock commit failed:", err?.message || err);
    return {
      ok: false,
      code: "patch_failed",
      error: "Could not restore stock.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: reset stock to initial
// ─────────────────────────────────────────────────────────────────────────────

const STOCK_RESET_QUERY_ALL = /* groq */ `
  *[_type == "product"]{
    _id,
    "id": slug.current,
    name,
    "colors": colors[]{
      _key,
      name,
      "stockEntries": stockEntries[]{
        _key,
        size,
        stock,
        initialStock
      }
    }
  }
`;

const STOCK_RESET_QUERY_BY_IDS = /* groq */ `
  *[_type == "product" && slug.current in $ids]{
    _id,
    "id": slug.current,
    name,
    "colors": colors[]{
      _key,
      name,
      "stockEntries": stockEntries[]{
        _key,
        size,
        stock,
        initialStock
      }
    }
  }
`;

export async function resetAllTrackedStockToInitial(productIds) {
  if (!hasWriteToken) {
    return {
      ok: false,
      code: "no_token",
      error: "Sanity write token missing.",
    };
  }

  const ids = Array.isArray(productIds)
    ? productIds
        .map((v) => String(v || "").trim())
        .filter(Boolean)
    : [];

  let products;
  try {
    products = await client.fetch(
      ids.length > 0 ? STOCK_RESET_QUERY_BY_IDS : STOCK_RESET_QUERY_ALL,
      ids.length > 0 ? { ids } : {},
      { next: { revalidate: 0 } }
    );
  } catch (err) {
    console.error("[sanity] resetAllTrackedStockToInitial fetch failed:", err?.message || err);
    return { ok: false, code: "fetch_failed", error: "Could not load stock data." };
  }

  const tx = writeClient.transaction();
  let productsTouched = 0;
  let entriesSet = 0;
  const skipped = {
    untrackedProducts: 0,
    missingInitial: 0,
  };

  for (const p of products || []) {
    const colors = Array.isArray(p?.colors) ? p.colors : [];
    const productHasStock = colors.some(
      (c) => Array.isArray(c?.stockEntries) && c.stockEntries.length > 0
    );
    if (!productHasStock) {
      skipped.untrackedProducts += 1;
      continue;
    }

    let touchedThisProduct = false;
    for (const c of colors) {
      const colorKey = c?._key;
      const entries = Array.isArray(c?.stockEntries) ? c.stockEntries : [];
      if (!colorKey || entries.length === 0) continue;
      for (const e of entries) {
        const stockKey = e?._key;
        const initial = e?.initialStock;
        if (!stockKey) continue;
        if (typeof initial !== "number" || !Number.isFinite(initial)) {
          skipped.missingInitial += 1;
          continue;
        }
        tx.patch(p._id, (patch) =>
          patch.set({
            [`colors[_key=="${colorKey}"].stockEntries[_key=="${stockKey}"].stock`]:
              initial,
          })
        );
        entriesSet += 1;
        touchedThisProduct = true;
      }
    }

    if (touchedThisProduct) productsTouched += 1;
  }

  if (entriesSet === 0) {
    return {
      ok: true,
      productsTouched: 0,
      entriesSet: 0,
      skipped,
    };
  }

  try {
    await tx.commit({ visibility: "async" });
    return { ok: true, productsTouched, entriesSet, skipped };
  } catch (err) {
    console.error("[sanity] resetAllTrackedStockToInitial commit failed:", err?.message || err);
    return { ok: false, code: "patch_failed", error: "Could not reset stock." };
  }
}

