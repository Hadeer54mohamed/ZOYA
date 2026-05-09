import { unstable_cache } from "next/cache";
import { client } from "./client";
import shippingFeesRaw from "../../app/lib/shippingFees.json";

export function normalizeShippingFeesRecord(record) {
  const out = {};
  if (!record || typeof record !== "object") return out;
  for (const [k, v] of Object.entries(record)) {
    const name = String(k).trim();
    const fee = Number(v);
    if (!name || !Number.isFinite(fee) || fee < 0) continue;
    out[name] = Math.round(fee);
  }
  return out;
}

export const FALLBACK_SHIPPING_FEES =
  normalizeShippingFeesRecord(shippingFeesRaw);

function mapFromSanityRows(rows) {
  const out = {};
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    const name = (row?.name ?? "").toString().trim();
    const fee = Math.round(Number(row?.feeEgp));
    if (!name || !Number.isFinite(fee) || fee < 0) continue;
    out[name] = fee;
  }
  return out;
}

async function fetchSanityShippingMap() {
  try {
    const doc = await client.fetch(
      `*[_type == "shippingSettings" && _id == $id][0]{ governorates[]{ name, feeEgp } }`,
      { id: "shippingSettings" }
    );
    return mapFromSanityRows(doc?.governorates);
  } catch (e) {
    console.error("[sanity] fetchSanityShippingMap failed:", e?.message || e);
    return {};
  }
}

/** خريطة محافظة → سجنيه؛ Sanity أولًا، أو fallback من ملف JSON */
export async function getShippingFeesMap() {
  const fromSanity = await fetchSanityShippingMap();
  if (fromSanity && Object.keys(fromSanity).length > 0) return fromSanity;
  return { ...FALLBACK_SHIPPING_FEES };
}

export const getShippingFeesMapCached = unstable_cache(
  getShippingFeesMap,
  ["shipping-fees-map-v1"],
  { revalidate: 60 }
);
