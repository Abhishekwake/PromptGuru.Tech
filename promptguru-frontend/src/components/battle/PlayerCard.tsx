'use client'

import { motion } from 'framer-motion'

type PlayerCardProps = {
  username: string
  score: number
  isReady?: boolean
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function PlayerCard({ username, score, isReady = false }: PlayerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 hover:border-purple-400/30 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-purple-700/70 border border-purple-400/30 grid place-items-center text-xs font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]">
            {initials(username)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{username}</p>
            <p className="text-xs text-gray-400">{isReady ? 'Answered this question' : 'Still choosing…'}</p>
          </div>
        </div>
        <div className="text-sm font-semibold text-purple-400">{score}</div>
      </div>
    </motion.div>
  )
}
