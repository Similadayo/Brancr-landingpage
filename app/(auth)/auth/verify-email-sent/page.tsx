"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { AuthCard } from "../../components/AuthCard";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function VerifyEmailSentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email");
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email) {
            toast.error("Email not found. Please log in again.");
            return;
        }

        setIsResending(true);
        try {
            await authApi.resendVerification({ email });
            toast.success("Verification email resent!");
        } catch (error) {
            // Always show success to prevent enumeration, or generic error
            toast.success("If the email exists, we sent a new link.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthCard
            title="Check your email"
            description={`We sent a verification link to ${email || 'your email address'}. Please check your inbox and spam folder.`}
        >
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                    ✉️
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the link in the email to verify your account and get started.
                </p>

                <button
                    onClick={handleResend}
                    disabled={isResending || !email}
                    className="text-sm font-semibold text-primary hover:underline dark:text-blue-400"
                >
                    {isResending ? "Sending..." : "Resend verification email"}
                </button>

                <button
                    onClick={() => router.push("/auth/login")}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    ← Back to login
                </button>
            </div>
        </AuthCard>
    );
}
