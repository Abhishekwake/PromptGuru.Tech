'use client';
import { motion } from 'framer-motion';

export default function Spinner() {
  return (
    <motion.div
      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
      role="status"
    />
  );
}
