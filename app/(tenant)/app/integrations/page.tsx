'use client';

import Link from "next/link";
import { useCallback, useState, useEffect } from "react";
import SessionDebug from './SessionDebug';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useIntegrations, useVerifyIntegration, useDisconnectIntegration } from "@/app/(tenant)/hooks/useIntegrations";
import { WhatsAppNumberSelector } from "@/app/(tenant)/components/WhatsAppNumberSelector";
import { authApi, tenantApi } from '@/lib/api';
import ConfirmModal from '@/app/components/ConfirmModal';
import { LinkIcon, CheckCircleIcon, XIcon, ChevronRightIcon, AlertIcon } from "../../components/icons";

const STATUS_MAP: Record<
  "connected" | "pending" | "action_required" | "not_connected",
  { label: string; badge: string; description: string; helper: string }
> = {
  connected: {
    label: "Connected",
    badge: "badge-success",
    description: "All set. We're syncing data and events.",
    helper: "Monitor analytics to keep performance sharp.",
  },
  pending: {
    label: "Pending",
    badge: "badge-warning",
    description: "Waiting for external approval. We'll notify you once complete.",
    helper: "If this takes longer than 15 minutes, retry the connection.",
  },
  action_required: {
    label: "Action required",
    badge: "badge-error",
    description: "Additional steps needed to finish the connection.",
    helper: "Open the checklist below to complete outstanding steps.",
  },
  not_connected: {
    label: "Not connected",
    badge: "badge-gray",
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

const PLATFORM_REQUIREMENTS: Record<string, string> = {
  whatsapp: "Requires a number not in use on the WhatsApp mobile app.",
  instagram: "Requires an Instagram Business Account.",
  facebook: "Requires a Facebook Page with admin access.",
  telegram: "Requires a Bot Token created via BotFather.",
  tiktok: "Requires a registered TikTok Shop Seller account.",
};

const GUIDE_LINKS: Record<string, { label: string; href: string }> = {
  whatsapp: { label: "How to Set Up →", href: "/docs#whatsapp-business" },
  instagram: { label: "How to Convert →", href: "/docs#instagram" },
  facebook: { label: "Setup Guide →", href: "/docs#facebook" },
  telegram: { label: "How to Create a Bot →", href: "/docs#telegram" },
  tiktok: { label: "Setup Guide →", href: "/docs#tiktok-shop" },
};

// Define all supported platforms (even if not connected)
const ALL_PLATFORMS = ["whatsapp", "instagram", "facebook", "telegram", "tiktok"];

const connectionHistory = [
  { id: "log-001", action: "WhatsApp number assigned", at: "Jul 6, 2025 • 09:18" },
  { id: "log-002", action: "Instagram permissions pending approval", at: "Jul 6, 2025 • 09:20" },
  { id: "log-003", action: "Webhook verification required", at: "Jul 6, 2025 • 09:21" },
];

type ConnectionStep = 'select' | 'requirements' | 'connect' | 'verify';

export default function IntegrationsPage() {
  const { data: integrationsData, isLoading, error, refetch: refetchIntegrations } = useIntegrations();
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];
  const verifyMutation = useVerifyIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const queryClient = useQueryClient();
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [showDisconnectConfirmFor, setShowDisconnectConfirmFor] = useState<string | null>(null);
  
  // Stepper flow state
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('select');
  const [showStepper, setShowStepper] = useState(false);

  // Get WhatsApp connection status for phone number
  const { data: whatsappStatus } = useQuery({
    queryKey: ["whatsapp-connection-status"],
    queryFn: async () => {
      try {
        return await tenantApi.whatsappConnectionStatus();
      } catch (error) {
        return { connected: false };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const whatsappRefreshMutation = useMutation({
    mutationFn: () => tenantApi.whatsappRefreshStatus(),
    onSuccess: (data) => {
      if (data?.updated) toast.success("WhatsApp status refreshed");
      else toast.success("WhatsApp status is up to date");
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void refetchIntegrations();
    },
    onError: () => toast.error("Failed to refresh WhatsApp status"),
  });

  const whatsappDisconnectMutation = useMutation({
    mutationFn: () => tenantApi.disconnectWhatsApp(),
    onSuccess: () => {
      toast.success("Disconnected WhatsApp");
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void refetchIntegrations();
    },
    onError: () => toast.error("Failed to disconnect WhatsApp"),
  });

  // Get tenant ID from authenticated user
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
  });

  // Support both API response shapes: top-level `tenant_id` or nested `tenant.id`
  const tenantId = userData?.tenant_id ?? (userData as any)?.tenant?.id ?? (userData as any)?.tenant?.tenant_id;

  const handleVerify = useCallback((platform: string) => {
    verifyMutation.mutate(platform);
  }, [verifyMutation]);

  const handleDisconnect = useCallback((platform: string) => {
    setShowDisconnectConfirmFor(platform);
  }, []);

  const confirmDisconnect = useCallback((platform: string) => {
    setShowDisconnectConfirmFor(null);
    setDisconnectingPlatform(platform);
    disconnectMutation.mutate(platform, {
      onSettled: () => {
        setDisconnectingPlatform(null);
      },
    });
  }, [disconnectMutation]);

  // Start connection flow
  const startConnection = useCallback((platform: string) => {
    setSelectedPlatform(platform);
    setConnectionStep('requirements');
    setShowStepper(true);
  }, []);

  // Handle OAuth connection
  const handleConnect = useCallback(async (platform: string, platforms?: string, useInstagramLogin = false) => {
    let activeTenantId = tenantId;
    let fresh: any = null;
    if (!activeTenantId) {
      try {
        fresh = await authApi.me();
        console.debug('Refetched auth.me on connect click:', fresh);
        if (fresh?.tenant_id) {
          queryClient.setQueryData(['auth', 'me'], fresh);
          activeTenantId = fresh.tenant_id;
        }
      } catch (e) {
        console.debug('Failed to refetch auth.me:', e);
      }
    }

    if (!activeTenantId) {
      console.debug('No tenant_id after refetch of auth.me; blocking OAuth start and redirecting to login to re-establish tenant context:', fresh);
      toast.error('Please sign in to continue connecting channels. Redirecting to login...');
      if (typeof window !== 'undefined') {
        const nextPath = (typeof window !== 'undefined' && window.location?.pathname) ? window.location.pathname : '/app/integrations';
        window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
      }
      return;
    }

    setIsConnecting(platform);
    setConnectionStep('connect');

    try {
      const successRedirect = typeof window !== 'undefined' 
        ? `${window.location.origin}/app/integrations?platform=${platform}&status=success`
        : `/app/integrations?platform=${platform}&status=success`;

      let oauthUrl = '';

      if (platform === 'instagram' && useInstagramLogin) {
        oauthUrl = tenantApi.getInstagramOAuthUrl({
          tenant_id: activeTenantId,
          success_redirect: successRedirect,
        });
      } else if (platform === 'facebook' || platform === 'instagram') {
        const platformsParam = platforms || platform;
        oauthUrl = tenantApi.getMetaOAuthUrl({
          tenant_id: activeTenantId,
          platforms: platformsParam,
          success_redirect: successRedirect,
        });
      } else if (platform === 'tiktok') {
        oauthUrl = tenantApi.getTikTokOAuthUrl({
          tenant_id: activeTenantId,
          success_redirect: successRedirect,
        });
      } else {
        setIsConnecting(null);
        return;
      }

      if (typeof window !== 'undefined') {
        window.location.href = oauthUrl;
      }
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      toast.error('Failed to connect. Please try again.');
      setIsConnecting(null);
      setConnectionStep('requirements');
    }
  }, [tenantId, queryClient]);

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
      const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'platform';
      toast.success(`Successfully connected ${platformName}! 🎉`);
      void refetchIntegrations();
      window.history.replaceState({}, '', window.location.pathname);
      setIsConnecting(null);
      setShowStepper(false);
      setSelectedPlatform(null);
    } else if (status === 'error' || error) {
      let errorMessage = message || 'Unknown error';
      
      if (error === 'access_denied' || errorReason === 'user_denied') {
        errorMessage = 'Connection cancelled. You can try again when ready.';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      } else if (error) {
        errorMessage = `Connection failed: ${error}`;
      }
      
      toast.error(errorMessage);
      window.history.replaceState({}, '', window.location.pathname);
      setIsConnecting(null);
      setConnectionStep('requirements');
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

  const selectedPlatformData = selectedPlatform ? platformsWithData.find(p => p.platform === selectedPlatform) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-md sm:h-12 sm:w-12">
            <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">Social & Messaging Connections</h1>
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
              Link Meta, TikTok, and Telegram accounts to automate content, messaging, and analytics in Brancr.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/app/integrations/history"
            className="btn-secondary w-full sm:w-auto justify-center"
          >
            View audit log
          </Link>
          <Link
            href="https://t.me/brancrbot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full sm:w-auto justify-center"
          >
            Launch Telegram assistant
          </Link>
        </div>
      </header>

      {/* Important WhatsApp notice */}
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
        <div className="flex items-start gap-3">
          <AlertIcon className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-warning-900 dark:text-warning-100">⚠️ Important: WhatsApp number usage</p>
            <p className="mt-1.5 text-xs text-warning-700 dark:text-warning-300 sm:text-sm">
              Once connected, this number cannot be used on the WhatsApp mobile app — messages will appear exclusively inside the Brancr Dashboard. If the number is currently registered on your phone, delete the account, wait 3 minutes, then connect. Or use a new number not previously associated with WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* DEV: Show session debug for troubleshooting transient auth issues */}
      <SessionDebug userData={userData} />

      {/* Connection Stepper Modal */}
      {showStepper && selectedPlatform && selectedPlatformData && (
        <div className="modal-overlay" onClick={() => {
          setShowStepper(false);
          setSelectedPlatform(null);
          setConnectionStep('select');
        }}>
          <div className="modal-content animate-scale-in w-full max-w-2xl mx-4 sm:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Connect {selectedPlatformData.name}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Follow these steps to connect your account</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStepper(false);
                  setSelectedPlatform(null);
                  setConnectionStep('select');
                }}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[
                  { key: 'requirements', label: 'Requirements' },
                  { key: 'connect', label: 'Connect' },
                  { key: 'verify', label: 'Verify' },
                ].map((step, index) => {
                  const stepKey = step.key as ConnectionStep;
                  const isActive = connectionStep === stepKey;
                  // Define step order for comparison
                  const stepOrder: ConnectionStep[] = ['requirements', 'connect', 'verify'];
                  const currentStepIndex = stepOrder.indexOf(connectionStep);
                  const isCompleted = currentStepIndex > index;
                  const isAccessible = index === 0 || currentStepIndex >= index;

                  return (
                    <div key={step.key} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                            isCompleted
                              ? 'border-success-500 bg-success-500 text-white'
                              : isActive
                              ? 'border-accent-500 bg-accent-500 text-white dark:bg-white dark:text-gray-100 dark:border-white'
                              : isAccessible
                              ? 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-700'
                              : 'border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-600 dark:bg-gray-700/50'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <p className={`mt-2 text-xs font-medium ${isActive ? 'text-accent-600 dark:text-accent-400' : 'text-gray-500 dark:text-gray-300'}`}>
                          {step.label}
                        </p>
                      </div>
                      {index < 2 && (
                        <div className={`mx-2 h-0.5 flex-1 ${isCompleted ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[300px]">
              {connectionStep === 'requirements' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-600 dark:bg-gray-700/50">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Requirements</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {PLATFORM_REQUIREMENTS[selectedPlatform]}
                    </p>
                    {GUIDE_LINKS[selectedPlatform] && (
                      <Link
                        href={GUIDE_LINKS[selectedPlatform].href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
                      >
                        {GUIDE_LINKS[selectedPlatform].label}
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => {
                        setShowStepper(false);
                        setSelectedPlatform(null);
                        setConnectionStep('select');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (selectedPlatform === 'telegram') {
                          window.open('https://t.me/brancrbot', '_blank');
                          setShowStepper(false);
                          setSelectedPlatform(null);
                          setConnectionStep('select');
                        } else if (selectedPlatform === 'instagram') {
                          handleConnect(selectedPlatform, undefined, true);
                        } else {
                          handleConnect(selectedPlatform);
                        }
                      }}
                      disabled={isConnecting === selectedPlatform || !tenantId}
                      className="btn-primary"
                    >
                      {isConnecting === selectedPlatform ? 'Connecting...' : 'Continue to Connect'}
                    </button>
                  </div>
                </div>
              )}

              {connectionStep === 'connect' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-info-200 bg-info-50 p-5 dark:border-info-800 dark:bg-info-900/20">
                    <p className="text-sm font-semibold text-info-900 dark:text-info-100">Redirecting...</p>
                    <p className="mt-2 text-sm text-info-700 dark:text-info-300">
                      You&apos;ll be redirected to {selectedPlatformData.name} to authorize the connection. Once complete, you&apos;ll be brought back here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Platforms Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
            <XIcon className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load integrations</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error.message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platformsWithData.map(({ platform, name, connected, updatedAt, integration }) => {
            const statusKey = connected ? "connected" : "not_connected";
            const status = STATUS_MAP[statusKey];
            const isDisconnecting = disconnectingPlatform === platform;
            const isWhatsApp = platform === "whatsapp";
            const guide = GUIDE_LINKS[platform];

            return (
              <div key={platform} className="card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">
                      {isWhatsApp ? "WhatsApp Business" : name}
                    </h3>
                    {isWhatsApp && connected && (
                      <span className="mt-1.5 inline-block badge badge-primary text-[10px]">Brancr-Managed</span>
                    )}
                    {platform === "instagram" && connected && integration?.login_method === 'instagram_login' && (
                      <span className="mt-1.5 inline-block badge badge-info text-[10px]">Instagram Login</span>
                    )}
                  </div>
                  <span className={`badge ${status.badge} shrink-0 text-[10px]`}>
                    {isWhatsApp && connected && (integration?.external_id || whatsappStatus?.phone_number)
                      ? (integration?.external_id || whatsappStatus?.phone_number || "Connected")
                      : isWhatsApp && !connected 
                      ? "No Number Assigned" 
                      : status.label}
                  </span>
                </div>

                {/* Platform Details */}
                {platform === "facebook" && connected && integration?.page_name ? (
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-300">{integration.page_name}</p>
                ) : platform === "instagram" && connected ? (
                  <div className="mb-3 space-y-1">
                    {integration?.instagram_handle ? (
                      <p className="text-xs text-gray-500 dark:text-gray-300">@{integration.instagram_handle}</p>
                    ) : integration?.username ? (
                      <p className="text-xs text-gray-500 dark:text-gray-300">@{integration.username}</p>
                    ) : null}
                  </div>
                ) : connected && integration?.username && !isWhatsApp ? (
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-300">@{integration.username}</p>
                ) : null}

                {/* Status Description */}
                {!isWhatsApp && (
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{status.description}</p>
                )}

                {/* Webhook Status */}
                {connected && integration && "webhook_status" in integration && (
                  <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">Webhook</p>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${((integration as any).webhook_status ?? "").toLowerCase() === "active" ? "bg-success-500" : "bg-warning-500"}`} aria-hidden />
                      <p className={`text-sm font-semibold ${((integration as any).webhook_status ?? "").toLowerCase() === "active" ? "text-success-700 dark:text-success-400" : "text-warning-700 dark:text-warning-400"}`}>
                        {(integration as any).webhook_status ?? "unknown"}
                      </p>
                    </div>
                  </div>
                )}

                {/* WhatsApp number selector */}
                {isWhatsApp && (
                  <div className="mb-4">
                    <WhatsAppNumberSelector />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {isWhatsApp ? (
                    <>
                      {connected && (
                        <button
                          type="button"
                          onClick={() => setShowDisconnectConfirmFor('whatsapp')}
                          disabled={whatsappDisconnectMutation.isPending}
                          className="btn-danger text-xs"
                        >
                          {whatsappDisconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                        </button>
                      )}
                      {guide && (
                        <Link
                          href={guide.href}
                          className="btn-secondary text-xs"
                        >
                          {guide.label}
                        </Link>
                      )}
                    </>
                  ) : connected ? (
                    <>
                      <button
                        onClick={() => handleVerify(platform)}
                        disabled={verifyMutation.isPending}
                        className="btn-secondary text-xs"
                      >
                        {verifyMutation.isPending ? "Verifying..." : "Verify"}
                      </button>
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isDisconnecting || disconnectMutation.isPending}
                        className="btn-danger text-xs"
                      >
                        {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                      </button>
                      {guide && (
                        <Link
                          href={guide.href}
                          className="btn-secondary text-xs"
                        >
                          {guide.label}
                        </Link>
                      )}
                    </>
                  ) : platform === "telegram" ? (
                    <>
                      <a
                        href="https://t.me/brancrbot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs"
                      >
                        Open bot deep link
                      </a>
                      {guide && (
                        <Link
                          href={guide.href}
                          className="btn-secondary text-xs"
                        >
                          {guide.label}
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startConnection(platform)}
                        disabled={isConnecting === platform}
                        title={!tenantId ? 'Sign in to connect channels' : undefined}
                        className="btn-primary text-xs"
                      >
                        {isConnecting === platform ? "Connecting..." : "Connect"}
                      </button>
                      {guide && (
                        <Link
                          href={guide.href}
                          className="btn-secondary text-xs"
                        >
                          {guide.label}
                        </Link>
                      )}
                    </>
                  )}
                </div>

                {/* Helper text */}
                {!isWhatsApp && (
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-300">{status.helper}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">Provider-Owned WhatsApp</h3>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Brancr manages your WhatsApp Business Account. Select a number from our pool or add your own number for verification.
          </p>
          <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success-500" aria-hidden />
              <span>Brancr handles WhatsApp Business Account setup and billing</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success-500" aria-hidden />
              <span>Select from available numbers or verify your own number</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success-500" aria-hidden />
              <span>All WhatsApp usage charges appear on your Brancr invoice</span>
            </div>
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">Connection History</h3>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Brancr logs key integration events to help you audit onboarding.
          </p>
          <div className="mt-4 space-y-3">
            {connectionHistory.slice(0, 2).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.action}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{entry.at}</p>
              </div>
            ))}
            <Link
              href="/app/integrations/history"
              className="block rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-xs text-gray-500 transition hover:border-accent hover:text-accent dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-accent"
            >
              View full history →
            </Link>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirmFor && (
        <ConfirmModal
          open={true}
          title={`Disconnect ${PLATFORM_NAMES[showDisconnectConfirmFor as string] || showDisconnectConfirmFor}`}
          description={`Are you sure you want to disconnect ${PLATFORM_NAMES[showDisconnectConfirmFor as string] || showDisconnectConfirmFor}? This action cannot be undone.`}
          confirmText="Disconnect"
          onConfirm={() => {
            const p = showDisconnectConfirmFor as string;
            setShowDisconnectConfirmFor(null);
            if (p === 'whatsapp') {
              whatsappDisconnectMutation.mutate();
            } else {
              confirmDisconnect(p);
            }
          }}
          onCancel={() => setShowDisconnectConfirmFor(null)}
        />
      )}
    </div>
  );
}
