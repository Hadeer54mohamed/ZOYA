"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  aggregateOrdersInRange,
  getFirstOrderDayStart,
} from "../lib/profitPeriods";
import {
  addDays,
  addMonths,
  cairoWallNow,
  fmtLongDate,
  fmtMonthYear,
  fmtShortDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "../lib/cairoTime";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Loader2,
  Minus,
  RotateCcw,
  TrendingUp,
  X,
} from "lucide-react";

const BRAND_START_DATE = new Date(2026, 4, 1);

export default function ProfitAnalyticsModal({ orders, adminFetch, onClose }) {
  const [activePeriod, setActivePeriod] = useState(null);
  const [periodHistory, setPeriodHistory] = useState([]);
  const [periodReady, setPeriodReady] = useState(false);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodError, setPeriodError] = useState("");
  const [periodClosing, setPeriodClosing] = useState(false);

  const loadProfitPeriods = useCallback(async () => {
    setPeriodLoading(true);
    setPeriodError("");
    try {
      const res = await adminFetch("/api/admin/profit-periods");
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setPeriodError(data?.error || "Failed to load monthly periods.");
        return;
      }
      setActivePeriod(data.active ?? null);
      setPeriodHistory(Array.isArray(data.closed) ? data.closed : []);
    } catch {
      setPeriodError("Network error loading monthly periods.");
    } finally {
      setPeriodLoading(false);
      setPeriodReady(true);
    }
  }, [adminFetch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPeriodLoading(true);
      setPeriodError("");
      try {
        const res = await adminFetch("/api/admin/profit-periods");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.success) {
          setPeriodError(data?.error || "Failed to load monthly periods.");
          return;
        }
        setActivePeriod(data.active ?? null);
        setPeriodHistory(Array.isArray(data.closed) ? data.closed : []);
      } catch {
        if (!cancelled) setPeriodError("Network error loading monthly periods.");
      } finally {
        if (!cancelled) {
          setPeriodLoading(false);
          setPeriodReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminFetch]);

  const periodStart = useMemo(() => {
    if (!activePeriod?.period_start) return null;
    return startOfDay(new Date(activePeriod.period_start));
  }, [activePeriod]);

  const currentPeriod = useMemo(() => {
    if (!activePeriod) {
      return { revenue: 0, profit: 0, discounts: 0, count: 0, incomplete: 0 };
    }
    return {
      revenue: Number(activePeriod.revenue ?? 0),
      profit: Number(activePeriod.profit ?? 0),
      discounts: Number(activePeriod.discounts ?? 0),
      count: Number(activePeriod.count ?? 0),
      incomplete: Number(activePeriod.incomplete ?? 0),
    };
  }, [activePeriod]);

  const handleStartNewPeriod = async () => {
    if (!periodStart || periodClosing) return;
    const todayStart = startOfDay(cairoWallNow());
    const rangeLabel = `${fmtShortDate(periodStart)} – ${fmtShortDate(
      addDays(todayStart, -1),
    )}`;
    const msg =
      `Close the current period (${rangeLabel}) and start counting from today?\n\n` +
      `Current profit: ${Math.round(currentPeriod.profit).toLocaleString()} EGP · ` +
      `${currentPeriod.count} orders.\n\n` +
      `This period will be saved in Supabase for your monthly reports.`;
    if (!window.confirm(msg)) return;

    setPeriodClosing(true);
    setPeriodError("");
    try {
      const res = await adminFetch("/api/admin/profit-periods", {
        method: "POST",
        body: JSON.stringify({ action: "close" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setPeriodError(data?.error || "Failed to close period.");
        return;
      }
      setActivePeriod(data.active ?? null);
      setPeriodHistory(
        Array.isArray(data.closedPeriods) ? data.closedPeriods : [],
      );
    } catch {
      setPeriodError("Network error closing period.");
    } finally {
      setPeriodClosing(false);
    }
  };

  const buckets = useMemo(() => {
    const now = cairoWallNow();
    const firstOrderDay = getFirstOrderDayStart(orders);
    const floorDate = firstOrderDay ?? BRAND_START_DATE;
    const analyticsFromFirstOrder = firstOrderDay !== null;

    const todayStart = startOfDay(now);
    const yesterdayStart = addDays(todayStart, -1);
    const weekStart = startOfWeek(now);
    const lastWeekStart = addDays(weekStart, -7);
    const monthStart = startOfMonth(now);
    const lastMonthStart = addMonths(monthStart, -1);
    const yearStart = startOfYear(now);

    const today = aggregateOrdersInRange(orders, todayStart, addDays(todayStart, 1));
    const yesterday = aggregateOrdersInRange(orders, yesterdayStart, todayStart);
    const thisWeek = aggregateOrdersInRange(orders, weekStart, addDays(weekStart, 7));
    const lastWeek = aggregateOrdersInRange(orders, lastWeekStart, weekStart);
    const thisMonth = aggregateOrdersInRange(
      orders,
      monthStart,
      addMonths(monthStart, 1),
    );
    const lastMonth = aggregateOrdersInRange(orders, lastMonthStart, monthStart);
    const thisYear = aggregateOrdersInRange(
      orders,
      yearStart,
      addMonths(yearStart, 12),
    );

    // Hide misleading trend badges when the prior period is entirely before
    // our analytics floor (first real order day, else launch fallback).
    const yesterdayBeforeBrand = todayStart <= floorDate;
    const lastWeekBeforeBrand = weekStart <= floorDate;
    const lastMonthBeforeBrand = monthStart <= floorDate;

    // Last 8 weeks (most recent first), labelled by Saturday → Friday range.
    // Skip weeks that end on/before the analytics floor (no data window).
    const weeks = [];
    for (let i = 0; i < 8; i++) {
      const start = addDays(weekStart, -7 * i);
      const end = addDays(start, 7);
      if (end <= floorDate) break;
      const stats = aggregateOrdersInRange(orders, start, end);
      const label =
        i === 0
          ? "This week"
          : i === 1
            ? "Last week"
            : `${fmtShortDate(start)} – ${fmtShortDate(addDays(end, -1))}`;
      weeks.push({
        key: `w-${i}`,
        label,
        range: `${fmtShortDate(start)} – ${fmtShortDate(addDays(end, -1))}`,
        ...stats,
      });
    }

    // Last 12 months (most recent first). Skip months ending on/before floor.
    const months = [];
    for (let i = 0; i < 12; i++) {
      const start = addMonths(monthStart, -i);
      const end = addMonths(start, 1);
      if (end <= floorDate) break;
      const stats = aggregateOrdersInRange(orders, start, end);
      months.push({ key: `m-${i}`, label: fmtMonthYear(start), ...stats });
    }

    return {
      today,
      yesterday,
      thisWeek,
      lastWeek,
      thisMonth,
      lastMonth,
      thisYear,
      weeks,
      months,
      yesterdayBeforeBrand,
      lastWeekBeforeBrand,
      lastMonthBeforeBrand,
      analyticsFloor: floorDate,
      analyticsFromFirstOrder,
    };
  }, [orders]);

  return (
    <div
      className="animate-ui-fade-in fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-ui-fade-in-up w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/60"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Profit Analytics
              </h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mt-0.5">
                Cairo time · cancelled & incomplete excluded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Quick-glance comparison cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ComparisonCard
              label="Today"
              current={buckets.today}
              previous={buckets.yesterday}
              previousLabel="vs yesterday"
              previousStartsBeforeBrand={buckets.yesterdayBeforeBrand}
            />
            <ComparisonCard
              label="This Week"
              current={buckets.thisWeek}
              previous={buckets.lastWeek}
              previousLabel="vs last week"
              previousStartsBeforeBrand={buckets.lastWeekBeforeBrand}
            />
            <ComparisonCard
              label="This Month"
              current={buckets.thisMonth}
              previous={buckets.lastMonth}
              previousLabel="vs last month"
              previousStartsBeforeBrand={buckets.lastMonthBeforeBrand}
            />
            <ComparisonCard
              label="This Year"
              current={buckets.thisYear}
              accent="text-[#FF4DA3]"
            />
          </div>

          {/* Manual monthly period — stored in Supabase */}
          <div className="rounded-2xl border border-[#FF4DA3]/25 bg-[#FF4DA3]/[0.04] dark:bg-[#FF4DA3]/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#FF4DA3]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-[#FF4DA3] shrink-0" />
                    <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-black/70 dark:text-white/70">
                    Your monthly period
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[11px] text-black/50 dark:text-white/50 leading-relaxed max-w-prose">
                    Saved in Supabase — open from any device. Press reset when you
                    start a new month (not automatic).
                  </p>
                  {periodStart ? (
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-[#FF4DA3]/80">
                      From {fmtLongDate(periodStart)} → today
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleStartNewPeriod}
                  disabled={
                    periodLoading || periodClosing || !periodStart || !!periodError
                  }
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] bg-[#FF4DA3] text-white hover:bg-[#FF4DA3]/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {periodClosing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RotateCcw size={14} strokeWidth={2.5} />
                  )}
                  Start new period
                </button>
              </div>

              {periodError ? (
                <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs leading-relaxed">
                  {periodError}
                </div>
              ) : null}

              {periodLoading ? (
                <div className="p-8 flex items-center justify-center gap-2 text-xs text-black/50 dark:text-white/50">
                  <Loader2 size={16} className="animate-spin text-[#FF4DA3]" />
                  Loading monthly period…
                </div>
              ) : periodReady && periodStart ? (
              <>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/10">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                    Period profit
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      currentPeriod.profit > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : currentPeriod.profit < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-black/50 dark:text-white/50"
                    }`}
                  >
                    {Math.round(currentPeriod.profit).toLocaleString()}{" "}
                    <span className="text-xs opacity-60">EGP</span>
                  </p>
                  {currentPeriod.incomplete > 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400/70 mt-1">
                      excl. {currentPeriod.incomplete} incomplete
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/10">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                    Period revenue
                  </p>
                  <p className="text-2xl font-bold mt-1 text-[#FF4DA3]">
                    {Math.round(currentPeriod.revenue).toLocaleString()}{" "}
                    <span className="text-xs opacity-60">EGP</span>
                  </p>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">
                    products only
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/10">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                    Orders
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {currentPeriod.count}
                  </p>
                  {currentPeriod.discounts > 0 && (
                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">
                      discounts −
                      {Math.round(currentPeriod.discounts).toLocaleString()}{" "}
                      EGP
                    </p>
                  )}
                </div>
              </div>

              {periodHistory.length > 0 ? (
                <div className="border-t border-[#FF4DA3]/15">
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                      Closed periods
                    </p>
                    <Link
                      href="/admin/monthly"
                      className="text-[9px] uppercase tracking-widest text-[#FF4DA3] font-bold hover:underline"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="divide-y divide-black/5 dark:divide-white/5 max-h-48 overflow-y-auto">
                    {periodHistory.map((row) => (
                      <div
                        key={row.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-black/60 dark:text-white/60 truncate min-w-0">
                          {row.label}
                        </span>
                        <span className="text-black/40 dark:text-white/40 shrink-0 hidden md:inline">
                          {Math.round(row.revenue).toLocaleString()} rev
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {Math.round(row.profit).toLocaleString()} EGP
                        </span>
                        <span className="text-black/40 dark:text-white/40 shrink-0 hidden sm:inline">
                          {row.count} ord
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              </>
              ) : null}
          </div>

          {/* Brand opening note */}
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            <Calendar size={10} />
            <span>
              {buckets.analyticsFromFirstOrder ? (
                <>
                  Analytics from first order{" "}
                  <span className="text-[#FF4DA3] font-bold">
                    {fmtLongDate(buckets.analyticsFloor)}
                  </span>
                </>
              ) : (
                <>
                  No orders yet — using launch date{" "}
                  <span className="text-[#FF4DA3] font-bold">
                    {fmtLongDate(buckets.analyticsFloor)}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Weekly breakdown */}
          <BucketTable
            title="Last 8 Weeks"
            icon={Calendar}
            rows={buckets.weeks}
            subtitle="Each row is one Saturday–Friday week (Cairo). Old rows drop once the week ends on/before your analytics start (first order day, or launch date if there are no orders yet)."
          />

          {/* Monthly breakdown */}
          <BucketTable
            title="Last 12 Months"
            icon={Calendar}
            rows={buckets.months}
          />

          {/* Note */}
          <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] leading-relaxed text-black/50 dark:text-white/50">
            <p>
              <b>Revenue</b> = items subtotal − discount (products only).{" "}
              <b>Profit:</b>{" "}
              <span className="font-mono">
                revenue − total cost
              </span>
              . Shipping is excluded from both. <b>Your monthly period</b> is
              stored in Supabase and only advances when you press Start new
              period. Cancelled orders are ignored. Orders with incomplete cost
              data (missing in Sanity) are counted in the order count but
              excluded from the profit total — fix them in Sanity to make the
              analytics fully accurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({
  label,
  current,
  previous,
  previousLabel,
  accent,
  previousStartsBeforeBrand,
}) {
  // Decide whether we should compare to the previous period at all.
  // We only show a trend badge when both sides have meaningful data — comparing
  // a real week to an empty week (e.g. before the brand opened) would produce
  // a misleading "+∞%" / "-100%" change.
  const hasPrev =
    previous !== undefined && !previousStartsBeforeBrand && previous.count > 0;

  let trend = null;
  let pct = null;
  if (hasPrev) {
    const diff = current.profit - previous.profit;
    if (previous.profit !== 0) {
      pct = Math.round((diff / Math.abs(previous.profit)) * 100);
    }
    trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  }

  const profitClass =
    current.profit > 0
      ? accent || "text-emerald-600 dark:text-emerald-400"
      : current.profit < 0
        ? "text-red-600 dark:text-red-400"
        : "text-black/50 dark:text-white/50";

  const TrendIcon =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendCls =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      : trend === "down"
        ? "text-red-600 dark:text-red-400 bg-red-500/10"
        : "text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5";

  // Cap absurd percentages so the badge stays readable when comparing tiny
  // numbers (e.g. 1 EGP last week vs 200 EGP this week would otherwise show
  // 19,900%).
  const formatPct = (p) => {
    if (p === null) return null;
    const abs = Math.abs(p);
    if (abs > 999) return "999+%";
    return `${abs}%`;
  };

  return (
    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10">
      <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-bold mt-1.5 ${profitClass}`}>
        {Math.round(current.profit).toLocaleString()}{" "}
        <span className="text-[10px] tracking-widest opacity-60">EGP</span>
      </p>
      <p className="text-[10px] text-black/40 dark:text-white/40">
        {previousLabel}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
        <span className="text-black/40 dark:text-white/40">
          {current.count} {current.count === 1 ? "order" : "orders"}
        </span>
        {hasPrev && trend && pct !== null && (
          <span
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${trendCls}`}
            title={previousLabel}
          >
            <TrendIcon size={9} strokeWidth={3} />
            {formatPct(pct)}
          </span>
        )}
        {hasPrev && trend && pct === null && (
          // Previous had orders but 0 profit (e.g. all incomplete) — show the
          // direction without a misleading percentage.
          <span
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${trendCls}`}
            title={previousLabel}
          >
            <TrendIcon size={9} strokeWidth={3} />
            new
          </span>
        )}
      </div>
      {current.incomplete > 0 && (
        <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400/70">
          {current.incomplete} incomplete
        </p>
      )}
    </div>
  );
}

function BucketTable({ title, icon: Icon, rows, subtitle }) {
  // Bar lengths are scaled to the largest positive profit in the visible set
  // so the chart stays readable regardless of absolute amounts.
  const maxProfit = Math.max(1, ...rows.map((r) => Math.max(0, r.profit)));

  if (!rows || rows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-[#FF4DA3] shrink-0" />
          <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-black/60 dark:text-white/60">
            {title}
          </h3>
        </div>
        {subtitle ? (
          <p className="mt-2 text-[10px] leading-relaxed text-black/45 dark:text-white/45 font-normal tracking-normal normal-case max-w-prose">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {rows.map((r) => {
          const isEmpty = r.count === 0;
          const profitPct = (Math.max(0, r.profit) / maxProfit) * 100;
          const profitCls = isEmpty
            ? "text-black/30 dark:text-white/25"
            : r.profit > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : r.profit < 0
                ? "text-red-600 dark:text-red-400"
                : "text-black/40 dark:text-white/40";

          return (
            <div
              key={r.key}
              className={`px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs ${
                isEmpty ? "opacity-50" : ""
              }`}
            >
              <div className="col-span-5 sm:col-span-4 min-w-0">
                <p className="font-medium truncate">{r.label}</p>
                {r.range && r.label !== r.range && (
                  <p className="text-[10px] text-black/40 dark:text-white/40 truncate">
                    {r.range}
                  </p>
                )}
              </div>
              <div className="col-span-3 sm:col-span-2 text-right">
                <p className="text-black/50 dark:text-white/50">
                  {isEmpty ? "—" : `${r.count} ord`}
                </p>
              </div>
              <div className="col-span-4 sm:col-span-3 text-right hidden sm:block">
                <p className="text-black/50 dark:text-white/50">
                  {isEmpty ? (
                    "—"
                  ) : (
                    <>
                      {Math.round(r.revenue).toLocaleString()}{" "}
                      <span className="opacity-60">rev</span>
                    </>
                  )}
                </p>
              </div>
              <div className="col-span-4 sm:col-span-3 text-right">
                <p className={`font-bold ${profitCls}`}>
                  {isEmpty
                    ? "—"
                    : `${Math.round(r.profit).toLocaleString()} EGP`}
                </p>
                {r.incomplete > 0 && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400/70">
                    +{r.incomplete} incomplete
                  </p>
                )}
                {r.profit > 0 && (
                  <div className="mt-1 h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/60 dark:bg-emerald-400/60 rounded-full"
                      style={{ width: `${profitPct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
