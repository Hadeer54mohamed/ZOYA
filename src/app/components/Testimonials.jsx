"use client";

import { useRef } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const FALLBACK_TESTIMONIALS = [
  {
    id: "t1",
    name: "Sara A.",
    text: "The oversized tee fits perfectly. The fabric feels premium and the stitching is super clean. It looks way more expensive than it actually is.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Omar H.",
    text: "The cargo pants are insane 🔥 perfect fit and very comfortable. The quality is solid and the streetwear vibe is exactly what I was looking for.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Mariam K.",
    text: "I love the minimal t-shirt design. It's simple but has a luxury feel. Works perfectly with both jeans and skirts.",
    rating: 5,
  },
  {
    id: "t4",
    name: "Youssef E.",
    text: "The denim pants fit like they were custom made. The cut and length are perfect, and the material feels durable and premium.",
    rating: 5,
  },
];

export default function Testimonials({ testimonials }) {
  const scrollRef = useRef(null);

  const items =
    Array.isArray(testimonials) && testimonials.length > 0
      ? testimonials
      : FALLBACK_TESTIMONIALS;

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-[#fafafa] py-8 transition-colors duration-500 md:py-12 dark:bg-[#050505]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="fade-in-view mb-16 text-center">
          <p className="mb-4 text-[10px] font-bold tracking-[0.4em] text-[#FF4DA3] uppercase">
            ● What ZOYA Lovers Say
          </p>
          <h2 className="text-4xl font-black text-black md:text-6xl dark:text-white">
            Client Stories
          </h2>
        </div>

        <div className="group relative">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute top-1/2 -left-4 z-20 hidden -translate-y-1/2 rounded-full border border-black/10 bg-white p-3 shadow-xl transition-all hover:scale-110 md:flex dark:border-white/10 dark:bg-[#111]"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="h-6 w-6 text-black dark:text-white" />
          </button>

          <div
            ref={scrollRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8"
          >
            {items.map((t) => (
              <article
                key={t.id}
                className="flex min-w-[300px] snap-start flex-col rounded-[2rem] border border-black/10 bg-white p-8 transition-transform hover:-translate-y-1 md:min-w-[400px] dark:border-white/10 dark:bg-white/[0.03]"
              >
                <Quote className="mb-6 h-8 w-8 text-[#FF4DA3]/20" />

                <div className="mb-6 flex gap-1">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-[#FF4DA3] text-[#FF4DA3]"
                    />
                  ))}
                </div>

                <p className="mb-8 flex-1 leading-relaxed text-black/70 italic dark:text-white/70">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="mt-auto flex items-center gap-4 border-t border-black/10 pt-6 dark:border-white/10">
                  {t.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.avatar}
                      alt={t.name}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4DA3]/10 font-bold text-[#FF4DA3]">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <p className="text-sm font-bold tracking-wider text-black uppercase dark:text-white">
                    {t.name}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute top-1/2 -right-4 z-20 hidden -translate-y-1/2 rounded-full border border-black/10 bg-white p-3 shadow-xl transition-all hover:scale-110 md:flex dark:border-white/10 dark:bg-[#111]"
            aria-label="Next testimonials"
          >
            <ChevronRight className="h-6 w-6 text-black dark:text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
