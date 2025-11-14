'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { MetaSdkLoader, waitForMetaSdk } from "@/app/components/meta/MetaSdkLoader";
import { META_CONFIG } from "@/app/config/meta";
import { useIntegrations, useVerifyIntegration, useDisconnectIntegration } from "@/app/(tenant)/hooks/useIntegrations";

declare global {
  interface Window {
    FB?: {
      init: (options: {
        appId: string;
        autoLogAppEvents: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            code?: string;
          };
        }) => void,
        options: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          redirect_uri?: string;
          extras: Record<string, unknown>;
        },
      ) => void;
    };
    fbAsyncInit?: () => void;
    __fbReady?: boolean;
  }
}

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
    helper: "Start from Telegram or our upcoming OAuth flow.",
  },
};

const PLATFORM_NAMES: Record<string, string> = {
  whatsapp: "WhatsApp Business",
  instagram: "Instagram DM",
  facebook: "Facebook Messenger",
  telegram: "Telegram Bot",
  tiktok: "TikTok Shop",
};

// Define all supported platforms (even if not connected)
const ALL_PLATFORMS = ["whatsapp", "instagram", "facebook", "telegram", "tiktok"];

const metaChecklist = [
  { id: "whatsapp", label: "Verify WhatsApp embedded signup", done: true },
  { id: "instagram", label: "Approve Instagram messaging permission", done: true },
  { id: "webhook", label: "Confirm Meta webhook callback URL", done: false },
];

const connectionHistory = [
  { id: "log-001", action: "WhatsApp connected via embedded signup", at: "Jul 6, 2025 • 09:18" },
  { id: "log-002", action: "Instagram permissions pending approval", at: "Jul 6, 2025 • 09:20" },
  { id: "log-003", action: "Webhook verification required", at: "Jul 6, 2025 • 09:21" },
];

