"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QuickView from "./QuickView";
import Skeleton from "./Skeleton";
import Image from "next/image";
const FALLBACK_COLOR = {
  name: "Default",
  value: "#0a0a0a",
  images: ["/images/placeholder.jpg"],
};

export default function ProductCard({ product }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const colors =
    Array.isArray(product?.colors) && product.colors.length > 0
      ? product.colors
      : [FALLBACK_COLOR];
  const [activeColor, setActiveColor] = useState(colors[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgWrapRef = useRef(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const originalPrice =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price
      ? product.originalPrice
      : null;
  const hasDiscount = originalPrice !== null;
  const discount = hasDiscount
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  const stop = (e) => e.stopPropagation();
  const openQuickView = () => setIsOpen(true);
  const stopAndOpenQuickView = (e) => {
    stop(e);
    setIsOpen(true);
  };

  useEffect(() => {
    setIsLoaded(false);
    const el = imgWrapRef.current?.querySelector("img");
    if (el && el.complete && el.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [activeColor]);

  const goToProduct = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <>
      <motion.div
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          rotateX.set(-(y - rect.height / 2) / 35);
          rotateY.set((x - rect.width / 2) / 35);
        }}
        onMouseLeave={() => {
          rotateX.set(0);
          rotateY.set(0);
        }}
        whileHover={{ y: -10 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          rotateX: smoothX,
          rotateY: smoothY,
          transformStyle: "preserve-3d",
        }}
        className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-black/[0.04] to-black/[0.01] dark:from-white/[0.06] dark:to-white/[0.02] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:shadow-[0_20px_60px_-15px_rgba(255,46,136,0.25)] transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA3]"
      >
        {/* Image Section — clickable to open QuickView */}
        <div
          ref={imgWrapRef}
          onClick={openQuickView}
          role="button"
          tabIndex={0}
          className="relative aspect-[3/4] overflow-hidden bg-black/5 dark:bg-white/5 cursor-pointer"
        >
          {!isLoaded && (
            <Skeleton className="absolute inset-0 z-10 h-full w-full" />
          )}

          <Image
            src={activeColor.images?.[0] || FALLBACK_COLOR.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setIsLoaded(true)}
            className={`object-cover transition duration-700 ease-out group-hover:scale-110 group-hover:rotate-[0.5deg] ${isLoaded ? "opacity-100" : "opacity-0"}`}
            style={{
              transform: `translateZ(40px) scale(1.05)`,
            }}
          />

          {/* View Details pill on hover (top right) — navigates to full page */}
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              goToProduct();
            }}
            aria-label="View full details"
            className="hidden md:flex absolute top-3 right-3 z-[4] items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black backdrop-blur-md text-white text-[9px] font-bold tracking-widest uppercase shadow opacity-0 group-hover:opacity-100 transition"
          >
            Details
            <svg
              width="11"
              height="11"
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

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 z-[2]" />
          {/* Top badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-1.5 z-[3]">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#FF4DA3] text-black text-[9px] sm:text-[10px] font-bold tracking-widest uppercase shadow-lg">
              NEW
            </span>
            {discount > 0 && (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[9px] sm:text-[10px] font-bold tracking-widest">
                -{discount}%
              </span>
            )}
          </div>

          {/* Mobile: always-visible actions (Details + Quick Add) */}
          <div className="md:hidden absolute bottom-2 right-2 z-[3] flex items-center gap-2">
            <button
              onClick={(e) => {
                stop(e);
                goToProduct();
              }}
              aria-label="View full details"
              className="h-9 px-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md text-black text-[10px] font-bold tracking-widest uppercase shadow-lg active:scale-90 transition"
            >
              Details
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <motion.button
              type="button"
              onClick={stopAndOpenQuickView}
              whileTap={{ scale: 0.92 }}
              aria-label="Quick view — choose color and size"
              className="h-9 w-9 grid place-items-center rounded-full shadow-lg bg-[#FF4DA3] text-black"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </motion.button>
          </div>

          {/* Desktop: hover actions */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 z-[3]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={stopAndOpenQuickView}
                className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-full bg-white text-black hover:bg-white/90 transition"
              >
                Quick View
              </button>
              <motion.button
                type="button"
                onClick={stopAndOpenQuickView}
                whileTap={{ scale: 0.92 }}
                aria-label="Quick view — choose color and size"
                className="h-10 w-10 grid place-items-center rounded-full hover:scale-105 bg-[#FF4DA3] text-black"
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
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 sm:p-4">
          {/* Text area — clickable to open QuickView */}
          <div
            onClick={openQuickView}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
          >
            <p className="text-black/50 dark:text-white/40 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase">
              {product.category}
            </p>
            <h3 className="text-black dark:text-white text-sm sm:text-[15px] font-medium truncate mt-0.5 sm:mt-1 group-hover:text-[#FF4DA3] transition-colors duration-300">
              {product.name}
            </h3>

            {/* Price row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <motion.span
                whileHover={{ scale: 1.05 }} className="text-[#FF4DA3] text-sm sm:text-base font-bold">
                EGP {product.price}
              </motion.span>
              {hasDiscount && (
                <span className="text-black/40 dark:text-white/30 text-[11px] sm:text-xs line-through">
                  EGP {originalPrice}
                </span>
              )}
              {hasDiscount && (
                <span className="ml-auto text-[9px] sm:text-[10px] font-bold text-[#FF4DA3] bg-[#FF4DA3]/5 blur-3xl border border-[#FF4DA3]/20 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                  SAVE EGP {originalPrice - product.price}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/10 dark:bg-white/5 my-2.5 sm:my-3" />

          {/* Color swatches — NOT clickable to open; only changes color */}
          <div
            className="flex items-center justify-between gap-2 -mx-1 px-1 py-1"
            onClick={stop}
          >
            <div className="flex items-center gap-2 sm:gap-1.5">
              {colors.slice(0, 5).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  data-no-open
                  onMouseEnter={() => setActiveColor(c)}
                  onClick={(e) => {
                    stop(e);
                    setActiveColor(c);
                  }}
                  aria-label={c.name}
                  aria-pressed={activeColor.name === c.name}
                  className={`relative h-6 w-6 sm:h-4 sm:w-4 rounded-full border transition active:scale-95 ${activeColor.name === c.name
                    ? "border-black dark:border-white scale-110 ring-2 ring-black/20 dark:ring-white/20"
                    : "border-black/20 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50"
                    }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              {colors.length > 5 && (
                <span className="text-black/50 dark:text-white/40 text-[10px] ml-1">
                  +{colors.length - 5}
                </span>
              )}
            </div>

            <span className="text-black/50 dark:text-white/40 text-[9px] sm:text-[10px] tracking-widest uppercase truncate">
              {activeColor.name}
            </span>
          </div>
        </div>

      </motion.div>


      {isOpen && (
        <QuickView
          product={product}
          initialColor={activeColor}
          onClose={() => setIsOpen(false)}
        />
      )}

    </>
  );
}
