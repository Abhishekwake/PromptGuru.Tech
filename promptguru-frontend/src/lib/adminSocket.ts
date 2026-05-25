'use client'

import { io, Socket } from 'socket.io-client'
import { getPublicApiBase } from './api'
import type { LiveEvent } from './adminApi'

let adminSocket: Socket | null = null

export function getAdminSocket(): Socket {
  if (!adminSocket) {
    adminSocket = io(getPublicApiBase(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })
  }
  return adminSocket
}

export function subscribeAdminLive(
  token: string,
  onEvent: (event: LiveEvent) => void,
  onBootstrap: (events: LiveEvent[]) => void,
  onError: (msg: string) => void
) {
  const socket = getAdminSocket()
  type AuthSocket = Socket & { auth?: { token: string } }
  ;(socket as AuthSocket).auth = { token }

  const handleLive = (event: LiveEvent) => onEvent(event)
  const handleSubscribed = (payload: { recentEvents: LiveEvent[] }) => {
    onBootstrap(payload.recentEvents || [])
  }
  const handleErr = (payload: { message?: string }) => {
    onError(payload.message || 'Admin socket error')
  }

  socket.on('admin:live_event', handleLive)
  socket.on('admin:subscribed', handleSubscribed)
  socket.on('admin:error', handleErr)

  if (!socket.connected) socket.connect()
  socket.emit('admin:subscribe')

  return () => {
    socket.emit('admin:unsubscribe')
    socket.off('admin:live_event', handleLive)
    socket.off('admin:subscribed', handleSubscribed)
    socket.off('admin:error', handleErr)
  }
}
