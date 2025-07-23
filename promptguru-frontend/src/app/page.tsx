'use client'

import React from 'react';
import { motion } from 'framer-motion';


// Button component with TypeScript types
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

const Button = ({ children, className = '', variant = 'default', ...props }: ButtonProps) => {
  let baseStyles = 'px-5 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500';
  if (variant === 'outline') {
    baseStyles += ' border border-white/20 text-white hover:bg-white/10';
  } else {
    baseStyles += ' bg-[linear-gradient(90deg,theme(colors.purple.700),theme(colors.purple.500))] text-white shadow-md';
  }
  return (
    <button className={`${baseStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Link component with TypeScript types
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

const Link = ({ href, children, ...props }: LinkProps) => {
  return (
    <a href={href} className="no-underline" {...props}>
      {children}
    </a>
  );
};
// Mock Navbar component
const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-4 py-6 flex justify-between items-center max-w-6xl mx-auto">
      <div className="text-2xl font-bold text-white">PromptGuru</div>
      <div className="space-x-4">
        <Link href="#features">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Features
          </Button>
        </Link>
        <Link href="/login">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Sign In
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-10 relative overflow-hidden font-sans">

      {/* ✅ Reusable Navbar Component */}
      <Navbar />

      {/* 🔮 Moving Glowing Background - Adjusted for a more diffused, subtle ambient purple glow */}
      <motion.div
        className="absolute z-0 w-[800px] h-[800px] rounded-full" // Increased size for wider spread
        animate={{
          x: [0, 60, -60, 0], // Increased movement for a more dynamic feel
          y: [0, -40, 40, 0], // Increased movement
          scale: [1, 1.1, 1, 0.95, 1],
        }}
        transition={{
          duration: 25, // Slightly longer duration for smoother animation
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          top: '50%',
          left: '50%',
          position: 'absolute',
          translateX: '-50%',
          translateY: '-50%',
          // Radial gradient for ambient purple glow, with very low opacity and high blur
          // Original: rgba(168, 85, 247, 0.2) -> 0.2 + (0.2 * 0.3) = 0.26
          // Original: rgba(139, 92, 246, 0.15) -> 0.15 + (0.15 * 0.3) = 0.195
          background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.26) 0%, rgba(139, 92, 246, 0.195) 50%, transparent 70%)',
          filter: 'blur(250px)' // Significantly increased blur for maximum diffusion
        }}
      />

      {/* 🌟 Hero Section - Adjusted glow backdrop and card shadow for softer effect */}
      <div className="relative max-w-3xl mx-auto mt-32 md:mt-40 z-10">
        {/* Subtle Glow Backdrop - Adjusted opacity and blur for a softer purple look */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.78 }} // Original: 0.6 -> 0.6 + (0.6 * 0.3) = 0.78
          transition={{ delay: 0.4, duration: 1.5 }} // Longer duration for smoother fade-in
          className="absolute inset-0 -z-10 rounded-2xl overflow-hidden"
          style={{
            // Original: rgba(168, 85, 247, 0.35) -> 0.35 + (0.35 * 0.3) = 0.455
            // Original: rgba(139, 92, 246, 0.3) -> 0.3 + (0.3 * 0.3) = 0.39
            background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.455) 0%, rgba(139, 92, 246, 0.39) 50%, transparent 70%)',
            filter: 'blur(90px)' // Increased blur
          }}
        />

        {/* Hero Card - Adjusted box shadow for a softer, more subtle purple glow */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }} // Longer duration for smoother animation
          className="backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 rounded-2xl w-full px-6 py-10 text-center relative overflow-hidden"
          style={{
            // Original: rgba(168, 85, 247, 0.4) -> 0.4 + (0.4 * 0.3) = 0.52
            boxShadow: '0 0 50px -10px rgba(168, 85, 247, 0.52)' // Increased shadow intensity and spread
          }}
        >
          {/* Inner Glow - Adjusted opacity and blur for a softer purple effect */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                x: [0, 10, -10, 0], // Slightly less movement
                y: [0, -10, 10, 0] // Slightly less movement
              }}
              transition={{
                duration: 20, // Longer duration
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-20 -left-20 w-64 h-64 rounded-full" // Adjusted size
              style={{
                // Original: rgba(139, 92, 246, 0.15) -> 0.15 + (0.15 * 0.3) = 0.195
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.195) 0%, transparent 70%)',
                filter: 'blur(30px)' // Increased blur
              }}
            />
            <motion.div
              animate={{
                x: [0, -10, 10, 0], // Slightly less movement
                y: [0, 10, -10, 0] // Slightly less movement
              }}
              transition={{
                duration: 25, // Longer duration
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full" // Adjusted size
              style={{
                // Original: rgba(139, 92, 246, 0.15) -> 0.15 + (0.15 * 0.3) = 0.195
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.195) 0%, transparent 70%)',
                filter: 'blur(30px)' // Increased blur
              }}
            />
          </div>

          {/* Main Hero Title - Retained white text */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 relative z-10 text-white">
            PromptGuru — Write Better Prompts with AI
          </h1>
          <p className="text-lg text-gray-300 mb-6 relative z-10">
            Learn to write better prompts through instant analysis, suggestions, and score.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 relative z-10">
            <Link href="/register">
              <Button className="relative overflow-hidden group neon-button">
                <span className="absolute inset-0 bg-[linear-gradient(90deg,theme(colors.purple.700),theme(colors.purple.500))] opacity-100 group-hover:opacity-90 transition-all duration-300"></span> {/* Changed to purple gradient */}
                <span className="relative z-10 flex items-center gap-2">
                  🚀 Try for Free
                </span>
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/40 transition-all">
                <span className="flex items-center gap-2">
                  <span className="text-gray-300">📂</span> Explore Features
                </span>
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ✨ Feature Cards - Adjusted glow for softer purple effect */}
      <motion.section
        id="features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl w-full px-4 z-10 mx-auto"
      >
        {[
          {
            title: "✍️ Prompt Analyzer",
            desc: "Instant AI feedback to improve your prompt quality.",
            color: "from-purple-500/15 to-purple-400/15" // Changed pink to purple
          },
          {
            title: "📈 Learning-Based Scoring",
            desc: "Know your prompt strength and how to improve.",
            color: "from-purple-400/15 to-purple-500/15" // Changed pink to purple
          },
          {
            title: "🔐 Private History",
            desc: "Access your saved prompts anytime securely.",
            color: "from-purple-500/15 to-purple-400/15" // Changed pink to purple
          }
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            viewport={{ once: true }}
            className="backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 rounded-xl p-6 text-center relative overflow-hidden"
            style={{
              // Original: rgba(168, 85, 247, 0.2) -> 0.2 + (0.2 * 0.3) = 0.26
              boxShadow: '0 0 25px -5px rgba(168, 85, 247, 0.26)' // Reduced shadow intensity
            }}
          >
            {/* Feature Card Glow - Adjusted opacity and blur for softer purple effect */}
            <div className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-br ${f.color} opacity-32`}></div> {/* Original opacity-25 -> 0.25 + (0.25 * 0.3) = 0.325, rounded to 32 */}
            <motion.div
              animate={{
                opacity: [0.26, 0.52, 0.26] // Original: [0.2, 0.4, 0.2] -> [0.26, 0.52, 0.26]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full -z-10" // Adjusted size
              style={{
                // Original: rgba(139, 92, 246, 0.1) -> 0.1 + (0.1 * 0.3) = 0.13
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.13) 0%, transparent 70%)',
                filter: 'blur(18px)' // Adjusted blur
              }}
            />

            <h3 className="text-lg font-semibold mb-2 text-white">
              {f.title}
            </h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* 🎯 Problem/Solution Section - Adjusted for consistent purple glow */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
        className="mt-32 max-w-5xl mx-auto px-4 z-10"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white"
            >
              The Prompt Writing Struggle is Real
            </motion.h2>

            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              viewport={{ once: true }}
              className="space-y-4 text-gray-300"
            >
              {[
                "❌ Wasting time guessing what works",
                "❌ Getting inconsistent AI results",
                "❌ No clear way to improve prompts",
                "❌ Losing your best prompt variations"
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-start gap-3"
                >
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative h-80 backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 rounded-2xl overflow-hidden"
            style={{
              // Original: rgba(168, 85, 247, 0.2) -> 0.2 + (0.2 * 0.3) = 0.26
              boxShadow: '0 0 25px -5px rgba(168, 85, 247, 0.26)' // Adjusted subtle shadow
            }}
          >
            {/* Inner Glow for Problem/Solution card */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
              <motion.div
                animate={{
                  opacity: [0.13, 0.26, 0.13], // Original: [0.1, 0.2, 0.1] -> [0.13, 0.26, 0.13]
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-10 -left-10 w-40 h-40 rounded-full"
                style={{
                  // Original: rgba(139, 92, 246, 0.08) -> 0.08 + (0.08 * 0.3) = 0.104
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.104) 0%, transparent 70%)',
                  filter: 'blur(15px)',
                  pointerEvents: 'none'
                }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center"> {/* Centered content */}
              {/* Replaced span with img tag */}
              <img
                src="https://placehold.co/400x250/1B002D/FFFFFF?text=Prompt+Improvement"
                alt="Diagram showing prompt improvement process"
                className="w-full h-full object-contain p-4" // Added padding to prevent image from touching edges
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x250/cccccc/000000?text=Image+Error'; }} // Fallback image
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 🛠️ How It Works Section - Adjusted for consistent purple glow */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mt-40 max-w-4xl mx-auto px-4 z-10 text-center"
      >
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4 text-white"
        >
          Transform Your Prompt Writing in 3 Steps
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          Go from guessing to mastering AI communication with our guided system
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {[
            {
              title: "1. Paste Your Prompt",
              desc: "Get instant analysis of strengths and weaknesses",
              icon: "📋"
            },
            {
              title: "2. Receive AI Suggestions",
              desc: "Actionable tips to improve clarity and results",
              icon: "✨"
            },
            {
              title: "3. Refine & Save",
              desc: "Build your personal library of effective prompts",
              icon: "💾"
            }
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * i }}
              viewport={{ once: true }}
              className="backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 p-6 rounded-xl relative overflow-hidden"
              style={{
                // Original: rgba(168, 85, 247, 0.2) -> 0.2 + (0.2 * 0.3) = 0.26
                boxShadow: '0 0 25px -5px rgba(168, 85, 247, 0.26)' // Adjusted shadow
              }}
            >
              <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                <motion.div
                  animate={{
                    opacity: [0.195, 0.325, 0.195] // Original: [0.15, 0.25, 0.15] -> [0.195, 0.325, 0.195]
                  }}
                  transition={{
                    duration: 5 + i,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full" // Adjusted size
                  style={{
                    // Original: rgba(139, 92, 246, 0.08) -> 0.08 + (0.08 * 0.3) = 0.104
                    background: i % 2 === 0
                      ? 'radial-gradient(circle, rgba(139, 92, 246, 0.104) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(139, 92, 246, 0.104) 0%, transparent 70%)',
                    filter: 'blur(15px)' // Adjusted blur
                  }}
                />
              </div>
              <div className="text-3xl mb-4 text-white">{step.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 📊 Benefits Comparison Section - Adjusted for consistent purple glow */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mt-40 max-w-5xl mx-auto px-4 z-10"
      >
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-12 text-center text-white"
        >
          Why PromptGuru Becomes Your AI Copilot
        </motion.h2>

        <div className="backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 rounded-xl overflow-hidden"
             style={{
               // Original: rgba(168, 85, 247, 0.2) -> 0.2 + (0.2 * 0.3) = 0.26
               boxShadow: '0 0 25px -5px rgba(168, 85, 247, 0.26)'
             }}>
          <div className="grid grid-cols-4">
            {/* Backgrounds remain neutral dark gray, text light */}
            <div className="col-span-1 p-4 bg-gray-900 font-medium text-gray-200">Metric</div>
            <div className="col-span-1 p-4 bg-gray-800 font-medium text-gray-200">Without PG</div>
            <div className="col-span-2 p-4 bg-gray-900 font-medium text-gray-200">With PromptGuru</div>

            {[
              ["Time per prompt", "20-30 mins", "Under 5 mins", "⏱️"],
              ["AI result quality", "Inconsistent", "Consistently high", "🎯"],
              ["Learning curve", "Trial & error", "Guided improvement", "📈"],
              ["Prompt organization", "Scattered", "Centralized library", "🗄️"]
            ].map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                viewport={{ once: true }}
                className="contents"
              >
                <div className="col-span-1 p-4 border-t border-white/10 flex items-center gap-2 text-white">
                  {row[3]} {row[0]}
                </div>
                <div className="col-span-1 p-4 border-t border-white/10 text-gray-400">{row[1]}</div>
                {/* Background for "With PromptGuru" column remains neutral dark gray */}
                <div className="col-span-2 p-4 border-t border-white/10 bg-gray-800 text-white">{row[2]}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 💬 Testimonials Section - Adjusted for consistent purple glow */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mt-40 max-w-4xl mx-auto px-4 z-10"
      >
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-12 text-center text-white"
        >
          Trusted by AI Enthusiasts Worldwide
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              quote: "Cut my prompt writing time in half while getting better results from ChatGPT.",
              author: "Anuj B., Content Creator",
              role: "500+ prompts analyzed"
            },
            {
              quote: "Finally understand why some prompts work and others don't. The scoring system is genius.",
              author: "Moin C., Developer",
              role: "AI API user"
            }
          ].map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * i }}
              viewport={{ once: true }}
              className="backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 p-6 rounded-xl relative overflow-hidden"
              style={{
                // Original: rgba(168, 85, 247, 0.25) -> 0.25 + (0.25 * 0.3) = 0.325
                boxShadow: '0 0 30px -5px rgba(168, 85, 247, 0.325)'
              }}
            >
              <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                <motion.div
                  animate={{
                    opacity: [0.325, 0.455, 0.325] // Original: [0.25, 0.35, 0.25] -> [0.325, 0.455, 0.325]
                  }}
                  transition={{
                    duration: 8 + i,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full" // Adjusted size
                  style={{
                    // Original: rgba(139, 92, 246, 0.1) -> 0.1 + (0.1 * 0.3) = 0.13
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.13) 0%, transparent 70%)',
                    filter: 'blur(20px)' // Adjusted blur
                  }}
                />
              </div>
              <p className="text-lg mb-4 relative z-10 text-white">"{testimonial.quote}"</p>
              <div className="relative z-10">
                <p className="font-medium text-white">{testimonial.author}</p>
                <p className="text-sm text-gray-400">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 🚀 Final CTA Section - Adjusted for consistent purple glow */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mt-40 max-w-3xl mx-auto px-4 z-10 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/20 shadow-xl rounded-2xl p-8 relative overflow-hidden"
          style={{
            // Original: rgba(168, 85, 247, 0.35) -> 0.35 + (0.35 * 0.3) = 0.455
            boxShadow: '0 0 50px -15px rgba(168, 85, 247, 0.455)'
          }}
        >
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                x: [0, 20, -20, 0], // Adjusted movement
                y: [0, -10, 10, 0] // Adjusted movement
              }}
              transition={{
                duration: 25, // Longer duration
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-20 -left-20 w-80 h-80 rounded-full" // Adjusted size
              style={{
                // Original: rgba(139, 92, 246, 0.1) -> 0.1 + (0.1 * 0.3) = 0.13
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.13) 0%, transparent 70%)',
                filter: 'blur(35px)' // Adjusted blur
              }}
            />
          </div>
          <h2 className="text-3xl font-bold mb-4 relative z-10 text-white">
            Ready to Master AI Prompting?
          </h2>
          <p className="text-gray-300 mb-6 relative z-10">
            Join thousands of users getting better AI results in minutes, not weeks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link href="/register">
              <Button className="relative overflow-hidden group neon-button">
                <span className="absolute inset-0 bg-[linear-gradient(90deg,theme(colors.purple.700),theme(colors.purple.500))] opacity-100 group-hover:opacity-90 transition-all duration-300"></span> {/* Changed to purple gradient */}
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                </span>
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4 relative z-10">No credit card required • 7-day free trial</p>
        </motion.div>
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
