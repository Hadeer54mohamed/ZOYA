import { createClient } from "@supabase/supabase-js";
import { sendOrderToSheet } from "../../../../lib/sendOrderToSheet";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isAuthorizedAdmin(req) {
  const adminPass = process.env.ADMIN_PASS;
  if (!adminPass) return false;
  return req.headers.get("x-admin-pass") === adminPass;
}

/**
 * POST — push one order to the Google Sheet webhook (same payload as checkout flow).
 * Body: { order?: full row } OR { id?: uuid } OR { order_id?: string } to load from Supabase.
 * Header: x-admin-pass (ADMIN_PASS)
 */
export async function POST(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let row = body?.order;
    const id = body?.id;
    const orderId =
      typeof body?.order_id === "string" ? body.order_id.trim() : null;

    if (!row && (id || orderId)) {
      let q = supabase.from("orders").select("*");
      if (id) q = q.eq("id", id);
      else q = q.eq("order_id", orderId);
      const { data, error } = await q.maybeSingle();
      if (error) {
        console.error("[orders/sync-to-sheets] fetch error:", error);
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      if (!data) {
        return Response.json(
          { success: false, error: "Order not found." },
          { status: 404 }
        );
      }
      row = data;
    }

    if (!row || typeof row !== "object") {
      return Response.json(
        {
          success: false,
          error: "Provide `order` object or `id` / `order_id` to load from database.",
        },
        { status: 400 }
      );
    }

    const result = await sendOrderToSheet(row, { throwOnMissingUrl: true });
    if (!result.ok) {
      return Response.json(
        {
          success: false,
          error: result.error || result.reason || "Sheet sync failed.",
          details: result,
        },
        { status: result.skipped ? 503 : 502 }
      );
    }

    return Response.json({ success: true, sheet: result });
  } catch (err) {
    console.error("[orders/sync-to-sheets] unexpected:", err);
    const message = err?.message ? String(err.message) : "Server error.";
    const isConfig = /Missing GOOGLE_SHEET_WEBHOOK_URL/i.test(message);
    return Response.json(
      { success: false, error: message },
      { status: isConfig ? 503 : 500 }
    );
  }
}
