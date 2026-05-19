"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import AdminFooter from "../components/AdminFooter";
import ThemeToggle from "../components/ThemeToggle";
import PasswordGate from "../components/PasswordGate";
import { consumeOpenProfitModalRequest } from "../lib/adminSession";

import { useLockBodyScroll } from "../../lib/useLockBodyScroll";
import {
  countInventoryNotifications,
  getStockLevel,
  LOW_STOCK_THRESHOLD,
} from "../lib/inventoryAlerts";
import {
  fulfillmentIssueMessage,
  fulfillmentReasonLabel,
  itemMatchesFulfillmentIssue,
  orderNeedsFulfillment,
} from "../lib/fulfillmentAlerts";
import { orderNetRevenue, orderProfit } from "../lib/orderMoney";
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
  Trash2,
  Boxes,
  Send,
  Palette,
  Ruler,
  AlertTriangle,
  Sparkles,
  Mail,
  ExternalLink,
} from "lucide-react";

const ProfitAnalyticsModal = dynamic(() => import("./ProfitAnalyticsModal"), {
  loading: () => <ProfitModalLoading />,
  ssr: false,
});

function ProfitModalLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[#FF4DA3]" />
    </div>
  );
}

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

function paymentMethodLabel(method) {
  if (method === "online") return "Instapay / Wallet";
  if (method === "cash") return "Cash on Delivery";
  if (method == null || method === "") return "—";
  return String(method);
}

