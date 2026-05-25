'use client'

import { io, Socket } from 'socket.io-client'
import { getPublicApiBase } from './api'

let socket: Socket | null = null
let lastBaseUrl = ''

function readToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('token') ?? ''
}

export function getSocket(): Socket {
  const backendUrl = getPublicApiBase()
  const token = readToken()

  if (socket && lastBaseUrl && lastBaseUrl !== backendUrl) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  if (!socket) {
    lastBaseUrl = backendUrl
    socket = io(backendUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 500,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: { token },
    }) as Socket
    return socket
  }

  // Refresh JWT on reconnect (e.g. after login elsewhere)
  type AuthSocket = Socket & { auth?: { token: string } }
  ;(socket as AuthSocket).auth = { token }
  lastBaseUrl = backendUrl
  return socket
}
