import { Suspense } from "react";
import { AuthCard } from "../components/AuthCard";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard
          title="Welcome back"
          description="Sign in to access your Brancr tenant dashboard, manage conversations and automation."
        >
          <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
            Preparing sign-in form…
          </div>
        </AuthCard>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

