import type { Transition, Variants } from "framer-motion";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const springTransition: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: EASE_OUT },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay, ease: EASE_OUT },
  }),
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay, ease: EASE_OUT },
  }),
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const floatAnimation = {
  y: [-12, 12, -12],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export const floatAnimationSlow = {
  y: [-8, 16, -8],
  x: [-6, 6, -6],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export const pulseGlow = {
  scale: [1, 1.08, 1],
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
