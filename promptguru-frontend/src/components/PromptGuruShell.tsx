'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type PromptGuruShellProps = {
  children: ReactNode
  className?: string
  fullHeight?: boolean
}

/** Dashboard-style canvas: black + dot grid + drifting purple orb */
export default function PromptGuruShell({
  children,
  className = '',
  fullHeight = false,
}: PromptGuruShellProps) {
  return (
    <main
      className={`bg-black text-white relative overflow-hidden font-sans antialiased ${
        fullHeight ? 'h-screen' : 'min-h-screen'
      } ${className}`}
    >
      <motion.div
        className="absolute z-0 w-[min(100vw,600px)] h-[min(100vw,600px)] max-w-[600px] max-h-[600px] bg-purple-700/30 blur-[180px] rounded-full pointer-events-none"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -20, 20, 0],
          scale: [1, 1.05, 1, 0.98, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '35%', left: '50%', translateX: '-50%', translateY: '-50%' }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </main>
  )
}
