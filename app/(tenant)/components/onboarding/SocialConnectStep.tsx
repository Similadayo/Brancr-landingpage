'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIntegrations } from '@/app/(tenant)/hooks/useIntegrations';

export function SocialConnectStep({
  onComplete,
  isSubmitting,
}: {
  onComplete: () => void;
  isSubmitting: boolean;
}) {
  const { data: integrations = [] } = useIntegrations();
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());

  const platforms = [
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Get your bot token from @BotFather',
      icon: '📱',
      href: 'https://t.me/brancrbot',
      external: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Select or add your WhatsApp number',
      icon: '💬',
      href: '/app/integrations#whatsapp',
      external: false,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Connect your Instagram Business account',
      icon: '📸',
      href: '/app/integrations#instagram',
      external: false,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Connect your Facebook Page',
      icon: '👥',
      href: '/app/integrations#facebook',
      external: false,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Connect your TikTok account',
      icon: '🎵',
      href: '/app/integrations#tiktok',
      external: false,
    },
  ];

  const connectedCount = integrations.filter((i) => i.connected).length;
  const hasAtLeastOne = connectedCount > 0;

  const handleComplete = () => {
    if (!hasAtLeastOne) {
      alert('Please connect at least one platform to continue');
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-gray-900">
          Connect at least one platform to complete setup
        </p>
        <p className="mt-1 text-xs text-gray-600">
          You can connect more platforms later from the Integrations page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => {
          const isConnected = integrations.some(
            (i) => i.platform === platform.id && i.connected
          );
          return (
            <div
              key={platform.id}
              className={`rounded-xl border p-4 transition ${
                isConnected
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{platform.name}</h3>
                    <p className="mt-1 text-xs text-gray-600">{platform.description}</p>
                  </div>
                </div>
                {isConnected && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    ✓ Connected
                  </span>
                )}
              </div>
              <div className="mt-4">
                {platform.external ? (
                  <a
                    href={platform.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                  >
                    Open {platform.name} <span className="ml-1" aria-hidden>↗</span>
                  </a>
                ) : (
                  <Link
                    href={platform.href}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                  >
                    {isConnected ? 'Manage' : 'Connect'}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-900">
          Connected: {connectedCount} of {platforms.length} platforms
        </p>
        {!hasAtLeastOne && (
          <p className="mt-1 text-xs text-amber-700">
            ⚠️ You need to connect at least one platform to continue
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Link
          href="/app/integrations"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
        >
          Open Integrations Page
        </Link>
        <button
          type="button"
          onClick={handleComplete}
          disabled={isSubmitting || !hasAtLeastOne}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {isSubmitting ? 'Completing...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}

