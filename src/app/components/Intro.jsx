"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Intro() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShow(true);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    if (!show) return;

    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1900);
    const t3 = setTimeout(() => setPhase(3), 2800);
    const t4 = setTimeout(() => finish(), 4200);

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

  const finish = () => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    setShow(false);
  };

  const skip = () => finish();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-black overflow-hidden"
        >
          {/* === BACKGROUND GLOWS === */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 0.5 : 0 }}
            transition={{ duration: 1.2 }}
            className="absolute top-[-20%] left-[-10%] h-[700px] w-[700px] bg-[#FF4DA3] blur-[180px] rounded-full pointer-events-none"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 0.4 : 0 }}
            transition={{ duration: 1.4, delay: 0.2 }}
            className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] bg-[#FF4DA3] blur-[150px] rounded-full pointer-events-none"
          />

          {/* === NOISE === */}
          <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.08] mix-blend-overlay pointer-events-none" />

          {/* === SCAN LINES === */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
            }}
          />

          {/* === TOP CORNER MARKS === */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute top-6 left-6 sm:top-10 sm:left-10 flex items-center gap-2 text-[10px] tracking-[0.4em] text-white/40 font-mono uppercase"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF4DA3] animate-pulse" />
            <span>ZØYA / SYSTEM ONLINE</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute top-6 right-6 sm:top-10 sm:right-10 text-[10px] tracking-[0.4em] text-white/40 font-mono uppercase"
          >
            DROP 01 // SS&apos;26
          </motion.div>

          {/* === BOTTOM LEFT COUNTER === */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 flex items-end gap-3 font-mono"
          >
            <span className="text-white text-[64px] sm:text-[90px] font-black leading-none tracking-tighter tabular-nums">
              {String(counter).padStart(3, "0")}
            </span>
            <span className="text-white/30 text-[10px] tracking-[0.4em] uppercase pb-3">
              loading
            </span>
          </motion.div>

          {/* === BOTTOM RIGHT SKIP === */}
          <motion.button
            onClick={skip}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ color: "#FF4DA3" }}
            className="absolute bottom-8 right-6 sm:bottom-12 sm:right-10 z-40 flex items-center gap-2 text-[10px] tracking-[0.4em] text-white/40 font-mono uppercase cursor-pointer"
          >
            <span>Skip</span>
            <span className="w-6 h-[1px] bg-white/30" />
          </motion.button>

          {/* === PROGRESS LINE === */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: phase >= 1 ? "100%" : "0%" }}
              transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3]"
            />
          </div>

          {/* === MAIN CENTER STAGE === */}
          <div className="relative z-10 h-full w-full flex items-center justify-center px-6 pointer-events-none">
            <div className="relative flex flex-col items-center">
              {/* TAGLINE LINE 1 */}
              <AnimatePresence mode="wait">
                {phase >= 1 && phase < 3 && (
                  <motion.span
                    key="tag-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5 }}
                    className="text-[#FF4DA3] text-[10px] sm:text-xs tracking-[0.5em] uppercase font-black mb-8 px-3 py-1 rounded-full border border-[#FF4DA3]/30 bg-[#FF4DA3]/5"
                  >
                    Established 2026
                  </motion.span>
                )}
              </AnimatePresence>

              {/* === LOGO REVEAL (split curtain) === */}
              <div className="relative overflow-hidden">
                <motion.h1
                  initial={{ y: 80, opacity: 0 }}
                  animate={{
                    y: phase >= 1 ? 0 : 80,
                    opacity: phase >= 1 ? 1 : 0,
                  }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-white font-[1000] tracking-[-0.04em] leading-[0.8] uppercase text-center"
                  style={{
                    fontSize: "clamp(72px, 18vw, 240px)",
                  }}
                >
                  ZØ
                  <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff9ec9] to-[#FF4DA3] bg-[length:200%_auto] italic animate-zoya-gradient">
                    YA
                  </span>
                </motion.h1>

                {/* sweep light */}
                <motion.div
                  initial={{ x: "-120%" }}
                  animate={{ x: phase >= 1 ? "120%" : "-120%" }}
                  transition={{ duration: 1.4, delay: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                />
              </div>

              {/* DIVIDER */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: phase >= 2 ? 1 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="origin-center w-32 sm:w-44 h-[1px] bg-gradient-to-r from-transparent via-[#FF4DA3] to-transparent mt-6 mb-5"
              />

              {/* TAGLINE LINE 2 (final) */}
              <AnimatePresence mode="wait">
                {phase >= 2 && (
                  <motion.div
                    key="tag-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-white/90 text-xs sm:text-sm tracking-[0.5em] uppercase font-bold">
                      Wear Your Identity
                    </span>
                    <span className="text-white/30 text-[9px] sm:text-[10px] tracking-[0.4em] font-mono uppercase">
                      Cairo · Paris · Milan
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* === EXIT WIPE (pink curtain) === */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: phase >= 3 ? "0%" : "100%" }}
            transition={{ duration: 0.9, ease: [0.85, 0, 0.15, 1] }}
            className="absolute inset-0 bg-[#FF4DA3] z-20 pointer-events-none"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: phase >= 3 ? "0%" : "100%" }}
            transition={{ duration: 0.9, delay: 0.08, ease: [0.85, 0, 0.15, 1] }}
            className="absolute inset-0 bg-black z-30 pointer-events-none"
          />

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
