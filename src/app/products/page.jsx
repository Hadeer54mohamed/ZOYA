"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import ProductCard from "../components/ProductCard";
import { products, categories } from "../data/products";

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name-asc", label: "Name: A to Z" },
];

function SortDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const current = options.find((o) => o.id === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative sm:w-60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full h-11 pl-4 pr-10 rounded-full bg-white dark:bg-white/5 border text-left text-black dark:text-white text-sm transition focus:outline-none focus:ring-2 focus:ring-[#FF4DA3]/20 cursor-pointer flex items-center ${
          open
            ? "border-[#FF4DA3]/50"
            : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
        }`}
      >
        <span className="truncate">
          <span className="text-black/50 dark:text-white/40">Sort: </span>
          {current.label}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50"
        >
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_60px_-15px_rgba(255,46,136,0.25)] p-1.5"
          >
            {options.map((opt) => {
              const selected = opt.id === value;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center justify-between gap-3 transition-colors ${
                      selected
                        ? "bg-[#FF4DA3]/10 text-[#FF4DA3]"
                        : "text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const PRODUCTS_PER_PAGE = 8;

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const gridRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let list =
      activeCategory === "All"
        ? [...products]
        : products.filter((p) => p.category === activeCategory);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return list;
  }, [activeCategory, query, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  );

  const scrollToGrid = () => {
    if (typeof window === "undefined") return;
    if (gridRef.current) {
      const y =
        gridRef.current.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const didMountRef = useRef(false);
  useEffect(() => {
    setPage(1);
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    scrollToGrid();
  }, [activeCategory, query, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const startIdx = (page - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(
    startIdx,
    startIdx + PRODUCTS_PER_PAGE
  );

  const goToPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    scrollToGrid();
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  }, [totalPages, page]);

  return (
    <main className="relative min-h-screen bg-white dark:bg-black transition-colors duration-500 overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute top-24 -left-40 h-[500px] w-[500px] rounded-full bg-[#FF4DA3]/10 blur-[160px]" />
      <div className="pointer-events-none absolute top-[40%] -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[160px]" />

      {/* Hero header */}
      <section className="relative pt-32 pb-12 px-6">
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#FF4DA3] text-xs tracking-[0.4em] uppercase"
          >
            ● The Full Collection
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-black dark:text-white text-5xl md:text-7xl font-[1000] mt-4 leading-[0.9] tracking-tighter uppercase"
          >
            All{" "}
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-[length:200%_auto] italic inline-block pr-3">
              Products
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-black/60 dark:text-white/50 max-w-xl mx-auto mt-6 text-sm md:text-base"
          >
            Every piece in the drop — filter, search, and find your next
            favorite.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold text-black/40 dark:text-white/30 mt-6"
          >
            <span className="h-px w-8 bg-black/20 dark:bg-white/20" />
            {products.length} Pieces Available
            <span className="h-px w-8 bg-black/20 dark:bg-white/20" />
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="relative z-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-black/[0.03] to-transparent dark:from-white/[0.04] dark:to-transparent border border-black/10 dark:border-white/10 backdrop-blur-sm"
          >
            {/* Row 1: search + sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-11 pl-11 pr-10 rounded-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white text-sm placeholder:text-black/40 dark:placeholder:text-white/30 focus:outline-none focus:border-[#FF4DA3]/50 focus:ring-2 focus:ring-[#FF4DA3]/20 transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-full bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition"
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
              </div>

              {/* Sort */}
              <SortDropdown
                value={sort}
                onChange={setSort}
                options={SORT_OPTIONS}
              />
            </div>

            {/* Row 2: categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count =
                  cat === "All"
                    ? products.length
                    : products.filter((p) => p.category === cat).length;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 text-xs tracking-widest uppercase rounded-full border transition flex items-center gap-2 ${
                      isActive
                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                        : "border-black/15 dark:border-white/15 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40"
                    }`}
                  >
                    {cat}
                    <span
                      className={`text-[10px] ${
                        isActive
                          ? "text-white/60 dark:text-black/60"
                          : "text-black/40 dark:text-white/40"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Results count */}
          <div className="flex items-center justify-between mt-6 mb-4 px-1">
            <p className="text-xs tracking-[0.2em] uppercase text-black/50 dark:text-white/40">
              Showing{" "}
              <span className="text-black dark:text-white font-bold">
                {filteredProducts.length === 0 ? 0 : startIdx + 1}–
                {Math.min(startIdx + PRODUCTS_PER_PAGE, filteredProducts.length)}
              </span>{" "}
              of {filteredProducts.length}
            </p>
            {(query || activeCategory !== "All" || sort !== "featured") && (
              <button
                onClick={() => {
                  setQuery("");
                  setActiveCategory("All");
                  setSort("featured");
                }}
                className="text-[11px] tracking-widest uppercase text-[#FF4DA3] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section ref={gridRef} className="relative z-10 px-6 pb-24 scroll-mt-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[300px]"
          >
            <AnimatePresence mode="popLayout">
              {visibleProducts.length > 0 ? (
                visibleProducts.map((p, i) => (
                  <motion.div
                    key={`${p.id}-${page}`}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(i * 0.05, 0.4),
                      ease: "easeOut",
                    }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-20 text-center flex flex-col items-center gap-4"
                >
                  <div className="h-16 w-16 rounded-full bg-[#FF4DA3]/10 border border-[#FF4DA3]/20 grid place-items-center">
                    <svg
                      width="24"
                      height="24"
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
                  <div>
                    <p className="text-black dark:text-white text-base font-semibold">
                      No products found
                    </p>
                    <p className="text-black/50 dark:text-white/40 text-sm mt-1">
                      Try a different search or reset the filters.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuery("");
                      setActiveCategory("All");
                      setSort("featured");
                    }}
                    className="mt-2 px-6 py-2.5 rounded-full bg-[#FF4DA3] text-black text-[11px] font-bold tracking-widest uppercase hover:shadow-[0_0_25px_-5px_#FF4DA3] transition"
                  >
                    Reset Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-14 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2">
                {/* Prev */}
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="h-10 w-10 grid place-items-center rounded-full border border-black/15 dark:border-white/15 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-black/15 dark:disabled:hover:border-white/15 transition"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                {/* Numbers */}
                {pageNumbers.map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`dots-${idx}`}
                      className="h-10 w-8 grid place-items-center text-black/40 dark:text-white/30 text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      aria-current={p === page ? "page" : undefined}
                      className={`relative h-10 min-w-10 px-3 rounded-full text-sm font-semibold transition ${
                        p === page
                          ? "bg-[#FF4DA3] text-black shadow-[0_8px_24px_-8px_#FF4DA3]"
                          : "border border-black/15 dark:border-white/15 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="h-10 w-10 grid place-items-center rounded-full border border-black/15 dark:border-white/15 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-black/15 dark:disabled:hover:border-white/15 transition"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <p className="text-[11px] tracking-[0.3em] uppercase text-black/40 dark:text-white/30">
                Page{" "}
                <span className="text-black dark:text-white font-bold">
                  {page}
                </span>{" "}
                of {totalPages}
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white dark:bg-black transition-colors duration-500" />
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
