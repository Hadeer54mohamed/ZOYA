"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { ShoppingBag, Sun, Moon, Search } from "lucide-react";
import SearchOverlay from "./SearchOverlay";

const links = [
  { label: "Home", href: "home" },
  { label: "Shop", href: "/products" },
  { label: "Collections", href: "collections" },
  { label: "About", href: "about" },
  { label: "Contact", href: "contact" },
  { label: "Track Order", href: "/track" },
];

const NAV_OFFSET = -100;

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return false;
  const y = el.getBoundingClientRect().top + window.pageYOffset + NAV_OFFSET;
  window.scrollTo({ top: y, behavior: "smooth" });
  return true;
};

export default function Navbar({ products = [] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, setIsCartOpen, cartIconRef, isCartOpen } = useCart();
  const { theme, toggleTheme, mounted } = useTheme();
  const [pulse, setPulse] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  // 🔥 Admin system Logic (Unchanged)
  const [tapCount, setTapCount] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const tapTimeoutRef = useRef(null);
  const pressTimerRef = useRef(null);

  const triggerUnlock = () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    if (navigator.vibrate) navigator.vibrate(50);

    setTimeout(() => {
      router.push("/admin-gate");
    }, 1000);
  };

  const handleLogoTap = () => {
    if (isUnlocking) return;
    const nextCount = tapCount + 1;
    setTapCount(nextCount);
    clearTimeout(tapTimeoutRef.current);
    if (nextCount >= 5) {
      setTapCount(0);
      triggerUnlock();
      return;
    }
    tapTimeoutRef.current = setTimeout(() => {
      if (nextCount === 1) {
        if (isHome) window.location.reload();
        else router.push("/");
      }
      setTapCount(0);
    }, 400);
  };

  const handlePressStart = () => {
    pressTimerRef.current = setTimeout(() => { triggerUnlock(); }, 800);
  };

  const handlePressEnd = () => { clearTimeout(pressTimerRef.current); };

  const handleNavClick = (href) => {
    if (href.startsWith("/")) {
      router.push(href);
      return;
    }
    if (isHome) scrollToSection(href);
    else router.push(`/#${href}`);
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

  useEffect(() => {
    if (!isHome) {
      const matched = links.find((l) => l.href === pathname);
      setActive(matched?.label || "");
      return;
    }
    const sectionLinks = links.filter((l) => !l.href.startsWith("/"));
    const handleScroll = () => {
      let current = "home";
      sectionLinks.forEach(({ href: id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) current = id;
      });
      const activeLabel = sectionLinks.find((l) => l.href === current)?.label || "Home";
      setActive(activeLabel);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome, pathname]);

  const isDark = theme === "dark";

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={
          isCartOpen
            ? { y: -120, opacity: 0 }
            : { y: 0, opacity: 1 }
        }
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 w-full px-4 pt-6 ${
          isCartOpen ? "z-30 pointer-events-none" : "z-50"
        }`}
      >
        <div className={`mx-auto transition-all duration-700 ease-in-out ${scrolled ? "max-w-[850px]" : "max-w-6xl"}`}>
          <motion.div
            className={`relative flex items-center justify-between rounded-full px-2 py-2 sm:px-4 sm:py-2 border border-white/10 dark:border-white/5 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ${
              isDark 
                ? "bg-[#0A0A0A]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
                : "bg-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            }`}
          >
            {/* LOGO SECTION */}
            <motion.div
              onClick={handleLogoTap}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              className="pl-3 sm:pl-4 z-50 cursor-pointer shrink-0"
              animate={isUnlocking ? { scale: [1, 1.1, 0.9, 1], rotate: [0, 5, -5, 0] } : {}}
            >
              <img src="/images/LOGO2.png" alt="ZØYA" className="h-6 sm:h-8 w-auto object-contain" />
            </motion.div>

            {/* DESKTOP LINKS - Matches the Image Style */}
            <div className="hidden md:flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1 mx-4">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="relative px-6 py-2 text-[10px] tracking-[0.2em] uppercase font-bold transition-all"
                >
                  <span className={`relative z-10 transition-colors duration-300 ${active === link.label ? "text-white dark:text-white" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}>
                    {link.label}
                  </span>
                  {active === link.label && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      className="absolute inset-0 rounded-full bg-[#1A1A1A] dark:bg-white/10 shadow-inner"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-1 sm:gap-2 pr-1">
              <button onClick={() => setSearchOpen(true)} className="p-2 text-black/50 dark:text-white/50 hover:text-[#FF4DA3] transition-colors">
                <Search size={18} />
              </button>
              
              <button onClick={toggleTheme} className="hidden sm:block p-2 text-black/50 dark:text-white/50 hover:text-[#FF4DA3] transition-colors">
                {mounted && (isDark ? <Sun size={18} /> : <Moon size={18} />)}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                ref={cartIconRef}
                className={`group relative flex items-center gap-2 rounded-full bg-[#FF4DA3] pl-4 pr-1.5 py-1.5 transition-all duration-300 hover:bg-[#FF2E92] hover:shadow-[0_8px_25px_rgba(255,77,163,0.45)] hover:-translate-y-[1px] active:scale-95 ${pulse ? "scale-110" : ""}`}
              >
                <ShoppingBag className="h-4 w-4 text-white" strokeWidth={2.5} />
                <div className="flex h-6 min-w-[30px] items-center justify-center rounded-full bg-black text-[10px] font-black text-white px-1">
                  {cartCount ?? 0}
                </div>
              </button>

              {/* MOBILE TOGGLE */}
              <button
                onClick={() => setOpen(!open)}
                className="md:hidden ml-1 h-9 w-9 flex flex-col gap-1 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <motion.span animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }} className="h-[1.5px] w-4 bg-black dark:bg-white rounded-full" />
                <motion.span animate={open ? { opacity: 0 } : { opacity: 1 }} className="h-[1.5px] w-4 bg-black dark:bg-white rounded-full" />
                <motion.span animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }} className="h-[1.5px] w-4 bg-black dark:bg-white rounded-full" />
              </button>
            </div>
          </motion.div>

          {/* MOBILE MENU - Floating Style */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`absolute top-full left-0 right-0 mt-3 overflow-hidden rounded-[2.5rem] backdrop-blur-3xl border md:hidden ${
                  isDark
                    ? "bg-[#0F0F0F]/95 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                    : "bg-white/95 border-black/5 shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
                }`}
              >
                <div className="flex flex-col p-3 gap-1">
                  {links.map((link, i) => (
                    <motion.button
                      key={link.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setOpen(false); setTimeout(() => handleNavClick(link.href), 300); }}
                      className={`w-full text-left px-8 py-5 rounded-[1.8rem] text-[10px] tracking-[0.4em] uppercase font-bold transition-all ${
                        active === link.label
                          ? isDark
                            ? "bg-white text-black"
                            : "bg-black text-white"
                          : isDark
                            ? "text-white/40 hover:text-white hover:bg-white/5"
                            : "text-black/40 hover:text-black hover:bg-black/5"
                      }`}
                    >
                      {link.label}
                    </motion.button>
                  ))}
                  {/* Theme toggle inside mobile menu for convenience */}
                  <div className={`flex justify-between items-center px-8 py-5 mt-2 border-t ${isDark ? "border-white/5" : "border-black/5"}`}>
                    <span className={`text-[9px] tracking-[0.3em] uppercase ${isDark ? "text-white/30" : "text-black/30"}`}>Switch Theme</span>
                    <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}>
                      {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
      </motion.nav>

    </>
  );
}