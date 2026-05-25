'use client'

import { Crown } from 'lucide-react'
import { motion } from 'framer-motion'

type LeaderboardPlayer = {
  username: string
  score: number
  averageResponseTime?: number
}

type LeaderboardCardProps = {
  players: LeaderboardPlayer[]
}

export default function LeaderboardCard({ players }: LeaderboardCardProps) {
  return (
    <div className="space-y-3">
      {players.map((player, index) => {
        const isTopThree = index < 3
        return (
          <motion.div
            key={player.username}
            layout
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.06 }}
            className={`rounded-xl border backdrop-blur-md p-4 ${
              isTopThree
                ? 'border-purple-400/40 bg-purple-700/15 shadow-[0_0_25px_-5px_rgba(168,85,247,0.26)]'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-purple-400 font-bold w-8">#{index + 1}</span>
                <p className="text-white font-semibold flex items-center gap-2">
                  {index === 0 && <Crown className="size-4 text-purple-400" />}
                  {player.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">{player.score} pts</p>
                <p className="text-xs text-gray-400">
                  Avg time: {player.averageResponseTime ? `${player.averageResponseTime.toFixed(1)}s` : 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
