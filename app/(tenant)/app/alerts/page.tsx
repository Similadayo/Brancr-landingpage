'use client';

import { AlertsList } from '../../components/AlertsList';
import { AlertIcon } from '../../components/icons';

export default function AlertsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-600 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 dark:hidden" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute inset-0 hidden dark:block" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <AlertIcon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
            <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Alerts</h1>
          </div>
          <p className="text-sm text-white sm:text-base md:text-lg max-w-2xl">
            Important messages and updates from Brancr
          </p>
        </div>
      </div>

      {/* Alerts List */}
      <AlertsList showFilters={true} showMarkAllRead={true} />
    </div>
  );
}