export default function IntegrationsPage() {
  const [isFBReady, setIsFBReady] = useState(false);
  const queryClient = useQueryClient();
  const { data: integrations = [], isLoading, error } = useIntegrations();
  const verifyMutation = useVerifyIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    waitForMetaSdk()
      .then(() => {
        console.log("✅ Meta SDK confirmed ready for integrations page");
        setIsFBReady(true);
      })
      .catch((error) => {
        console.error("Meta SDK failed to initialize", error);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: MessageEvent) => {
      if (typeof event.origin !== "string" || !event.origin.endsWith("facebook.com")) return;

      // Try parsing as JSON first
      try {
        const asJson = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (asJson?.type === "WA_EMBEDDED_SIGNUP") {
          console.log("📨 WA_EMBEDDED_SIGNUP message received:", asJson);
          void fetch(`${META_CONFIG.backendUrl}/api/internal/meta/whatsapp/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Send tenant session cookie
            body: JSON.stringify(asJson),
          }).then(res => {
            if (res.ok) {
              console.log("✅ Session payload sent successfully to backend");
              // Show success message with billing info
              toast.success(
                "WhatsApp connected! Brancr handles all WhatsApp billing for you. You'll see WhatsApp charges on your Brancr invoice.",
                { duration: 6000 }
              );
              // Refresh integrations list after successful connection
              void queryClient.invalidateQueries({ queryKey: ["integrations"] });
            } else {
              console.error("❌ Failed to send session payload:", res.status);
              toast.error("Failed to complete WhatsApp connection. Please try again.");
            }
          });
          return;
        }
      } catch {
        // Not JSON, try URLSearchParams for query-string format
        try {
          const params = new URLSearchParams(event.data);
          if (params.get("domain")) {
            // Meta domain check message - useful for debugging but not the final payload
            console.log("📡 Meta domain check message:", event.data);
            return;
          }
        } catch {
          // Ignore if not URLSearchParams either
        }
      }

      console.warn("⚠️ Unhandled embedded signup message:", event.data);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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

  const launchWhatsAppSignup = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    // Wait for SDK to be ready
    if (!window.__fbReady) {
      console.log("⏳ Waiting for FB SDK...");
      await waitForMetaSdk();
    }

    if (!window.FB) {
      alert("Meta SDK failed to load. Please refresh and try again.");
      return;
    }

    console.log("🔥 Calling FB.login with config_id:", META_CONFIG.whatsappConfigId);
    console.log("🔗 Using redirect_uri:", META_CONFIG.embeddedSignupRedirectUri);

    window.FB.login(
      (response) => {
        console.log("FB.login response:", response);
        if (response.authResponse?.code) {
          void fetch(`${META_CONFIG.backendUrl}/api/internal/meta/whatsapp/code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Send tenant session cookie
            body: JSON.stringify({ 
              code: response.authResponse.code,
              redirect_uri: META_CONFIG.embeddedSignupRedirectUri,
            }),
          }).then(res => {
            if (res.ok) {
              console.log("✅ Code sent successfully to backend");
              // Show success message with billing info
              toast.success(
                "WhatsApp connected! Brancr handles all WhatsApp billing for you. You'll see WhatsApp charges on your Brancr invoice.",
                { duration: 6000 }
              );
              // Refresh integrations list after successful code exchange
              void queryClient.invalidateQueries({ queryKey: ["integrations"] });
            } else {
              console.error("❌ Failed to send code to backend:", res.status);
              toast.error("Failed to complete WhatsApp connection. Please try again.");
            }
          });
        } else {
          console.warn("WhatsApp signup cancelled or failed", response);
          if (response.status === "not_authorized") {
            toast.error("WhatsApp signup was cancelled. Please try again when ready.");
          }
        }
      },
      {
        config_id: META_CONFIG.whatsappConfigId,
        response_type: "code",
        override_default_response_type: true,
        redirect_uri: META_CONFIG.embeddedSignupRedirectUri, // Must match code exchange
        extras: { 
          setup: {},
          // Skip payment method - Brancr handles billing
          skip_payment_method: true,
        },
      },
    );
  }, []);

  return (
    <div className="space-y-10">
      <MetaSdkLoader />
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
            rel="noreferrer"
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

            return (
              <div key={platform} className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${status.badge}`}>
                    {status.label}
                  </span>
                </div>
                {integration?.username && (
                  <p className="mt-2 text-xs text-gray-500">@{integration.username}</p>
                )}
                <p className="mt-3 text-sm text-gray-600">{status.description}</p>
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

                {platform === "whatsapp" && connected && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-900">💳 Billing: Handled by Brancr</p>
                    <p className="mt-1 text-xs text-emerald-700">
                      WhatsApp usage charges appear on your Brancr invoice.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {connected ? (
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
                  ) : (
                    <>
                      {platform === "whatsapp" ? (
                        <div className="w-full">
                          <button
                            onClick={launchWhatsAppSignup}
                            disabled={!isFBReady}
                            className="inline-flex items-center rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:border-primary/10 disabled:bg-primary/5 disabled:text-primary/40"
                          >
                            Connect WhatsApp
                          </button>
                          <p className="mt-2 text-xs text-gray-500">
                            💳 Billing handled by Brancr - no payment method needed
                          </p>
                        </div>
                      ) : platform === "telegram" ? (
                        <a
                          href="https://t.me/brancrbot"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                        >
                          Open bot deep link
                        </a>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-400 opacity-50 cursor-not-allowed"
                        >
                          Connect
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Meta setup checklist</h3>
          <p className="mt-3 text-sm text-gray-600">
            Follow these steps to keep WhatsApp and Instagram flows synced with Brancr.
          </p>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            {metaChecklist.map((item) => (
              <label key={item.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  readOnly
                  checked={item.done}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                />
                <span className={item.done ? "text-gray-600" : "text-gray-500"}>{item.label}</span>
              </label>
            ))}
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

