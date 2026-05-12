import { resetAllTrackedStockToInitial } from "../../../../sanity/lib/products";

function isAuthorizedAdmin(req) {
  const adminPass = process.env.ADMIN_PASS;
  if (!adminPass) return false;
  const provided = req.headers.get("x-admin-pass");
  return provided === adminPass;
}

export async function POST(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const productIds = Array.isArray(body?.productIds) ? body.productIds : [];
    if (productIds.length === 0) {
      return Response.json(
        { success: false, error: "Missing productIds." },
        { status: 400 }
      );
    }

    const result = await resetAllTrackedStockToInitial(productIds);
    if (!result?.ok) {
      return Response.json(
        { success: false, error: result?.error || "Failed to reset stock." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, ...result });
  } catch (err) {
    console.error("[products/reset-stock] unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

