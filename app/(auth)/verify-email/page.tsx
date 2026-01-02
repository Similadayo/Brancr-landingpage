"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AuthCard } from "../components/AuthCard";
import { authApi } from "@/lib/api";
import { CheckCircleIcon, XCircleIcon } from "@/app/(tenant)/components/icons";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing verification token.");
            return;
        }

        authApi.verifyEmail({ token })
            .then(() => {
                setStatus("success");
                setMessage("Email verified successfully!");
                // Redirect after a short delay
                setTimeout(() => {
                    router.push("/app/onboarding");
                }, 2000);
            })
            .catch((err) => {
                setStatus("error");
                setMessage(err.message || "Verification failed or link expired.");
            });
    }, [token, router]);

    return (
        <AuthCard title="Email Verification">
            <div className="flex flex-col items-center space-y-6 text-center py-8">
                {status === "verifying" && (
                    <>
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                        <p className="text-gray-600 dark:text-gray-300">{message}</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircleIcon className="h-16 w-16 text-green-500" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Verified!</h3>
                        <p className="text-gray-600 dark:text-gray-300">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircleIcon className="h-16 w-16 text-red-500" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Failed</h3>
                        <p className="text-red-600 dark:text-red-400">{message}</p>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </AuthCard>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <AuthCard title="Email Verification">
                <div className="flex flex-col items-center space-y-6 text-center py-8">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <p className="text-gray-600 dark:text-gray-300">Loading...</p>
                </div>
            </AuthCard>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
