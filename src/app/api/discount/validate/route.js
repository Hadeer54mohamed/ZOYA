import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PHONE_RE = /^01[0125][0-9]{8}$/;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = body?.code;
    const rawPhone = body?.phone;

    if (typeof raw !== "string" || !raw.trim()) {
      return Response.json(
        { success: false, error: "Please enter a code." },
        { status: 400 }
      );
    }

    const normalized = raw.trim().toUpperCase();

    if (normalized.length > 64) {
      return Response.json(
        { success: false, error: "Invalid code." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("discount_codes")
      .select("code, discount_type, value, is_active, usage_limit, usage_count")
      .eq("code", normalized)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Discount validate error:", error);
      return Response.json(
        { success: false, error: "Could not verify the code." },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        { success: false, error: "Invalid or expired code." },
        { status: 404 }
      );
    }

    // Global usage limit on the code itself.
    const usageLimit = Number(data.usage_limit) || 0;
    const usageCount = Number(data.usage_count) || 0;
    if (usageLimit > 0 && usageCount >= usageLimit) {
      return Response.json(
        { success: false, error: "This code reached its limit." },
        { status: 400 }
      );
    }

    // Per-phone check: if a phone was supplied, ensure it hasn't already used
    // this code. We only enforce when the phone looks valid; otherwise we
    // skip the check (the order endpoint will catch it as a final safety net).
    if (typeof rawPhone === "string") {
      const trimmedPhone = rawPhone.trim();
      if (PHONE_RE.test(trimmedPhone)) {
        const { data: existingUsage } = await supabase
          .from("discount_usages")
          .select("id")
          .eq("code", data.code)
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
      }
    }

    return Response.json({
      success: true,
      discount: {
        code: data.code,
        discount_type: data.discount_type,
        value: Number(data.value) || 0,
      },
    });
  } catch (err) {
    console.error("Discount validate unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
