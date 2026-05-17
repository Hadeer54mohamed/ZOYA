"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ShoppingBag } from "lucide-react";

/**
 * Premium Add-to-Cart button with 3 states:
 *  - default  → pink, shows price label
 *  - isAdding → loading spinner
 *  - isAdded  → green success morph
 *
 * Optional `hintText` renders a small helper line underneath
 * (e.g. "Choose your size to continue").
 */
export default function AddToCartButton({
  disabled,
  isAdding,
  isAdded,
  onClick,
  priceLabel,
  hintText,
}) {
  const isDisabledIdle = disabled && !isAdding && !isAdded;

  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`group relative w-full py-4 sm:py-5 rounded-full font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-xs sm:text-sm overflow-hidden transition-all duration-500 ${
          isDisabledIdle
            ? "bg-black/5 dark:bg-white/5 text-black/30 dark:text-white/20 cursor-not-allowed"
            : isAdded
            ? "bg-green-500 text-white shadow-[0_0_40px_rgba(34,197,94,0.5)]"
            : isAdding
            ? "bg-[#FF4DA3]/80 text-black"
            : "bg-[#FF4DA3] text-black shadow-[0_0_40px_rgba(255,77,163,0.4)] hover:shadow-[0_0_60px_rgba(255,77,163,0.7)] active:scale-[0.98]"
        }`}
      >
        <AnimatePresence mode="wait">
          {isAdded ? (
            <motion.div
              key="success"
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="flex items-center justify-center gap-2"
            >
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 400 }}
              >
                <Check size={18} strokeWidth={3} />
              </motion.span>
              Added to Bag
            </motion.div>
          ) : isAdding ? (
            <motion.div
              key="loading"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Loader2 size={18} className="animate-spin" />
              Adding…
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              <span className="truncate">
                Add to Bag • {priceLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shine sweep */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute -left-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:left-full transition-all duration-700" />
        </div>
      </button>

      {hintText && (
        <p className="text-center text-[10px] mt-3 text-[#FF4DA3]/70 animate-pulse tracking-widest uppercase">
          {hintText}
        </p>
      )}
    </div>
  );
}
