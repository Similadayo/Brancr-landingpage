"use client";

import { FormEvent, useState } from "react";
import { AuthCard } from "../components/AuthCard";
import { authApi, ApiError } from "@/lib/api";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await authApi.forgotPassword({ email });
            setIsSent(true);
            toast.success("Reset link sent!");
        } catch (err) {
            if (err instanceof ApiError) {
                // For security, we might want to show success even if email doesn't exist,
                // but if the API returns a specific error (like rate limit), we show it.
                // Assuming API returns generic success for non-existent emails.
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthCard
            title="Reset your password"
            description="Enter your email address and we'll send you a link to reset your password."
        >
            {isSent ? (
                <div className="text-center space-y-6">
                    <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-3xl">
                        ✉️
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Check your email</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        We've sent a password reset link to <span className="font-medium text-gray-900 dark:text-white">{email}</span>.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setIsSent(false)}
                            className="text-sm font-semibold text-primary hover:underline dark:text-primary-400"
                        >
                            Click here to try another email
                        </button>
                        <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            Back to Login
                        </Link>
                    </div>
                </div>
            ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">{error}</p>
                    ) : null}

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Work email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
                            placeholder="you@company.com"
                            autoComplete="email"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50 dark:bg-dark-accent-primary dark:text-white dark:hover:bg-dark-accent-primary/90"
                    >
                        {isSubmitting ? "Sending link…" : "Send reset link"}
                    </button>

                    <div className="text-center mt-4">
                        <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            Back to Login
                        </Link>
                    </div>
                </form>
            )}
        </AuthCard>
    );
}
