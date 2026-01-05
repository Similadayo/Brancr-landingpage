"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "../components/AuthCard";
import { PasswordStrengthIndicator } from "../components/PasswordStrengthIndicator";
import { authApi, ApiError } from "@/lib/api";
import { validatePassword } from "@/lib/validation";
import { toast } from "react-hot-toast";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [passwords, setPasswords] = useState({
        password: "",
        confirmPassword: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!token) {
        return (
            <AuthCard title="Invalid Link">
                <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">This password reset link is invalid or has expired.</p>
                    <button
                        onClick={() => router.push("/auth/forgot-password")}
                        className="mt-4 text-primary hover:underline dark:text-primary-400"
                    >
                        Request a new one
                    </button>
                </div>
            </AuthCard>
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!token) {
            setError("Invalid token");
            return;
        }

        if (passwords.password !== passwords.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Enhanced password validation
        const validation = validatePassword(passwords.password);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return;
        }

        setIsSubmitting(true);

        try {
            await authApi.resetPassword({
                token,
                new_password: passwords.password
            });
            toast.success("Password reset successfully!");
            router.push("/auth/login");
        } catch (err) {
            if (err instanceof ApiError) {
                // Handle weak password errors from backend
                if (err.body?.error === 'weak_password' || err.body?.error === 'validation_error') {
                    setError(err.message || 'Password does not meet requirements');
                } else {
                    setError(err.message);
                }
            } else {
                setError("Failed to reset password. The link may have expired.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthCard
            title="Set new password"
            description="Your new password must be different to previously used passwords."
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                {error ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">{error}</p>
                ) : null}

                <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        New password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        value={passwords.password}
                        onChange={(e) => setPasswords(p => ({ ...p, password: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />
                    <PasswordStrengthIndicator password={passwords.password} />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={8}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50 dark:bg-dark-accent-primary dark:text-white dark:hover:bg-dark-accent-primary/90"
                >
                    {isSubmitting ? "Resetting password…" : "Reset password"}
                </button>
            </form>
        </AuthCard>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <AuthCard title="Set new password">
                <div className="flex justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            </AuthCard>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
