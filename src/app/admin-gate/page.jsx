"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Cpu, LayoutDashboard, Database, Home } from "lucide-react";

export default function AdminGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleAccess = (path) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(circle_at_center,rgba(255,77,163,0.08),transparent_70%)] overflow-hidden relative flex items-center justify-center px-6">
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] bg-[#FF4DA3]/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] bg-[#FF4DA3]/10 blur-[100px] rounded-full" />

      <div className="absolute inset-0 bg-[url('/images/noise.webp')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="absolute top-8 left-8 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="h-[2px] w-12 bg-gradient-to-r from-[#FF4DA3] to-transparent" />
          <span className="text-[10px] tracking-[0.3em] text-[#FF4DA3]/90 font-mono uppercase">
            System.Ready
          </span>
        </div>

        <div className="h-5 w-[1px] bg-white/20" />
        <button
          onClick={() => router.push("/")}
          className="group flex items-center gap-2 transition-all duration-300 relative px-2 py-1 -ml-2 rounded"
        >
          <div className="absolute inset-0 bg-[#FF4DA3]/0 group-hover:bg-[#FF4DA3]/5 blur-sm transition-all duration-300 rounded" />
          <Home
            size={15}
            className="text-white/60 group-hover:text-white transition-all duration-300 relative z-10 group-hover:drop-shadow-[0_0_5px_rgba(255,77,163,0.8)]"
          />
          <span className="text-[10px] tracking-[0.3em] text-white/60 group-hover:text-white font-mono uppercase transition-colors relative z-10">
            Home Page
          </span>
        </button>
      </div>

      <div className="animate-ui-fade-in-up relative z-10 w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-16">
          <div className="mb-4 text-[#FF4DA3] animate-pulse">
            <Cpu size={24} strokeWidth={1} />
          </div>

          <h2 className="text-white text-[10px] tracking-[0.8em] uppercase opacity-40 font-light">
            ZØYA Terminal
          </h2>
        </div>

        {!ready ? (
          <div key="loader" className="flex flex-col items-center animate-ui-fade-in">
            <div className="w-48 h-[1px] bg-white/10 relative overflow-hidden">
              <div className="absolute inset-0 w-full bg-[#FF4DA3] blur-[2px] animate-loader-sweep" />
            </div>

            <span className="mt-4 text-[#FF4DA3] text-[9px] tracking-[0.4em] font-mono animate-pulse">
              DECRYPTING ACCESS
            </span>
          </div>
        ) : (
          <div key="content" className="space-y-4 animate-ui-fade-in-up">
            <p className="text-white/30 text-[9px] tracking-[0.3em] uppercase text-center mb-8 font-mono">
              — Established Connection —
            </p>

            <AccessButton
              label="Content Studio"
              sub="Sanity CMS"
              icon={<Database size={16} />}
              onClick={() => handleAccess("/studio")}
              variant="glass"
            />

            <AccessButton
              label="Orders Dashboard"
              sub="Management"
              icon={<LayoutDashboard size={16} />}
              onClick={() => handleAccess("/admin")}
              variant="primary"
            />
          </div>
        )}

        <footer className="mt-14 flex flex-col items-center gap-4">
          <div className="h-[1px] w-8 bg-white/10" />
          <div className="text-[8px] font-mono text-white/20 tracking-[0.4em] uppercase">
            Secured Node: 0x2442
          </div>
        </footer>
      </div>

      <div className="absolute inset-10 border border-white/5 pointer-events-none rounded-3xl" />
    </div>
  );
}

function AccessButton({ label, sub, icon, onClick, variant }) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative w-full p-5 rounded-xl flex items-center justify-between transition-all duration-300 active:scale-[0.97] active:brightness-110
        ${
          isPrimary
            ? "bg-[#FF4DA3] text-white shadow-[0_10px_40px_rgba(255,77,163,0.4),0_0_80px_rgba(255,77,163,0.2)]"
            : "bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white/80"
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg ${
            isPrimary ? "bg-white/20" : "bg-white/5 text-[#FF4DA3]"
          }`}
        >
          {icon}
        </div>

        <div className="text-left">
          <div className="text-[8px] tracking-[0.2em] opacity-50 font-mono uppercase mb-0.5">
            {sub}
          </div>
          <div className="text-[12px] tracking-[0.2em] font-bold uppercase">
            {label}
          </div>
        </div>
      </div>

      <div className="pr-2 opacity-40 animate-pulse">
        <Lock size={14} className={isPrimary ? "text-white" : "text-[#FF4DA3]"} />
      </div>

      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-700" />
      )}
    </button>
  );
}
