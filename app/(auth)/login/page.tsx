import { Suspense } from "react";
import { AuthCard } from "../components/AuthCard";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse space-y-8">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-4">
            <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

