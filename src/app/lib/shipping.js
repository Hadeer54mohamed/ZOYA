/**
 * قائمة احتياطية من `shippingFees.json` لو كان مستند Sanity فاضي أو غير منشور.
 * القائمة الحية للعملاء تأتي من `/api/shipping` (محتوى Sanity عند وجوده).
 */
import shippingFeesRaw from "./shippingFees.json";

function normalizeShippingFees(record) {
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

export const FALLBACK_SHIPPING_FEES = normalizeShippingFees(shippingFeesRaw);

/** @deprecated للتوافق: نفس قائمة الملف؛ الأفضل جلب الأسعار من الـ API */
export const SHIPPING_FEES = FALLBACK_SHIPPING_FEES;

export function getShippingFeeFromMap(map, governorate) {
  if (!governorate || !map || typeof map !== "object") return 0;
  return map[governorate] ?? 0;
}

export function isValidGovernorateInMap(map, governorate) {
  return (
    Boolean(governorate && map && typeof map === "object") &&
    governorate in map
  );
}
