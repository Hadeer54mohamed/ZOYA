"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import AdminFooter from "../components/admin-F";
import ThemeToggle from "../components/ThemeToggle";
import PasswordGate from "../components/PasswordGate";

import {
  Loader2,
  Package,
  Search,
  X,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Clock,
  RefreshCw,
  Phone,
  MapPin,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Eye,
  Tag,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Boxes,
  Palette,
  Ruler,
  AlertTriangle,
} from "lucide-react";

const STATUS_META = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-400/10",
    ring: "ring-amber-500/30 dark:ring-amber-400/30",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-400/10",
    ring: "ring-blue-500/30 dark:ring-blue-400/30",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 dark:bg-purple-400/10",
    ring: "ring-purple-500/30 dark:ring-purple-400/30",
  },
  delivered: {
    label: "Delivered",
    icon: PackageCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    ring: "ring-emerald-500/30 dark:ring-emerald-400/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 dark:bg-red-400/10",
    ring: "ring-red-500/30 dark:ring-red-400/30",
  },
};

const STATUS_ACTIONS = {
  pending: [
    { label: "Confirm", value: "confirmed", style: "bg-blue-500 hover:bg-blue-600" },
    { label: "Cancel", value: "cancelled", style: "bg-red-500/80 hover:bg-red-600" },
  ],
  confirmed: [
    { label: "Mark Shipped", value: "shipped", style: "bg-purple-500 hover:bg-purple-600" },
    { label: "Cancel", value: "cancelled", style: "bg-red-500/80 hover:bg-red-600" },
  ],
  shipped: [
    { label: "Mark Delivered", value: "delivered", style: "bg-emerald-500 hover:bg-emerald-600" },
  ],
  delivered: [],
  cancelled: [
    { label: "Reopen as Pending", value: "pending", style: "bg-amber-500 hover:bg-amber-600" },
  ],
};

// For a given order, figures out its sequence number among all orders made
// by the same phone, plus the total order count for that phone. Used to
// flag repeat customers in the order detail view.
function getCustomerOrderInfo(allOrders, currentOrder) {
  if (!currentOrder?.phone) return null;
  const sameCustomer = (Array.isArray(allOrders) ? allOrders : [])
    .filter((o) => o.phone === currentOrder.phone)
    // Oldest first so order #1 is the customer's first ever order.
    .sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return ta - tb;
    });
  const total = sameCustomer.length;
  if (total === 0) return null;
  const idx = sameCustomer.findIndex((o) => o.id === currentOrder.id);
  const index = idx >= 0 ? idx + 1 : total;
  return { index, total };
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const normalized =
      typeof iso === "string" &&
      !/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) &&
      /\d{2}:\d{2}/.test(iso)
        ? `${iso}Z`
        : iso;
    return new Date(normalized).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Cairo",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState("");

  return (
    <PasswordGate
      label="Admin Access"
      subtitle="Zoya Dashboard"
      scope="admin"
      onAuthorized={setPassword}
    >
      <AdminDashboard password={password} />
    </PasswordGate>
  );
}

