"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import Skeleton from "./Skeleton";

export default function QuickView({ product, onClose }) {
  const { addToCart, cartIconRef, setIsCartOpen } = useCart();

  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [flying, setFlying] = useState(false);
  const [rects, setRects] = useState(null);

  const modalImageRef = useRef(null);

  const originalPrice = Math.round(product.price * 1.25);
  const discount = Math.round(
    ((originalPrice - product.price) / originalPrice) * 100
  );
  const saved = (originalPrice - product.price) * qty;

  useEffect(() => {
    setImageLoaded(false);
  }, [selectedColor]);

  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAddToCart = () => {
    if (!modalImageRef.current || !cartIconRef?.current) {
      addToCart(product, selectedColor, selectedSize, qty);
      onClose();
      return;
    }

    const startRect = modalImageRef.current.getBoundingClientRect();
    const endRect = cartIconRef.current.getBoundingClientRect();

    setRects({ startRect, endRect });
    setFlying(true);

    setTimeout(() => {
      addToCart(product, selectedColor, selectedSize, qty);
    }, 450);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-white/80 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
      >
        {flying && rects && (
          <motion.img
            src={selectedColor.image}
            initial={{
              position: "fixed",
              top: rects.startRect.top,
              left: rects.startRect.left,
              width: rects.startRect.width,
              height: rects.startRect.height,
              borderRadius: 24,
              zIndex: 9999,
              objectFit: "cover",
            }}
            animate={{
              top: rects.endRect.top + rects.endRect.height / 2 - 20,
              left: rects.endRect.left + rects.endRect.width / 2 - 20,
              scale: 0.2,
              opacity: 0,
              rotate: 12,
            }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => {
              setFlying(false);
              onClose();
              setIsCartOpen(true);
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#0A0A0B] border border-black/10 dark:border-white/10 shadow-[0_0_100px_-20px_rgba(255,46,136,0.2)] grid md:grid-cols-2"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-30 h-10 w-10 grid place-items-center rounded-full bg-black/5 dark:bg-black/40 backdrop-blur-md border border-black/10 dark:border-white/10 text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white hover:rotate-90 transition-all duration-300"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Left: Media Section */}
          <div className="relative aspect-square md:aspect-auto md:h-full bg-neutral-100 dark:bg-[#121214] overflow-hidden group">
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 z-10 h-full w-full" />
            )}

            <motion.img
              ref={modalImageRef}
              key={selectedColor.image}
              src={selectedColor.image}
              onLoad={() => setImageLoaded(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
              <span className="px-4 py-1.5 rounded-full bg-[#FF4DA3] text-black text-[10px] font-black tracking-[0.2em] uppercase shadow-xl">
                NEW DROP
              </span>
              {discount > 0 && (
                <span className="px-4 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-black tracking-[0.2em] uppercase">
                  -{discount}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Right: Info Section */}
          <div className="p-8 md:p-12 flex flex-col overflow-y-auto">
            <div className="mb-auto">
              <p className="text-[#FF4DA3] text-[11px] tracking-[0.5em] font-bold uppercase mb-3 leading-none">
                {product.category}
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white tracking-tight mb-4">
                {product.name}
              </h2>

              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-bold text-black dark:text-white">
                  EGP {product.price}
                </span>
                {originalPrice > product.price && (
                  <div className="flex flex-col">
                    <span className="text-black/30 dark:text-white/20 text-lg line-through leading-none">
                      EGP ${originalPrice}
                    </span>
                    <span className="text-[#FF4DA3] text-[10px] font-bold mt-1 tracking-widest uppercase">
                      Save ${saved.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-black/60 dark:text-white/40 text-sm leading-relaxed max-w-md mb-8">
                Premium quality essential. Designed for a modern silhouette with
                sustainable materials.
              </p>

              {/* COLORS */}
              <div className="mb-8">
                <p className="text-[10px] text-black/50 dark:text-white/30 tracking-[0.2em] uppercase font-bold mb-4 text-center md:text-left">
                  Color:{" "}
                  <span className="text-black dark:text-white">
                    {selectedColor.name}
                  </span>
                </p>
                <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c)}
                      className={`h-10 w-10 rounded-full transition-all duration-300 ${
                        selectedColor.name === c.name
                          ? "ring-2 ring-[#FF4DA3] ring-offset-4 ring-offset-white dark:ring-offset-black scale-110"
                          : "ring-1 ring-black/10 dark:ring-white/10 hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              {/* SIZES */}
              <div className="mb-8">
                <p className="text-[10px] text-black/50 dark:text-white/30 tracking-[0.2em] uppercase font-bold mb-4 text-center md:text-left">
                  Select Size
                </p>
                <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`h-12 min-w-[3.5rem] px-4 rounded-2xl text-xs font-bold transition-all duration-300 ${
                        selectedSize === s
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-black/[0.04] dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/5 hover:border-black/30 dark:hover:border-white/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/5">
              <div className="flex gap-4">
                <div className="flex items-center rounded-2xl bg-black/[0.04] dark:bg-white/5 border border-black/10 dark:border-white/10 p-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-10 w-10 text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white transition"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-sm text-black dark:text-white">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="h-10 w-10 text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white transition"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={flying}
                  className="flex-1 h-12 rounded-2xl bg-[#FF4DA3] text-white text-xs font-black tracking-[0.1em] uppercase hover:shadow-[0_0_30px_-5px_#FF4DA3] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                >
                  {flying
                    ? "Processing..."
                    : `Add To Bag • EGP ${(product.price * qty).toFixed(2)}`}
                </button>
              </div>

              <div className="flex items-center justify-between mt-6 px-2 text-[9px] text-black/40 dark:text-white/20 font-bold uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>{" "}
                  Secure Payment
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 17h14M5 17a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9v12M5 17a2 2 0 0 0 2 2h2M14 5h4l3 4v6a2 2 0 0 1-2 2h-2" />
                  </svg>{" "}
                  Express Delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4.928 8-10a8 8 0 0 0-16 0c0 5.072 8 10 8 10z" />
                    <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  </svg>{" "}
                  Return Policy
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
