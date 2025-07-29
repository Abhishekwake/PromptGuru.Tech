'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Spinner from '@/components/Spinner';

// Import the new Firebase function
import { auth, provider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    try {
      // Step 1: Sign in with Firebase on the client-side
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Get the Firebase ID token
      const token = await user.getIdToken();

      // Step 3: Send the token to your backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the token, not the password
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        showNotification('Login successful!', 'success');
        router.push('/dashboard');
      } else {
        showNotification(data.message || 'Login failed', 'error');
      }
    } catch (err: any) {
      let errorMessage = 'Invalid credentials';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'User not registered. Please create an account.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid credentials';
      }
      showNotification(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setNotification(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.emailVerified) {
        showNotification('Your Google account email is not verified.', 'error');
        setIsLoading(false);
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        showNotification('Google login successful!', 'success');
        router.push('/dashboard');
      } else {
        showNotification(data.message || 'Google login failed', 'error');
      }
    } catch (error) {
      showNotification('Google sign-in failed', 'error');
      console.error('Google sign-in error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      showNotification('Please enter your email in the email field above.', 'error');
      return;
    }
    setIsLoading(true);
    setNotification(null);
    try {
      await sendPasswordResetEmail(auth, email);
      showNotification('Password reset email sent!', 'success');
    } catch (error) {
      showNotification('Failed to send reset email.', 'error');
      console.error('Password reset error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4 relative overflow-hidden">
      {/* Background Glow */}
      <motion.div
        className="absolute z-0 w-[600px] h-[600px] bg-purple-700/30 blur-[180px] rounded-full"
        animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0], scale: [1, 1.05, 1, 0.98, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
      />
      {/* Black Dot Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-lg"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center">Login to PromptGuru</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full p-2 rounded-md bg-black border border-white/20 text-white focus:outline-none pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-200 transition"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Spinner /> : 'Login'}
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

        <button
          onClick={handlePasswordReset}
          className="mt-4 text-sm text-purple-400 hover:underline"
          type="button"
          disabled={isLoading}
        >
          Forgot Password?
        </button>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-100 p-2 rounded-md flex items-center justify-center gap-3 mt-6 disabled:opacity-50 text-gray-700 font-medium shadow"
        >
          {/* Google SVG Logo */}
          <svg className="w-6 h-6" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M533.5 278.4c0-18.2-1.5-35.9-4.3-53.1H272v100.6h146.9c-6.3 34.1-25 62.9-53.2 82.3v68.2h85.8c50.2-46.3 79-114.2 79-198z" />
            <path fill="#34A853" d="M272 544.3c71.6 0 131.7-23.7 175.6-64.3l-85.8-68.2c-23.9 16-54.4 25.3-89.8 25.3-69 0-127.5-46.7-148.5-109.4H34.9v68.8c43.7 86.4 133.7 147.8 237.1 147.8z" />
            <path fill="#FBBC05" d="M123.5 324.7c-10.2-30.3-10.2-62.9 0-93.2v-68.8H34.9c-40.1 78.6-40.1 171.3 0 249.9l88.6-68z" />
            <path fill="#EA4335" d="M272 107.7c38.7-.6 75.9 13.3 104.1 38.3l78-78C405.5 24.6 343.2-2 272 0 168.6 0 78.6 61.4 34.9 147.8l88.6 68.8c21-62.7 79.5-109.4 148.5-109z" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-4 text-center text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-purple-400 hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
