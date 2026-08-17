import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Parallax — moves its children vertically at a different rate than scroll,
 * giving that Active-Theory "depth" feel. `speed` > 0 moves slower than
 * scroll (background-like), speed < 0 moves opposite direction.
 */
export function Parallax({ children, speed = 0.2, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/**
 * FloatingBlob — a soft blurred gradient shape that drifts slowly, used
 * behind hero sections for ambient movement (cheap stand-in for a WebGL
 * particle field, at zero runtime cost).
 */
export function FloatingBlob({ className = "", duration = 14, delay = 0 }) {
  return (
    <motion.div
      aria-hidden
      className={className}
      animate={{
        y: [0, -24, 0, 18, 0],
        x: [0, 16, 0, -16, 0],
        scale: [1, 1.06, 1, 0.96, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
