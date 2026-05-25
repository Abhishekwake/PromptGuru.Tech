'use client'

import Link from 'next/link'
import { Button } from './button'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { fetchSessionUser } from '@/lib/api'

const AUTH_CHANGED = 'promptguru:auth-changed'

function readHasBackendToken(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('token')
}

/** Call after login / logout (same-tab) so all Navbars refresh without a full reload. */
export function notifyAuthChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_CHANGED))
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setIsLoggedIn(readHasBackendToken())
    setHasMounted(true)

    const refreshAdmin = () => {
      const t = localStorage.getItem('token')
      if (!t) {
        setIsAdmin(false)
        return
      }
      fetchSessionUser(t)
        .then((u) => setIsAdmin(!!u.isAdmin))
        .catch(() => setIsAdmin(false))
    }
    refreshAdmin()

    const onStorage = () => {
      setIsLoggedIn(readHasBackendToken())
      refreshAdmin()
    }
    const onCustom = () => {
      setIsLoggedIn(readHasBackendToken())
      refreshAdmin()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(AUTH_CHANGED, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(AUTH_CHANGED, onCustom)
    }
  }, [])

  useEffect(() => {
    setIsLoggedIn(readHasBackendToken())
  }, [pathname])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut(auth).catch(() => {
        /* still clear app session if Firebase fails */
      })
      localStorage.removeItem('token')
      notifyAuthChanged()
      setIsLoggedIn(false)
      setIsAdmin(false)
      router.replace('/login?signedOut=1&redirect=/dashboard')
    } finally {
      setLoggingOut(false)
    }
  }

  if (!hasMounted) return null // Prevents mismatch error

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 
      backdrop-blur-md bg-white/5 border border-white/10 
      rounded-full px-6 py-3 flex items-center justify-between 
      w-[90%] max-w-6xl shadow-sm"
    >
      <Link href="/" className="text-lg font-bold tracking-wide">
        PromptGuru
      </Link>

      <div className="flex gap-4 items-center">
        <Link href="/battle" className="text-sm text-gray-300 hover:text-white transition">
          Battle
        </Link>
        <Link href="/leaderboard" className="text-sm text-gray-300 hover:text-white transition">
          Leaderboard
        </Link>
        <Link href="/practice/solo" className="text-sm text-gray-300 hover:text-white transition">
          Solo practice
        </Link>
        {!isLoggedIn ? (
          <>
            <Link href="#features" className="text-sm text-gray-300 hover:text-white transition">
              Features
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                Login
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition">
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-sm text-purple-300 hover:text-purple-200 transition font-medium">
                Admin
              </Link>
            )}
            <Button
              size="sm"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-70"
            >
              {loggingOut ? 'Signing out…' : 'Logout'}
            </Button>
          </>
        )}
      </div>
    </motion.nav>
  )
}
