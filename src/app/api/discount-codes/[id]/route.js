import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

function misconfigured() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      {
        error: "Server misconfiguration",
        details:
          "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for discount admin APIs.",
      },
      { status: 503 },
    );
  }
  return null;
}

export async function PATCH(request, context) {
  try {
    const cfg = misconfigured();
    if (cfg) return cfg;

    const { id: rawId } = await context.params;
    const id = typeof rawId === "string" ? rawId.trim() : "";
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing or invalid discount code id" }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const {
      expires_at,
      is_active,
      code: nextCode,
      discount_type,
      value,
      usage_limit,
    } = body;

    const updates = {};
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (is_active !== undefined) updates.is_active = is_active;

    if (usage_limit !== undefined) {
      if (usage_limit === null || usage_limit === "") {
        updates.usage_limit = null;
      } else {
        const lim = Math.round(Number(usage_limit));
        if (!Number.isFinite(lim) || lim < 1) {
          return NextResponse.json(
            { error: "usage_limit must be a positive integer or null" },
            { status: 400 },
          );
        }
        updates.usage_limit = lim;
      }
    }

    if (nextCode !== undefined) {
      const c = String(nextCode).trim().toUpperCase();
      if (!c) {
        return NextResponse.json({ error: "code cannot be empty" }, { status: 400 });
      }
      updates.code = c;
    }

    if (discount_type !== undefined) {
      if (!["PERCENT", "FIXED"].includes(discount_type)) {
        return NextResponse.json(
          { error: "Invalid discount_type" },
          { status: 400 },
        );
      }
      updates.discount_type = discount_type;
    }

    if (value !== undefined) {
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num) || num < 0) {
        return NextResponse.json({ error: "Invalid value" }, { status: 400 });
      }
      updates.value = Math.round(num);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: existing, error: loadErr } = await supabaseServer
      .from("discount_codes")
      .select("discount_type, value")
      .eq("id", id)
      .maybeSingle();

    if (loadErr) {
      console.error("Supabase PATCH load error:", loadErr.message);
      return NextResponse.json(
        { error: loadErr.message || "Failed to load discount code" },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    const mergedType = updates.discount_type ?? existing.discount_type;
    const mergedValue =
      updates.value !== undefined ? updates.value : Number(existing.value);
    if (mergedType === "PERCENT" && mergedValue > 100) {
      return NextResponse.json(
        { error: "Percent value cannot exceed 100" },
        { status: 400 },
      );
    }

    console.log("Updating discount code:", id, updates);

    const { error } = await supabaseServer
      .from("discount_codes")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Supabase PATCH error:", error.message, error.details);
      return NextResponse.json(
        {
          error: error.message || "Failed to update discount code",
          details: error.details,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  try {
    const cfg = misconfigured();
    if (cfg) return cfg;

    const { id: rawId } = await context.params;
    const id = typeof rawId === "string" ? rawId.trim() : "";
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing or invalid discount code id" }, { status: 400 });
    }

    console.log("Deleting discount code:", id);

    const { error } = await supabaseServer
      .from("discount_codes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase DELETE error:", error.message, error.details);
      return NextResponse.json(
        {
          error: error.message || "Failed to delete discount code",
          details: error.details,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 },
    );
  }
}
