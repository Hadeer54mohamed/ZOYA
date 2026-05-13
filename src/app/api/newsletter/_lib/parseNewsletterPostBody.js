/** Safe JSON body for newsletter POST routes (cron may send empty body). */
export async function parseNewsletterPostBody(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return {};
    return body;
  } catch {
    return {};
  }
}

export function pickNewsletterProductSlug(body) {
  const a = body?.productId ?? body?.productSlug;
  const s = a != null ? String(a).trim() : "";
  return s || null;
}
