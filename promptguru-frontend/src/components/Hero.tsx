"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/button";
import Image from "next/image";
import Robot from "@/assets/promptbot.png"; // 👈 your robot image goes here (add it manually)

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black text-white overflow-hidden">
      {/* Background glowing radial burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute -z-20 w-[1200px] h-[1200px] bg-gradient-radial from-purple-500/30 via-transparent to-black rounded-full blur-3xl"
      />

      {/* Floating Particle Lights */}
      <motion.div
        className="absolute -z-10 w-full h-full"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="absolute top-10 left-1/3 w-2 h-2 bg-white/30 rounded-full blur-md animate-ping" />
        <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 bg-purple-400/40 rounded-full blur-sm animate-ping" />
        <div className="absolute bottom-10 left-1/5 w-1.5 h-1.5 bg-blue-400/40 rounded-full blur-sm animate-ping" />
      </motion.div>

      {/* Prompt Robot / Orb */}
      <motion.div
        className="relative w-36 h-36 rounded-full border border-white/10 shadow-xl backdrop-blur-xl"
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: [0.9, 1, 0.9], rotate: [0, 2, -2, 0] }}
        transition={{ repeat: Infinity, duration: 6 }}
      >
        <Image
          src={Robot}
          alt="Prompt Robot"
          fill
          className="object-contain p-4"
        />
      </motion.div>

      {/* Hero Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-10 space-y-4 max-w-3xl"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Unleash Your Thoughts with AI
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Learn to write better prompts with your personal AI mentor.<br />
          Designed for developers, thinkers, and creators.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button className="text-base px-6 py-3">🪄 Generate with AI</Button>
          <Button variant="outline" className="text-base px-6 py-3">
            📂 Explore Prompts
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
