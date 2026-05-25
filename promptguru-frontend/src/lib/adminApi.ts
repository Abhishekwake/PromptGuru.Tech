import { getPublicApiBase } from './api'

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function adminFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getPublicApiBase()}/api/admin${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message || `Admin API ${res.status}`)
  }
  return res.json()
}

export type AdminKpis = {
  totalUsers: number
  newUsersToday: number
  totalPrompts: number
  promptsToday: number
  activeBattles: number
  finishedBattlesToday: number
  avgPromptScore: number
}

export type LiveEvent = {
  id: string
  at: string
  type: 'typing' | 'analyzed' | 'battle'
  source?: string
  action?: string
  user?: { id?: string; name?: string; email?: string }
  text?: string
  score?: number
  roomCode?: string
  round?: number
  isCorrect?: boolean
  winner?: string
  playerCount?: number
  promptId?: string
}

export type ActivityPoint = {
  date: string
  label: string
  signups: number
  prompts: number
  avgScore: number
  battles: number
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  isAdmin: boolean
  googleUser: boolean
  isEmailVerified: boolean
  promptCount: number
  createdAt: string
}

export type AdminPrompt = {
  id: string
  prompt: string
  score: number | null
  clarity: number | null
  user: { id: string; name: string; email: string } | null
  createdAt: string
}

export type AdminUserDetail = {
  user: AdminUser & { avatar: string | null; updatedAt: string }
  stats: {
    promptCount: number
    avgScore: number
    avgClarity: number
    avgSpecificity: number
    avgUsefulness: number
    battle: {
      rank: number | null
      totalGamesPlayed: number
      wins: number
      totalScore: number
      averageScore: number
      highestScore: number
    } | null
  }
  prompts: {
    page: number
    total: number
    totalPages: number
    items: {
      id: string
      prompt: string
      score: number | null
      clarity: number | null
      specificity: number | null
      usefulness: number | null
      tips: string[]
      suggestedPrompts: string[]
      createdAt: string
    }[]
  }
}

export type ActiveBattle = {
  roomCode: string
  state: string
  playerCount: number
  currentRound: number
  players: { username: string; score: number; currentPrompt: string }[]
  updatedAt: string
}

export function fetchAdminOverview(token: string) {
  return adminFetch<{ kpis: AdminKpis; liveEvents: LiveEvent[] }>(token, '/overview')
}

export function fetchAdminActivity(token: string) {
  return adminFetch<{ series: ActivityPoint[] }>(token, '/activity')
}

export function fetchAdminDistribution(token: string) {
  return adminFetch<{
    scoreBuckets: { range: string; count: number }[]
    userSources: { name: string; value: number }[]
  }>(token, '/distribution')
}

export function fetchAdminUsers(token: string, page = 1, q = '') {
  const qs = new URLSearchParams({ page: String(page), limit: '15' })
  if (q) qs.set('q', q)
  return adminFetch<{ users: AdminUser[]; total: number; totalPages: number; page: number }>(
    token,
    `/users?${qs}`
  )
}

export function fetchAdminPrompts(token: string, page = 1) {
  return adminFetch<{ prompts: AdminPrompt[]; total: number; totalPages: number; page: number }>(
    token,
    `/prompts?page=${page}&limit=20`
  )
}

export function fetchAdminBattles(token: string) {
  return adminFetch<{ rooms: ActiveBattle[] }>(token, '/battles/active')
}

export function fetchAdminLeaderboard(token: string) {
  return adminFetch<{
    entries: {
      username: string
      rank: number
      totalGamesPlayed: number
      wins: number
      totalScore: number
      averageScore: number
    }[]
  }>(token, '/leaderboard')
}

export function fetchAdminUserDetail(token: string, userId: string, page = 1) {
  return adminFetch<AdminUserDetail>(token, `/users/${userId}?page=${page}&limit=15`)
}

export function patchUserRole(token: string, userId: string, role: 'user' | 'admin') {
  return adminFetch(token, `/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}
