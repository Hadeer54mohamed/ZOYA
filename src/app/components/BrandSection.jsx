"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const images = [
  "/images/photo (6).jpeg",
  "/images/photo (5).jpeg",
  "/images/photo (4).jpeg",
];

export default function BrandSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="about" className="relative py-20 md:py-28 bg-white dark:bg-black overflow-hidden transition-colors duration-500">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[#FF4DA3]/10 blur-[160px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* TEXT SIDE */}
        <div>
          <span className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase font-bold">
            ●  Branding
          </span>

          <h2 className="text-black dark:text-white text-4xl md:text-6xl font-black mt-4 leading-tight">
            Fashion is not about fitting in —
            <span className="text-[#FF4DA3]"> it&apos;s about presence.</span>
          </h2>

          <p className="text-black/60 dark:text-white/50 mt-6 text-sm leading-relaxed max-w-md">
            <span className="text-[#FF4DA3]"> ZOYA </span> is built for
            expression, not approval. Every piece is designed to reflect
            identity, attitude, and movement.
          </p>
        </div>

        {/* CAROUSEL SIDE */}
        <div className="relative">
          {/* Images */}
          <div className="relative w-full h-[500px] overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(255,77,163,0.25)]">
            {images.map((img, i) => (
              <motion.img
                key={i}
                src={img}
                alt=""
                className="absolute w-full h-full object-cover"
                animate={{
                  opacity: i === index ? 1 : 0,
                  scale: i === index ? 1 : 1.1,
                }}
                transition={{ duration: 0.8 }}
              />
            ))}

            {/* overlay */}
            <div className="absolute inset-0 bg-black/20 dark:bg-black/30" />
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-6 bg-[#FF4DA3]"
                    : "w-2 bg-black/20 dark:bg-white/30 hover:bg-black/40 dark:hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
