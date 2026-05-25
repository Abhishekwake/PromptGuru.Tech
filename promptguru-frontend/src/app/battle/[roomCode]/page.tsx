'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { Copy } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PromptGuruShell from '@/components/PromptGuruShell'
import { Button } from '@/components/button'
import { getSocket } from '@/lib/socket'
import { fetchSessionUser, getPublicApiBase, type SessionUser } from '@/lib/api'
import PlayerCard from '@/components/battle/PlayerCard'
import LeaderboardCard from '@/components/battle/LeaderboardCard'
import ChallengeDisplay from '@/components/battle/ChallengeDisplay'
import QuizChoices from '@/components/battle/QuizChoices'

type BattleState = 'WAITING' | 'ACTIVE' | 'ROUND_END' | 'FINISHED'

type Player = {
  username: string
  score: number
  socketId: string
}

type Challenge = {
  round: number
  category: string
  lesson?: string
  quizMode?: boolean
  prompt: string
  choices: string[]
  durationMs: number
  totalRounds?: number
}

type QuizReveal = {
  question: string
  choices: string[]
  correctIndex: number
  explainCorrect: string
  lesson: string
}

type RoundScore = {
  username: string
  score: number
  baseScore: number
  speedBonus: number
  choiceIndex?: number
  selectedLabel?: string
  judge?: {
    clarity: number
    creativity: number
    effectiveness: number
    feedback: string
  }
}

const DEFAULT_TOTAL_ROUNDS = 12
/** Client default; server sends `challenge.durationMs` (45s quiz duel) */
const DEFAULT_QUESTION_MS = 45_000

