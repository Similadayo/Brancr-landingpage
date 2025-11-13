'use client';

import { useState } from "react";

export default function ApiSettingsPage() {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">API Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Manage API keys, webhooks, and integration credentials.
        </p>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
        <p className="mt-2 text-sm text-gray-600">
          Use API keys to authenticate requests to the Brancr API.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Production Key</p>
                <p className="mt-1 text-xs text-gray-500">Created on Jul 1, 2025</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Active
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <code className="flex-1 rounded-lg bg-gray-50 px-4 py-3 text-sm font-mono text-gray-900">
                {showKey ? "brancr_live_sk_1234567890abcdef" : "••••••••••••••••••••••••••••••••"}
              </code>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-sm font-semibold text-amber-900">Coming Soon</h3>
          <p className="mt-2 text-sm text-amber-700">
            Full API key management features are currently in development. You&apos;ll be able to create, rotate, and
            revoke API keys here soon.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Webhooks</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure webhook endpoints to receive real-time events.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">
            No webhooks configured yet. Webhook management features are coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}

