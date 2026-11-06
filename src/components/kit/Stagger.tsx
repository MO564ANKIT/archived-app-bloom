import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const variants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const },
  }),
};

interface StaggerProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export function StaggerItem({ children, index, className }: StaggerProps) {
  return (
    <motion.div
      custom={index}
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}
