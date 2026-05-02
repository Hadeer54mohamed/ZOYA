"use client";

import { useEffect, useMemo, useState } from "react";
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
  return (
    <PasswordGate
      label="Admin Access"
      subtitle="Zoya Dashboard"
      expectedPassword={process.env.NEXT_PUBLIC_ADMIN_PASS}
    >
      <AdminDashboard password={process.env.NEXT_PUBLIC_ADMIN_PASS} />
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
      profitIncomplete: 0,
    };
    for (const o of orders) {
      if (counts[o.status] !== undefined) counts[o.status] += 1;
      if (o.status !== "cancelled") {
        counts.revenue += Number(o.total_price ?? 0);
        if (o.cost_complete === false) {
          counts.profitIncomplete += 1;
        } else {
          // Recompute profit excluding shipping (shipping isn't ours to keep).
          const totalPrice = Number(o.total_price ?? 0);
          const shippingFee = Number(o.shipping_fee ?? 0);
          const totalCost = Number(o.total_cost ?? 0);
          counts.profit += totalPrice - shippingFee - totalCost;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onClick={() => setSelectedOrder(o)}
                customerOrderInfo={getCustomerOrderInfo(orders, o)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateStatus}
            customerOrderInfo={getCustomerOrderInfo(orders, selectedOrder)}
          />
        )}
      </AnimatePresence>
      <AdminFooter />
    </main>
  );
}

function StatCard({ label, value, icon: Icon, accent = "text-black dark:text-white", small = false }) {
  return (
    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {label}
        </p>
        <Icon size={14} className={accent} />
      </div>
      <p className={`${small ? "text-base sm:text-lg" : "text-2xl"} font-bold ${accent} truncate`}>
        {value}
      </p>
    </div>
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

function OrderModal({ order, onClose, onUpdateStatus, customerOrderInfo }) {
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
          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
              <span>Items subtotal</span>
              <span>
                {items.reduce(
                  (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
                  0
                ).toLocaleString()}{" "}
                EGP
              </span>
            </div>
            {order.shipping_fee !== null && order.shipping_fee !== undefined && (
              <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
                <span>Shipping</span>
                <span>{Number(order.shipping_fee).toLocaleString()} EGP</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 border-t border-black/10 dark:border-white/10">
              <span className="text-sm font-serif italic">Total</span>
              <span className="text-xl font-bold text-[#FF4DA3]">
                {Number(order.total_price ?? 0).toLocaleString()} EGP
              </span>
            </div>
          </div>

          {/* Profit breakdown (admin only) */}
          {(() => {
            const hasCost =
              order.total_cost !== null && order.total_cost !== undefined;
            const hasProfit =
              order.profit !== null && order.profit !== undefined;
            if (!hasCost && !hasProfit) return null;

            // Recompute profit on the fly to ignore shipping fees and any
            // legacy/incorrect stored values. Profit is the net of items
            // (after discount) minus the product cost — shipping is not
            // ours to keep.
            const totalPrice = Number(order.total_price ?? 0);
            const shippingFee = Number(order.shipping_fee ?? 0);
            const totalCost = Number(order.total_cost ?? 0);
            const computedProfit = totalPrice - shippingFee - totalCost;

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
                <span>Total cost</span>
                <span>{totalCost.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-amber-500/20 dark:border-amber-500/10">
                <span className="text-sm font-serif italic">Profit</span>
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
