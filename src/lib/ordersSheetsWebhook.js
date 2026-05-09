/**
 * Google Sheets webhook (Apps Script Web App). Use ONE deployment URL everywhere.
 * Set ORDERS_WEBHOOK_URL or GOOGLE_SHEETS_WEBHOOK_URL in env — do not rely on fallbacks in production.
 */
export function getOrdersWebhookUrl() {
  return (
    process.env.ORDERS_WEBHOOK_URL ||
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    "https://script.google.com/macros/s/AKfycbwbFa2ib0nVk_AcZIsgtjbPvTsesASvEVa1daWxLONvn0xNfTh8UZwy0HqnAvlWv1w/exec"
  );
}

/** Same value as SUPABASE_DB_WEBHOOK_SECRET; Apps Script cannot read HTTP headers in doPost. */
export function attachSheetsWebhookSecret(payload) {
  const secret = process.env.SUPABASE_DB_WEBHOOK_SECRET;
  if (!secret || !payload || typeof payload !== "object") return payload;
  return { ...payload, webhook_secret: secret };
}

export function normalizeOrderRowForSheets(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.order_id ?? row.id ?? null,
    order_id: row.order_id ?? null,
    customer_name: row.customer_name ?? row.customer ?? null,
    total_price: row.total_price ?? row.total ?? null,
    payment_method: row.payment_method ?? row.payment ?? null,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

/**
 * Maps app action to the payload Apps Script expects (Supabase-style).
 * @param {"create"|"update"|"delete"} action
 */
export function buildSheetsWebhookPayload(action, row) {
  const actionType =
    action === "create" ? "INSERT" : action === "delete" ? "DELETE" : "UPDATE";
  const normalizedRecord = normalizeOrderRowForSheets(row);
  return attachSheetsWebhookSecret({
    type: actionType,
    table: "orders",
    source: `next-api:${action}`,
    record: actionType === "DELETE" ? null : normalizedRecord,
    old_record: actionType === "DELETE" ? normalizedRecord : null,
  });
}

// Fire-and-forget; never throws to callers.
export function postOrderSheetsWebhook(action, row) {
  if (!row) return;

  const ORDERS_WEBHOOK_URL = getOrdersWebhookUrl();
  const payload = buildSheetsWebhookPayload(action, row);
  const normalizedRecord =
    payload.record ?? payload.old_record ?? normalizeOrderRowForSheets(row);
  const key = normalizedRecord?.order_id || normalizedRecord?.id;

  const headers = { "Content-Type": "application/json" };
  const sheetsSecret = process.env.SUPABASE_DB_WEBHOOK_SECRET;
  if (sheetsSecret) {
    headers["x-webhook-secret"] = sheetsSecret;
  }

  console.log(`[orders-sheets] sync start (${action}):`, key);

  fetch(ORDERS_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    redirect: "follow",
  })
    .then(async (res) => {
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        console.error(
          `[orders-sheets] sync failed (${action}): status=${res.status} ${res.statusText} | body=${text || "(empty)"}`
        );
        return;
      }
      if (!text) {
        console.log(`[orders-sheets] sync ok-empty (${action}):`, key);
        return;
      }
      try {
        const parsed = JSON.parse(text);
        if (parsed?.success === false) {
          console.error(
            `[orders-sheets] sync rejected (${action}):`,
            parsed?.error || parsed
          );
          return;
        }
        console.log(`[orders-sheets] sync ok (${action}):`, key);
      } catch {
        console.warn(
          `[orders-sheets] non-JSON (${action}): ${text.slice(0, 300)}`
        );
      }
    })
    .catch((err) => {
      console.error(`[orders-sheets] sync threw (${action}):`, err);
    });
}
