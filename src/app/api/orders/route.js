import { createClient } from "@supabase/supabase-js";
import { getShippingFee, isValidGovernorate } from "../../lib/shipping";
import { getProductCostsByIds } from "../../../sanity/lib/products";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // مهم جدًا (server only)
);

const PHONE_RE = /^01[0125][0-9]{8}$/;
const ALLOWED_PAYMENT_METHODS = new Set(["cash", "online"]);
const ALLOWED_STATUSES = new Set([
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

function isAuthorizedAdmin(req) {
  const adminPass =
    process.env.ADMIN_PASS || process.env.NEXT_PUBLIC_ADMIN_PASS;
  if (!adminPass) return false;
  const provided = req.headers.get("x-admin-pass");
  return provided === adminPass;
}

const generateOrderId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `Z0YA-${random}`;
};

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      address,
      governorate,
      payment_method,
      items,
      discount_code,
    } = body;

    if (!name || !phone || !address || !items?.length) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const trimmedName = name.toString().trim();
    if (trimmedName.split(/\s+/).filter(Boolean).length < 2) {
      return Response.json(
        { error: "Please enter your full name (at least two words)." },
        { status: 400 }
      );
    }

    const trimmedPhone = phone.toString().trim();
    if (!PHONE_RE.test(trimmedPhone)) {
      return Response.json(
        { error: "Please enter a valid Egyptian phone number." },
        { status: 400 }
      );
    }

    const trimmedAddress = address.toString().trim();
    if (trimmedAddress.length <= 15) {
      return Response.json(
        { error: "Address must be at least 16 characters." },
        { status: 400 }
      );
    }

    if (!isValidGovernorate(governorate)) {
      return Response.json(
        { error: "Please select a valid governorate." },
        { status: 400 }
      );
    }

    const paymentMethod = (payment_method || "cash").toString().toLowerCase();
    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return Response.json(
        { error: "Invalid payment method." },
        { status: 400 }
      );
    }

    const sanitizedItems = [];
    for (const raw of items) {
      const id = raw?.id?.toString();
      const itemName = raw?.name?.toString();
      const quantity = Math.max(1, Math.floor(Number(raw?.quantity) || 0));
      if (!id || !itemName || quantity < 1) {
        return Response.json(
          { error: "Invalid item data." },
          { status: 400 }
        );
      }
      sanitizedItems.push({
        id,
        name: itemName,
        image: raw?.image ?? null,
        color: raw?.color ?? null,
        size: raw?.size ?? null,
        price: 0,
        quantity,
        sold_quantity: quantity,
        availableColors: Array.isArray(raw?.availableColors) ? raw.availableColors : [],
        availableSizes: Array.isArray(raw?.availableSizes) ? raw.availableSizes : [],
      });
    }

    // The server is the source of truth for prices and costs.
    // Client-supplied prices are intentionally ignored — we always
    // re-fetch the authoritative price/cost from Sanity by product id.
    const priceMap = await getProductCostsByIds(sanitizedItems.map((it) => it.id));
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

    const costComplete = sanitizedItems.every((it) => it.cost_known);

    // Recalculate shipping server-side based on governorate + payment method.
    let shippingFee = getShippingFee(governorate);
    if (paymentMethod === "online") {
      shippingFee = Math.max(0, shippingFee - 10);
    }

    // Recalculate subtotal/cost from the server-trusted prices above.
    const itemsSubtotal = sanitizedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    const totalCost = sanitizedItems.reduce(
      (sum, it) => sum + it.cost * it.quantity,
      0
    );

    // Re-validate the discount code from the DB. Never trust the client.
    let appliedCode = null;
    let discountAmount = 0;
    if (typeof discount_code === "string" && discount_code.trim()) {
      const normalized = discount_code.trim().toUpperCase();
      const { data: discount } = await supabase
        .from("discount_codes")
        .select("code, discount_type, value, is_active, usage_limit, usage_count")
        .eq("code", normalized)
        .maybeSingle();

      if (!discount || !discount.is_active) {
        return Response.json(
          { error: "Invalid discount code" },
          { status: 400 }
        );
      }

      // Enforce global usage limit on the code.
      const usageLimit = Number(discount.usage_limit) || 0;
      const usageCount = Number(discount.usage_count) || 0;
      if (usageLimit > 0 && usageCount >= usageLimit) {
        return Response.json(
          {
            success: false,
            error: "This code reached its limit.",
          },
          { status: 400 }
        );
      }

      // Prevent the same phone number from reusing the same code.
      const { data: existingUsage } = await supabase
        .from("discount_usages")
        .select("id")
        .eq("code", discount.code)
        .eq("phone", trimmedPhone)
        .maybeSingle();

      if (existingUsage) {
        return Response.json(
          {
            success: false,
            error: "You already used this discount code.",
          },
          { status: 400 }
        );
      }

      appliedCode = discount.code;
      const value = Number(discount.value) || 0;
      if (discount.discount_type === "percent") {
        discountAmount = Math.round((itemsSubtotal * value) / 100);
      } else if (discount.discount_type === "fixed") {
        discountAmount = Math.min(itemsSubtotal, value);
      }
      discountAmount = Math.max(0, Math.min(itemsSubtotal, discountAmount));
    }

    // Final price the customer pays — computed entirely server-side.
    const totalPrice = Math.max(0, itemsSubtotal + shippingFee - discountAmount);
    const profit = itemsSubtotal - discountAmount - totalCost;

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: trimmedName,
          phone: trimmedPhone,
          address: trimmedAddress,
          governorate,
          payment_method: paymentMethod,
          shipping_fee: shippingFee,
          items: sanitizedItems,
          total_price: totalPrice,
          total_cost: totalCost,
          profit,
          cost_complete: costComplete,
          discount_code: appliedCode,
          discount_amount: discountAmount,
          status: "pending",
          order_id: generateOrderId(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Order insert error:", error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (appliedCode) {
      // We rely on a UNIQUE (code, phone) constraint in `discount_usages` as
      // the source of truth for "one code per phone" — this protects us from
      // race conditions that the earlier pre-check can't catch.
      const { error: usageError } = await supabase
        .from("discount_usages")
        .insert({
          code: appliedCode,
          phone: trimmedPhone,
          order_id: data.id,
        });

      if (usageError) {
        console.error("Discount usage insert error:", usageError);

        // Roll back the order so the customer doesn't get a discounted order
        // without the usage being recorded (which would let them reuse the code).
        const { error: rollbackError } = await supabase
          .from("orders")
          .delete()
          .eq("id", data.id);
        if (rollbackError) {
          console.error("Order rollback error:", rollbackError);
        }

        // Postgres unique violation
        const isDuplicate = usageError.code === "23505";
        return Response.json(
          {
            success: false,
            error: isDuplicate
              ? "You already used this discount code."
              : "Could not record discount usage. Please try again.",
          },
          { status: 400 }
        );
      }

      const { error: rpcError } = await supabase.rpc(
        "increment_discount_usage",
        { code_input: appliedCode }
      );
      if (rpcError) {
        console.error("increment_discount_usage RPC error:", rpcError);
      }
    }

    return Response.json({
      success: true,
      order: data,
    });

  } catch (err) {
    console.error("Order POST unexpected:", err);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("all")) {
      if (!isAuthorizedAdmin(req)) {
        return Response.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Orders GET (all) error:", error);
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return Response.json({ success: true, orders: data ?? [] });
    }

    return Response.json(
      { success: false, error: "Missing query parameter." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Orders GET unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const id = body?.id;
    const status = body?.status?.toString().toLowerCase().trim();

    if (!id) {
      return Response.json(
        { success: false, error: "Missing order id." },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return Response.json(
        { success: false, error: "Invalid status." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Order PATCH error:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, order: data });
  } catch (err) {
    console.error("Order PATCH unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
