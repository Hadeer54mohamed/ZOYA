"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function FlyingImage({ src, startRect, endRect, onFinish }) {
  const [style, setStyle] = useState(null);

  useEffect(() => {
    if (!startRect || !endRect) return;

    setStyle({
      top: startRect.top,
      left: startRect.left,
      width: startRect.width,
      height: startRect.height,
    });
  }, [startRect]);

  if (!style) return null;

  return (
    <motion.img
      src={src}
      initial={{
        position: "fixed",
        top: startRect.top,
        left: startRect.left,
        width: startRect.width,
        height: startRect.height,
        borderRadius: 16,
        zIndex: 9999,
      }}
      animate={{
        top: endRect.top,
        left: endRect.left,
        width: 40,
        height: 40,
        borderRadius: "50%",
        opacity: 0.5,
      }}
      transition={{
        duration: 0.7,
        ease: "easeInOut",
      }}
      onAnimationComplete={onFinish}
    />
  );
}