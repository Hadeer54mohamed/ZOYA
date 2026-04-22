"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { ShoppingBag, Sun, Moon } from "lucide-react";
import SearchOverlay from "./SearchOverlay";

const links = [
  { label: "Home", href: "home" },
  { label: "Shop", href: "products" },
  { label: "Collections", href: "collections" },
  { label: "About", href: "about" },
];

const NAV_OFFSET = -100;

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return false;
  const y =
    el.getBoundingClientRect().top + window.pageYOffset + NAV_OFFSET;
  window.scrollTo({ top: y, behavior: "smooth" });
  return true;
};

export default function Navbar({ products = [] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, setIsCartOpen, cartIconRef } = useCart();
  const { theme, toggleTheme, mounted } = useTheme();
  const [pulse, setPulse] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const handleNavClick = (href) => {
    if (isHome) {
      scrollToSection(href);
    } else {
      router.push(`/#${href}`);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (cartCount > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  // Scroll-spy — يشتغل بس على صفحة الهوم
  useEffect(() => {
    if (!isHome) {
      setActive(""); // مفيش active pill على الصفحات التانية
      return;
    }

    const handleScroll = () => {
      const sections = links.map((l) => l.href);
      let current = "home";

      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          current = id;
        }
      });

      const activeLabel =
        links.find((l) => l.href === current)?.label || "Home";
      setActive(activeLabel);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  const isDark = theme === "dark";

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 w-full z-50 transition-all duration-500"
    >
      <div
        className={`mx-auto transition-all duration-500 ease-in-out ${
          scrolled ? "max-w-4xl" : "max-w-6xl"
        } px-4 sm:px-6`}
      >
        <motion.div
          animate={{
            paddingTop: scrolled ? 8 : 14,
            paddingBottom: scrolled ? 8 : 14,
            backgroundColor: isDark
              ? scrolled
                ? "rgba(0, 0, 0, 0.7)"
                : "rgba(0, 0, 0, 0.3)"
              : scrolled
              ? "rgba(255, 255, 255, 0.75)"
              : "rgba(255, 255, 255, 0.4)",
          }}
          className={`mt-4 flex items-center justify-between rounded-full px-5 sm:px-8 border border-black/10 dark:border-white/10 backdrop-blur-2xl transition-all duration-500 ${
            scrolled
              ? "shadow-[0_10px_40px_-10px_rgba(255,46,136,0.2)]"
              : "shadow-none"
          }`}
        >
          {/* Logo */}
          <a href="/" className="group flex items-center gap-2 outline-none">
            <motion.img
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              src="/images/LOGO2.png"
              alt="ZØYA"
              className="h-9 sm:h-10 w-auto object-contain transition-all"
            />
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-medium text-black/50 dark:text-white/50">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="group relative px-5 py-2 transition-all duration-300"
              >
                <span
                  className={`relative z-10 tracking-[0.2em] uppercase transition-colors duration-300 ${
                    active === link.label
                      ? "text-black dark:text-white"  
                      : "group-hover:text-black dark:group-hover:text-white"
                  }`}
                >
                  {link.label}
                </span>

                {active === link.label && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute inset-0 rounded-full bg-black/[0.06] dark:bg-white/[0.08] border border-black/10 dark:border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mounted && (
                  <motion.span
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.3 }}
                    className="absolute"
                  >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              ref={cartIconRef}
              className={`group relative flex items-center gap-2.5 rounded-full bg-[#FF4DA3] pl-4 pr-2 py-1.5 text-[11px] font-bold text-black transition-all duration-300 hover:shadow-[0_0_25px_-5px_#FF4DA3] hover:scale-[1.03] active:scale-95 ${
                pulse ? "scale-110" : ""
              }`}
            >
              <span className="tracking-widest uppercase">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-black px-2 text-[10px] text-white transition-transform group-hover:rotate-12">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={cartCount}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {cartCount ?? 0}
                  </motion.span>
                </AnimatePresence>
              </div>
            </button>

            {/* Mobile Burger Menu */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white"
            >
              <div className="flex flex-col gap-1 items-center justify-center">
                <motion.span
                  animate={open ? { rotate: 45, y: 2.5 } : { rotate: 0, y: 0 }}
                  className="h-[1.5px] w-5 bg-black dark:bg-white rounded-full origin-center"
                />
                <motion.span
                  animate={open ? { rotate: -45, y: -2.5 } : { rotate: 0, y: 0 }}
                  className="h-[1.5px] w-5 bg-black dark:bg-white rounded-full origin-center"
                />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute left-4 right-4 mt-3 overflow-hidden rounded-3xl bg-white/90 dark:bg-black/90 backdrop-blur-3xl border border-black/10 dark:border-white/10 md:hidden shadow-2xl"
            >
              <div className="flex flex-col p-3">
                {links.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => handleNavClick(link.href), 50);
                    }}
                    className={`text-left px-6 py-4 rounded-2xl text-[10px] tracking-[0.3em] uppercase transition-all ${
                      active === link.label
                        ? "bg-black/5 dark:bg-white/10 text-[#FF4DA3]"
                        : "text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
      />
    </motion.nav>
  );
}
