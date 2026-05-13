import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  getShippingFeeFromMap,
  isValidGovernorateInMap,
} from "../../lib/shipping";
import { getShippingFeesMapCached } from "../../../sanity/lib/shippingFees";
import {
  getProductCostsByIds,
  reserveStock,
  restoreStock,
} from "../../../sanity/lib/products";
import { postOrderSheetsWebhook } from "../../../lib/ordersSheetsWebhook";
import { sendOrderToSheet } from "../../../lib/sendOrderToSheet";
import { computeDiscountAmountEgp } from "../../lib/discountAmount";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_ADDRESS = process.env.RESEND_FROM || "Zoya <hello@zoya-store.com>";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://zoya-store.com"
).replace(/\/$/, "");
const LOGO_URL = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL || "";
const PHONE_RE = /^01[0125][0-9]{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_PAYMENT_METHODS = new Set(["cash", "online"]);
const ALLOWED_STATUSES = new Set([
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

function safeJson(value) {
  try {
    return JSON.stringify(value, (k, v) => {
      if (v instanceof Error) {
        return {
          name: v.name,
          message: v.message,
          statusCode: v.statusCode,
        };
      }
      return v;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return "[unserializable]";
    }
  }
}

// Fire-and-forget email helper. Email failures must NEVER break the order flow.
async function sendEmailSafe(payload, { timeoutMs = 8000 } = {}) {
  if (!resend) {
    console.warn("[orders] RESEND_API_KEY missing — skipping email.");
    return;
  }

  const meta = {
    to: payload?.to,
    subject: payload?.subject,
  };

  try {
    const sendPromise = resend.emails.send({ from: FROM_ADDRESS, ...payload });
    const result = await Promise.race([
      sendPromise,
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              data: null,
              error: new Error(
                `Timed out after ${timeoutMs}ms while sending email`,
              ),
            }),
          timeoutMs,
        ),
      ),
    ]);

    if (result?.error) {
      const errInfo = {
        name: result.error?.name,
        message: result.error?.message,
        statusCode: result.error?.statusCode ?? null,
        cause: result.error?.cause ? String(result.error.cause) : null,
      };
      console.error(
        `[orders] Resend send failed meta=${safeJson(meta)} err=${safeJson(errInfo)}`,
      );
    } else {
      console.log("[orders] Email queued:", meta, result?.data?.id);
    }
    return result;
  } catch (err) {
    const errInfo = {
      name: err?.name,
      message: err?.message,
      statusCode: err?.statusCode ?? null,
      cause: err?.cause ? String(err.cause) : null,
    };
    console.error(
      `[orders] Resend threw meta=${safeJson(meta)} err=${safeJson(errInfo)}`,
    );
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-US");
}

function formatDate(d) {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildOrderConfirmedHtml({
  orderId,
  customerName,
  items,
  subtotal,
  shippingFee,
  discountAmount,
  discountCode,
  total,
  paymentMethod,
  createdAt,
}) {
  const safeName = (customerName || "").toString().split(/\s+/)[0] || "there";
  const safeItems = Array.isArray(items) ? items : [];
  const paymentLabel =
    paymentMethod === "online" ? "InstaPay / Wallet" : "Cash on Delivery";
  const trackUrl = `${SITE_URL}/track?id=${encodeURIComponent(orderId)}`;

  const itemsHtml = safeItems
    .map((item) => {
      const qty = Number(item?.quantity) || 1;
      const price = Number(item?.price) || 0;
      const lineTotal = price * qty;
      const variant = [item?.color?.name, item?.size]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" / ");
      return `
        <tr>
          <td style="padding:14px 8px; color:#222; border-bottom:1px solid #f0f0f0; vertical-align:top;">
            <div style="font-weight:600;">${escapeHtml(item?.name)}</div>
            ${variant ? `<div style="font-size:11px; color:#888; margin-top:2px;">${variant}</div>` : ""}
          </td>
          <td style="padding:14px 8px; text-align:center; color:#444; border-bottom:1px solid #f0f0f0; vertical-align:top;">${qty}</td>
          <td style="padding:14px 8px; text-align:right; color:#444; border-bottom:1px solid #f0f0f0; vertical-align:top;">${formatMoney(price)} EGP</td>
          <td style="padding:14px 8px; text-align:right; color:#222; font-weight:600; border-bottom:1px solid #f0f0f0; vertical-align:top;">${formatMoney(lineTotal)} EGP</td>
        </tr>`;
    })
    .join("");

  const brandHeader = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="ZOYA" style="height:36px; display:block; margin:0 auto;" />`
    : `<div style="font-size:24px; font-weight:900; letter-spacing:6px; color:#fff;">ZØYA</div>`;

  const discountRow =
    Number(discountAmount) > 0
      ? `
                  <tr>
                    <td style="padding:6px 0; color:#FF4DA3; font-size:14px;">Discount${discountCode ? ` (${escapeHtml(discountCode)})` : ""}</td>
                    <td style="padding:6px 0; text-align:right; color:#FF4DA3; font-size:14px;">− ${formatMoney(discountAmount)} EGP</td>
                  </tr>`
      : "";

  return `
  <div style="margin:0; padding:0; background:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
      <tr>
        <td align="center">

          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.06);">

            <!-- Brand header -->
            <tr>
              <td style="background:#000; padding:28px; text-align:center;">
                ${brandHeader}
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="padding:36px 36px 8px;">
                <h1 style="color:#FF4DA3; margin:0 0 6px; font-size:26px;">Order Confirmed 🎉</h1>
                <p style="color:#444; line-height:1.6; margin:0; font-size:15px;">
                  Hi ${escapeHtml(safeName)}, thanks for shopping with ZOYA. Your order is confirmed and is being prepared with care.
                </p>
              </td>
            </tr>

            <!-- Order info box -->
            <tr>
              <td style="padding:24px 36px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa; border:1px solid #eee; border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; color:#555;">
                        <tr>
                          <td style="padding:4px 0; color:#888;">Order ID</td>
                          <td style="padding:4px 0; text-align:right; color:#222; font-weight:600; font-family:monospace;">#${escapeHtml(orderId)}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0; color:#888;">Date</td>
                          <td style="padding:4px 0; text-align:right; color:#222;">${escapeHtml(formatDate(createdAt))}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0; color:#888;">Payment</td>
                          <td style="padding:4px 0; text-align:right; color:#222;">${paymentLabel}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Items table -->
            <tr>
              <td style="padding:24px 36px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; border-collapse:collapse;">
                  <thead>
                    <tr style="border-bottom:2px solid #222;">
                      <th align="left" style="padding:10px 8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#888;">Item</th>
                      <th align="center" style="padding:10px 8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#888;">Qty</th>
                      <th align="right" style="padding:10px 8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#888;">Price</th>
                      <th align="right" style="padding:10px 8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#888;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </td>
            </tr>

            <!-- Totals breakdown -->
            <tr>
              <td style="padding:8px 36px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr>
                    <td style="padding:6px 0; color:#666;">Subtotal</td>
                    <td style="padding:6px 0; text-align:right; color:#222;">${formatMoney(subtotal)} EGP</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#666;">Shipping</td>
                    <td style="padding:6px 0; text-align:right; color:#222;">${formatMoney(shippingFee)} EGP</td>
                  </tr>${discountRow}
                  <tr>
                    <td colspan="2" style="padding:6px 0;"><div style="border-top:1px dashed #ddd;"></div></td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-weight:700; font-size:16px; color:#000;">Total</td>
                    <td style="padding:8px 0; text-align:right; font-weight:700; font-size:16px; color:#000;">${formatMoney(total)} EGP</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:30px 36px 8px; text-align:center;">
                <a href="${trackUrl}"
                   style="display:inline-block; padding:14px 36px; background:#FF4DA3; color:#fff; text-decoration:none; border-radius:999px; font-size:13px; letter-spacing:1.5px; font-weight:bold; text-transform:uppercase;">
                  Track your order
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 36px 32px; text-align:center; color:#999; font-size:11px; line-height:1.6;">
                We'll notify you again once your order is on the way.<br/>
                © ${new Date().getFullYear()} ZOYA — All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>`;
}

function buildStatusUpdateEmail(status, { orderId, customerName }) {
  const safeName = (customerName || "").toString().split(/\s+/)[0] || "there";
  const trackUrl = `${SITE_URL}/track?id=${encodeURIComponent(orderId)}`;
  const brandHeader = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="ZOYA" style="height:32px; display:block; margin:0 auto;" />`
    : `<div style="font-size:22px; font-weight:900; letter-spacing:6px; color:#fff;">ZØYA</div>`;

  const wrap = (title, body) => `
  <div style="margin:0; padding:0; background:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:40px 0; font-family:Arial, Helvetica, sans-serif;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:#000; padding:24px; text-align:center;">${brandHeader}</td>
            </tr>
            <tr>
              <td style="padding:36px 36px 8px;">
                <h1 style="color:#FF4DA3; margin:0 0 10px; font-size:24px;">${title}</h1>
                <p style="color:#333; line-height:1.6; margin:0; font-size:15px;">Hi ${escapeHtml(safeName)},</p>
                <div style="margin-top:14px; color:#444; line-height:1.6; font-size:14px;">${body}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 36px 0;">
                <div style="background:#fafafa; border:1px solid #eee; border-radius:10px; padding:14px 18px; font-size:13px; color:#555;">
                  <span style="color:#888;">Order ID:</span>
                  <b style="color:#222; font-family:monospace;">#${escapeHtml(orderId)}</b>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 36px 8px; text-align:center;">
                <a href="${trackUrl}"
                   style="display:inline-block; padding:14px 36px; background:#FF4DA3; color:#fff; text-decoration:none; border-radius:999px; font-size:13px; letter-spacing:1.5px; font-weight:bold; text-transform:uppercase;">
                  Track your order
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 32px; text-align:center; color:#999; font-size:11px; line-height:1.6;">
                © ${new Date().getFullYear()} ZOYA — All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  switch (status) {
    case "confirmed":
      return {
        subject: "Your Order is Confirmed 🖤",
        html: wrap(
          "Order Confirmed 🎉",
          `<p style="color:#333; line-height:1.6;">Your order has been confirmed and is being prepared.</p>`,
        ),
      };
    case "shipped":
      return {
        subject: "Your Order is on the way 🚚",
        html: wrap(
          "On the way 🚚",
          `<p style="color:#333; line-height:1.6;">Your order has been shipped! It should arrive soon.</p>`,
        ),
      };
    case "delivered":
      return {
        subject: "Your Order has been Delivered 📦",
        html: wrap(
          "Delivered 📦",
          `<p style="color:#333; line-height:1.6;">Your order was delivered. We hope you love it!</p>`,
        ),
      };
    case "cancelled":
      return {
        subject: "Your Order has been Cancelled",
        html: wrap(
          "Order Cancelled",
          `<p style="color:#333; line-height:1.6;">Your order was cancelled. If this wasn't expected, please contact us.</p>`,
        ),
      };
    default:
      return null;
  }
}

