"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { HERO_BG_DESKTOP, HERO_BG_MOBILE } from "../lib/heroImages";
import { lazyImageProps } from "../lib/imageLoading";

const heroImgBase = {
  alt: "ZOYA Drop 01 collection",
  fill: true,
  className: "object-cover object-center",
};

const heroImgMobile = { ...heroImgBase, sizes: "100vw", ...lazyImageProps() };
const heroImgDesktop = { ...heroImgBase, sizes: "100vw", ...lazyImageProps() };

export default function FeaturedDropSection() {
  const ref = useRef(null);
  const router = useRouter();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={ref}
        className="relative h-[min(68svh,560px)] overflow-hidden md:h-[100svh]"
      >
        <div className="absolute inset-0 md:hidden">
          <Image src={HERO_BG_MOBILE} {...heroImgMobile} />
        </div>

        <m.div
          className="absolute inset-0 hidden md:block"
          style={{ scale, y }}
        >
          <Image src={HERO_BG_DESKTOP} {...heroImgDesktop} />
        </m.div>

        <div
          className="drop-glow pointer-events-none absolute top-[20%] left-[55%] h-[min(320px,70vw)] w-[min(320px,70vw)] rounded-full bg-[#FF4DA3]/20 blur-[100px] md:hidden"
          aria-hidden
        />
        <m.div
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="pointer-events-none absolute top-[20%] left-[60%] hidden h-[500px] w-[500px] rounded-full bg-[#FF4DA3]/20 blur-[140px] md:block"
          aria-hidden
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="drop-content relative z-10 flex h-full flex-col justify-end px-4 pb-14 sm:px-8 sm:pb-20">
          <m.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-xs tracking-[0.5em] text-[#FF4DA3] uppercase"
          >
            ● New Drop 01
          </m.p>

          <m.h2
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-4 text-4xl leading-[0.85] font-[900] text-white sm:mt-6 sm:text-6xl md:text-8xl"
          >
            OWN THE <br />
            <span className="animate-gradient bg-gradient-to-r from-[#FF4DA3] via-pink-300 to-[#FF4DA3] bg-[length:200%_auto] bg-clip-text text-transparent">
              MOMENT
            </span>
          </m.h2>

          <m.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <m.button
              type="button"
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              className="relative mt-8 overflow-hidden bg-[#FF4DA3] px-10 py-4 font-black tracking-[0.2em] text-white uppercase"
              onClick={() => router.push("/products")}
            >
              <span className="relative z-10">Shop Now</span>
              <m.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.7 }}
              />
            </m.button>
          </m.div>
        </div>

        <div
          className="absolute bottom-0 left-0 z-20 h-20 w-full bg-gradient-to-b from-transparent to-white dark:to-black"
          aria-hidden
        />
      </section>
    </LazyMotion>
  );
}
