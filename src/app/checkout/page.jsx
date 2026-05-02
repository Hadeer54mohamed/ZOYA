"use client";

import { useCart } from "../context/CartContext";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, Loader2, ShoppingBag, AlertCircle, Copy, Check, PackageSearch, Wallet, ChevronDown, Tag, X, Search } from "lucide-react";
import Link from "next/link";
import { SHIPPING_FEES } from "../lib/shipping";
import { validateCheckoutForm } from "../lib/validation";

const INSTAPAY_NUMBER =  process.env.NEXT_PUBLIC_INSTAPAY_NUMBER;

export default function CheckoutPage() {
  const discountCache = useRef({});

  const { cart, clearCart, cartTotal, setIsCartOpen } = useCart();
  const router = useRouter();

  useEffect(() => {
    setIsCartOpen(false);
  }, [setIsCartOpen]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // Synchronous guard against rapid double clicks (state updates are async,
  // so two clicks fired in the same tick can both bypass `loading`).
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [copied, setCopied] = useState(false);
  const [instapayCopied, setInstapayCopied] = useState(false);
  const [govOpen, setGovOpen] = useState(false);
  const [govQuery, setGovQuery] = useState("");
  const govRef = useRef(null);
  const govSearchRef = useRef(null);

  const filteredGovernorates = useMemo(() => {
    const all = Object.keys(SHIPPING_FEES);
    const q = govQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter((g) => g.toLowerCase().includes(q));
  }, [govQuery]);

  useEffect(() => {
    if (!govOpen) {
      setGovQuery("");
      return;
    }
    const handleClickOutside = (e) => {
      if (govRef.current && !govRef.current.contains(e.target)) {
        setGovOpen(false);
        setTouched((t) => ({ ...t, governorate: true }));
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setGovOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    const focusTimer = setTimeout(() => {
      govSearchRef.current?.focus();
    }, 50);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      clearTimeout(focusTimer);
    };
  }, [govOpen]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    governorate: "",
    paymentMethod: "cash", // cash | online
  });

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  // Tracks the most recent code we tried to validate, so stale debounced
  // responses (slow network) cannot overwrite a fresher result.
  const latestCodeReqRef = useRef("");
  const codeAbortRef = useRef(null);
  const discountInputRef = useRef(null);

  const shippingFee = SHIPPING_FEES[form.governorate] || 0;

  const discountAmount = useMemo(() => {
    if (!discount) return 0;
    if (discount.discount_type === "percent") {
      return Math.round((cartTotal * Number(discount.value)) / 100);
    }
    if (discount.discount_type === "fixed") {
      return Math.min(cartTotal, Number(discount.value));
    }
    return 0;
  }, [discount, cartTotal]);

  const finalTotal = Math.max(0, cartTotal + shippingFee - discountAmount);

  const validateDiscountCode = async (rawCode, { silent = false } = {}) => {
    const trimmed = (rawCode ?? "").trim().toUpperCase();
    const phone = form.phone.trim();
    // Cache key depends on phone too — a code valid for one phone may be
    // invalid for another (e.g. that phone already used it).
    const cacheKey = `${trimmed}|${phone}`;

    if (codeAbortRef.current) {
      codeAbortRef.current.abort();
    }

    if (!trimmed) {
      setDiscount(null);
      if (!silent) setCodeError("Please enter a code.");
      else setCodeError("");
      setApplyingCode(false);
      return;
    }

    // Cache hit — apply instantly, skip the network entirely.
    // We cache positive results only, so the server stays the source of truth
    // for invalid/expired codes (avoids stale "invalid" if an admin re-enables one).
    const cached = discountCache.current[cacheKey];
    if (cached) {
      latestCodeReqRef.current = trimmed;
      setApplyingCode(false);
      discountInputRef.current?.blur();
      setDiscount(cached);
      setCodeError("");
      setCode(cached.code);
      return;
    }

    latestCodeReqRef.current = trimmed;
    const controller = new AbortController();
    codeAbortRef.current = controller;

    setApplyingCode(true);
    if (!silent) setCodeError("");

    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, phone }),
        signal: controller.signal,
      });

      // Stale response — a newer keystroke fired off another request after us.
      if (latestCodeReqRef.current !== trimmed) return;

      let result = {};
      try {
        result = await res.json();
      } catch {
        result = {};
      }

      if (!res.ok || !result?.success || !result?.discount) {
        setDiscount(null);
        setCodeError(result?.error || "Invalid or expired code.");
        return;
      }

      // Cache the validated discount so re-typing / re-applying skips the network.
      discountCache.current[cacheKey] = result.discount;

      // Visually confirm "done" — blur the input so the keyboard caret leaves
      // and the field stops looking editable before the pill swaps in.
      discountInputRef.current?.blur();

      setDiscount(result.discount);
      setCodeError("");
      setCode(result.discount.code);
    } catch (err) {
      if (err?.name === "AbortError") return;
      if (latestCodeReqRef.current !== trimmed) return;
      setDiscount(null);
      setCodeError("Couldn't verify the code. Please try again.");
    } finally {
      if (latestCodeReqRef.current === trimmed) {
        setApplyingCode(false);
      }
    }
  };

  const handleApplyCode = () => validateDiscountCode(code);

  // Cleanup any in-flight request on unmount.
  useEffect(() => {
    return () => {
      if (codeAbortRef.current) codeAbortRef.current.abort();
    };
  }, []);

  const handleRemoveCode = () => {
    if (codeAbortRef.current) codeAbortRef.current.abort();
    latestCodeReqRef.current = "";
    setDiscount(null);
    setCode("");
    setCodeError("");
    setApplyingCode(false);
  };

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
    governorate: false,
  });

  const { errors, isValid: isFormValid } = useMemo(
    () => validateCheckoutForm(form, SHIPPING_FEES),
    [form]
  );

  const handleNext = () => {
    if (isFormValid) {
      setStep(2);
      return;
    }
    setTouched({ name: true, phone: true, address: true, governorate: true });
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleCopyOrderId = async () => {
    if (!placedOrderId) return;
    try {
      await navigator.clipboard.writeText(placedOrderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyInstapay = async () => {
    try {
      await navigator.clipboard.writeText(INSTAPAY_NUMBER);
      setInstapayCopied(true);
      setTimeout(() => setInstapayCopied(false), 2000);
    } catch {
      setInstapayCopied(false);
    }
  };

  const handleOrder = async () => {
    if (loading || submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setSubmitError("");

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      color: item.color ?? null,
      size: item.size ?? null,
      quantity: item.quantity,
      price: item.price,
      availableColors: item.availableColors ?? [],
      availableSizes: item.availableSizes ?? [],
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          governorate: form.governorate,
          payment_method: form.paymentMethod,
          shipping_fee: shippingFee,
          total_price: finalTotal,
          items: orderItems,
          discount_code: discount?.code ?? null,
        })
      });

      let result = {};
      try {
        result = await res.json();
      } catch {
        result = {};
      }
      setLoading(false);

      if (!res.ok || !result?.success) {
        const serverMsg = result?.error || "";
        console.error(
          "Order error:",
          `status=${res.status} ${res.statusText} | message=${serverMsg || "(empty)"}`
        );

        // If the failure is about the discount code (already used / limit reached
        // / invalid), drop the applied code so the user can re-submit without it.
        const isDiscountIssue =
          /already used|reached its limit|invalid discount code/i.test(serverMsg);

        if (isDiscountIssue) {
          if (discount?.code) {
            const phoneKey = form.phone.trim();
            delete discountCache.current[`${discount.code}|${phoneKey}`];
          }
          if (codeAbortRef.current) codeAbortRef.current.abort();
          latestCodeReqRef.current = "";
          setDiscount(null);
          setCode("");
          setCodeError("");
          setApplyingCode(false);
          setSubmitError(
            `${serverMsg} The code was removed — please review your total and try again.`
          );
        } else {
          setSubmitError(
            serverMsg || `Order failed (${res.status}). Please try again.`
          );
        }

        submittingRef.current = false;
        return;
      }

      const orderId = result.order?.order_id ?? result.order?.id ?? "";
      console.log("Order placed:", orderId);
      setPlacedOrderId(orderId);

      clearCart();
      setStep(3);
      setTimeout(() => router.prefetch("/"), 500);
    } catch (err) {
      setLoading(false);
      submittingRef.current = false;
      console.error("Unexpected order error:", err);
      setSubmitError(
        err?.message || "An unexpected error occurred. Please try again."
      );
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-[#FF4DA3]/5 rounded-full"
            />
            <ShoppingBag size={48} strokeWidth={1} className="text-black/20 dark:text-white/20" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif italic tracking-tight">Your Wardrobe is Awaiting</h1>
            <p className="text-sm text-black/40 dark:text-white/40 max-w-[280px] mx-auto leading-relaxed">
              It seems you haven't added any pieces to your collection yet.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="group relative px-12 py-4 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-[0.2em] overflow-hidden transition-all"
          >
            <span className="relative z-10">Explore Collection</span>
            <motion.div
              className="absolute inset-0 bg-[#FF4DA3]"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ type: "tween" }}
            />
          </button>
        </motion.div>
      </main>
    );
  }

  const showSummaryError =
    !isFormValid &&
    (touched.name || touched.phone || touched.address || touched.governorate);

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-500">
      {/* STEP INDICATOR */}
      <div className="pt-24 sm:pt-32 pb-6 sm:pb-10 px-4 flex justify-center items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-medium">
        <span className={`${step >= 1 ? "text-[#FF4DA3]" : "text-black/20 dark:text-white/20"} transition-colors`}>Information</span>
        <div className="w-5 sm:w-8 h-[1px] bg-black/10 dark:bg-white/10" />
        <span className={`${step >= 2 ? "text-[#FF4DA3]" : "text-black/20 dark:text-white/20"} transition-colors`}>Review</span>
        <div className="w-5 sm:w-8 h-[1px] bg-black/10 dark:bg-white/10" />
        <span className={`${step === 3 ? "text-[#FF4DA3]" : "text-black/20 dark:text-white/20"} transition-colors`}>Confirmation</span>
      </div>

      <section className={`px-4 sm:px-6 pb-12 max-w-6xl mx-auto grid gap-8 md:gap-16 ${step === 3 ? "md:grid-cols-1" : "md:grid-cols-12"}`}>

        {/* LEFT COLUMN: Forms (7 cols) / Full width on confirmation */}
        <div className={step === 3 ? "w-full" : "md:col-span-7 order-2 md:order-1"}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl sm:text-5xl font-serif italic mb-2">Shipping</h1>
                  <p className="text-sm sm:text-base text-black/50 dark:text-white/40">Please enter your delivery details.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. full name"
                      className={`w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border outline-none transition-all ${touched.name && errors.name
                        ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                        : "border-black/10 dark:border-white/10 focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]"
                        }`}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onBlur={() => handleBlur("name")}
                    />
                    <AnimatePresence>
                      {touched.name && errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-1.5 text-xs text-red-500 ml-1"
                        >
                          <AlertCircle size={13} strokeWidth={2.5} />
                          {errors.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="01234567890"
                      className={`w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border outline-none transition-all ${touched.phone && errors.phone
                        ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                        : "border-black/10 dark:border-white/10 focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]"
                        }`}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                      onBlur={() => handleBlur("phone")}
                    />
                    <AnimatePresence>
                      {touched.phone && errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-1.5 text-xs text-red-500 ml-1"
                        >
                          <AlertCircle size={13} strokeWidth={2.5} />
                          {errors.phone}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest ml-1">Detailed Address</label>
                    <textarea
                      rows={3}
                      placeholder="Street, Building, Apartment..."
                      className={`w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border outline-none transition-all resize-none ${touched.address && errors.address
                        ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                        : "border-black/10 dark:border-white/10 focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]"
                        }`}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      onBlur={() => handleBlur("address")}
                    />
                    <AnimatePresence>
                      {touched.address && errors.address && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-1.5 text-xs text-red-500 ml-1"
                        >
                          <AlertCircle size={13} strokeWidth={2.5} />
                          {errors.address}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest ml-1">
                    Governorate
                  </label>

                  <div className="relative" ref={govRef}>
                    <button
                      type="button"
                      onClick={() => setGovOpen((o) => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={govOpen}
                      className={`w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border outline-none transition-all flex items-center justify-between gap-3 text-left ${touched.governorate && errors.governorate
                        ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                        : govOpen
                          ? "border-[#FF4DA3] ring-1 ring-[#FF4DA3]/40"
                          : "border-black/10 dark:border-white/15 hover:border-black/20 dark:hover:border-white/25"
                        }`}
                    >
                      <span className={`text-sm ${form.governorate ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"}`}>
                        {form.governorate || "Select your governorate"}
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
                          className="absolute z-30 mt-2 w-full rounded-2xl border border-black/10 dark:border-white/20 bg-white dark:bg-[#161616] shadow-xl shadow-black/10 dark:shadow-black/60 overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                        >
                          <div className="p-2 border-b border-black/5 dark:border-white/10">
                            <div className="relative">
                              <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 pointer-events-none"
                              />
                              <input
                                ref={govSearchRef}
                                type="text"
                                value={govQuery}
                                onChange={(e) => setGovQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && filteredGovernorates.length > 0) {
                                    e.preventDefault();
                                    const gov = filteredGovernorates[0];
                                    setForm({ ...form, governorate: gov });
                                    setGovOpen(false);
                                    setTouched((t) => ({ ...t, governorate: true }));
                                  }
                                }}
                                placeholder="Search governorate..."
                                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-transparent focus:border-[#FF4DA3]/40 outline-none text-sm placeholder:text-black/40 dark:placeholder:text-white/40"
                              />
                              {govQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGovQuery("");
                                    govSearchRef.current?.focus();
                                  }}
                                  aria-label="Clear search"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black/50 dark:text-white/50"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {filteredGovernorates.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-black/40 dark:text-white/40">
                              No governorates match &quot;{govQuery}&quot;
                            </div>
                          ) : (
                            <ul
                              role="listbox"
                              className="max-h-56 overflow-y-auto py-1 custom-scrollbar"
                            >
                              {filteredGovernorates.map((gov) => {
                                const isSelected = form.governorate === gov;
                                return (
                                  <li key={gov} role="option" aria-selected={isSelected}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setForm({ ...form, governorate: gov });
                                        setGovOpen(false);
                                        setTouched((t) => ({ ...t, governorate: true }));
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
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {touched.governorate && errors.governorate && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1.5 text-xs text-red-500 ml-1"
                      >
                        <AlertCircle size={13} strokeWidth={2.5} />
                        {errors.governorate}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest ml-1">
                    Payment Method
                  </label>

                  <div className="flex gap-3">
                    {[
                      { key: "cash", label: "Cash on Delivery" },
                      { key: "online", label: "Instapay / Wallet" },
                    ].map((method) => (
                      <button
                        key={method.key}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, paymentMethod: method.key })
                        }
                        className={`flex-1 p-4 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all ${form.paymentMethod === method.key
                          ? "border-[#FF4DA3] bg-[#FF4DA3]/10 text-[#FF4DA3]"
                          : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/40"
                          }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {form.paymentMethod === "online" && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 rounded-2xl bg-[#FF4DA3]/5 border border-[#FF4DA3]/30 space-y-3">
                          <div className="flex items-start gap-3">
                            <Wallet size={18} strokeWidth={2} className="text-[#FF4DA3] shrink-0 mt-0.5" />
                            <div className="text-sm leading-relaxed">
                              <p className="font-semibold text-[#FF4DA3] mb-0.5">
                                Please send payment via InstaPay
                              </p>
                              <p className="text-xs text-black/60 dark:text-white/50">
                                Transfer the total amount to the number below, then place your order. We will confirm once payment is received.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5">
                            <span className="font-mono text-base font-bold tracking-wider text-black dark:text-white select-all">
                              {INSTAPAY_NUMBER}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyInstapay}
                              aria-label="Copy InstaPay number"
                              className={`flex-shrink-0 p-2 rounded-full transition-all ${instapayCopied
                                ? "bg-emerald-500/15 text-emerald-500"
                                : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-[#FF4DA3]/15 hover:text-[#FF4DA3]"
                                }`}
                            >
                              {instapayCopied ? <Check size={15} /> : <Copy size={15} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-4">
                  <AnimatePresence>
                    {showSummaryError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                      >
                        <AlertCircle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                        <div className="text-sm leading-relaxed">
                          <p className="font-semibold mb-0.5">Please fix the highlighted fields</p>
                          <p className="text-xs opacity-80">All shipping details are required to continue.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleNext}
                    disabled={!isFormValid}
                    className="w-full py-5 rounded-2xl bg-[#FF4DA3] text-white font-bold tracking-widest uppercase text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Continue to Review
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm text-black/50 dark:text-white/40 hover:text-[#FF4DA3] transition-colors"
                >
                  <ArrowLeft size={16} /> Edit Info
                </button>

                <div>
                  <h1 className="text-4xl sm:text-5xl font-serif italic mb-2">Final Review</h1>
                  <p className="text-sm sm:text-base text-black/50 dark:text-white/40">Check your details before confirming.</p>
                </div>

                <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-4">
                    <span className="text-sm opacity-50 font-light">Deliver to</span>
                    <span className="text-sm font-medium">{form.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-4">
                    <span className="text-sm opacity-50 font-light">Contact</span>
                    <span className="text-sm font-medium">{form.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-4">
                    <span className="text-sm opacity-50 font-light">Governorate</span>
                    <span className="text-sm font-medium">{form.governorate}</span>
                  </div>

                  <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-4">
                    <span className="text-sm opacity-50 font-light">Payment</span>
                    <span className="text-sm font-medium">
                      {form.paymentMethod === "online" ? "Instapay / Wallet" : "Cash on Delivery"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm opacity-50 font-light">Address</span>
                    <span className="text-sm font-medium leading-relaxed">{form.address}</span>
                  </div>
                </div>


                {form.paymentMethod === "online" && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FF4DA3]/5 border border-[#FF4DA3]/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <Wallet size={18} strokeWidth={2} className="text-[#FF4DA3] shrink-0 mt-0.5" />
                      <div className="text-sm leading-relaxed">
                        <p className="font-semibold text-[#FF4DA3] mb-0.5">
                          Please send payment via InstaPay
                        </p>
                        <p className="text-xs text-black/60 dark:text-white/50">
                          Transfer <span className="font-semibold">EGP {finalTotal.toLocaleString()}</span> to the number below before confirming your order.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5">
                      <span className="font-mono text-base font-bold tracking-wider text-black dark:text-white select-all">
                        {INSTAPAY_NUMBER}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyInstapay}
                        aria-label="Copy InstaPay number"
                        className={`flex-shrink-0 p-2 rounded-full transition-all ${instapayCopied
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-[#FF4DA3]/15 hover:text-[#FF4DA3]"
                          }`}
                      >
                        {instapayCopied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                    >
                      <AlertCircle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                      <div className="text-sm leading-relaxed">
                        <p className="font-semibold mb-0.5">Order could not be placed</p>
                        <p className="text-xs opacity-80">{submitError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleOrder}
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold tracking-widest uppercase text-sm transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} /> Processing Order...</>
                  ) : (
                    "Place Order Now"
                  )}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-[60vh] w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-16 space-y-6"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.2 }}
                    className="absolute inset-0 bg-[#FF4DA3]/20 rounded-full blur-2xl"
                  />
                  <CheckCircle2 size={80} className="text-[#FF4DA3] relative z-10" strokeWidth={1} />
                </div>

                <h1 className="text-4xl sm:text-5xl font-serif italic px-4">Merci, {form.name?.trim()?.split(/\s+/)[0] || "there"}!</h1>
                <p className="text-sm sm:text-base text-black/50 dark:text-white/40 max-w-sm leading-relaxed px-4">
                  Your order has been received and is being prepared with care.
                  You will receive a confirmation call shortly.
                </p>

                {placedOrderId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md mx-auto p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                      Your Order ID
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-base sm:text-lg font-bold text-[#FF4DA3] tracking-wider select-all break-all">
                        {placedOrderId}
                      </span>
                      <button
                        onClick={handleCopyOrderId}
                        aria-label="Copy order ID"
                        className={`flex-shrink-0 p-2.5 rounded-full transition-all ${copied
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-[#FF4DA3]/15 hover:text-[#FF4DA3]"
                          }`}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-black/40 dark:text-white/30 leading-relaxed">
                      Save this ID to track your order&apos;s status anytime.
                    </p>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {placedOrderId && (
                    <Link
                      href={`/track?id=${encodeURIComponent(placedOrderId)}`}
                      className="px-8 py-4 rounded-full border border-[#FF4DA3] text-[#FF4DA3] hover:bg-[#FF4DA3] hover:text-white text-sm font-bold tracking-tighter transition-all flex items-center justify-center gap-2"
                    >
                      <PackageSearch size={16} />
                      Track Order
                    </Link>
                  )}
                  <button
                    onClick={() => router.push("/")}
                    className="px-10 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold tracking-tighter hover:scale-105 transition-transform"
                  >
                    Return to Store
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Order Summary (5 cols) - shows first on mobile */}
        {step < 3 && (
          <div className="md:col-span-5 order-1 md:order-2">
            <div className="md:sticky md:top-32 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-5 sm:mb-8 border-b border-black/5 dark:border-white/5 pb-4">
                <ShoppingBag size={18} className="text-[#FF4DA3]" />
                <h2 className="text-base sm:text-lg font-medium tracking-tight">Order Summary</h2>
              </div>

              <div className="space-y-4 sm:space-y-6 max-h-[35vh] sm:max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.color?.name || "default"}`} className="flex gap-3 sm:gap-4 items-center">
                    <div className="w-14 h-16 sm:w-16 sm:h-20 bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-[10px] opacity-40 uppercase tracking-tighter mt-0.5">
                        {item.color?.name || "default"} / {item.size} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">EGP {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Discount code */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-black/10 dark:border-white/10">
                <label className="text-[10px] uppercase tracking-[0.25em] opacity-60 ml-1">
                  Discount code
                </label>
                <AnimatePresence mode="wait" initial={false}>
                  {discount ? (
                    <motion.div
                      key="discount-applied"
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      className="mt-2 flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FF4DA3]/10 border border-[#FF4DA3]/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <motion.span
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.05, type: "spring", stiffness: 400, damping: 18 }}
                          className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF4DA3] text-white"
                          aria-hidden="true"
                        >
                          <Check size={12} strokeWidth={3} />
                        </motion.span>
                        <Tag size={14} className="text-[#FF4DA3] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#FF4DA3] truncate">
                            {discount.code}
                          </p>
                          <p className="text-[10px] opacity-60">
                            {discount.discount_type === "percent"
                              ? `${discount.value}% off applied`
                              : `EGP ${Number(discount.value).toLocaleString()} off applied`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCode}
                        aria-label="Remove discount"
                        className="p-1.5 rounded-full hover:bg-[#FF4DA3]/20 transition-colors text-[#FF4DA3]"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="discount-input"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className={`mt-2 flex gap-2 transition-opacity ${applyingCode ? "opacity-70 pointer-events-none" : ""}`}
                      aria-busy={applyingCode}
                    >
                      <input
                        ref={discountInputRef}
                        type="text"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase());
                          if (codeError) setCodeError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCode();
                          }
                        }}
                        placeholder="Enter code"
                        disabled={applyingCode}
                        aria-disabled={applyingCode}
                        className="flex-1 px-4 py-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3]/40 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:opacity-40 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCode}
                        disabled={applyingCode || !code.trim()}
                        aria-label={applyingCode ? "Validating code" : "Apply discount code"}
                        className="inline-flex items-center justify-center gap-2 min-w-[90px] sm:min-w-[100px] px-4 sm:px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      >
                        {applyingCode ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Checking</span>
                          </>
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {codeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-1.5 text-xs text-red-500 mt-2 ml-1"
                    >
                      <AlertCircle size={12} strokeWidth={2.5} />
                      {codeError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-black/10 dark:border-white/10 space-y-3 sm:space-y-4">
                <div className="flex justify-between text-xs sm:text-sm opacity-50">
                  <span>Subtotal</span>
                  <span>EGP {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm opacity-50">
                  <span>Shipping</span>
                  <span>
                    {form.governorate
                      ? `EGP ${shippingFee}`
                      : "Select governorate"}
                  </span>
                </div>
                {discount && discountAmount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-[#FF4DA3]">
                    <span className="flex items-center gap-1.5">
                      <Tag size={12} />
                      Discount ({discount.code})
                    </span>
                    <span>− EGP {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-black/10 dark:border-white/10 space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-end gap-2">
                    <span className="text-base sm:text-lg font-serif italic">Total</span>
                    <div className="text-right">
                      <motion.span
                        key={finalTotal}
                        initial={{ opacity: 0.5, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        EGP {finalTotal.toLocaleString()}
                      </motion.span>
                      <span className="text-[9px] px-5 sm:text-[10px] opacity-30 uppercase tracking-widest">Including VAT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}