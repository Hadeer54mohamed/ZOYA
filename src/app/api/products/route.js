import { getAllProducts } from "../../../sanity/lib/products";

// Public, read-only endpoint used by the order editor on /track to let
// customers add more items to a pending order. Cost is intentionally never
// exposed here — it's only used server-side when computing profit.
export async function GET() {
  try {
    const products = await getAllProducts();

    const safe = (Array.isArray(products) ? products : []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      colors: (Array.isArray(p.colors) ? p.colors : []).map((c) => ({
        name: c?.name ?? "",
        value: c?.value ?? "#000000",
        image: c?.images?.[0] ?? null,
      })),
      image: p.colors?.[0]?.images?.[0] ?? null,
    }));

    return Response.json({ success: true, products: safe });
  } catch (err) {
    console.error("Products GET unexpected:", err);
    return Response.json(
      { success: false, error: "Could not load products." },
      { status: 500 }
    );
  }
}
