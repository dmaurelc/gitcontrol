"use client";

import { motion, useReducedMotion } from "motion/react";

type Props = {
  children: React.ReactNode;
};

export function HeroIntroMotion({ children }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
