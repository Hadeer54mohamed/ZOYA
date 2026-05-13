import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/** كل الإيميلات المشتركة من Supabase (نفس اسم الجدول المستخدم في `/api/subscribe`). */
export async function getSubscribers() {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email");

  if (error) throw error;

  const seen = new Set();
  const list = [];
  for (const u of data || []) {
    const e = normalizeEmail(u?.email);
    if (!EMAIL_REGEX.test(e) || seen.has(e)) continue;
    seen.add(e);
    list.push(e);
  }
  return list;
}

/** إيميل نظيف + upsert على تعارض `email` — بدون كسر السيرفر عند التكرار. */
export async function upsertSubscriber(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, status: 400, error: "Invalid email" };
  }

  const { error } = await supabase.from("newsletter_subscribers").upsert(
    [{ email }],
    { onConflict: "email" }
  );

  if (error) {
    return {
      ok: false,
      status: 500,
      error: error.message || "Database error",
    };
  }

  return { ok: true, status: 200, email };
}
