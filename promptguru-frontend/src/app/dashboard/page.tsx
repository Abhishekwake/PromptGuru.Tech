'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion' // Import AnimatePresence for exit animations
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

// Basic Modal/Dialog Component (could be moved to its own file if desired)
const MobileHistoryDialog = ({ isOpen, onClose, history }: { isOpen: boolean; onClose: () => void; history: PromptItem[] }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={onClose} // Close when clicking outside
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-zinc-900 border border-zinc-700 text-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-700">
              <h2 className="text-lg font-semibold">History</h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">
                &times;
              </button>
            </div>
            <div className="p-4">
              {history.length === 0 ? (
                <p className="text-center text-zinc-500 py-4">No history yet.</p>
              ) : (
                <ul className="space-y-2 text-sm text-zinc-300">
                  {history.map((item) => (
                    <li key={item._id} className="hover:text-white cursor-pointer break-words">
                      <strong>Prompt:</strong> {item.prompt.slice(0, 80)}{item.prompt.length > 80 ? '...' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


export default function Dashboard() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [token, setToken] = useState('')
  const [response, setResponse] = useState<PromptItem | null>(null)
  const [history, setHistory] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false) // State for mobile history dialog

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
        {/* 🧾 Sidebar (Desktop) */}
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
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 pt-24 md:pt-32">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-4xl font-bold text-center"
          >
            Write Better Prompts with AI
          </motion.h1>
          <p className="text-gray-400 mt-2 mb-8 text-center text-sm px-4">
            Analyze, Improve & Master Prompt Engineering
          </p>

          {/* Input */}
          <div className="w-full max-w-xl flex flex-col sm:flex-row gap-2 px-4">
            <input
              type="text"
              className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder:text-gray-400 outline-none backdrop-blur-sm"
              placeholder="Enter a prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={handleAnalyze} className="bg-purple-600 hover:bg-purple-700 text-white px-6 w-full sm:w-auto mt-2 sm:mt-0">
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          {/* 🎯 Response */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 w-full max-w-2xl bg-white/5 p-4 sm:p-6 rounded-xl border border-white/10 backdrop-blur-md shadow-md space-y-4 px-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-purple-400">AI Feedback</h3>
                <span className="bg-purple-700 text-white text-xs px-2 py-0.5 rounded-full">
                  Score: {response.feedback.score}/10
                </span>
              </div>

              <ul className="text-xs text-gray-300 space-y-1">
                <li><strong>Clarity:</strong> {response.feedback.Clarity}</li>
                <li><strong>Specificity:</strong> {response.feedback.Specificity}</li>
                <li><strong>Usefulness:</strong> {response.feedback.Usefulness}</li>
              </ul>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">✨ Suggested Prompts:</h4>
                <ul className="list-disc ml-4 space-y-1 text-gray-300 text-xs">
                  {response.feedback.suggested_prompts.map((sp, i) => (
                    <li key={i}>{sp}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">💡 Improvement Tips:</h4>
                <ul className="list-disc ml-4 space-y-1 text-gray-300 text-xs">
                  {response.feedback.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Mobile History Button */}
          <div className="md:hidden fixed bottom-4 right-4 z-20">
            <Button onClick={() => setIsHistoryOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full shadow-lg">
              View History
            </Button>
          </div>
        </div>
      </div>

      {/* Render the custom Mobile History Dialog */}
      <MobileHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />
    </main>
  )
}