"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  once?: boolean;
  className?: string;
  amount?: number | "some" | "all";
}

const containerVariants = (
  staggerDelay: number,
  delayChildren: number
): Variants => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.22,
  delayChildren = 0,
  once = true,
  className = "",
  amount = 0.25,
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={containerVariants(staggerDelay, delayChildren)}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  variant?: "fade-up" | "fade-in" | "zoom-in";
  className?: string;
  duration?: number;
}

const itemVariants: Record<string, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.1,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
  "zoom-in": {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
};

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  variant = "fade-up",
  className = "",
}) => {
  return (
    <motion.div variants={itemVariants[variant]} className={className}>
      {children}
    </motion.div>
  );
};
