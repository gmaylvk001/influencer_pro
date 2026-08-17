import { motion } from "framer-motion";

const DIRECTIONS = {
  up: { y: 32, x: 0 },
  down: { y: -32, x: 0 },
  left: { y: 0, x: 32 },
  right: { y: 0, x: -32 },
  none: { y: 0, x: 0 },
};

/**
 * Reveal — fades + slides children in as they enter the viewport.
 * Active-Theory-style: content stays hidden/settled until scrolled into view,
 * then eases in with a slight overshoot.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  className = "",
  once = true,
  amount = 0.2,
  scale = false,
  as: Tag = motion.div,
}) {
  const offset = DIRECTIONS[direction] || DIRECTIONS.up;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, ...offset, scale: scale ? 0.94 : 1 }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}

/**
 * RevealGroup — staggers its direct children in on scroll.
 * Wrap a row/grid of cards with this and each card fades up in sequence.
 */
export function RevealGroup({ children, className = "", stagger = 0.08, amount = 0.15 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className = "", direction = "up", scale = false }) {
  const offset = DIRECTIONS[direction] || DIRECTIONS.up;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, ...offset, scale: scale ? 0.94 : 1 },
        show: {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
