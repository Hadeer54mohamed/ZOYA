import { Resend } from "resend";
import { getSubscribers } from "../_lib/subscribers";
import { getLatestProduct } from "../../../../sanity/lib/products";
import {
  buildAutomaticDropHtml,
  sendNewsletterEmailsInBatches,
} from "../_lib/sendNewsletterBatches";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_NEWSLETTER =
  process.env.RESEND_FROM_NEWSLETTER ||
  process.env.RESEND_FROM ||
  "ZOYA <order@zoya-store.com>";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://zoya-store.com"
).replace(/\/$/, "");

export async function POST(req) {
  try {
    const adminPass = req.headers.get("x-admin-pass");
    if (process.env.ADMIN_PASS && adminPass !== process.env.ADMIN_PASS) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resend) {
      return Response.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const product = await getLatestProduct();
    const subscribers = await getSubscribers();

    if (!product || subscribers.length === 0) {
      return Response.json({ error: "No data" }, { status: 400 });
    }

    const productUrl = `${SITE_URL}/product/${encodeURIComponent(product.id)}`;
    const subject = `🔥 New Drop: ${product.name}`;
    const html = buildAutomaticDropHtml(product, productUrl);

    const result = await sendNewsletterEmailsInBatches(resend, {
      subscribers,
      from: FROM_NEWSLETTER,
      subject,
      html,
      batchSize: 50,
      maxAttemptsPerBatch: 6,
      logPrefix: "[newsletter/send]",
    });

    return Response.json({
      ...result,
      product: product.name,
      url: productUrl,
    });
  } catch (err) {
    console.error("[newsletter/send] Unexpected error:", err);
    return Response.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
