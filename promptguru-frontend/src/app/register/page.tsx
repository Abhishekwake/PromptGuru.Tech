'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/login')
      } else {
        alert(data?.message || "Registration failed")
      }
    } catch (err) {
      alert("Error connecting to backend")
      console.error(err)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4 relative overflow-hidden">
      {/* Moving Glow */}
      <motion.div
        className="absolute z-0 w-[600px] h-[600px] bg-purple-700/30 blur-[180px] rounded-full"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -20, 20, 0],
          scale: [1, 1.05, 1, 0.98, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ top: '50%', left: '50%', position: 'absolute', translateX: '-50%', translateY: '-50%' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-lg"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center">Register to PromptGuru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded-md">
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-gray-400">
          Already have an account? <Link href="/login" className="text-purple-400 hover:underline">Login</Link>
        </p>
      </motion.div>
    </main>
  )
}
