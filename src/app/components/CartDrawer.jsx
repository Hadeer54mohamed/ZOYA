"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { X, ShoppingBag, Trash2, ArrowRight, Minus, Plus, Pencil, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CartDrawer() {
    const {
        cart,
        isCartOpen,
        setIsCartOpen,
        removeFromCart,
        updateQuantity,
        updateVariant,
        cartTotal,
        cartCount,
    } = useCart();

    const [editingKey, setEditingKey] = useState(null);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.15 },
        },
    };
    const router = useRouter();

    const handleCheckout = () => {
      if (!cart || cart.length === 0) {
        alert("Your bag is empty");
        return;
      }

      setIsCartOpen(false);
      router.push("/checkout");
    };
    const itemVariants = {
        hidden: { opacity: 0, x: 30, scale: 0.96 },
        show: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div
                        onClick={() => setIsCartOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, pointerEvents: "none" }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0, scale: 0.98 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                            opacity: { duration: 0.3 },
                        }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white/95 dark:bg-[#0A0A0A]/90 backdrop-blur-xl border-l border-black/10 dark:border-white/5 z-[70] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                            className="p-6 border-b border-black/10 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]"
                        >
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-pink-500" />
                                <h2 className="text-black dark:text-white text-xl font-medium tracking-tight">
                                    Your Cart{" "}
                                    <span className="text-black/40 dark:text-white/30 text-sm ml-2">
                                        ({cartCount})
                                    </span>
                                </h2>
                            </div>

                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {cart.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-4"
                                >
                                    <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                        <ShoppingBag className="w-10 h-10 text-black/20 dark:text-white/20" />
                                    </div>
                                    <p className="text-black/50 dark:text-white/40 font-light">
                                        Your bag is empty... but not for long 🖤
                                    </p>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="text-pink-500 text-sm font-medium hover:underline"
                                    >
                                        Continue Shopping
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="space-y-4"
                                >
                                    <AnimatePresence initial={false}>
                                        {cart.map((item) => {
                                            const rowKey = `${item.id}-${item.color.name}-${item.size}`;
                                            const isEditing = editingKey === rowKey;
                                            const colors = item.availableColors ?? [];
                                            const sizes = item.availableSizes ?? [];
                                            const canEdit = colors.length > 1 || sizes.length > 1;
                                            return (
                                                <motion.div
                                                    key={rowKey}
                                                    layout
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="show"
                                                    exit={{
                                                        opacity: 0,
                                                        x: 60,
                                                        scale: 0.9,
                                                        filter: "blur(6px)",
                                                        transition: { duration: 0.25 }
                                                    }}
                                                    className="group relative bg-black/[0.03] dark:bg-white/[0.03] 
                                                    hover:bg-black/[0.06] dark:hover:bg-white/[0.06] 
                                                    border border-black/10 dark:border-white/5 
                                                    p-3 rounded-2xl transition-all duration-300 
                                                    hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                                                >
                                                    <div className="flex gap-4">
                                                        <div className="relative w-24 h-28 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                                                            <Image
                                                                width={100}
                                                                height={100}
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            />
                                                        </div>

                                                        <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                                                            <div>
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <h3 className="text-black dark:text-white/90 text-[15px] font-medium leading-snug line-clamp-1">
                                                                        {item.name}
                                                                    </h3>
                                                                    <div className="flex items-center gap-1">
                                                                        {canEdit && (
                                                                            <button
                                                                                onClick={() =>
                                                                                    setEditingKey(isEditing ? null : rowKey)
                                                                                }
                                                                                aria-label={isEditing ? "Done editing" : "Edit color or size"}
                                                                                aria-expanded={isEditing}
                                                                                className={`p-1.5 rounded-full transition-colors ${
                                                                                    isEditing
                                                                                        ? "bg-[#FF4DA3]/15 text-[#FF4DA3]"
                                                                                        : "text-black/30 dark:text-white/30 hover:text-[#FF4DA3] hover:bg-[#FF4DA3]/10"
                                                                                }`}
                                                                            >
                                                                                {isEditing ? (
                                                                                    <Check size={15} />
                                                                                ) : (
                                                                                    <Pencil size={14} />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() =>
                                                                                removeFromCart(
                                                                                    item.id,
                                                                                    item.color.name,
                                                                                    item.size
                                                                                )
                                                                            }
                                                                            aria-label="Remove item"
                                                                            className="p-1.5 rounded-full text-black/30 dark:text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-black/50 dark:text-white/40 text-xs mt-1 uppercase tracking-wider flex items-center gap-2">
                                                                    <span
                                                                        className="inline-block w-3 h-3 rounded-full border border-black/20 dark:border-white/20"
                                                                        style={{
                                                                            backgroundColor: item.color.value,
                                                                        }}
                                                                    />
                                                                    {item.color.name} • Size {item.size}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-end justify-between mt-2">
                                                                <div className="flex items-center bg-black/5 dark:bg-black/40 rounded-lg border border-black/10 dark:border-white/5">
                                                                    <button
                                                                        onClick={() =>
                                                                            updateQuantity(
                                                                                item.id,
                                                                                item.color.name,
                                                                                item.size,
                                                                                item.quantity - 1
                                                                            )
                                                                        }
                                                                        disabled={item.quantity === 1}
                                                                        className={`w-8 h-8 grid place-items-center transition ${item.quantity === 1
                                                                            ? "opacity-30 cursor-not-allowed"
                                                                            : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                                                            }`}
                                                                    >
                                                                        <Minus size={13} />
                                                                    </button>
                                                                    <motion.span
                                                                        key={item.quantity}
                                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                                        animate={{ scale: 1, opacity: 1 }}
                                                                        className="w-8 text-center text-black dark:text-white/90 text-sm font-medium"
                                                                    >
                                                                        {item.quantity}
                                                                    </motion.span>
                                                                    <button
                                                                        onClick={() =>
                                                                            updateQuantity(
                                                                                item.id,
                                                                                item.color.name,
                                                                                item.size,
                                                                                item.quantity + 1
                                                                            )
                                                                        }
                                                                        aria-label="Increase"
                                                                        className="w-8 h-8 grid place-items-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-r-lg transition"
                                                                    >
                                                                        <Plus size={13} />
                                                                    </button>
                                                                </div>
                                                                <motion.span
                                                                    key={item.quantity}
                                                                    initial={{ opacity: 0, y: 5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className="text-black dark:text-white font-semibold text-base"
                                                                >
                                                                    EGP {(item.price * item.quantity).toFixed(2)}
                                                                </motion.span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <AnimatePresence initial={false}>
                                                        {isEditing && (
                                                            <motion.div
                                                                key="variant-editor"
                                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pt-3 border-t border-black/10 dark:border-white/5 space-y-4">
                                                                    {colors.length > 1 && (
                                                                        <div className="space-y-2">
                                                                            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                                                                                Color
                                                                            </p>
                                                                            <div className="flex gap-2 flex-wrap">
                                                                                {colors.map((c) => {
                                                                                    const active = c.name === item.color.name;
                                                                                    return (
                                                                                        <button
                                                                                            key={c.name}
                                                                                            onClick={() =>
                                                                                                updateVariant(
                                                                                                    item.id,
                                                                                                    item.color.name,
                                                                                                    item.size,
                                                                                                    { newColor: c }
                                                                                                )
                                                                                            }
                                                                                            aria-label={c.name}
                                                                                            title={c.name}
                                                                                            className={`w-8 h-8 rounded-full border-2 grid place-items-center transition-all ${
                                                                                                active
                                                                                                    ? "border-[#FF4DA3] scale-110"
                                                                                                    : "border-transparent hover:border-black/30 dark:hover:border-white/30"
                                                                                            }`}
                                                                                        >
                                                                                            <span
                                                                                                className="w-5 h-5 rounded-full ring-1 ring-black/10 dark:ring-white/10"
                                                                                                style={{ backgroundColor: c.value }}
                                                                                            />
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {sizes.length > 1 && (
                                                                        <div className="space-y-2">
                                                                            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                                                                                Size
                                                                            </p>
                                                                            <div className="flex gap-2 flex-wrap">
                                                                                {sizes.map((s) => {
                                                                                    const active = s === item.size;
                                                                                    return (
                                                                                        <button
                                                                                            key={s}
                                                                                            onClick={() =>
                                                                                                updateVariant(
                                                                                                    item.id,
                                                                                                    item.color.name,
                                                                                                    item.size,
                                                                                                    { newSize: s }
                                                                                                )
                                                                                            }
                                                                                            className={`min-w-[2.25rem] h-9 px-2 rounded-md border text-xs font-bold transition-all ${
                                                                                                active
                                                                                                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                                                                                                    : "border-black/10 dark:border-white/10 hover:border-black/40 dark:hover:border-white/40 text-black/70 dark:text-white/70"
                                                                                            }`}
                                                                                        >
                                                                                            {s}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
                                className="p-6 border-t border-black/10 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] space-y-4"
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between text-black/60 dark:text-white/50 text-sm">
                                        <span>Subtotal</span>
                                        <span>EGP {cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-black dark:text-white text-lg font-medium">
                                        <span>Total</span>
                                        <span className="text-pink-500">
                                            EGP {cartTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="relative group w-full bg-[#FF4DA3] overflow-hidden text-white py-4 rounded-xl font-bold transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_40px_rgba(255,77,163,0.5)]"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Proceed to Checkout
                                        <ArrowRight
                                            size={18}
                                            className="group-hover:translate-x-1 transition-transform"
                                        />
                                    </span>

                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                </button>

                                <p className="text-[10px] text-center text-black/40 dark:text-white/20 uppercase tracking-[0.2em]">
                                    Secure encrypted checkout
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
