"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import QuickView from "./QuickView";
import Skeleton from "./Skeleton";
import Image from "next/image";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColor, setActiveColor] = useState(product.colors[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToCart, cartIconRef } = useCart();
  const cardImageRef = useRef(null);

  const originalPrice = Math.round(product.price * 1.25);
  const discount = Math.round(
    ((originalPrice - product.price) / originalPrice) * 100
  );

  const stop = (e) => e.stopPropagation();

  useEffect(() => {
    setIsLoaded(false);
  }, [activeColor]);

  const handleQuickAdd = (e) => {
    stop(e);
    const defaultSize = product.sizes[0];
    addToCart(product, activeColor, defaultSize, 1);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-black/[0.04] to-black/[0.01] dark:from-white/[0.06] dark:to-white/[0.02] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:shadow-[0_20px_60px_-15px_rgba(255,46,136,0.25)] transition-all duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA3]"
      >
        {/* Image Section */}
        <div className="relative aspect-[3/4] overflow-hidden bg-black/5 dark:bg-white/5">
          {!isLoaded && (
            <Skeleton className="absolute inset-0 z-10 h-full w-full" />
          )}

          <Image
            src={activeColor.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setIsLoaded(true)}
            className={`object-cover group-hover:scale-110 transition duration-700 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 dark:from-black/80 via-black/10 to-transparent opacity-90 z-[2]" />

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

          {/* Mobile: always-visible add button */}
          <button
            onClick={handleQuickAdd}
            aria-label="Quick add"
            className="md:hidden absolute bottom-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-[#FF4DA3] text-black shadow-lg z-[3] active:scale-90 transition"
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
          </button>

          {/* Desktop: hover actions */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 z-[3]">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  stop(e);
                  setIsOpen(true);
                }}
                className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-full bg-white text-black hover:bg-white/90 transition"
              >
                Quick View
              </button>
              <button
                onClick={handleQuickAdd}
                aria-label="Add to cart"
                className="h-10 w-10 grid place-items-center rounded-full bg-[#FF4DA3] text-black hover:scale-105 transition"
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
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 sm:p-4">
          {!isLoaded ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-24 mt-2" />
            </div>
          ) : (
            <>
              <p className="text-black/50 dark:text-white/40 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase">
                {product.category}
              </p>
              <h3 className="text-black dark:text-white text-sm sm:text-[15px] font-medium truncate mt-0.5 sm:mt-1">
                {product.name}
              </h3>

              {/* Price row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[#FF4DA3] text-sm sm:text-base font-bold">
                  EGP ${product.price}
                </span>
                {originalPrice > product.price && (
                  <span className="text-black/40 dark:text-white/30 text-[11px] sm:text-xs line-through">
                    EGP ${originalPrice}
                  </span>
                )}
                {originalPrice > product.price && (
                  <span className="ml-auto text-[9px] sm:text-[10px] font-bold text-[#FF4DA3] bg-[#FF4DA3]/10 border border-[#FF4DA3]/20 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                    SAVE EGP {originalPrice - product.price}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-black/10 dark:bg-white/5 my-2.5 sm:my-3" />

          {/* Color swatches */}
          <div
            className="flex items-center justify-between gap-2"
            onClick={stop}
          >
            <div className="flex items-center gap-1.5">
              {product.colors.slice(0, 5).map((c) => (
                <button
                  key={c.name}
                  onMouseEnter={() => setActiveColor(c)}
                  onClick={(e) => {
                    stop(e);
                    setActiveColor(c);
                  }}
                  aria-label={c.name}
                  className={`relative h-5 w-5 sm:h-4 sm:w-4 rounded-full border transition ${
                    activeColor.name === c.name
                      ? "border-black dark:border-white scale-110 ring-2 ring-black/20 dark:ring-white/20"
                      : "border-black/20 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-black/50 dark:text-white/40 text-[10px] ml-1">
                  +{product.colors.length - 5}
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
        <QuickView product={product} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
