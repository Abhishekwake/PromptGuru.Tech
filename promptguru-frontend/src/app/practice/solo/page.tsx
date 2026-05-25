'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/button'
import ChallengeDisplay from '@/components/battle/ChallengeDisplay'
import QuizChoices from '@/components/battle/QuizChoices'
import { fetchSessionUser, fetchSoloChallenge, type SessionUser, type SoloChallengePayload } from '@/lib/api'

const DEFAULT_TOTAL = 12

export default function SoloPracticePage() {
  const router = useRouter()
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [totalRounds, setTotalRounds] = useState(DEFAULT_TOTAL)
  const [round, setRound] = useState(1)
  const [priorStems, setPriorStems] = useState<string[]>([])
  const [payload, setPayload] = useState<SoloChallengePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent('/practice/solo')}`)
      return
    }
    fetchSessionUser(token)
      .then(setSessionUser)
      .catch(() => router.replace(`/login?redirect=${encodeURIComponent('/practice/solo')}`))
  }, [router])

  const loadRound = useCallback(async (r: number, stems: string[]) => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    setLoadError(null)
    setPickedIndex(null)
    setRevealed(false)
    try {
      const data = await fetchSoloChallenge(token, r, stems)
      setPayload(data)
      if (typeof data.totalRounds === 'number') setTotalRounds(data.totalRounds)
    } catch (e) {
      setLoadError((e as Error).message || 'Something went wrong.')
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!sessionUser) return
    void loadRound(1, [])
  }, [sessionUser, loadRound])

  const correctSlot = useMemo(() => {
    if (!payload?.choices?.length || payload.choices.length !== 4) return null
    const n = Number(payload.correctChoiceIndex)
    if (!Number.isFinite(n) || n < 0 || n > 3) return null
    return n
  }, [payload])

  const chooseAnswer = (index: number) => {
    if (revealed || pickedIndex !== null || !payload) return
    setPickedIndex(index)
    setRevealed(true)
    if (correctSlot !== null && index === correctSlot) setCorrectCount((c) => c + 1)
  }

  const goNext = () => {
    if (!payload) return
    const nextStem = [...priorStems, payload.prompt]
    if (round >= totalRounds) {
      setPriorStems([])
      setRound(1)
      setCorrectCount(0)
      void loadRound(1, [])
      return
    }
    const nextRound = round + 1
    setPriorStems(nextStem.slice(-24))
    setRound(nextRound)
    void loadRound(nextRound, nextStem)
  }

  if (!sessionUser) {
    return (
      <main className="min-h-screen bg-black text-white relative overflow-hidden font-sans antialiased">
        <motion.div
          className="absolute z-0 w-[min(100vw,520px)] h-[min(100vw,520px)] bg-purple-700/28 blur-[160px] rounded-full pointer-events-none"
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '32%', left: '50%', translateX: '-50%', translateY: '-50%' }}
        />
        <Navbar />
        <p className="relative z-10 pt-32 text-center text-sm text-gray-500">Loading…</p>
      </main>
    )
  }

  const atEndReveal = revealed && pickedIndex !== null && round >= totalRounds

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden font-sans antialiased pb-20">
      <motion.div
        className="absolute z-0 w-[min(100vw,600px)] h-[min(100vw,600px)] max-w-[600px] max-h-[600px] bg-purple-700/30 blur-[180px] rounded-full pointer-events-none"
        animate={{ x: [0, 18, -18, 0], y: [0, -14, 14, 0], scale: [1, 1.03, 1, 0.99, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '30%', left: '50%', translateX: '-50%', translateY: '-50%' }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <section className="max-w-lg mx-auto px-4 sm:px-6 pt-24 md:pt-32 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Practice</h1>
              <p className="text-sm text-gray-400 mt-0.5">12 drills · your speed</p>
            </div>
            <Link
              href="/battle"
              className="text-sm font-medium text-purple-400 hover:text-purple-300 transition shrink-0"
            >
              Battle →
            </Link>
          </motion.div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 tabular-nums text-gray-300">
              <span className="text-white font-semibold">{round}</span>
              <span className="text-gray-600 mx-0.5">/</span>
              <span>{totalRounds}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-300">
              <span className="text-white font-semibold tabular-nums">{correctCount}</span>
              <span className="text-gray-500 text-xs ml-1.5">right</span>
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[40%] sm:max-w-none">{sessionUser.name}</span>
          </div>

          {loadError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/25 px-3 py-2 text-sm text-red-300 flex flex-wrap items-center gap-2">
              <span>{loadError}</span>
              <button type="button" className="text-white underline text-xs font-medium" onClick={() => void loadRound(round, priorStems)}>
                Retry
              </button>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-gray-500 py-16"
              >
                Loading…
              </motion.p>
            ) : payload ? (
              <motion.div
                key={`${payload.round}-${payload.prompt.slice(0, 24)}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <ChallengeDisplay
                  round={round}
                  totalRounds={totalRounds}
                  category={payload.lesson}
                  lesson={payload.lesson}
                  prompt={payload.prompt}
                  showTimer={false}
                  subtitle="Tap the best prompt."
                />

                {!revealed ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_25px_-8px_rgba(168,85,247,0.2)]">
                    <QuizChoices choices={payload.choices} disabled={false} selectedIndex={null} onChoose={chooseAnswer} />
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-5 shadow-[0_0_25px_-8px_rgba(168,85,247,0.18)]">
                      <QuizChoices
                        choices={payload.choices}
                        disabled
                        selectedIndex={pickedIndex}
                        revealCorrectIndex={correctSlot ?? 0}
                        yourPickIndex={pickedIndex}
                        animateReveal
                        onChoose={() => {}}
                      />
                      <p className="mt-4 text-xs text-gray-500 leading-relaxed border-t border-white/10 pt-4">
                        <span className="text-purple-400 font-medium">Note · </span>
                        {payload.explainCorrect}
                      </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                      <p className="text-sm font-medium text-center sm:text-left">
                        {pickedIndex !== null && correctSlot !== null && pickedIndex === correctSlot ? (
                          <span className="text-emerald-400">Correct</span>
                        ) : (
                          <span className="text-gray-400">Keep going</span>
                        )}
                      </p>
                      <Button
                        type="button"
                        onClick={goNext}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-8 h-11 font-semibold"
                      >
                        {atEndReveal ? 'Start over' : 'Continue'}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <p key="empty" className="text-center text-sm text-gray-500 py-16">
                Nothing to show.
              </p>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}