function isAuthorizedAdmin(req) {
  const adminPass = process.env.ADMIN_PASS;
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
      email,
      address,
      governorate,
      payment_method,
      items,
      discount_code,
      sender_number,
      transaction_reference,
      payment_proof_url,
      instapay_transfer_confirmed,
    } = body;

    if (!name || !phone || !address || !items?.length) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const trimmedName = name.toString().trim();
    if (trimmedName.split(/\s+/).filter(Boolean).length < 2) {
      return Response.json(
        { error: "Please enter your full name (at least two words)." },
        { status: 400 },
      );
    }

    const trimmedPhone = phone.toString().trim();
    if (!PHONE_RE.test(trimmedPhone)) {
      return Response.json(
        { error: "Please enter a valid Egyptian phone number." },
        { status: 400 },
      );
    }

    const emailRaw =
      email === null || email === undefined ? "" : email.toString().trim();
    const trimmedEmail = emailRaw === "" ? null : emailRaw.toLowerCase();
    if (trimmedEmail !== null && !EMAIL_RE.test(trimmedEmail)) {
      return Response.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const trimmedAddress = address.toString().trim();
    if (trimmedAddress.length <= 15) {
      return Response.json(
        { error: "Address must be at least 16 characters." },
        { status: 400 },
      );
    }

    const trimmedGovernorate =
      typeof governorate === "string"
        ? governorate.trim()
        : String(governorate ?? "").trim();

    const shippingFeesMap = await getShippingFeesMapCached();
    if (!isValidGovernorateInMap(shippingFeesMap, trimmedGovernorate)) {
      return Response.json(
        { error: "Please select a valid governorate." },
        { status: 400 },
      );
    }

    const paymentMethod = (payment_method || "cash").toString().toLowerCase();
    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return Response.json(
        { error: "Invalid payment method." },
        { status: 400 },
      );
    }

    if (paymentMethod === "online") {
      if (instapay_transfer_confirmed !== true) {
        return Response.json(
          {
            error:
              "Please confirm you completed the InstaPay transfer before placing the order.",
          },
          { status: 400 },
        );
      }
      const sender = sender_number != null ? String(sender_number).trim() : "";
      if (!sender) {
        return Response.json(
          {
            error:
              "Transfer sender phone number is required for online (InstaPay) orders.",
          },
          { status: 400 },
        );
      }
    }

    const sanitizedItems = [];
    for (const raw of items) {
      const id = raw?.id?.toString();
      const itemName = raw?.name?.toString();
      const quantity = Math.max(1, Math.floor(Number(raw?.quantity) || 0));
      if (!id || !itemName || quantity < 1) {
        return Response.json({ error: "Invalid item data." }, { status: 400 });
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
        availableColors: Array.isArray(raw?.availableColors)
          ? raw.availableColors
          : [],
        availableSizes: Array.isArray(raw?.availableSizes)
          ? raw.availableSizes
          : [],
      });
    }

    // The server is the source of truth for prices and costs.
    // Client-supplied prices are intentionally ignored — we always
    // re-fetch the authoritative price/cost from Sanity by product id.
    const priceMap = await getProductCostsByIds(
      sanitizedItems.map((it) => it.id),
    );
    if (priceMap === null) {
      return Response.json(
        { error: "Could not verify product prices. Please try again." },
        { status: 503 },
      );
    }

    for (const it of sanitizedItems) {
      const entry = priceMap[it.id];
      if (!entry || !Number.isFinite(Number(entry.price))) {
        return Response.json(
          { error: `Product not available: ${it.name}` },
          { status: 400 },
        );
      }
      it.price = Number(entry.price);
      const knownCost =
        typeof entry.cost === "number" && Number.isFinite(entry.cost);
      it.cost = knownCost ? Number(entry.cost) : 0;
      it.cost_known = !!knownCost;
    }

    const costComplete = sanitizedItems.every((it) => it.cost_known);

    // Recalculate shipping server-side based on governorate.
    const shippingFee = getShippingFeeFromMap(
      shippingFeesMap,
      trimmedGovernorate,
    );

    // Recalculate subtotal/cost from the server-trusted prices above.
    const itemsSubtotal = sanitizedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0,
    );
    const totalCost = sanitizedItems.reduce(
      (sum, it) => sum + it.cost * it.quantity,
      0,
    );

    // Re-validate the discount code from the DB. Never trust the client.
    let appliedCode = null;
    let discountAmount = 0;
    if (typeof discount_code === "string" && discount_code.trim()) {
      const normalized = discount_code.trim().toUpperCase();
      const { data: discount } = await supabase
        .from("discount_codes")
        .select(
          "code, discount_type, value, is_active, usage_limit, usage_count",
        )
        .eq("code", normalized)
        .maybeSingle();

      if (!discount || !discount.is_active) {
        return Response.json(
          { error: "Invalid discount code" },
          { status: 400 },
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
          { status: 400 },
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
          { status: 400 },
        );
      }

      appliedCode = discount.code;
      discountAmount = computeDiscountAmountEgp(discount, itemsSubtotal);
    }

    // Final price the customer pays — computed entirely server-side.
    const totalPrice = Math.max(
      0,
      itemsSubtotal + shippingFee - discountAmount,
    );
    const profit = itemsSubtotal - discountAmount - totalCost;

    // Reserve (decrement) stock for tracked products. We intentionally do NOT
    // refuse the order if a variant goes out of stock — the customer always
    // gets confirmed. Any depleted/oversold/missing variants come back as
    // `alerts` so we can flag the order for the admin dashboard.
    const stockResult = await reserveStock(
      sanitizedItems.map((it) => ({
        id: it.id,
        name: it.name,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
      })),
    );
    if (!stockResult.ok) {
      // Only infrastructure failures (Sanity fetch/commit error) end up here.
      // Log loudly but still let the order go through so the customer isn't
      // blocked by our backend hiccup; the admin will reconcile stock by hand.
      console.error(
        "[orders] reserveStock infrastructure failure — proceeding with order without decrementing stock:",
        stockResult.code,
        stockResult.error,
      );
    }
    const stockAlerts = Array.isArray(stockResult.alerts)
      ? stockResult.alerts
      : [];
    if (stockAlerts.length > 0) {
      // The admin dashboard reads live stock from Sanity, so we don't persist
      // these alerts on the order. A console line gives us a paper trail in
      // server logs in case anyone needs to trace which order tipped a
      // variant negative.
      console.warn(
        "[orders] stock alerts triggered by this order:",
        stockAlerts,
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          address: trimmedAddress,
          governorate: trimmedGovernorate,
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
          sender_number: sender_number || null,
          transaction_reference: transaction_reference || null,
          payment_proof_url: payment_proof_url || null,
          payment_verified: paymentMethod === "online",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Order insert error:", error);
      // Stock was already decremented in Sanity but the order didn't land in
      // Supabase. Loud log so the admin can manually reconcile the affected
      // products — restoring stock automatically would need a second mutation
      // that could itself fail and is risky to chain here.
      if (stockResult.applied?.length) {
        console.error(
          "[orders] STOCK MISMATCH: stock was decremented but the order was not saved. Affected applies:",
          stockResult.applied,
        );
      }
      return Response.json({ error: error.message }, { status: 500 });
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
          { status: 400 },
        );
      }

      const { error: rpcError } = await supabase.rpc(
        "increment_discount_usage",
        { code_input: appliedCode },
      );
      if (rpcError) {
        console.error("increment_discount_usage RPC error:", rpcError);
      }
    }

    // Email should not block the order, but we still capture the outcome in dev.
    let emailResult;
    if (trimmedEmail) {
      emailResult = await sendEmailSafe({
        to: trimmedEmail,
        subject: "Order Confirmation",
        replyTo: "support@zoya-store.com",
        headers: {
          // Keep a stable entity id for threading/dedup on the provider side.
          "X-Entity-Ref-ID": String(data.order_id || data.id),
          "List-Unsubscribe": "<mailto:unsubscribe@zoya-store.com>",
        },
        html: buildOrderConfirmedHtml({
          orderId: data.order_id || data.id,
          customerName: trimmedName,
          items: sanitizedItems,
          subtotal: itemsSubtotal,
          shippingFee,
          discountAmount,
          discountCode: appliedCode,
          total: totalPrice,
          paymentMethod,
          createdAt: data.created_at,
        }),
      });
    }
    const sheetSync = await sendOrderToSheet(data);
    if (!sheetSync.ok) {
      console.warn(
        "[orders] Google Sheet sync did not succeed — check GOOGLE_SHEET_WEBHOOK_URL and Apps Script doPost. Result:",
        sheetSync,
      );
    }

    return Response.json({
      success: true,
      order: data,
      ...(process.env.NODE_ENV !== "production"
        ? {
            email: {
              to: trimmedEmail,
              skipped: !trimmedEmail,
              id: emailResult?.data?.id ?? null,
              error: emailResult?.error
                ? {
                    name: emailResult.error?.name,
                    message: emailResult.error?.message,
                    statusCode: emailResult.error?.statusCode ?? null,
                  }
                : null,
            },
            sheet: sheetSync,
          }
        : {}),
    });
  } catch (err) {
    console.error("Order POST unexpected:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("all")) {
      if (!isAuthorizedAdmin(req)) {
        return Response.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
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
          { status: 500 },
        );
      }

      return Response.json({ success: true, orders: data ?? [] });
    }

    return Response.json(
      { success: false, error: "Missing query parameter." },
      { status: 400 },
    );
  } catch (err) {
    console.error("Orders GET unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const id = body?.id;
    const status = body?.status?.toString().toLowerCase().trim();

    if (!id) {
      return Response.json(
        { success: false, error: "Missing order id." },
        { status: 400 },
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return Response.json(
        { success: false, error: "Invalid status." },
        { status: 400 },
      );
    }

    // Read the current status & items first so we know whether stock needs
    // to be restored (cancelled) or re-reserved (un-cancelled), and so we
    // only email when the status actually changes.
    const { data: existing } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const previousStatus = existing?.status || null;
    const wasCancelled = previousStatus === "cancelled";
    const willBeCancelled = status === "cancelled";

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
        { status: 500 },
      );
    }

    // Stock reconciliation when crossing the cancelled boundary.
    // Going INTO cancelled: restore the units we'd previously reserved.
    // Coming OUT of cancelled (e.g. reopen as pending): re-reserve them, but
    // don't fail the status change if stock is gone now — log instead so the
    // admin can fix manually.
    const orderItems = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(existing?.items)
        ? existing.items
        : [];

    if (!wasCancelled && willBeCancelled && orderItems.length > 0) {
      const result = await restoreStock(orderItems);
      if (!result.ok) {
        console.error(
          "[orders PATCH] restoreStock failed for order",
          data.order_id || data.id,
          result,
        );
      }
    } else if (wasCancelled && !willBeCancelled && orderItems.length > 0) {
      const result = await reserveStock(orderItems);
      if (!result.ok) {
        console.warn(
          "[orders PATCH] could not re-reserve stock when re-opening order",
          data.order_id || data.id,
          result,
        );
      }
    }

    const statusChanged = previousStatus !== status;
    if (statusChanged && data?.email) {
      const tpl = buildStatusUpdateEmail(status, {
        orderId: data.order_id || data.id,
        customerName: data.customer_name,
      });
      if (tpl) {
        await sendEmailSafe({
          to: data.email,
          subject: tpl.subject,
          replyTo: "support@zoya-store.com",
          headers: {
            "X-Entity-Ref-ID": String(data.order_id || data.id),
            "List-Unsubscribe": "<mailto:unsubscribe@zoya-store.com>",
          },
          html: tpl.html,
        });
      }
    }
    postOrderSheetsWebhook("update", data);

    return Response.json({ success: true, order: data });
  } catch (err) {
    console.error("Order PATCH unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    const orderId = body?.order_id?.toString?.().trim();

    if (!id && !orderId) {
      return Response.json(
        { success: false, error: "Missing order id." },
        { status: 400 },
      );
    }

    let query = supabase
      .from("orders")
      .select(
        "id, order_id, customer_name, phone, address, items, total_price, payment_method, status, discount_code",
      );

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("order_id", orderId);
    }

    const { data: existing, error: fetchErr } = await query.maybeSingle();

    if (fetchErr) {
      console.error("Order DELETE lookup error:", fetchErr);
      return Response.json(
        { success: false, error: fetchErr.message },
        { status: 500 },
      );
    }

    if (!existing) {
      return Response.json(
        { success: false, error: "Order not found." },
        { status: 404 },
      );
    }

    // If the order is being deleted, undo its reserved stock first (best-effort).
    // This prevents "oversold" alerts if an admin deletes orders instead of
    // cancelling them. If it was already cancelled, stock should already be
    // restored in PATCH.
    try {
      const items = Array.isArray(existing?.items) ? existing.items : [];
      if (existing.status !== "cancelled" && items.length > 0) {
        const result = await restoreStock(items);
        if (!result?.ok) {
          console.error(
            "[orders DELETE] restoreStock failed for order",
            existing.order_id || existing.id,
            result,
          );
        }
      }
    } catch (err) {
      console.error(
        "[orders DELETE] restoreStock threw for order",
        existing.order_id || existing.id,
        err,
      );
    }

    // If this order used a discount, remove its usage record so the same phone
    // can use the code again after a full admin delete. Then decrement the
    // code-level usage counter to keep global limits consistent.
    if (existing.discount_code) {
      let usageRow = null;
      const { data: usageByOrder } = await supabase
        .from("discount_usages")
        .select("id")
        .eq("order_id", existing.id)
        .maybeSingle();
      usageRow = usageByOrder ?? null;

      if (!usageRow && existing.phone) {
        const { data: usageByCodePhone } = await supabase
          .from("discount_usages")
          .select("id")
          .eq("code", existing.discount_code)
          .eq("phone", existing.phone)
          .maybeSingle();
        usageRow = usageByCodePhone ?? null;
      }

      if (usageRow?.id) {
        const { error: usageDeleteErr } = await supabase
          .from("discount_usages")
          .delete()
          .eq("id", usageRow.id);
        if (usageDeleteErr) {
          console.error(
            "[orders DELETE] discount usage delete error:",
            usageDeleteErr,
          );
        } else {
          const { data: discountRow } = await supabase
            .from("discount_codes")
            .select("usage_count")
            .eq("code", existing.discount_code)
            .maybeSingle();
          if (discountRow) {
            const nextCount = Math.max(
              0,
              Number(discountRow.usage_count || 0) - 1,
            );
            const { error: discountUpdateErr } = await supabase
              .from("discount_codes")
              .update({ usage_count: nextCount })
              .eq("code", existing.discount_code);
            if (discountUpdateErr) {
              console.error(
                "[orders DELETE] discount usage_count decrement error:",
                discountUpdateErr,
              );
            }
          }
        }
      }
    }

    let delQuery = supabase.from("orders").delete();
    if (id) {
      delQuery = delQuery.eq("id", id);
    } else {
      delQuery = delQuery.eq("order_id", orderId);
    }

    const { error: deleteErr } = await delQuery;
    if (deleteErr) {
      console.error("Order DELETE error:", deleteErr);
      return Response.json(
        { success: false, error: deleteErr.message },
        { status: 500 },
      );
    }
    postOrderSheetsWebhook("delete", existing);

    return Response.json({ success: true });
  } catch (err) {
    console.error("Order DELETE unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
