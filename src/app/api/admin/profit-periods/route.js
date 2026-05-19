import { createClient } from "@supabase/supabase-js";
import { orderNetRevenue, orderProfit } from "../../../lib/orderMoney";
import {
  aggregateOrdersInRange,
  buildPeriodLabel,
  defaultActivePeriodStart,
  liveActivePeriodStats,
  mapPeriodRow,
} from "../../../lib/profitPeriods";
import { addDays, cairoWallNow, startOfDay } from "../../../lib/cairoTime";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function isAuthorizedAdmin(req) {
  const adminPass = process.env.ADMIN_PASS;
  if (!adminPass) return false;
  return req.headers.get("x-admin-pass") === adminPass;
}

function isMissingTableError(error) {
  const msg = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return msg.includes("profit_periods") && msg.includes("does not exist");
}

async function fetchOrdersForProfit() {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "status, created_at, items, total_price, shipping_fee, discount_amount, total_cost, profit, cost_complete",
    )
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((order) => ({
    ...order,
    net_product_revenue: orderNetRevenue(order),
    net_product_profit:
      orderProfit(order) ??
      (order.profit !== null && order.profit !== undefined
        ? Number(order.profit)
        : null),
  }));
}

async function ensureActivePeriod(orders) {
  const { data: active, error } = await supabase
    .from("profit_periods")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (active) return active;

  const periodStart = defaultActivePeriodStart(orders);
  const { data: created, error: insertErr } = await supabase
    .from("profit_periods")
    .insert({
      period_start: periodStart.toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (insertErr) throw insertErr;
  return created;
}

export async function GET(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const orders = await fetchOrdersForProfit();
    const activeRow = await ensureActivePeriod(orders);
    const live = liveActivePeriodStats(orders, activeRow.period_start);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      120,
      Math.max(1, Number(searchParams.get("limit")) || 48),
    );

    const { data: closedRows, error: closedErr } = await supabase
      .from("profit_periods")
      .select("*")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(limit);

    if (closedErr) throw closedErr;

    return Response.json({
      success: true,
      active: {
        ...mapPeriodRow(activeRow),
        ...live,
        period_start: activeRow.period_start,
      },
      closed: (closedRows ?? []).map(mapPeriodRow),
    });
  } catch (err) {
    console.error("[admin/profit-periods] GET:", err);
    if (isMissingTableError(err)) {
      return Response.json(
        {
          success: false,
          error:
            "Table profit_periods is missing. Run sql/profit_periods.sql in Supabase SQL Editor.",
        },
        { status: 503 },
      );
    }
    return Response.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body?.action !== "close") {
      return Response.json(
        { success: false, error: "Unknown action." },
        { status: 400 },
      );
    }

    const orders = await fetchOrdersForProfit();
    const activeRow = await ensureActivePeriod(orders);
    const periodStart = startOfDay(new Date(activeRow.period_start));
    const todayStart = startOfDay(cairoWallNow());
    const snapshot = aggregateOrdersInRange(orders, periodStart, todayStart);
    const label = buildPeriodLabel(periodStart, todayStart);

    const { error: closeErr } = await supabase
      .from("profit_periods")
      .update({
        status: "closed",
        period_end: todayStart.toISOString(),
        closed_at: new Date().toISOString(),
        label,
        revenue: snapshot.revenue,
        profit: snapshot.profit,
        discounts: snapshot.discounts,
        order_count: snapshot.count,
        incomplete_count: snapshot.incomplete,
      })
      .eq("id", activeRow.id);

    if (closeErr) throw closeErr;

    const { data: newActive, error: insertErr } = await supabase
      .from("profit_periods")
      .insert({
        period_start: todayStart.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    const live = liveActivePeriodStats(orders, newActive.period_start);

    const { data: closedRows, error: closedListErr } = await supabase
      .from("profit_periods")
      .select("*")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(48);

    if (closedListErr) throw closedListErr;

    return Response.json({
      success: true,
      closed: mapPeriodRow({
        ...activeRow,
        status: "closed",
        period_end: todayStart.toISOString(),
        label,
        ...snapshot,
        order_count: snapshot.count,
        incomplete_count: snapshot.incomplete,
      }),
      active: {
        ...mapPeriodRow(newActive),
        ...live,
        period_start: newActive.period_start,
      },
      closedPeriods: (closedRows ?? []).map(mapPeriodRow),
    });
  } catch (err) {
    console.error("[admin/profit-periods] POST:", err);
    if (isMissingTableError(err)) {
      return Response.json(
        {
          success: false,
          error:
            "Table profit_periods is missing. Run sql/profit_periods.sql in Supabase SQL Editor.",
        },
        { status: 503 },
      );
    }
    return Response.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
