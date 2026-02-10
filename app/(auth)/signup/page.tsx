'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneInput } from "../components/PhoneInput";
import { PasswordStrengthIndicator } from "../components/PasswordStrengthIndicator";
import { ApiError, authApi } from "@/lib/api";
import { signupSchema, validateWithErrors } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleGoogleSignup() {
    const redirect = encodeURIComponent('/app/onboarding');
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.brancr.com';
    window.location.href = `${apiBaseUrl}/api/google/start?redirect=${redirect}`;
  }

  function updateField(field: keyof typeof formValues, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const validation = validateWithErrors(signupSchema, {
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
      company_name: formValues.company_name,
      phone: formValues.phone,
    });

    if (!validation.success) {
      const map: Record<string, string> = {};
      validation.errors.forEach((err) => {
        const [path, message] = err.split(': ');
        map[path] = message;
      });
      setFieldErrors(map);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authApi.signup({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        company_name: formValues.company_name.trim(),
        phone: formValues.phone.trim(),
      });

      if (result?.verification_required && !result?.email_verified) {
        router.push(result.redirect_to || "/verify-email-sent");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        await authApi.me();
        router.push("/app/onboarding");
        router.refresh();
      } catch (authErr) {
        console.warn('Auth check after signup failed, redirecting anyway:', authErr);
        router.push("/app/onboarding");
        router.refresh();
      }
    } catch (err) {
      console.error("Signup error details:", err);

      if (err instanceof ApiError) {
        if (err.body?.error === 'weak_password' || err.body?.error === 'validation_error') {
          setFieldErrors({ password: err.message || 'Password does not meet requirements' });
        } else {
          setError(err.message || "An error occurred during signup.");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("We couldn't create your account. Please try again or contact support.");
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
        staggerChildren: 0.05
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
          Create account
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          variants={itemVariants}
        >
          Start automating your customer engagement today.
        </motion.p>
      </div>

      <motion.div variants={itemVariants}>
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="relative inline-flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow active:scale-[0.98] dark:bg-dark-elevated dark:border-dark-border dark:text-gray-200 dark:hover:bg-dark-surface dark:hover:border-dark-border/80"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Sign up with Google</span>
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
          <span className="bg-white px-4 text-gray-500 dark:bg-dark-surface dark:text-gray-400 font-medium tracking-wider">Or register with email</span>
        </div>
      </motion.div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 flex items-start gap-3 dark:bg-error-900/10 dark:border-error-800 dark:text-error-300">
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

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 dark:bg-dark-elevated dark:text-white ${fieldErrors['name']
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-500/50'
                : 'border-gray-200 bg-gray-50/50 focus:border-primary focus:ring-primary/10 dark:border-dark-border dark:focus:border-primary'
                }`}
              placeholder="Ada Lovelace"
              autoComplete="name"
            />
            {fieldErrors['name'] && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{fieldErrors['name']}</p>}
          </div>

          <div>
            <label htmlFor="company_name" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Business name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              required
              value={formValues.company_name}
              onChange={(event) => updateField("company_name", event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 dark:bg-dark-elevated dark:text-white ${fieldErrors['company_name']
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-500/50'
                : 'border-gray-200 bg-gray-50/50 focus:border-primary focus:ring-primary/10 dark:border-dark-border dark:focus:border-primary'
                }`}
              placeholder="Brancr Studio"
              autoComplete="organization"
            />
            {fieldErrors['company_name'] && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{fieldErrors['company_name']}</p>}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formValues.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 dark:bg-dark-elevated dark:text-white ${fieldErrors['email']
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-500/50'
              : 'border-gray-200 bg-gray-50/50 focus:border-primary focus:ring-primary/10 dark:border-dark-border dark:focus:border-primary'
              }`}
            placeholder="you@company.com"
            autoComplete="email"
          />
          {fieldErrors['email'] && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{fieldErrors['email']}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Phone number
            </label>
            <div className={fieldErrors['phone'] ? "[&_input]:border-red-300 [&_input]:focus:border-red-500" : ""}>
              <PhoneInput
                id="phone"
                name="phone"
                required
                value={formValues.phone}
                onChange={(val) => updateField("phone", val)}
                autoComplete="tel"
              />
            </div>
            {fieldErrors['phone'] && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{fieldErrors['phone']}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={formValues.password}
              onChange={(event) => updateField("password", event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 dark:bg-dark-elevated dark:text-white ${fieldErrors['password']
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-500/50'
                : 'border-gray-200 bg-gray-50/50 focus:border-primary focus:ring-primary/10 dark:border-dark-border dark:focus:border-primary'
                }`}
              placeholder="8+ characters"
              autoComplete="new-password"
            />
            {/* Simple spacer instead of strength indicator to save space if needed, or keep it */}
            <div className="mt-2">
              <PasswordStrengthIndicator password={formValues.password} />
            </div>
            {fieldErrors['password'] && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{fieldErrors['password']}</p>}
          </div>
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
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </motion.div>
      </form>

      <motion.p
        variants={itemVariants}
        className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400"
      >
        By creating an account you agree to Brancr&apos;s{" "}
        <a href="/terms" className="font-medium text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy-policy" className="font-medium text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          Privacy Policy
        </a>
        .
      </motion.p>

      <motion.p
        variants={itemVariants}
        className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"
      >
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors dark:text-blue-400 dark:hover:text-blue-300">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