export default function BattleRoomPage() {
  const params = useParams<{ roomCode: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomCode = String(params.roomCode || '').toUpperCase()
  const isHost = searchParams.get('host') === '1'

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [gameState, setGameState] = useState<BattleState>('WAITING')
  const [players, setPlayers] = useState<Player[]>([])
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [roundNumber, setRoundNumber] = useState(1)
  const [totalRoundsUI, setTotalRoundsUI] = useState(DEFAULT_TOTAL_ROUNDS)
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [timeLeftMs, setTimeLeftMs] = useState(DEFAULT_QUESTION_MS)
  const [submittedPlayersThisRound, setSubmittedPlayersThisRound] = useState<string[]>([])
  const [lastRoundScores, setLastRoundScores] = useState<RoundScore[]>([])
  const [quizReveal, setQuizReveal] = useState<QuizReveal | null>(null)
  const [leaderboard, setLeaderboard] = useState<{ username: string; score: number }[]>([])
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [winner, setWinner] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [roundHeroes, setRoundHeroes] = useState<string[]>([])
  const [celebration, setCelebration] = useState<'none' | 'correct_pick' | 'round_win'>('none')

  const challengeStartRef = useRef<number>(Date.now())
  const joinedRoomRef = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(`/battle/${roomCode}`)}`)
      return
    }
    fetchSessionUser(token)
      .then(setSessionUser)
      .catch(() => router.replace(`/login?redirect=${encodeURIComponent(`/battle/${roomCode}`)}`))
  }, [roomCode, router])

  useEffect(() => {
    if (!sessionUser || !roomCode) return

    joinedRoomRef.current = false

    const socket = getSocket()
    if (!socket.connected) socket.connect()

    const onPlayerList = (payload: {
      players: Player[]
      state?: BattleState | 'WAITING' | 'ACTIVE' | 'FINISHED'
      currentRound?: number
    }) => {
      setPlayers(payload.players || [])
      setLeaderboard(
        [...(payload.players || [])]
          .sort((a, b) => b.score - a.score)
          .map((p) => ({ username: p.username, score: p.score }))
      )
      if (
        payload.state === 'WAITING' ||
        payload.state === 'ACTIVE' ||
        payload.state === 'FINISHED'
      ) {
        setGameState(payload.state)
      }
      if (payload.currentRound) setRoundNumber(payload.currentRound)
    }

    const onGameStarted = (payload: { totalRounds?: number; roundDurationMs?: number }) => {
      setGameState('ACTIVE')
      if (payload.totalRounds) setTotalRoundsUI(payload.totalRounds)
      setStatusMessage(
        payload.totalRounds
          ? `Duel on! ${payload.totalRounds} lessons • ${Math.round((payload.roundDurationMs ?? DEFAULT_QUESTION_MS) / 1000)}s each`
          : 'Quiz started'
      )
      setSubmitted(false)
      setSubmittedPlayersThisRound([])
      setQuizReveal(null)
      setRoundHeroes([])
      setCelebration('none')
    }

    const onChallengeNew = (payload: Challenge) => {
      const choices = Array.isArray(payload.choices) ? payload.choices : []
      setChallenge({ ...payload, choices })
      setRoundNumber(payload.round)
      if (payload.totalRounds) setTotalRoundsUI(payload.totalRounds)
      setPickedIndex(null)
      setSubmitted(false)
      setSubmittedPlayersThisRound([])
      setQuizReveal(null)
      setRoundHeroes([])
      setCelebration('none')
      setGameState('ACTIVE')
      setTimeLeftMs(payload.durationMs ?? DEFAULT_QUESTION_MS)
      challengeStartRef.current = Date.now()
    }

    const onRoundScored = (
      payload: RoundScore & { username: string; isCorrect?: boolean }
    ) => {
      setSubmittedPlayersThisRound((prev) =>
        prev.includes(payload.username) ? prev : [...prev, payload.username]
      )
      if (sessionUser && payload.username === sessionUser.name && payload.isCorrect === true) {
        setCelebration('correct_pick')
      }
    }

    const onRoundEnded = (payload: {
      results?: RoundScore[]
      leaderboard?: { username: string; score: number }[]
      quizReveal?: QuizReveal
      roundHeroes?: string[]
    }) => {
      if (payload.results?.length) {
        setLastRoundScores(payload.results.slice().sort((a, b) => b.score - a.score))
      }
      if (payload.leaderboard?.length) {
        setLeaderboard(payload.leaderboard)
      }
      setQuizReveal(payload.quizReveal ?? null)
      const heroes = payload.roundHeroes ?? []
      setRoundHeroes(heroes)
      if (sessionUser && heroes.includes(sessionUser.name)) {
        setCelebration('round_win')
      }
      setGameState('ROUND_END')
    }

    const onLeaderboard = (payload: { leaderboard: { username: string; score: number }[] }) => {
      setLeaderboard(payload.leaderboard || [])
    }

    const onEnded = (payload: {
      winner: string
      leaderboard: { username: string; score: number }[]
    }) => {
      setWinner(payload.winner || '')
      setLeaderboard(payload.leaderboard || [])
      setGameState('FINISHED')
    }

    const onError = (payload: { message: string }) => setStatusMessage(payload.message || 'Unexpected error')

    const onConnectError = (err: Error) => {
      const m = String(err?.message || '')
      if (m.includes('UNAUTHORIZED')) {
        setStatusMessage('Not authorized — log in again.')
        router.replace(`/login?redirect=${encodeURIComponent(`/battle/${roomCode}`)}`)
        return
      }
      setStatusMessage(`Cannot reach game server (${getPublicApiBase()}).`)
    }

    const doJoin = () => {
      if (joinedRoomRef.current) return
      joinedRoomRef.current = true
      socket.emit('room:join', { roomCode })
    }

    socket.on('room:player_list', onPlayerList)
    socket.on('game:started', onGameStarted)
    socket.on('challenge:new', onChallengeNew)
    socket.on('round:scored', onRoundScored)
    socket.on('round:ended', onRoundEnded)
    socket.on('leaderboard:updated', onLeaderboard)
    socket.on('game:ended', onEnded)
    socket.on('connect_error', onConnectError)
    socket.on('error', onError)

    if (socket.connected) {
      doJoin()
    } else {
      socket.once('connect', doJoin)
    }

    return () => {
      socket.off('room:player_list', onPlayerList)
      socket.off('game:started', onGameStarted)
      socket.off('challenge:new', onChallengeNew)
      socket.off('round:scored', onRoundScored)
      socket.off('round:ended', onRoundEnded)
      socket.off('leaderboard:updated', onLeaderboard)
      socket.off('game:ended', onEnded)
      socket.off('connect_error', onConnectError)
      socket.off('error', onError)
      socket.off('connect', doJoin)
    }
  }, [roomCode, router, sessionUser])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (gameState !== 'ACTIVE') return
      const elapsed = Date.now() - challengeStartRef.current
      const next = Math.max(0, (challenge?.durationMs ?? DEFAULT_QUESTION_MS) - elapsed)
      setTimeLeftMs(next)
    }, 250)
    return () => window.clearInterval(id)
  }, [challenge?.durationMs, gameState])

  useEffect(() => {
    if (celebration === 'none') return
    const t = window.setTimeout(() => setCelebration('none'), 2800)
    return () => clearTimeout(t)
  }, [celebration])

  useEffect(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight })
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const readyNames = useMemo(() => new Set(submittedPlayersThisRound), [submittedPlayersThisRound])

  const myLastRoundPick = useMemo(() => {
    if (!sessionUser) return null
    const row = lastRoundScores.find((s) => s.username === sessionUser.name)
    const idx = row?.choiceIndex
    return typeof idx === 'number' && idx >= 0 ? idx : null
  }, [lastRoundScores, sessionUser])

  const youLessonHero = useMemo(() => {
    if (!sessionUser || roundHeroes.length === 0) return false
    return roundHeroes.includes(sessionUser.name)
  }, [roundHeroes, sessionUser])

  const waitingOnRival =
    submitted &&
    gameState === 'ACTIVE' &&
    players.length > 1 &&
    submittedPlayersThisRound.length < players.length

  const handleStart = () => {
    const socket = getSocket()
    socket.emit('start_game', { roomCode })
  }

  const chooseAnswer = (index: number) => {
    if (submitted || gameState !== 'ACTIVE') return
    setPickedIndex(index)
    setSubmitted(true)
    const socket = getSocket()
    socket.emit('challenge:submit', { roomCode, choiceIndex: index })
  }

  if (!sessionUser) {
    return (
      <PromptGuruShell className="pb-10">
        <Navbar />
        <p className="pt-32 md:pt-36 text-center text-gray-400 px-4">Loading your battle session…</p>
      </PromptGuruShell>
    )
  }

  return (
    <PromptGuruShell className="pb-12">
      {celebration !== 'none' && viewport.width > 0 && viewport.height > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[55]">
          <Confetti
            key={`${celebration}-${roundNumber}`}
            width={viewport.width}
            height={viewport.height}
            recycle={false}
            numberOfPieces={celebration === 'round_win' ? 260 : 110}
            tweenDuration={3800}
            gravity={0.22}
          />
        </div>
      )}
      {gameState === 'FINISHED' && viewport.width > 0 && (
        <Confetti width={viewport.width} height={viewport.height} recycle={false} numberOfPieces={220} />
      )}
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 grid lg:grid-cols-[320px_1fr] gap-5">
        <aside className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 h-fit shadow-[0_0_25px_-5px_rgba(168,85,247,0.22)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-purple-400">Players</h2>
            <span className="text-xs text-gray-400">{players.length}/10</span>
          </div>
          <p className="text-xs text-gray-500 mb-3 truncate">{sessionUser.name}</p>
          <div className="space-y-2">
            {players.map((player) => (
              <PlayerCard
                key={`${player.socketId}-${player.username}`}
                username={player.username}
                score={player.score}
                isReady={readyNames.has(player.username)}
              />
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-5 shadow-[0_0_25px_-5px_rgba(168,85,247,0.26)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Room Code</p>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-4xl tracking-[0.25em] font-bold text-white">{roomCode}</h1>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(roomCode)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <Copy className="size-5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">
                  Lesson {roundNumber}/{totalRoundsUI}
                </p>
                <p className="text-xs text-gray-400 truncate">{statusMessage || ''}</p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {gameState === 'WAITING' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_0_25px_-5px_rgba(168,85,247,0.18)]"
              >
                <h3 className="text-lg font-semibold mb-2 text-white">Waiting for players</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {DEFAULT_TOTAL_ROUNDS} questions · {Math.round(DEFAULT_QUESTION_MS / 1000)}s each · starts at 2 players
                </p>
                {isHost && (
                  <Button
                    onClick={handleStart}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                  >
                    Start now
                  </Button>
                )}
              </motion.div>
            )}

            {gameState === 'ACTIVE' && challenge && challenge.choices.length === 4 && (
              <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <ChallengeDisplay
                  round={challenge.round}
                  totalRounds={challenge.totalRounds ?? totalRoundsUI}
                  category={challenge.category}
                  lesson={challenge.lesson}
                  prompt={challenge.prompt}
                  timeLeftMs={timeLeftMs}
                  urgent={timeLeftMs <= 6000}
                />
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-[0_0_25px_-5px_rgba(168,85,247,0.18)]">
                  <QuizChoices
                    choices={challenge.choices}
                    disabled={submitted}
                    selectedIndex={pickedIndex}
                    onChoose={chooseAnswer}
                  />
                  {submitted &&
                    (waitingOnRival ? (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-sm font-medium text-amber-200/95"
                      >
                        Locked in — duel moment when your rival picks! ⚡
                      </motion.p>
                    ) : (
                      <p className="mt-4 text-sm text-purple-300/90">Both answers in — revealing…</p>
                    ))}
                </div>
              </motion.div>
            )}

            {gameState === 'ROUND_END' && (
              <motion.div
                key="round-end"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-[0_0_25px_-5px_rgba(168,85,247,0.18)]">
                  <h3 className="text-xl font-semibold mb-4 text-purple-400">Lesson recap</h3>
                  {quizReveal && quizReveal.choices.length === 4 && (
                    <>
                      {sessionUser && roundHeroes.length > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                          className={`mb-5 rounded-2xl border px-4 py-4 text-center ${
                            youLessonHero
                              ? 'border-emerald-400/55 bg-gradient-to-br from-emerald-500/25 via-emerald-950/35 to-purple-950/40 shadow-[0_0_40px_rgba(16,185,129,0.22)]'
                              : 'border-amber-500/35 bg-gradient-to-br from-amber-500/15 via-purple-950/25 to-black/40'
                          }`}
                        >
                          {youLessonHero ? (
                            <>
                              <p className="text-lg md:text-xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                                You nailed this lesson! 🏆
                              </p>
                              <p className="mt-2 text-sm text-emerald-100/90">
                                {roundHeroes.length > 1 ? (
                                  <>
                                    Co-heroes: <span className="font-semibold text-white">{roundHeroes.join(' · ')}</span>{' '}
                                    — duel royalty!
                                  </>
                                ) : (
                                  <>Top marks on the board — savor the dopamine hit.</>
                                )}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-base font-semibold text-amber-100">
                                Lesson spotlight:
                                <span className="text-white"> {roundHeroes.join(' · ')}</span>
                              </p>
                              <p className="mt-2 text-sm text-gray-300">
                                Shake it off — next bell is yours. The reveal below is pure study fuel ✨
                              </p>
                            </>
                          )}
                        </motion.div>
                      ) : null}
                      <p className="text-white mb-4 leading-relaxed">{quizReveal.question}</p>
                      <QuizChoices
                        choices={quizReveal.choices}
                        disabled
                        selectedIndex={null}
                        revealCorrectIndex={quizReveal.correctIndex}
                        yourPickIndex={myLastRoundPick}
                        animateReveal
                        onChoose={() => {}}
                      />
                      {quizReveal.explainCorrect ? (
                        <div className="mt-6 rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100 leading-relaxed">
                          <strong className="text-emerald-300">Teaching note ({quizReveal.lesson}):</strong>{' '}
                          {quizReveal.explainCorrect}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-[0_0_25px_-5px_rgba(168,85,247,0.18)]">
                  <h3 className="text-lg font-semibold mb-4 text-purple-400">Scores this lesson</h3>
                  <LeaderboardCard players={lastRoundScores.map((s) => ({ username: s.username, score: s.score }))} />
                  <div className="mt-4 space-y-3 text-xs text-gray-400">
                    {lastRoundScores.map((s) => (
                      <div key={s.username} className="border-t border-white/5 pt-3 first:border-t-0 first:pt-0">
                        <p className="text-purple-300 font-medium">{s.username}</p>
                        {s.selectedLabel ? (
                          <p className="mt-1 text-gray-400">
                            Picked{typeof s.choiceIndex === 'number' && s.choiceIndex >= 0
                              ? ` (${String.fromCharCode(65 + s.choiceIndex)})`
                              : ''}
                            :{' '}
                            <span className="text-gray-200">{s.selectedLabel}</span>
                          </p>
                        ) : null}
                        {s.judge?.feedback ? <p className="mt-1 text-gray-500">{s.judge.feedback}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {gameState === 'FINISHED' && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-6 shadow-[0_0_50px_-10px_rgba(168,85,247,0.52)]"
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white">Quiz marathon complete</h3>
                <p className="text-purple-300 mb-5">
                  {winner ? `${winner} won this duel.` : 'See who internalized the most prompting craft.'}
                </p>
                <LeaderboardCard players={leaderboard.map((p) => ({ ...p }))} />
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => router.push('/battle')}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                  >
                    Play Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PromptGuruShell>
  )
}
