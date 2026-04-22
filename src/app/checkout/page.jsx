"use client";

import { useCart } from "../context/CartContext";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; 
import { CheckCircle2, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
  const { cart, clearCart, cartTotal, setIsCartOpen } = useCart();
  const router = useRouter();

  useEffect(() => {
    setIsCartOpen(false);
  }, [setIsCartOpen]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const isFormValid = useMemo(() => {
    return form.name.length > 2 && form.phone.length >= 11 && form.address.length > 10;
  }, [form]);

  const handleNext = () => {
    if (isFormValid) setStep(2);
  };

  const handleOrder = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      clearCart();
    }, 2000);
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-[#FF4DA3]/5 rounded-full"
            />
            <ShoppingBag size={48} strokeWidth={1} className="text-black/20 dark:text-white/20" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif italic tracking-tight">Your Wardrobe is Awaiting</h1>
            <p className="text-sm text-black/40 dark:text-white/40 max-w-[280px] mx-auto leading-relaxed">
              It seems you haven't added any pieces to your collection yet.
            </p>
          </div>

          <button 
            onClick={() => router.push("/")}
            className="group relative px-12 py-4 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-[0.2em] overflow-hidden transition-all"
          >
            <span className="relative z-10">Explore Collection</span>
            <motion.div 
              className="absolute inset-0 bg-[#FF4DA3]"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ type: "tween" }}
            />
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-500">
      {/* STEP INDICATOR */}
      <div className="pt-32 pb-10 flex justify-center items-center gap-4 text-[10px] tracking-[0.3em] uppercase font-medium">
        <span className={`${step >= 1 ? "text-[#FF4DA3]" : "text-black/20 dark:text-white/20"} transition-colors`}>Information</span>
        <div className="w-8 h-[1px] bg-black/10 dark:bg-white/10" />
        <span className={`${step >= 2 ? "text-[#FF4DA3]" : "text-black/20 dark:text-white/20"} transition-colors`}>Review</span>
        <div className="w-8 h-[1px] bg-black/10 dark:bg-white/10" />
        <span className={`${step === 3 ? "text-[#FF4DA3]" : "text-black/20 dark:text-white/20"} transition-colors`}>Confirmation</span>
      </div>

      <section className={`px-6 max-w-6xl mx-auto grid gap-16 ${step === 3 ? "md:grid-cols-1" : "md:grid-cols-12"}`}>
        
        {/* LEFT COLUMN: Forms (7 cols) / Full width on confirmation */}
        <div className={step === 3 ? "w-full" : "md:col-span-7"}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-5xl font-serif italic mb-2">Shipping</h1>
                  <p className="text-black/50 dark:text-white/40">Please enter your delivery details.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Hadeer Mohamed"
                      className="w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3] outline-none transition-all"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="0123 456 7890"
                      className="w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3] outline-none transition-all"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest ml-1">Detailed Address</label>
                    <textarea
                      rows={3}
                      placeholder="Street, Building, Apartment..."
                      className="w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 focus:border-[#FF4DA3] focus:ring-1 focus:ring-[#FF4DA3] outline-none transition-all resize-none"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!isFormValid}
                  className="w-full py-5 rounded-2xl bg-[#FF4DA3] text-white font-bold tracking-widest uppercase text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Continue to Review
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm text-black/50 dark:text-white/40 hover:text-[#FF4DA3] transition-colors"
                >
                  <ArrowLeft size={16} /> Edit Info
                </button>

                <div>
                  <h1 className="text-5xl font-serif italic mb-2">Final Review</h1>
                  <p className="text-black/50 dark:text-white/40">Check your details before confirming.</p>
                </div>

                <div className="p-8 rounded-3xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-4">
                   <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-4">
                      <span className="text-sm opacity-50 font-light">Deliver to</span>
                      <span className="text-sm font-medium">{form.name}</span>
                   </div>
                   <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-4">
                      <span className="text-sm opacity-50 font-light">Contact</span>
                      <span className="text-sm font-medium">{form.phone}</span>
                   </div>
                   <div className="flex flex-col gap-2">
                      <span className="text-sm opacity-50 font-light">Address</span>
                      <span className="text-sm font-medium leading-relaxed">{form.address}</span>
                   </div>
                </div>

                <button
                  onClick={handleOrder}
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold tracking-widest uppercase text-sm transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} /> Processing Order...</>
                  ) : (
                    "Place Order Now"
                  )}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-[60vh] w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-16 space-y-6"
              >
                <div className="relative">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.2 }}
                        className="absolute inset-0 bg-[#FF4DA3]/20 rounded-full blur-2xl"
                    />
                    <CheckCircle2 size={80} className="text-[#FF4DA3] relative z-10" strokeWidth={1} />
                </div>
                
                <h1 className="text-5xl font-serif italic">Merci, {form.name.split(' ')[0]}!</h1>
                <p className="text-black/50 dark:text-white/40 max-w-sm leading-relaxed">
                  Your order has been received and is being prepared with care. 
                  You will receive a confirmation call shortly.
                </p>

                <button
                  onClick={() => router.push("/")}
                  className="px-10 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold tracking-tighter hover:scale-105 transition-transform"
                >
                  Return to Store
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Order Summary (5 cols) */}
        {step < 3 && (
            <div className="md:col-span-5">
              <div className="sticky top-32 p-8 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 mb-8 border-b border-black/5 dark:border-white/5 pb-4">
                   <ShoppingBag size={18} className="text-[#FF4DA3]" />
                   <h2 className="text-lg font-medium tracking-tight">Order Summary</h2>
                </div>

                <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.color.name}`} className="flex gap-4 items-center">
                      <div className="w-16 h-20 bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-sm">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-[10px] opacity-40 uppercase tracking-tighter mt-0.5">
                          {item.color.name} / {item.size} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium">EGP {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 space-y-4">
                  <div className="flex justify-between text-sm opacity-50">
                    <span>Shipping</span>
                    <span>Calculated at next step</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-serif italic">Total</span>
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-[#FF4DA3]">
                          EGP {cartTotal.toLocaleString()}
                        </span>
                        <span className="text-[10px] opacity-30 uppercase tracking-widest">Including VAT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

      </section>
    </main>
  );
}