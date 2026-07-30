"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

export type AnimationVariant =
  | "fade-in"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "slide-in";

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: AnimationVariant;
  duration?: number;
  delay?: number;
  distance?: number;
  once?: boolean;
  className?: string;
  amount?: number | "some" | "all";
}

const getVariantDefinitions = (distance: number): Record<AnimationVariant, Variants> => {
  return {
    "fade-in": {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    "fade-up": {
      hidden: { opacity: 0, y: distance },
      visible: { opacity: 1, y: 0 },
    },
    "fade-down": {
      hidden: { opacity: 0, y: -distance },
      visible: { opacity: 1, y: 0 },
    },
    "fade-left": {
      hidden: { opacity: 0, x: distance },
      visible: { opacity: 1, x: 0 },
    },
    "fade-right": {
      hidden: { opacity: 0, x: -distance },
      visible: { opacity: 1, x: 0 },
    },
    "zoom-in": {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    },
    "slide-in": {
      hidden: { opacity: 0, x: -distance * 1.5 },
      visible: { opacity: 1, x: 0 },
    },
  };
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = "fade-up",
  duration = 1.2,
  delay = 0,
  distance = 25,
  once = true,
  className = "",
  amount = 0.25,
}) => {
  const variants = getVariantDefinitions(distance);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Ultra-smooth luxury fashion cubic-bezier curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
