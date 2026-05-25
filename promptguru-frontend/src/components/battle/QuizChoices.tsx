'use client'

import { motion } from 'framer-motion'

const LABELS = ['A', 'B', 'C', 'D']

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 22 },
  },
}

type QuizChoicesProps = {
  choices: string[]
  disabled: boolean
  selectedIndex: number | null
  revealCorrectIndex?: number | null
  yourPickIndex?: number | null
  animateReveal?: boolean
  onChoose: (index: number) => void
}

export default function QuizChoices({
  choices,
  disabled,
  selectedIndex,
  revealCorrectIndex,
  yourPickIndex,
  animateReveal,
  onChoose,
}: QuizChoicesProps) {
  return (
    <motion.div
      className="grid gap-3 sm:grid-cols-2"
      variants={animateReveal ? containerVariants : undefined}
      initial={animateReveal ? 'hidden' : undefined}
      animate={animateReveal ? 'show' : undefined}
    >
      {choices.slice(0, 4).map((text, i) => {
        const picked = selectedIndex === i
        const yourWrong =
          !!animateReveal &&
          revealCorrectIndex !== null &&
          revealCorrectIndex !== undefined &&
          yourPickIndex !== null &&
          yourPickIndex !== undefined &&
          yourPickIndex === i &&
          yourPickIndex !== revealCorrectIndex
        const isCorrectReveal = revealCorrectIndex === i
        const isWrongReveal =
          revealCorrectIndex !== null &&
          revealCorrectIndex !== undefined &&
          picked &&
          !isCorrectReveal &&
          !animateReveal

        const itemSpread = animateReveal ? { variants: itemVariants } : {}

        return (
          <motion.button
            key={i}
            type="button"
            layout
            {...itemSpread}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            animate={
              animateReveal && isCorrectReveal
                ? {
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(52, 211, 153, 0)',
                      '0 0 28px 4px rgba(52, 211, 153, 0.45)',
                      '0 0 0 0 rgba(52, 211, 153, 0)',
                    ],
                  }
                : animateReveal && yourWrong
                  ? { x: [0, -6, 6, -4, 4, 0] }
                  : {}
            }
            transition={
              animateReveal && isCorrectReveal
                ? { duration: 0.75, repeat: 2, ease: 'easeInOut' }
                : animateReveal && yourWrong
                  ? { duration: 0.45 }
                  : {}
            }
            disabled={disabled}
            onClick={() => onChoose(i)}
            className={`rounded-xl border px-4 py-4 text-left text-sm leading-relaxed transition ${
              isCorrectReveal
                ? 'border-emerald-400/80 bg-emerald-950/50 text-emerald-50 ring-2 ring-emerald-400/60 shadow-[0_0_24px_rgba(16,185,129,0.25)]'
                : yourWrong
                  ? 'border-amber-500/50 bg-amber-950/25 text-amber-50 ring-1 ring-amber-500/35'
                  : isWrongReveal
                    ? 'border-red-500/50 bg-red-950/30 text-red-100'
                    : picked
                      ? 'border-purple-400/70 bg-purple-950/50 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:border-purple-400/40 hover:shadow-[0_0_16px_-6px_rgba(168,85,247,0.3)]'
            } ${disabled ? 'cursor-default' : ''}`}
          >
            <span className="mr-2 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-white/20 bg-black/30 text-xs font-bold text-purple-300">
              {LABELS[i]}
            </span>
            {text}
            {animateReveal && isCorrectReveal ? (
              <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Correct answer ✓
              </span>
            ) : null}
            {yourWrong ? (
              <span className="mt-3 block text-xs font-medium text-amber-200/90">Your pick</span>
            ) : null}
          </motion.button>
        )
      })}
    </motion.div>
  )
}
