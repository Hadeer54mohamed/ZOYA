"use client";

import Link from "next/link";

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -100;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const scrollToProducts = () => scrollTo("products");

  const handleLookbookClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  return (
    <section
      id="home"
      className="relative h-screen w-full scroll-mt-28 overflow-hidden bg-[#fafafa] dark:bg-[#050505] transition-colors duration-500"
    >
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="hero-glow hero-glow-a absolute top-[-10%] left-[-10%] h-[min(600px,80vw)] w-[min(600px,80vw)] bg-[#FF4DA3] blur-[120px] md:blur-[150px] rounded-full" />
        <div className="hero-glow hero-glow-b absolute bottom-[-10%] right-[-10%] h-[min(600px,80vw)] w-[min(600px,80vw)] bg-[#FF4DA3] blur-[120px] md:blur-[150px] rounded-full" />
      </div>

      <div
        className="absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.06] dark:opacity-10 pointer-events-none z-[1]"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,77,163,0.15),transparent_60%)] z-[2] pointer-events-none hero-radial"
          aria-hidden
        />

        <div className="hero-enter">
          <span className="text-[#FF4DA3] font-black text-[10px] uppercase bg-[#FF4DA3]/10 px-3 py-1 rounded-full border border-[#FF4DA3]/20 opacity-90 tracking-[0.4em]">
            Drop 01 // SS&apos;26
          </span>

          <h1 className="text-black dark:text-white text-4xl sm:text-6xl md:text-[120px] font-[1000] mt-6 sm:mt-8 leading-[0.85] tracking-tighter uppercase">
            Wear Your <br />
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-[length:200%_auto] animate-gradient italic inline-block pr-6">
              Identity
            </span>
          </h1>

          <p className="text-black/70 dark:text-white/70 max-w-lg mx-auto mt-10 text-sm md:text-base font-medium leading-relaxed">
            More than just fabric. It&apos;s a statement. <br />
            Crafted for presence. Designed to stand out.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              type="button"
              onClick={scrollToProducts}
              className="group relative px-12 py-4 bg-[#FF4DA3] text-white text-[11px] font-black uppercase tracking-[0.2em] overflow-hidden rounded-sm cursor-pointer shadow-[0_10px_30px_-10px_#FF4DA3] hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="relative z-10">Shop Collection</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden />
            </button>

            <Link
              href="/products"
              scroll
              prefetch
              onClick={handleLookbookClick}
              className="text-black/70 dark:text-white/70 text-[11px] font-black uppercase tracking-[0.2em] transition-colors hover:text-[#FF4DA3] inline-block"
            >
              [ View Lookbook ]
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToProducts}
        aria-label="Scroll to products"
        className="hero-scroll-hint absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer group"
      >
        <span className="text-[9px] text-black/60 dark:text-white/60 uppercase tracking-[0.4em] font-bold group-hover:text-[#FF4DA3] transition-colors">
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-[#FF4DA3] to-transparent relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-black dark:bg-white hero-scroll-line" />
        </div>
      </button>
    </section>
  );
}
