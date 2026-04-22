"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function FeaturedDropSection() {
  const ref = useRef(null);

  // scroll progress
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // parallax effects
  const scale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);

  return (
    <section ref={ref} className="relative h-[100vh] overflow-hidden">
      
      {/* Background Image (Parallax) */}
      <motion.img
        src="/images/image.png"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ scale, y }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Animated Glow */}
      <motion.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute w-[500px] h-[500px] bg-[#FF4DA3]/20 blur-[140px] rounded-full top-[20%] left-[60%]"
      />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col justify-end px-8 pb-20"
      >
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[#FF4DA3] text-xs tracking-[0.5em] uppercase"
        >
          ● New Drop 01
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-white text-6xl md:text-8xl font-[900] mt-6 leading-[0.85]"
        >
          OWN THE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-pink-300 to-[#FF4DA3] animate-gradient">
            MOMENT
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 px-10 py-4 bg-[#FF4DA3] text-white font-black uppercase tracking-[0.2em] relative overflow-hidden"
          >
            <span className="relative z-10">Shop Now</span>

            {/* shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition duration-700" />
          </motion.button>
        </motion.div>
      </motion.div>
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-b from-transparent to-white dark:to-black z-20" />
    </section>
  );
}