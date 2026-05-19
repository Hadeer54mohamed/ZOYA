"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ZoyaHeading from "./ZoyaHeading";
import { setAdminSessionPassword } from "../lib/adminSession";

export default function PasswordGate({
  children,
  label = "Authorization",
  subtitle = "Zoya Secured Terminal",
  scope = "studio",
  onAuthorized,
}) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleLogin = async () => {
    setIsChecking(true);
    setError("");

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, scope }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        if (res.status >= 500) {
          setError(
            "Server error — check dev terminal or free disk space on D: then restart npm run dev.",
          );
        } else {
          setError(data?.error || "Invalid Access Key");
        }
        setIsChecking(false);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([50, 100, 50]);
        }
        return;
      }
      setAuthorized(true);
      if (scope === "admin") {
        setAdminSessionPassword(password);
      }
      onAuthorized?.(password);
    } catch {
      setError(
        "Could not reach the server. Stop dev, free space on D:, delete .next, then run npm run dev again.",
      );
      setIsChecking(false);
    }
  };

  if (!authorized) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505] text-black dark:text-white p-4 transition-colors duration-500 relative overflow-hidden">
        
        {/* Background Accents */}
        <div className="absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] bg-[#FF4DA3]/10 blur-[120px] rounded-full" />
        
        <div className="absolute top-5 right-5 z-50">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-[380px] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-2xl shadow-2xl shadow-black/5"
        >
          {/* Lock Icon with Pulse */}
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-8">
            <div className="absolute inset-0 bg-[#FF4DA3]/20 rounded-full animate-ping opacity-20" />
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-[#FF4DA3]/10 text-[#FF4DA3] border border-[#FF4DA3]/20">
              <Lock size={24} strokeWidth={1.5} />
            </div>
          </div>

          {scope === "admin" ? (
            <ZoyaHeading
              label={label}
              title={subtitle}
              as="h2"
              size="sm"
              align="center"
              className="mb-10"
              titleClassName="!mt-2"
            />
          ) : (
            <div className="text-center space-y-2 mb-10">
              <h1 className="text-[10px] tracking-[0.8em] uppercase text-black/40 dark:text-white/40 font-mono">
                {label}
              </h1>
              <h2 className="text-2xl font-serif italic tracking-wide">
                {subtitle}
              </h2>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="password"
                placeholder="ACCESS KEY"
                autoFocus
                className="w-full px-5 py-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 outline-none focus:border-[#FF4DA3]/50 focus:ring-4 focus:ring-[#FF4DA3]/5 transition-all text-center tracking-[0.5em] font-mono text-sm placeholder:tracking-normal placeholder:opacity-30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 font-mono"
                >
                  <AlertCircle size={12} />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={handleLogin}
              disabled={isChecking || !password}
              className="group relative w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold tracking-[0.3em] uppercase text-[10px] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isChecking ? (
                  <div className="h-4 w-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Decrypt</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-[8px] tracking-[0.3em] text-black/20 dark:text-white/20 uppercase font-mono">
            <ShieldCheck size={10} />
            End-to-End Encrypted
          </div>
        </motion.div>

        {/* Decorative corner lines */}
        <div className="absolute bottom-10 left-10 w-20 h-[1px] bg-black/5 dark:bg-white/5" />
        <div className="absolute bottom-10 left-10 w-[1px] h-20 bg-black/5 dark:bg-white/5" />
      </main>
    );
  }

  return <>{children}</>;
}