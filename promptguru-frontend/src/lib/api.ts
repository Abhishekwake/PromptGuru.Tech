/**
 * Public backend URL for REST + Socket.io (browser).
 * Prefer NEXT_PUBLIC_BACKEND_URL in .env.local (e.g. http://localhost:4000).
 * If unset, the browser uses the same host as this page on port 4000 so
 * opening http://192.168.x.x:3000 still hits the API on 192.168.x.x:4000.
 */
export function getPublicApiBase() {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL
  if (fromEnv) {
    const trimmed = fromEnv.replace(/\/$/, '')
    if (typeof window !== 'undefined') {
      const h = window.location.hostname
      const isPageLan = h !== 'localhost' && h !== '127.0.0.1'
      const envIsLocalLoopback =
        trimmed.includes('127.0.0.1') || trimmed.includes('localhost')
      if (isPageLan && envIsLocalLoopback) {
        return `${window.location.protocol}//${h}:4000`
      }
    }
    return trimmed
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:4000`
  }
  return 'http://localhost:4000'
}

export type SessionUser = { id: string; name: string; email: string; role?: string; isAdmin?: boolean }

export async function fetchSessionUser(token: string): Promise<SessionUser> {
  const res = await fetch(`${getPublicApiBase()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error('Not authorized')
  }
  return res.json()
}

export type SoloChallengePayload = {
  round: number
  totalRounds: number
  lesson: string
  prompt: string
  choices: string[]
  correctChoiceIndex: number
  explainCorrect: string
  durationMs: number | null
}

/** Single lesson for logged-in solo quiz practice (no battle room). */
export async function fetchSoloChallenge(
  token: string,
  round: number,
  priorStems: string[]
): Promise<SoloChallengePayload> {
  const res = await fetch(`${getPublicApiBase()}/api/practice/solo/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ round, priorStems: priorStems.slice(-24) }),
  })
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}))
    throw new Error((msg as { message?: string }).message || 'Could not load practice question')
  }
  return res.json()
}
