import { createClient } from "@supabase/supabase-js";
import {
  getShippingFeeFromMap,
  isValidGovernorateInMap,
} from "../../../lib/shipping";
import { getShippingFeesMapCached } from "../../../../sanity/lib/shippingFees";
import { getProductCostsByIds } from "../../../../sanity/lib/products";
import { computeOrderProfit } from "../../../lib/orderMoney";
import { postOrderSheetsWebhook } from "../../../../lib/ordersSheetsWebhook";
import { notifyCustomerTrackOrderChange } from "../../../../lib/customerOrderEditedEmail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function shapeOrder(row) {
  const items = Array.isArray(row.items) ? row.items : [];
  const itemsCount = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0),
    0
  );
  return {
    order_id: row.order_id,
    status: row.status ?? "pending",
    currency: row.currency ?? "EGP",
    total_price: row.total_price,
    shipping_fee: row.shipping_fee ?? null,
    governorate: row.governorate ?? null,
    payment_method: row.payment_method ?? null,
    items_count: itemsCount,
    items,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

const PHONE_RE = /^01[0125][0-9]{8}$/;

function buildOrderIdCandidates(rawId) {
  const id = (rawId ?? "").toString().trim();
  if (!id) return [];
  const set = new Set([id]);
  set.add(id.toUpperCase());
  set.add(id.toLowerCase());
  if (/^Z0YA-/i.test(id)) set.add(id.replace(/^Z0YA-/i, "ZOYA-"));
  if (/^ZOYA-/i.test(id)) set.add(id.replace(/^ZOYA-/i, "Z0YA-"));
  return Array.from(set).filter(Boolean);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!id && !phone) {
      return Response.json(
        { error: "Provide an order ID or phone number." },
        { status: 400 }
      );
    }

    const baseCols =
      "order_id, status, currency, total_price, shipping_fee, governorate, payment_method, items, created_at, updated_at";
    const fallbackCols =
      "order_id, status, currency, total_price, items, created_at";

    if (phone) {
      if (!PHONE_RE.test(phone)) {
        return Response.json(
          { error: "Please enter a valid Egyptian phone number." },
          { status: 400 }
        );
      }

      let { data, error } = await supabase
        .from("orders")
        .select(baseCols)
        .eq("phone", phone)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error && /(updated_at|shipping_fee|governorate|payment_method)/i.test(error.message ?? "")) {
        const retry = await supabase
          .from("orders")
          .select(fallbackCols)
          .eq("phone", phone)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false })
          .limit(20);
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Track phone lookup error:", error);
        return Response.json(
          { error: "Lookup failed", detail: error.message },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return Response.json(
          { error: "No orders found for that phone number." },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        orders: data.map(shapeOrder),
      });
    }

    if (!/^[A-Za-z0-9-]{4,40}$/.test(id)) {
      return Response.json({ error: "Invalid order id format" }, { status: 400 });
    }

    let { data, error } = await supabase
      .from("orders")
      .select(baseCols)
      .eq("order_id", id)
      .maybeSingle();

    if (error && /(updated_at|shipping_fee|governorate|payment_method)/i.test(error.message ?? "")) {
      const retry = await supabase
        .from("orders")
        .select(fallbackCols)
        .eq("order_id", id)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    // Some databases normalize order ids differently (case changes or O/0
    // prefix swaps). If the strict lookup misses, retry with safe variants.
    if (!error && !data) {
      const idCandidates = buildOrderIdCandidates(id);
      if (idCandidates.length > 1) {
        const fallbackByCandidates = await supabase
          .from("orders")
          .select(baseCols)
          .in("order_id", idCandidates)
          .order("created_at", { ascending: false })
          .limit(1);

        if (
          fallbackByCandidates.error &&
          /(updated_at|shipping_fee|governorate|payment_method)/i.test(
            fallbackByCandidates.error.message ?? ""
          )
        ) {
          const retry = await supabase
            .from("orders")
            .select(fallbackCols)
            .in("order_id", idCandidates)
            .order("created_at", { ascending: false })
            .limit(1);
          data = Array.isArray(retry.data) ? retry.data[0] ?? null : null;
          error = retry.error;
        } else {
          data = Array.isArray(fallbackByCandidates.data)
            ? fallbackByCandidates.data[0] ?? null
            : null;
          error = fallbackByCandidates.error;
        }
      }
    }

    if (error) {
      console.error("Track order error:", error);
      return Response.json(
        {
          error: "Lookup failed",
          detail: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        { error: "Order not found. Please double-check your ID." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      order: shapeOrder(data),
    });
  } catch (err) {
    console.error("Track order unexpected:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const id = body?.id?.toString().trim();
    const verifyPhone = body?.verify_phone?.toString().trim();

    if (!id || !verifyPhone) {
      return Response.json(
        { error: "Order ID and your original phone are required." },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9-]{4,40}$/.test(id)) {
      return Response.json({ error: "Invalid order id format" }, { status: 400 });
    }

    const idCandidates = buildOrderIdCandidates(id);
    const { data: existingRows, error: fetchErr } = await supabase
      .from("orders")
      .select(
        "id, order_id, customer_name, email, status, phone, address, items, governorate, shipping_fee, total_price, total_cost, profit, cost_complete, discount_code, discount_amount, payment_method"
      )
      .in("order_id", idCandidates)
      .order("created_at", { ascending: false })
      .limit(1);
    const existing = Array.isArray(existingRows) ? existingRows[0] ?? null : null;

    if (fetchErr) {
      console.error("Track patch lookup error:", fetchErr);
      return Response.json(
        { error: "Lookup failed", detail: fetchErr.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (existing.phone?.trim() !== verifyPhone) {
      return Response.json(
        { error: "Verification failed. The phone number doesn't match." },
        { status: 403 }
      );
    }

    const status = (existing.status ?? "pending").toLowerCase();
    if (status !== "pending") {
      return Response.json(
        {
          error:
            "This order can no longer be edited because it has been confirmed. Please contact support.",
        },
        { status: 409 }
      );
    }

    if (body.cancel === true) {
      const { error: cancelErr } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", existing.id);

      if (cancelErr) {
        console.error("Track cancel error:", cancelErr);
        return Response.json(
          { error: "Cancellation failed", detail: cancelErr.message },
          { status: 500 }
        );
      }

      postOrderSheetsWebhook("update", { ...existing, status: "cancelled" });

      await notifyCustomerTrackOrderChange(
        { ...existing, status: "cancelled" },
        "cancelled"
      );

      return Response.json({ success: true, cancelled: true });
    }

    const updates = {};
    const shippingFeesMap = await getShippingFeesMapCached();

    if (body.customer_name !== undefined) {
      const name = body.customer_name.toString().trim();
      const words = name.split(/\s+/).filter(Boolean);
      if (words.length < 2) {
        return Response.json(
          { error: "Please enter your full name (at least two words)." },
          { status: 400 }
        );
      }
      updates.customer_name = name;
    }

    if (body.phone !== undefined) {
      const newPhone = body.phone.toString().trim();
      if (!PHONE_RE.test(newPhone)) {
        return Response.json(
          { error: "Please enter a valid Egyptian phone number." },
          { status: 400 }
        );
      }
      updates.phone = newPhone;
    }

    if (body.address !== undefined) {
      const address = body.address.toString().trim();
      if (address.length <= 15) {
        return Response.json(
          { error: "Address must be at least 16 characters." },
          { status: 400 }
        );
      }
      updates.address = address;
    }

    if (body.governorate !== undefined) {
      const newGov = body.governorate.toString().trim();
      if (!isValidGovernorateInMap(shippingFeesMap, newGov)) {
        return Response.json(
          { error: "Please select a valid governorate." },
          { status: 400 }
        );
      }
      updates.governorate = newGov;
      let newShipping = getShippingFeeFromMap(shippingFeesMap, newGov);
      // Online payments get a -10 EGP shipping discount, mirroring the
      // order creation logic so totals stay consistent.
      if ((existing.payment_method ?? "").toLowerCase() === "online") {
        newShipping = Math.max(0, newShipping - 10);
      }
      updates.shipping_fee = newShipping;
    }

    let sanitizedItems = null;
    if (body.items !== undefined) {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return Response.json(
          { error: "Order must have at least one item." },
          { status: 400 }
        );
      }

      sanitizedItems = [];
      for (const raw of body.items) {
        const itemId = raw?.id?.toString();
        const name = raw?.name?.toString();
        const quantity = Math.max(1, Math.floor(Number(raw?.quantity) || 0));
        if (!itemId || !name || quantity < 1) {
          return Response.json(
            { error: "Invalid item data." },
            { status: 400 }
          );
        }
        sanitizedItems.push({
          id: itemId,
          name,
          image: raw?.image ?? null,
          color: raw?.color ?? null,
          size: raw?.size ?? null,
          // Price/cost are filled from Sanity below — never trust the client.
          price: 0,
          quantity,
          availableColors: Array.isArray(raw?.availableColors)
            ? raw.availableColors
            : [],
          availableSizes: Array.isArray(raw?.availableSizes)
            ? raw.availableSizes
            : [],
        });
      }

      // Re-fetch authoritative prices and costs from Sanity. The customer
      // can modify the cart in their browser, so we never trust client-sent
      // prices on edits.
      const priceMap = await getProductCostsByIds(
        sanitizedItems.map((it) => it.id)
      );
      if (priceMap === null) {
        return Response.json(
          { error: "Could not verify product prices. Please try again." },
          { status: 503 }
        );
      }

      for (const it of sanitizedItems) {
        const entry = priceMap[it.id];
        if (!entry || !Number.isFinite(Number(entry.price))) {
          return Response.json(
            { error: `Product not available: ${it.name}` },
            { status: 400 }
          );
        }
        it.price = Number(entry.price);
        const knownCost =
          typeof entry.cost === "number" && Number.isFinite(entry.cost);
        it.cost = knownCost ? Number(entry.cost) : 0;
        it.cost_known = !!knownCost;
      }

      updates.items = sanitizedItems;
    }

    // Recalculate totals/profit if either items or governorate changed.
    if (sanitizedItems !== null || updates.shipping_fee !== undefined) {
      const itemsForTotal =
        sanitizedItems ?? (Array.isArray(existing.items) ? existing.items : []);

      const itemsSubtotal = itemsForTotal.reduce(
        (sum, it) => sum + Number(it.price ?? 0) * Number(it.quantity ?? 0),
        0
      );

      const shippingForTotal =
        updates.shipping_fee !== undefined
          ? updates.shipping_fee
          : Number(existing.shipping_fee ?? 0);

      // Re-validate any existing discount against the new subtotal (e.g. if
      // the customer removed items the discount might exceed the subtotal).
      let discountAmount = Number(existing.discount_amount ?? 0) || 0;
      if (existing.discount_code) {
        const { data: discount } = await supabase
          .from("discount_codes")
          .select("discount_type, value, is_active")
          .eq("code", existing.discount_code)
          .maybeSingle();

        if (discount && discount.is_active) {
          const value = Number(discount.value) || 0;
          if (discount.discount_type === "percent") {
            discountAmount = Math.round((itemsSubtotal * value) / 100);
          } else if (discount.discount_type === "fixed") {
            discountAmount = Math.min(itemsSubtotal, value);
          }
          discountAmount = Math.max(
            0,
            Math.min(itemsSubtotal, discountAmount)
          );
        } else {
          discountAmount = 0;
        }
        updates.discount_amount = discountAmount;
      }

      updates.total_price = Math.max(
        0,
        itemsSubtotal + shippingForTotal - discountAmount
      );

      // Recompute cost-side fields when items changed (so the admin sees
      // accurate profit immediately on next refresh).
      if (sanitizedItems !== null) {
        const totalCost = sanitizedItems.reduce(
          (sum, it) => sum + Number(it.cost ?? 0) * Number(it.quantity ?? 0),
          0
        );
        const costComplete = sanitizedItems.every((it) => it.cost_known);
        updates.total_cost = totalCost;
        updates.cost_complete = costComplete;
        updates.profit = computeOrderProfit({
          ...existing,
          items: sanitizedItems,
          discount_amount: discountAmount,
          total_cost: totalCost,
        });
      } else if (existing.total_cost !== null && existing.total_cost !== undefined) {
        // Only shipping/discount changed — items (and therefore cost) are the
        // same; profit stays on products only (shipping excluded).
        updates.profit = computeOrderProfit({
          ...existing,
          discount_amount: discountAmount,
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "Nothing to update." },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", existing.id);

    if (updateErr) {
      console.error("Track patch update error:", updateErr);
      return Response.json(
        { error: "Update failed", detail: updateErr.message },
        { status: 500 }
      );
    }

    const { data: updated } = await supabase
      .from("orders")
      .select(
        "id, order_id, customer_name, email, phone, address, items, total_price, shipping_fee, discount_code, discount_amount, payment_method, status, created_at"
      )
      .eq("id", existing.id)
      .maybeSingle();

    if (updated) postOrderSheetsWebhook("update", updated);

    if (updated) {
      await notifyCustomerTrackOrderChange(updated, "updated");
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Track patch unexpected:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
