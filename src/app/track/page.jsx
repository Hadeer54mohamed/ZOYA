"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageSearch,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Pencil,
  X,
  Save,
  Minus,
  Plus,
  Trash2,
  ChevronDown,
  MessageCircle,
  Phone,
  SearchX,
  RefreshCw,
  Search,
  PackagePlus,
} from "lucide-react";
import { SHIPPING_FEES } from "../lib/shipping";

const SUPPORT = {
  whatsapp: "201095894883",
  phone: "+201095894883",
  phoneDisplay: "0109 589 4883",
};

const buildSupportMessage = (mode, query) => {
  const label = mode === "phone" ? "phone number" : "order ID";
  return encodeURIComponent(
    `Hello Zoya support team 👋\n\nI'm trying to track an order but it can't be found.\n${label}: ${query || "(not provided)"}\n\nCould you please help me?`
  );
};

const STATUS_FLOW = [
  { key: "pending", label: "Pending", icon: Clock, description: "Awaiting confirmation" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, description: "Preparing your items" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "On the way to you" },
  { key: "delivered", label: "Delivered", icon: PackageCheck, description: "Order completed" },
];

function getStatusIndex(status) {
  const idx = STATUS_FLOW.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    // If the timestamp string is naive (no timezone info), assume UTC
    // so it doesn't get parsed as the browser's local time.
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

function TrackContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") ?? "";
  const initialPhone = searchParams.get("phone") ?? "";

  const [searchMode, setSearchMode] = useState(initialPhone ? "phone" : "id");
  const [orderId, setOrderId] = useState(initialId);
  const [phoneQuery, setPhoneQuery] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(null);
  const [order, setOrder] = useState(null);
  const [orderList, setOrderList] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    governorate: "",
    verify_phone: "",
  });
  const [editItems, setEditItems] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);
  const [govOpen, setGovOpen] = useState(false);
  const govRef = useRef(null);

  // Catalog for "add a product" UI in the editor.
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPhone, setCancelPhone] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    if (!govOpen) return;
    const handleClickOutside = (e) => {
      if (govRef.current && !govRef.current.contains(e.target)) {
        setGovOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setGovOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [govOpen]);

  const editTotal = editItems.reduce(
    (sum, it) => sum + Number(it.price ?? 0) * Number(it.quantity ?? 0),
    0
  );

  const itemKey = (it, idx) =>
    `${it.id}-${typeof it.color === "object" ? it.color?.name ?? "" : it.color ?? ""}-${it.size ?? ""}-${idx}`;

  const lookupById = useCallback(async (id) => {
    const trimmed = id.trim();
    if (!trimmed) {
      setError("Please enter an order ID");
      return;
    }
    setLoading(true);
    setError("");
    setNotFound(null);
    setOrder(null);
    setOrderList(null);
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(trimmed)}`);
      const result = await res.json();
      if (!res.ok || !result?.success) {
        if (res.status === 404) {
          setNotFound({ mode: "id", query: trimmed });
        } else {
          setError(result?.error || "We couldn't find that order.");
        }
        return;
      }
      setOrder(result.order);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupByPhone = useCallback(async (phone) => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Please enter your phone number");
      return;
    }
    if (!/^01[0125][0-9]{8}$/.test(trimmed)) {
      setError("Please enter a valid Egyptian phone number (11 digits).");
      return;
    }
    setLoading(true);
    setError("");
    setNotFound(null);
    setOrder(null);
    setOrderList(null);
    try {
      const res = await fetch(
        `/api/orders/track?phone=${encodeURIComponent(trimmed)}`
      );
      const result = await res.json();
      if (!res.ok || !result?.success) {
        if (res.status === 404) {
          setNotFound({ mode: "phone", query: trimmed });
        } else {
          setError(result?.error || "We couldn't find any orders.");
        }
        return;
      }
      const orders = result.orders ?? [];
      if (orders.length === 1) {
        setOrder(orders[0]);
      } else {
        setOrderList(orders);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPhone) lookupByPhone(initialPhone);
    else if (initialId) lookupById(initialId);
  }, [initialId, initialPhone, lookupById, lookupByPhone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchMode === "phone") lookupByPhone(phoneQuery);
    else lookupById(orderId);
  };

  const selectFromList = (orderObj) => {
    setOrder(orderObj);
    setOrderList(null);
    setOrderId(orderObj.order_id);
  };

  const loadCatalog = useCallback(async () => {
    if (catalog.length > 0 || catalogLoading) return;
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setCatalogError(data?.error || "Could not load products.");
        return;
      }
      setCatalog(Array.isArray(data.products) ? data.products : []);
    } catch {
      setCatalogError("Network error while loading products.");
    } finally {
      setCatalogLoading(false);
    }
  }, [catalog.length, catalogLoading]);

  const openEditor = () => {
    setEditForm({
      customer_name: "",
      phone: "",
      address: "",
      governorate: order?.governorate ?? "",
      verify_phone: "",
    });
    setEditItems(
      Array.isArray(order?.items)
        ? order.items.map((it) => ({ ...it }))
        : []
    );
    setEditError("");
    setEditSuccess(false);
    setProductPickerOpen(false);
    setProductQuery("");
    setEditOpen(true);
    loadCatalog();
  };

  const addProductToOrder = (product) => {
    if (!product?.id) return;
    const firstColor = product.colors?.[0] ?? null;
    const firstSize = product.sizes?.[0] ?? null;

    setEditItems((prev) => {
      // If the same product+color+size already exists, just bump quantity.
      const existingIdx = prev.findIndex(
        (it) =>
          it.id === product.id &&
          (typeof it.color === "object" ? it.color?.name : it.color) ===
            (firstColor?.name ?? null) &&
          (it.size ?? null) === (firstSize ?? null)
      );
      if (existingIdx !== -1) {
        return prev.map((it, i) =>
          i === existingIdx
            ? { ...it, quantity: (Number(it.quantity) || 1) + 1 }
            : it
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          image: firstColor?.image ?? product.image ?? null,
          color: firstColor
            ? { name: firstColor.name, value: firstColor.value, image: firstColor.image }
            : null,
          size: firstSize,
          price: Number(product.price) || 0,
          quantity: 1,
          availableColors: Array.isArray(product.colors) ? product.colors : [],
          availableSizes: Array.isArray(product.sizes) ? product.sizes : [],
        },
      ];
    });

    setProductPickerOpen(false);
    setProductQuery("");
  };

  const filteredCatalog = (() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => p.name?.toLowerCase().includes(q));
  })();

  const updateItemAt = (idx, patch) => {
    setEditItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  };

  const changeItemColor = (idx, newColor) => {
    setEditItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? { ...it, color: newColor, image: newColor?.image ?? it.image }
          : it
      )
    );
  };

  const changeItemQty = (idx, delta) => {
    setEditItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = Math.max(1, (Number(it.quantity) || 1) + delta);
        return { ...it, quantity: next };
      })
    );
  };

  const removeItemAt = (idx) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const itemsChanged = () => {
    if (!Array.isArray(order?.items)) return false;
    if (order.items.length !== editItems.length) return true;
    return editItems.some((it, i) => {
      const orig = order.items[i];
      if (!orig) return true;
      const colorA = typeof it.color === "object" ? it.color?.name : it.color;
      const colorB = typeof orig.color === "object" ? orig.color?.name : orig.color;
      return (
        colorA !== colorB ||
        it.size !== orig.size ||
        Number(it.quantity) !== Number(orig.quantity) ||
        it.id !== orig.id
      );
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!order?.order_id) return;
    setEditError("");
    setEditLoading(true);

    const payload = { id: order.order_id, verify_phone: editForm.verify_phone.trim() };
    if (editForm.customer_name.trim()) payload.customer_name = editForm.customer_name.trim();
    if (editForm.phone.trim()) payload.phone = editForm.phone.trim();
    if (editForm.address.trim()) payload.address = editForm.address.trim();
    if (editForm.governorate && editForm.governorate !== order?.governorate) {
      payload.governorate = editForm.governorate;
    }

    if (itemsChanged()) {
      if (editItems.length === 0) {
        setEditError("Order must have at least one item.");
        setEditLoading(false);
        return;
      }
      payload.items = editItems;
    }

    if (!payload.verify_phone) {
      setEditError("Please enter your original phone number to verify.");
      setEditLoading(false);
      return;
    }

    if (
      !payload.customer_name &&
      !payload.phone &&
      !payload.address &&
      !payload.governorate &&
      !payload.items
    ) {
      setEditError("Please change at least one field.");
      setEditLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/orders/track", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        setEditError(result?.error || "Update failed. Please try again.");
        return;
      }
      setEditSuccess(true);
      await lookupById(order.order_id);
      setTimeout(() => setEditOpen(false), 1500);
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const openCancel = () => {
    setCancelPhone("");
    setCancelError("");
    setCancelSuccess(false);
    setCancelOpen(true);
  };

  const submitCancel = async (e) => {
    e.preventDefault();
    if (!order?.order_id) return;
    setCancelError("");

    const verify = cancelPhone.trim();
    if (!verify) {
      setCancelError("Please enter your original phone number to verify.");
      return;
    }

    setCancelLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.order_id,
          verify_phone: verify,
          cancel: true,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        setCancelError(result?.error || "Cancellation failed. Please try again.");
        return;
      }
      setCancelSuccess(true);
      await lookupById(order.order_id);
      setTimeout(() => setCancelOpen(false), 1500);
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const isCancelled = order?.status === "cancelled";
  const currentIdx = order ? getStatusIndex(order.status) : 0;
  const canEdit = order?.status === "pending";

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white">
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pt-28 sm:pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 mb-10"
        >
          <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#FF4DA3] font-bold">
            <PackageSearch size={14} /> Order Tracking
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif italic">Track Your Order</h1>
          <p className="text-sm text-black/50 dark:text-white/40 max-w-md mx-auto">
            Search by your order ID or the phone number you used at checkout.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
            {[
              { key: "id", label: "Order ID" },
              { key: "phone", label: "Phone" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setSearchMode(opt.key);
                  setError("");
                }}
                className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.25em] font-bold transition-all ${
                  searchMode === opt.key
                    ? "bg-[#FF4DA3] text-white shadow-md shadow-pink-500/20"
                    : "text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {searchMode === "phone" ? (
            <input
              key="phone-input"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value.replace(/\D/g, ""))}
              placeholder="01234567890"
              className="flex-1 px-5 py-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3] font-mono tracking-wider"
            />
          ) : (
            <input
              key="id-input"
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Z0YA-123456"
              className="flex-1 px-5 py-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3] font-mono tracking-wider"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 rounded-2xl bg-[#FF4DA3] text-white font-bold tracking-widest uppercase text-xs hover:shadow-lg hover:shadow-pink-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <PackageSearch size={16} />}
            {loading ? "Searching" : "Track"}
          </button>
        </motion.form>

        <AnimatePresence mode="wait">
          {error && !loading && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
            >
              <AlertCircle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {notFound && !loading && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-8 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10"
            >
              <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-black/5 dark:border-white/5">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 bg-[#FF4DA3]/15 rounded-full blur-xl"
                  />
                  <SearchX size={40} strokeWidth={1.5} className="text-[#FF4DA3] relative z-10" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl sm:text-3xl font-serif italic">
                    No orders found
                  </h3>
                  <p className="text-sm text-black/60 dark:text-white/50 max-w-sm leading-relaxed">
                    We couldn&apos;t find anything matching this {notFound.mode === "phone" ? "phone number" : "order ID"}:
                  </p>
                  <p className="font-mono text-sm font-bold text-[#FF4DA3] tracking-wider break-all px-4 mt-2">
                    {notFound.query}
                  </p>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                  Quick checks
                </p>
                <ul className="space-y-2 text-sm text-black/70 dark:text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF4DA3] mt-1">•</span>
                    <span>Double-check for typos or extra spaces.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF4DA3] mt-1">•</span>
                    <span>
                      {notFound.mode === "phone"
                        ? "Make sure the number you entered is the same one you placed the order with."
                        : "Order IDs start with Z0YA- followed by 6 digits."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF4DA3] mt-1">•</span>
                    <span>If you just placed the order, give it a moment and try again.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-1">
                    Still need help?
                  </p>
                  <p className="text-sm text-black/70 dark:text-white/60">
                    Reach out to our customer service — we&apos;re here for you.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`https://wa.me/${SUPPORT.whatsapp}?text=${buildSupportMessage(notFound.mode, notFound.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-sm tracking-wide hover:shadow-lg hover:shadow-[#25D366]/30 transition-all active:scale-95"
                  >
                    <MessageCircle size={18} strokeWidth={2.5} />
                    WhatsApp Us
                  </a>
                  <a
                    href={`tel:${SUPPORT.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-black/15 dark:border-white/15 hover:border-[#FF4DA3] hover:text-[#FF4DA3] font-bold text-sm tracking-wide transition-all active:scale-95"
                  >
                    <Phone size={16} strokeWidth={2.5} />
                    Call {SUPPORT.phoneDisplay}
                  </a>
                </div>

                <button
                  onClick={() => {
                    setNotFound(null);
                    setError("");
                    if (notFound.mode === "phone") setPhoneQuery("");
                    else setOrderId("");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/40 hover:text-[#FF4DA3] transition-colors"
                >
                  <RefreshCw size={13} />
                  Try a different search
                </button>
              </div>
            </motion.div>
          )}

          {orderList && !loading && !order && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mt-8 space-y-3"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-black/50 dark:text-white/40 mb-2">
                {orderList.length} {orderList.length === 1 ? "order" : "orders"} found
              </p>
              {orderList.map((o) => {
                const stage = STATUS_FLOW.find((s) => s.key === o.status);
                const StageIcon = stage?.icon ?? Clock;
                const cancelled = o.status === "cancelled";
                return (
                  <button
                    key={o.order_id}
                    onClick={() => selectFromList(o)}
                    className="w-full text-left p-4 sm:p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:border-[#FF4DA3]/50 hover:bg-[#FF4DA3]/[0.04] transition-all flex items-center gap-4"
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full grid place-items-center ${
                        cancelled
                          ? "bg-red-500/15 text-red-500"
                          : "bg-[#FF4DA3]/15 text-[#FF4DA3]"
                      }`}
                    >
                      <StageIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-bold text-[#FF4DA3] tracking-wider">
                        {o.order_id}
                      </p>
                      <p className="text-[11px] text-black/50 dark:text-white/40 mt-0.5">
                        {o.items_count} pieces • {formatDate(o.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-0.5">
                        {cancelled ? "Cancelled" : stage?.label ?? o.status}
                      </p>
                      <p className="text-sm font-bold">
                        {o.currency} {Number(o.total_price ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}

          {order && !loading && (
            <motion.div
              key={order.order_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="mt-10 space-y-8"
            >
              <div className="p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                      Order ID
                    </p>
                    <p className="font-mono text-lg sm:text-xl font-bold text-[#FF4DA3] tracking-wider mt-1">
                      {order.order_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                      Total
                    </p>
                    <p className="text-lg sm:text-xl font-bold mt-1">
                      {order.currency} {Number(order.total_price ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-black/5 dark:border-white/5 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-1">
                      Items
                    </p>
                    <p className="font-medium">{order.items_count} pieces</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-1">
                      Placed on
                    </p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  {order.updated_at && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40 mb-1">
                        Last update
                      </p>
                      <p className="font-medium">{formatDate(order.updated_at)}</p>
                    </div>
                  )}
                </div>

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                      Items
                    </p>
                    <ul className="divide-y divide-black/5 dark:divide-white/5">
                      {order.items.map((it, i) => {
                        const colorName =
                          typeof it.color === "object" ? it.color?.name : it.color;
                        const colorValue =
                          typeof it.color === "object" ? it.color?.value : null;
                        return (
                          <li
                            key={`${it.id}-${i}`}
                            className="flex gap-3 py-3 items-center"
                          >
                            {it.image && (
                              <div className="w-14 h-16 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
                                <img
                                  src={it.image}
                                  alt={it.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 text-sm">
                              <p className="font-medium truncate">{it.name}</p>
                              <p className="text-[10px] uppercase tracking-wider text-black/50 dark:text-white/40 mt-0.5 flex items-center gap-1.5">
                                {colorValue && (
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/10"
                                    style={{ backgroundColor: colorValue }}
                                  />
                                )}
                                {colorName ?? "—"}
                                {it.size ? ` • Size ${it.size}` : ""}
                                {" • "} ×{it.quantity}
                              </p>
                            </div>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {order.currency}{" "}
                              {(Number(it.price) * Number(it.quantity)).toLocaleString()}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {canEdit && (
                  <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-black/50 dark:text-white/40 max-w-md">
                      Need changes? You can edit or cancel while the order is{" "}
                      <span className="text-[#FF4DA3] font-bold">pending</span>.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={openCancel}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold tracking-widest uppercase transition-all"
                      >
                        <XCircle size={14} />
                        Cancel Order
                      </button>
                      <button
                        onClick={openEditor}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#FF4DA3] text-[#FF4DA3] hover:bg-[#FF4DA3] hover:text-white text-xs font-bold tracking-widest uppercase transition-all"
                      >
                        <Pencil size={14} />
                        Edit Order
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                <h2 className="text-xs uppercase tracking-[0.25em] text-black/50 dark:text-white/40 mb-6">
                  Shipment Progress
                </h2>

                {isCancelled ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <XCircle size={28} className="text-red-500 shrink-0" />
                    <div>
                      <p className="font-bold text-red-600 dark:text-red-400">Order Cancelled</p>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                        This order is no longer being processed.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ol className="relative space-y-7">
                    {STATUS_FLOW.map((stage, idx) => {
                      const Icon = stage.icon;
                      const reached = idx <= currentIdx;
                      const active = idx === currentIdx;
                      return (
                        <li key={stage.key} className="flex gap-4 items-start relative">
                          {idx < STATUS_FLOW.length - 1 && (
                            <span
                              aria-hidden
                              className={`absolute left-[19px] top-10 w-[2px] h-7 ${
                                idx < currentIdx
                                  ? "bg-[#FF4DA3]"
                                  : "bg-black/10 dark:bg-white/10"
                              }`}
                            />
                          )}
                          <div
                            className={`shrink-0 w-10 h-10 rounded-full grid place-items-center border-2 transition-all ${
                              reached
                                ? "bg-[#FF4DA3] border-[#FF4DA3] text-white"
                                : "border-black/15 dark:border-white/15 text-black/30 dark:text-white/30"
                            } ${active ? "ring-4 ring-[#FF4DA3]/20" : ""}`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 pt-1">
                            <p
                              className={`font-semibold text-sm ${
                                reached ? "text-black dark:text-white" : "text-black/40 dark:text-white/30"
                              }`}
                            >
                              {stage.label}
                            </p>
                            <p
                              className={`text-xs mt-0.5 ${
                                reached ? "text-black/60 dark:text-white/50" : "text-black/30 dark:text-white/25"
                              }`}
                            >
                              {stage.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              <p className="text-center text-xs text-black/40 dark:text-white/30">
                Need help? Reach out to our support team and mention your order ID.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !editLoading && setEditOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 sm:inset-x-0 bottom-3 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl z-[81] overflow-hidden"
            >
              <div className="p-6 border-b border-black/10 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif italic">Edit Order</h3>
                  <p className="text-xs text-black/50 dark:text-white/40 mt-1">
                    Only available while pending. Verify with your phone number.
                  </p>
                </div>
                <button
                  onClick={() => !editLoading && setEditOpen(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/50 dark:text-white/50 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submitEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.25em] text-black/50 dark:text-white/40">
                    Verify your original phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="01234567890"
                    value={editForm.verify_phone}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        verify_phone: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="w-full p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]"
                  />
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/30">
                    Update (leave empty to keep current)
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs text-black/60 dark:text-white/50">New full name</label>
                    <input
                      type="text"
                      placeholder="e.g. full name"
                      value={editForm.customer_name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, customer_name: e.target.value }))
                      }
                      className="w-full p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-black/60 dark:text-white/50">New phone</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="01234567890"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          phone: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-full p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-black/60 dark:text-white/50">New governorate</label>
                    <div className="relative" ref={govRef}>
                      <button
                        type="button"
                        onClick={() => setGovOpen((o) => !o)}
                        aria-haspopup="listbox"
                        aria-expanded={govOpen}
                        className={`w-full p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border outline-none transition-all flex items-center justify-between gap-3 text-left ${govOpen
                          ? "border-[#FF4DA3] ring-1 ring-[#FF4DA3]/40"
                          : "border-black/10 dark:border-white/15 hover:border-black/20 dark:hover:border-white/25"
                          }`}
                      >
                        <span className={`text-sm ${editForm.governorate ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"}`}>
                          {editForm.governorate || "Select your governorate"}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-black/50 dark:text-white/60 transition-transform duration-200 ${govOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {govOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-30 mt-2 w-full rounded-xl border border-black/10 dark:border-white/20 bg-white dark:bg-[#161616] shadow-xl shadow-black/10 dark:shadow-black/60 overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                          >
                            <ul
                              role="listbox"
                              className="max-h-60 overflow-y-auto py-1 custom-scrollbar"
                            >
                              {Object.keys(SHIPPING_FEES).map((gov) => {
                                const isSelected = editForm.governorate === gov;
                                return (
                                  <li key={gov} role="option" aria-selected={isSelected}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditForm((f) => ({ ...f, governorate: gov }));
                                        setGovOpen(false);
                                      }}
                                      className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-sm transition-colors ${isSelected
                                        ? "bg-[#FF4DA3]/15 dark:bg-[#FF4DA3]/20 text-[#FF4DA3] font-medium"
                                        : "text-black/80 dark:text-white/85 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                                        }`}
                                    >
                                      <span>{gov}</span>
                                      <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                                        EGP {SHIPPING_FEES[gov]}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-black/60 dark:text-white/50">New address</label>
                    <textarea
                      rows={3}
                      placeholder="Street, Building, Apartment..."
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, address: e.target.value }))
                      }
                      className="w-full p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3] resize-none"
                    />
                  </div>
                </div>

                {editItems.length > 0 && (
                  <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/30">
                        Items{" "}
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FF4DA3]/10 text-[#FF4DA3] tracking-normal normal-case">
                          {editItems.length}
                        </span>
                      </p>
                      <p className="text-xs text-black/50 dark:text-white/40">
                        New total:{" "}
                        <span className="font-bold text-[#FF4DA3]">
                          {order?.currency} {editTotal.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    {editItems.length > 1 && (
                      <p className="text-[10px] text-black/40 dark:text-white/40 italic">
                        Scroll to edit each product. Changes apply per item.
                      </p>
                    )}

                    <ul className="space-y-3">
                      {editItems.map((it, idx) => {
                        const colors = Array.isArray(it.availableColors)
                          ? it.availableColors
                          : [];
                        const sizes = Array.isArray(it.availableSizes)
                          ? it.availableSizes
                          : [];
                        const currentColorName =
                          typeof it.color === "object" ? it.color?.name : it.color;
                        return (
                          <li
                            key={itemKey(it, idx)}
                            className="p-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-3"
                          >
                            <div className="flex gap-3">
                              {it.image && (
                                <div className="w-14 h-16 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
                                  <img
                                    src={it.image}
                                    alt={it.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{it.name}</p>
                                <p className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mt-0.5">
                                  {currentColorName ?? "—"}
                                  {it.size ? ` • ${it.size}` : ""}
                                </p>
                                <p className="text-xs mt-1">
                                  {order?.currency}{" "}
                                  {(Number(it.price) * Number(it.quantity)).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeItemAt(idx)}
                                  aria-label="Remove item"
                                  className="p-1.5 rounded-full text-black/40 dark:text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => changeItemQty(idx, -1)}
                                    disabled={it.quantity <= 1}
                                    className="w-7 h-7 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#FF4DA3] transition"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-7 text-center text-xs font-medium">
                                    {it.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => changeItemQty(idx, 1)}
                                    className="w-7 h-7 grid place-items-center hover:text-[#FF4DA3] transition"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {colors.length > 1 && (
                              <div className="space-y-1.5">
                                <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                                  Color
                                </p>
                                <div className="flex gap-1.5 flex-wrap">
                                  {colors.map((c) => {
                                    const active = c.name === currentColorName;
                                    return (
                                      <button
                                        type="button"
                                        key={c.name}
                                        onClick={() => changeItemColor(idx, c)}
                                        title={c.name}
                                        className={`w-7 h-7 rounded-full border-2 grid place-items-center transition-all ${
                                          active
                                            ? "border-[#FF4DA3] scale-110"
                                            : "border-transparent hover:border-black/30 dark:hover:border-white/30"
                                        }`}
                                      >
                                        <span
                                          className="w-4 h-4 rounded-full ring-1 ring-black/10 dark:ring-white/10"
                                          style={{ backgroundColor: c.value }}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {sizes.length > 1 && (
                              <div className="space-y-1.5">
                                <p className="text-[9px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                                  Size
                                </p>
                                <div className="flex gap-1.5 flex-wrap">
                                  {sizes.map((s) => {
                                    const active = s === it.size;
                                    return (
                                      <button
                                        type="button"
                                        key={s}
                                        onClick={() => updateItemAt(idx, { size: s })}
                                        className={`min-w-[2rem] h-8 px-2 rounded-md border text-[11px] font-bold transition-all ${
                                          active
                                            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                                            : "border-black/10 dark:border-white/10 hover:border-black/40 dark:hover:border-white/40 text-black/70 dark:text-white/70"
                                        }`}
                                      >
                                        {s}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Add a product to the order */}
                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                  {!productPickerOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProductPickerOpen(true);
                        loadCatalog();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-black/15 dark:border-white/15 text-black/60 dark:text-white/60 hover:border-[#FF4DA3] hover:text-[#FF4DA3] transition-colors text-xs uppercase tracking-[0.2em] font-semibold"
                    >
                      <PackagePlus size={14} />
                      Add a product
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                      <div className="flex items-center gap-2 p-3 border-b border-black/5 dark:border-white/5">
                        <Search size={14} className="text-black/40 dark:text-white/40 shrink-0" />
                        <input
                          type="text"
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Search products..."
                          className="flex-1 bg-transparent outline-none text-sm placeholder:text-black/30 dark:placeholder:text-white/30"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProductPickerOpen(false);
                            setProductQuery("");
                          }}
                          className="p-1 rounded-full text-black/40 dark:text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          aria-label="Close picker"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="max-h-56 overflow-y-auto custom-scrollbar">
                        {catalogLoading && (
                          <div className="flex items-center gap-2 p-4 text-xs text-black/50 dark:text-white/40">
                            <Loader2 size={14} className="animate-spin" />
                            Loading products...
                          </div>
                        )}

                        {!catalogLoading && catalogError && (
                          <div className="flex items-start gap-2 p-3 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle size={14} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                            <span>{catalogError}</span>
                          </div>
                        )}

                        {!catalogLoading && !catalogError && filteredCatalog.length === 0 && (
                          <p className="p-4 text-xs text-black/40 dark:text-white/40 italic">
                            No products match your search.
                          </p>
                        )}

                        {!catalogLoading && !catalogError && filteredCatalog.length > 0 && (
                          <ul className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredCatalog.map((p) => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  onClick={() => addProductToOrder(p)}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-[#FF4DA3]/5 transition-colors text-left"
                                >
                                  {p.image ? (
                                    <div className="w-10 h-12 rounded-md overflow-hidden bg-black/5 dark:bg-white/5 shrink-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-12 rounded-md bg-black/5 dark:bg-white/5 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{p.name}</p>
                                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">
                                      {order?.currency ?? "EGP"}{" "}
                                      {Number(p.price ?? 0).toLocaleString()}
                                    </p>
                                  </div>
                                  <Plus
                                    size={14}
                                    className="text-black/30 dark:text-white/30 shrink-0"
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {editError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs"
                    >
                      <AlertCircle size={14} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                      <span>{editError}</span>
                    </motion.div>
                  )}
                  {editSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs"
                    >
                      <CheckCircle2 size={14} strokeWidth={2.5} />
                      <span>Order updated successfully.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={editLoading || editSuccess}
                  className="w-full py-3.5 rounded-xl bg-[#FF4DA3] text-white font-bold tracking-widest uppercase text-xs hover:shadow-lg hover:shadow-pink-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Saving
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save Changes
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {cancelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !cancelLoading && setCancelOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white dark:bg-[#0c0c0c] border border-black/10 dark:border-white/10 shadow-2xl shadow-black/30 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 p-6 border-b border-black/5 dark:border-white/5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif italic">Cancel Order</h3>
                    <p className="text-xs text-black/50 dark:text-white/40 mt-1">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !cancelLoading && setCancelOpen(false)}
                  disabled={cancelLoading}
                  aria-label="Close"
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {cancelSuccess ? (
                <div className="p-8 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-sm font-medium">Your order has been cancelled.</p>
                </div>
              ) : (
                <form onSubmit={submitCancel} className="p-6 space-y-4">
                  <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed">
                    Are you sure you want to cancel order{" "}
                    <span className="font-mono font-bold text-[#FF4DA3]">
                      {order?.order_id}
                    </span>
                    ? Please confirm by entering the phone number you used at checkout.
                  </p>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.25em] text-black/50 dark:text-white/50 mb-2">
                      Original phone number
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="01xxxxxxxxx"
                      value={cancelPhone}
                      onChange={(e) => setCancelPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 text-sm transition-all"
                      autoFocus
                      disabled={cancelLoading}
                    />
                  </div>

                  <AnimatePresence>
                    {cancelError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-xs text-red-500"
                      >
                        <AlertCircle size={13} />
                        {cancelError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCancelOpen(false)}
                      disabled={cancelLoading}
                      className="flex-1 py-3 rounded-xl border border-black/10 dark:border-white/10 text-xs font-bold tracking-widest uppercase hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Keep Order
                    </button>
                    <button
                      type="submit"
                      disabled={cancelLoading || !cancelPhone.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-xs font-bold tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {cancelLoading ? "Cancelling..." : "Confirm Cancel"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-white dark:bg-[#050505]">
          <Loader2 className="animate-spin text-[#FF4DA3]" size={32} />
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
