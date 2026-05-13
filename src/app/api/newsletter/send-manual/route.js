import { Resend } from "resend";
import { getSubscribers } from "../_lib/subscribers";
import {
  getLatestProduct,
  getProductForNewsletterBySlug,
} from "../../../../sanity/lib/products";
import { buildDropSubject, buildManualDropHtml } from "../_lib/newsletterDropHtml";
import { parseNewsletterPostBody, pickNewsletterProductSlug } from "../_lib/parseNewsletterPostBody";
import { sendNewsletterEmailsInBatches } from "../_lib/sendNewsletterBatches";

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

    const body = await parseNewsletterPostBody(req);
    const slug = pickNewsletterProductSlug(body);
    const product = slug
      ? await getProductForNewsletterBySlug(slug)
      : await getLatestProduct();
    const subscribers = await getSubscribers();

    if (!product) {
      return Response.json(
        { error: slug ? "Product not found" : "No product" },
        { status: slug ? 404 : 400 }
      );
    }
    if (subscribers.length === 0) {
      return Response.json({ error: "No subscribers" }, { status: 400 });
    }

    const productUrl = `${SITE_URL}/product/${encodeURIComponent(product.id)}`;
    const subject = buildDropSubject(product.name, { manual: true });
    const html = buildManualDropHtml(product, productUrl);

    const result = await sendNewsletterEmailsInBatches(resend, {
      subscribers,
      from: FROM_NEWSLETTER,
      subject,
      html,
      batchSize: 50,
      maxAttemptsPerBatch: 6,
      logPrefix: "[newsletter/send-manual]",
      campaignId: body?.campaignId ?? null,
    });

    return Response.json({
      ...result,
      product: product.name,
      productId: product.id,
      usedLatestProduct: !slug,
      url: productUrl,
    });
  } catch (err) {
    console.error("[newsletter/send-manual] Unexpected error:", err);
    return Response.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
