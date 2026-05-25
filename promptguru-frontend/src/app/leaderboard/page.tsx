'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/button'
import { getPublicApiBase } from '@/lib/api'

type LeaderboardEntry = {
  userId: string
  username: string
  rank: number
  totalGamesPlayed: number
  wins: number
  totalScore: number
  averageScore: number
  highestScore: number
  recentScores: number[]
}

type UserStats = {
  userId: string
  username: string
  rank: number
  totalGamesPlayed: number
  wins: number
  winRate: number
  totalScore: number
  averageScore: number
  highestScore: number
}

type Timeframe = 'all' | 'week' | 'month'

const PAGE_SIZE = 10

function getUserIdFromToken() {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const json = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')))
    return json.id || null
  } catch {
    return null
  }
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
    </div>
  )
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const paginatedEntries = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page]
  )

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const base = getPublicApiBase()
        const res = await fetch(`${base}/api/battle/leaderboard?limit=50&timeframe=${timeframe}`)
        if (!res.ok) {
          setFetchError('Could not load rankings.')
          setEntries([])
          return
        }
        const json = await res.json()
        setEntries(Array.isArray(json.data) ? json.data : [])
      } catch {
        setEntries([])
        setFetchError('Connection error.')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
    setPage(1)
  }, [timeframe])

  useEffect(() => {
    const fetchStats = async () => {
      const userId = getUserIdFromToken()
      if (!userId) {
        setUserStats(null)
        return
      }
      try {
        const base = getPublicApiBase()
        const res = await fetch(`${base}/api/battle/user-stats/${userId}`)
        if (!res.ok) {
          setUserStats(null)
          return
        }
        setUserStats(await res.json())
      } catch {
        setUserStats(null)
      }
    }
    fetchStats()
  }, [])

  const tabs: { id: Timeframe; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ]

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden font-sans antialiased pb-16">
      <motion.div
        className="absolute z-0 w-[min(100vw,600px)] h-[min(100vw,600px)] max-w-[600px] max-h-[600px] bg-purple-700/30 blur-[180px] rounded-full pointer-events-none"
        animate={{ x: [0, 20, -20, 0], y: [0, -16, 16, 0], scale: [1, 1.04, 1, 0.98, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '28%', left: '50%', translateX: '-50%', translateY: '-50%' }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 space-y-4">
          {fetchError && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/25 px-3 py-2 text-sm text-red-300">{fetchError}</div>
          )}

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
              <p className="text-sm text-gray-400 mt-0.5">Top battle scores</p>
            </div>
            <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 w-fit shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeframe(tab.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    timeframe === tab.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {userStats && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-[0_0_25px_-5px_rgba(168,85,247,0.22)]">
              <p className="text-xs font-semibold text-purple-400 mb-3">You</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatChip label="Rank" value={userStats.rank ? `#${userStats.rank}` : '—'} />
                <StatChip label="Games" value={userStats.totalGamesPlayed} />
                <StatChip label="Win %" value={`${userStats.winRate}%`} />
                <StatChip label="Avg" value={userStats.averageScore} />
              </div>
            </motion.div>
          )}

          {/* Mobile — compact list */}
          <div className="md:hidden space-y-2">
            {loading ? (
              <p className="text-sm text-gray-500 py-10 text-center">Loading…</p>
            ) : paginatedEntries.length === 0 ? (
              <p className="text-sm text-gray-500 py-10 text-center">No data yet.</p>
            ) : (
              paginatedEntries.map((entry) => (
                <div
                  key={entry.userId}
                  className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 flex items-center gap-3 ${
                    entry.rank <= 3 ? 'ring-1 ring-purple-500/20' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-700/40 text-sm font-bold text-white tabular-nums gap-0.5">
                    {entry.rank === 1 ? <Crown className="size-4 text-amber-300 shrink-0" aria-hidden /> : null}
                    {entry.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{entry.username}</p>
                    <p className="text-xs text-gray-500">
                      {entry.wins} wins · {entry.totalGamesPlayed} games
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-semibold tabular-nums text-white">{entry.totalScore}</p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">pts</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tablet+ — table */}
          <div className="hidden md:block rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-[0_0_25px_-5px_rgba(168,85,247,0.18)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 w-14">#</th>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3 text-right tabular-nums">Games</th>
                    <th className="px-4 py-3 text-right tabular-nums">Wins</th>
                    <th className="px-4 py-3 text-right tabular-nums font-medium text-gray-300">Pts</th>
                    <th className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">Avg</th>
                    <th className="px-4 py-3 text-right tabular-nums hidden xl:table-cell">Best</th>
                    <th className="px-4 py-3 hidden lg:table-cell min-w-[7rem]">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-10 text-gray-500 text-center" colSpan={8}>
                        Loading…
                      </td>
                    </tr>
                  ) : paginatedEntries.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-gray-500 text-center" colSpan={8}>
                        No data yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry) => (
                      <tr key={entry.userId} className="border-b border-white/10 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-4 py-3 text-purple-400 font-semibold tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            {entry.rank === 1 && <Crown className="size-3.5 text-amber-300 shrink-0" />}
                            {entry.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]">{entry.username}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-300">{entry.totalGamesPlayed}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-300">{entry.wins}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-white">{entry.totalScore}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-400 hidden lg:table-cell">{entry.averageScore}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-400 hidden xl:table-cell">{entry.highestScore}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="h-9 w-24 ml-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={(entry.recentScores || []).map((score, i) => ({ i: i + 1, score }))}>
                                <Tooltip
                                  contentStyle={{
                                    background: 'rgba(0,0,0,0.88)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                  }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!loading && entries.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-500 tabular-nums">
                {page}/{totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 h-9 px-3"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white h-9 px-3"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
