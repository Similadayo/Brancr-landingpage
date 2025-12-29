'use client';

import { useState } from "react";
import { BellIcon } from "./icons";
import { useAlertCounts } from "../hooks/useAlerts";
import { useNotificationCounts } from "../hooks/useNotifications";
import { AlertsOverlay } from "./AlertsOverlay";

export function NotificationsBell() {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const { data: alertCounts } = useAlertCounts();
  const { data: notificationCounts } = useNotificationCounts();
  
  const unreadAlerts = alertCounts?.unread ?? 0;
  const unreadNotifications = notificationCounts?.unread ?? 0;
  const totalUnread = unreadAlerts + unreadNotifications;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsAlertsOpen(true)}
        className="relative flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Alerts"
      >
        <BellIcon className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm dark:bg-white dark:text-gray-900">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
      <AlertsOverlay isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
    </>
  );
}
