'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { mockChannels } from "@/lib/mockData";

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
          extras: Record<string, unknown>;
        },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const STATUS_MAP: Record<
  "connected" | "pending" | "action_required" | "not_connected",
  { label: string; badge: string; description: string; helper: string }
> = {
  connected: {
    label: "Connected",
    badge: "bg-emerald-100 text-emerald-700",
    description: "All set. We’re syncing data and events.",
    helper: "Monitor analytics to keep performance sharp.",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700",
    description: "Waiting for external approval. We’ll notify you once complete.",
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initFacebook = () => {
      if (!window.FB) return;

      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID!,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v24.0",
      });
      setIsFBReady(true);
    };

    window.fbAsyncInit = initFacebook;

    const existingScript =
      document.getElementById("facebook-jssdk") ??
      document.querySelector<HTMLScriptElement>('script[src="https://connect.facebook.net/en_US/sdk.js"]');
    if (existingScript) {
      if (window.FB) {
        initFacebook();
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: MessageEvent) => {
      if (typeof event.origin !== "string" || !event.origin.endsWith("facebook.com")) return;

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP") {
          void fetch("/api/internal/meta/whatsapp/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        }
      } catch (err) {
        console.warn("embedded signup message parse failed", err, event.data);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const launchWhatsAppSignup = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isFBReady || !window.FB) {
      alert("Initializing WhatsApp signup…");
      window.fbAsyncInit?.();
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          void fetch("/api/internal/meta/whatsapp/code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: response.authResponse.code }),
          });
        } else {
          console.warn("WhatsApp signup cancelled", response);
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID!,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      },
    );
  }, [isFBReady]);

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
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            Launch Telegram assistant
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mockChannels.map((card) => {
          const status = STATUS_MAP[card.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.not_connected;
          return (
            <div key={card.id} className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{card.name}</h2>
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${status.badge}`}>
                  {status.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{status.description}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gray-400">
                Last updated{" "}
                {new Date(card.updatedAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-2 text-xs text-gray-500">{status.helper}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="https://t.me/brancrbot"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                >
                  {card.status === "connected" ? "Repair connection" : "Connect"}
                </Link>
                {card.id === "whatsapp" ? (
                  <button
                    onClick={launchWhatsAppSignup}
                    className="inline-flex items-center rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  >
                    Connect WhatsApp
                  </button>
                ) : null}
                {card.id === "telegram" ? (
                  <a
                    href="https://t.me/brancrbot"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                  >
                    Open bot deep link
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

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

