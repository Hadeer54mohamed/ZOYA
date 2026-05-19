"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminFooter from "../../components/AdminFooter";
import ThemeToggle from "../../components/ThemeToggle";
import {
  requestOpenProfitModal,
  useAdminSessionPassword,
} from "../../lib/adminSession";
import { fmtLongDate } from "../../lib/cairoTime";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

export default function AdminMonthlyPage() {
  const router = useRouter();
  const password = useAdminSessionPassword();

  useEffect(() => {
    if (!password) router.replace("/admin");
  }, [password, router]);

  if (!password) {
    return (
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#FF4DA3]" />
      </main>
    );
  }

  return <MonthlyArchiveDashboard password={password} />;
}

function MonthlyArchiveDashboard({ password }) {
  const [activePeriod, setActivePeriod] = useState(null);
  const [closedPeriods, setClosedPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const adminFetch = useCallback(
    (url, init = {}) =>
      fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "x-admin-pass": password,
          ...(init.headers || {}),
        },
      }),
    [password],
  );

  const loadPeriods = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/profit-periods?limit=120");
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || "Failed to load monthly archive.");
        return;
      }
      setActivePeriod(data.active ?? null);
      setClosedPeriods(Array.isArray(data.closed) ? data.closed : []);
    } catch {
      setError("Network error loading monthly archive.");
    } finally {
      setLoading(false);
    }
  }, [adminFetch, password]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!password) return;
      try {
        const res = await adminFetch("/api/admin/profit-periods?limit=120");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.success) {
          setError(data?.error || "Failed to load monthly archive.");
          return;
        }
        setActivePeriod(data.active ?? null);
        setClosedPeriods(Array.isArray(data.closed) ? data.closed : []);
      } catch {
        if (!cancelled) setError("Network error loading monthly archive.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminFetch, password]);

  const totals = useMemo(() => {
    return closedPeriods.reduce(
      (acc, row) => {
        acc.profit += Number(row.profit ?? 0);
        acc.revenue += Number(row.revenue ?? 0);
        acc.orders += Number(row.count ?? 0);
        return acc;
      },
      { profit: 0, revenue: 0, orders: 0 },
    );
  }, [closedPeriods]);

  const activeStart = activePeriod?.period_start
    ? fmtLongDate(new Date(activePeriod.period_start))
    : null;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-500">
      <header className="sticky top-0 z-30 w-full border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/70 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.03] dark:opacity-[0.05]" />
        <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-8 py-3 min-h-[3.25rem] sm:min-h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
            <Link
              href="/admin"
              className="shrink-0 p-2 -ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors touch-manipulation"
              aria-label="Back to admin"
            >
              <ArrowLeft size={18} />
            </Link>
            <Link href="/" className="shrink-0 hidden sm:block">
              <Image
                src="/images/LOGO2.webp"
                alt="ZØYA"
                width={90}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </Link>
            <div className="min-w-0">
              <p className="zoya-eyebrow !text-[9px] sm:!text-[10px] !tracking-[0.2em] sm:!tracking-[0.3em] truncate">
                Admin <span className="mx-1 text-[#FF4DA3]/40">/</span> Monthly
              </p>
              <h1 className="zoya-heading zoya-heading-sm !text-base sm:!text-lg truncate">
                Profit by period
              </h1>
            </div>
          </div>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-8 py-5 sm:py-10 space-y-5 sm:space-y-8 pb-8">
        {error ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-black/50 dark:text-white/50">
            <Loader2 size={28} className="animate-spin text-[#FF4DA3]" />
            <p className="text-xs uppercase tracking-[0.25em]">
              Loading archive…
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <SummaryTile
                label="Closed periods"
                value={closedPeriods.length}
                icon={Calendar}
                accent="text-[#FF4DA3]"
              />
              <SummaryTile
                label="Total profit"
                value={`${Math.round(totals.profit).toLocaleString()} EGP`}
                icon={TrendingUp}
                accent="text-emerald-600 dark:text-emerald-400"
              />
              <SummaryTile
                label="Total revenue"
                value={`${Math.round(totals.revenue).toLocaleString()} EGP`}
                icon={CreditCard}
                accent="text-[#FF4DA3]"
              />
              <SummaryTile
                label="Total orders"
                value={totals.orders.toLocaleString()}
                icon={ShoppingBag}
              />
            </div>

            {activePeriod ? (
              <div className="p-4 sm:p-5 rounded-2xl border border-[#FF4DA3]/30 bg-[#FF4DA3]/[0.05] dark:bg-[#FF4DA3]/[0.08]">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#FF4DA3] font-bold mb-2">
                  Current period (still open)
                </p>
                <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-4 leading-relaxed">
                  From {activeStart} → today
                  <span className="hidden sm:inline"> · close it from </span>
                  <span className="sm:hidden">
                    <br />
                    Close from{" "}
                  </span>
                  <Link
                    href="/admin"
                    onClick={requestOpenProfitModal}
                    className="text-[#FF4DA3] font-semibold hover:underline"
                  >
                    Profit Analytics
                  </Link>
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
                  <StatBlock
                    label="Profit"
                    value={`${Math.round(activePeriod.profit ?? 0).toLocaleString()} EGP`}
                    accent="text-emerald-600 dark:text-emerald-400"
                  />
                  <StatBlock
                    label="Revenue"
                    value={`${Math.round(activePeriod.revenue ?? 0).toLocaleString()} EGP`}
                  />
                  <StatBlock
                    label="Orders"
                    value={String(Number(activePeriod.count ?? 0))}
                  />
                </div>
              </div>
            ) : null}

            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold text-black/50 dark:text-white/50">
                  Closed periods
                </h2>
                <button
              onClick={loadPeriods}
              disabled={loading}
              aria-label={loading ? "Loading periods" : "Load periods"}
              className="group relative flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-2.5 sm:px-5 sm:py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw
                size={16}
                className={`sm:w-[14px] sm:h-[14px] text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors ${
                  loading ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-semibold text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors">
                {loading ? "Loading..." : "Load periods"}
              </span>
              <div className="absolute inset-0 rounded-full bg-[#FF4DA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
              </div>

              {closedPeriods.length === 0 ? (
                <div className="p-6 sm:p-10 rounded-2xl border border-dashed border-black/15 dark:border-white/15 text-center">
                  <Calendar
                    size={32}
                    className="mx-auto mb-3 text-black/20 dark:text-white/20"
                  />
                  <p className="text-sm font-medium mb-1">No closed months yet</p>
                  <p className="text-xs text-black/50 dark:text-white/50 max-w-sm mx-auto leading-relaxed">
                    When you press{" "}
                    <span className="font-bold text-[#FF4DA3]">
                      Start new period
                    </span>{" "}
                    in Profit Analytics, each closed month will appear here.
                  </p>
                  <Link
                    href="/admin"
                    onClick={requestOpenProfitModal}
                    className="inline-block mt-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#FF4DA3] hover:underline"
                  >
                    Open Profit Analytics →
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]">
                  <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5 text-[9px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 font-bold">
                    <div className="col-span-4">Period</div>
                    <div className="col-span-2 text-right">Orders</div>
                    <div className="col-span-2 text-right">Revenue</div>
                    <div className="col-span-2 text-right">Profit</div>
                    <div className="col-span-2 text-right">Margin</div>
                  </div>
                  <div className="divide-y divide-black/5 dark:divide-white/5">
                    {closedPeriods.map((row) => (
                      <PeriodRow key={row.id} row={row} />
                    ))}
                  </div>
                </div>
              )}
            </section>

            <p className="text-[11px] text-black/45 dark:text-white/45 leading-relaxed">
              Revenue and profit are products only (shipping excluded). Each row
              is saved when you manually close a period — not tied to the
              calendar month.
            </p>
          </>
        )}
      </div>

      <AdminFooter />
    </main>
  );
}

function StatBlock({ label, value, accent = "" }) {
  return (
    <div className="rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/10 p-3 sm:p-0 sm:border-0 sm:bg-transparent">
      <p className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40">
        {label}
      </p>
      <p
        className={`text-base sm:text-xl font-bold tabular-nums break-words mt-0.5 ${accent}`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon, accent = "" }) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 min-w-0">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <Icon
          size={12}
          className={`shrink-0 ${accent || "text-black/40 dark:text-white/40"}`}
        />
        <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-black/40 dark:text-white/40 truncate">
          {label}
        </p>
      </div>
      <p
        className={`text-sm sm:text-xl font-bold tabular-nums break-words leading-tight ${accent}`}
      >
        {value}
      </p>
    </div>
  );
}

function PeriodRow({ row }) {
  const revenue = Number(row.revenue ?? 0);
  const profit = Number(row.profit ?? 0);
  const margin =
    revenue > 0 ? Math.round((profit / revenue) * 100) : null;
  const closedLabel = row.closed_at
    ? fmtLongDate(new Date(row.closed_at))
    : null;

  const profitClass =
    profit > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : profit < 0
        ? "text-red-600 dark:text-red-400"
        : "";

  return (
    <>
      <div className="sm:hidden px-3 py-4 space-y-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug">
            {row.label || "Period"}
          </p>
          {closedLabel ? (
            <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
              Closed {closedLabel}
            </p>
          ) : null}
          {row.incomplete > 0 ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-0.5">
              {row.incomplete} incomplete cost
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MobileStat label="Orders" value={row.count} />
          <MobileStat
            label="Revenue"
            value={`${Math.round(revenue).toLocaleString()} EGP`}
            accent="text-[#FF4DA3]"
          />
          <MobileStat
            label="Profit"
            value={`${Math.round(profit).toLocaleString()} EGP`}
            accent={profitClass}
            bold
          />
          <MobileStat
            label="Margin"
            value={margin !== null ? `${margin}%` : "—"}
            muted
          />
        </div>
      </div>

      <div className="hidden sm:grid px-4 py-3 grid-cols-12 gap-3 items-center text-sm">
        <div className="col-span-4 min-w-0">
          <p className="font-semibold truncate">{row.label || "Period"}</p>
          {closedLabel ? (
            <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
              Closed {closedLabel}
            </p>
          ) : null}
          {row.incomplete > 0 ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-0.5">
              {row.incomplete} incomplete cost
            </p>
          ) : null}
        </div>
        <div className="col-span-2 text-right font-medium tabular-nums">
          {row.count}
        </div>
        <div className="col-span-2 text-right font-medium tabular-nums text-[#FF4DA3]">
          {Math.round(revenue).toLocaleString()} EGP
        </div>
        <div className={`col-span-2 text-right font-bold tabular-nums ${profitClass}`}>
          {Math.round(profit).toLocaleString()} EGP
        </div>
        <div className="col-span-2 text-right text-black/50 dark:text-white/50 tabular-nums">
          {margin !== null ? `${margin}%` : "—"}
        </div>
      </div>
    </>
  );
}

function MobileStat({ label, value, accent = "", bold = false, muted = false }) {
  return (
    <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 p-2.5 min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm tabular-nums break-words leading-tight ${
          bold ? "font-bold" : "font-medium"
        } ${muted ? "text-black/50 dark:text-white/50" : accent}`}
      >
        {value}
      </p>
    </div>
  );
}

