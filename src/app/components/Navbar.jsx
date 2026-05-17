"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { ShoppingBag, Sun, Moon, Monitor, Search } from "lucide-react";
import dynamic from "next/dynamic";
import {
  navigateToSection,
  scrollToSection,
  setSectionHash,
} from "../lib/navScroll";

const SearchOverlay = dynamic(() => import("./SearchOverlay"), { ssr: false });

const links = [
  { label: "Home", href: "home", type: "section" },
  { label: "Shop", href: "/products", type: "route" },
  { label: "Collections", href: "collections", type: "section" },
  { label: "About", href: "about", type: "section" },
  { label: "Contact", href: "contact", type: "section" },
  { label: "Track Order", href: "/track", type: "route" },
];

export default function Navbar({ products = [] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, setIsCartOpen, cartIconRef, isCartOpen } = useCart();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [pulse, setPulse] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const [tapCount, setTapCount] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const tapTimeoutRef = useRef(null);
  const pressTimerRef = useRef(null);
  const navShellRef = useRef(null);

  const triggerUnlock = () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => router.push("/admin-gate"), 1000);
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
        if (isHome) {
          setSectionHash("home");
          scrollToSection("home");
          setActive("Home");
        } else {
          navigateToSection("home", pathname, router);
        }
      }
      setTapCount(0);
    }, 400);
  };

  const handlePressStart = () => {
    pressTimerRef.current = setTimeout(triggerUnlock, 800);
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimerRef.current);
  };

  const handleSectionClick = (sectionId) => {
    setOpen(false);
    const label =
      links.find((l) => l.type === "section" && l.href === sectionId)?.label ||
      "Home";
    setActive(label);

    navigateToSection(sectionId, pathname, router);
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
    if (!open) return;
    const closeIfOutside = (e) => {
      if (navShellRef.current && !navShellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHome) {
      const matched = links.find((l) => l.href === pathname);
      setActive(matched?.label || "");
      return;
    }
    const sectionLinks = links.filter((l) => l.type === "section");
    const handleScroll = () => {
      let current = "home";
      sectionLinks.forEach(({ href: id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) current = id;
      });
      const activeLabel =
        sectionLinks.find((l) => l.href === current)?.label || "Home";
      setActive(activeLabel);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome, pathname]);

  const isDark = resolvedTheme === "dark";

  const themeToggleAria =
    theme === "system"
      ? "Theme follows device. Click for light mode."
      : theme === "light"
        ? "Light mode. Click for dark mode."
        : "Dark mode. Click to follow device.";

  const linkClass = (label) =>
    `relative shrink-0 px-3 lg:px-5 py-2 text-[10px] tracking-[0.15em] lg:tracking-[0.2em] uppercase font-bold cursor-pointer transition-colors ${
      active === label
        ? "text-white"
        : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
    }`;

  return (
    <>
      <header
        data-cart-open={isCartOpen ? "true" : "false"}
        data-scrolled={scrolled ? "true" : "false"}
        className="nav-fixed-shell fixed top-0 left-0 z-50 w-full px-4 pt-6"
      >
        <div
          ref={navShellRef}
          className="nav-shell relative mx-auto w-full max-w-6xl"
        >
          <div
            className={`nav-bar relative flex min-h-[52px] items-center rounded-full border border-white/10 px-2 py-2 backdrop-blur-2xl backdrop-saturate-150 sm:min-h-[56px] sm:px-4 ${
              isDark
                ? "bg-[#0A0A0A]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                : "bg-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            }`}
          >
            {/* Logo */}
            <button
              type="button"
              onClick={handleLogoTap}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              className={`relative z-20 shrink-0 rounded-lg pl-2 sm:pl-3 cursor-pointer ${isUnlocking ? "animate-logo-unlock" : ""}`}
              aria-label="ZØYA home"
            >
              <Image
                src="/images/LOGO2.webp"
                alt=""
                width={120}
                height={32}
                className={`pointer-events-none w-auto object-contain transition-all duration-500 ${
                  scrolled ? "h-5 sm:h-6" : "h-6 sm:h-8"
                }`}
              />
            </button>

            {/* Desktop links — centered overlay, clicks only on buttons */}
            <nav
              className="pointer-events-none absolute inset-0 z-30 hidden md:flex items-center justify-center"
              aria-label="Main navigation"
            >
              <div className="nav-desktop-links pointer-events-auto flex max-w-[min(100%,42rem)] items-center overflow-x-auto rounded-full bg-black/5 p-1 no-scrollbar dark:bg-white/5">
                {links.map((link) =>
                  link.type === "route" ? (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={linkClass(link.label)}
                    >
                      <span className="relative z-10">{link.label}</span>
                      {active === link.label && (
                        <span className="nav-link-pill absolute inset-0 rounded-full bg-[#1A1A1A] shadow-inner dark:bg-white/10" />
                      )}
                    </Link>
                  ) : (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => handleSectionClick(link.href)}
                      className={linkClass(link.label)}
                    >
                      <span className="relative z-10">{link.label}</span>
                      {active === link.label && (
                        <span className="nav-link-pill absolute inset-0 rounded-full bg-[#1A1A1A] shadow-inner dark:bg-white/10" />
                      )}
                    </button>
                  ),
                )}
              </div>
            </nav>

            {/* Actions */}
            <div className="relative z-20 ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 pr-0.5 sm:pr-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="rounded-full p-2 text-black/50 transition-colors hover:text-[#FF4DA3] dark:text-white/50 cursor-pointer"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={themeToggleAria}
                className="hidden rounded-full p-2 text-black/50 transition-colors hover:text-[#FF4DA3] dark:text-white/50 sm:block cursor-pointer"
              >
                <span key={theme} className="inline-flex animate-theme-icon">
                  {theme === "system" ? (
                    <Monitor size={18} />
                  ) : theme === "dark" ? (
                    <Moon size={18} />
                  ) : (
                    <Sun size={18} />
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                ref={cartIconRef}
                className={`group relative flex cursor-pointer items-center gap-2 rounded-full bg-[#FF4DA3] py-1.5 pl-3 pr-1.5 transition-all duration-300 hover:-translate-y-px hover:bg-[#FF2E92] hover:shadow-[0_8px_25px_rgba(255,77,163,0.45)] active:scale-95 sm:pl-4 ${pulse ? "scale-110" : ""}`}
              >
                <ShoppingBag className="h-4 w-4 text-white" strokeWidth={2.5} />
                <span className="flex h-6 min-w-[30px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-black text-white">
                  {cartCount ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                className="ml-0.5 flex h-9 w-9 cursor-pointer flex-col items-center justify-center gap-1 rounded-full text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/5 md:hidden"
              >
                <span
                  data-open={open ? "true" : "false"}
                  className="menu-line menu-line-top"
                />
                <span
                  data-open={open ? "true" : "false"}
                  className="menu-line menu-line-mid"
                />
                <span
                  data-open={open ? "true" : "false"}
                  className="menu-line menu-line-bot"
                />
              </button>
            </div>
          </div>

          {open && (
            <div
              className={`absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-[2.5rem] border backdrop-blur-3xl md:hidden animate-ui-scale-in ${
                isDark
                  ? "border-white/10 bg-[#0F0F0F]/95 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                  : "border-black/5 bg-white/95 shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
              }`}
            >
              <div className="flex flex-col gap-1 p-3">
                {links.map((link) =>
                  link.type === "route" ? (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`block w-full rounded-[1.8rem] px-8 py-5 text-left text-[10px] font-bold uppercase tracking-[0.4em] transition-all ${
                        active === link.label
                          ? isDark
                            ? "bg-white text-black"
                            : "bg-black text-white"
                          : isDark
                            ? "text-white/40 hover:bg-white/5 hover:text-white"
                            : "text-black/40 hover:bg-black/5 hover:text-black"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => handleSectionClick(link.href)}
                      className={`w-full cursor-pointer rounded-[1.8rem] px-8 py-5 text-left text-[10px] font-bold uppercase tracking-[0.4em] transition-all ${
                        active === link.label
                          ? isDark
                            ? "bg-white text-black"
                            : "bg-black text-white"
                          : isDark
                            ? "text-white/40 hover:bg-white/5 hover:text-white"
                            : "text-black/40 hover:bg-black/5 hover:text-black"
                      }`}
                    >
                      {link.label}
                    </button>
                  ),
                )}
                <div
                  className={`mt-2 flex items-center justify-between border-t px-8 py-5 ${isDark ? "border-white/5" : "border-black/5"}`}
                >
                  <span
                    className={`text-[9px] uppercase tracking-[0.3em] ${isDark ? "text-white/30" : "text-black/30"}`}
                  >
                    Switch Theme
                  </span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={themeToggleAria}
                    className={`cursor-pointer rounded-full p-2 transition-colors ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}
                  >
                    <span key={theme} className="inline-flex animate-theme-icon">
                      {theme === "system" ? (
                        <Monitor size={16} />
                      ) : theme === "dark" ? (
                        <Moon size={16} />
                      ) : (
                        <Sun size={16} />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
      />
    </>
  );
}
