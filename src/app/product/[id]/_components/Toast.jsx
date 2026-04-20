"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import Image from "next/image";

/**
 * Mini confirmation toast shown after an item is added to the bag.
 * `shifted` lifts the toast up to avoid overlapping the sticky bar.
 */
export default function Toast({ toast, onDismiss, shifted = false }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className={`fixed left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-sm transition-[bottom] duration-300 ${
            shifted ? "bottom-[5.5rem] sm:bottom-24" : "bottom-6"
          }`}
        >
          <div className="flex items-center gap-3 p-3 pr-4 rounded-2xl bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(255,77,163,0.5)]">
            <div className="relative h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
              <Image
                src={toast.image}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] tracking-[0.3em] uppercase font-bold text-[#FF4DA3] flex items-center gap-1.5">
                <Check size={10} /> Added to bag
              </p>
              <p className="text-sm font-medium text-black dark:text-white truncate mt-0.5">
                {toast.name}
              </p>
              <p className="text-[10px] text-black/50 dark:text-white/40 mt-0.5 tracking-wide">
                {toast.color} · Size {toast.size}
              </p>
            </div>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="h-7 w-7 grid place-items-center rounded-full text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
