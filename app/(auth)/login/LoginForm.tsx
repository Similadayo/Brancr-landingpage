'use client';

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, authApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const nextUrl = searchParams.get("next") ?? "/app";

  function handleGoogleLogin() {
    const redirect = encodeURIComponent('/app/onboarding');
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.brancr.com';
    window.location.href = `${apiBaseUrl}/api/google/start?redirect=${redirect}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authApi.login({ email: email.trim(), password });

      if (response.email_verified === false) {
        router.push(`/auth/verify-email-sent?email=${encodeURIComponent(email)}`);
        return;
      }

      router.push(nextUrl);

      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429 || err.body?.error === 'account_locked') {
          setIsLocked(true);
          setError(err.message || 'Too many failed attempts. Please try again later.');
        } else {
          setIsLocked(false);
          setError(err.message);
        }
      } else {
        setIsLocked(false);
        setError("Unable to login. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full"
    >
      <div className="mb-8 text-center sm:text-left">
        <motion.h1
          className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
          variants={itemVariants}
        >
          Welcome back
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          variants={itemVariants}
        >
          Sign in to access your Brancr tenant dashboard.
        </motion.p>
      </div>

      <motion.div variants={itemVariants}>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="relative inline-flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow active:scale-[0.98] dark:bg-dark-elevated dark:border-dark-border dark:text-gray-200 dark:hover:bg-dark-surface dark:hover:border-dark-border/80"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Sign in with Google</span>
        </button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="relative my-8"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-gray-500 dark:bg-dark-surface dark:text-gray-400 font-medium tracking-wider">Or sign in with email</span>
        </div>
      </motion.div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${isLocked
                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200'
                  : 'border-error-200 bg-error-50 text-error-700 dark:bg-error-900/10 dark:border-error-800 dark:text-error-300'
                  }`}
              >
                <svg className="h-5 w-5 flex-shrink-0 mt-0.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:bg-dark-elevated dark:border-dark-border dark:text-white dark:focus:border-primary dark:focus:bg-dark-surface"
            placeholder="name@work-email.com"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:bg-dark-elevated dark:border-dark-border dark:text-white dark:focus:border-primary dark:focus:bg-dark-surface"
            placeholder="••••••••"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative w-full overflow-hidden rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-primary/50 disabled:shadow-none dark:bg-dark-accent-primary dark:hover:bg-blue-500"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </motion.div>
      </form>

      <motion.p
        variants={itemVariants}
        className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400"
      >
        Don't have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors dark:text-blue-400 dark:hover:text-blue-300">
          Create account
        </Link>
      </motion.p>
    </motion.div>
  );
}
