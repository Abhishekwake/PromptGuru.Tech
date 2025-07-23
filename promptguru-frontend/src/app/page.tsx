'use client'

import { Button } from "@/components/button"
import Link from "next/link"
import { motion } from "framer-motion"
import Navbar from "@/components/Navbar"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-10 relative overflow-hidden">

      {/* ✅ Reusable Navbar Component */}
      <Navbar />

      {/* 🔮 Moving Glowing Background */}
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
        style={{
          top: '50%',
          left: '50%',
          position: 'absolute',
          translateX: '-50%',
          translateY: '-50%'
        }}
      />

      {/* 🎯 Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="backdrop-blur-md bg-white/5 border border-white/10 shadow-lg rounded-2xl w-full max-w-3xl px-6 py-10 text-center z-10 mt-40 mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          PromptGuru — Write Better Prompts with AI
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Learn to write better prompts through instant analysis, suggestions, and score.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link href="/register">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
              🚀 Try for Free
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              📂 Explore Features
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 📦 Feature Cards */}
      <motion.section
        id="features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-24 grid md:grid-cols-3 gap-6 max-w-6xl w-full px-4 z-10 mx-auto"
      >
        {[
          { title: "✍️ Prompt Analyzer", desc: "Instant AI feedback to improve your prompt quality." },
          { title: "📈 Learning-Based Scoring", desc: "Know your prompt strength and how to improve." },
          { title: "🔐 Private History", desc: "Access your saved prompts anytime securely." }
        ].map((f, i) => (
          <div
            key={i}
            className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-xl shadow-sm text-center"
          >
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </div>
        ))}
      </motion.section>

      {/* 🔚 Footer */}
      <footer className="mt-24 text-gray-600 text-sm text-center z-10">
        © 2025 PromptGuru.Tech — Built with ❤️ by Abhishek
      </footer>

      {/* 🌌 Starry Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
    </main>
  )
}
