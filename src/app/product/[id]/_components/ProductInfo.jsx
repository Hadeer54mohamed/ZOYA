"use client";

import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import AddToCartButton from "./AddToCartButton";

const SIZE_FIT = {
  S: "Slim fit",
  M: "Regular fit",
  L: "Oversized fit",
  XL: "Very oversized",
  XXL: "Extreme oversized",
};

const ProductInfo = forwardRef(function ProductInfo(
  {
    product,
    selectedColor,
    selectedColorName,
    onColorChange,
    originalPrice,
    saved,
    quantity,
    setQuantity,
    selectedSize,
    setSelectedSize,
    hoveredSize,
    setHoveredSize,
    isAdding,
    isAdded,
    onAddToCart,
  },
  ref
) {
  return (
    <div ref={ref} className="flex flex-col lg:pl-6 space-y-10">
      {/* Header */}
      <header>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block text-[#FF4DA3] tracking-[0.4em] text-[10px] font-bold uppercase"
        >
          ● {product.category}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-serif mt-3 tracking-tighter italic leading-[1]"
        >
          {product.name}
        </motion.h1>

        <div className="flex items-baseline gap-4 mt-5 flex-wrap">
          <p className="text-4xl font-extralight tracking-tight text-black dark:text-white/90">
            EGP {product.price.toLocaleString()}
          </p>
          <p className="text-lg text-black/30 dark:text-white/20 line-through">
            EGP {originalPrice.toLocaleString()}
          </p>
          <span className="text-[10px] font-bold text-[#FF4DA3] bg-[#FF4DA3]/10 border border-[#FF4DA3]/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
            Save {saved.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Description */}
      <p className="text-black/60 dark:text-white/50 text-sm leading-relaxed italic max-w-md">
        &ldquo;{product.description}&rdquo;
      </p>

      {/* Colors */}
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40">
          Color:{" "}
          <motion.span
            key={selectedColor.name}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-black dark:text-white font-bold inline-block"
          >
            {selectedColor.name}
          </motion.span>
        </p>
        <div className="flex gap-4 flex-wrap">
          {product.colors.map((color) => (
            <button
              key={color.name}
              onClick={() => onColorChange(color.name)}
              aria-label={color.name}
              className={`w-11 h-11 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                selectedColorName === color.name
                  ? "border-[#FF4DA3] scale-110"
                  : "border-transparent hover:border-black/20 dark:hover:border-white/30"
              }`}
            >
              <div
                className="w-7 h-7 rounded-full shadow-inner ring-1 ring-black/10 dark:ring-white/10"
                style={{ backgroundColor: color.value }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Quantity & Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40">
            Quantity
          </p>
          <div className="flex items-center w-fit border border-black/10 dark:border-white/10 rounded-full px-4 py-2 bg-black/[0.03] dark:bg-white/5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="hover:text-[#FF4DA3] transition"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="px-6 font-medium text-lg min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="hover:text-[#FF4DA3] transition"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/40 flex items-center justify-between gap-3">
            <span>
              Size{" "}
              <AnimatePresence mode="wait">
                {(hoveredSize || selectedSize) && (
                  <motion.span
                    key={hoveredSize || selectedSize}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.2 }}
                    className="normal-case tracking-normal ml-2 text-[#FF4DA3] font-bold"
                  >
                    · {SIZE_FIT[hoveredSize || selectedSize] || ""}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <button className="normal-case tracking-normal text-[10px] text-[#FF4DA3] hover:underline">
              Size guide
            </button>
          </p>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                onMouseEnter={() => setHoveredSize(s)}
                onMouseLeave={() => setHoveredSize(null)}
                className={`w-11 h-11 rounded-md border text-xs font-bold transition-all ${
                  selectedSize === s
                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                    : "border-black/10 dark:border-white/10 hover:border-black/40 dark:hover:border-white/40 text-black/70 dark:text-white/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add to Cart */}
      <AddToCartButton
        disabled={!selectedSize || isAdded || isAdding}
        isAdding={isAdding}
        isAdded={isAdded}
        onClick={onAddToCart}
        priceLabel={`EGP ${(product.price * quantity).toLocaleString()}`}
        hintText={!selectedSize ? "Choose your size to continue" : null}
      />

      {/* Perks */}
      <div className="pt-8 border-t border-black/10 dark:border-white/5">
        <div className="grid grid-cols-3 gap-4 text-[11px] tracking-tight text-black/60 dark:text-white/40 uppercase">
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
  );
});

export default ProductInfo;
