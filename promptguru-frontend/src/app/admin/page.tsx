'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  BarChart3,
  ChevronRight,
  Crown,
  Eye,
  Mail,
  Radio,
  RefreshCw,
  Shield,
  Swords,
  User as UserIcon,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/button'
import { fetchSessionUser } from '@/lib/api'
import {
  type ActiveBattle,
  type ActivityPoint,
  type AdminKpis,
  type AdminPrompt,
  type AdminUser,
  type AdminUserDetail,
  type LiveEvent,
  fetchAdminActivity,
  fetchAdminBattles,
  fetchAdminDistribution,
  fetchAdminLeaderboard,
  fetchAdminOverview,
  fetchAdminPrompts,
  fetchAdminUserDetail,
  fetchAdminUsers,
  patchUserRole,
} from '@/lib/adminApi'
import { subscribeAdminLive } from '@/lib/adminSocket'

const PIE_COLORS = ['#a855f7', '#8b5cf6', '#ec4899', '#6366f1']

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md"
      style={{ boxShadow: `0 0 40px ${accent}22` }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
        style={{ background: accent, opacity: 0.25 }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
          style={{ background: `${accent}18` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
    </motion.div>
  )
}

function eventLabel(ev: LiveEvent) {
  if (ev.type === 'typing') return 'typing…'
  if (ev.type === 'analyzed') return `analyzed · ${ev.score ?? '—'}/10`
  if (ev.action === 'answer_submitted') return `battle answer · ${ev.isCorrect ? '✓' : '✗'}`
  if (ev.action === 'room_created') return 'battle room created'
  if (ev.action === 'game_ended') return `battle ended · ${ev.winner}`
  return ev.type
}

function eventColor(ev: LiveEvent) {
  if (ev.type === 'typing') return 'border-cyan-500/30 bg-cyan-500/5'
  if (ev.type === 'analyzed') return 'border-purple-500/30 bg-purple-500/5'
  return 'border-pink-500/30 bg-pink-500/5'
}

const chartTooltipStyle = {
  contentStyle: {
    background: 'rgba(9,9,11,0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: '#d1d5db' },
}

function scoreBadge(score: number | null) {
  if (score == null) return 'bg-gray-700/40 text-gray-400'
  if (score >= 8.5) return 'bg-emerald-500/20 text-emerald-300'
  if (score >= 7) return 'bg-purple-500/20 text-purple-300'
  if (score >= 5) return 'bg-amber-500/20 text-amber-300'
  return 'bg-red-500/20 text-red-300'
}

function UserDetailPanel({
  detail,
  loading,
  promptPage,
  onPromptPage,
  onClose,
  onRoleChange,
}: {
  detail: AdminUserDetail | null
  loading: boolean
  promptPage: number
  onPromptPage: (page: number) => void
  onClose: () => void
  onRoleChange: (role: 'user' | 'admin') => void
}) {
  const u = detail?.user

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <UserIcon className="h-4 w-4 text-purple-400" />
            User profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && !detail ? (
            <div className="flex h-40 items-center justify-center text-gray-500">Loading user…</div>
          ) : u ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-xl font-bold text-purple-300">
                    {u.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      (u.name?.[0] || u.email[0] || '?').toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-white">{u.name || 'Unnamed'}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-400">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${
                        u.isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-gray-400'
                      }`}>
                        {u.role}
                      </span>
                      {u.googleUser && (
                        <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] text-blue-300">Google</span>
                      )}
                      {u.isEmailVerified && (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] text-emerald-300">Verified</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-black/30 px-3 py-2">
                    <p className="text-gray-500">Joined</p>
                    <p className="mt-0.5 font-medium text-gray-200">{new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-lg bg-black/30 px-3 py-2">
                    <p className="text-gray-500">Last active</p>
                    <p className="mt-0.5 font-medium text-gray-200">{new Date(u.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <label htmlFor="user-role" className="text-xs text-gray-500">Role</label>
                  <select
                    id="user-role"
                    value={u.role}
                    onChange={(e) => onRoleChange(e.target.value as 'user' | 'admin')}
                    className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>

              {detail.stats && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-300">Stats</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Prompts', value: detail.stats.promptCount },
                      { label: 'Avg score', value: `${detail.stats.avgScore}/10` },
                      { label: 'Clarity', value: detail.stats.avgClarity || '—' },
                      { label: 'Usefulness', value: detail.stats.avgUsefulness || '—' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">{s.label}</p>
                        <p className="mt-1 text-lg font-bold tabular-nums text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {detail.stats.battle && (
                    <div className="mt-3 rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
                      <p className="mb-2 flex items-center gap-2 text-xs font-medium text-pink-300">
                        <Swords className="h-3.5 w-3.5" />
                        Battle record
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-gray-500">Rank</p>
                          <p className="font-bold text-white">#{detail.stats.battle.rank ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Wins</p>
                          <p className="font-bold text-white">{detail.stats.battle.wins}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total pts</p>
                          <p className="font-bold text-white">{detail.stats.battle.totalScore}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Prompts ({detail.prompts.total})
                  </h3>
                  {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-gray-500" />}
                </div>
                {detail.prompts.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-gray-600">
                    No prompts submitted yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {detail.prompts.items.map((p) => (
                      <div key={p.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="flex-1 text-sm text-gray-200 break-words">{p.prompt}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] tabular-nums ${scoreBadge(p.score)}`}>
                            {p.score ?? '—'}/10
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-500">
                          {p.clarity != null && <span>Clarity {p.clarity}</span>}
                          {p.specificity != null && <span>· Specificity {p.specificity}</span>}
                          {p.usefulness != null && <span>· Usefulness {p.usefulness}</span>}
                          <span>· {new Date(p.createdAt).toLocaleString()}</span>
                        </div>
                        {p.tips.length > 0 && (
                          <ul className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs text-gray-400">
                            {p.tips.slice(0, 3).map((tip, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-purple-400">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {detail.prompts.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Page {promptPage} / {detail.prompts.totalPages}</span>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={promptPage <= 1} className="bg-white/5" onClick={() => onPromptPage(promptPage - 1)}>Prev</Button>
                      <Button size="sm" disabled={promptPage >= detail.prompts.totalPages} className="bg-white/5" onClick={() => onPromptPage(promptPage + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">User not found</div>
          )}
        </div>
      </motion.aside>
    </>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [kpis, setKpis] = useState<AdminKpis | null>(null)
  const [activity, setActivity] = useState<ActivityPoint[]>([])
  const [scoreBuckets, setScoreBuckets] = useState<{ range: string; count: number }[]>([])
  const [userSources, setUserSources] = useState<{ name: string; value: number }[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [prompts, setPrompts] = useState<AdminPrompt[]>([])
  const [battles, setBattles] = useState<ActiveBattle[]>([])
  const [leaderboard, setLeaderboard] = useState<
    { username: string; rank: number; totalScore: number; wins: number }[]
  >([])
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const [liveConnected, setLiveConnected] = useState(false)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null)
  const [userDetailLoading, setUserDetailLoading] = useState(false)
  const [userPromptPage, setUserPromptPage] = useState(1)

  const loadUserDetail = useCallback(async (authToken: string, userId: string, page = 1) => {
    setUserDetailLoading(true)
    try {
      const detail = await fetchAdminUserDetail(authToken, userId, page)
      setUserDetail(detail)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user')
      setSelectedUserId(null)
    } finally {
      setUserDetailLoading(false)
    }
  }, [])

  const openUserDetail = useCallback((userId: string) => {
    setSelectedUserId(userId)
    setUserPromptPage(1)
    setUserDetail(null)
  }, [])

  const closeUserDetail = useCallback(() => {
    setSelectedUserId(null)
    setUserDetail(null)
    setUserPromptPage(1)
  }, [])

  const loadAll = useCallback(async (authToken: string, silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const [overview, act, dist, userRes, promptRes, battleRes, lb] = await Promise.all([
        fetchAdminOverview(authToken),
        fetchAdminActivity(authToken),
        fetchAdminDistribution(authToken),
        fetchAdminUsers(authToken, userPage, userSearch),
        fetchAdminPrompts(authToken, 1),
        fetchAdminBattles(authToken),
        fetchAdminLeaderboard(authToken),
      ])
      setKpis(overview.kpis)
      setLiveEvents(overview.liveEvents)
      setActivity(act.series)
      setScoreBuckets(dist.scoreBuckets)
      setUserSources(dist.userSources)
      setUsers(userRes.users)
      setUserTotalPages(userRes.totalPages)
      setPrompts(promptRes.prompts)
      setBattles(battleRes.rooms)
      setLeaderboard(lb.entries)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userPage, userSearch])

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      router.replace('/login?redirect=/admin')
      return
    }
    setToken(t)
    fetchSessionUser(t)
      .then((u) => {
        if (!u.isAdmin) {
          setAuthorized(false)
          setLoading(false)
          return
        }
        setAuthorized(true)
        void loadAll(t)
      })
      .catch(() => {
        router.replace('/login?redirect=/admin')
      })
  }, [router, loadAll])

  useEffect(() => {
    if (!token || !authorized) return
    const unsub = subscribeAdminLive(
      token,
      (ev) => {
        setLiveEvents((prev) => [ev, ...prev].slice(0, 120))
        setLiveConnected(true)
      },
      (bootstrap) => {
        setLiveEvents(bootstrap)
        setLiveConnected(true)
      },
      (msg) => {
        setLiveConnected(false)
        if (msg.includes('Admin access')) setAuthorized(false)
      }
    )
    return unsub
  }, [token, authorized])

  useEffect(() => {
    if (!token || !authorized) return
    void loadAll(token, true)
  }, [userPage, userSearch, token, authorized, loadAll])

  useEffect(() => {
    if (!token || !selectedUserId) return
    void loadUserDetail(token, selectedUserId, userPromptPage)
  }, [token, selectedUserId, userPromptPage, loadUserDetail])

  const typingNow = useMemo(
    () => liveEvents.filter((e) => e.type === 'typing').slice(0, 8),
    [liveEvents]
  )

  if (authorized === false) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-4 pt-20">
          <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-md">
            <Shield className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="mt-4 text-xl font-bold">Admin access required</h1>
            <p className="mt-2 text-sm text-gray-400">
              Your account is not an admin. Set <code className="text-purple-400">role: admin</code> in MongoDB or add
              your email to <code className="text-purple-400">ADMIN_EMAILS</code> on the backend.
            </p>
            <Button className="mt-6 bg-purple-600 hover:bg-purple-700" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="h-full w-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-16 pt-28 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300"
            >
              <Shield className="h-3.5 w-3.5" />
              Command Center
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              PromptGuru <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Admin</span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">Live telemetry · user intelligence · battle ops</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                liveConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-gray-600 bg-white/5 text-gray-400'
              }`}
            >
              <Radio className={`h-3 w-3 ${liveConnected ? 'animate-pulse' : ''}`} />
              {liveConnected ? 'Live feed connected' : 'Connecting…'}
            </span>
            <Button
              size="sm"
              className="border border-white/10 bg-white/5 hover:bg-white/10"
              disabled={refreshing}
              onClick={() => token && loadAll(token, true)}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && !kpis ? (
          <div className="flex h-64 items-center justify-center text-gray-500">Loading command center…</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total users"
                value={kpis?.totalUsers ?? 0}
                sub={`+${kpis?.newUsersToday ?? 0} today`}
                icon={Users}
                accent="#a855f7"
              />
              <KpiCard
                label="Prompts analyzed"
                value={kpis?.totalPrompts ?? 0}
                sub={`${kpis?.promptsToday ?? 0} today · avg ${kpis?.avgPromptScore ?? 0}/10`}
                icon={Zap}
                accent="#8b5cf6"
              />
              <KpiCard
                label="Active battles"
                value={kpis?.activeBattles ?? 0}
                sub={`${kpis?.finishedBattlesToday ?? 0} finished today`}
                icon={Swords}
                accent="#ec4899"
              />
              <KpiCard
                label="Live typing"
                value={typingNow.length}
                sub="users drafting prompts now"
                icon={Eye}
                accent="#22d3ee"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              {/* Charts column */}
              <div className="space-y-6 xl:col-span-8">
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-400" />
                    <h2 className="font-semibold">7-day activity</h2>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activity}>
                        <defs>
                          <linearGradient id="gPrompts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip {...chartTooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                        <Area type="monotone" dataKey="prompts" name="Prompts" stroke="#a855f7" fill="url(#gPrompts)" strokeWidth={2} />
                        <Area type="monotone" dataKey="signups" name="Signups" stroke="#22d3ee" fill="url(#gSignups)" strokeWidth={2} />
                        <Area type="monotone" dataKey="battles" name="Battles" stroke="#ec4899" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                    <div className="mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-400" />
                      <h2 className="font-semibold">Prompt score distribution</h2>
                    </div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreBuckets}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip {...chartTooltipStyle} />
                          <Bar dataKey="count" name="Prompts" radius={[6, 6, 0, 0]}>
                            {scoreBuckets.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.85} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                    <h2 className="mb-4 font-semibold">Avg score trend</h2>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activity}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip {...chartTooltipStyle} />
                          <Line type="monotone" dataKey="avgScore" name="Avg score" stroke="#c084fc" strokeWidth={2.5} dot={{ r: 3, fill: '#a855f7' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                {/* Users table */}
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-semibold">Users</h2>
                    <input
                      value={userSearch}
                      onChange={(e) => {
                        setUserPage(1)
                        setUserSearch(e.target.value)
                      }}
                      placeholder="Search name or email…"
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                          <th className="pb-3 pr-4">User</th>
                          <th className="pb-3 pr-4">Prompts</th>
                          <th className="pb-3 pr-4">Joined</th>
                          <th className="pb-3">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr
                            key={u.id}
                            className="cursor-pointer border-b border-white/5 hover:bg-purple-500/[0.06] transition-colors"
                            onClick={() => openUserDetail(u.id)}
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-white">{u.name}</p>
                                  <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
                              </div>
                            </td>
                            <td className="py-3 pr-4 tabular-nums text-gray-300">{u.promptCount}</td>
                            <td className="py-3 pr-4 text-xs text-gray-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={u.role}
                                onChange={async (e) => {
                                  const role = e.target.value as 'user' | 'admin'
                                  if (!token) return
                                  await patchUserRole(token, u.id, role)
                                  void loadAll(token, true)
                                  if (selectedUserId === u.id && userDetail) {
                                    setUserDetail({
                                      ...userDetail,
                                      user: { ...userDetail.user, role, isAdmin: role === 'admin' },
                                    })
                                  }
                                }}
                                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs"
                              >
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>Page {userPage} / {userTotalPages}</span>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={userPage <= 1} className="bg-white/5" onClick={() => setUserPage((p) => p - 1)}>Prev</Button>
                      <Button size="sm" disabled={userPage >= userTotalPages} className="bg-white/5" onClick={() => setUserPage((p) => p + 1)}>Next</Button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Live feed column */}
              <div className="space-y-6 xl:col-span-4">
                <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.06] to-transparent p-5 backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      Live prompt radar
                    </h2>
                    <span className="text-[10px] uppercase tracking-widest text-cyan-400/80">real-time</span>
                  </div>
                  <p className="mb-4 text-xs text-gray-500">See what users type on the dashboard before they analyze.</p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {typingNow.length === 0 ? (
                      <p className="text-sm text-gray-600 italic">No one typing right now…</p>
                    ) : (
                      typingNow.map((ev) => (
                        <div key={ev.id} className="rounded-lg border border-cyan-500/20 bg-black/30 px-3 py-2">
                          <p className="text-[11px] text-cyan-300">{ev.user?.name || ev.user?.email}</p>
                          <p className="mt-0.5 text-sm text-white break-words">&ldquo;{ev.text}&rdquo;</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <h2 className="mb-4 font-semibold">Event stream</h2>
                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {liveEvents.slice(0, 40).map((ev) => (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`rounded-xl border px-3 py-2.5 ${eventColor(ev)}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                              {eventLabel(ev)}
                            </span>
                            <span className="text-[10px] text-gray-600">
                              {new Date(ev.at).toLocaleTimeString()}
                            </span>
                          </div>
                          {(ev.user?.name || ev.user?.email) && (
                            <p className="mt-1 text-xs text-purple-300">{ev.user.name || ev.user.email}</p>
                          )}
                          {ev.text && (
                            <p className="mt-1 text-sm text-gray-200 break-words line-clamp-3">{ev.text}</p>
                          )}
                          {ev.roomCode && (
                            <p className="mt-1 text-[11px] text-gray-500">Room {ev.roomCode}</p>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <h2 className="mb-4 font-semibold">User sources</h2>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={userSources} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={4}>
                          {userSources.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...chartTooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <div className="mb-3 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <h2 className="font-semibold">Top players</h2>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {leaderboard.map((e) => (
                      <li key={e.rank} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
                        <span className="text-gray-300">
                          <span className="mr-2 text-purple-400">#{e.rank}</span>
                          {e.username}
                        </span>
                        <span className="tabular-nums text-gray-500">{e.totalScore} pts</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            {/* Bottom: battles + recent prompts */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                <h2 className="mb-4 font-semibold">Active battle rooms</h2>
                {battles.length === 0 ? (
                  <p className="text-sm text-gray-600">No active rooms</p>
                ) : (
                  <div className="space-y-3">
                    {battles.map((room) => (
                      <div key={room.roomCode} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-purple-300">{room.roomCode}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                            room.state === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {room.state}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {room.playerCount} players · round {room.currentRound}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-gray-400">
                          {room.players.map((p) => (
                            <li key={p.username}>
                              {p.username} — {p.score} pts
                              {p.currentPrompt && (
                                <span className="text-gray-500"> · last: {p.currentPrompt.slice(0, 40)}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                <h2 className="mb-4 font-semibold">Recent analyzed prompts</h2>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {prompts.map((p) => (
                    <div
                      key={p.id}
                      role={p.user?.id ? 'button' : undefined}
                      tabIndex={p.user?.id ? 0 : undefined}
                      onClick={() => p.user?.id && openUserDetail(p.user.id)}
                      onKeyDown={(e) => {
                        if (p.user?.id && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          openUserDetail(p.user.id)
                        }
                      }}
                      className={`rounded-lg border border-white/5 bg-black/20 px-3 py-2.5 ${
                        p.user?.id ? 'cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-purple-300">{p.user?.name || 'Unknown'}</span>
                        <span className="rounded-full bg-purple-700/40 px-2 py-0.5 text-[10px] tabular-nums">
                          {p.score ?? '—'}/10
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-300 break-words">{p.prompt}</p>
                      <p className="mt-1 text-[10px] text-gray-600">{new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <UserDetailPanel
            detail={userDetail}
            loading={userDetailLoading}
            promptPage={userPromptPage}
            onPromptPage={setUserPromptPage}
            onClose={closeUserDetail}
            onRoleChange={async (role) => {
              if (!token || !selectedUserId) return
              await patchUserRole(token, selectedUserId, role)
              void loadAll(token, true)
              if (userDetail) {
                setUserDetail({
                  ...userDetail,
                  user: { ...userDetail.user, role, isAdmin: role === 'admin' },
                })
              }
            }}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
