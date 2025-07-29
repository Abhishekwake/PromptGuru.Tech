'use client'

import Link from 'next/link'
import { Button } from './button'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    setHasMounted(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
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
            <Button size="sm" onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
              Logout
            </Button>
          </>
        )}
      </div>
    </motion.nav>
  )
}
