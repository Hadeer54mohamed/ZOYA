"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ProductCard from "./ProductCard";

export default function ProductSection({ products = [], categories = ["All"] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <section
      id="products"
      className="relative bg-white dark:bg-black py-8 md:py-12 px-6 overflow-hidden transition-colors duration-500 scroll-mt-24"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-[#FF4DA3]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 -right-40 h-[400px] w-[400px] rounded-full bg-[#FF4DA3]/10 blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-6xl mx-auto"
      >
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase font-bold"
            >
              ● FEATURED
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-black dark:text-white text-4xl md:text-6xl font-black mt-3 leading-none"
            >
              Latest Drops
            </motion.h2>
            <p className="text-black/60 dark:text-white/50 text-sm mt-3 max-w-md">
              Handpicked pieces from our newest collection — limited stock,
              unlimited attitude.
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-xs tracking-widest uppercase rounded-full border transition flex items-center gap-2 ${
                    activeCategory === cat
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "border-black/15 dark:border-white/15 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40"
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

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[200px]"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-20 text-center"
              >
                <p className="text-black/40 dark:text-white/40 text-sm">
                  No products in this category yet.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* View all */}
        <div className="flex justify-center mt-14">
          <Link
            href="/products"
            className="group flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 dark:border-white/15 text-black/80 dark:text-white/80 text-sm hover:border-black/40 dark:hover:border-white/40 hover:text-black dark:hover:text-white transition"
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
              className="group-hover:translate-x-1 transition"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
