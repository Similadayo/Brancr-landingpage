'use client';

import Link from "next/link";
import { useCallback, useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useIntegrations, useVerifyIntegration, useDisconnectIntegration } from "@/app/(tenant)/hooks/useIntegrations";
import { WhatsAppNumberSelector } from "@/app/(tenant)/components/WhatsAppNumberSelector";
import { authApi } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'https://api.brancr.com';

const STATUS_MAP: Record<
  "connected" | "pending" | "action_required" | "not_connected",
  { label: string; badge: string; description: string; helper: string }
> = {
  connected: {
    label: "Connected",
    badge: "bg-emerald-100 text-emerald-700",
    description: "All set. We're syncing data and events.",
    helper: "Monitor analytics to keep performance sharp.",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700",
    description: "Waiting for external approval. We'll notify you once complete.",
    helper: "If this takes longer than 15 minutes, retry the connection.",
  },
  action_required: {
    label: "Action required",
    badge: "bg-rose-100 text-rose-700",
    description: "Additional steps needed to finish the connection.",
    helper: "Open the checklist below to complete outstanding steps.",
  },
  not_connected: {
    label: "Not connected",
    badge: "bg-gray-100 text-gray-500",
    description: "Connect to unlock automations and analytics.",
    helper: "Start from Telegram or connect your channels.",
  },
};

const PLATFORM_NAMES: Record<string, string> = {
  whatsapp: "WhatsApp Business",
  instagram: "Instagram",
  facebook: "Facebook",
  telegram: "Telegram Bot",
  tiktok: "TikTok Shop",
};

// Define all supported platforms (even if not connected)
const ALL_PLATFORMS = ["whatsapp", "instagram", "facebook", "telegram", "tiktok"];

const connectionHistory = [
  { id: "log-001", action: "WhatsApp number assigned", at: "Jul 6, 2025 • 09:18" },
  { id: "log-002", action: "Instagram permissions pending approval", at: "Jul 6, 2025 • 09:20" },
  { id: "log-003", action: "Webhook verification required", at: "Jul 6, 2025 • 09:21" },
];

