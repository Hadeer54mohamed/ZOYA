import { getSiteUrl } from "../lib/siteUrl";
import { getAllProducts } from "../sanity/lib/products";

export default async function sitemap() {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes = [
    "",
    "/products",
    "/privacy",
    "/terms",
    "/cookies",
    "/track",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.5,
  }));

  let productRoutes = [];
  try {
    const products = await getAllProducts();
    productRoutes = products.map((p) => ({
      url: `${base}/product/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    /* Sanity unavailable at build — static routes still emitted */
  }

  return [...staticRoutes, ...productRoutes];
}
