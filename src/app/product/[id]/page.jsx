"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";
import { getProductById, getRelatedProducts } from "../../data/products";

import ProductGallery from "./_components/ProductGallery";
import ProductInfo from "./_components/ProductInfo";
import StickyBar from "./_components/StickyBar";
import Toast from "./_components/Toast";

export default function ProductPage() {
  const { id } = useParams();

  const product = useMemo(() => getProductById(id), [id]);
  const related = useMemo(
    () => (product ? getRelatedProducts(id, 4) : []),
    [id, product]
  );

  // Selection state
  const [selectedColorName, setSelectedColorName] = useState(
    product?.colors?.[0]?.name || ""
  );
  const [prevColorName, setPrevColorName] = useState(null);
  const [showColorLabel, setShowColorLabel] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [hoveredSize, setHoveredSize] = useState(null);

  // Add-to-cart flow state
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [toast, setToast] = useState(null);
  const [fly, setFly] = useState(null);

  // UI state
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [hoveredRelated, setHoveredRelated] = useState(null);
  const [hoverCapable, setHoverCapable] = useState(false);

  const imageRef = useRef(null);
  const infoRef = useRef(null);

  const { addToCart, cartIconRef, isCartOpen } = useCart();

  // Detect hover-capable device (avoid sticky dim effect on mobile taps)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverCapable(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Scroll to top when switching products
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [id]);

  // Reset selection on product change
  useEffect(() => {
    if (product) {
      setSelectedColorName(product.colors[0].name);
      setPrevColorName(null);
      setActiveIndex(0);
      setSelectedSize(null);
      setQuantity(1);
    }
  }, [id, product]);

  // Reset gallery index on color change
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedColorName]);

  // Show sticky bar when user scrolls past the main CTA block
  useEffect(() => {
    const onScroll = () => {
      if (!infoRef.current) return;
      const rect = infoRef.current.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [product]);

  // ---------- Not Found ----------
  if (!product) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-500">
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[#FF4DA3] tracking-[0.4em] text-[10px] font-bold uppercase mb-4">
            ● 404
          </p>
          <h1 className="text-4xl md:text-5xl font-serif italic mb-4">
            Product not found
          </h1>
          <p className="text-black/60 dark:text-white/50 max-w-md mb-8">
            This product may have been removed or the link is incorrect.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF4DA3] text-black font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(255,77,163,0.5)] transition"
          >
            <ArrowLeft size={14} /> Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const selectedColor =
    product.colors.find((c) => c.name === selectedColorName) ||
    product.colors[0];
  const activeImage = selectedColor.images[activeIndex];
  const originalPrice = Math.round(product.price * 1.25);
  const saved = originalPrice - product.price;

  // Color change → show transition label briefly
  const handleColorChange = (name) => {
    if (name === selectedColorName) return;
    setPrevColorName(selectedColorName);
    setSelectedColorName(name);
    setShowColorLabel(true);
    setTimeout(() => setShowColorLabel(false), 1600);
  };

  // Premium add-to-cart: loading → fly → add → success → toast
  const handleAddToCart = () => {
    if (!selectedSize || isAdding || isAdded) return;
    setIsAdding(true);

    if (imageRef.current && cartIconRef?.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const cartRect = cartIconRef.current.getBoundingClientRect();
      const size = 72;
      setFly({
        image: activeImage,
        startX: imgRect.left + imgRect.width / 2 - size / 2,
        startY: imgRect.top + imgRect.height / 2 - size / 2,
        endX: cartRect.left + cartRect.width / 2 - size / 2,
        endY: cartRect.top + cartRect.height / 2 - size / 2,
        size,
      });
    }

    setTimeout(() => {
      const colorForCart = {
        name: selectedColor.name,
        value: selectedColor.value,
        image: selectedColor.images[0],
      };
      addToCart(
        { id: product.id, name: product.name, price: product.price },
        colorForCart,
        selectedSize,
        quantity
      );
      setFly(null);
      setIsAdded(true);
      setToast({
        name: product.name,
        image: activeImage,
        color: selectedColor.name,
        size: selectedSize,
      });
      setTimeout(() => setToast(null), 2800);
      setTimeout(() => {
        setIsAdded(false);
        setIsAdding(false);
      }, 1600);
    }, 850);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-500">
      <Navbar />

      {/* Floating fly-to-cart image */}
      <AnimatePresence>
        {fly && (
          <motion.div
            key="fly"
            initial={{
              x: fly.startX,
              y: fly.startY,
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              x: fly.endX,
              y: fly.endY,
              opacity: [1, 1, 0.5],
              scale: [1, 0.75, 0.18],
              rotate: 25,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed top-0 left-0 z-[80]"
            style={{ width: fly.size, height: fly.size }}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(255,77,163,0.6)] ring-2 ring-[#FF4DA3]/60">
              <Image
                src={fly.image}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation toast */}
      <Toast
        toast={toast}
        onDismiss={() => setToast(null)}
        shifted={showStickyBar}
      />

      <section className="px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-black/50 dark:text-white/40 hover:text-[#FF4DA3] transition"
          >
            <ArrowLeft size={14} />
            Back to Shop
          </Link>
          <nav className="text-[11px] tracking-[0.25em] uppercase text-black/40 dark:text-white/30">
            <Link href="/" className="hover:text-[#FF4DA3]">
              Shop
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="hover:text-[#FF4DA3]">{product.category}</span>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-black/70 dark:text-white/60">
              {product.name}
            </span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <ProductGallery
            product={product}
            selectedColor={selectedColor}
            selectedColorName={selectedColorName}
            onColorChange={handleColorChange}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            prevColorName={prevColorName}
            showColorLabel={showColorLabel}
            imageRef={imageRef}
          />

          <ProductInfo
            ref={infoRef}
            product={product}
            selectedColor={selectedColor}
            selectedColorName={selectedColorName}
            onColorChange={handleColorChange}
            originalPrice={originalPrice}
            saved={saved}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            hoveredSize={hoveredSize}
            setHoveredSize={setHoveredSize}
            isAdding={isAdding}
            isAdded={isAdded}
            onAddToCart={handleAddToCart}
          />
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="relative px-6 pb-40 sm:pb-28 pt-8 bg-white dark:bg-black overflow-hidden transition-colors duration-500">
          <div className="pointer-events-none absolute top-20 -right-40 h-[400px] w-[400px] rounded-full bg-[#FF4DA3]/5 blur-[140px]" />
          <div className="relative max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-6 mb-10">
              <div>
                <p className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase font-bold">
                  ● You may also like
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mt-2">
                  Complete the look
                </h2>
              </div>
              <Link
                href="/"
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/15 dark:border-white/15 text-xs tracking-widest uppercase hover:border-[#FF4DA3] hover:text-[#FF4DA3] transition"
              >
                View all
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
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              onMouseLeave={
                hoverCapable ? () => setHoveredRelated(null) : undefined
              }
            >
              {related.map((p, i) => {
                const isDimmed =
                  hoverCapable &&
                  hoveredRelated !== null &&
                  hoveredRelated !== p.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    onMouseEnter={
                      hoverCapable ? () => setHoveredRelated(p.id) : undefined
                    }
                    animate={{
                      opacity: isDimmed ? 0.45 : 1,
                      filter: isDimmed ? "blur(2px)" : "blur(0px)",
                      scale: isDimmed ? 0.98 : 1,
                    }}
                    className="transition-[filter,opacity,transform] duration-300"
                  >
                    <ProductCard product={p} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* STICKY PURCHASE BAR */}
      <StickyBar
        show={showStickyBar && !isCartOpen}
        product={product}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        quantity={quantity}
        activeImage={activeImage}
        originalPrice={originalPrice}
        isAdding={isAdding}
        isAdded={isAdded}
        onAddToCart={handleAddToCart}
      />
    </main>
  );
}
