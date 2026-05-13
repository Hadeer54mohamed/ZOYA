/**
 * Batch newsletter sends via Resend `/emails/batch`, chunked + retries on rate limits / transient errors.
 */

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function errorStatus(error) {
  return error?.statusCode ?? error?.status ?? null;
}

function isRetryableResendError(error) {
  const status = errorStatus(error);
  const msg = String(error?.message ?? "").toLowerCase();
  const name = String(error?.name ?? "").toLowerCase();
  if (status === 429) return true;
  if ([408, 502, 503, 504].includes(status)) return true;
  if (msg.includes("rate limit") || msg.includes("too many requests")) return true;
  if (
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("temporarily")
  )
    return true;
  if (name.includes("rate")) return true;
  return false;
}

/** Automatic scheduled-style copy (matches `/api/newsletter/send`). */
export function buildAutomaticDropHtml(product, productUrl) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 12px;">New Drop Just Landed 🚀</h2>
      <h3 style="margin: 0 0 12px;">${escapeHtml(product.name)}</h3>
      ${
        product.description
          ? `<p style="margin: 0 0 12px; color: #444;">${escapeHtml(
              product.description
            )}</p>`
          : ""
      }
      <p style="margin: 0 0 16px;"><b>${escapeHtml(
        String(Number(product.price ?? 0))
      )} EGP</b></p>
      <a href="${escapeHtml(productUrl)}" style="display:inline-block;background:#FF4DA3;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:700;">Shop Now</a>
    </div>
  `;
}

/** Manual trigger copy (matches `/api/newsletter/send-manual`). */
export function buildManualDropHtml(product, productUrl) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 12px;">Manual Drop Triggered</h2>
      <h3 style="margin: 0 0 12px;">${escapeHtml(product.name)}</h3>
      ${
        product.description
          ? `<p style="margin: 0 0 12px; color: #444;">${escapeHtml(
              product.description
            )}</p>`
          : ""
      }
      <p style="margin: 0 0 16px;"><b>${escapeHtml(
        String(Number(product.price ?? 0))
      )} EGP</b></p>
      <a href="${escapeHtml(productUrl)}" style="display:inline-block;background:#FF4DA3;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:700;">View Product</a>
    </div>
  `;
}

export async function sendNewsletterEmailsInBatches(resend, options) {
  const {
    subscribers,
    from,
    replyTo = "support@zoya-store.com",
    subject,
    html,
    batchSize = 50,
    maxAttemptsPerBatch = 6,
    logPrefix = "[newsletter-batch]",
  } = options;

  const payloads = subscribers.map((to) => ({
    from,
    to,
    replyTo,
    subject,
    html,
  }));

  let batchesSucceeded = 0;
  let batchesFailed = 0;
  let batchRetries = 0;

  for (let i = 0; i < payloads.length; i += batchSize) {
    const chunk = payloads.slice(i, i + batchSize);
    let ok = false;

    for (let attempt = 0; attempt < maxAttemptsPerBatch; attempt++) {
      const { error } = await resend.batch.send(chunk, {
        batchValidation: "permissive",
      });

      if (!error) {
        batchesSucceeded++;
        batchRetries += attempt;
        ok = true;
        break;
      }

      console.error(
        `${logPrefix} slice=${i}-${i + chunk.length} attempt=${attempt + 1}`,
        error
      );

      const retry =
        isRetryableResendError(error) &&
        attempt < maxAttemptsPerBatch - 1;

      if (!retry) break;

      const rateLimited = errorStatus(error) === 429;
      const delayMs =
        Math.min(
          45000,
          900 * 2 ** attempt + (rateLimited ? 3500 : 0)
        ) + Math.floor(Math.random() * 450);
      await sleep(delayMs);
    }

    if (!ok) batchesFailed++;
  }

  const batchesAttempted = Math.ceil(payloads.length / batchSize) || 0;

  return {
    sentPayloads: payloads.length,
    batchSize,
    batchesSucceeded,
    batchesFailed,
    batchesAttempted,
    batchRetries,
    success: batchesFailed === 0 && payloads.length > 0,
  };
}
