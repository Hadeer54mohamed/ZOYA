"use client";

import { NextStudio } from "next-sanity/studio";
import Link from "next/link";
import Image from "next/image";
import config from "../../../../sanity.config";
import PasswordGate from "../../components/PasswordGate";
import AdminFooter from "../../components/AdminFooter";
import ThemeToggle from "../../components/ThemeToggle";

export default function StudioPage() {
  return (
    <PasswordGate
      label="Sanity Studio"
      subtitle="Content Management"
      scope="studio"
    >
      <div className="studio-route-shell flex h-dvh max-h-dvh flex-col overflow-hidden bg-white dark:bg-black">
        <header className="shrink-0 z-30 w-full border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/70 backdrop-blur-md transition-colors duration-500">
          <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.03] dark:opacity-[0.05]" />

          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
            {/* Left: brand */}
            <div className="flex items-center gap-5">
              <Link
                href="/"
                aria-label="Back to home"
                className="shrink-0 transition-opacity hover:opacity-70 active:scale-95"
              >
                <Image
                  src="/images/LOGO2.webp"
                  alt="ZØYA"
                  width={90}
                  height={28}
                  priority
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </Link>

              <div className="hidden sm:block h-6 w-[1px] bg-black/10 dark:bg-white/10" />

              <div className="hidden sm:block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-black/40 dark:text-white/40 font-medium">
                  Studio <span className="mx-1 text-[#FF4DA3]/40">/</span> Content
                </span>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 w-full">
          <NextStudio config={config} />
        </div>

        <div className="shrink-0">
          <AdminFooter />
        </div>
      </div>
    </PasswordGate>
  );
}
