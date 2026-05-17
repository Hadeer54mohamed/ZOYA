"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 4;

export default function ProductSection({ products = [], categories = ["All"] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(0);

  const filteredProducts = useMemo(
    () =>
      activeCategory === "All"
        ? products
        : products.filter((p) => p.category === activeCategory),
    [products, activeCategory],
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const visibleProducts = filteredProducts.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const canGoPrev = safePage > 0;
  const canGoNext = safePage < totalPages - 1;
  const showPager = filteredProducts.length > PAGE_SIZE;

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <section
      id="products"
      className="relative scroll-mt-24 overflow-hidden bg-white px-4 sm:px-6 py-8 transition-colors duration-500 md:py-12 dark:bg-black"
    >
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-[#FF4DA3]/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-[#FF4DA3]/10 blur-[140px]" />

      <div className="fade-in-view relative mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.4em] text-[#FF4DA3] uppercase">
              ● FEATURED
            </p>
            <h2 className="mt-3 text-4xl leading-none font-black text-black md:text-6xl dark:text-white">
              Latest Drops
            </h2>
            <p className="mt-3 max-w-md text-sm text-black/60 dark:text-white/50">
              Handpicked pieces from our newest collection — limited stock,
              unlimited attitude.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs tracking-widest uppercase transition ${
                    activeCategory === cat
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-black/15 text-black/60 hover:border-black/40 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
                  }`}
                >
                  {cat}
                  <span
                    className={`text-[10px] ${
                      activeCategory === cat
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
        </div>

        <div className="grid min-h-[200px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.length > 0 ? (
            visibleProducts.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                lite
                priorityImage={safePage === 0 && i < PAGE_SIZE}
              />
            ))
          ) : (
            <p className="col-span-full py-20 text-center text-sm text-black/40 dark:text-white/40">
              No products in this category yet.
            </p>
          )}
        </div>

        {showPager && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                aria-label="Previous products"
                className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-black/5 text-black/70 transition-all hover:border-black/20 hover:bg-black/10 hover:text-black disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="min-w-[4.5rem] text-center text-[10px] font-bold tracking-[0.25em] text-black/50 uppercase tabular-nums dark:text-white/50">
                {safePage + 1} / {totalPages}
              </span>

              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                aria-label="Next products"
                className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-black/5 text-black/70 transition-all hover:border-black/20 hover:bg-black/10 hover:text-black disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  aria-current={i === safePage ? "true" : undefined}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === safePage
                      ? "w-6 bg-[#FF4DA3]"
                      : "w-1.5 bg-black/20 hover:bg-black/40 dark:bg-white/20 dark:hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 flex justify-center">
          <Link
            href="/products"
            className="group flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm text-black/80 transition hover:border-black/40 hover:text-black dark:border-white/15 dark:text-white/80 dark:hover:border-white/40 dark:hover:text-white"
          >
            View All Products
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition group-hover:translate-x-1"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
