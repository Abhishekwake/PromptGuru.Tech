import { getPublicApiBase } from './api'

let timer: ReturnType<typeof setTimeout> | null = null
let lastSent = ''

export function sendPromptDraftTelemetry(draft: string, token: string) {
  if (typeof window === 'undefined' || !token) return

  const trimmed = draft.trim()
  if (trimmed === lastSent) return

  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    lastSent = trimmed
    if (!trimmed) return
    try {
      await fetch(`${getPublicApiBase()}/api/telemetry/prompt-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draft: trimmed, source: 'dashboard' }),
      })
    } catch {
      /* non-blocking */
    }
  }, 450)
}

export function resetPromptTelemetry() {
  lastSent = ''
  if (timer) clearTimeout(timer)
}
