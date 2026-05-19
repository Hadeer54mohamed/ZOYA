import { orderNetRevenue, orderProfit } from "./orderMoney";
import {
  addDays,
  cairoWallNow,
  fmtShortDate,
  startOfDay,
  startOfMonth,
  toCairoDate,
} from "./cairoTime";

export function getFirstOrderDayStart(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return null;
  let min = null;
  for (const o of orders) {
    if (o?.status === "cancelled") continue;
    const d = toCairoDate(o?.created_at);
    if (!d) continue;
    const day = startOfDay(d);
    if (!min || day < min) min = day;
  }
  if (min) return min;
  for (const o of orders) {
    const d = toCairoDate(o?.created_at);
    if (!d) continue;
    const day = startOfDay(d);
    if (!min || day < min) min = day;
  }
  return min;
}

export function aggregateOrdersInRange(orders, from, to) {
  let revenue = 0;
  let profit = 0;
  let discounts = 0;
  let count = 0;
  let incomplete = 0;

  for (const o of orders) {
    if (o?.status === "cancelled") continue;
    const d = toCairoDate(o?.created_at);
    if (!d) continue;
    if (d < from || d >= to) continue;
    count += 1;
    revenue += Number(o.net_product_revenue ?? orderNetRevenue(o));
    discounts += Number(o?.discount_amount ?? 0);
    const p =
      o.net_product_profit !== null && o.net_product_profit !== undefined
        ? Number(o.net_product_profit)
        : orderProfit(o);
    if (p === null || Number.isNaN(p)) {
      incomplete += 1;
    } else {
      profit += p;
    }
  }

  return { revenue, profit, discounts, count, incomplete };
}

export function buildPeriodLabel(periodStart, periodEndExclusive) {
  return `${fmtShortDate(periodStart)} – ${fmtShortDate(
    addDays(periodEndExclusive, -1),
  )}`;
}

export function mapPeriodRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    period_start: row.period_start,
    period_end: row.period_end,
    revenue: Number(row.revenue ?? 0),
    profit: Number(row.profit ?? 0),
    discounts: Number(row.discounts ?? 0),
    count: Number(row.order_count ?? 0),
    incomplete: Number(row.incomplete_count ?? 0),
    status: row.status,
    closed_at: row.closed_at,
  };
}

export function defaultActivePeriodStart(orders) {
  return getFirstOrderDayStart(orders) ?? startOfMonth(cairoWallNow());
}

export function liveActivePeriodStats(orders, periodStartIso) {
  const periodStart = startOfDay(new Date(periodStartIso));
  const end = addDays(startOfDay(cairoWallNow()), 1);
  return aggregateOrdersInRange(orders, periodStart, end);
}
