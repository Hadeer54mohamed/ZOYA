function resolveDiscountKind(rawType) {
  const inList = (arr) => arr.includes(rawType);

  const isPercent =
    inList(["percent", "percentage", "%"]) ||
    /\b(pct|percent)\b/.test(rawType) ||
    rawType.endsWith("%") ||
    rawType.includes("percent") ||
    rawType.includes("pct");
  const isFixed =
    inList(["fixed", "flat", "amount"]) ||
    /\b(flat|fixed)\b/.test(rawType);

  return { isPercent, isFixed };
}

/** Short line for the “code applied” pill — aligned with `computeDiscountAmountEgp`. */
export function discountAppliedSubtitle(discount) {
  if (!discount) return "";
  const value = Number(discount.value) || 0;
  const rawType = (discount.discount_type ?? "").toString().toLowerCase().trim();
  const { isPercent, isFixed } = resolveDiscountKind(rawType);

  if (isPercent && !isFixed) return `${value}% off applied`;
  if (isFixed && !isPercent)
    return `EGP ${value.toLocaleString()} off applied`;
  if (isPercent && isFixed) return `${value}% off applied`;
  if (value > 0 && value <= 100) return `${value}% off applied`;
  return `EGP ${value.toLocaleString()} off applied`;
}

/**
 * EGP discount from a `discount_codes`-shaped row (same intent as POST /api/orders).
 * Accepts common DB spellings and unknown labels via a small inference fallback.
 */
export function computeDiscountAmountEgp(discount, itemsSubtotal) {
  if (!discount || itemsSubtotal <= 0) return 0;
  const value = Number(discount.value) || 0;
  if (value <= 0) return 0;

  const rawType = (discount.discount_type ?? "").toString().toLowerCase().trim();
  const { isPercent, isFixed } = resolveDiscountKind(rawType);

  let amount = 0;
  if (isPercent && !isFixed) {
    amount = Math.round((itemsSubtotal * value) / 100);
  } else if (isFixed && !isPercent) {
    amount = value;
  } else if (isPercent && isFixed) {
    amount = Math.round((itemsSubtotal * value) / 100);
  } else {
    console.warn(
      "[discountAmount] Unknown discount_type:",
      discount.discount_type,
      "— inferring from value shape."
    );
    if (value > 0 && value <= 100) {
      amount = Math.round((itemsSubtotal * value) / 100);
    } else {
      amount = Math.min(itemsSubtotal, value);
    }
  }

  return Math.max(0, Math.min(itemsSubtotal, amount));
}
