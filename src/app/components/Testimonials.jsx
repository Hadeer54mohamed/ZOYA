"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
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
        text: "I love the minimal t-shirt design. It’s simple but has a luxury feel. Works perfectly with both jeans and skirts.",
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
    <section className="py-8 md:py-12 bg-[#fafafa] dark:bg-[#050505] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase font-bold mb-4">
            ● What ZOYA Lovers Say
          </motion.p>
          <h2 className="text-4xl md:text-6xl font-black text-black dark:text-white">
            Client Stories
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Navigation Buttons */}
          <button onClick={() => scroll("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white dark:bg-[#111] shadow-xl border border-black/10 dark:border-white/10 hidden md:flex hover:scale-110 transition-all">
            <ChevronLeft className="w-6 h-6 text-black dark:text-white" />
          </button>
          
          <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
            {items.map((t) => (
              <motion.div
                key={t.id}
                whileHover={{ y: -5 }}
                className="min-w-[300px] md:min-w-[400px] p-8 rounded-[2rem] bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col snap-start transition-all"
              >
                <Quote className="w-8 h-8 text-[#FF4DA3]/20 mb-6" />
                
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[#FF4DA3] text-[#FF4DA3]" />
                  ))}
                </div>

                <p className="text-black/70 dark:text-white/70 italic flex-1 leading-relaxed mb-8">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-black/10 dark:border-white/10">
                  {t.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#FF4DA3]/10 flex items-center justify-center text-[#FF4DA3] font-bold">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <p className="font-bold text-black dark:text-white uppercase tracking-wider text-sm">
                    {t.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <button onClick={() => scroll("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white dark:bg-[#111] shadow-xl border border-black/10 dark:border-white/10 hidden md:flex hover:scale-110 transition-all">
            <ChevronRight className="w-6 h-6 text-black dark:text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
