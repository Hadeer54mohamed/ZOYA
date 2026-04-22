"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Mail, ArrowUp, Check, Heart } from "lucide-react";

// Brand icons inline (lucide drops brand marks in newer versions)
const Instagram = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);

const Twitter = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Facebook = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
  </svg>
);

const Youtube = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
  </svg>
);

const shopLinks = [
  { label: "All Products", href: "#products" },
  { label: "T-Shirts", href: "#" },
  { label: "Sweatpants", href: "#" },
  { label: "New Drops", href: "#" },
];

const aboutLinks = [
  { label: "Our Story", href: "#" },
  { label: "Lookbook", href: "#" },
  { label: "Sustainability", href: "#" },
  { label: "Careers", href: "#" },
];

const helpLinks = [
  { label: "Shipping", href: "#" },
  { label: "Returns", href: "#" },
  { label: "Size Guide", href: "#" },
  { label: "Contact", href: "#" },
];

const socials = [
  { label: "Instagram", Icon: Instagram, href: "#" },
  { label: "Twitter", Icon: Twitter, href: "#" },
  { label: "Facebook", Icon: Facebook, href: "#" },
  { label: "Youtube", Icon: Youtube, href: "#" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden bg-white dark:bg-black text-black dark:text-white transition-colors duration-500 border-t border-black/5 dark:border-white/5">
      {/* Ambient pink glow (top) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[#FF4DA3]/15 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[120px]" />

      {/* Noise texture */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.04] dark:opacity-[0.07]" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 pt-16 sm:pt-20 pb-8 sm:pb-10">
        {/* Big CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pb-10 sm:pb-14 border-b border-black/10 dark:border-white/10"
        >
          <p className="text-[#FF4DA3] text-[10px] tracking-[0.4em] uppercase font-bold">
            ● Join The Drop
          </p>
          <h2 className="mt-3 text-[2.5rem] sm:text-5xl md:text-7xl font-[1000] uppercase leading-[0.9] tracking-tighter">
            Wear Your <br />
            <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-[length:200%_auto] animate-gradient2">
              Next Statement
            </span>
          </h2>

          {/* Newsletter */}
          <form
            onSubmit={handleSubscribe}
            className="mt-8 max-w-md flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl focus-within:border-[#FF4DA3]/40 focus-within:shadow-[0_0_0_4px_rgba(255,77,163,0.1)] transition-all"
          >
            <div className="pl-3 sm:pl-4 text-black/40 dark:text-white/40 shrink-0">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-black/30 dark:placeholder:text-white/30 px-1.5 sm:px-2 py-2"
              required
            />
            <button
              type="submit"
              disabled={subscribed}
              aria-label={subscribed ? "Subscribed" : "Subscribe"}
              className="shrink-0 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-[#FF4DA3] text-white text-[10px] font-black tracking-[0.2em] uppercase hover:shadow-[0_10px_30px_-8px_#FF4DA3] active:scale-95 transition-all disabled:opacity-70 whitespace-nowrap"
            >
              {subscribed ? (
                <>
                  <Check size={14} />
                  <span className="hidden sm:inline">Subscribed</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Subscribe</span>
                  <ArrowUpRight size={14} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Links grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-6 py-10 sm:py-14">
          {/* Brand column */}
          <div className="md:col-span-2 space-y-5">
            <img
              src="/images/LOGO2.png"
              alt="ZØYA"
              className="h-9 sm:h-10 w-auto object-contain"
            />
            <p className="text-sm text-black/60 dark:text-white/50 leading-relaxed max-w-xs">
              More than just fabric. It&apos;s a statement. Crafted for
              presence. Designed to stand out.
            </p>
            <div className="flex items-center gap-2 pt-2">
              {socials.map(({ label, Icon, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.92 }}
                  className="group h-10 w-10 grid place-items-center rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:text-[#FF4DA3] hover:border-[#FF4DA3]/40 transition-colors"
                >
                  <Icon width={15} height={15} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Three link columns — side-by-side on mobile & desktop */}
          <div className="md:col-span-3 grid grid-cols-3 gap-4 sm:gap-6">
            {/* Shop */}
            <div>
              <h4 className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-black/40 dark:text-white/40 mb-4 sm:mb-5">
                Shop
              </h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {shopLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="group inline-flex items-center gap-1 text-[13px] sm:text-sm text-black/70 dark:text-white/60 hover:text-[#FF4DA3] transition-colors"
                    >
                      {l.label}
                      <ArrowUpRight
                        size={13}
                        className="hidden sm:inline opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-black/40 dark:text-white/40 mb-4 sm:mb-5">
                About
              </h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {aboutLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="group inline-flex items-center gap-1 text-[13px] sm:text-sm text-black/70 dark:text-white/60 hover:text-[#FF4DA3] transition-colors"
                    >
                      {l.label}
                      <ArrowUpRight
                        size={13}
                        className="hidden sm:inline opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-black/40 dark:text-white/40 mb-4 sm:mb-5">
                Help
              </h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {helpLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="group inline-flex items-center gap-1 text-[13px] sm:text-sm text-black/70 dark:text-white/60 hover:text-[#FF4DA3] transition-colors"
                    >
                      {l.label}
                      <ArrowUpRight
                        size={13}
                        className="hidden sm:inline opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between text-[10px] tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
          {/* Legal row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[9px] sm:text-[10px]">
              © {new Date().getFullYear()} ZØYA. All rights reserved.
            </span>
            <span className="hidden md:inline text-black/20 dark:text-white/20">
              /
            </span>
            <a href="/privacy" className="hover:text-[#FF4DA3] transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-[#FF4DA3] transition-colors">
              Terms
            </a>
            <a href="/cookies" className="hover:text-[#FF4DA3] transition-colors">
              Cookies
            </a>
          </div>

          {/* Credit + back to top */}
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

            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="group h-8 px-3 flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-[#FF4DA3]/40 hover:text-[#FF4DA3] transition-colors self-start sm:self-auto"
            >
              Back to top
              <ArrowUp
                size={12}
                className="group-hover:-translate-y-0.5 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
