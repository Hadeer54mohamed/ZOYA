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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <section
      id="home"
      className="relative flex h-[100svh] h-[100dvh] w-full scroll-mt-28 flex-col overflow-hidden bg-[#fafafa] dark:bg-[#050505] transition-colors duration-500"
    >
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="hero-glow hero-glow-a absolute top-[-10%] left-[-10%] h-[min(600px,80vw)] w-[min(600px,80vw)] rounded-full bg-[#FF4DA3] blur-[72px] md:blur-[150px]" />
        <div className="hero-glow hero-glow-b absolute bottom-[-10%] right-[-10%] h-[min(600px,80vw)] w-[min(600px,80vw)] rounded-full bg-[#FF4DA3] blur-[72px] md:blur-[150px]" />
      </div>

      <div
        className="absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.06] dark:opacity-10 pointer-events-none z-[1]"
        aria-hidden
      />

      <div className="relative z-10 box-border flex min-h-0 flex-1 flex-col px-6 pb-4 pt-[calc(6.5rem+5vh)] text-center sm:pt-[calc(7rem+5.5vh)] md:pt-[calc(7.5rem+4vh)]">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,77,163,0.15),transparent_60%)] z-[2] pointer-events-none hero-radial"
          aria-hidden
        />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="hero-enter mx-auto w-full max-w-4xl overflow-visible">
            <span className="inline-block text-[#FF4DA3] font-black text-[10px] uppercase bg-[#FF4DA3]/10 px-3 py-1 rounded-full border border-[#FF4DA3]/20 opacity-90 tracking-[0.4em]">
              Drop 01 // SS&apos;26
            </span>

            <h1 className="mt-6 overflow-visible text-4xl font-[1000] uppercase leading-[0.95] tracking-tighter text-black sm:mt-8 sm:text-6xl sm:leading-[0.92] md:text-[120px] md:leading-[0.9] dark:text-white">
              Wear Your <br />
              <span className="relative inline-block overflow-visible px-1 pb-2 italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-[length:200%_auto] md:animate-gradient">
                Identity
              </span>
            </h1>

            <p className="mx-auto mt-10 max-w-lg text-sm font-medium leading-relaxed text-black/70 md:text-base dark:text-white/70">
              More than just fabric. It&apos;s a statement. <br />
              Crafted for presence. Designed to stand out.
            </p>

            <div className="mt-12 mb-6 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <button
                type="button"
                onClick={scrollToProducts}
                className="group relative cursor-pointer overflow-hidden rounded-sm bg-[#FF4DA3] px-12 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_-10px_#FF4DA3] transition-transform hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">Shop Collection</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
              </button>

              <Link
                href="/products"
                scroll
                prefetch
                onClick={handleLookbookClick}
                className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-black/70 transition-colors hover:text-[#FF4DA3] dark:text-white/70"
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
          className="hero-scroll-hint mx-auto mb-4 flex shrink-0 flex-col items-center gap-3 cursor-pointer group sm:mb-6"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-black/60 transition-colors group-hover:text-[#FF4DA3] dark:text-white/60">
            Scroll
          </span>
          <div className="relative h-12 w-px overflow-hidden bg-gradient-to-b from-[#FF4DA3] to-transparent">
            <div className="absolute top-0 left-0 h-1/2 w-full bg-black dark:bg-white hero-scroll-line" />
          </div>
        </button>
      </div>
    </section>
  );
}
