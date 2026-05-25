'use client'

import { motion } from 'framer-motion'

type ChallengeDisplayProps = {
  round: number
  totalRounds: number
  category: string
  /** Quiz question stem (legacy name kept for minimal churn) */
  prompt: string
  lesson?: string
  timeLeftMs?: number
  /** Under ~6s — pulse countdown */
  urgent?: boolean
  /** Hide countdown chip (solo practice reads at own pace). */
  showTimer?: boolean
  /** Overrides the subtitle under the lesson header row. */
  subtitle?: string
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function prettyTopicSlug(slug: string | undefined): string {
  if (!slug) return ''
  return slug.replace(/_/g, ' ')
}

export default function ChallengeDisplay({
  round,
  totalRounds,
  category,
  prompt,
  lesson,
  timeLeftMs = 0,
  urgent = false,
  showTimer = true,
  subtitle,
}: ChallengeDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-4 sm:p-5 shadow-[0_0_25px_-5px_rgba(168,85,247,0.26)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-300">
          Lesson <span className="text-white font-semibold">{round}</span> / {totalRounds}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-700 text-purple-100 border border-purple-400/30">
            {prettyTopicSlug(lesson || category)}
          </span>
          {showTimer ? (
            <span
              className={`text-lg font-bold tabular-nums ${
                urgent
                  ? 'text-red-400 drop-shadow-[0_0_14px_rgba(248,113,113,0.55)] animate-pulse'
                  : 'text-purple-400'
              }`}
            >
              {formatTime(timeLeftMs)}
            </span>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-purple-700/40 border border-purple-400/35 text-purple-200">
              Your pace
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {subtitle ?? (urgent ? 'Hurry — pick your best guess.' : 'Pick the strongest option.')}
      </p>
      <p className="text-white leading-snug sm:leading-relaxed text-base sm:text-lg">{prompt}</p>
    </motion.div>
  )
}
