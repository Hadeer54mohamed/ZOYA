"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -100; 
    const y =
      el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };
  const scrollToProducts = () => scrollTo("products");
  const handleLookbookClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden bg-[#fafafa] dark:bg-[#050505] transition-colors duration-500">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] bg-[#FF4DA3] blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] bg-[#FF4DA3] blur-[150px] rounded-full"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.06] dark:opacity-10 pointer-events-none z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
        <motion.div
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,77,163,0.15),transparent_60%)] z-[2] pointer-events-none"
        />

        <motion.div
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            initial={{ letterSpacing: "0.5em" }}
            animate={{ letterSpacing: "0.4em" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[#FF4DA3] font-black text-[10px] uppercase bg-[#FF4DA3]/10 px-3 py-1 rounded-full border border-[#FF4DA3]/20 opacity-90"
          >
            Drop 01 // SS&apos;26
          </motion.span>

          <motion.h1 className="text-black dark:text-white text-6xl md:text-[120px] font-[1000] mt-8 leading-[0.85] tracking-tighter uppercase">
            Wear Your <br />
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-[length:200%_auto] animate-gradient italic inline-block pr-6">
              Identity
            </span>
          </motion.h1>

          <motion.p className="text-black/60 dark:text-white/50 max-w-lg mx-auto mt-10 text-sm md:text-base font-medium leading-relaxed">
            More than just fabric. It&apos;s a statement. <br />
            Crafted for presence. Designed to stand out.
          </motion.p>

          <motion.div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button
              onClick={scrollToProducts}
              whileHover={{ scale: 1.05 }}
           
              className="group relative px-12 py-4 bg-[#FF4DA3] text-white text-[11px] font-black uppercase tracking-[0.2em] overflow-hidden rounded-sm cursor-pointer shadow-[0_10px_30px_-10px_#FF4DA3]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Shop Collection
              </span>

              {/* shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              {/* glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[#FF4DA3]/20 blur-xl transition duration-500" />
            </motion.button>

            <Link
              href="/products"
              scroll
              prefetch
              onClick={handleLookbookClick}
              className="inline-block"
            >
              <motion.span
                whileHover={{ scale: 1.05, color: "#FF4DA3" }}
                className="text-black/50 dark:text-white/40 text-[11px] font-black uppercase tracking-[0.2em] transition-colors cursor-pointer inline-block"
              >
                [ View Lookbook ]
              </motion.span>
            </Link>

          </motion.div>
        </motion.div>
      </div>

      {/* Animated Scroll Hint */}
      <motion.button
        onClick={scrollToProducts}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        aria-label="Scroll to products"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer group"
      >
        <span className="text-[9px] text-black/30 dark:text-white/20 uppercase tracking-[0.4em] font-bold group-hover:text-[#FF4DA3] transition-colors">
          Scroll
        </span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#FF4DA3] to-transparent relative overflow-hidden">
          <motion.div
            animate={{ y: [0, 48] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-black dark:bg-white"
          />
        </div>
      </motion.button>

      {/* CSS Animation for Gradient Text */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-gradient {
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </section>
  );
}
