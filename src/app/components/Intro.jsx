"use client";

import { useEffect, useState } from "react";

const INTRO_KEY = "zoya-intro-seen";

export default function Intro() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(INTRO_KEY)) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* ignore */
      }
      return;
    }

    setShow(true);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }, []);

  const finish = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* ignore */
      }
      setShow(false);
      setExiting(false);
    }, 400);
  };

  useEffect(() => {
    if (!show) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const totalMs = isMobile ? 2800 : 4200;
    const phase2 = isMobile ? 1200 : 1900;
    const phase3 = isMobile ? 1800 : 2800;

    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), phase2);
    const t3 = setTimeout(() => setPhase(3), phase3);
    const t4 = setTimeout(() => finish(), totalMs);

    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;
    let raf;
    const start = performance.now();
    const duration = 1700;

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounter(Math.floor(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  const skip = () => finish();

  if (!show) return null;

  return (
    <div
      className="intro-root fixed inset-0 z-[9999] bg-black overflow-hidden"
      data-phase={phase}
      data-exiting={exiting ? "true" : "false"}
    >
      <div className="intro-glow absolute top-[-20%] left-[-10%] h-[700px] w-[700px] bg-[#FF4DA3] blur-[180px] rounded-full pointer-events-none" />
      <div className="intro-glow intro-glow-b absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] bg-[#FF4DA3] blur-[150px] rounded-full pointer-events-none" />

      <div className="absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.08] mix-blend-overlay pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="intro-corner intro-corner-l absolute top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-2 text-[10px] tracking-[0.4em] text-white/40 font-mono uppercase">
        <span className="w-2 h-2 rounded-full bg-[#FF4DA3] animate-pulse" />
        <span>ZØYA / SYSTEM ONLINE</span>
      </div>

      <div className="intro-corner intro-corner-r absolute top-6 right-6 sm:top-10 sm:right-10 text-[10px] tracking-[0.4em] text-white/40 font-mono uppercase">
        DROP 01 // SS&apos;26
      </div>

      <div className="intro-counter absolute bottom-6 left-6 sm:bottom-10 sm:left-10 flex items-end gap-3 font-mono">
        <span className="text-white text-[64px] sm:text-[90px] font-black leading-none tracking-tighter tabular-nums">
          {String(counter).padStart(3, "0")}
        </span>
        <span className="text-white/30 text-[10px] tracking-[0.4em] uppercase pb-3">
          loading
        </span>
      </div>

      <button
        type="button"
        onClick={skip}
        className="intro-skip absolute bottom-8 right-6 sm:bottom-12 sm:right-10 z-40 flex items-center gap-2 text-[10px] tracking-[0.4em] text-white/40 font-mono uppercase cursor-pointer hover:text-[#FF4DA3] transition-colors"
      >
        <span>Skip</span>
        <span className="w-6 h-[1px] bg-white/30" />
      </button>

      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
        <div className="intro-progress h-full bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3]" />
      </div>

      <div className="relative z-10 h-full w-full flex items-center justify-center px-6 pointer-events-none">
        <div className="relative flex flex-col items-center">
          {phase >= 1 && phase < 3 && (
            <span className="intro-badge text-[#FF4DA3] text-[10px] sm:text-xs tracking-[0.5em] uppercase font-black mb-8 px-3 py-1 rounded-full border border-[#FF4DA3]/30 bg-[#FF4DA3]/5">
              Established 2026
            </span>
          )}

          <div className="relative overflow-hidden">
            <h1
              className="intro-logo text-white font-[1000] tracking-[-0.04em] leading-[0.8] uppercase text-center"
              style={{ fontSize: "clamp(72px, 18vw, 240px)" }}
            >
              ZØ
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff9ec9] to-[#FF4DA3] bg-[length:200%_auto] italic animate-zoya-gradient">
                YA
              </span>
            </h1>

            <div className="intro-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
          </div>

          <div className="intro-divider origin-center w-32 sm:w-44 h-[1px] bg-gradient-to-r from-transparent via-[#FF4DA3] to-transparent mt-6 mb-5" />

          {phase >= 2 && (
            <div className="intro-tagline flex flex-col items-center gap-2">
              <span className="text-white/90 text-xs sm:text-sm tracking-[0.5em] uppercase font-bold">
                Wear Your Identity
              </span>
              <span className="text-white/30 text-[9px] sm:text-[10px] tracking-[0.4em] font-mono uppercase">
                Cairo · Paris · Milan
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="intro-wipe-pink absolute inset-0 bg-[#FF4DA3] z-20 pointer-events-none" />
      <div className="intro-wipe-black absolute inset-0 bg-black z-30 pointer-events-none" />

      <style jsx>{`
        @keyframes zoya-gradient {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-zoya-gradient {
          animation: zoya-gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
