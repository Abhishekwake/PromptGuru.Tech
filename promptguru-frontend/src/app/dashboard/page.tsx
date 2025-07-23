'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/button'
import Navbar from '@/components/Navbar'

type PromptItem = {
  _id: string
  prompt: string
  feedback: {
    Clarity: number
    Specificity: number
    Usefulness: number
    score: number
    suggested_prompts: string[]
    tips: string[]
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [token, setToken] = useState('')
  const [response, setResponse] = useState<PromptItem | null>(null)
  const [history, setHistory] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      router.push('/login')
    } else {
      setToken(storedToken)
      fetchHistory(storedToken)
    }
  }, [router])

  const fetchHistory = async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompt/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Backend returned non-200:', errText)
        return
      }

      const data = await res.json()
      setHistory(data)
    } catch (err) {
      console.error('Error fetching history:', err)
    }
  }

  const handleAnalyze = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompt/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      setResponse(data)
      setPrompt('')
      fetchHistory(token)
    } catch (err) {
      console.error(err)
      alert('Error analyzing prompt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen bg-black text-white relative overflow-hidden">
      <Navbar />

      {/* ✨ Background blur ball */}
      <motion.div className="absolute z-0 w-[600px] h-[600px] bg-purple-700/30 blur-[180px] rounded-full"
        animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0], scale: [1, 1.05, 1, 0.98, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
      />

      {/* ✨ Dot grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10 flex h-full">
        {/* 🧾 Sidebar */}
        <aside className="w-64 hidden md:block bg-white/5 border-r border-white/10 p-4 pt-28 overflow-y-auto backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4 text-white">History</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            {history.map((item) => (
              <li key={item._id} className="hover:text-white cursor-pointer">
                <strong>Prompt:</strong> {item.prompt.slice(0, 50)}...
              </li>
            ))}
          </ul>
        </aside>

        {/* 📋 Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 pt-32">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center"
          >
            Write Better Prompts with AI
          </motion.h1>
          <p className="text-gray-400 mt-2 mb-8 text-center text-sm">
            Analyze, Improve & Master Prompt Engineering
          </p>

          {/* Input */}
          <div className="w-full max-w-xl flex gap-2">
            <input
              type="text"
              className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder:text-gray-400 outline-none backdrop-blur-sm"
              placeholder="Enter a prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={handleAnalyze} className="bg-purple-600 hover:bg-purple-700 text-white px-6">
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          {/* 🎯 Response */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 w-full max-w-2xl bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-md shadow-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-purple-400">AI Feedback</h3>
                <span className="bg-purple-700 text-white text-xs px-3 py-1 rounded-full">
                  Score: {response.feedback.score}/10
                </span>
              </div>

              <ul className="text-sm text-gray-300 space-y-1">
                <li><strong>Clarity:</strong> {response.feedback.Clarity}</li>
                <li><strong>Specificity:</strong> {response.feedback.Specificity}</li>
                <li><strong>Usefulness:</strong> {response.feedback.Usefulness}</li>
              </ul>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">✨ Suggested Prompts:</h4>
                <ul className="list-disc ml-5 space-y-1 text-gray-300 text-sm">
                  {response.feedback.suggested_prompts.map((sp, i) => (
                    <li key={i}>{sp}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">💡 Improvement Tips:</h4>
                <ul className="list-disc ml-5 space-y-1 text-gray-300 text-sm">
                  {response.feedback.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