function AdminDashboard({ password }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [profitModalOpen, setProfitModalOpen] = useState(false);
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [stockSummary, setStockSummary] = useState(null);
  const [stockBannerDismissed, setStockBannerDismissed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 9;
  const adminFetch = async (url, init = {}) => {
    return fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-pass": password,
        ...(init.headers || {}),
      },
    });
  };

  const fetchOrders = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setFetchError("");

    try {
      const res = await adminFetch("/api/orders?all=true");
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setFetchError(data?.error || "Failed to load orders.");
        return;
      }
      setOrders(data.orders || []);
    } catch {
      setFetchError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 30s and whenever the tab regains focus, so customer
  // edits made via /track show up without a manual refresh click.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders({ silent: true });
    }, 30000);
    const onFocus = () => fetchOrders({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll stock health for the dashboard banner / Products button badge.
  // Aggregates live Sanity stock with Supabase sales — refreshed every 60s
  // and on tab focus so the owner sees new alerts within a minute of an
  // order coming in.
  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    const loadStock = async () => {
      try {
        const res = await adminFetch("/api/products/analytics");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.success) return;
        setStockSummary((prev) => {
          const nextUrgent =
            (data.summary?.outOfStock || 0) + (data.summary?.oversold || 0);
          const prevUrgent = prev
            ? (prev.summary?.outOfStock || 0) + (prev.summary?.oversold || 0)
            : 0;
          // If a new urgent alert popped up since the last poll, un-dismiss
          // the banner so the owner gets re-pinged instead of missing it.
          if (nextUrgent > prevUrgent) {
            setStockBannerDismissed(false);
          }
          return {
            summary: data.summary,
            alerts: Array.isArray(data.alerts) ? data.alerts : [],
          };
        });
      } catch {
        /* silent — banner is non-critical */
      }
    };
    loadStock();
    const interval = setInterval(loadStock, 60_000);
    const onFocus = () => loadStock();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const stockAlertCount = stockSummary
    ? (stockSummary.summary?.outOfStock || 0) +
      (stockSummary.summary?.oversold || 0) +
      (stockSummary.summary?.lowStock || 0)
    : 0;
  const stockUrgentCount = stockSummary
    ? (stockSummary.summary?.outOfStock || 0) +
      (stockSummary.summary?.oversold || 0)
    : 0;

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await adminFetch("/api/orders", {
        method: "PATCH",
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        alert(data?.error || "Failed to update status.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
      );
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const deleteOrderPermanently = async (order) => {
    const ok = window.confirm(
      "Delete this order permanently?\n\nThis will:\n- remove the order from Supabase\n- restore stock if needed\n\nThis cannot be undone."
    );
    if (!ok) return;
    try {
      const res = await adminFetch("/api/orders", {
        method: "DELETE",
        body: JSON.stringify({ id: order.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        alert(data?.error || "Failed to delete order.");
        return;
      }
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setSelectedOrder((prev) => (prev?.id === order.id ? null : prev));
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const stats = useMemo(() => {
    const counts = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      revenue: 0,
      profit: 0,
      discountsTotal: 0,
      profitIncomplete: 0,
    };
    for (const o of orders) {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
      if (o.status !== "cancelled") {
        counts.revenue += Number(o.total_price ?? 0);
        counts.discountsTotal += Number(o.discount_amount ?? 0);

        if (o.cost_complete === false) {
          counts.profitIncomplete += 1;
        } else {
          // Profit = (items subtotal − discount) − total cost.
          // Shipping is excluded (it isn't ours to keep). We derive the items
          // subtotal from the line items so the math stays correct even if a
          // legacy order has a stale `total_price`.
          const itemsSubtotal = Array.isArray(o.items)
            ? o.items.reduce(
                (s, it) =>
                  s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
                0
              )
            : Math.max(
                0,
                Number(o.total_price ?? 0) - Number(o.shipping_fee ?? 0)
              );
          const discount = Number(o.discount_amount ?? 0);
          const totalCost = Number(o.total_cost ?? 0);
          counts.profit += itemsSubtotal - discount - totalCost;
        }
      }
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.order_id?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.phone?.includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const ordersFilterKey = `${search}::${statusFilter}`;
  const ordersFilterKeyRef = useRef(ordersFilterKey);
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
    const filtersChanged = ordersFilterKeyRef.current !== ordersFilterKey;
    ordersFilterKeyRef.current = ordersFilterKey;
    setCurrentPage((prev) => (filtersChanged ? 1 : Math.min(prev, maxPage)));
  }, [ordersFilterKey, filteredOrders.length, ordersPerPage]);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-500">
      <header className="sticky top-0 z-30 w-full border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/70 backdrop-blur-md transition-colors duration-500">
        <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] dark:opacity-[0.05]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: brand */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              aria-label="Back to home"
              className="shrink-0 transition-opacity hover:opacity-70 active:scale-95"
            >
              <Image
                src="/images/LOGO2.png"
                alt="ZØYA"
                width={90}
                height={28}
                priority
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </Link>

            <div className="hidden sm:block h-6 w-[1px] bg-black/10 dark:bg-white/10" />

            <div className="hidden sm:block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-black/40 dark:text-white/40 font-medium">
                Admin <span className="mx-1 text-[#FF4DA3]/40">/</span> Orders
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setProductsModalOpen(true)}
              className={`group relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border transition-all active:scale-95 ${
                stockUrgentCount > 0
                  ? "border-red-500/40 hover:border-red-500/60"
                  : stockAlertCount > 0
                  ? "border-amber-500/40 hover:border-amber-500/60"
                  : "border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30"
              }`}
            >
              <Boxes
                size={14}
                className={`transition-colors ${
                  stockUrgentCount > 0
                    ? "text-red-500"
                    : stockAlertCount > 0
                    ? "text-amber-500"
                    : "text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3]"
                }`}
              />
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-semibold text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors">
                Products
              </span>
              {stockAlertCount > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-black ${
                    stockUrgentCount > 0
                      ? "bg-red-500 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                  title={`${stockAlertCount} stock alert${stockAlertCount === 1 ? "" : "s"}`}
                >
                  {stockAlertCount > 99 ? "99+" : stockAlertCount}
                </span>
              )}
              <div className="absolute inset-0 rounded-full bg-[#FF4DA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => fetchOrders({ silent: true })}
              disabled={refreshing}
              className="group relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={`text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-semibold text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors">
                {refreshing ? "Updating..." : "Refresh"}
              </span>
              <div className="absolute inset-0 rounded-full bg-[#FF4DA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stock alert banner — shown when there are out-of-stock or
            oversold variants the admin needs to refill. Dismissible per
            session so the dashboard isn't loud after they've acknowledged. */}
        <AnimatePresence>
          {stockSummary && stockUrgentCount > 0 && !stockBannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className={`flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border ${
                  (stockSummary.summary?.oversold || 0) > 0
                    ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                }`}
              >
                <AlertTriangle
                  size={18}
                  strokeWidth={2.5}
                  className="shrink-0 mt-0.5 sm:mt-0"
                />
                <div className="flex-1 min-w-0 text-sm leading-relaxed">
                  <p className="font-bold mb-0.5">
                    {(stockSummary.summary?.oversold || 0) > 0
                      ? `${stockSummary.summary.oversold} product${stockSummary.summary.oversold === 1 ? "" : "s"} oversold — restock needed`
                      : `${stockSummary.summary.outOfStock} product${stockSummary.summary.outOfStock === 1 ? "" : "s"} out of stock`}
                  </p>
                  <p className="text-xs opacity-80">
                    {stockSummary.alerts
                      .slice(0, 3)
                      .map((a) =>
                        a.severity === "oversold"
                          ? `${a.name} (${a.totalStock})`
                          : `${a.name}${a.severity === "low" ? ` · ${a.totalStock} left` : ""}`
                      )
                      .join(" · ")}
                    {stockSummary.alerts.length > 3
                      ? ` · +${stockSummary.alerts.length - 3} more`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setProductsModalOpen(true)}
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition ${
                      (stockSummary.summary?.oversold || 0) > 0
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                    }`}
                  >
                    Review
                  </button>
                  <button
                    onClick={() => setStockBannerDismissed(true)}
                    aria-label="Dismiss"
                    className="h-8 w-8 grid place-items-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.total} icon={Package} accent="text-black dark:text-white" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} accent="text-amber-600 dark:text-amber-400" />
          <StatCard label="Confirmed" value={stats.confirmed} icon={CheckCircle2} accent="text-blue-600 dark:text-blue-400" />
          <StatCard label="Shipped" value={stats.shipped} icon={Truck} accent="text-purple-600 dark:text-purple-400" />
          <StatCard label="Delivered" value={stats.delivered} icon={PackageCheck} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} accent="text-red-600 dark:text-red-400" />
        </div>

        {/* Money stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            label="Revenue"
            value={`${Math.round(stats.revenue).toLocaleString()} EGP`}
            icon={CreditCard}
            accent="text-[#FF4DA3]"
            small
          />
          <StatCard
            label={
              stats.profitIncomplete > 0
                ? `Profit (excl. ${stats.profitIncomplete} incomplete)`
                : "Profit"
            }
            value={`${Math.round(stats.profit).toLocaleString()} EGP`}
            icon={TrendingUp}
            accent={
              stats.profit >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }
            small
            onClick={() => setProfitModalOpen(true)}
            hint="Click for breakdown"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, name, or phone..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40 text-sm placeholder:text-black/40 dark:placeholder:text-white/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-medium transition-all border ${
                  statusFilter === s
                    ? "border-[#FF4DA3] bg-[#FF4DA3]/15 text-[#FF4DA3]"
                    : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 text-black/60 dark:text-white/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-black/50 dark:text-white/50">
            <Loader2 className="animate-spin mb-3" size={28} />
            <p className="text-sm">Loading orders...</p>
          </div>
        ) : fetchError ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
            <AlertCircle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
            <div className="text-sm">{fetchError}</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-black/40 dark:text-white/40">
            <Package size={48} strokeWidth={1} className="mb-3" />
            <p className="text-sm">No orders match your filters.</p>
          </div>
        ) : (
          <>
            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  onClick={() => setSelectedOrder(o)}
                  customerOrderInfo={getCustomerOrderInfo(orders, o)}
                />
              ))}
            </div>

            {/* Pagination Controls - تظهر فقط إذا كان هناك أكثر من صفحة */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10 pb-10">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FF4DA3]/10 hover:border-[#FF4DA3]/30 transition-all font-medium text-sm"
                >
                  <ChevronRight className="rotate-180" size={16} />
                  
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest text-[#FF4DA3]">
                    {currentPage}
                  </span>
                  <span className="text-xs text-black/40 dark:text-white/40">/</span>
                  <span className="text-xs text-black/60 dark:text-white/60">
                    {totalPages}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FF4DA3]/10 hover:border-[#FF4DA3]/30 transition-all font-medium text-sm"
                >
                  
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateStatus}
            onDeleteOrder={deleteOrderPermanently}
            customerOrderInfo={getCustomerOrderInfo(orders, selectedOrder)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profitModalOpen && (
          <ProfitAnalyticsModal
            orders={orders}
            onClose={() => setProfitModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productsModalOpen && (
          <ProductAnalyticsModal
            password={password}
            onClose={() => setProductsModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AdminFooter />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profit analytics helpers
// All bucketing uses Africa/Cairo to match how orders are displayed elsewhere,
// so "today" / "this week" line up with the operator's local clock.
// ─────────────────────────────────────────────────────────────────────────────
const CAIRO_TZ = "Africa/Cairo";

// Fallback when there are no dated orders yet — same as launch in Terms.
// month is 0-indexed: 4 = May.
const BRAND_START_DATE = new Date(2026, 4, 1);

function fmtLongDate(d) {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toCairoDate(iso) {
  if (!iso) return null;
  const normalized =
    typeof iso === "string" &&
    !/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) &&
    /\d{2}:\d{2}/.test(iso)
      ? `${iso}Z`
      : iso;
  const utc = new Date(normalized);
  if (isNaN(utc)) return null;
  // Re-construct a Date object whose y/m/d/h match Cairo wall-clock time.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(utc);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
}

/** “Now” on the Cairo wall clock — use for week/day buckets so labels match order dates. */
function cairoWallNow() {
  return toCairoDate(new Date().toISOString()) ?? new Date();
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Earliest Cairo calendar day of a non-cancelled order; else any order; else null. */
function getFirstOrderDayStart(orders) {
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

// Week starts on Saturday — that's the standard week start in Egypt.
function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sun, 6 = Sat
  const diff = (day - 6 + 7) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfYear(d) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function fmtShortDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtMonthYear(d) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Profit math kept in one place — matches the per-order Profit breakdown card.
//   profit = (items subtotal − discount) − total cost  (shipping excluded)
// Returns null when the order has no cost data so we can flag/skip it.
function orderProfit(o) {
  if (o?.status === "cancelled") return null;
  if (o?.cost_complete === false) return null;
  const itemsSubtotal = Array.isArray(o?.items)
    ? o.items.reduce(
        (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
        0
      )
    : Math.max(0, Number(o?.total_price ?? 0) - Number(o?.shipping_fee ?? 0));
  const discount = Number(o?.discount_amount ?? 0);
  const totalCost = Number(o?.total_cost ?? 0);
  return itemsSubtotal - discount - totalCost;
}

function aggregateInRange(orders, from, to) {
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
    revenue += Number(o?.total_price ?? 0);
    discounts += Number(o?.discount_amount ?? 0);
    const p = orderProfit(o);
    if (p === null) {
      incomplete += 1;
    } else {
      profit += p;
    }
  }
  return { revenue, profit, discounts, count, incomplete };
}

function ProfitAnalyticsModal({ orders, onClose }) {
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

    const today = aggregateInRange(orders, todayStart, addDays(todayStart, 1));
    const yesterday = aggregateInRange(orders, yesterdayStart, todayStart);
    const thisWeek = aggregateInRange(orders, weekStart, addDays(weekStart, 7));
    const lastWeek = aggregateInRange(orders, lastWeekStart, weekStart);
    const thisMonth = aggregateInRange(orders, monthStart, addMonths(monthStart, 1));
    const lastMonth = aggregateInRange(orders, lastMonthStart, monthStart);
    const thisYear = aggregateInRange(orders, yearStart, addMonths(yearStart, 12));

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
      const stats = aggregateInRange(orders, start, end);
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
      const stats = aggregateInRange(orders, start, end);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/60"
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
              <b>Profit formula:</b>{" "}
              <span className="font-mono">(items subtotal − discount) − total cost</span>.
              Shipping fees are excluded since they aren&apos;t kept by the store.
              Cancelled orders are ignored. Orders with incomplete cost data
              (missing in Sanity) are counted in the order count but excluded
              from the profit total — fix them in Sanity to make the analytics
              fully accurate.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComparisonCard({ label, current, previous, previousLabel, accent, previousStartsBeforeBrand }) {
  // Decide whether we should compare to the previous period at all.
  // We only show a trend badge when both sides have meaningful data — comparing
  // a real week to an empty week (e.g. before the brand opened) would produce
  // a misleading "+∞%" / "-100%" change.
  const hasPrev =
    previous !== undefined &&
    !previousStartsBeforeBrand &&
    previous.count > 0;

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

  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
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

// ─────────────────────────────────────────────────────────────────────────────
// Product analytics — sales + stock per product/color/size
// ─────────────────────────────────────────────────────────────────────────────
function ProductAnalyticsModal({ password, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("products"); // products | colors | sizes
  const [productSearch, setProductSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [resettingStock, setResettingStock] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/products/analytics", {
          headers: { "x-admin-pass": password },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          setErr(json?.error || "Failed to load product analytics.");
        } else {
          setData(json);
        }
      } catch {
        if (!cancelled) setErr("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [password, reloadNonce]);

  const resetStockToInitial = async () => {
    if (resettingStock) return;
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) {
      alert("اختار منتج واحد على الأقل.");
      return;
    }
    const ok = window.confirm(
      `هترجّع المخزون لقيم initialStock للمنتجات المختارة (${ids.length}). متأكد؟`
    );
    if (!ok) return;
    setResettingStock(true);
    try {
      const res = await fetch("/api/products/reset-stock", {
        method: "POST",
        headers: { "x-admin-pass": password },
        body: JSON.stringify({ productIds: ids }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        alert(json?.error || "فشل Reset المخزون. جرّب تاني.");
        return;
      }
      alert(
        `تم Reset المخزون.\nProducts: ${json.productsTouched ?? 0}\nEntries: ${json.entriesSet ?? 0}`
      );
      setReloadNonce((n) => n + 1);
      setSelectedProductIds(new Set());
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setResettingStock(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return data.products;
    return data.products.filter((p) => p.name?.toLowerCase().includes(q));
  }, [data, productSearch]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/60"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#FF4DA3]/10 text-[#FF4DA3]">
              <Boxes size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Products & Inventory
              </h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mt-0.5">
                Sales + stock · cancelled excluded
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetStockToInitial}
              disabled={resettingStock || selectedProductIds.size === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-500/10 hover:border-red-500/30 transition-all text-[11px] font-black uppercase tracking-widest text-black/70 dark:text-white/70"
              title="Reset stock to initialStock (Sanity)"
            >
              <RefreshCw size={14} className={resettingStock ? "animate-spin" : ""} />
              Reset stock
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-black/50 dark:text-white/50">
              <Loader2 className="animate-spin mb-3" size={26} />
              <p className="text-xs">Loading analytics...</p>
            </div>
          ) : err ? (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
              <AlertCircle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
              <div className="text-sm">{err}</div>
            </div>
          ) : data ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard
                  label="Units Sold"
                  value={data.summary.totalUnitsSold.toLocaleString()}
                  hint={`${data.summary.uniqueProducts} unique products`}
                  icon={ShoppingBag}
                  accent="text-[#FF4DA3]"
                />
                <SummaryCard
                  label="Sales Revenue"
                  value={`${Math.round(data.summary.totalRevenue).toLocaleString()} EGP`}
                  hint={
                    data.summary.totalUnitsSold > 0
                      ? `Avg ${Math.round(
                          data.summary.totalRevenue / data.summary.totalUnitsSold
                        ).toLocaleString()} EGP / unit`
                      : "—"
                  }
                  icon={CreditCard}
                  accent="text-emerald-600 dark:text-emerald-400"
                />
                <SummaryCard
                  label="In Stock"
                  value={data.summary.totalStock.toLocaleString()}
                  hint={
                    data.summary.totalInitial > 0
                      ? `of ${data.summary.totalInitial.toLocaleString()} initial`
                      : `${data.summary.trackedProducts} tracked products`
                  }
                  icon={Boxes}
                  accent="text-blue-600 dark:text-blue-400"
                />
                <SummaryCard
                  label="Stock Alerts"
                  value={`${data.summary.outOfStock} out · ${data.summary.lowStock} low`}
                  hint={`Low ≤ ${data.summary.lowStockThreshold} units`}
                  icon={AlertTriangle}
                  accent={
                    data.summary.outOfStock > 0
                      ? "text-red-600 dark:text-red-400"
                      : data.summary.lowStock > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }
                />
              </div>

              {data.stockUnavailable && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
                  <AlertCircle size={13} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                  <p>
                    Stock data couldn&apos;t be loaded from Sanity. Sales numbers
                    below are still accurate, but inventory totals will be
                    missing until Sanity is reachable again.
                  </p>
                </div>
              )}

              {data.summary.untrackedProducts > 0 && (
                <p className="text-[11px] text-black/50 dark:text-white/50">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {data.summary.untrackedProducts}
                  </span>{" "}
                  product{data.summary.untrackedProducts === 1 ? "" : "s"} aren&apos;t
                  tracking stock yet — open them in Sanity and add a Stock-by-Size
                  row for each color to enable inventory tracking.
                </p>
              )}

              {/* Tabs */}
              <div className="flex gap-2 border-b border-black/10 dark:border-white/10">
                {[
                  { id: "products", label: "By Product", icon: Boxes },
                  { id: "colors", label: "By Color", icon: Palette },
                  { id: "sizes", label: "By Size", icon: Ruler },
                ].map((t) => {
                  const TI = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] uppercase tracking-widest font-bold transition-colors border-b-2 -mb-px ${
                        active
                          ? "text-[#FF4DA3] border-[#FF4DA3]"
                          : "text-black/50 dark:text-white/50 border-transparent hover:text-black dark:hover:text-white"
                      }`}
                    >
                      <TI size={12} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {tab === "products" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40 text-sm placeholder:text-black/40 dark:placeholder:text-white/30"
                    />
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-black/40 dark:text-white/40 text-xs">
                      No products match.
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                      {filteredProducts.map((p) => (
                        <ProductRow
                          key={p.id}
                          product={p}
                          expanded={expandedId === p.id}
                          selected={selectedProductIds.has(p.id)}
                          onSelect={(next) =>
                            setSelectedProductIds((prev) => {
                              const s = new Set(prev);
                              if (next) s.add(p.id);
                              else s.delete(p.id);
                              return s;
                            })
                          }
                          onToggle={() =>
                            setExpandedId((cur) => (cur === p.id ? null : p.id))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "colors" && (
                <DistributionTable
                  rows={data.colorTotals.map((c) => ({
                    key: c.name,
                    label: c.name,
                    units: c.units,
                  }))}
                  emptyMessage="No color data yet — sell something to see this fill up."
                  icon={Palette}
                />
              )}

              {tab === "sizes" && (
                <DistributionTable
                  rows={data.sizeTotals.map((s) => ({
                    key: s.size,
                    label: `Size ${s.size}`,
                    units: s.units,
                  }))}
                  emptyMessage="No size data yet."
                  icon={Ruler}
                />
              )}
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SummaryCard({ label, value, hint, icon: Icon, accent }) {
  return (
    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {label}
        </p>
        <Icon size={14} className={accent} />
      </div>
      <p className={`text-lg sm:text-xl font-bold ${accent} truncate`}>{value}</p>
      {hint && (
        <p className="text-[10px] text-black/40 dark:text-white/40 mt-1 truncate">
          {hint}
        </p>
      )}
    </div>
  );
}

function ProductRow({ product, expanded, onToggle, selected, onSelect }) {
  const tracked = product.tracked;
  const stock = product.totalStock;
  const initial = product.totalInitial;
  const sold = product.unitsSold;
  const needsRestock = tracked && stock <= 5;
  const isOutOfStock = tracked && stock <= 0;
  // Sell-through is what % of the initial stock has been sold. Only meaningful
  // when initialStock is set in Sanity.
  const sellThrough =
    initial > 0 ? Math.round((Math.min(sold, initial) / initial) * 100) : null;

  let stockBadge;
  if (!tracked) {
    stockBadge = (
      <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">
        Untracked
      </span>
    );
  } else if (isOutOfStock) {
    stockBadge = (
      <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] uppercase tracking-widest font-bold">
        Out of stock
      </span>
    );
  } else if (stock <= 5) {
    stockBadge = (
      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] uppercase tracking-widest font-bold">
        Low · {stock}
      </span>
    );
  } else {
    stockBadge = (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-widest font-bold">
        In stock · {stock}
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
      >
        <span className="shrink-0">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => onSelect?.(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 accent-[#FF4DA3]"
            aria-label={`Select ${product.name}`}
          />
        </span>
        <div className="w-12 h-14 sm:w-14 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-black/5 dark:bg-white/10">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-semibold truncate">{product.name}</p>
            {needsRestock && (
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.18em] font-black ${
                  isOutOfStock
                    ? "bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30"
                }`}
                title={isOutOfStock ? "Out of stock - restock needed" : "Low stock - restock soon"}
              >
                <AlertTriangle size={10} />
                Restock
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] text-black/50 dark:text-white/50">
              <b className="text-black dark:text-white">{sold.toLocaleString()}</b> sold
            </span>
            {product.revenue > 0 && (
              <span className="text-[10px] text-black/40 dark:text-white/40">
                · {Math.round(product.revenue).toLocaleString()} EGP
              </span>
            )}
            {sellThrough !== null && (
              <span className="text-[10px] text-black/40 dark:text-white/40">
                · {sellThrough}% sell-through
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          {stockBadge}
          {tracked && initial > 0 && (
            <span className="text-[10px] text-black/40 dark:text-white/40">
              {stock} / {initial}
            </span>
          )}
        </div>
        <ChevronRight
          size={16}
          className={`text-black/30 dark:text-white/30 shrink-0 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">
          {/* Mobile-only stock badge (above the breakdown) */}
          <div className="sm:hidden pt-3 flex items-center gap-2">
            {stockBadge}
            {tracked && initial > 0 && (
              <span className="text-[10px] text-black/40 dark:text-white/40">
                {stock} / {initial}
              </span>
            )}
          </div>

          {/* Stock breakdown */}
          {tracked && product.byColor.length > 0 && (
            <div className="space-y-2 pt-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-black/50 dark:text-white/50 flex items-center gap-1.5">
                <Boxes size={11} />
                Stock by color × size
              </p>
              <div className="space-y-2">
                {product.byColor.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-3"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-medium">{c.name}</span>
                      <span className="text-[10px] text-black/50 dark:text-white/50">
                        Total: <b>{c.totalStock}</b>
                        {c.totalInitial > 0 && (
                          <span className="opacity-60"> / {c.totalInitial}</span>
                        )}
                      </span>
                    </div>
                    {c.sizes.length === 0 ? (
                      <p className="text-[10px] text-black/40 dark:text-white/40">
                        No sizes set.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {c.sizes.map((s) => {
                          const isOut = s.stock === 0;
                          const isLow = !isOut && s.stock <= 5;
                          return (
                            <div
                              key={s.size}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border text-[11px] ${
                                isOut
                                  ? "bg-red-500/5 border-red-500/30 text-red-600 dark:text-red-400"
                                  : isLow
                                  ? "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400"
                                  : "bg-black/[0.03] dark:bg-white/5 border-black/10 dark:border-white/10"
                              }`}
                            >
                              <span className="font-bold uppercase">
                                {s.size}
                              </span>
                              <span>
                                {s.stock}
                                {s.initialStock != null && (
                                  <span className="opacity-50">
                                    {" "}
                                    / {s.initialStock}
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales breakdown */}
          {product.salesByColor.length > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-black/50 dark:text-white/50 flex items-center gap-1.5">
                <ShoppingBag size={11} />
                Sales breakdown
              </p>
              <div className="space-y-2">
                {product.salesByColor.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-3"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-medium">{c.name}</span>
                      <span className="text-[10px] text-black/50 dark:text-white/50">
                        <b>{c.units}</b> sold
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.sizes.map((s) => (
                        <span
                          key={s.size}
                          className="px-2 py-0.5 rounded-full bg-[#FF4DA3]/10 text-[10px] text-[#FF4DA3] font-bold uppercase tracking-wider"
                        >
                          {s.size === "—" ? "no size" : s.size} × {s.units}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-black/40 dark:text-white/40 italic">
              No sales for this product yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DistributionTable({ rows, emptyMessage, icon: Icon }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-12 text-black/40 dark:text-white/40 text-xs">
        {emptyMessage}
      </div>
    );
  }
  const max = Math.max(1, ...rows.map((r) => r.units));
  const total = rows.reduce((s, r) => s + r.units, 0);
  return (
    <div className="rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-[#FF4DA3]" />
          <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-black/60 dark:text-white/60">
            Distribution
          </h3>
        </div>
        <span className="text-[10px] text-black/40 dark:text-white/40">
          Total: <b className="text-black dark:text-white">{total}</b> units
        </span>
      </div>
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {rows.map((r) => {
          const pct = (r.units / max) * 100;
          const sharePct = total > 0 ? Math.round((r.units / total) * 100) : 0;
          return (
            <div key={r.key} className="px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs">
              <div className="col-span-4 sm:col-span-3 min-w-0">
                <p className="font-medium truncate">{r.label}</p>
              </div>
              <div className="col-span-6 sm:col-span-7">
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-[#FF4DA3] rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="col-span-2 text-right">
                <p className="font-bold">{r.units}</p>
                <p className="text-[9px] text-black/40 dark:text-white/40">
                  {sharePct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
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
                  {isEmpty ? "—" : `${Math.round(r.profit).toLocaleString()} EGP`}
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

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-black dark:text-white",
  small = false,
  onClick,
  hint,
}) {
  const baseCls = `p-4 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all w-full text-left ${
    onClick
      ? "cursor-pointer hover:border-[#FF4DA3]/40 hover:bg-[#FF4DA3]/[0.04] dark:hover:bg-white/[0.07] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF4DA3]/5"
      : ""
  }`;
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper onClick={onClick} className={baseCls}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {label}
        </p>
        <Icon size={14} className={accent} />
      </div>
      <p className={`${small ? "text-base sm:text-lg" : "text-2xl"} font-bold ${accent} truncate`}>
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-black/40 dark:text-white/40 mt-1 flex items-center gap-1">
          <BarChart3 size={9} />
          {hint}
        </p>
      )}
    </Wrapper>
  );
}

function OrderCard({ order, onClick, customerOrderInfo }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;
  const itemsCount = Array.isArray(order.items)
    ? order.items.reduce((sum, it) => sum + Number(it.quantity ?? 0), 0)
    : 0;
  const isReturning =
    customerOrderInfo && customerOrderInfo.total > 1;

  return (
    <button
      onClick={onClick}
      className="cursor-pointer text-left w-full p-5 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#FF4DA3]/60 hover:bg-[#FF4DA3]/[0.04] dark:hover:bg-white/[0.07] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF4DA3]/10 transition-all space-y-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-[#FF4DA3] tracking-wider truncate">
            {order.order_id}
          </p>
          <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
            {formatDateTime(order.created_at)}
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.color} ring-1 ${meta.ring} shrink-0`}
        >
          <StatusIcon size={11} />
          {meta.label}
        </div>
      </div>

      <div className="space-y-1 pt-3 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{order.customer_name}</p>
          {isReturning && (
            <span
              className="shrink-0 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold bg-[#FF4DA3]/10 text-[#FF4DA3] ring-1 ring-[#FF4DA3]/30"
              title={`This customer has placed ${customerOrderInfo.total} orders.`}
            >
              #{customerOrderInfo.index}/{customerOrderInfo.total}
            </span>
          )}
        </div>
        <p className="text-xs text-black/50 dark:text-white/50 flex items-center gap-1.5">
          <Phone size={11} />
          {order.phone}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
          <ShoppingBag size={12} />
          {itemsCount} {itemsCount === 1 ? "item" : "items"}
        </div>
        <div className="text-base font-bold text-[#FF4DA3]">
          {Number(order.total_price ?? 0).toLocaleString()} EGP
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-dashed border-black/10 dark:border-white/10">
        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase font-bold text-black/50 dark:text-white/50 group-hover:text-[#FF4DA3] transition-colors">
          <Eye size={12} />
          View Details
        </span>
        <ChevronRight
          size={16}
          className="text-black/30 dark:text-white/30 group-hover:text-[#FF4DA3] group-hover:translate-x-1 transition-all"
        />
      </div>
    </button>
  );
}

function OrderModal({ order, onClose, onUpdateStatus, onDeleteOrder, customerOrderInfo }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;
  const actions = STATUS_ACTIONS[order.status] ?? [];
  const items = Array.isArray(order.items) ? order.items : [];
  const [updating, setUpdating] = useState(null);

  const handleAction = async (newStatus) => {
    setUpdating(newStatus);
    await onUpdateStatus(order.id, newStatus);
    setUpdating(null);
  };

  const handleDelete = async () => {
    setUpdating("delete");
    await onDeleteOrder(order);
    setUpdating(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/60"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur">
          <div className="min-w-0">
            <p className="font-mono text-base sm:text-lg font-bold text-[#FF4DA3] tracking-wider truncate">
              {order.order_id}
            </p>
            <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">
              {formatDateTime(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${meta.bg} ${meta.color} ring-1 ${meta.ring} w-fit`}
            >
              <StatusIcon size={13} />
              {meta.label}
            </div>

            {customerOrderInfo && customerOrderInfo.total > 0 && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-widest w-fit ring-1 ${
                  customerOrderInfo.total > 1
                    ? "bg-[#FF4DA3]/10 text-[#FF4DA3] ring-[#FF4DA3]/30"
                    : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 ring-black/10 dark:ring-white/10"
                }`}
                title={
                  customerOrderInfo.total > 1
                    ? `This customer has placed ${customerOrderInfo.total} orders.`
                    : "This is the customer's first order."
                }
              >
                <ShoppingBag size={13} />
                {customerOrderInfo.total > 1
                  ? `Order #${customerOrderInfo.index} of ${customerOrderInfo.total}`
                  : "First order"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Customer" value={order.customer_name} />
            <InfoRow
              label="Phone"
              value={
                <a
                  href={`tel:${order.phone}`}
                  className="hover:text-[#FF4DA3] transition-colors"
                >
                  {order.phone}
                </a>
              }
              icon={Phone}
            />
            <InfoRow label="Governorate" value={order.governorate ?? "—"} icon={MapPin} />
            <InfoRow
              label="Payment"
              value={
                order.payment_method === "online"
                  ? "Instapay / Wallet"
                  : order.payment_method === "cash"
                  ? "Cash on Delivery"
                  : order.payment_method ?? "—"
              }
              icon={CreditCard}
            />
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-2">
              Address
            </p>
            <p className="text-sm leading-relaxed">{order.address}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-3">
              Items ({items.reduce((s, it) => s + Number(it.quantity ?? 0), 0)})
            </p>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={`${it.id}-${idx}`}
                  className="flex gap-4 items-center p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5"
                >
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 shrink-0">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{it.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(typeof it.color === "object" ? it.color?.name : it.color) && (
                        <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] uppercase tracking-wider text-black/60 dark:text-white/60">
                          {typeof it.color === "object" ? it.color.name : it.color}
                        </span>
                      )}
                      {it.size && (
                        <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] uppercase tracking-wider text-black/60 dark:text-white/60">
                          Size {it.size}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#FF4DA3]/10 text-[10px] uppercase tracking-wider text-[#FF4DA3] font-bold">
                        × {it.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">
                      {(Number(it.price) * Number(it.quantity)).toLocaleString()} EGP
                    </p>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
                      {Number(it.price).toLocaleString()} × {it.quantity}
                    </p>
                    {Number(it.cost ?? 0) > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400/70 mt-1">
                        cost: {(Number(it.cost) * Number(it.quantity)).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          {(() => {
            const itemsSubtotal = items.reduce(
              (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
              0
            );
            const discountAmount = Number(order.discount_amount ?? 0);
            const hasDiscount = discountAmount > 0 || !!order.discount_code;

            return (
              <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
                  <span>Items subtotal</span>
                  <span>{itemsSubtotal.toLocaleString()} EGP</span>
                </div>
                {order.shipping_fee !== null && order.shipping_fee !== undefined && (
                  <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
                    <span>Shipping</span>
                    <span>{Number(order.shipping_fee).toLocaleString()} EGP</span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="flex justify-between text-xs text-[#FF4DA3]">
                    <span className="flex items-center gap-1.5">
                      <Tag size={11} />
                      Discount
                      {order.discount_code && (
                        <span className="font-mono font-bold">({order.discount_code})</span>
                      )}
                    </span>
                    <span>− {discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-2 border-t border-black/10 dark:border-white/10">
                  <span className="text-sm font-serif italic">Total</span>
                  <span className="text-xl font-bold text-[#FF4DA3]">
                    {Number(order.total_price ?? 0).toLocaleString()} EGP
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Profit breakdown (admin only) */}
          {(() => {
            const hasCost =
              order.total_cost !== null && order.total_cost !== undefined;
            const hasProfit =
              order.profit !== null && order.profit !== undefined;
            if (!hasCost && !hasProfit) return null;

            // Profit math, broken out so it's auditable at a glance:
            //   itemsSubtotal − discount = netRevenue (what we actually keep on items)
            //   netRevenue − totalCost   = profit
            // Shipping is intentionally excluded — it isn't ours to keep.
            const itemsSubtotal = items.reduce(
              (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
              0
            );
            const discountAmount = Number(order.discount_amount ?? 0);
            const totalCost = Number(order.total_cost ?? 0);
            const netRevenue = Math.max(0, itemsSubtotal - discountAmount);
            const computedProfit = netRevenue - totalCost;
            const margin =
              netRevenue > 0
                ? Math.round((computedProfit / netRevenue) * 100)
                : null;
            const hasDiscount = discountAmount > 0 || !!order.discount_code;

            return (
              <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 dark:border-amber-500/20 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400/70 mb-1 flex items-center gap-1.5">
                  <TrendingUp size={11} />
                  Profit breakdown
                </p>

                {order.cost_complete === false && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-[11px] leading-relaxed">
                    <AlertCircle size={14} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-0.5">Cost data is incomplete</p>
                      <p className="text-black/60 dark:text-white/60">
                        One or more items don&apos;t have a cost set in Sanity (or Sanity was unreachable). The profit shown is unreliable. Set the cost in Sanity and re-check.
                      </p>
                      {Array.isArray(items) && items.some((it) => it.cost_known === false) && (
                        <ul className="mt-1.5 space-y-0.5 text-black/50 dark:text-white/50">
                          {items
                            .filter((it) => it.cost_known === false)
                            .map((it, i) => (
                              <li key={`missing-${i}`}>• {it.name}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-xs text-black/60 dark:text-white/60">
                  <span>Items subtotal</span>
                  <span>{itemsSubtotal.toLocaleString()} EGP</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-xs text-[#FF4DA3]">
                    <span className="flex items-center gap-1.5">
                      <Tag size={10} />
                      Discount{order.discount_code ? ` (${order.discount_code})` : ""}
                    </span>
                    <span>− {discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium text-black/70 dark:text-white/70 pt-1 border-t border-dashed border-amber-500/20">
                  <span>Net revenue (after discount)</span>
                  <span>{netRevenue.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-xs text-black/60 dark:text-white/60">
                  <span>Total cost</span>
                  <span>− {totalCost.toLocaleString()} EGP</span>
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-amber-500/20 dark:border-amber-500/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-serif italic">Profit</span>
                    {margin !== null && order.cost_complete !== false && (
                      <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                        ({margin}% margin)
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      order.cost_complete === false
                        ? "text-black/40 dark:text-white/40 line-through"
                        : computedProfit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {computedProfit.toLocaleString()} EGP
                  </span>
                </div>

                <p className="text-[10px] text-black/40 dark:text-white/40 italic pt-1">
                  Shipping is excluded — it isn&apos;t kept by the store.
                </p>
              </div>
            );
          })()}

          {/* Actions */}
          {actions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                Update status
              </p>
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => handleAction(a.value)}
                    disabled={updating !== null}
                    className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-widest uppercase text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${a.style}`}
                  >
                    {updating === a.value ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : null}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-black/40 dark:text-white/40 italic py-2">
              No further actions available for this status.
            </p>
          )}

          <div className="pt-2 border-t border-black/10 dark:border-white/10">
            <button
              onClick={handleDelete}
              disabled={updating !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-widest uppercase text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/15 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating === "delete" ? (
                <Loader2 className="animate-spin" size={15} />
              ) : null}
              Cancel + Delete Permanently
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
      <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-1 flex items-center gap-1">
        {Icon ? <Icon size={10} /> : null}
        {label}
      </p>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}
