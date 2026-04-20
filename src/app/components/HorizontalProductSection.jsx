"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import QuickView from "./QuickView";
import { products } from "../data/products";
import Image from "next/image";

export default function HorizontalProductSection() {
  const router = useRouter();
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const draggedRef = useRef(false);

  const [constraint, setConstraint] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const x = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current || !trackRef.current) return;
      const containerW = containerRef.current.offsetWidth;
      const trackW = trackRef.current.scrollWidth;
      const diff = Math.max(0, trackW - containerW);
      setConstraint(diff);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const unsub = x.on("change", (v) => {
      setCanScrollLeft(v < -4);
      setCanScrollRight(v > -constraint + 4);
    });
    return unsub;
  }, [x, constraint]);

  const scrollBy = (dir) => {
    const step = 320;
    const current = x.get();
    const next = Math.min(0, Math.max(-constraint, current + dir * -step));
    animate(x, next, {
      type: "spring",
      stiffness: 140,
      damping: 20,
    });
  };

  const progress = useTransform(
    x,
    [0, -Math.max(constraint, 1)],
    ["12%", "100%"]
  );

  const handleCardClick = (product) => {
    if (draggedRef.current) return;
    setSelectedProduct(product);
  };

  const handleGoToProduct = (e, product) => {
    e.stopPropagation();
    if (draggedRef.current) return;
    router.push(`/product/${product.id}`);
  };

  return (
    <section className="relative py-24 bg-white dark:bg-black overflow-hidden transition-colors duration-500">
      {/* Background accents */}
      <div className="pointer-events-none absolute top-10 right-0 h-[300px] w-[300px] rounded-full bg-[#FF4DA3]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[120px]" />

      {/* Header */}
      <div className="relative max-w-6xl mx-auto px-6 mb-10 flex items-end justify-between gap-6">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase"
          >
            ● Selected Pieces
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-black dark:text-white text-3xl md:text-5xl font-bold mt-2"
          >
            Wear the Moment
          </motion.h2>
        </div>

        {/* Nav arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label="Previous"
            className="h-11 w-11 grid place-items-center rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label="Next"
            className="h-11 w-11 grid place-items-center rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Drag Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-black to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-black to-transparent z-10" />

        <motion.div
          ref={trackRef}
          drag="x"
          style={{ x }}
          dragConstraints={{ left: -constraint, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
          onDragStart={() => {
            draggedRef.current = true;
          }}
          onDragEnd={() => {
            setTimeout(() => {
              draggedRef.current = false;
            }, 50);
          }}
          className="flex gap-5 md:gap-6 px-6 select-none"
        >
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.6 }}
              whileHover={{ y: -6 }}
              onClick={() => handleCardClick(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedProduct(p);
                }
              }}
              className="shrink-0 w-[260px] sm:w-[300px] md:w-[340px] group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA3] rounded-2xl"
            >
              <div className="relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <Image
                  width={100}
                  height={100}
                  src={p.colors[0].images[0]}
                  alt={p.name}
                  draggable={false}
                  className="w-full h-[380px] md:h-[420px] object-cover pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Pink glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-t from-[#FF4DA3]/20 to-transparent" />

                {/* Top badge */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-black text-[9px] font-bold tracking-widest uppercase shadow">
                  #{String(i + 1).padStart(2, "0")}
                </span>

                {/* Details pill — always visible on mobile, hover-only on desktop */}
                <button
                  type="button"
                  onClick={(e) => handleGoToProduct(e, p)}
                  aria-label="View full details"
                  className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black backdrop-blur-md text-white text-[9px] font-bold tracking-widest uppercase shadow opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                >
                  Details
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>

                {/* Info */}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white flex items-end justify-between">
                  <div>
                    <p className="text-white/60 text-[9px] tracking-[0.3em] uppercase">
                      {p.category}
                    </p>
                    <h3 className="text-lg font-semibold leading-tight mt-1">
                      {p.name}
                    </h3>
                    <p className="text-white/70 text-sm mt-0.5">
                      EGP {p.price}
                    </p>
                  </div>
                  <button
                    aria-label="View full details"
                    onClick={(e) => handleGoToProduct(e, p)}
                    className="h-10 w-10 grid place-items-center rounded-full bg-[#FF4DA3] text-black md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-105"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="max-w-6xl mx-auto px-6 mt-8 flex items-center gap-4">
        <div className="flex-1 h-[2px] bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            style={{ width: progress }}
            className="h-full bg-[#FF4DA3] rounded-full"
          />
        </div>
        <span className="text-[10px] text-black/40 dark:text-white/40 tracking-[0.3em] uppercase font-bold shrink-0">
          Drag / Swipe
        </span>
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
