import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";

function misconfigured() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      {
        error: "Server misconfiguration",
        details:
          "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Discount admin uses the service role key (same as orders).",
      },
      { status: 503 },
    );
  }
  return null;
}

export async function GET() {
  try {
    const cfg = misconfigured();
    if (cfg) return cfg;

    const { data, error } = await supabaseServer
      .from("discount_codes")
      .select("*")
      // Table may not define `created_at`; order by code for a stable admin list.
      .order("code", { ascending: true });

    if (error) {
      console.error("Supabase GET error:", error.message, error.details);
      return NextResponse.json(
        {
          error: error.message || "Failed to fetch discount codes",
          details: error.details,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ codes: data });
  } catch (err) {
    console.error("API GET error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const cfg = misconfigured();
    if (cfg) return cfg;

    const { code, discount_type, value, is_active, expires_at, usage_limit } =
      await request.json();

    // Validate required fields
    if (
      !code ||
      !discount_type ||
      value === undefined ||
      is_active === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate discount_type
    if (!["PERCENT", "FIXED"].includes(discount_type)) {
      return NextResponse.json(
        { error: "Invalid discount_type" },
        { status: 400 },
      );
    }

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    // DB column is integer — round so values like 4.98 don't break Postgres.
    const intValue = Math.round(value);
    if (intValue < 0) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    // For PERCENT, value should be <= 100
    if (discount_type === "PERCENT" && intValue > 100) {
      return NextResponse.json(
        { error: "Percent value cannot exceed 100" },
        { status: 400 },
      );
    }

    let usageLimitVal = null;
    if (usage_limit != null && usage_limit !== "") {
      const u = Math.round(Number(usage_limit));
      if (!Number.isFinite(u) || u < 1) {
        return NextResponse.json(
          { error: "usage_limit must be a positive integer or omitted" },
          { status: 400 },
        );
      }
      usageLimitVal = u;
    }

    const id = crypto.randomUUID();
    const insertData = {
      id,
      code: code.toUpperCase(),
      discount_type,
      value: intValue,
      is_active,
      expires_at: expires_at || null,
      usage_count: 0,
      usage_limit: usageLimitVal,
    };

    const { error } = await supabaseServer
      .from("discount_codes")
      .insert([insertData]);

    if (error) {
      console.error(
        "Supabase POST error:",
        error.message,
        error.details,
        error.hint,
      );
      return NextResponse.json(
        {
          error: error.message || "Failed to create discount code",
          details: error.details,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
