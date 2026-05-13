import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  process.env.RESEND_FROM || "Zoya <hello@zoya-store.com>";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://zoya-store.com")
  .replace(/\/$/, "");
const LOGO_URL = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL || "";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function itemsSubtotal(items) {
  const list = Array.isArray(items) ? items : [];
  return list.reduce(
    (sum, it) => sum + Number(it.price ?? 0) * Number(it.quantity ?? 0),
    0
  );
}

function layoutEmail({ title, introHtml, orderId, customerName, innerHtml }) {
  const safeName = (customerName || "").toString().split(/\s+/)[0] || "there";
  const trackUrl = `${SITE_URL}/track?id=${encodeURIComponent(orderId)}`;
  const brandHeader = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="ZOYA" style="height:32px; display:block; margin:0 auto;" />`
    : `<div style="font-size:22px; font-weight:900; letter-spacing:6px; color:#fff;">ZØYA</div>`;

  return `
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
                <div style="margin-top:14px; color:#444; line-height:1.6; font-size:14px;">${introHtml}</div>
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
            ${innerHtml}
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
}

function buildUpdatedHtml(order) {
  const orderId = order?.order_id ?? "";
  const items = Array.isArray(order?.items) ? order.items : [];
  const subtotal = itemsSubtotal(items);
  const shippingFee = Number(order?.shipping_fee ?? 0) || 0;
  const discountAmount = Number(order?.discount_amount ?? 0) || 0;
  const discountCode = order?.discount_code?.toString?.() ?? "";
  const total = Number(order?.total_price ?? 0) || 0;
  const paymentMethod = (order?.payment_method ?? "").toLowerCase();
  const paymentLabel =
    paymentMethod === "online" ? "InstaPay / Wallet" : "Cash on Delivery";

  const itemsHtml = items
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
          <td style="padding:12px 8px; color:#222; border-bottom:1px solid #f0f0f0; vertical-align:top;">
            <div style="font-weight:600;">${escapeHtml(item?.name)}</div>
            ${variant ? `<div style="font-size:11px; color:#888; margin-top:2px;">${variant}</div>` : ""}
          </td>
          <td style="padding:12px 8px; text-align:center; color:#444; border-bottom:1px solid #f0f0f0;">${qty}</td>
          <td style="padding:12px 8px; text-align:right; color:#222; font-weight:600; border-bottom:1px solid #f0f0f0;">${formatMoney(lineTotal)} EGP</td>
        </tr>`;
    })
    .join("");

  const discountRow =
    discountAmount > 0
      ? `
                  <tr>
                    <td style="padding:6px 0; color:#FF4DA3; font-size:14px;">Discount${discountCode ? ` (${escapeHtml(discountCode)})` : ""}</td>
                    <td style="padding:6px 0; text-align:right; color:#FF4DA3; font-size:14px;">− ${formatMoney(discountAmount)} EGP</td>
                  </tr>`
      : "";

  const innerHtml = `
            <tr>
              <td style="padding:20px 36px 0;">
                <p style="margin:0 0 12px; color:#555; font-size:13px;">Here is your updated order summary:</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; border-collapse:collapse;">
                  <thead>
                    <tr style="border-bottom:2px solid #222;">
                      <th align="left" style="padding:8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#888;">Item</th>
                      <th align="center" style="padding:8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#888;">Qty</th>
                      <th align="right" style="padding:8px; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#888;">Line</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
              </td>
            </tr>
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
                    <td style="padding:6px 0; color:#666;">Payment</td>
                    <td style="padding:6px 0; text-align:right; color:#222;">${escapeHtml(paymentLabel)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:6px 0;"><div style="border-top:1px dashed #ddd;"></div></td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-weight:700; font-size:16px; color:#000;">Total</td>
                    <td style="padding:8px 0; text-align:right; font-weight:700; font-size:16px; color:#000;">${formatMoney(total)} EGP</td>
                  </tr>
                </table>
              </td>
            </tr>`;

  return layoutEmail({
    title: "Your order was updated",
    introHtml: `<p style="color:#333; line-height:1.6; margin:0;">We saved your changes while your order is still pending. If anything looks wrong, reply to this email or contact support.</p>`,
    orderId,
    customerName: order?.customer_name,
    innerHtml,
  });
}

function buildCancelledViaTrackHtml(order) {
  const orderId = order?.order_id ?? "";
  return layoutEmail({
    title: "Order cancelled",
    introHtml: `<p style="color:#333; line-height:1.6; margin:0;">Your order has been cancelled as you requested. If you did not cancel this order, please contact us right away.</p>`,
    orderId,
    customerName: order?.customer_name,
    innerHtml: "",
  });
}

/**
 * Notify the customer after they edit or cancel a pending order from /track.
 * Failures are logged only; never throws.
 */
export async function notifyCustomerTrackOrderChange(order, kind, opts = {}) {
  const { timeoutMs = 8000 } = opts;
  const to = order?.email?.toString?.().trim()?.toLowerCase();
  if (!to || !EMAIL_RE.test(to)) return;

  if (!resend) {
    console.warn(
      "[track-order-email] RESEND_API_KEY missing — skipping customer email."
    );
    return;
  }

  const html =
    kind === "cancelled"
      ? buildCancelledViaTrackHtml(order)
      : buildUpdatedHtml(order);
  const subject =
    kind === "cancelled"
      ? "Your Order has been Cancelled"
      : "Your order was updated";

  const meta = { to, subject };
  try {
    const sendPromise = resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      replyTo: "support@zoya-store.com",
      html,
      headers: {
        "X-Entity-Ref-ID": String(order?.order_id || order?.id || ""),
        "List-Unsubscribe": "<mailto:unsubscribe@zoya-store.com>",
      },
    });
    const result = await Promise.race([
      sendPromise,
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              data: null,
              error: new Error(
                `Timed out after ${timeoutMs}ms while sending email`
              ),
            }),
          timeoutMs
        )
      ),
    ]);

    if (result?.error) {
      console.error(
        `[track-order-email] Resend failed meta=${safeJson(meta)} err=${safeJson(
          {
            name: result.error?.name,
            message: result.error?.message,
            statusCode: result.error?.statusCode ?? null,
          }
        )}`
      );
    } else {
      console.log("[track-order-email] Email queued:", meta, result?.data?.id);
    }
    return result;
  } catch (err) {
    console.error(
      `[track-order-email] Resend threw meta=${safeJson(meta)} err=${safeJson({
        name: err?.name,
        message: err?.message,
      })}`
    );
  }
}
