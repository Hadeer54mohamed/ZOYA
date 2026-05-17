"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import Skeleton from "./Skeleton";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ReturnPolicyNotice from "./ReturnPolicyNotice";
import { colorImageList, colorPrimaryImage } from "../lib/colorImages";

export default function QuickView({
  product,
  onClose,
  initialColor = null,
  initialImageIndex = 0,
}) {
  const { addToCart, cartIconRef, setIsCartOpen } = useCart();

  const defaultColor =
    initialColor ??
    (Array.isArray(product?.colors) && product.colors.length > 0
      ? product.colors[0]
      : {
          name: "Default",
          value: "#0a0a0a",
          images: ["/images/placeholder.webp"],
        });

  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const slides = colorImageList(selectedColor);
  const [imageIndex, setImageIndex] = useState(() =>
    Math.min(
      Math.max(0, Math.floor(initialImageIndex) || 0),
      Math.max(0, colorImageList(defaultColor).length - 1),
    ),
  );
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [flying, setFlying] = useState(false);
  const [rects, setRects] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [hoveredSize, setHoveredSize] = useState(null);

  const SIZE_FIT = {
    S: "Slim fit",
    M: "Regular fit",
    L: "Oversized fit",
    XL: "Very oversized",
    XXL: "Extreme oversized",
  };

  const sizeGuideText = (() => {
    const size = hoveredSize || selectedSize;
    if (!size) return "";
    if (Array.isArray(product?.sizeGuide)) {
      const entry = product.sizeGuide.find((item) => item?.size === size);
      if (entry?.description) {
        return entry.description;
      }
    }
    return SIZE_FIT[size] || "";
  })();

  const modalImageRef = useRef(null);

  const displayIdx =
    slides.length > 0
      ? Math.min(Math.max(0, imageIndex), slides.length - 1)
      : 0;
  const currentSlideSrc = slides[displayIdx] ?? slides[0];

  // Mount flag for SSR-safe portal rendering
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const originalPrice =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price
      ? product.originalPrice
      : null;
  const hasDiscount = originalPrice !== null;
  const discount = hasDiscount
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;
  const saved = hasDiscount ? (originalPrice - product.price) * qty : 0;
  const sizesList = Array.isArray(product?.sizes) ? product.sizes : [];

  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Build cart-ready color with `image` (singular) key for cart UI
  const colorForCart = {
    name: selectedColor.name,
    value: selectedColor.value,
    image: colorPrimaryImage(selectedColor),
  };

  const handleAddToCart = () => {
    if (!selectedSize || flying) return;

    if (!modalImageRef.current || !cartIconRef?.current) {
      addToCart(product, colorForCart, selectedSize, qty);
      onClose();
      return;
    }

    const startRect = modalImageRef.current.getBoundingClientRect();
    const endRect = cartIconRef.current.getBoundingClientRect();

    setRects({ startRect, endRect });
    setFlying(true);

    setTimeout(() => {
      addToCart(product, colorForCart, selectedSize, qty);
    }, 450);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(false)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onKeyDown={(e) => e.key === "Escape" && setFullscreenImage(false)}
          >
            <button
              onClick={() => setFullscreenImage(false)}
              className="absolute top-3 right-3 z-30 h-9 w-9 grid place-items-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-full max-w-4xl max-h-screen flex items-center justify-center p-4"
            >
              <Image
                src={currentSlideSrc}
                alt={`${product.name} — ${selectedColor.name}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Modal */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] bg-white/80 dark:bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center sm:p-4 md:p-6"
        >
          {flying && rects && (
            <motion.div
              initial={{
                top: rects.startRect.top,
                left: rects.startRect.left,
                width: rects.startRect.width,
                height: rects.startRect.height,
                opacity: 1,
                rotate: 0,
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
              style={{
                position: "fixed",
                zIndex: 9999,
                borderRadius: 24,
                overflow: "hidden",
              }}
              onAnimationComplete={() => {
                setFlying(false);
                onClose();
                setIsCartOpen(true);
              }}
            >
              <Image
                src={currentSlideSrc}
                alt={`${product.name} — ${selectedColor.name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[92vh] sm:h-auto sm:max-h-[95vh] overflow-hidden rounded-t-[1.75rem] sm:rounded-[2.5rem] bg-white dark:bg-[#0A0A0B] border border-black/10 dark:border-white/10 shadow-[0_0_100px_-20px_rgba(255,46,136,0.2)] grid grid-rows-[auto_1fr] md:grid-rows-1 md:grid-cols-2"
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden absolute top-0 inset-x-0 z-30 flex justify-center pt-2 pointer-events-none">
              <div className="h-1 w-10 rounded-full bg-black/20 dark:bg-white/20" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 sm:top-6 sm:right-6 z-30 h-9 w-9 sm:h-10 sm:w-10 grid place-items-center rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-black/10 dark:border-white/10 text-black/70 dark:text-white/60 hover:text-black dark:hover:text-white hover:rotate-90 transition-all duration-300 shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Left: Media — mobile: tall hero + thumbnails overlay; sm+: square + strip below */}
            <div className="relative isolate w-full max-sm:min-h-[min(54vh,92vw)] sm:aspect-square md:aspect-auto md:h-full bg-neutral-100 dark:bg-[#121214] overflow-hidden group flex flex-col sm:flex-col">
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 z-10 h-full w-full" />
              )}

              <div className="relative flex-1 min-h-0 w-full overflow-hidden">
                <motion.div
                  ref={modalImageRef}
                  key={currentSlideSrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 sm:cursor-pointer"
                  onClick={() => {
                    if (window.innerWidth < 640) {
                      setFullscreenImage(true);
                    }
                  }}
                >
                  <Image
                    src={currentSlideSrc}
                    alt={`${product.name} — ${selectedColor.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                    onLoad={() => setImageLoaded(true)}
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </motion.div>

                {slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex(
                          (i) => (i - 1 + slides.length) % slides.length,
                        );
                      }}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 z-20 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-black/70"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex((i) => (i + 1) % slides.length);
                      }}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 z-20 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-black/70"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div
                      className={`absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white backdrop-blur-sm bottom-20 sm:bottom-2`}
                    >
                      {displayIdx + 1} / {slides.length}
                    </div>
                  </>
                )}
              </div>

              {slides.length > 1 && (
                <div className="z-20 flex gap-1.5 overflow-x-auto px-2 py-2 sm:px-3 sm:py-2.5 border-t border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] shrink-0 max-sm:absolute max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:border-t-0 max-sm:bg-gradient-to-t max-sm:from-black/75 max-sm:via-black/40 max-sm:to-transparent max-sm:pb-3 max-sm:pt-8">
                  {slides.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex(i);
                      }}
                      aria-label={`Image ${i + 1}`}
                      className={`relative h-11 w-9 sm:h-14 sm:w-11 shrink-0 overflow-hidden rounded-md sm:rounded-lg ring-2 transition ${
                        i === displayIdx
                          ? "ring-[#FF4DA3] opacity-100"
                          : "ring-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex flex-col gap-1.5 sm:gap-2 pointer-events-none">
                <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#FF4DA3] text-white text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase shadow-xl">
                  NEW DROP
                </span>
                {discount > 0 && (
                  <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase">
                    -{discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Right: Info Section - scrollable, with sticky actions on mobile */}
            <div className="relative flex flex-col overflow-hidden min-h-0">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 sm:p-8 md:p-12">
                <p className="text-[#FF4DA3] text-[10px] sm:text-[11px] tracking-[0.4em] sm:tracking-[0.5em] font-bold uppercase mb-2 sm:mb-3 leading-none">
                  {product.category}
                </p>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black dark:text-white tracking-tight mb-3 sm:mb-4 leading-tight pr-10">
                  {product.name}
                </h2>

                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8 flex-wrap">
                  <span className="text-2xl sm:text-4xl font-bold text-black dark:text-white">
                    EGP {product.price}
                  </span>
                  {hasDiscount && (
                    <div className="flex flex-col">
                      <span className="text-black/30 dark:text-white/20 text-sm sm:text-lg line-through leading-none">
                        EGP {originalPrice}
                      </span>
                      <span className="text-[#FF4DA3] text-[9px] sm:text-[10px] font-bold mt-1 tracking-widest uppercase">
                        Save EGP {saved.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-black/60 dark:text-white/40 text-[13px] sm:text-sm leading-relaxed max-w-md mb-6 sm:mb-8">
                  {product.description ||
                    "Premium quality essential. Designed for a modern silhouette with sustainable materials."}
                </p>

                {/* COLORS */}
                <div className="mb-6 sm:mb-8">
                  <p className="text-[10px] text-black/50 dark:text-white/30 tracking-[0.2em] uppercase font-bold mb-3 sm:mb-4">
                    Color:{" "}
                    <span className="text-black dark:text-white">
                      {selectedColor.name}
                    </span>
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {(product.colors ?? []).map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          setSelectedColor(c);
                          setImageIndex(0);
                          setImageLoaded(false);
                        }}
                        aria-label={c.name}
                        className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all duration-300 ${
                          selectedColor.name === c.name
                            ? "ring-2 ring-[#FF4DA3] ring-offset-[3px] sm:ring-offset-4 ring-offset-white dark:ring-offset-black scale-110"
                            : "ring-1 ring-black/10 dark:ring-white/10 hover:scale-110"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                {/* SIZES */}
                <div className="mb-2 sm:mb-8">
                  <p className="text-[10px] text-black/50 dark:text-white/30 tracking-[0.2em] uppercase font-bold mb-3 sm:mb-4 flex items-center justify-between gap-3">
                    <span>
                      Select Size{" "}
                      <AnimatePresence mode="wait">
                        {sizeGuideText && (
                          <motion.span
                            key={hoveredSize || selectedSize}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.2 }}
                            className="normal-case tracking-normal ml-2 text-[#FF4DA3] font-bold"
                          >
                            · {sizeGuideText}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <button className="normal-case tracking-normal text-[10px] text-[#FF4DA3] hover:underline">
                      Size guide
                    </button>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {sizesList.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        onMouseEnter={() => setHoveredSize(s)}
                        onMouseLeave={() => setHoveredSize(null)}
                        className={`h-11 sm:h-12 min-w-[3rem] sm:min-w-[3.5rem] px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-300 ${
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

                {/* Perks - moved into scrollable area (desktop shows at bottom of info, mobile shows above sticky actions) */}
                <div className="pt-8 border-t border-black/10 dark:border-white/5">
                  <div className="hidden sm:grid grid-cols-3 gap-4 text-[11px] tracking-tight text-black/60 dark:text-white/40 uppercase">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Truck size={18} className="text-[#FF4DA3]" />
                      <span>Express Delivery</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <ShieldCheck size={18} className="text-[#FF4DA3]" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <RotateCcw size={18} className="text-[#FF4DA3]" />
                      <span>Easy Returns</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ReturnPolicyNotice />
                  </div>
                </div>
              </div>

              {/* Actions - sticky at bottom on all sizes */}
              <div className="flex-shrink-0 px-5 py-3 sm:px-8 md:px-12 sm:py-6 border-t border-black/10 dark:border-white/5 bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="flex items-center rounded-xl sm:rounded-2xl bg-black/[0.04] dark:bg-white/5 border border-black/10 dark:border-white/10 p-0.5 sm:p-1 flex-shrink-0">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      aria-label="Decrease quantity"
                      className="h-9 w-9 sm:h-10 sm:w-10 text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white transition text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="w-6 sm:w-8 text-center font-mono font-bold text-sm text-black dark:text-white">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      aria-label="Increase quantity"
                      className="h-9 w-9 sm:h-10 sm:w-10 text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white transition text-lg leading-none"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={flying || !selectedSize || sizesList.length === 0}
                    className="flex-1 min-w-0 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF4DA3] text-white text-[11px] sm:text-xs font-black tracking-[0.08em] sm:tracking-[0.1em] uppercase hover:shadow-[0_0_30px_-5px_#FF4DA3] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 px-2 truncate"
                  >
                    {flying
                      ? "Processing..."
                      : sizesList.length === 0
                        ? "Not available"
                        : !selectedSize
                          ? "Choose your size"
                          : `Add To Bag • EGP ${(product.price * qty).toFixed(0)}`}
                  </button>
                </div>

                <Link
                  href={`/product/${product.id}`}
                  onClick={onClose}
                  className="mt-2.5 sm:mt-4 flex items-center justify-center gap-2 w-full py-2 sm:py-3 text-[10px] font-bold tracking-[0.25em] uppercase text-black/60 dark:text-white/50 hover:text-[#FF4DA3] transition"
                >
                  View Full Details
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>

                {/* Mobile: same perks row as desktop, once — below actions */}
                <div className="sm:hidden grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-black/10 dark:border-white/5 text-[11px] tracking-tight text-black/60 dark:text-white/40 uppercase">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Truck size={18} className="text-[#FF4DA3]" />
                    <span>Express Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <ShieldCheck size={18} className="text-[#FF4DA3]" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <RotateCcw size={18} className="text-[#FF4DA3]" />
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>,
    document.body,
  );
}
