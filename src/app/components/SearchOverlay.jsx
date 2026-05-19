"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { lockBodyScroll, unlockBodyScroll } from "../lib/bodyScrollLock";

export default function SearchOverlay({ open, onClose, products = [] }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const releaseScroll = lockBodyScroll();
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      releaseScroll();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (products || [])
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, products]);

  const goToProduct = (id) => {
    onClose();
    router.push(`/product/${id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    onClose();
    if (q) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/products");
    }
  };

  const suggestions = ["Sweatpants", "T-Shirts", "Porsche", "Cargo"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-20 sm:pt-24"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] dark:shadow-[0_30px_80px_-20px_rgba(255,46,136,0.35)]"
          >
            {/* Search input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 px-5 py-4 border-b border-black/5 dark:border-white/5"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-black/60 dark:text-white/60 shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for pieces, collections, vibes..."
                aria-label="Search products"
                className="flex-1 bg-transparent text-black dark:text-white text-base placeholder:text-black/60 dark:placeholder:text-white/60 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear"
                  className="h-7 w-7 grid place-items-center rounded-full bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition shrink-0"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 text-[10px] font-semibold tracking-widest shrink-0">
                ESC
              </kbd>
            </form>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.trim() === "" ? (
                <div className="p-5">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-black/60 dark:text-white/60 mb-3">
                    Quick Picks
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQuery(s)}
                        aria-label={`Search for ${s}`}
                        className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 text-xs hover:text-black dark:hover:text-white hover:border-[#FF4DA3]/50 hover:bg-[#FF4DA3]/5 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <ul className="p-2">
                  {results.map((p) => {
                    const img = p.colors?.[0]?.images?.[0];
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => goToProduct(p.id)}
                          aria-label={`View ${p.name}`}
                          className="group w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition text-left"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                            {img && (
                              <Image
                                src={img}
                                alt={p.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] tracking-[0.2em] uppercase text-black/60 dark:text-white/60">
                              {p.category}
                            </p>
                            <p className="text-black dark:text-white text-sm font-semibold truncate group-hover:text-[#FF4DA3] transition-colors">
                              {p.name}
                            </p>
                          </div>
                          <div className="text-[#FF4DA3] text-sm font-bold shrink-0">
                            EGP {p.price}
                          </div>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-black/60 dark:text-white/60 shrink-0 group-hover:translate-x-1 group-hover:text-[#FF4DA3] transition"
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-10 text-center">
                  <div className="h-14 w-14 mx-auto rounded-full bg-[#FF4DA3]/10 border border-[#FF4DA3]/20 grid place-items-center mb-4">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF4DA3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <p className="text-black dark:text-white text-sm font-semibold">
                    No matches for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-black/60 dark:text-white/60 text-xs mt-1">
                    Try a different word or browse all products.
                  </p>
                </div>
              )}
            </div>

            {/* Footer action */}
            {query.trim() !== "" && (
              <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
                <p className="text-[10px] tracking-[0.25em] uppercase text-black/60 dark:text-white/60">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 font-semibold">
                    Enter
                  </kbd>{" "}
                  to see all
                </p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  aria-label="View all search results"
                  className="px-4 py-2 rounded-full bg-[#FF4DA3] text-white text-[10px] font-bold tracking-widest uppercase hover:shadow-[0_0_20px_-5px_#FF4DA3] transition"
                >
                  View All Results
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
