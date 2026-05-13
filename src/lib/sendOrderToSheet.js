/**
 * Flat JSON body for Google Apps Script / Sheet webhooks.
 *
 * Env:
 * - GOOGLE_SHEET_WEBHOOK_URL (preferred), or GOOGLE_SHEETS_WEBHOOK_URL / ORDERS_WEBHOOK_URL
 * - GOOGLE_SHEET_WEBHOOK_SECRET (preferred), or SUPABASE_DB_WEBHOOK_SECRET for `secret` in body
 *
 * @param {Record<string, unknown>} order Row from Supabase `orders` (or compatible shape)
 * @param {{ timeoutMs?: number, throwOnMissingUrl?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean, skipped?: boolean, reason?: string, status?: number, error?: string }>}
 */
export async function sendOrderToSheet(order, opts = {}) {
  const { timeoutMs = 12000, throwOnMissingUrl = false } = opts;

  const url =
    process.env.GOOGLE_SHEET_WEBHOOK_URL ||
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    process.env.ORDERS_WEBHOOK_URL ||
    null;

  if (!url) {
    const msg =
      "Missing GOOGLE_SHEET_WEBHOOK_URL (or GOOGLE_SHEETS_WEBHOOK_URL / ORDERS_WEBHOOK_URL).";
    console.warn(`[sendOrderToSheet] ${msg}`);
    if (throwOnMissingUrl) throw new Error(msg);
    return { ok: false, skipped: true, reason: "missing_url" };
  }

  const secret =
    process.env.GOOGLE_SHEET_WEBHOOK_SECRET ??
    process.env.SUPABASE_DB_WEBHOOK_SECRET ??
    "";

  const items = Array.isArray(order?.items) ? order.items : [];

  const payload = {
    secret,
    order_id: order?.order_id ?? order?.id ?? null,
    customer_name: order?.customer_name ?? null,
    phone: order?.phone ?? null,
    email: order?.email ?? null,
    address: order?.address ?? null,
    governorate: order?.governorate ?? null,
    items,
    total_price: order?.total_price ?? null,
    shipping_fee: order?.shipping_fee ?? null,
    total_cost: order?.total_cost ?? null,
    profit: order?.profit ?? null,
    status: order?.status ?? null,
    payment_method: order?.payment_method ?? null,
    payment_verified: order?.payment_verified ?? null,
    sender_number: order?.sender_number ?? null,
    transaction_reference: order?.transaction_reference ?? null,
    created_at: order?.created_at ?? null,
  };

  try {
    const fetchPromise = fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const res = await Promise.race([
      fetchPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);

    const text = await res.text().catch(() => "");
    const key = payload.order_id ?? order?.id;
    if (!res.ok) {
      console.error(
        `[sendOrderToSheet] failed order=${key} status=${res.status} body=${text.slice(0, 500)}`
      );
      return { ok: false, status: res.status, error: text || res.statusText };
    }

    // Deploy "Only myself" (or wrong URL) often returns 200 + HTML sign-in page — no row in Sheet.
    const trimmed = text.trim();
    if (trimmed && /<!doctype html|<html[\s>]/i.test(trimmed)) {
      console.error(
        `[sendOrderToSheet] order=${key} got HTML response — Web App must allow unauthenticated POST (e.g. "Anyone") or URL is wrong.`
      );
      return {
        ok: false,
        status: res.status,
        error: "html_response_check_web_app_access",
      };
    }

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed?.success === false) {
          console.error(
            `[sendOrderToSheet] rejected order=${key}:`,
            parsed?.error || parsed
          );
          return {
            ok: false,
            status: res.status,
            error: String(parsed?.error || "rejected"),
          };
        }
      } catch {
        // non-JSON success body is fine
      }
    }

    console.log(`[sendOrderToSheet] ok order=${key}`);
    return { ok: true, status: res.status };
  } catch (err) {
    const key = order?.order_id ?? order?.id;
    console.error(`[sendOrderToSheet] threw order=${key}:`, err);
    return {
      ok: false,
      error: err?.message ? String(err.message) : String(err),
    };
  }
}
