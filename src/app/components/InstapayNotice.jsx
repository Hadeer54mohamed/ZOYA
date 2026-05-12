"use client";

import { Wallet, Copy, Check } from "lucide-react";

const INSTAPAY_NUMBER = process.env.NEXT_PUBLIC_INSTAPAY_NUMBER;

/**
 * @param {number | null | undefined} amountEgp — if set, shows exact amount (e.g. review step); otherwise generic copy.
 * @param {boolean} copied
 * @param {() => void} onCopy — parent should guard clipboard; this button is disabled when number is missing.
 */
export default function InstapayNotice({
  amountEgp = null,
  copied = false,
  onCopy,
  className = "",
}) {
  const raw = INSTAPAY_NUMBER != null ? String(INSTAPAY_NUMBER).trim() : "";
  const hasNumber = Boolean(raw);

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-[#FF4DA3]/5 border border-[#FF4DA3]/30 space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Wallet size={18} strokeWidth={2} className="text-[#FF4DA3] shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed min-w-0">
          <p className="font-semibold text-[#FF4DA3] mb-0.5">
            Please send payment via InstaPay
          </p>
          <p className="text-xs text-black/60 dark:text-white/50">
            {amountEgp != null && Number.isFinite(Number(amountEgp)) ? (
              <>
                Transfer{" "}
                <span className="font-semibold">
                  EGP {Math.round(Number(amountEgp)).toLocaleString()}
                </span>{" "}
                to the number below before confirming your order.
              </>
            ) : (
              <>
                Transfer the total amount to the number below, then place your
                order. We will confirm once payment is received.
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5">
        {hasNumber ? (
          <span className="font-mono text-base font-bold tracking-wider text-black dark:text-white select-all break-all">
            {raw}
          </span>
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-400/90">
            InstaPay number is not configured. Please contact support.
          </p>
        )}
        <button
          type="button"
          onClick={() => hasNumber && onCopy?.()}
          disabled={!hasNumber}
          aria-label="Copy InstaPay number"
          className={`flex-shrink-0 p-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            copied
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-[#FF4DA3]/15 hover:text-[#FF4DA3]"
          }`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

export { INSTAPAY_NUMBER as INSTAPAY_NUMBER_ENV };
