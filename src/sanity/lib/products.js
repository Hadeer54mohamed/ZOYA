import { client } from "./client";
import { urlFor } from "./image";

const PRODUCTS_QUERY = /* groq */ `
  *[_type == "product"] | order(coalesce(order, 100) asc, _createdAt asc) {
    "id": slug.current,
    name,
    "category": category->title,
    price,
    originalPrice,
    description,
    badge,
    sizes,
    "colors": colors[]{
      name,
      "value": coalesce(value.hex, value),
      "images": images[]{
        _key,
        asset,
        hotspot,
        crop
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

export function getPrimaryImage(product) {
  return product?.colors?.[0]?.images?.[0];
}
