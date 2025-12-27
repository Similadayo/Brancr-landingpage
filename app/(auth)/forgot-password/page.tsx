'use client';

import { FormEvent, useState } from "react";
import { AuthCard } from "../components/AuthCard";
import { ApiError, authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await authApi.requestPasswordReset({ email: email.trim() });
      setSuccess(
        "If an account exists for that email, we’ve sent password reset instructions. Please check your inbox."
      );
      setEmail("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404 || err.status === 400) {
          setSuccess(
            "If an account exists for that email, we’ve sent password reset instructions. Please check your inbox."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("We couldn’t process your request. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you use with Brancr. We’ll send instructions to create a new password."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {isSubmitting ? "Sending instructions…" : "Send reset link"}
        </button>
      </form>

      <p className="text-xs text-gray-500">
        Need help? Contact{" "}
        <a href="mailto:contact@brancr.com" className="text-primary underline-offset-4 hover:underline">
          contact@brancr.com
        </a>{" "}
        for assistance.
      </p>
    </AuthCard>
  );
}

