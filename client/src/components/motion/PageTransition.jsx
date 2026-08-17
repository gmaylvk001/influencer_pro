import { motion } from "framer-motion";

/**
 * PageTransition — wraps a route's content so it fades/slides in on mount
 * and settles out on unmount. Combined with <AnimatePresence mode="wait">
 * in App.jsx, this gives cinematic page-to-page transitions instead of the
 * usual instant swap.
 */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
