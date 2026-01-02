'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/AuthCard";
import { PhoneInput } from "../components/PhoneInput";
import { ApiError, authApi } from "@/lib/api";
import { signupSchema, validateWithErrors } from "@/lib/validation";

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
    window.location.href = `${apiBaseUrl}/api/auth/google/start?redirect=${redirect}`;
  }

  function updateField(field: keyof typeof formValues, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
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

      // Handle redirect based on verification status
      if (result.verification_required && !result.email_verified) {
        router.push(result.redirect_to || "/auth/verify-email-sent");
        return;
      }

      // If already verified or no verification required, check session and go to onboarding
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
        // Log specific API error details
        console.error("API Error Status:", err.status);
        console.error("API Error Body:", err.body);

        setError(err.message || "An error occurred during signup.");
      } else if (err instanceof Error) {
        console.error("Standard Error:", err.message);
        setError(err.message);
      } else {
        console.error("Unknown error type:", err);
        setError("We couldn't create your account. Please try again or contact support.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your Brancr account"
      description="Get started with AI-powered automation for your team. We’ll guide you through connecting your first channel."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">{error}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
              placeholder="Ada Lovelace"
              autoComplete="name"
            />
            {fieldErrors['name'] && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{fieldErrors['name']}</p>}
          </div>

          <div>
            <label htmlFor="company_name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Business name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              required
              value={formValues.company_name}
              onChange={(event) => updateField("company_name", event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
              placeholder="Brancr Studio"
              autoComplete="organization"
            />
            {fieldErrors['company_name'] && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{fieldErrors['company_name']}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formValues.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
            placeholder="you@company.com"
            autoComplete="email"
          />
          {fieldErrors['email'] && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{fieldErrors['email']}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone number
            </label>
            <PhoneInput
              id="phone"
              name="phone"
              required
              value={formValues.phone}
              onChange={(val) => updateField("phone", val)}
              autoComplete="tel"
            />
            {fieldErrors['phone'] && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{fieldErrors['phone']}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            {fieldErrors['password'] && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{fieldErrors['password']}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50 dark:bg-dark-accent-primary dark:text-white dark:hover:bg-dark-accent-primary/90"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500 dark:bg-dark-surface dark:text-gray-400">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 dark:bg-dark-elevated dark:border-dark-border dark:text-gray-200 dark:hover:bg-dark-surface"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign up with Google
      </button>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        By creating an account you agree to Brancr&apos;s{" "}
        <a href="/terms" className="text-primary underline-offset-4 hover:underline dark:text-primary-dark">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy-policy" className="text-primary underline-offset-4 hover:underline dark:text-primary-dark">
          Privacy Policy
        </a>
        .
      </p>
    </AuthCard>
  );
}

