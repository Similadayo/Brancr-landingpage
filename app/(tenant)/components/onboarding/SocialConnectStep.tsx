'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useIntegrations } from '@/app/(tenant)/hooks/useIntegrations';

export function SocialConnectStep({
  onComplete,
  isSubmitting,
  hasTelegramBot,
}: {
  onComplete: () => void;
  isSubmitting: boolean;
  hasTelegramBot?: boolean;
}) {
  const { data: integrations = [] } = useIntegrations();

  // Check which platforms are connected
  const connectedPlatforms = useMemo(() => {
    const connected = integrations.filter((i) => i.connected).map((i) => i.platform);
    // Include Telegram if hasTelegramBot is true
    if (hasTelegramBot && !connected.includes('telegram')) {
      connected.push('telegram');
    }
    return connected;
  }, [integrations, hasTelegramBot]);

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

  const hasAtLeastOne = connectedPlatforms.length > 0;

  const handleComplete = () => {
    if (!hasAtLeastOne) {
      alert('Please connect at least one platform to continue');
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔗</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              Connect at least one platform to complete setup
            </p>
            <p className="mt-1.5 text-xs text-gray-600">
              You can connect more platforms later from the Integrations page.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => {
          // Check if platform is connected
          const isConnected =
            platform.id === 'telegram'
              ? hasTelegramBot || connectedPlatforms.includes('telegram')
              : connectedPlatforms.includes(platform.id);
          return (
            <div
              key={platform.id}
              className={`group relative rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg ${
                isConnected
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-md shadow-emerald-200/30'
                  : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`text-3xl transition-transform duration-200 ${isConnected ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{platform.name}</h3>
                    <p className="mt-1 text-xs text-gray-600">{platform.description}</p>
                  </div>
                </div>
                {isConnected && (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 shadow-sm">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[10px] font-bold text-white">Connected</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                {platform.external ? (
                  <a
                    href={platform.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
                  >
                    Open {platform.name}
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <Link
                    href={platform.href}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
                  >
                    {isConnected ? (
                      <>
                        Manage
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Connect
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </>
                    )}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Connected: <span className="text-primary">{connectedPlatforms.length}</span> of <span className="text-gray-600">{platforms.length}</span> platforms
            </p>
            {connectedPlatforms.length === 0 && (
              <p className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                You need to connect at least one platform to continue
              </p>
            )}
          </div>
          {connectedPlatforms.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">Ready!</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <Link
          href="/app/integrations"
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Open Integrations
        </Link>
        <button
          type="button"
          onClick={handleComplete}
          disabled={isSubmitting || !hasAtLeastOne}
          className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Completing...
            </>
          ) : (
            <>
              Complete Setup
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