export default function IntegrationsPage() {
  const { data: integrationsData, isLoading, error, refetch: refetchIntegrations } = useIntegrations();
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];
  const verifyMutation = useVerifyIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Get tenant ID from authenticated user
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  const tenantId = userData?.tenant_id;

  const handleVerify = useCallback((platform: string) => {
    verifyMutation.mutate(platform);
  }, [verifyMutation]);

  const handleDisconnect = useCallback((platform: string) => {
    if (confirm(`Are you sure you want to disconnect ${PLATFORM_NAMES[platform] || platform}?`)) {
      setDisconnectingPlatform(platform);
      disconnectMutation.mutate(platform, {
        onSettled: () => {
          setDisconnectingPlatform(null);
        },
      });
    }
  }, [disconnectMutation]);

  // Handle OAuth connection
  const handleConnect = useCallback((platform: string, platforms?: string) => {
    if (!tenantId) {
      toast.error('Please login first');
      return;
    }

    setIsConnecting(platform);

    try {
      // Construct success redirect URL (redirect back to integrations page)
      const successRedirect = typeof window !== 'undefined' 
        ? `${window.location.origin}/app/integrations`
        : '/app/integrations';

      let oauthUrl = '';

      if (platform === 'facebook' || platform === 'instagram') {
        // Meta platforms (Facebook, Instagram)
        const platformsParam = platforms || platform;
        oauthUrl = `${API_BASE_URL}/api/oauth/meta/start?tenant_id=${tenantId}&platforms=${platformsParam}&success_redirect=${encodeURIComponent(successRedirect)}`;
      } else if (platform === 'tiktok') {
        // TikTok
        oauthUrl = `${API_BASE_URL}/api/oauth/tiktok/start?tenant_id=${tenantId}&success_redirect=${encodeURIComponent(successRedirect)}`;
      } else {
        // For Telegram, use the existing link behavior
        return;
      }

      // Redirect to OAuth
      if (typeof window !== 'undefined') {
        window.location.href = oauthUrl;
      }
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      toast.error('Failed to connect. Please try again.');
      setIsConnecting(null);
    }
  }, [tenantId]);

  // Check for OAuth callback in URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    const platform = urlParams.get('platform');

    if (status === 'success') {
      // Show success message
      const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'platform';
      toast.success(`Successfully connected ${platformName}! 🎉`);
      // Reload integrations
      void refetchIntegrations();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setIsConnecting(null);
    } else if (status === 'error') {
      // Show error message
      toast.error(`Connection failed: ${message || 'Unknown error'}`);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setIsConnecting(null);
    }
  }, [refetchIntegrations]);

  // Create a map of integrations by platform for quick lookup
  const integrationsByPlatform = new Map(integrations.map((i) => [i.platform, i]));

  // Merge all platforms with their integration data
  const platformsWithData = ALL_PLATFORMS.map((platform) => {
    const integration = integrationsByPlatform.get(platform);
    return {
      platform,
      name: PLATFORM_NAMES[platform] || platform,
      integration,
      connected: integration?.connected ?? false,
      updatedAt: integration?.updated_at ?? new Date().toISOString(),
    };
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Social & Messaging Connections</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Link Meta, TikTok, and Telegram accounts to automate content, messaging, and analytics in Brancr.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/integrations/history"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
          >
            View audit log
          </Link>
          <Link
            href="https://t.me/brancrbot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            Launch Telegram assistant
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-900">Failed to load integrations</p>
          <p className="mt-2 text-xs text-rose-700">{error.message}</p>
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {platformsWithData.map(({ platform, name, connected, updatedAt, integration }) => {
            const statusKey = connected ? "connected" : "not_connected";
            const status = STATUS_MAP[statusKey];
            const isDisconnecting = disconnectingPlatform === platform;
            const isWhatsApp = platform === "whatsapp";

            return (
              <div key={platform} className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
                    {isWhatsApp && connected && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                        Brancr-Managed
                      </span>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${status.badge}`}>
                    {isWhatsApp && !connected ? "No Number Assigned" : status.label}
                  </span>
                </div>
                {isWhatsApp && connected && integration?.external_id ? (
                  <p className="mt-2 text-xs text-gray-500">Number: {integration.external_id}</p>
                ) : platform === "facebook" && connected && integration?.page_name ? (
                  <p className="mt-2 text-xs text-gray-500">{integration.page_name}</p>
                ) : platform === "instagram" && connected ? (
                  <div className="mt-2 space-y-1">
                    {integration?.instagram_handle ? (
                      <p className="text-xs text-gray-500">@{integration.instagram_handle}</p>
                    ) : integration?.username ? (
                      <p className="text-xs text-gray-500">@{integration.username}</p>
                    ) : null}
                    {integration?.page_name && (
                      <p className="text-xs text-gray-400">Page: {integration.page_name}</p>
                    )}
                  </div>
                ) : platform === "telegram" && connected && integration?.username ? (
                  <p className="mt-2 text-xs text-gray-500">{integration.username}</p>
                ) : connected && integration?.username && !isWhatsApp && platform !== "telegram" ? (
                  <p className="mt-2 text-xs text-gray-500">@{integration.username}</p>
                ) : null}
                {!isWhatsApp && (
                  <>
                    <p className="mt-3 text-sm text-gray-600">{status.description}</p>
                    {connected && integration && "webhook_status" in integration ? (
                      <div className="mt-3">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                          <p className="uppercase tracking-[0.3em] text-gray-400">Webhook</p>
                          <p className={`mt-1 inline-flex items-center gap-2 font-semibold ${((integration as any).webhook_status ?? "").toLowerCase() === "active" ? "text-emerald-700" : "text-amber-700"}`}>
                            <span className={`h-2 w-2 rounded-full ${((integration as any).webhook_status ?? "").toLowerCase() === "active" ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
                            {(integration as any).webhook_status ?? "unknown"}
                          </p>
                        </div>
                      </div>
                    ) : null}
                    <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gray-400">
                      Last updated{" "}
                      {new Date(updatedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">{status.helper}</p>
                  </>
                )}

                {/* WhatsApp number selector - shown prominently for WhatsApp */}
                {isWhatsApp && (
                  <div className="mt-4">
                    <p className="mb-3 text-sm text-gray-600">
                      {connected
                        ? "Brancr manages your WhatsApp Business Account. All set for messaging automation."
                        : "Select or add your WhatsApp number to start messaging automation."}
                    </p>
                    <WhatsAppNumberSelector />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {platform === "telegram" ? (
                    // Telegram: Show different button based on connection status
                    connected ? (
                      <a
                        href={integration?.username ? `https://t.me/${integration.username.replace('@', '')}` : "https://t.me/brancrbot"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                      >
                        Open bot deep link
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <a
                        href="https://t.me/brancrbot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        Start from Telegram
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </a>
                    )
                  ) : connected && !isWhatsApp ? (
                    <>
                      <button
                        onClick={() => handleVerify(platform)}
                        disabled={verifyMutation.isPending}
                        className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        {verifyMutation.isPending ? "Verifying..." : "Verify"}
                      </button>
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isDisconnecting || disconnectMutation.isPending}
                        className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </>
                  ) : isWhatsApp && connected ? (
                    <Link
                      href="/app/integrations#whatsapp"
                      className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                    >
                      Manage Number
                    </Link>
                  ) : !isWhatsApp ? (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={isConnecting === platform || !tenantId}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white"
                    >
                      {isConnecting === platform ? (
                        <>
                          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Connecting...
                        </>
                      ) : (
                        <>
                          Connect
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Provider-Owned WhatsApp</h3>
          <p className="mt-3 text-sm text-gray-600">
            Brancr manages your WhatsApp Business Account. Select a number from our pool or add your own number for verification.
          </p>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              <span>Brancr handles WhatsApp Business Account setup and billing</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              <span>Select from available numbers or verify your own number</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              <span>All WhatsApp usage charges appear on your Brancr invoice</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Connection history</h3>
          <p className="mt-3 text-sm text-gray-600">
            Brancr logs key integration events to help you audit onboarding.
          </p>
          <div className="mt-4 space-y-4 text-xs text-gray-500">
            {connectionHistory.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{entry.action}</p>
                <p className="mt-1 text-xs text-gray-500">{entry.at}</p>
              </div>
            ))}
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
              Real-time audit logs will display once integrations go live.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
