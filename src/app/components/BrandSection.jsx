"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const images = [
  "/images/Team.webp",
  "/images/Team1.webp",
  "/images/Team3.webp",
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
    <section className="relative overflow-hidden bg-white py-16 px-4 sm:px-0 transition-colors duration-500 md:py-28 dark:bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4DA3]/10 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 sm:gap-16 px-4 sm:px-6 md:grid-cols-2">
        <div>
          <span className="text-[10px] font-bold tracking-[0.4em] text-[#FF4DA3] uppercase">
            ● Branding
          </span>

          <h2 className="mt-4 text-3xl sm:text-4xl leading-tight font-black text-black md:text-6xl dark:text-white">
            Fashion is not about fitting in —
            <span className="text-[#FF4DA3]"> it&apos;s about presence.</span>
          </h2>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-black/60 dark:text-white/60">
            <span className="text-[#FF4DA3]"> ZOYA </span> is built for expression,
            not approval. Every piece is designed to reflect identity, attitude,
            and movement.
          </p>
        </div>

        <div className="relative">
          <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-black/10 shadow-[0_20px_60px_-15px_rgba(255,77,163,0.25)] dark:border-white/10">
            {images.map((img, i) => (
              <div
                key={img}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  i === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              >
                <Image
                  src={img}
                  alt={`ZOYA brand — lookbook image ${i + 1} of ${images.length}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-6 bg-[#FF4DA3]"
                    : "w-2 bg-black/20 hover:bg-black/40 dark:bg-white/30 dark:hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
