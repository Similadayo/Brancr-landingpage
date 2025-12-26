'use client';

import { useRouter } from "next/navigation";
import { BellIcon } from "./icons";

export function NotificationsBell() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/app/inbox")}
      className="relative flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      aria-label="Notifications"
    >
      <BellIcon className="h-5 w-5" />
    </button>
  );
}
