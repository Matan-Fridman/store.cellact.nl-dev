import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
  /** How far below the element starts before animating in (px) */
  offsetY?: number;
  className?: string;
}

/**
 * Wraps children in a Framer Motion div that fades + slides in
 * once the element enters the viewport. Fires once only.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  offsetY = 32,
  className = "",
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offsetY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
