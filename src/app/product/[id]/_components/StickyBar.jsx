"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import Image from "next/image";

/**
 * Sticky Purchase Bar
 * Appears at the bottom of the screen when the user has scrolled past
 * the main product info block. Mirrors the add-to-cart CTA with a compact
 * summary + inline size picker.
 */
export default function StickyBar({
  show,
  product,
  selectedColor,
  selectedSize,
  setSelectedSize,
  quantity,
  activeImage,
  originalPrice,
  isAdding,
  isAdded,
  onAddToCart,
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="sticky-bar"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed bottom-0 left-0 right-0 z-[60] px-2 pb-2 sm:px-4 sm:pb-4"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
          }}
        >
          <div className="max-w-5xl mx-auto rounded-2xl bg-white/90 dark:bg-black/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Main row */}
            <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3">
              {/* Thumbnail */}
              <div className="relative h-11 w-11 sm:h-14 sm:w-14 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="hidden sm:block text-[9px] tracking-[0.3em] uppercase font-bold text-[#FF4DA3]">
                  {product.category}
                </p>
                <p className="text-[12px] sm:text-sm font-medium truncate text-black dark:text-white leading-tight">
                  {product.name}
                </p>
                <p className="text-[10px] sm:text-[11px] text-black/50 dark:text-white/40 mt-0.5 truncate">
                  <span className="sm:hidden">
                    <span className="font-bold text-black dark:text-white">
                      EGP {(product.price * quantity).toLocaleString()}
                    </span>
                    <span className="ml-1.5 opacity-70">
                      · {selectedColor.name}
                      {selectedSize ? ` · ${selectedSize}` : ""}
                    </span>
                  </span>
                  <span className="hidden sm:inline">
                    {selectedColor.name}
                    {selectedSize ? ` · Size ${selectedSize}` : ""}
                  </span>
                </p>
              </div>

              {/* Price (desktop) */}
              <div className="hidden md:flex flex-col items-end mr-2">
                <p className="text-base font-bold text-black dark:text-white leading-none">
                  EGP {(product.price * quantity).toLocaleString()}
                </p>
                <p className="text-[10px] text-black/40 dark:text-white/30 line-through mt-1">
                  EGP {(originalPrice * quantity).toLocaleString()}
                </p>
              </div>

              {/* Inline size picker (desktop only) */}
              {!selectedSize && (
                <div className="hidden sm:flex items-center gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className="h-10 min-w-10 px-2 rounded-lg border border-black/15 dark:border-white/15 text-[11px] font-bold hover:border-[#FF4DA3] hover:text-[#FF4DA3] transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={onAddToCart}
                disabled={!selectedSize || isAdded || isAdding}
                className={`flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 px-3.5 sm:px-6 rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-[11px] transition-all ${
                  !selectedSize
                    ? "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/30 cursor-not-allowed"
                    : isAdded
                    ? "bg-green-500 text-white"
                    : isAdding
                    ? "bg-[#FF4DA3]/80 text-black"
                    : "bg-[#FF4DA3] text-black shadow-[0_0_25px_rgba(255,77,163,0.5)] hover:shadow-[0_0_40px_rgba(255,77,163,0.8)] active:scale-95"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} strokeWidth={3} />
                    <span className="hidden sm:inline">Added</span>
                  </>
                ) : isAdding ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="hidden sm:inline">Adding</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span className="hidden sm:inline">Add to Bag</span>
                    <span className="sm:hidden">Add</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile size picker (second row) */}
            <AnimatePresence initial={false}>
              {!selectedSize && (
                <motion.div
                  key="mobile-sizes"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="sm:hidden border-t border-black/5 dark:border-white/5 overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-2 overflow-x-auto no-scrollbar">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#FF4DA3] font-bold flex-shrink-0 pr-1">
                      Size:
                    </span>
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className="h-9 min-w-9 px-2.5 rounded-lg border border-black/15 dark:border-white/15 text-[11px] font-bold flex-shrink-0 text-black/80 dark:text-white/80 hover:border-[#FF4DA3] hover:text-[#FF4DA3] active:scale-95 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
