'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useIntegrations } from '@/app/(tenant)/hooks/useIntegrations';
import { authApi, tenantApi } from '@/lib/api';

export function SocialConnectStep({
  onComplete,
  isSubmitting,
  hasTelegramBot,
}: {
  onComplete: () => void;
  isSubmitting: boolean;
  hasTelegramBot?: boolean;
}) {
  const { data: integrationsData, refetch: refetchIntegrations } = useIntegrations();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Ensure integrations is always an array
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];

  // Get tenant ID from authenticated user
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  const queryClient = useQueryClient();
  const tenantId = userData?.tenant_id;

  // Check which platforms are connected
  const connectedPlatforms = useMemo(() => {
    const connected = integrations.filter((i) => i.connected).map((i) => {
      // For Instagram, check login method to determine which option is connected
      if (i.platform === 'instagram') {
        const loginMethod = i.login_method || (i.metadata as any)?.login_method;
        if (loginMethod === 'instagram_login') {
          return 'instagram_login';
        }
        return 'instagram'; // Default to Facebook Login
      }
      return i.platform;
    });
    // Include Telegram if hasTelegramBot is true
    if (hasTelegramBot && !connected.includes('telegram')) {
      connected.push('telegram');
    }
    return connected;
  }, [integrations, hasTelegramBot]);

  const guideLinks: Record<string, { label: string; href: string }> = {
    whatsapp: { label: 'How to Set Up →', href: '/docs#whatsapp-business' },
    instagram_login: { label: 'How to Convert →', href: '/docs#instagram' },
    facebook: { label: 'Setup Guide →', href: '/docs#facebook' },
    telegram: { label: 'How to Create a Bot →', href: '/docs#telegram' },
    tiktok: { label: 'Setup Guide →', href: '/docs#tiktok-shop' },
  };

  const platforms = [
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Get your bot token from @BotFather',
      icon: '📱',
      href: 'https://t.me/brancrbot',
      external: true,
      guide: guideLinks.telegram,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Select or add your WhatsApp number',
      icon: '💬',
      href: '/app/integrations#whatsapp',
      external: false,
      guide: guideLinks.whatsapp,
    },
    {
      id: 'instagram_login',
      name: 'Instagram',
      description: 'Connect directly with Instagram (no Facebook Page required)',
      icon: '📸',
      href: '/app/integrations#instagram',
      external: false,
      loginMethod: 'instagram_login', // Uses Instagram Login OAuth
      guide: guideLinks.instagram_login,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Connect your Facebook Page',
      icon: '👥',
      href: '/app/integrations#facebook',
      external: false,
      loginMethod: 'meta', // Uses Meta OAuth (Facebook Login)
      guide: guideLinks.facebook,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Connect your TikTok account',
      icon: '🎵',
      href: '/app/integrations#tiktok',
      external: false,
      guide: guideLinks.tiktok,
    },
  ];

  const hasAtLeastOne = connectedPlatforms.length > 0;

  // Handle OAuth connection
  const handleConnect = async (platform: string, platforms?: string) => {
    // If tenantId missing, try to re-fetch auth.me so transient missing session doesn't block users
    let activeTenantId = tenantId;
    let fresh: any = null;
    if (!activeTenantId) {
      try {
        fresh = await authApi.me();
        console.debug('Refetched auth.me from onboarding connect:', fresh);
        if (fresh?.tenant_id) {
          queryClient.setQueryData(['auth', 'me'], fresh);
          activeTenantId = fresh.tenant_id;
        }
      } catch (err) {
        console.debug('Failed to refresh auth.me in onboarding step:', err);
      }
    }

    if (!activeTenantId) {
      console.debug('No tenant_id after refetch of auth.me (onboarding); proceeding without tenant_id and relying on server session:', fresh);
      // Proceed without client-side tenant_id - server should infer tenant from cookie/session
    }

    setIsConnecting(platform);

    try {
      // Construct success redirect URL (redirect back to onboarding page)
      const successRedirect = typeof window !== 'undefined' 
        ? `${window.location.origin}/app/onboarding?platform=${platform}&status=success`
        : `/app/onboarding?platform=${platform}&status=success`;

      let oauthUrl = '';

      if (platform === 'instagram_login') {
        // Instagram Login (separate OAuth flow)
        oauthUrl = tenantApi.getInstagramOAuthUrl({
          tenant_id: activeTenantId,
          success_redirect: successRedirect,
        });
      } else if (platform === 'facebook' || platform === 'instagram') {
        // Meta platforms (Facebook Login, Instagram via Facebook)
        const platformsParam = platforms || platform;
        oauthUrl = tenantApi.getMetaOAuthUrl({
          tenant_id: activeTenantId,
          platforms: platformsParam,
          success_redirect: successRedirect,
        });
      } else if (platform === 'tiktok') {
        // TikTok
        oauthUrl = tenantApi.getTikTokOAuthUrl({
          tenant_id: activeTenantId,
          success_redirect: successRedirect,
        });
      } else {
        // For WhatsApp and Telegram, use the existing link behavior
        setIsConnecting(null);
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
  };

  // Check for OAuth callback in URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    const platform = urlParams.get('platform');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const errorReason = urlParams.get('error_reason');

    if (status === 'success') {
      // Show success message
      const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'platform';
      toast.success(`Successfully connected ${platformName}! 🎉`);
      // Reload integrations
      void refetchIntegrations();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setIsConnecting(null);
    } else if (status === 'error' || error) {
      // Handle OAuth errors
      let errorMessage = message || 'Unknown error';
      
      if (error === 'access_denied' || errorReason === 'user_denied') {
        errorMessage = 'Connection cancelled. You can try again when ready.';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      } else if (error) {
        errorMessage = `Connection failed: ${error}`;
      }
      
      toast.error(errorMessage);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setIsConnecting(null);
    }
  }, [refetchIntegrations]);

  const handleComplete = () => {
    if (!hasAtLeastOne) {
      toast.error('Please connect at least one platform to continue');
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
                    <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{platform.name}</h3>
                      {platform.id === 'instagram_login' && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-700">
                          No Page Required
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{platform.description}</p>
                  </div>
                </div>
                {isConnected && (
                  <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 shadow-sm">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[10px] font-bold text-white">Connected</span>
                    </div>
                    {platform.id === 'instagram_login' && isConnected && (
                      <span className="text-[9px] font-medium text-gray-500">via Instagram</span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4">
                {platform.guide && (
                  <Link
                    href={platform.guide.href}
                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary mb-2"
                  >
                    {platform.guide.label}
                  </Link>
                )}
                {platform.external ? (
                  // Telegram - external link
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
                ) : platform.id === 'whatsapp' ? (
                  // WhatsApp - Link to integrations page
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
                ) : (
                  <>
                  {/* Facebook, Instagram, TikTok - OAuth buttons */}
                  <button
                    type="button"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting === platform.id}
                    title={!tenantId ? 'Sign in to connect channels' : undefined}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white"
                  >
                    {isConnecting === platform.id ? (
                      <>
                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </>
                    ) : isConnected ? (
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
                  </button>
                  {/* Show sign-in hint when user is not fully authenticated */}
                  {!tenantId && (
                    <p className="mt-3 text-xs text-gray-500">Sign in to connect channels</p>
                  )}
                </>
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

