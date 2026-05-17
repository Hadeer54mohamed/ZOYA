"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { colorImageList, colorPrimaryImage } from "../../../lib/colorImages";

const hexToRgb = (hex) => {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

export default function ProductGallery({
  product,
  selectedColor,
  selectedColorName,
  onColorChange,
  activeIndex,
  setActiveIndex,
  prevColorName,
  showColorLabel,
  imageRef,
}) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const slides = useMemo(
    () => colorImageList(selectedColor),
    [selectedColor],
  );
  const MotionImage = motion(Image);
  const safeIndex =
    slides.length > 0
      ? ((activeIndex % slides.length) + slides.length) % slides.length
      : 0;
  const activeImage = slides[safeIndex] ?? slides[0];

  const { r, g, b } = hexToRgb(selectedColor.value);
  const toneGradient = `radial-gradient(circle at 30% 20%, rgba(${r},${g},${b},0.22), transparent 55%), radial-gradient(circle at 80% 90%, rgba(${r},${g},${b},0.12), transparent 50%)`;

  const goNext = () =>
    setActiveIndex((i) => (i + 1) % slides.length);
  const goPrev = () =>
    setActiveIndex(
      (i) => (i - 1 + slides.length) % slides.length,
    );

  return (
    <div className="relative">
      <div className="lg:sticky lg:top-28">
        <div className="flex flex-col-reverse md:flex-row gap-4">
          {/* Color Thumbnails */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:w-20 md:shrink-0">
            {product.colors.map((color) => {
              const isActive = selectedColorName === color.name;
              return (
                <button
                  key={color.name}
                  onClick={() => onColorChange(color.name)}
                  aria-label={`Select ${color.name}`}
                  className={`group relative flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden transition-all duration-300 ${
                    isActive
                      ? "ring-2 ring-[#FF4DA3] scale-[1.03] shadow-[0_0_20px_rgba(255,77,163,0.4)]"
                      : "opacity-60 hover:opacity-100 ring-1 ring-black/10 dark:ring-white/10 hover:ring-black/30 dark:hover:ring-white/30"
                  }`}
                >
                  <Image
                    src={colorPrimaryImage(color)}
                    alt={color.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <div
                    className={`absolute inset-x-0 bottom-0 px-1.5 py-1 text-[8px] font-bold uppercase tracking-widest text-white bg-gradient-to-t from-black/80 to-transparent text-center transition ${
                      isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {color.name}
                  </div>
                  <span
                    className="absolute top-2 right-2 h-3 w-3 rounded-full border border-white/60 shadow"
                    style={{ backgroundColor: color.value }}
                  />
                </button>
              );
            })}
          </div>

          {/* Main gallery + per-color image strip */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Main Image */}
          <div
            ref={imageRef}
            className="group relative aspect-[3/4] max-h-[min(72svh,640px)] w-full flex-1 overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
          >
            {/* Identity tone wash */}
            <motion.div
              key={`tone-${selectedColor.value}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light"
              style={{ background: toneGradient }}
            />

            {/* Draggable image (mobile swipe + desktop drag) */}
            <motion.div
              className="absolute inset-0 z-[2] touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (slides.length <= 1) return;
                if (info.offset.x < -70 || info.velocity.x < -500) goNext();
                else if (info.offset.x > 70 || info.velocity.x > 500) goPrev();
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.08, filter: "blur(14px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  draggable={false}
                  className="absolute inset-0"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMouse({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                >
                  <MotionImage
                    src={activeImage}
                    alt={`${product.name} in ${selectedColor.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={safeIndex === 0}
                    className="object-cover select-none group-hover:scale-105 transition-transform duration-700"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Spotlight */}
            <motion.div
              className="pointer-events-none absolute inset-0 z-[3]"
              animate={{
                background: `radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px, rgba(255,77,163,0.12), transparent 60%)`,
              }}
              transition={{ type: "tween", ease: "linear", duration: 0.15 }}
            />

            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Product badge */}
            {product.badge && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[4] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#FF4DA3] text-black text-[9px] sm:text-[10px] font-bold tracking-widest uppercase shadow-lg">
                {product.badge}
              </div>
            )}

            {/* Color label */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[4] max-w-[45%] truncate px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-black/10 dark:border-white/10 text-black dark:text-white text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
              {selectedColor.name}
            </div>

            {/* Color transition label */}
            <AnimatePresence>
              {showColorLabel && prevColorName && (
                <motion.div
                  key="color-transition"
                  initial={{ opacity: 0, y: -8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="absolute top-16 right-4 z-[5] px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[9px] font-bold tracking-widest uppercase shadow-lg flex items-center gap-2"
                >
                  <span className="opacity-60">{prevColorName}</span>
                  <svg
                    width="10"
                    height="10"
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
                  <span className="text-[#FF4DA3]">{selectedColor.name}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arrows + counter (only if multi-image) */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Previous image"
                  className="absolute top-1/2 left-2 sm:left-4 z-[4] -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 grid place-items-center rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md border border-black/10 dark:border-white/10 text-black dark:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-95 sm:hover:scale-110 shadow-md"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next image"
                  className="absolute top-1/2 right-2 sm:right-4 z-[4] -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 grid place-items-center rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md border border-black/10 dark:border-white/10 text-black dark:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-95 sm:hover:scale-110 shadow-md"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-4 right-4 z-[4] px-3 py-1 rounded-full bg-black/50 dark:bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-widest">
                  {safeIndex + 1} / {slides.length}
                </div>
                <div className="md:hidden absolute bottom-4 left-4 z-[4] px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 text-[9px] tracking-widest uppercase">
                  ← swipe →
                </div>
              </>
            )}
          </div>

          {slides.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {slides.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === safeIndex ? "true" : undefined}
                  className={`relative shrink-0 h-20 w-16 sm:h-24 sm:w-[4.5rem] overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    i === safeIndex
                      ? "border-[#FF4DA3] ring-2 ring-[#FF4DA3]/30 scale-[1.02]"
                      : "border-black/10 dark:border-white/10 opacity-70 hover:opacity-100 hover:border-black/30 dark:hover:border-white/30"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