const STATUS_ACTIONS = {
  pending: [
    {
      label: "Confirm",
      value: "confirmed",
      style: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Cancel",
      value: "cancelled",
      style: "bg-red-500/80 hover:bg-red-600",
    },
  ],
  confirmed: [
    {
      label: "Mark Shipped",
      value: "shipped",
      style: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "Cancel",
      value: "cancelled",
      style: "bg-red-500/80 hover:bg-red-600",
    },
  ],
  shipped: [
    {
      label: "Mark Delivered",
      value: "delivered",
      style: "bg-emerald-500 hover:bg-emerald-600",
    },
  ],
  delivered: [],
  cancelled: [
    {
      label: "Reopen as Pending",
      value: "pending",
      style: "bg-amber-500 hover:bg-amber-600",
    },
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
  const [inventoryAlertsModalOpen, setInventoryAlertsModalOpen] = useState(false);
  const [sendDropLoading, setSendDropLoading] = useState(false);
  const [newsletterProductId, setNewsletterProductId] = useState("");
  const [newsletterCatalog, setNewsletterCatalog] = useState([]);
  const [newsletterPickModalOpen, setNewsletterPickModalOpen] = useState(false);
  const [newsletterPickSearch, setNewsletterPickSearch] = useState("");
  const [stockSummary, setStockSummary] = useState(null);
  const [stockInventoryLoading, setStockInventoryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/products");
        const j = await r.json();
        if (cancelled || !j?.success || !Array.isArray(j.products)) return;
        const sorted = [...j.products].sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""), "en", {
            sensitivity: "base",
          }),
        );
        setNewsletterCatalog(sorted);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (newsletterPickModalOpen) setNewsletterPickSearch("");
  }, [newsletterPickModalOpen]);

  useEffect(() => {
    if (consumeOpenProfitModalRequest()) {
      setProfitModalOpen(true);
    }
  }, []);

  const hasOpenModal =
    profitModalOpen ||
    productsModalOpen ||
    inventoryAlertsModalOpen ||
    newsletterPickModalOpen ||
    discountModalOpen ||
    Boolean(selectedOrder);

  useLockBodyScroll(hasOpenModal);

  const newsletterPickedProduct = useMemo(
    () => newsletterCatalog.find((p) => p.id === newsletterProductId) ?? null,
    [newsletterCatalog, newsletterProductId],
  );

  const newsletterFilteredCatalog = useMemo(() => {
    const q = newsletterPickSearch.trim().toLowerCase();
    if (!q) return newsletterCatalog;
    return newsletterCatalog.filter(
      (p) =>
        (p.name && String(p.name).toLowerCase().includes(q)) ||
        (p.id && String(p.id).toLowerCase().includes(q)),
    );
  }, [newsletterCatalog, newsletterPickSearch]);

  const sendManualDropEmail = async () => {
    if (sendDropLoading || !password) return;
    const slug = newsletterProductId.trim();
    const scopeHint = slug
      ? `Selected product (slug: ${slug}).`
      : "Latest product in Sanity (by creation date, automatic).";
    const confirmed = window.confirm(
      `Send a Manual Drop email to all newsletter subscribers?\n${scopeHint}\nContinue?`,
    );
    if (!confirmed) return;
    setSendDropLoading(true);
    try {
      const res = await adminFetch("/api/newsletter/send-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slug ? { productId: slug } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Newsletter send failed.");
        return;
      }
      const ok =
        json.success === true ||
        (json.batchesFailed === 0 && (json.sentPayloads ?? 0) > 0);
      alert(
        ok
          ? `Sent.\nCampaign: ${json.campaignId ?? "—"}\nRecipients (individual messages): ${json.sentPayloads ?? "—"}\nSuccessful batches: ${json.batchesSucceeded ?? "—"} / ${json.batchesAttempted ?? "—"}\nTotal batch retries: ${json.batchRetries ?? 0}\nProduct: ${json.product ?? "—"}${json.usedLatestProduct === false ? " (picked)" : json.usedLatestProduct === true ? " (latest)" : ""}`
          : `Send finished with failed batches.\nCheck server logs.\n${JSON.stringify(json, null, 2)}`,
      );
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSendDropLoading(false);
    }
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

  const loadStockSummary = useCallback(async () => {
    if (!password) {
      setStockInventoryLoading(false);
      return;
    }
    setStockInventoryLoading(true);
    try {
      const res = await adminFetch("/api/products/analytics");
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.success) return;
      setStockSummary({
        summary: data.summary,
        alerts: Array.isArray(data.alerts) ? data.alerts : [],
        catalogAlerts: Array.isArray(data.catalogAlerts)
          ? data.catalogAlerts
          : [],
        stockAlerts: Array.isArray(data.stockAlerts) ? data.stockAlerts : [],
      });
    } catch {
      /* silent — banner is non-critical */
    } finally {
      setStockInventoryLoading(false);
    }
  }, [password]);

  // Poll stock health for the dashboard banner / Products button badge.
  useEffect(() => {
    if (!password) return;
    loadStockSummary();
    const interval = setInterval(loadStockSummary, 60_000);
    const onFocus = () => loadStockSummary();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [password, loadStockSummary]);

  const inventoryNotifications = stockSummary
    ? countInventoryNotifications(stockSummary)
    : { total: 0, urgent: 0 };
  const stockAlertCount = inventoryNotifications.total;
  const stockUrgentCount = inventoryNotifications.urgent;

  const inventoryBannerTitle = useMemo(() => {
    if (!stockSummary?.summary) return "";
    const s = stockSummary.summary;
    const parts = [];
    if (s.oversold > 0 || s.variantOversold > 0)
      parts.push(
        `${(s.oversold || 0) + (s.variantOversold || 0)} oversold`,
      );
    if (s.outOfStock > 0 || s.variantOut > 0)
      parts.push(
        `${(s.outOfStock || 0) + (s.variantOut || 0)} out of stock`,
      );
    if (s.lowStock > 0 || s.variantLow > 0)
      parts.push(
        `${(s.lowStock || 0) + (s.variantLow || 0)} running low`,
      );
    if (s.colorsWithoutStock > 0)
      parts.push(`${s.colorsWithoutStock} color(s) missing stock rows`);
    if (s.missingSizes > 0) parts.push(`${s.missingSizes} missing size(s)`);
    if (s.untrackedProducts > 0)
      parts.push(`${s.untrackedProducts} not tracking stock`);
    return parts.length
      ? `Inventory: ${parts.join(" · ")}`
      : "Inventory attention needed";
  }, [stockSummary]);

  const inventoryBannerDetail = useMemo(() => {
    if (!stockSummary) return "";
    const lines = [
      ...(stockSummary.catalogAlerts || []).slice(0, 2).map((a) => a.message),
      ...(stockSummary.stockAlerts || []).slice(0, 2).map((a) => a.message),
    ];
    if (lines.length) return lines.join(" · ");
    return (stockSummary.alerts || [])
      .slice(0, 3)
      .map((a) =>
        a.severity === "oversold"
          ? `${a.name} (${a.totalStock})`
          : `${a.name}${a.severity === "low" ? ` · ${a.totalStock} left` : ""}`,
      )
      .join(" · ");
  }, [stockSummary]);

  const inventoryBannerTone = useMemo(() => {
    const s = stockSummary?.summary || {};
    const catalog = stockSummary?.catalogAlerts || [];
    if (
      s.oversold > 0 ||
      s.variantOversold > 0 ||
      catalog.some((a) => a.severity === "error")
    ) {
      return "urgent";
    }
    if (s.outOfStock > 0 || s.variantOut > 0) return "warning";
    if (s.lowStock > 0 || s.variantLow > 0) return "low";
    return "setup";
  }, [stockSummary]);

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
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: newStatus } : prev,
      );
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const deleteOrderPermanently = async (order) => {
    const ok = window.confirm(
      "Delete this order permanently?\n\nThis will:\n- remove the order from Supabase\n- restore stock if needed\n\nThis cannot be undone.",
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
        counts.revenue += Number(
          o.net_product_revenue ?? orderNetRevenue(o),
        );
        counts.discountsTotal += Number(o.discount_amount ?? 0);

        if (o.cost_complete === false) {
          counts.profitIncomplete += 1;
        } else {
          const p =
            o.net_product_profit !== null && o.net_product_profit !== undefined
              ? Number(o.net_product_profit)
              : orderProfit(o);
          if (p !== null && !Number.isNaN(p)) counts.profit += p;
        }
      }
    }
    return counts;
  }, [orders]);

  const ordersNeedingFulfillment = useMemo(
    () => orders.filter((o) => orderNeedsFulfillment(o)),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter === "restock") {
        if (!orderNeedsFulfillment(o)) return false;
      } else if (statusFilter !== "all" && o.status !== statusFilter) {
        return false;
      }
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
    const maxPage = Math.max(
      1,
      Math.ceil(filteredOrders.length / ordersPerPage),
    );
    const filtersChanged = ordersFilterKeyRef.current !== ordersFilterKey;
    ordersFilterKeyRef.current = ordersFilterKey;
    setCurrentPage((prev) => (filtersChanged ? 1 : Math.min(prev, maxPage)));
  }, [ordersFilterKey, filteredOrders.length, ordersPerPage]);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-500">
      <header className="sticky top-0 z-30 w-full border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/70 backdrop-blur-md transition-colors duration-500">
        <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.03] dark:opacity-[0.05]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-0 sm:min-h-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand row */}
          <div className="flex items-center justify-between gap-3 min-w-0 sm:justify-start">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <Link
              href="/"
              aria-label="Back to home"
              className="shrink-0 transition-opacity hover:opacity-70 active:scale-95"
            >
              <Image
                src="/images/LOGO2.webp"
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

            <p className="sm:hidden text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 font-semibold truncate">
              Admin · Orders
            </p>
            </div>

            <div className="shrink-0 sm:hidden">
              <ThemeToggle />
            </div>
          </div>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar sm:overflow-visible">
            <div className="flex items-center gap-2 w-max sm:w-auto sm:flex-wrap sm:justify-end">
              <div className="flex items-center gap-2 shrink-0 pr-2 sm:pr-0 border-r border-black/10 dark:border-white/10 sm:border-r-0">
              <button
                type="button"
                onClick={() => setNewsletterPickModalOpen(true)}
                disabled={sendDropLoading || !password}
                title="Pick newsletter product (or latest product)"
                aria-label="Pick newsletter product"
                aria-haspopup="dialog"
                aria-expanded={newsletterPickModalOpen}
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#FF4DA3]/40 transition-all active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
              >
                <span className="relative h-9 w-9 shrink-0 rounded-lg overflow-hidden  grid place-items-center">
                  {newsletterPickedProduct?.image ? (
                    <Image
                      src={newsletterPickedProduct.image}
                      alt=""
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                      sizes="36px"
                    />
                  ) : (
                    <Sparkles
                      size={16}
                      className="text-[#FF4DA3]/80"
                      aria-hidden
                    />
                  )}
                </span>
                <span className="hidden sm:flex flex-col items-start min-w-0 max-w-[120px] text-left leading-tight">
                 
                  <span className="text-[10px] font-bold text-black/75 dark:text-white/80 truncate w-full">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-black/40 dark:text-white/45 font-semibold">
                    Newsletter
                  </span> {""}
                    {newsletterProductId
                      ? newsletterPickedProduct?.name || newsletterProductId
                      : "Latest product"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={sendManualDropEmail}
                disabled={sendDropLoading || !password}
                aria-label={sendDropLoading ? "Sending drop email" : "Send drop email"}
                className="group relative flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-2.5 sm:px-5 sm:py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/40 transition-all active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                title="Send Manual Drop via Resend (batched + retries). Optional: pick a product or use latest."
              >
                <Send
                  size={16}
                  className={`sm:w-[14px] sm:h-[14px] text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors ${
                    sendDropLoading ? "animate-pulse" : ""
                  }`}
                />
                <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-semibold text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors">
                  {sendDropLoading ? "Sending…" : "Send Drop Email"}
                </span>
                <div className="absolute inset-0 rounded-full bg-[#FF4DA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <button
              onClick={() => setProductsModalOpen(true)}
              aria-label="Products and stock"
              className={`group relative flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-2.5 sm:px-5 sm:py-2.5 rounded-full bg-black/5 dark:bg-white/5 border transition-all active:scale-95 shrink-0 ${
                stockUrgentCount > 0
                  ? "border-red-500/40 hover:border-red-500/60"
                  : stockAlertCount > 0
                    ? "border-amber-500/40 hover:border-amber-500/60"
                    : "border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30"
              }`}
            >
              <Boxes
                size={16}
                className={`sm:w-[14px] sm:h-[14px] transition-colors ${
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
                  title={`${stockAlertCount} inventory alert${stockAlertCount === 1 ? "" : "s"}`}
                >
                  {stockAlertCount > 99 ? "99+" : stockAlertCount}
                </span>
              )}
              <div className="absolute inset-0 rounded-full bg-[#FF4DA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={() => setDiscountModalOpen(true)}
              aria-label="Discount codes"
              className="group relative flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-2.5 sm:px-5 sm:py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30 transition-all active:scale-95 shrink-0"
            >
              <Tag
                size={16}
                className="sm:w-[14px] sm:h-[14px] text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors"
              />
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-semibold text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors">
                Discount Code
              </span>
              <div className="absolute inset-0 rounded-full bg-[#FF4DA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => fetchOrders({ silent: true })}
              disabled={refreshing}
              aria-label={refreshing ? "Refreshing orders" : "Refresh orders"}
              className="group relative flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-2.5 sm:px-5 sm:py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#FF4DA3]/30 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw
                size={16}
                className={`sm:w-[14px] sm:h-[14px] text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-semibold text-black/60 dark:text-white/70 group-hover:text-[#FF4DA3] transition-colors">
                {refreshing ? "Updating..." : "Refresh"}
              </span>
              <div className="absolute inset-0 rounded-full bg-[#FF4DA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="hidden sm:block shrink-0">
              <ThemeToggle />
            </div>
            </div>
          </div>
        </div>
      </header>

      {(stockInventoryLoading || stockAlertCount > 0) && (
        <div
          className={`border-b ${
            stockInventoryLoading
              ? "bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10"
              : inventoryBannerTone === "urgent"
                ? "bg-red-500/15 border-red-500/40"
                : inventoryBannerTone === "warning" ||
                    inventoryBannerTone === "low"
                  ? "bg-amber-500/15 border-amber-500/40"
                  : "bg-violet-500/15 border-violet-500/40"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-start sm:items-center gap-3 sm:gap-4">
            {stockInventoryLoading ? (
              <>
                <Loader2
                  size={18}
                  className="shrink-0 animate-spin text-black/40 dark:text-white/40"
                />
                <p className="text-sm text-black/60 dark:text-white/60">
                  Checking inventory…
                </p>
              </>
            ) : (
              <>
                <AlertTriangle
                  size={20}
                  strokeWidth={2.5}
                  className={`shrink-0 mt-0.5 sm:mt-0 ${
                    inventoryBannerTone === "urgent"
                      ? "text-red-600 dark:text-red-400"
                      : inventoryBannerTone === "setup"
                        ? "text-violet-700 dark:text-violet-300"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm sm:text-base font-bold leading-snug ${
                      inventoryBannerTone === "urgent"
                        ? "text-red-800 dark:text-red-200"
                        : inventoryBannerTone === "setup"
                          ? "text-violet-900 dark:text-violet-100"
                          : "text-amber-900 dark:text-amber-100"
                    }`}
                  >
                    {inventoryBannerTitle}
                  </p>
                  <p
                    className={`text-xs sm:text-sm mt-0.5 ${
                      inventoryBannerTone === "urgent"
                        ? "text-red-700/90 dark:text-red-200/80"
                        : inventoryBannerTone === "setup"
                          ? "text-violet-800/90 dark:text-violet-100/80"
                          : "text-amber-800/90 dark:text-amber-100/80"
                    }`}
                  >
                    {inventoryBannerDetail}
                    {stockAlertCount > 4
                      ? ` · +${stockAlertCount - 4} more`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInventoryAlertsModalOpen(true)}
                  className={`shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition ${
                    inventoryBannerTone === "urgent"
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/25"
                      : inventoryBannerTone === "setup"
                        ? "bg-violet-600 text-white hover:bg-violet-700"
                        : "bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-500/20"
                  }`}
                >
                  View issues
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {ordersNeedingFulfillment.length > 0 && (
        <div className="border-b border-red-500/40 bg-red-600/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Package
                size={20}
                className="shrink-0 text-red-600 dark:text-red-400 mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-bold text-red-900 dark:text-red-100">
                  {ordersNeedingFulfillment.length} order
                  {ordersNeedingFulfillment.length === 1 ? "" : "s"} need
                  restock — customer ordered unavailable items
                </p>
                <p className="text-xs sm:text-sm text-red-800/90 dark:text-red-200/80 mt-0.5 truncate">
                  {ordersNeedingFulfillment
                    .slice(0, 2)
                    .map((o) => o.order_id)
                    .join(" · ")}
                  {ordersNeedingFulfillment.length > 2
                    ? ` · +${ordersNeedingFulfillment.length - 2} more`
                    : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter("restock")}
              className="shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
            >
              Show orders
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
{/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Package}
            accent="text-black dark:text-white"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            accent="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            icon={CheckCircle2}
            accent="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Shipped"
            value={stats.shipped}
            icon={Truck}
            accent="text-purple-600 dark:text-purple-400"
          />
          <StatCard
            label="Delivered"
            value={stats.delivered}
            icon={PackageCheck}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            accent="text-red-600 dark:text-red-400"
          />
        </div>

        {/* Money stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            label="Revenue"
            value={`${Math.round(stats.revenue).toLocaleString()} EGP`}
            icon={CreditCard}
            accent="text-[#FF4DA3]"
            small
            hint="Products only · shipping excluded"
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
            hint="Products only · shipping excluded"
          />
        </div>

        <Link
          href="/admin/monthly"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-[#FF4DA3]/25 bg-[#FF4DA3]/[0.04] dark:bg-[#FF4DA3]/[0.06] hover:border-[#FF4DA3]/50 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#FF4DA3]/10 text-[#FF4DA3]">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-black/70 dark:text-white/70">
                Monthly profit archive
              </p>
              <p className="text-[11px] text-black/50 dark:text-white/50 truncate">
                Every closed period · profit, revenue & orders
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-[#FF4DA3] shrink-0 group-hover:translate-x-0.5 transition-transform"
          />
        </Link>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, name, or phone..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40 text-sm placeholder:text-black/40 dark:placeholder:text-white/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "restock",
              "pending",
              "confirmed",
              "shipped",
              "delivered",
              "cancelled",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-lg text-[11px] uppercase tracking-widest font-medium transition-all border ${
                  statusFilter === s
                    ? "border-[#FF4DA3] bg-[#FF4DA3]/15 text-[#FF4DA3]"
                    : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 text-black/60 dark:text-white/60"
                }`}
              >
                {s === "restock"
                  ? `restock${ordersNeedingFulfillment.length > 0 ? ` (${ordersNeedingFulfillment.length})` : ""}`
                  : s}
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
            <AlertCircle
              size={18}
              strokeWidth={2.5}
              className="shrink-0 mt-0.5"
            />
            <div className="text-sm">{fetchError}</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-black/40 dark:text-white/40">
            <Package size={48} strokeWidth={1} className="mb-3" />
            <p className="text-sm">No orders match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {paginatedOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  onClick={() => setSelectedOrder(o)}
                  customerOrderInfo={getCustomerOrderInfo(orders, o)}
                />
              ))}
            </div>

            <div className="mt-8 pb-10 flex flex-col items-center gap-4 border-t border-black/10 dark:border-white/10 pt-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/45 dark:text-white/45 text-center">
                Showing{" "}
                <span className="font-bold text-black/70 dark:text-white/70">
                  {(currentPage - 1) * ordersPerPage + 1}–
                  {Math.min(currentPage * ordersPerPage, filteredOrders.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-black/70 dark:text-white/70">
                  {filteredOrders.length}
                </span>{" "}
                orders · 6 per page
              </p>

              {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FF4DA3]/10 hover:border-[#FF4DA3]/30 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                >
                  <ChevronRight className="rotate-180" size={16} />
                  Prev
                </button>

                <div className="flex items-center gap-1 px-1 max-w-[min(100%,16rem)] overflow-x-auto no-scrollbar">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Page ${page}`}
                        aria-current={
                          page === currentPage ? "page" : undefined
                        }
                        className={`min-w-[2.25rem] h-9 px-2 rounded-full text-xs font-bold shrink-0 transition-all ${
                          page === currentPage
                            ? "bg-[#FF4DA3] text-white shadow-[0_0_20px_-6px_#FF4DA3]"
                            : "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:border-[#FF4DA3]/30 hover:text-[#FF4DA3]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FF4DA3]/10 hover:border-[#FF4DA3]/30 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateStatus}
            onDeleteOrder={deleteOrderPermanently}
            customerOrderInfo={getCustomerOrderInfo(orders, selectedOrder)}
          />
        )}
{profitModalOpen && (
          <ProfitAnalyticsModal
            orders={orders}
            adminFetch={adminFetch}
            onClose={() => setProfitModalOpen(false)}
          />
        )}
{inventoryAlertsModalOpen && (
          <InventoryAlertsModal
            stockSummary={stockSummary}
            loading={stockInventoryLoading}
            onClose={() => setInventoryAlertsModalOpen(false)}
            onRefresh={loadStockSummary}
            onOpenFullInventory={() => {
              setInventoryAlertsModalOpen(false);
              setProductsModalOpen(true);
            }}
          />
        )}
{productsModalOpen && (
          <ProductAnalyticsModal
            password={password}
            onClose={() => setProductsModalOpen(false)}
          />
        )}
{newsletterPickModalOpen && (
          <div
            className="animate-ui-fade-in fixed inset-0 z-[60] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setNewsletterPickModalOpen(false)}
            role="presentation"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="animate-ui-fade-in-up w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/25"
              role="dialog"
              aria-modal="true"
              aria-labelledby="newsletter-pick-title"
            >
              <div className="shrink-0 flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-black/10 dark:border-white/10">
                <div className="min-w-0">
                  <h2
                    id="newsletter-pick-title"
                    className="text-base sm:text-lg font-bold tracking-tight"
                  >
                    Newsletter product
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/45 dark:text-white/45 mt-0.5">
                    Image + name · or latest product (automatic)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewsletterPickModalOpen(false)}
                  aria-label="Close"
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="shrink-0 px-4 sm:px-5 pt-3 pb-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/35"
                    size={16}
                  />
                  <input
                    type="search"
                    value={newsletterPickSearch}
                    onChange={(e) => setNewsletterPickSearch(e.target.value)}
                    placeholder="Search by name or slug…"
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#FF4DA3]/35"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 pb-5 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewsletterProductId("");
                      setNewsletterPickModalOpen(false);
                    }}
                    className={`group text-left rounded-2xl border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA3] ${
                      !newsletterProductId
                        ? "border-[#FF4DA3] ring-2 ring-[#FF4DA3]/25 shadow-[0_0_0_1px_rgba(255,77,163,0.2)]"
                        : "border-black/10 dark:border-white/10 hover:border-[#FF4DA3]/50"
                    }`}
                  >
                    <div className="aspect-square bg-gradient-to-br from-[#FF4DA3]/20 to-black/5 dark:to-white/5 grid place-items-center">
                      <Sparkles
                        size={32}
                        className="text-[#FF4DA3]"
                        strokeWidth={2}
                      />
                    </div>
                    <div className="p-2.5 border-t border-black/5 dark:border-white/5">
                      <p className="text-[11px] font-black uppercase tracking-wide text-[#FF4DA3]">
                        Automatic
                      </p>
                      <p className="text-[10px] text-black/55 dark:text-white/50 mt-0.5 line-clamp-2">
                        Latest product in Sanity (by creation date)
                      </p>
                    </div>
                  </button>

                  {newsletterFilteredCatalog.map((p) => {
                    const selected = newsletterProductId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setNewsletterProductId(p.id);
                          setNewsletterPickModalOpen(false);
                        }}
                        className={`group text-left rounded-2xl border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA3] ${
                          selected
                            ? "border-[#FF4DA3] ring-2 ring-[#FF4DA3]/25 shadow-[0_0_0_1px_rgba(255,77,163,0.2)]"
                            : "border-black/10 dark:border-white/10 hover:border-[#FF4DA3]/40"
                        }`}
                      >
                        <div className="aspect-square relative bg-black/[0.04] dark:bg-white/[0.06]">
                          {p.image ? (
                            <Image
                              src={p.image}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width:640px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-[10px] font-bold text-black/30 dark:text-white/30">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 border-t border-black/5 dark:border-white/5">
                          <p className="text-[11px] font-bold text-black/90 dark:text-white/90 line-clamp-2 leading-snug">
                            {p.name}
                          </p>
                          <p className="text-[9px] text-black/40 dark:text-white/40 mt-0.5 font-mono truncate">
                            {p.id}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {newsletterPickSearch.trim() &&
                  newsletterFilteredCatalog.length === 0 && (
                    <p className="text-center text-xs text-black/50 dark:text-white/45 py-4">
                      No products match your search. Try other keywords or clear
                      the search.
                    </p>
                  )}

                {newsletterCatalog.length === 0 && (
                  <p className="text-center text-sm text-black/45 dark:text-white/45 py-6">
                    No products loaded. Check your connection or{" "}
                    <code className="text-[11px]">/api/products</code>.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
{discountModalOpen && (
          <DiscountCodeModal onClose={() => setDiscountModalOpen(false)} />
        )}
<AdminFooter />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discount code row (Manage tab): edit fields, toggle active, delete
// ─────────────────────────────────────────────────────────────────────────────
function DiscountCodeListRow({ code, onPatch, onDelete }) {
  const [codeStr, setCodeStr] = useState(code.code);
  const [discountType, setDiscountType] = useState(code.discount_type);
  const [valueStr, setValueStr] = useState(String(code.value ?? ""));
  const [limitStr, setLimitStr] = useState(
    code.usage_limit != null && code.usage_limit !== ""
      ? String(code.usage_limit)
      : "",
  );
  const [savingEdits, setSavingEdits] = useState(false);
  const [inlineErr, setInlineErr] = useState("");

  useEffect(() => {
    setCodeStr(code.code);
    setDiscountType(code.discount_type);
    setValueStr(String(code.value ?? ""));
    setLimitStr(
      code.usage_limit != null && code.usage_limit !== ""
        ? String(code.usage_limit)
        : "",
    );
    setInlineErr("");
  }, [code.id, code.code, code.discount_type, code.value, code.usage_limit]);

  const saveEdits = async () => {
    setInlineErr("");
    const v = parseInt(valueStr, 10);
    if (!Number.isFinite(v) || v < 0) {
      setInlineErr("Enter a whole number for value.");
      return;
    }
    if (discountType === "PERCENT" && v > 100) {
      setInlineErr("Percent cannot exceed 100.");
      return;
    }
    let usageLimit = null;
    if (limitStr.trim() !== "") {
      usageLimit = parseInt(limitStr, 10);
      if (!Number.isFinite(usageLimit) || usageLimit < 1) {
        setInlineErr("Usage limit must be a positive integer or empty.");
        return;
      }
    }
    const nextCode = codeStr.trim().toUpperCase();
    if (!nextCode) {
      setInlineErr("Code cannot be empty.");
      return;
    }
    setSavingEdits(true);
    await onPatch(code.id, {
      code: nextCode,
      discount_type: discountType,
      value: v,
      usage_limit: usageLimit,
    });
    setSavingEdits(false);
  };

  return (
    <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#FF4DA3]">
              {code.code}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                code.is_active
                  ? "bg-green-500/15 text-green-700 dark:text-green-300"
                  : "bg-red-500/15 text-red-700 dark:text-red-300"
              }`}
            >
              {code.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-black/60 dark:text-white/60">
            {code.discount_type === "PERCENT"
              ? `${code.value}% off`
              : `${code.value} EGP off`}
            {code.usage_limit != null &&
              ` · Used ${code.usage_count ?? 0}/${code.usage_limit}`}
            {(code.usage_limit == null || code.usage_limit === "") &&
              ` · Used ${code.usage_count ?? 0} times`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(code.id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-xs font-semibold shrink-0"
          title="Delete this code"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      <div className="pt-1 border-t border-black/10 dark:border-white/10 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
          Edit code and discount
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/45 dark:text-white/45 mb-1">
              Code
            </label>
            <input
              type="text"
              value={codeStr}
              onChange={(e) => setCodeStr(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/45 dark:text-white/45 mb-1">
              Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3]"
            >
              <option value="PERCENT">Percent (%)</option>
              <option value="FIXED">Fixed (EGP)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/45 dark:text-white/45 mb-1">
              Value (whole number)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/45 dark:text-white/45 mb-1">
              Usage limit (optional)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              placeholder="Unlimited"
              className="w-full px-2 py-1.5 text-sm rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
            />
          </div>
        </div>
        {inlineErr && (
          <p className="text-xs text-red-600 dark:text-red-400">{inlineErr}</p>
        )}
        <button
          type="button"
          disabled={savingEdits}
          onClick={saveEdits}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black/80 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {savingEdits ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          {savingEdits ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1 border-t border-black/10 dark:border-white/10">
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 mb-1">
            Expires at
          </label>
          <input
            type="datetime-local"
            value={
              code.expires_at
                ? new Date(code.expires_at).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) =>
              onPatch(code.id, {
                expires_at: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
            className="w-full px-2 py-1 text-sm rounded bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          <input
            type="checkbox"
            checked={code.is_active}
            onChange={(e) =>
              onPatch(code.id, { is_active: e.target.checked })
            }
            className="w-4 h-4 accent-[#FF4DA3]"
            id={`active-${code.id}`}
          />
          <label
            htmlFor={`active-${code.id}`}
            className="text-xs font-medium text-black/70 dark:text-white/70"
          >
            Active (live on checkout)
          </label>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discount Code Modal
// ─────────────────────────────────────────────────────────────────────────────
function DiscountCodeModal({ onClose }) {
  const [tab, setTab] = useState("create");
  const [form, setForm] = useState({
    code: "",
    discount_type: "PERCENT",
    value: "",
    is_active: true,
    expires_at: "",
    usage_limit: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [listError, setListError] = useState("");
  const [manageMsg, setManageMsg] = useState({ kind: "", text: "" });

  useEffect(() => {
    if (manageMsg.kind !== "ok" || !manageMsg.text) return;
    const t = setTimeout(
      () => setManageMsg({ kind: "", text: "" }),
      2800,
    );
    return () => clearTimeout(t);
  }, [manageMsg]);

  useEffect(() => {
    if (tab === "manage") {
      fetchCodes();
    }
  }, [tab]);

  const fetchCodes = async () => {
    setLoadingCodes(true);
    setListError("");
    try {
      const res = await fetch("/api/discount-codes");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          [data.error, data.details].filter(Boolean).join(" — ") ||
          "Failed to load discount codes";
        setListError(msg);
        setCodes([]);
        return;
      }
      setCodes(Array.isArray(data.codes) ? data.codes : []);
    } catch (err) {
      console.error("Failed to fetch codes:", err);
      setListError(err.message || "Failed to load discount codes");
      setCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  };

  const patchCode = async (id, updates) => {
    setManageMsg({ kind: "", text: "" });
    try {
      const res = await fetch(`/api/discount-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setManageMsg({
          kind: "err",
          text:
            [data.error, data.details].filter(Boolean).join(" — ") ||
            "Update failed",
        });
        return false;
      }
      setManageMsg({ kind: "ok", text: "Saved." });
      await fetchCodes();
      return true;
    } catch (err) {
      setManageMsg({
        kind: "err",
        text: err.message || "Update failed",
      });
      return false;
    }
  };

  const deleteCode = async (id) => {
    if (!confirm("Are you sure you want to delete this discount code?"))
      return;
    setManageMsg({ kind: "", text: "" });
    try {
      const res = await fetch(`/api/discount-codes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setManageMsg({
          kind: "err",
          text:
            [data.error, data.details].filter(Boolean).join(" — ") ||
            "Delete failed",
        });
        return;
      }
      setManageMsg({ kind: "ok", text: "Code deleted." });
      await fetchCodes();
    } catch (err) {
      setManageMsg({
        kind: "err",
        text: err.message || "Delete failed",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const numValue = Math.round(Number(form.value));
    if (!Number.isFinite(numValue) || numValue < 0) {
      setError("Enter a valid whole-number discount value.");
      setLoading(false);
      return;
    }
    if (form.discount_type === "PERCENT" && numValue > 100) {
      setError("Percent cannot exceed 100.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discount_type: form.discount_type,
          value: numValue,
          is_active: form.is_active,
          expires_at: form.expires_at
            ? new Date(form.expires_at).toISOString()
            : null,
          usage_limit: form.usage_limit
            ? parseInt(form.usage_limit, 10)
            : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          [data.error, data.details].filter(Boolean).join(" — ") ||
          "Failed to create discount code";
        throw new Error(msg);
      }
      setForm({
        code: "",
        discount_type: "PERCENT",
        value: "",
        is_active: true,
        expires_at: "",
        usage_limit: "",
      });
      setTab("manage");
      await fetchCodes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-ui-fade-in fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-ui-fade-in-up w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/25"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discount-title"
      >
        <div className="shrink-0 flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-black/10 dark:border-white/10">
          <div className="min-w-0">
            <h2
              id="discount-title"
              className="text-base sm:text-lg font-bold tracking-tight"
            >
              Discount Codes
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/45 dark:text-white/45 mt-0.5">
              Create and manage discount codes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 flex border-b border-black/10 dark:border-white/10">
          <button
            onClick={() => setTab("create")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "create"
                ? "text-[#FF4DA3] border-b-2 border-[#FF4DA3]"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setTab("manage")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "manage"
                ? "text-[#FF4DA3] border-b-2 border-[#FF4DA3]"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            Manage
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {tab === "create" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle
                    size={16}
                    strokeWidth={2.5}
                    className="shrink-0 mt-0.5"
                  />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
                  placeholder="e.g. ZOYA10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Discount Type
                </label>
                <select
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm({ ...form, discount_type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
                >
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed Amount (EGP)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Value</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                  min={0}
                  step={1}
                  className="w-full px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
                  placeholder={form.discount_type === "PERCENT" ? "10" : "50"}
                />
                <p className="mt-1.5 text-xs text-black/50 dark:text-white/50">
                  Whole numbers only — your database stores this as an integer
                  (decimals are rounded).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expires At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Usage Limit (optional)
                </label>
                <input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) =>
                    setForm({ ...form, usage_limit: e.target.value })
                  }
                  min="1"
                  className="w-full px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40"
                  placeholder="e.g. 100"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#FF4DA3]"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FF4DA3] text-white font-semibold hover:bg-[#FF4DA3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Tag size={16} />
                )}
                {loading ? "Creating..." : "Create Discount Code"}
              </button>
            </form>
          ) : tab === "manage" ? (
            <>
              {listError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle
                    size={16}
                    strokeWidth={2.5}
                    className="shrink-0 mt-0.5"
                  />
                  {listError}
                </div>
              )}
              {manageMsg.text && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-xl text-sm border ${
                    manageMsg.kind === "err"
                      ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                      : "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300"
                  }`}
                >
                  {manageMsg.kind === "err" ? (
                    <AlertCircle
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 mt-0.5"
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 mt-0.5"
                    />
                  )}
                  {manageMsg.text}
                </div>
              )}
              {loadingCodes ? (
                <div className="flex flex-col items-center justify-center py-8 text-black/50 dark:text-white/50">
                  <Loader2 className="animate-spin mb-3" size={24} />
                  <p className="text-sm">Loading codes...</p>
                </div>
              ) : codes.length === 0 && !listError ? (
                <div className="flex flex-col items-center justify-center py-8 text-black/40 dark:text-white/40">
                  <Tag size={32} strokeWidth={1} className="mb-3" />
                  <p className="text-sm">No discount codes yet.</p>
                </div>
              ) : codes.length === 0 ? null : (
                <div className="space-y-3">
                  {codes.map((code) => (
                    <DiscountCodeListRow
                      key={code.id}
                      code={code}
                      onPatch={patchCode}
                      onDelete={deleteCode}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory issues only — missing stock, low, oversold, catalog gaps
// ─────────────────────────────────────────────────────────────────────────────
function inventoryIssueTone(issue) {
  if (issue.severity === "oversold" || issue.reason === "oversold") {
    return "urgent";
  }
  if (
    issue.severity === "out" ||
    issue.severity === "error" ||
    issue.reason === "depleted"
  ) {
    return "urgent";
  }
  if (issue.severity === "low" || issue.reason === "low") {
    return "low";
  }
  return "setup";
}

const ISSUE_SECTION_STYLES = {
  urgent: {
    title: "Urgent — restock now",
    wrap: "border-red-500/35 bg-red-500/10",
    heading: "text-red-800 dark:text-red-200",
    item: "bg-red-500/5 border-red-500/25 text-red-900/95 dark:text-red-100/95",
    badge: "bg-red-500/20 text-red-700 dark:text-red-300",
  },
  low: {
    title: "Running low",
    wrap: "border-amber-500/35 bg-amber-500/10",
    heading: "text-amber-900 dark:text-amber-100",
    item: "bg-amber-500/5 border-amber-500/25 text-amber-900/95 dark:text-amber-100/95",
    badge: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  },
  setup: {
    title: "Catalog setup",
    wrap: "border-violet-500/35 bg-violet-500/10",
    heading: "text-violet-900 dark:text-violet-100",
    item: "bg-violet-500/5 border-violet-500/25 text-violet-900/95 dark:text-violet-100/95",
    badge: "bg-violet-500/20 text-violet-800 dark:text-violet-300",
  },
};

function InventoryAlertsModal({
  stockSummary,
  loading,
  onClose,
  onRefresh,
  onOpenFullInventory,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const grouped = useMemo(() => {
    const urgent = [];
    const low = [];
    const setup = [];
    if (!stockSummary) return { urgent, low, setup, all: [] };

    for (const a of stockSummary.stockAlerts || []) {
      const issue = { ...a, kind: "stock" };
      const tone = inventoryIssueTone(issue);
      if (tone === "urgent") urgent.push(issue);
      else if (tone === "low") low.push(issue);
      else setup.push(issue);
    }
    for (const a of stockSummary.catalogAlerts || []) {
      const issue = { ...a, kind: "catalog" };
      const tone = inventoryIssueTone(issue);
      if (tone === "urgent") urgent.push(issue);
      else setup.push(issue);
    }

    const all = [...urgent, ...low, ...setup];
    return { urgent, low, setup, all };
  }, [stockSummary]);

  const visible =
    filter === "all"
      ? grouped.all
      : filter === "urgent"
        ? grouped.urgent
        : filter === "low"
          ? grouped.low
          : grouped.setup;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  return (
    <div
      className="animate-ui-fade-in fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-ui-fade-in-up w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <div className="shrink-0 flex items-center justify-between gap-3 p-5 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Stock issues
              </h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mt-0.5">
                Missing · low · oversold only
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              aria-label="Refresh"
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
            >
              <RefreshCw
                size={16}
                className={loading || refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="shrink-0 px-5 pt-4 pb-2 flex flex-wrap gap-2">
          {[
            { id: "all", label: `All (${grouped.all.length})` },
            { id: "urgent", label: `Urgent (${grouped.urgent.length})` },
            { id: "low", label: `Low (${grouped.low.length})` },
            { id: "setup", label: `Setup (${grouped.setup.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold border transition ${
                filter === t.id
                  ? "border-[#FF4DA3] bg-[#FF4DA3]/15 text-[#FF4DA3]"
                  : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 pt-2 space-y-4">
          {loading && !stockSummary ? (
            <div className="flex flex-col items-center py-16 text-black/50 dark:text-white/50">
              <Loader2 className="animate-spin mb-3" size={26} />
              <p className="text-xs">Loading issues…</p>
            </div>
          ) : grouped.all.length === 0 ? (
            <div className="text-center py-16 text-black/45 dark:text-white/45 text-sm">
              No stock issues right now.
            </div>
          ) : filter === "all" ? (
            (["urgent", "low", "setup"]).map((key) => {
              const items = grouped[key];
              if (!items.length) return null;
              const styles = ISSUE_SECTION_STYLES[key];
              return (
                <section
                  key={key}
                  className={`rounded-2xl border p-3 space-y-2 ${styles.wrap}`}
                >
                  <p
                    className={`text-[10px] uppercase tracking-[0.2em] font-black ${styles.heading}`}
                  >
                    {styles.title} ({items.length})
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((issue, i) => (
                      <li
                        key={`${issue.kind}-${issue.productId || issue.id}-${issue.colorName || issue.color}-${issue.size}-${i}`}
                        className={`text-[11px] sm:text-xs leading-relaxed px-3 py-2 rounded-xl border ${styles.item}`}
                      >
                        {issue.message ||
                          `${issue.productName || issue.name}${issue.colorName || issue.color ? ` · ${issue.colorName || issue.color}` : ""}${issue.size ? ` · ${issue.size}` : ""}`}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          ) : (
            <ul className="space-y-1.5">
              {visible.map((issue, i) => {
                const tone = inventoryIssueTone(issue);
                const styles = ISSUE_SECTION_STYLES[tone];
                return (
                  <li
                    key={`${issue.kind}-${issue.productId || issue.id}-${issue.colorName || issue.color}-${issue.size}-${i}`}
                    className={`text-[11px] sm:text-xs leading-relaxed px-3 py-2.5 rounded-xl border ${styles.item}`}
                  >
                    <span
                      className={`inline-block mr-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${styles.badge}`}
                    >
                      {issue.kind === "catalog" ? "Setup" : issue.severity || "stock"}
                    </span>
                    {issue.message ||
                      `${issue.productName || issue.name}${issue.colorName || issue.color ? ` · ${issue.colorName || issue.color}` : ""}${issue.size ? ` · ${issue.size}` : ""}`}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 p-5 pt-2 border-t border-black/10 dark:border-white/10 space-y-2">
          <button
            type="button"
            onClick={onOpenFullInventory}
            className="w-full py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 hover:border-[#FF4DA3]/40 hover:text-[#FF4DA3] transition"
          >
            Open full inventory & sales
          </button>
          <p className="text-[10px] text-center text-black/40 dark:text-white/40">
            Fix stock in Sanity Studio, then refresh here.
          </p>
        </div>
      </div>
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
      alert("Select at least one product.");
      return;
    }
    const ok = window.confirm(
      `This will reset stock to initialStock for ${ids.length} selected product(s). Continue?`,
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
        alert(json?.error || "Stock reset failed. Please try again.");
        return;
      }
      alert(
        `Stock reset complete.\nProducts: ${json.productsTouched ?? 0}\nEntries: ${json.entriesSet ?? 0}`,
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
    <div
      className="animate-ui-fade-in fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-ui-fade-in-up w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/60"
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
              <RefreshCw
                size={14}
                className={resettingStock ? "animate-spin" : ""}
              />
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
              <AlertCircle
                size={18}
                strokeWidth={2.5}
                className="shrink-0 mt-0.5"
              />
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
                          data.summary.totalRevenue /
                            data.summary.totalUnitsSold,
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
                  hint={
                    (data.summary.catalogIssues || 0) > 0
                      ? `${data.summary.catalogIssues} catalog issue(s) · low ≤ ${data.summary.lowStockThreshold}`
                      : `Low ≤ ${data.summary.lowStockThreshold} units`
                  }
                  icon={AlertTriangle}
                  accent={
                    data.summary.outOfStock > 0 ||
                    (data.summary.oversold || 0) > 0 ||
                    (data.summary.catalogIssues || 0) > 0
                      ? "text-red-600 dark:text-red-400"
                      : data.summary.lowStock > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  }
                />
              </div>

              {data.stockUnavailable && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
                  <AlertCircle
                    size={13}
                    strokeWidth={2.5}
                    className="shrink-0 mt-0.5"
                  />
                  <p>
                    Stock data couldn&apos;t be loaded from Sanity. Sales
                    numbers below are still accurate, but inventory totals will
                    be missing until Sanity is reachable again.
                  </p>
                </div>
              )}

              {Array.isArray(data.catalogAlerts) &&
                data.catalogAlerts.length > 0 && (
                  <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-2">
                    <p className="text-xs font-bold text-violet-800 dark:text-violet-200">
                      Catalog setup ({data.catalogAlerts.length})
                    </p>
                    <ul className="text-[11px] leading-relaxed text-violet-900/90 dark:text-violet-100/90 space-y-1 max-h-40 overflow-y-auto">
                      {data.catalogAlerts.slice(0, 12).map((a, i) => (
                        <li key={`${a.type}-${a.productId}-${a.colorName || ""}-${a.size || ""}-${i}`}>
                          {a.message}
                        </li>
                      ))}
                      {data.catalogAlerts.length > 12 && (
                        <li className="opacity-70">
                          +{data.catalogAlerts.length - 12} more…
                        </li>
                      )}
                    </ul>
                  </div>
                )}

              {data.summary.untrackedProducts > 0 &&
                !(data.catalogAlerts?.length > 0) && (
                <p className="text-[11px] text-black/50 dark:text-white/50">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {data.summary.untrackedProducts}
                  </span>{" "}
                  product{data.summary.untrackedProducts === 1 ? "" : "s"}{" "}
                  aren&apos;t tracking stock yet — open them in Sanity and add a
                  Stock-by-Size row for each color to enable inventory tracking.
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
                    <Search
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
                    />
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
      </div>
    </div>
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
      <p className={`text-lg sm:text-xl font-bold ${accent} truncate`}>
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-black/40 dark:text-white/40 mt-1 truncate">
          {hint}
        </p>
      )}
    </div>
  );
}

function collectDepletedVariants(product) {
  if (!product?.tracked || !Array.isArray(product.byColor)) return [];
  const items = [];
  for (const c of product.byColor) {
    const colorName = c.name || "Default";
    const colorLevel = getStockLevel(c.totalStock);
    const sizes = Array.isArray(c.sizes) ? c.sizes : [];
    if (sizes.length === 0) continue;

    if (colorLevel === "out" || colorLevel === "oversold") {
      items.push({
        key: `color-${colorName}`,
        label: colorName,
        level: colorLevel,
      });
      continue;
    }

    for (const s of sizes) {
      const level = getStockLevel(s.stock);
      if (level === "out" || level === "oversold") {
        items.push({
          key: `${colorName}-${s.size}`,
          label: `${colorName} · ${s.size}`,
          level,
        });
      }
    }
  }
  return items;
}

const STOCK_PILL_BASE =
  "inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold leading-tight ring-1";

function StockStatusBadge({ tracked, stockLevel, stock }) {
  if (!tracked) {
    return (
      <span
        className={`${STOCK_PILL_BASE} bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50 ring-black/10 dark:ring-white/10`}
      >
        Untracked
      </span>
    );
  }
  if (stockLevel === "oversold") {
    return (
      <span
        className={`${STOCK_PILL_BASE} bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/35`}
      >
        <span>Oversold</span>
        <span className="tabular-nums normal-case tracking-normal text-[11px] font-extrabold">
          {stock}
        </span>
      </span>
    );
  }
  if (stockLevel === "out") {
    return (
      <span
        className={`${STOCK_PILL_BASE} bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/35`}
      >
        Out of stock
      </span>
    );
  }
  if (stockLevel === "low") {
    return (
      <span
        className={`${STOCK_PILL_BASE} bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-amber-500/35`}
      >
        <span>Low</span>
        <span className="tabular-nums normal-case tracking-normal text-[11px] font-extrabold">
          {stock}
        </span>
      </span>
    );
  }
  return (
    <span
      className={`${STOCK_PILL_BASE} bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-emerald-500/40`}
    >
      <span className="opacity-95">In stock</span>
      <span className="tabular-nums normal-case tracking-normal text-[11px] sm:text-[10px] font-extrabold text-emerald-900 dark:text-emerald-100">
        {Number(stock).toLocaleString()}
      </span>
    </span>
  );
}

function DepletedVariantBadges({ variants }) {
  if (!variants?.length) return null;

  return (
    <div
      className="mt-1.5 flex flex-wrap items-center gap-1.5 w-full min-w-0"
      role="list"
      aria-label="Out of stock variants"
    >
      {variants.map((v) => (
        <span
          key={v.key}
          role="listitem"
          title={
            v.level === "oversold"
              ? `${v.label} oversold`
              : `${v.label} sold out`
          }
          className="inline-flex max-w-full min-w-0 items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 text-[9px] uppercase tracking-wide font-bold ring-1 ring-red-500/25"
        >
          <AlertTriangle size={9} strokeWidth={2.5} className="shrink-0" />
          <span className="shrink-0 whitespace-nowrap">
            {v.level === "oversold" ? "Oversold" : "Sold out"}
          </span>
          <span className="text-red-500/50 dark:text-red-300/50 shrink-0">·</span>
          <span className="min-w-0 truncate normal-case tracking-normal font-semibold">
            {v.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function ProductRow({ product, expanded, onToggle, selected, onSelect }) {
  const tracked = product.tracked;
  const stock = product.totalStock;
  const initial = product.totalInitial;
  const sold = product.unitsSold;
  const stockLevel = tracked ? getStockLevel(stock) : "ok";
  const needsRestock =
    tracked &&
    (stockLevel === "oversold" ||
      stockLevel === "out" ||
      stockLevel === "low");
  const isUrgentStock = stockLevel === "oversold" || stockLevel === "out";
  // Sell-through is what % of the initial stock has been sold. Only meaningful
  // when initialStock is set in Sanity.
  const sellThrough =
    initial > 0 ? Math.round((Math.min(sold, initial) / initial) * 100) : null;
  const depletedVariants = collectDepletedVariants(product);
  const stockBadge = (
    <StockStatusBadge
      tracked={tracked}
      stockLevel={stockLevel}
      stock={stock}
    />
  );

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 sm:items-center sm:gap-4 px-4 py-3 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
      >
        <span className="shrink-0 pt-0.5">
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
          <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <p className="text-sm font-semibold truncate max-w-full">
              {product.name}
            </p>
            {needsRestock && (
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.18em] font-black whitespace-nowrap ${
                  isUrgentStock
                    ? "bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30"
                }`}
                title={
                  stockLevel === "oversold"
                    ? "Oversold — restock immediately"
                    : stockLevel === "out"
                      ? "Out of stock — restock needed"
                      : "Low stock — restock soon"
                }
              >
                <AlertTriangle size={10} />
                Restock
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] text-black/50 dark:text-white/50">
              <b className="text-black dark:text-white">
                {sold.toLocaleString()}
              </b>{" "}
              sold
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
          {tracked ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 w-full min-w-0 sm:mt-1.5">
              <div className="sm:hidden shrink-0">{stockBadge}</div>
              <DepletedVariantBadges variants={depletedVariants} />
            </div>
          ) : (
            <DepletedVariantBadges variants={depletedVariants} />
          )}
        </div>

        <div className="hidden sm:flex flex-col items-end justify-center gap-1.5 shrink-0 min-w-[6.5rem]">
          {tracked ? stockBadge : null}
          {tracked && initial > 0 && (
            <span className="text-[10px] text-black/45 dark:text-white/45 tabular-nums whitespace-nowrap">
              <span className="font-semibold text-black/70 dark:text-white/70">
                {Number(stock).toLocaleString()}
              </span>
              <span className="opacity-70"> / {Number(initial).toLocaleString()}</span>
            </span>
          )}
        </div>
        <ChevronRight
          size={16}
          className={`text-black/30 dark:text-white/30 shrink-0 mt-0.5 sm:mt-0 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">
          {tracked && initial > 0 && (
            <p className="sm:hidden pt-3 text-[10px] text-black/50 dark:text-white/50 tabular-nums">
              <span className="font-semibold text-black/70 dark:text-white/70">
                {Number(stock).toLocaleString()}
              </span>
              <span className="opacity-70"> available</span>
              <span className="opacity-50"> · </span>
              <span className="opacity-70">
                {Number(initial).toLocaleString()} initial
              </span>
            </p>
          )}

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
                        Total:{" "}
                        <b
                          className={
                            getStockLevel(c.totalStock) === "oversold"
                              ? "text-red-600 dark:text-red-400"
                              : getStockLevel(c.totalStock) === "out"
                                ? "text-red-600 dark:text-red-400"
                                : getStockLevel(c.totalStock) === "low"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : ""
                          }
                        >
                          {c.totalStock}
                        </b>
                        {c.totalInitial > 0 && (
                          <span className="opacity-60">
                            {" "}
                            / {c.totalInitial}
                          </span>
                        )}
                      </span>
                    </div>
                    {c.sizes.length === 0 ? (
                      <p className="text-[10px] font-medium text-red-600 dark:text-red-400">
                        No stock rows for this color — add Stock by Size in
                        Sanity.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-2">
                        {c.sizes.map((s) => {
                          const level = getStockLevel(s.stock);
                          return (
                            <div
                              key={s.size}
                              className={`flex items-center justify-between gap-3 px-2.5 py-2 sm:py-1.5 rounded-md border text-[11px] min-w-0 ${
                                level === "oversold" || level === "out"
                                  ? "bg-red-500/5 border-red-500/30 text-red-600 dark:text-red-400"
                                  : level === "low"
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
            <div
              key={r.key}
              className="px-4 py-3 grid grid-cols-12 gap-3 items-center text-xs"
            >
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
      <p
        className={`${small ? "text-base sm:text-lg" : "text-2xl"} font-bold ${accent} truncate`}
      >
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
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsCount = items.reduce(
    (sum, it) => sum + Number(it.quantity ?? 0),
    0,
  );
  const itemsSubtotal = items.reduce(
    (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
    0,
  );
  const discountAmount = Number(order.discount_amount ?? 0);
  const hasDiscount = discountAmount > 0 || !!order.discount_code;
  const shippingFee =
    order.shipping_fee !== null && order.shipping_fee !== undefined
      ? Number(order.shipping_fee)
      : null;
  const isReturning = customerOrderInfo && customerOrderInfo.total > 1;
  const email = order.email?.toString().trim();
  const paymentOnline = order.payment_method === "online";
  const transferRef = order.transaction_reference?.toString().trim();
  const proofUrl = order.payment_proof_url?.toString().trim();
  const instapayOk = paymentOnline && Boolean(proofUrl);
  const fulfillmentIssues = Array.isArray(order.fulfillment_issues)
    ? order.fulfillment_issues
    : [];
  const needsFulfillment = orderNeedsFulfillment(order);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer text-left w-full p-5 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#FF4DA3]/60 hover:bg-[#FF4DA3]/[0.04] dark:hover:bg-white/[0.07] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF4DA3]/10 transition-all space-y-3 group outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA3]/50"
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
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {needsFulfillment && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/40"
              title="Customer ordered item(s) that need restock"
            >
              <AlertTriangle size={10} />
              Restock
            </span>
          )}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.color} ring-1 ${meta.ring}`}
          >
            <StatusIcon size={11} />
            {meta.label}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-black/5 dark:border-white/5">
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
        <p className="text-xs text-black/50 dark:text-white/50 flex items-center gap-1.5 min-w-0">
          <Phone size={11} className="shrink-0" />
          <a
            href={`tel:${order.phone}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="truncate hover:text-[#FF4DA3] transition-colors"
          >
            {order.phone}
          </a>
        </p>
        {email ? (
          <p className="text-xs text-black/50 dark:text-white/50 flex items-center gap-1.5 min-w-0">
            <Mail size={11} className="shrink-0" />
            <a
              href={`mailto:${email}`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="truncate hover:text-[#FF4DA3] transition-colors"
            >
              {email}
            </a>
          </p>
        ) : (
          <p className="text-[10px] text-black/35 dark:text-white/35 flex items-center gap-1.5">
            <Mail size={11} />
            No email on file
          </p>
        )}
        <p className="text-xs text-black/50 dark:text-white/50 flex items-start gap-1.5">
          <MapPin size={11} className="shrink-0 mt-0.5" />
          <span className="min-w-0">
            <span className="font-medium text-black/65 dark:text-white/65">
              {order.governorate ?? "—"}
            </span>
            {order.address ? (
              <span className="block text-[11px] text-black/45 dark:text-white/45 leading-snug line-clamp-3 mt-0.5">
                {order.address}
              </span>
            ) : null}
          </span>
        </p>
      </div>

      <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 font-bold">
          Payment
        </p>
        <div className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/55">
          <CreditCard
            size={12}
            className="shrink-0 text-black/40 dark:text-white/40"
          />
          <span className="font-medium">
            {paymentMethodLabel(order.payment_method)}
          </span>
        </div>
        {paymentOnline && (
          <div className="pl-0.5 space-y-1 text-[11px] text-black/55 dark:text-white/50">
            <p>
              <span className="text-black/40 dark:text-white/40 uppercase tracking-wider text-[9px]">
                Transfer ref
              </span>{" "}
              <span className="font-mono break-all">{transferRef || "—"}</span>
            </p>
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[#FF4DA3] font-semibold hover:underline"
              >
                <ExternalLink size={11} />
                Payment proof
              </a>
            ) : (
              <p className="text-black/35 dark:text-white/35">
                No proof image URL
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <span
                className={
                  instapayOk
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-amber-600 dark:text-amber-400 font-semibold"
                }
              >
                {instapayOk
                  ? "Payment proof uploaded"
                  : "Transfer not confirmed in checkout"}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-1 text-[11px] text-black/55 dark:text-white/50">
        <div className="flex justify-between gap-2">
          <span>Items subtotal</span>
          <span className="font-mono shrink-0">
            {itemsSubtotal.toLocaleString()} EGP
          </span>
        </div>
        {shippingFee !== null && !Number.isNaN(shippingFee) && (
          <div className="flex justify-between gap-2">
            <span>Shipping</span>
            <span className="font-mono shrink-0">
              {shippingFee.toLocaleString()} EGP
            </span>
          </div>
        )}
        {hasDiscount && (
          <div className="flex justify-between gap-2 text-[#FF4DA3]">
            <span className="truncate">
              Discount{order.discount_code ? ` (${order.discount_code})` : ""}
            </span>
            <span className="font-mono shrink-0">
              − {discountAmount.toLocaleString()} EGP
            </span>
          </div>
        )}
        <div className="flex justify-between gap-2 pt-1 border-t border-black/10 dark:border-white/10 text-sm font-bold text-[#FF4DA3]">
          <span>Total</span>
          <span className="font-mono shrink-0">
            {Number(order.total_price ?? 0).toLocaleString()} EGP
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-black/5 dark:border-white/5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 font-bold mb-1.5">
          Items ({itemsCount})
        </p>
        <div className="space-y-0.5">
          {items.slice(0, 4).map((it, idx) => {
            const colorLabel =
              typeof it.color === "object" ? it.color?.name : it.color;
            const bits = [colorLabel, it.size ? `Size ${it.size}` : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <p
                key={`${it.id}-${idx}`}
                className="text-[11px] text-black/60 dark:text-white/55 truncate"
              >
                <span className="font-bold text-black/70 dark:text-white/70">
                  ×{it.quantity}
                </span>{" "}
                {it.name}
                {bits ? (
                  <span className="text-black/40 dark:text-white/40">
                    {" "}
                    · {bits}
                  </span>
                ) : null}
              </p>
            );
          })}
        </div>
        {items.length > 4 ? (
          <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">
            +{items.length - 4} more in details…
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-dashed border-black/10 dark:border-white/10">
        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase font-bold text-black/50 dark:text-white/50 group-hover:text-[#FF4DA3] transition-colors">
          <Eye size={12} />
          Full details
        </span>
        <ChevronRight
          size={16}
          className="text-black/30 dark:text-white/30 group-hover:text-[#FF4DA3] group-hover:translate-x-1 transition-all"
        />
      </div>
    </div>
  );
}

function OrderModal({
  order,
  onClose,
  onUpdateStatus,
  onDeleteOrder,
  customerOrderInfo,
}) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;
  const actions = STATUS_ACTIONS[order.status] ?? [];
  const items = Array.isArray(order.items) ? order.items : [];
  const fulfillmentIssues = Array.isArray(order.fulfillment_issues)
    ? order.fulfillment_issues
    : [];
  const proofUrl = order.payment_proof_url?.toString().trim();
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
    <div
      className="animate-ui-fade-in fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-ui-fade-in-up w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c0c0c] text-black dark:text-white border border-black/10 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/60"
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

          {fulfillmentIssues.length > 0 && (
            <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle size={14} />
                Restock before shipping
              </p>
              <ul className="text-[11px] sm:text-xs leading-relaxed text-red-900/90 dark:text-red-100/90 space-y-1.5">
                {fulfillmentIssues.map((issue, i) => (
                  <li key={`${issue.productId}-${issue.color}-${issue.size}-${i}`}>
                    {fulfillmentIssueMessage(issue)}
                    {issue.source === "order" && (
                      <span className="text-red-700/70 dark:text-red-200/60">
                        {" "}
                        · flagged at checkout
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
            <InfoRow
              label="Email"
              value={
                order.email ? (
                  <a
                    href={`mailto:${order.email}`}
                    className="hover:text-[#FF4DA3] transition-colors break-all"
                  >
                    {order.email}
                  </a>
                ) : (
                  "—"
                )
              }
              icon={Mail}
            />
            <InfoRow
              label="Governorate"
              value={order.governorate ?? "—"}
              icon={MapPin}
            />
            <InfoRow
              label="Payment"
              value={paymentMethodLabel(order.payment_method)}
              icon={CreditCard}
            />
            {order.payment_method === "online" && (
              <>
                <InfoRow
                  label="Transfer reference"
                  value={order.transaction_reference?.toString().trim() || "—"}
                />
                <InfoRow
                  label="Payment proof"
                  value={
                    proofUrl ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        Not uploaded
                      </span>
                    )
                  }
                />
                <div className="sm:col-span-2 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-1 flex items-center gap-1">
                    <ExternalLink size={10} />
                    Payment proof
                  </p>
                  {order.payment_proof_url?.toString().trim() ? (
                    <a
                      href={order.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#FF4DA3] hover:underline break-all"
                    >
                      Open proof link
                    </a>
                  ) : (
                    <p className="text-sm text-black/45 dark:text-white/45">
                      —
                    </p>
                  )}
                </div>
              </>
            )}
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
              {items.map((it, idx) => {
                const lineIssue = fulfillmentIssues.find((issue) =>
                  itemMatchesFulfillmentIssue(it, issue),
                );
                return (
                <div
                  key={`${it.id}-${idx}`}
                  className={`flex gap-4 items-center p-3 rounded-xl border ${
                    lineIssue
                      ? "bg-red-500/5 border-red-500/35 dark:bg-red-500/10"
                      : "bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/5"
                  }`}
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
                      {(typeof it.color === "object"
                        ? it.color?.name
                        : it.color) && (
                        <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] uppercase tracking-wider text-black/60 dark:text-white/60">
                          {typeof it.color === "object"
                            ? it.color.name
                            : it.color}
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
                      {lineIssue && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-[9px] uppercase tracking-wider text-red-700 dark:text-red-300 font-bold">
                          {fulfillmentReasonLabel(lineIssue.reason)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">
                      {(
                        Number(it.price) * Number(it.quantity)
                      ).toLocaleString()}{" "}
                      EGP
                    </p>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
                      {Number(it.price).toLocaleString()} × {it.quantity}
                    </p>
                    {Number(it.cost ?? 0) > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400/70 mt-1">
                        cost:{" "}
                        {(
                          Number(it.cost) * Number(it.quantity)
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* Totals */}
          {(() => {
            const itemsSubtotal = items.reduce(
              (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
              0,
            );
            const discountAmount = Number(order.discount_amount ?? 0);
            const hasDiscount = discountAmount > 0 || !!order.discount_code;

            return (
              <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
                  <span>Items subtotal</span>
                  <span>{itemsSubtotal.toLocaleString()} EGP</span>
                </div>
                {order.shipping_fee !== null &&
                  order.shipping_fee !== undefined && (
                    <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
                      <span>Shipping</span>
                      <span>
                        {Number(order.shipping_fee).toLocaleString()} EGP
                      </span>
                    </div>
                  )}
                {hasDiscount && (
                  <div className="flex justify-between text-xs text-[#FF4DA3]">
                    <span className="flex items-center gap-1.5">
                      <Tag size={11} />
                      Discount
                      {order.discount_code && (
                        <span className="font-mono font-bold">
                          ({order.discount_code})
                        </span>
                      )}
                    </span>
                    <span>− {discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-2 border-t border-black/10 dark:border-white/10">
                  <span className="text-sm zoya-heading !text-sm">Total</span>
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

            const itemsSubtotal = items.reduce(
              (s, it) => s + Number(it.price ?? 0) * Number(it.quantity ?? 0),
              0,
            );
            const discountAmount = Number(order.discount_amount ?? 0);
            const totalCost = Number(order.total_cost ?? 0);
            const netRevenue = Math.max(0, itemsSubtotal - discountAmount);
            const computedProfit =
              order.net_product_profit !== null &&
              order.net_product_profit !== undefined
                ? Number(order.net_product_profit)
                : orderProfit(order);
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
                    <AlertCircle
                      size={14}
                      strokeWidth={2.5}
                      className="shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-bold mb-0.5">
                        Cost data is incomplete
                      </p>
                      <p className="text-black/60 dark:text-white/60">
                        One or more items don&apos;t have a cost set in Sanity
                        (or Sanity was unreachable). The profit shown is
                        unreliable. Set the cost in Sanity and re-check.
                      </p>
                      {Array.isArray(items) &&
                        items.some((it) => it.cost_known === false) && (
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
                      Discount
                      {order.discount_code ? ` (${order.discount_code})` : ""}
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
                    <span className="text-sm zoya-heading !text-sm">Profit</span>
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
      </div>
    </div>
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



