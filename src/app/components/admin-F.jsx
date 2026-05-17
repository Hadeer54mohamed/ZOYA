"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUp, Heart } from "lucide-react";

export default function AdminFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden bg-white dark:bg-black text-black dark:text-white transition-colors duration-500 border-t border-black/5 dark:border-white/5">
      
      {/* Noise texture */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.03] dark:opacity-[0.05]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand - No color filter */}
          <div className="shrink-0">
            <Image
              src="/images/LOGO2.webp"
              alt="ZØYA"
              width={100}
              height={32}
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
            <span>© {new Date().getFullYear()} ZØYA</span>
            <span className="hidden md:inline opacity-20">/</span>
            <Link href="/privacy" className="hover:text-[#FF4DA3] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#FF4DA3] transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-[#FF4DA3] transition-colors">Cookies</Link>
          </div>

          {/* Credit & Top */}
          <div className="flex items-center gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF4DA3] opacity-70 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4DA3]" />
              </span>
              <span className="text-[9px] tracking-[0.2em] normal-case flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-black/60 dark:text-white/60 leading-snug">
                <span className="uppercase">Designed &amp; Developed by</span>
                <a
                  href="https://wa.me/201062801851"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black dark:text-white font-bold hover:text-[#FF4DA3] transition-colors whitespace-nowrap inline-flex items-center gap-1"
                >
                  Hadeer ElBoghdady
                  <Heart
                    size={10}
                    className="fill-[#FF4DA3] text-[#FF4DA3] animate-pulse"
                  />
                </a>
              </span>
            </div>
            </div>

            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="group flex items-center justify-center h-8 w-8 rounded-full border border-black/10 dark:border-white/10 hover:border-[#FF4DA3]/40 transition-colors"
            >
              <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform text-black/60 dark:text-white/60 group-hover:text-[#FF4DA3]" />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}