'use client';

import { useRouter } from "next/navigation";
import { BellIcon } from "./icons";

export function NotificationsBell() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/app/inbox")}
      className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-accent hover:text-accent"
      aria-label="Notifications"
    >
      <BellIcon className="h-5 w-5" />
      <span>Inbox</span>
    </button>
  );
}
