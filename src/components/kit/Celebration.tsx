import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/kit/Button';

interface CelebrationProps {
  open: boolean;
  title: string;
  message: string;
  reward?: string;
  onClose: () => void;
}

const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function Celebration({ open, title, message, reward, onClose }: CelebrationProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-night-950/85 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-sm rounded-3xl border-2 border-neon-400 bg-night-900 p-8 text-center shadow-glow-neon"
            initial={{ scale: 0.4, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            onClick={(event) => event.stopPropagation()}
          >
            {SPARK_ANGLES.map((angle, index) => (
              <motion.span
                key={angle}
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-sm"
                style={{ background: index % 2 === 0 ? 'var(--color-amber-400)' : 'var(--color-neon-500)' }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 150,
                  y: Math.sin((angle * Math.PI) / 180) * 150,
                  opacity: 0,
                  scale: 1.2,
                }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              />
            ))}
            <motion.div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300"
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
            >
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <p className="mt-5 font-display text-5xl font-bold uppercase leading-none text-neon-300">{title}</p>
            <p className="mt-3 text-sm text-ink-200">{message}</p>
            {reward && (
              <p className="mt-4 inline-block rounded-lg bg-amber-500/15 px-3 py-1.5 text-sm font-bold text-amber-300">{reward}</p>
            )}
            <Button variant="primary" size="lg" className="mt-7 w-full" onClick={onClose}>
              Keep going
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
