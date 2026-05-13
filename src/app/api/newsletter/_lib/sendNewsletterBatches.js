/**
 * Batch newsletter sends via Resend `/emails/batch`, chunked + retries on rate limits / transient errors.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** HTML escape (templates live in `newsletterDropHtml.js`; re-exported here for callers that only import batches). */
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

async function withTimeout(promise, ms = 30000) {
  let tid;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        tid = setTimeout(() => reject(new Error("Request timeout")), ms);
      }),
    ]);
  } finally {
    if (tid) clearTimeout(tid);
  }
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

function normalizeRecipients(subscribers) {
  if (!Array.isArray(subscribers)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of subscribers) {
    const e = String(raw ?? "")
      .trim()
      .toLowerCase();
    if (!e || !EMAIL_RE.test(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}

function newCampaignId() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
  } catch (_) {}
  return `nl-${Date.now()}`;
}

/**
 * @param {import("resend").Resend} resend
 * @param {{
 *   subscribers: string[],
 *   from: string,
 *   replyTo?: string,
 *   subject: string,
 *   html: string,
 *   batchSize?: number,
 *   maxAttemptsPerBatch?: number,
 *   logPrefix?: string,
 *   campaignId?: string | null,
 * }} options
 */
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
    campaignId: campaignIdOpt = null,
  } = options;

  const campaignId =
    campaignIdOpt != null && String(campaignIdOpt).trim()
      ? String(campaignIdOpt).trim()
      : newCampaignId();

  const recipients = normalizeRecipients(subscribers);
  const effectiveBatchSize = Math.min(Math.max(1, batchSize), 100);

  if (recipients.length === 0) {
    return {
      campaignId,
      sentPayloads: 0,
      emailsSent: 0,
      emailsRejected: 0,
      batchSize: effectiveBatchSize,
      batchesSucceeded: 0,
      batchesFailed: 0,
      batchesAttempted: 0,
      batchRetries: 0,
      success: true,
      skipped: true,
      reason: "no_valid_recipients",
    };
  }

  const payloads = recipients.map((to) => ({
    from,
    to,
    replyTo,
    subject,
    html,
  }));

  let batchesSucceeded = 0;
  let batchesFailed = 0;
  let batchRetries = 0;
  let emailsSent = 0;
  let emailsRejected = 0;

  for (let i = 0; i < payloads.length; i += effectiveBatchSize) {
    const chunk = payloads.slice(i, i + effectiveBatchSize);
    let ok = false;

    for (let attempt = 0; attempt < maxAttemptsPerBatch; attempt++) {
      let resBody;
      let error;
      try {
        const out = await withTimeout(
          resend.batch.send(chunk, {
            batchValidation: "permissive",
          }),
          30000
        );
        resBody = out?.data;
        error = out?.error ?? null;
      } catch (e) {
        resBody = null;
        error = {
          message: String(e?.message || e),
          statusCode: 408,
          name: "timeout",
        };
      }

      if (!error) {
        const successes = Array.isArray(resBody?.data) ? resBody.data : [];
        const rowErrors = Array.isArray(resBody?.errors) ? resBody.errors : [];
        emailsSent += successes.length;
        emailsRejected += rowErrors.length;

        if (rowErrors.length > 0) {
          console.warn(
            `${logPrefix} campaign=${campaignId} slice=${i}-${i + chunk.length} permissive errors (${rowErrors.length})`,
            rowErrors.slice(0, 15)
          );
        }

        if (chunk.length > 0 && successes.length === 0) {
          console.warn(
            `${logPrefix} campaign=${campaignId} slice=${i}-${i + chunk.length} zero sends in batch (likely validation). Not retrying.`
          );
        }

        batchesSucceeded++;
        batchRetries += attempt;
        ok = true;
        break;
      }

      console.error(
        `${logPrefix} campaign=${campaignId} slice=${i}-${i + chunk.length} attempt=${attempt + 1}`,
        error
      );

      const retry =
        isRetryableResendError(error) && attempt < maxAttemptsPerBatch - 1;

      if (!retry) break;

      const rateLimited = errorStatus(error) === 429;
      const delayMs =
        Math.min(45000, 900 * 2 ** attempt + (rateLimited ? 3500 : 0)) +
        Math.floor(Math.random() * 450);
      await sleep(delayMs);
    }

    if (!ok) batchesFailed++;
  }

  const batchesAttempted = Math.ceil(payloads.length / effectiveBatchSize) || 0;
  const allAccepted =
    emailsRejected === 0 && emailsSent === payloads.length && batchesFailed === 0;

  return {
    campaignId,
    sentPayloads: payloads.length,
    emailsSent,
    emailsRejected,
    batchSize: effectiveBatchSize,
    batchesSucceeded,
    batchesFailed,
    batchesAttempted,
    batchRetries,
    success: allAccepted,
  };
}
