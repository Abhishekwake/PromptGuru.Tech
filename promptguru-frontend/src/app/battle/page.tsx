'use client'



import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Copy, Swords } from 'lucide-react'

import { motion } from 'framer-motion'

import Navbar from '@/components/Navbar'

import PromptGuruShell from '@/components/PromptGuruShell'

import { Button } from '@/components/button'

import { getSocket } from '@/lib/socket'

import { fetchSessionUser, type SessionUser } from '@/lib/api'



type ActiveRoom = {

  roomCode: string

  playerCount: number

  state: 'WAITING' | 'ACTIVE' | 'FINISHED'

}



function connectErrorMessage(err: Error): string {

  if (String(err.message || '').includes('UNAUTHORIZED')) {

    return 'Session expired. Log in again.'

  }

  return "Can't reach server. Start the backend and try again."

}



const STATE_LABEL: Record<ActiveRoom['state'], string> = {

  WAITING: 'Waiting',

  ACTIVE: 'Live',

  FINISHED: 'Done',

}



export default function BattleLobbyPage() {

  const router = useRouter()

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)

  const [joinCode, setJoinCode] = useState('')

  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])

  const [socketState, setSocketState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')

  const [socketError, setSocketError] = useState<string | null>(null)

  const [actionError, setActionError] = useState<string | null>(null)



  const readyForSocket = !!sessionUser



  useEffect(() => {

    const token = localStorage.getItem('token')

    if (!token) {

      router.replace('/login?redirect=/battle')

      return

    }



    fetchSessionUser(token)

      .then(setSessionUser)

      .catch(() => {

        router.replace('/login?redirect=/battle')

      })

  }, [router])



  useEffect(() => {

    if (!readyForSocket) return



    const socket = getSocket()

    if (!socket.connected) socket.connect()



    const onConnect = () => {

      setSocketState('connected')

      setSocketError(null)

      setActionError(null)

      socket.emit('rooms:list')

    }

    const onDisconnect = () => setSocketState('disconnected')

    const onConnectError = (err: Error) => {

      setSocketState('error')

      setSocketError(connectErrorMessage(err))

    }



    const onServerError = (payload: { message?: string } | string) => {

      const msg = typeof payload === 'string' ? payload : payload?.message

      if (msg) setActionError(msg)

    }



    socket.on('connect', onConnect)

    socket.on('disconnect', onDisconnect)

    socket.on('connect_error', onConnectError)

    socket.on('error', onServerError)



    if (socket.connected) onConnect()



    const onCreated = (payload: { roomCode: string }) => {

      const nextCode = payload.roomCode.toUpperCase()

      void navigator.clipboard?.writeText(nextCode)

      router.push(`/battle/${nextCode}?host=1`)

    }



    const onList = (payload: { rooms: ActiveRoom[] }) => {

      setActiveRooms(payload.rooms || [])

    }



    socket.on('room:created', onCreated)

    socket.on('rooms:list', onList)

    socket.emit('rooms:list')



    return () => {

      socket.off('connect', onConnect)

      socket.off('disconnect', onDisconnect)

      socket.off('connect_error', onConnectError)

      socket.off('error', onServerError)

      socket.off('room:created', onCreated)

      socket.off('rooms:list', onList)

    }

  }, [readyForSocket, router])



  const handleCreateRoom = () => {

    setActionError(null)

    const socket = getSocket()

    const emitCreate = () => {

      if (!socket.connected) {

        setActionError('Not connected.')

        return

      }

      socket.emit('room:create')

    }



    if (socket.connected) {

      emitCreate()

    } else {

      const onReady = () => {

        socket.off('connect', onReady)

        socket.off('connect_error', onFail)

        emitCreate()

      }

      const onFail = () => {

        socket.off('connect', onReady)

        socket.off('connect_error', onFail)

      }

      socket.once('connect', onReady)

      socket.once('connect_error', onFail)

      socket.connect()

    }

  }



  const handleJoinRoom = () => {

    if (!joinCode.trim()) return

    router.push(`/battle/${joinCode.trim().toUpperCase()}`)

  }



  const statusLine =

    socketError ||

    (socketState === 'connecting' && readyForSocket && 'Connecting…') ||

    (socketState === 'disconnected' && readyForSocket && 'Reconnecting…') ||

    null



  return (

    <PromptGuruShell className="pb-16">

      <Navbar />



      <section className="max-w-md mx-auto px-4 sm:px-6 pt-24 md:pt-32">

        <motion.div

          initial={{ opacity: 0, y: 12 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.4 }}

          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 sm:p-6 shadow-[0_0_25px_-5px_rgba(168,85,247,0.22)]"

        >

          <div className="mb-6">

            <h1 className="text-2xl font-bold text-white">Quiz Duel</h1>

            {sessionUser && (

              <p className="text-xs text-gray-500 mt-1 truncate">{sessionUser.name}</p>

            )}

          </div>



          {!sessionUser && (

            <p className="mb-4 text-sm text-gray-500">Loading…</p>

          )}



          {(statusLine || actionError) && (

            <div className="mb-4 space-y-2">

              {statusLine && (

                <p

                  className={`text-sm ${

                    socketState === 'error' ? 'text-red-400' : 'text-amber-200/90'

                  }`}

                >

                  {statusLine}

                </p>

              )}

              {actionError && <p className="text-sm text-red-400">{actionError}</p>}

            </div>

          )}



          <div className="flex gap-2 mb-4">

            <Button

              onClick={handleCreateRoom}

              disabled={!sessionUser || socketState === 'error'}

              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md"

            >

              <Swords className="size-4" /> Create

            </Button>

            <Button

              type="button"

              variant="outline"

              onClick={() => router.push('/practice/solo')}

              disabled={!sessionUser}

              className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10 rounded-md"

            >

              Solo

            </Button>

          </div>



          <div className="flex gap-2 mb-6">

            <input

              value={joinCode}

              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}

              maxLength={6}

              placeholder="Room code"

              disabled={!sessionUser}

              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}

              className="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2.5 uppercase tracking-[0.2em] text-white text-sm placeholder:tracking-normal placeholder:text-gray-500 backdrop-blur-sm focus:border-purple-400/50 focus:outline-none disabled:opacity-50"

            />

            <Button

              onClick={handleJoinRoom}

              disabled={!sessionUser || !joinCode.trim()}

              className="bg-purple-600 hover:bg-purple-700 text-white rounded-md px-4 disabled:opacity-50"

            >

              Join

            </Button>

          </div>



          <div>

            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Rooms</h2>

            {activeRooms.length === 0 ? (

              <p className="text-sm text-gray-500 py-2">None open</p>

            ) : (

              <ul className="space-y-1.5">

                {activeRooms.map((room) => (

                  <li key={room.roomCode}>

                    <button

                      type="button"

                      onClick={() => setJoinCode(room.roomCode)}

                      className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-left hover:border-purple-400/35 transition"

                    >

                      <span className="flex items-center gap-2 min-w-0">

                        <span className="font-semibold tracking-[0.15em] text-white">{room.roomCode}</span>

                        <span

                          role="button"

                          tabIndex={0}

                          onClick={(e) => {

                            e.stopPropagation()

                            void navigator.clipboard?.writeText(room.roomCode)

                          }}

                          onKeyDown={(e) => {

                            if (e.key === 'Enter') {

                              e.stopPropagation()

                              void navigator.clipboard?.writeText(room.roomCode)

                            }

                          }}

                          className="text-gray-500 hover:text-purple-400 shrink-0"

                          aria-label="Copy code"

                        >

                          <Copy className="size-3.5" />

                        </span>

                      </span>

                      <span className="text-xs text-gray-400 shrink-0 tabular-nums">

                        {room.playerCount} · {STATE_LABEL[room.state]}

                      </span>

                    </button>

                  </li>

                ))}

              </ul>

            )}

          </div>

        </motion.div>

      </section>

    </PromptGuruShell>

  )

}


