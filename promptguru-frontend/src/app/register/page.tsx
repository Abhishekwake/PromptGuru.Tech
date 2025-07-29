'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  const showNotification = (
    message: string,
    type: 'error' | 'success' = 'error',
    duration: number = 5000
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification(null);

    if (password !== rePassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Send verification email from Firebase
      await sendEmailVerification(user);

      // 3. Get the Firebase ID token to prove identity to backend
      const token = await user.getIdToken();

      // 4. Send all info to your backend to create user in MongoDB
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }), // Send all details
      });

      if (!res.ok) {
        // If backend fails, throw an error
        const errorData = await res.json();
        throw new Error(errorData.message || 'Backend registration failed.');
      }

      // 5. Show success message and redirect
      showNotification(
        'Successfully registered! Please verify your email before logging in.',
        'success',
        1500
      );

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred.';
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = err.message;
        }
      } else {
        errorMessage = err.message;
      }
      showNotification(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4 relative overflow-hidden">
      <motion.div
        className="absolute z-0 w-[600px] h-[600px] bg-purple-700/30 blur-[180px] rounded-full"
        animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0], scale: [1, 1.05, 1, 0.98, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-lg"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center">Register to PromptGuru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-sm text-purple-400"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="relative">
            <input
              type={showRePassword ? 'text' : 'password'}
              placeholder="Re-enter Password"
              required
              value={rePassword}
              onChange={(e) => setRePassword(e.target.value)}
              className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowRePassword(!showRePassword)}
              className="absolute right-2 top-2 text-sm text-purple-400"
            >
              {showRePassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Spinner /> : 'Register'}
          </button>

          {notification && (
            <div
              className={`mt-4 px-4 py-2 rounded-md text-sm ${
                notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}
            >
              {notification.message}
            </div>
          )}
        </form>
        <p className="mt-4 text-center text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
