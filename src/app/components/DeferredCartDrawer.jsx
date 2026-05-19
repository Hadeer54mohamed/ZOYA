"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useCart } from "../context/CartContext";

const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

/** Loads cart UI only after the user opens the cart (smaller home bundle). */
export default function DeferredCartDrawer() {
  const { isCartOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isCartOpen) setMounted(true);
  }, [isCartOpen]);

  if (!mounted) return null;
  return <CartDrawer />;
}
