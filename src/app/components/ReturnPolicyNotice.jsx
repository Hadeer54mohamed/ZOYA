"use client";

import Link from "next/link";

/** Must match `anchor` on the Returns section in `terms/page.jsx`. */
export const RETURNS_POLICY_HREF = "/terms";

/** Must match `anchor` on the Shipping & Delivery section in `terms/page.jsx`. */
export const SHIPPING_POLICY_HREF = "/terms";

const linkCls =
  "underline underline-offset-2 decoration-black/20 dark:decoration-white/25 hover:decoration-[#FF4DA3] hover:text-[#FF4DA3] transition-colors";

const shell =
  "rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.03] text-black/60 dark:text-white/55";

export default function ReturnPolicyNotice({
  variant = "default",
  className = "",
}) {
  if (variant === "checkout") {
    return (
      <aside
        role="note"
        className={`${shell} px-3.5 py-3 sm:px-4 sm:py-3.5 text-[11px] sm:text-xs leading-relaxed ${className}`}
      >
        <p>
          Orders are shipped across Egypt within{" "}
          <span className="text-black/75 dark:text-white/70">
            2–5 business days
          </span>
          . Returns are accepted within{" "}
          <span className="text-black/75 dark:text-white/70">
            14 days
          </span>{" "}
          for unused and unwashed items in their original condition. View our{" "}
          <Link href={RETURNS_POLICY_HREF} className={linkCls}>
            return policy
          </Link>{" "}
          and{" "}
          <Link href={SHIPPING_POLICY_HREF} className={linkCls}>
            shipping details
          </Link>
          .
        </p>
      </aside>
    );
  }

  if (variant === "compact") {
    return (
      <p
        className={`${shell} px-2.5 py-1.5 text-[10px] sm:text-[11px] leading-snug ${className}`}
      >
        14-day returns for unused items.{" "}
        <Link href={RETURNS_POLICY_HREF} className={linkCls}>
          Learn more
        </Link>
        .
      </p>
    );
  }

  return (
    <aside
      role="note"
      className={`${shell} px-3.5 py-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed ${className}`}
    >
      <p>
        ZØYA accepts returns within 14 days of delivery for items that are
        unused, unwashed, and in their original condition. For full details,
        please review our{" "}
        <Link href={RETURNS_POLICY_HREF} className={linkCls}>
          returns & refunds policy
        </Link>
        .
      </p>
    </aside>
  );
}