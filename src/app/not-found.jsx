"use client";

import Link from "next/link";
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
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="animate-404-glow-a absolute top-[-10%] left-[-10%] h-[600px] w-[600px] bg-[#FF4DA3] blur-[150px] rounded-full" />
        <div className="animate-404-glow-b absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] bg-[#FF4DA3] blur-[150px] rounded-full" />
      </div>

      <div className="absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.06] dark:opacity-10 pointer-events-none z-[1]" />

      <div className="hero-radial absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,77,163,0.15),transparent_60%)] z-[2] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl">
        <span
          className="animate-ui-fade-in-up text-[#FF4DA3] font-black text-[10px] uppercase bg-[#FF4DA3]/10 px-3 py-1 rounded-full border border-[#FF4DA3]/20"
          style={{ letterSpacing: "0.4em" }}
        >
          Error · Lost in the Void
        </span>

        <h1
          className="animate-ui-fade-in-up relative mt-8 text-black dark:text-white text-[88px] sm:text-[180px] md:text-[240px] font-[1000] leading-[0.85] tracking-tighter"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="relative inline-block">
            4
            <span
              className="animate-404-zero inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-[length:200%_auto] mx-1"
            >
              0
            </span>
            4
          </span>
        </h1>

        <h2
          className="animate-ui-fade-in-up mt-4 text-black dark:text-white text-2xl md:text-4xl font-bold uppercase tracking-tight"
          style={{ animationDelay: "0.3s" }}
        >
          This page doesn&apos;t exist
        </h2>

        <p
          className="animate-ui-fade-in-up text-black/60 dark:text-white/50 max-w-md mx-auto mt-6 text-sm md:text-base font-medium leading-relaxed"
          style={{ animationDelay: "0.5s" }}
        >
          Looks like the piece you&apos;re hunting got pulled from the rack.
          <br />
          Let&apos;s get you back to the good stuff.
        </p>

        <div
          className="animate-ui-fade-in-up mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          style={{ animationDelay: "0.7s" }}
        >
          <Link href="/" className="w-full sm:w-auto">
            <span className="group relative block w-full sm:w-auto px-12 py-4 bg-[#FF4DA3] text-white text-[11px] font-black uppercase tracking-[0.2em] overflow-hidden rounded-sm cursor-pointer shadow-[0_10px_30px_-10px_#FF4DA3] transition-transform hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Back to Home
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[#FF4DA3]/20 blur-xl transition duration-500" />
            </span>
          </Link>

          <Link href="/products" className="w-full sm:w-auto">
            <span className="block w-full sm:w-auto px-12 py-4 border border-black/20 dark:border-white/20 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 text-[11px] font-black uppercase tracking-[0.2em] rounded-sm cursor-pointer transition-all hover:scale-105 active:scale-95">
              Browse Products
            </span>
          </Link>

          <button
            type="button"
            onClick={handleGoBack}
            className="text-black/50 dark:text-white/40 hover:text-[#FF4DA3] text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 cursor-pointer"
          >
            [ Go Back ]
          </button>
        </div>

        <div
          className="animate-ui-fade-in-up mt-16 flex items-center gap-3 text-[9px] uppercase tracking-[0.4em] font-bold text-black/30 dark:text-white/20"
          style={{ animationDelay: "1s" }}
        >
          <span className="h-px w-10 bg-black/20 dark:bg-white/20" />
          ZØYA · Drop 01
          <span className="h-px w-10 bg-black/20 dark:bg-white/20" />
        </div>
      </div>
    </section>
  );
}
