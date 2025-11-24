'use client';

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { tenantApi, ApiError } from "@/lib/api";

export function WhatsAppNumberSelector() {
  const queryClient = useQueryClient();
  
  // Provider selection
  const [provider, setProvider] = useState<"gupshup_partner" | "respondio" | "auto">("gupshup_partner");
  
  // Phone number input (only for Respond.io, optional for Gupshup Partner)
  const [countryCode, setCountryCode] = useState('+234'); // Default to Nigeria
  const [phoneNumber, setPhoneNumber] = useState('');
  const [channelId, setChannelId] = useState('440617'); // Default channel_id for Respond.io
  
  // Onboarding state
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [onboardingWindow, setOnboardingWindow] = useState<Window | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Common country codes (focusing on African countries)
  const countryCodes = [
    { code: '+234', country: '🇳🇬 Nigeria' },
    { code: '+27', country: '🇿🇦 South Africa' },
    { code: '+254', country: '🇰🇪 Kenya' },
    { code: '+233', country: '🇬🇭 Ghana' },
    { code: '+256', country: '🇺🇬 Uganda' },
    { code: '+255', country: '🇹🇿 Tanzania' },
    { code: '+251', country: '🇪🇹 Ethiopia' },
    { code: '+1', country: '🇺🇸 USA/Canada' },
    { code: '+44', country: '🇬🇧 UK' },
    { code: '+91', country: '🇮🇳 India' },
  ];

  // Check connection status (with polling for pending states)
  const { data: connectionStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["whatsapp-connection-status"],
    queryFn: async () => {
      try {
        return await tenantApi.whatsappConnectionStatus();
      } catch (error) {
        console.warn("Failed to fetch WhatsApp connection status:", error);
        return { connected: false };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    // Poll every 5 seconds if status is pending
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "pending_onboarding" || data?.status === "pending_verification") {
        return 5000; // Poll every 5 seconds
      }
      return false;
    },
  });

  // Handle callback redirect from Gupshup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const error = urlParams.get('error');

    if (status === 'live' || status === 'pending_verification') {
      // Success or pending - refetch status
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      
      if (status === 'live') {
        toast.success("✅ WhatsApp connected successfully via Gupshup Partner!");
      } else {
        toast.success("⏳ WhatsApp setup in progress. Verification pending...");
      }
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } else if (error) {
      // Error from callback
      toast.error(`Connection failed: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [queryClient]);

  // Handle window focus/blur to detect redirect return
  useEffect(() => {
    if (!onboardingWindow) return;

    const handleFocus = () => {
      // Window came back into focus - check if onboarding completed
      if (onboardingWindow.closed) {
        // Window was closed - check status
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
        setOnboardingWindow(null);
      } else {
        // Window still open - user might still be onboarding
        // Start polling if not already
        if (!isPolling) {
          setIsPolling(true);
        }
      }
    };

    const handleBlur = () => {
      // Window lost focus - user might have switched to onboarding tab
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onboardingWindow, isPolling, queryClient]);

  // Connect WhatsApp mutation
  const connectMutation = useMutation({
    mutationFn: (payload: { phone_number: string; provider: "gupshup_partner" | "respondio" | "auto"; channel_id?: string }) => 
      tenantApi.connectWhatsApp(payload),
    onSuccess: (data) => {
      if (data.onboarding_url && data.status === "pending_onboarding") {
        // Gupshup Partner - open onboarding URL
        setOnboardingUrl(data.onboarding_url);
        const newWindow = window.open(data.onboarding_url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          setOnboardingWindow(newWindow);
          setIsPolling(true);
          toast.success("📱 Opening Gupshup onboarding... Complete the setup in the new tab.");
        } else {
          toast.error("Please allow popups to open the onboarding page.");
        }
      } else if (data.success && data.provider === 'respondio') {
        // Respond.io - instant connection
        toast.success(data.message || "✅ WhatsApp connected successfully via Respond.io!");
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
        void queryClient.invalidateQueries({ queryKey: ["integrations"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
        // Reset form
        setPhoneNumber('');
      } else {
        toast.error(data.message || "Unexpected response from server");
      }
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to connect WhatsApp");
      } else {
        toast.error("Failed to connect WhatsApp. Please try again.");
      }
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => tenantApi.disconnectWhatsApp(),
    onSuccess: () => {
      toast.success("✅ WhatsApp number disconnected");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
      setOnboardingUrl(null);
      setOnboardingWindow(null);
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to disconnect. Please try again.");
      }
    },
  });

  const handleDisconnect = () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp number?")) {
      return;
    }
    disconnectMutation.mutate();
  };

  const handleConnectWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For Respond.io, phone number is required
    if (provider === "respondio" && !phoneNumber.trim()) {
      toast.error("Please enter a phone number for Respond.io");
      return;
    }
    
    // For Gupshup Partner, phone number is optional (can be empty)
    let fullPhoneNumber = '';
    if (phoneNumber.trim()) {
      fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s+/g, '')}`;
      if (!validatePhoneNumber(fullPhoneNumber)) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }
    
    // Build payload
    const payload: { phone_number: string; provider: "gupshup_partner" | "respondio" | "auto"; channel_id?: string } = {
      phone_number: fullPhoneNumber,
      provider: provider,
    };
    
    // Include channel_id for Respond.io
    if (provider === "respondio" && channelId) {
      payload.channel_id = channelId;
    }
    
    connectMutation.mutate(payload);
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return phone;
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return false;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanedPhone = phone.replace(/\s+/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    if (statusLower === 'live') {
      return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">✅ Live</span>;
    } else if (statusLower === 'pending_onboarding') {
      return <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">⏳ Pending Onboarding</span>;
    } else if (statusLower === 'pending_verification') {
      return <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">⏳ Pending Verification</span>;
    } else if (statusLower === 'failed') {
      return <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">❌ Failed</span>;
    }
    return null;
  };

  const isConnected = connectionStatus?.connected ?? false;
  const currentStatus = connectionStatus?.status;
  const isPending = currentStatus === "pending_onboarding" || currentStatus === "pending_verification";

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current connection status */}
      {isConnected ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  ✅ Connected
                </span>
                {connectionStatus?.provider && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {connectionStatus.provider === 'respondio' ? 'Respond.io' : 
                     connectionStatus.provider === 'gupshup_partner' ? 'Gupshup Partner' : 
                     connectionStatus.provider}
                  </span>
                )}
                {currentStatus && getStatusBadge(currentStatus)}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-emerald-900">Your WhatsApp Connection</h3>
              {connectionStatus?.phone_number && (
                <p className="mt-1 text-sm font-semibold text-emerald-900">
                  Phone: {formatPhoneNumber(connectionStatus.phone_number)}
                </p>
              )}
              {connectionStatus?.app_id && (
                <p className="mt-1 text-xs text-emerald-700">
                  App ID: {connectionStatus.app_id}
                </p>
              )}
              {connectionStatus?.message && (
                <p className="mt-1 text-xs text-emerald-700">
                  {connectionStatus.message}
                </p>
              )}
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="ml-4 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Connect WhatsApp</h3>

          {/* Pending state UI */}
          {isPending && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    {currentStatus === "pending_onboarding" 
                      ? "Completing WhatsApp setup in Gupshup..." 
                      : "Waiting for WhatsApp verification..."}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    {currentStatus === "pending_onboarding"
                      ? "Please complete the onboarding process in the Gupshup tab. We'll automatically detect when it's done."
                      : "Your WhatsApp number is being verified. This may take a few minutes."}
                  </p>
                </div>
              </div>
              {onboardingUrl && (
                <a
                  href={onboardingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Open Gupshup Onboarding
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Connect form */}
          {!isPending && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">📱 Connect Your WhatsApp Number</h4>
                <p className="mt-1 text-xs text-gray-600">
                  Choose a provider and connect your WhatsApp Business number.
                </p>
              </div>

              <form onSubmit={handleConnectWhatsApp} className="space-y-3">
                {/* Provider selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as "gupshup_partner" | "respondio" | "auto")}
                    aria-label="WhatsApp provider"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="gupshup_partner">Gupshup Partner (Recommended)</option>
                    <option value="respondio">Respond.io</option>
                    <option value="auto">Auto (Let us choose)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {provider === "gupshup_partner" && "Phone number selection happens in Gupshup UI. Phone number is optional here."}
                    {provider === "respondio" && "Instant connection. Phone number required."}
                    {provider === "auto" && "We'll automatically select the best available provider."}
                  </p>
                </div>

                {/* Phone number input (required for Respond.io, optional for Gupshup Partner) */}
                {(provider === "respondio" || provider === "auto") && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        aria-label="Country code"
                        className="w-32 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.code} {cc.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[\d\s\-]*$/.test(value)) {
                            setPhoneNumber(value);
                          }
                        }}
                        placeholder="8123456789"
                        required={provider === "respondio"}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Channel ID for Respond.io */}
                {provider === "respondio" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Channel ID (Optional)</label>
                    <input
                      type="text"
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      placeholder="440617"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={connectMutation.isPending || (provider === "respondio" && !phoneNumber.trim())}
                  className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  {connectMutation.isPending ? "Connecting..." : provider === "gupshup_partner" ? "Continue to Gupshup" : "Connect WhatsApp"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Billing info */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-semibold text-emerald-900">💳 Billing: Handled by Brancr</p>
        <p className="mt-1 text-xs text-emerald-700">
          WhatsApp usage charges appear on your Brancr invoice.
        </p>
      </div>
    </div>
  );
}
