"use client";

import { ArrowUpRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { navigateToSection } from "../lib/navScroll";

export default function LegalPage({ title, tagline, updatedAt, sections }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white dark:bg-black text-black dark:text-white transition-colors duration-500 pt-24 sm:pt-32 pb-24">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#FF4DA3]/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[140px]" />

      <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.04] dark:opacity-[0.07]" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6">
        <div className="pb-10 border-b border-black/10 dark:border-white/10 animate-ui-fade-in-up">
          <p className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase font-bold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF4DA3]" />
            Legal
          </p>
          <h1 className="mt-4 text-[2.75rem] sm:text-6xl md:text-7xl font-[1000] uppercase leading-[0.9] tracking-tighter">
            {title}
          </h1>
          {tagline && (
            <p className="mt-5 text-sm sm:text-base text-black/60 dark:text-white/50 max-w-xl leading-relaxed">
              {tagline}
            </p>
          )}
          {updatedAt && (
            <p className="mt-6 text-[10px] tracking-[0.3em] uppercase font-bold text-black/40 dark:text-white/40">
              Last updated · {updatedAt}
            </p>
          )}
        </div>

        <div className="mt-12 space-y-10">
          {sections.map((s, i) => (
            <section
              key={s.title}
              id={s.anchor || undefined}
              className="group fade-in-view"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-baseline gap-3">
                <span className="text-[#FF4DA3] text-[10px] font-black tracking-[0.3em]">
                  0{i + 1}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {s.title}
                </h2>
              </div>
              <div className="mt-4 pl-0 sm:pl-7 space-y-3 text-[14px] sm:text-[15px] leading-relaxed text-black/70 dark:text-white/60">
                {s.content.map((c, idx) =>
                  Array.isArray(c) ? (
                    <ul
                      key={idx}
                      className="space-y-2 list-none pl-0 marker:text-[#FF4DA3]"
                    >
                      {c.map((item, j) => (
                        <li
                          key={j}
                          className="flex gap-3 before:content-['▸'] before:text-[#FF4DA3] before:text-xs before:mt-1"
                        >
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={idx}>{c}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-10 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 fade-in-view">
          <p className="text-sm text-black/60 dark:text-white/50 max-w-sm">
            Got questions or need clarification? Our team is just a message away.
          </p>
          <button
            type="button"
            onClick={() => navigateToSection("contact", pathname, router)}
            className="group inline-flex cursor-pointer items-center gap-2 px-5 py-3 rounded-full bg-[#FF4DA3] text-white text-[10px] font-black tracking-[0.25em] uppercase hover:shadow-[0_10px_30px_-8px_#FF4DA3] active:scale-95 transition-all"
          >
            Contact Us
            <ArrowUpRight
              size={14}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </main>
  );
}