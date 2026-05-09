import {
  attachSheetsWebhookSecret,
  getOrdersWebhookUrl,
  normalizeOrderRowForSheets,
} from "../../../../lib/ordersSheetsWebhook";

export async function POST(req) {
  try {
    const expectedSecret = process.env.SUPABASE_DB_WEBHOOK_SECRET;
    if (expectedSecret) {
      const incoming =
        req.headers.get("x-supabase-signature") ||
        req.headers.get("x-webhook-secret") ||
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

      if (!incoming || incoming !== expectedSecret) {
        return Response.json(
          { success: false, error: "Unauthorized webhook source." },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const type = body?.type || body?.eventType || body?.event || "";
    const table = body?.table || body?.table_name || "";
    if (table && table !== "orders") {
      return Response.json({ success: true, ignored: true });
    }
    const newRow = body?.record || body?.new || null;
    const oldRow = body?.old_record || body?.old || null;
    const row = type?.toString().toUpperCase() === "DELETE" ? oldRow : newRow;

    if (!row) {
      return Response.json(
        { success: false, error: "Missing row payload." },
        { status: 400 }
      );
    }

    const normalizedRecord = normalizeOrderRowForSheets(row);
    const normalizedType = type?.toString().toUpperCase() || "UPDATE";
    const payload = attachSheetsWebhookSecret({
      type: normalizedType,
      table: "orders",
      source: "supabase-db-webhook",
      record: normalizedType === "DELETE" ? null : normalizedRecord,
      old_record: normalizedType === "DELETE" ? normalizedRecord : null,
    });

    const headers = { "Content-Type": "application/json" };
    if (expectedSecret) headers["x-webhook-secret"] = expectedSecret;

    const res = await fetch(getOrdersWebhookUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[orders/supabase-webhook] sheets webhook failed: status=${res.status} ${res.statusText} | message=${text || "(empty)"}`
      );
      return Response.json(
        { success: false, error: "Failed to push sync event to sheets." },
        { status: 502 }
      );
    }

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed?.success === false) {
          console.error(
            "[orders/supabase-webhook] sheets webhook rejected:",
            parsed?.error || parsed
          );
          return Response.json(
            { success: false, error: parsed?.error || "Sheets rejected payload." },
            { status: 502 }
          );
        }
      } catch {
        console.warn(
          `[orders/supabase-webhook] non-JSON response: ${text.slice(0, 300)}`
        );
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[orders/supabase-webhook] unexpected:", err);
    return Response.json(
      { success: false, error: "Server error." },
      { status: 500 }
    );
  }
}
