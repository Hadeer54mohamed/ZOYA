"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#fafafa] dark:bg-[#050505] transition-colors duration-500 flex items-center justify-center px-6 pt-24 pb-16">
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

      {/* Radial glow */}
      <motion.div
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,77,163,0.15),transparent_60%)] z-[2] pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl">
        <motion.span
          initial={{ letterSpacing: "0.5em", opacity: 0 }}
          animate={{ letterSpacing: "0.4em", opacity: 0.9 }}
          transition={{ duration: 0.8 }}
          className="text-[#FF4DA3] font-black text-[10px] uppercase bg-[#FF4DA3]/10 px-3 py-1 rounded-full border border-[#FF4DA3]/20"
        >
          Error · Lost in the Void
        </motion.span>

        {/* 404 giant */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-8 text-black dark:text-white text-[120px] sm:text-[180px] md:text-[240px] font-[1000] leading-[0.85] tracking-tighter"
        >
          <span className="relative inline-block">
            4
            <motion.span
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-[length:200%_auto] mx-1"
              style={{ animation: "gradient 3s linear infinite" }}
            >
              0
            </motion.span>
            4
          </span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-4 text-black dark:text-white text-2xl md:text-4xl font-bold uppercase tracking-tight"
        >
          This page doesn&apos;t exist
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-black/60 dark:text-white/50 max-w-md mx-auto mt-6 text-sm md:text-base font-medium leading-relaxed"
        >
          Looks like the piece you&apos;re hunting got pulled from the rack.
          <br />
          Let&apos;s get you back to the good stuff.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <Link href="/" className="w-full sm:w-auto">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative block w-full sm:w-auto px-12 py-4 bg-[#FF4DA3] text-white text-[11px] font-black uppercase tracking-[0.2em] overflow-hidden rounded-sm cursor-pointer shadow-[0_10px_30px_-10px_#FF4DA3]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Back to Home
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[#FF4DA3]/20 blur-xl transition duration-500" />
            </motion.span>
          </Link>

          <Link href="/products" className="w-full sm:w-auto">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="block w-full sm:w-auto px-12 py-4 border border-black/20 dark:border-white/20 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 text-[11px] font-black uppercase tracking-[0.2em] rounded-sm cursor-pointer transition-colors"
            >
              Browse Products
            </motion.span>
          </Link>

          <motion.button
            type="button"
            onClick={handleGoBack}
            whileHover={{ scale: 1.05, color: "#FF4DA3" }}
            className="text-black/50 dark:text-white/40 text-[11px] font-black uppercase tracking-[0.2em] transition-colors cursor-pointer"
          >
            [ Go Back ]
          </motion.button>
        </motion.div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 flex items-center gap-3 text-[9px] uppercase tracking-[0.4em] font-bold text-black/30 dark:text-white/20"
        >
          <span className="h-px w-10 bg-black/20 dark:bg-white/20" />
          ZØYA · Drop 01
          <span className="h-px w-10 bg-black/20 dark:bg-white/20" />
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </section>
  );
}
