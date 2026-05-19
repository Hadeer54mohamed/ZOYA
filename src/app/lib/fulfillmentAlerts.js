/** Orders that still need packing — we infer live stock for these statuses. */
export const FULFILLMENT_ACTIVE_STATUSES = new Set(["pending", "confirmed"]);

export function colorNameOf(color) {
  if (!color) return "";
  if (typeof color === "string") return color.trim();
  return (color?.name || "").toString().trim();
}

export function fulfillmentReasonLabel(reason) {
  switch (reason) {
    case "oversold":
      return "Oversold — ordered more than available";
    case "depleted":
      return "Out of stock when ordered";
    case "product_missing":
      return "Product no longer in catalog";
    case "color_not_found":
      return "Color not found in catalog";
    case "size_not_listed":
      return "Size not set up in stock";
    default:
      return "Needs restock / verify";
  }
}

export function fulfillmentIssueMessage(issue) {
  const name = issue.name || issue.productId || "Item";
  const variant = [issue.color, issue.size ? `Size ${issue.size}` : ""]
    .filter(Boolean)
    .join(" · ");
  const label = fulfillmentReasonLabel(issue.reason);
  const stockBit =
    typeof issue.after === "number"
      ? ` (stock now: ${issue.after})`
      : typeof issue.before === "number" && typeof issue.after === "number"
        ? ` (was ${issue.before} → ${issue.after})`
        : "";
  return variant
    ? `${name} · ${variant}: ${label}${stockBit}`
    : `${name}: ${label}${stockBit}`;
}

function lineKey(it) {
  return `${it.id}|${colorNameOf(it.color)}|${(it.size || "").toString().trim()}`;
}

function alertKey(alert) {
  return `${alert.id}|${(alert.color || "").trim()}|${(alert.size || "").toString().trim()}`;
}

/** Persist stock alerts on matching line items at order creation. */
export function attachFulfillmentAlertsToItems(items, alerts) {
  if (!Array.isArray(items) || !Array.isArray(alerts) || alerts.length === 0) {
    return items;
  }
  const byKey = new Map(alerts.map((a) => [alertKey(a), a]));
  return items.map((it) => {
    const match = byKey.get(lineKey(it));
    if (!match) return it;
    return {
      ...it,
      fulfillment_alert: {
        reason: match.reason,
        before: match.before ?? null,
        after: match.after ?? null,
        ordered: match.ordered ?? it.quantity,
        recorded_at: new Date().toISOString(),
      },
    };
  });
}

function inspectLineAgainstStockMap(it, stockMap) {
  const id = String(it.id);
  const info = stockMap?.[id];
  const colorName = colorNameOf(it.color);
  const size = (it.size || "").toString().trim();
  const quantity = Math.max(1, Math.floor(Number(it.quantity) || 0));

  if (!info) {
    return {
      productId: id,
      name: it.name,
      color: colorName,
      size,
      quantity,
      reason: "product_missing",
      before: null,
      after: null,
    };
  }

  if (!info.tracked) return null;

  const colorRow = (info.byColor || []).find((c) => (c?.name || "") === colorName);
  if (!colorRow) {
    return {
      productId: id,
      name: info.name || it.name,
      color: colorName,
      size,
      quantity,
      reason: "color_not_found",
      before: null,
      after: null,
    };
  }

  const sizeRow = (colorRow.sizes || []).find((s) => s.size === size);
  if (!sizeRow) {
    return {
      productId: id,
      name: info.name || it.name,
      color: colorName,
      size,
      quantity,
      reason: "size_not_listed",
      before: null,
      after: null,
    };
  }

  const stock = Number(sizeRow.stock) || 0;
  if (stock < 0) {
    return {
      productId: id,
      name: info.name || it.name,
      color: colorName,
      size,
      quantity,
      reason: "oversold",
      before: stock + quantity,
      after: stock,
    };
  }
  if (stock === 0) {
    return {
      productId: id,
      name: info.name || it.name,
      color: colorName,
      size,
      quantity,
      reason: "depleted",
      before: 0,
      after: 0,
    };
  }

  return null;
}

/**
 * Issues for admin: saved on the order line at checkout, or inferred from live
 * stock for pending/confirmed orders (older orders without saved alerts).
 */
export function computeFulfillmentIssues(order, stockMap) {
  const issues = [];
  const items = Array.isArray(order?.items) ? order.items : [];
  const inferLive = FULFILLMENT_ACTIVE_STATUSES.has(order?.status);

  for (const it of items) {
    if (it.fulfillment_alert) {
      issues.push({
        productId: it.id,
        name: it.name,
        color: colorNameOf(it.color),
        size: (it.size || "").toString().trim(),
        quantity: it.quantity,
        ...it.fulfillment_alert,
        source: "order",
      });
      continue;
    }
    if (!inferLive || !stockMap) continue;
    const live = inspectLineAgainstStockMap(it, stockMap);
    if (live) issues.push({ ...live, source: "live" });
  }

  return issues;
}

export function orderNeedsFulfillment(order) {
  if (!order || order.status === "cancelled" || order.status === "delivered") {
    return false;
  }
  if (Array.isArray(order.fulfillment_issues)) {
    return order.fulfillment_issues.length > 0;
  }
  return (order.items || []).some((it) => it.fulfillment_alert);
}

export function itemMatchesFulfillmentIssue(it, issue) {
  return (
    String(issue?.productId || issue?.id) === String(it.id) &&
    (issue?.color || "").trim() === colorNameOf(it.color) &&
    (issue?.size || "").toString().trim() === (it.size || "").toString().trim()
  );
}
