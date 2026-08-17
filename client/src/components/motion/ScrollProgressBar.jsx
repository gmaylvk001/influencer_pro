import { motion, useScroll, useSpring } from "framer-motion";

/**
 * ScrollProgressBar — thin gradient bar under the header that fills as the
 * visitor scrolls down the page. Small touch, very "premium studio site".
 */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-[image:var(--gradient-mint)]"
    />
  );
}
