'use client';

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { tenantApi } from "@/lib/api";

interface WhatsAppConnectionStatus {
  connected: boolean;
  provider?: "meta_embedded" | "respondio" | "gupshup_partner" | string;
  phone_number?: string;
  phone_number_id?: string;
  external_id?: string; // Backend returns this for meta_embedded
  status?: "connected" | "not_connected" | "pending_onboarding" | "pending_verification" | "live" | "failed";
  message?: string;
  channel_id?: string; // For respondio
  app_id?: string; // For gupshup_partner
}

export function WhatsAppNumberSelector() {
  const queryClient = useQueryClient();
  
  const [selectedProvider, setSelectedProvider] = useState<'gupshup' | 'meta_embedded' | 'respondio'>('gupshup');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState(''); // For Respond.io
  const [channelId, setChannelId] = useState(''); // For Respond.io
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const MAX_ATTEMPTS = 60; // 5 minutes (60 * 5 seconds)

  // Check connection status on mount
  const { data: connectionStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
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
  });

  // Check initial connection status on mount
  useEffect(() => {
    if (connectionStatus) {
      if (connectionStatus.connected) {
        setConnected(true);
        setPhoneNumber(connectionStatus.phone_number || null);
      } else {
        setConnected(false);
        setPhoneNumber(null);
      }
    }
  }, [connectionStatus]);

  const connectWhatsApp = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build payload based on provider
      const payload: { provider?: string; phone_number?: string; channel_id?: string } = {
        provider: selectedProvider,
      };
      
      // For Respond.io, phone number is required
      if (selectedProvider === 'respondio') {
        if (!phoneNumberInput.trim()) {
          throw new Error('Phone number is required for Respond.io');
        }
        payload.phone_number = phoneNumberInput.trim();
        if (channelId.trim()) {
          payload.channel_id = channelId.trim();
        }
      }
      
      // For Gupshup, phone number is optional
      if (selectedProvider === 'gupshup' && phoneNumberInput.trim()) {
        payload.phone_number = phoneNumberInput.trim();
      }
      
      // Call backend to get onboarding URL
      const response = await tenantApi.connectWhatsApp(payload as { provider?: "meta_embedded" | "gupshup" | "respondio" | "auto"; phone_number?: string; channel_id?: string });
      
      // Verify response structure
      if (!response.success) {
        throw new Error(response.message || 'Failed to start WhatsApp connection');
      }
      
      // For instant connections (like Respond.io), check if phone_number is returned
      if (response.phone_number && !response.onboarding_url) {
        // Instant connection - no onboarding needed
        setLoading(false);
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
        void queryClient.invalidateQueries({ queryKey: ["integrations"] });
        toast.success(response.message || '✅ WhatsApp connected successfully!');
        return;
      }
      
      // For providers that need onboarding (Gupshup, Meta Embedded)
      if (!response.onboarding_url) {
        throw new Error('Onboarding URL not received from server');
      }
      
      setOnboardingUrl(response.onboarding_url);
      
      // Open onboarding in popup
      const popupTitle = selectedProvider === 'gupshup' 
        ? 'Gupshup WhatsApp Onboarding' 
        : 'Meta WhatsApp Onboarding';
      
      const popup = window.open(
        response.onboarding_url,
        popupTitle,
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      popupRef.current = popup;
      
      // Listen for postMessage from popup (if provider sends completion message)
      const messageHandler = (event: MessageEvent) => {
        // Verify origin for security (adjust to your domain)
        if (event.data?.type === 'whatsapp_onboarding_complete') {
          if (messageHandlerRef.current) {
            window.removeEventListener('message', messageHandlerRef.current);
            messageHandlerRef.current = null;
          }
          stopPolling();
          closePopup();
          // Poll for final status
          setTimeout(async () => {
            await refreshConnectionStatus();
          }, 1000);
        }
      };
      
      messageHandlerRef.current = messageHandler;
      window.addEventListener('message', messageHandler);
      
      // Start polling for completion
      startPolling();
      
    } catch (err: any) {
      setLoading(false);
      
      // Handle specific error codes
      if (err.body?.error === 'gupshup_not_configured') {
        setError('Gupshup is not configured. Please contact support.');
      } else if (err.body?.error === 'already_connected') {
        setError('WhatsApp is already connected. Please disconnect first.');
      } else {
        setError(err.message || 'Failed to connect WhatsApp');
      }
      
      toast.error(err.message || 'Failed to connect WhatsApp');
    }
  };

  const startPolling = () => {
    stopPolling();
    let attempts = 0;
    
    const providerName = selectedProvider === 'gupshup' ? 'Gupshup' : selectedProvider === 'meta_embedded' ? 'Meta' : 'WhatsApp';
    setLoadingMessage(`Waiting for ${providerName} WhatsApp onboarding to complete...`);
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      
      try {
        const result = await refetchStatus();
        const statusData = result.data as WhatsAppConnectionStatus | undefined;
        
        if (!statusData) {
          // No data yet, continue polling
          if (attempts >= MAX_ATTEMPTS) {
            stopPolling();
            setLoading(false);
            setError('Unable to verify connection status. Please check manually.');
            setLoadingMessage(null);
          }
          return;
        }
        
        // ✅ SUCCESS: Connection is live or connected!
        // For Gupshup, status can be 'live' or 'connected'
        // For Meta Embedded, status is 'connected'
        if (statusData.connected || statusData.status === 'live' || statusData.status === 'connected') {
          stopPolling();
          closePopup();
          setConnected(true);
          setPhoneNumber(statusData.phone_number || null);
          setLoading(false);
          setOnboardingUrl(null);
          setLoadingMessage(null);
          void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
          void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
          void queryClient.invalidateQueries({ queryKey: ["integrations"] });
          toast.success("✅ WhatsApp connected successfully!");
          return;
        }
        
        // Handle pending states (show progress)
        if (statusData.status === "pending_onboarding" || statusData.status === "pending_verification") {
          setLoadingMessage(`Status: ${statusData.status === 'pending_onboarding' ? 'Onboarding in progress' : 'Verification pending'}... (${attempts * 5}s)`);
        }
        
        // Check for failed status
        if (statusData.status === 'failed') {
          stopPolling();
          setLoading(false);
          setError(statusData.message || 'Onboarding failed. Please try again.');
          setLoadingMessage(null);
          toast.error('Onboarding failed');
          return;
        }
        
        // Manual refresh every 15 seconds (faster detection)
        // For Gupshup, use refresh-status endpoint to get latest from Gupshup API
        if (attempts % 3 === 0) {
          if (selectedProvider === 'gupshup' && statusData?.status === 'pending_onboarding') {
            // Use refresh-status endpoint for Gupshup when stuck in pending
            try {
              const refreshResponse = await tenantApi.whatsappRefreshStatus();
              if (refreshResponse.connected || refreshResponse.status === 'live') {
                // Status updated - stop polling and handle success
                stopPolling();
                closePopup();
                setConnected(true);
                setPhoneNumber(refreshResponse.phone_number || null);
                setLoading(false);
                setOnboardingUrl(null);
                setLoadingMessage(null);
                void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
                void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
                void queryClient.invalidateQueries({ queryKey: ["integrations"] });
                toast.success("✅ WhatsApp connected successfully!");
                return;
              }
            } catch (refreshErr) {
              console.warn('Refresh-status error during polling:', refreshErr);
              // Fall back to regular refresh
              await refreshConnectionStatus();
            }
          } else {
            // For other providers or non-pending states, use regular refresh
            await refreshConnectionStatus();
          }
        }
        
        // Timeout after 5 minutes
        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setLoading(false);
          setError('Onboarding is taking longer than expected. Please check your connection status manually.');
          setLoadingMessage(null);
          toast.error('Onboarding timeout. Please refresh the page to check status.');
        }
        
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling on error, but show warning after many failures
        if (attempts >= 10 && attempts % 5 === 0) {
          toast.error('Having trouble checking status. Please refresh the page.');
        }
      }
    }, 5000); // Poll every 5 seconds

    // Check if popup was closed manually
    popupCheckIntervalRef.current = setInterval(() => {
      const popup = popupRef.current;
      if (popup && popup.closed) {
        clearInterval(popupCheckIntervalRef.current!);
        popupCheckIntervalRef.current = null;
        // Give it 2 seconds, then check status one more time
        // For Gupshup, use refresh-status endpoint
        setTimeout(async () => {
          if (selectedProvider === 'gupshup') {
            await refreshWhatsAppStatus();
          } else {
            await refreshConnectionStatus();
          }
        }, 2000);
      }
    }, 2000);
  };

  const refreshConnectionStatus = async () => {
    try {
      const result = await refetchStatus();
      const data = result.data as WhatsAppConnectionStatus | undefined;
      
      // ✅ Simplified check - just check connected flag
      if (data?.connected) {
        stopPolling();
        closePopup();
        setConnected(true);
        setPhoneNumber(data.phone_number || null);
        setLoading(false);
        setOnboardingUrl(null);
        setLoadingMessage(null);
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
        void queryClient.invalidateQueries({ queryKey: ["integrations"] });
        toast.success("✅ WhatsApp connected successfully!");
        return true;
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
    return false;
  };

  // New function to refresh status from Gupshup (calls GetAppDetails)
  const refreshWhatsAppStatus = async () => {
    try {
      toast.loading('Refreshing WhatsApp status...', { id: 'refresh-status' });
      
      const response = await tenantApi.whatsappRefreshStatus();
      
      // Update local state with refreshed data
      if (response.connected) {
        setConnected(true);
        setPhoneNumber(response.phone_number || null);
        setLoading(false);
        setOnboardingUrl(null);
        setLoadingMessage(null);
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
        void queryClient.invalidateQueries({ queryKey: ["integrations"] });
        
        if (response.updated) {
          toast.success("✅ WhatsApp status updated and connected!", { id: 'refresh-status' });
        } else {
          toast.success("✅ WhatsApp is connected!", { id: 'refresh-status' });
        }
      } else {
        // Not connected yet
        if (response.updated) {
          toast.success(`Status updated: ${response.status || 'pending'}`, { id: 'refresh-status' });
        } else {
          toast.success(`Current status: ${response.status || 'pending'}`, { id: 'refresh-status' });
        }
        
        // If status is still pending, show appropriate message
        if (response.status === 'pending_onboarding' || response.status === 'pending_verification') {
          setLoadingMessage(`Status: ${response.status}. Please complete the onboarding process...`);
        }
      }
      
      // Refetch to update the query cache
      await refetchStatus();
      
    } catch (err: any) {
      console.error('Refresh status error:', err);
      toast.error(err.message || 'Failed to refresh status', { id: 'refresh-status' });
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current);
      popupCheckIntervalRef.current = null;
    }
    setLoadingMessage(null);
  };

  const closePopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      closePopup();
      // Remove message listener if it exists
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
        messageHandlerRef.current = null;
      }
    };
  }, []);

  // Disconnect mutation
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp number?")) {
      return;
    }
    
    try {
      await tenantApi.disconnectWhatsApp();
      toast.success("✅ WhatsApp number disconnected");
      setConnected(false);
      setPhoneNumber(null);
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
      setOnboardingUrl(null);
      stopPolling();
      closePopup();
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect. Please try again.");
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return phone;
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="whatsapp-connect-container max-w-2xl mx-auto space-y-4">
      {error && (
        <div className="error-banner rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start justify-between">
            <p className="text-sm text-rose-900">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-rose-700 hover:text-rose-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <div className="spinner mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
          <p className="text-sm font-semibold text-amber-900">
            {loadingMessage || 'Waiting for Meta WhatsApp onboarding to complete...'}
          </p>
          <p className="mt-2 text-xs text-amber-700">
            Complete the steps in the popup window. This may take a few minutes.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button 
              onClick={stopPolling} 
              className="btn-secondary rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                // Use refresh-status for Gupshup, regular refresh for others
                if (selectedProvider === 'gupshup') {
                  await refreshWhatsAppStatus();
                } else {
                  await refreshConnectionStatus();
                }
              }}
              className="btn-primary rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              Check Status Now
            </button>
          </div>
        </div>
      )}

      {connected && (
        <div className="success-state rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="text-center">
            <div className="success-icon text-3xl mb-2">✅</div>
            <h3 className="text-sm font-semibold text-emerald-900">WhatsApp Connected!</h3>
            {phoneNumber && (
              <p className="mt-2 text-sm font-semibold text-emerald-900">
                Phone Number: <strong>{formatPhoneNumber(phoneNumber)}</strong>
              </p>
            )}
            <p className="mt-2 text-xs text-emerald-700">
              Your WhatsApp Business Account is ready to receive messages.
            </p>
          </div>
          
          {/* Provider-specific information */}
          {connectionStatus?.provider === 'gupshup_partner' && (
            <div className="mt-4 p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-emerald-800">
                ✅ Connected via Gupshup Partner
              </p>
              {connectionStatus.app_id && (
                <p className="mt-1 text-xs text-emerald-700">
                  App ID: {connectionStatus.app_id}
                </p>
              )}
            </div>
          )}
          
          {connectionStatus?.provider === 'meta_embedded' && (
            <div className="mt-4 p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-emerald-800">
                ✅ Connected via Meta Embedded Signup
              </p>
              {connectionStatus.external_id && (
                <p className="mt-1 text-xs text-emerald-700">
                  External ID: {connectionStatus.external_id}
                </p>
              )}
            </div>
          )}
          
          {connectionStatus?.provider === 'respondio' && (
            <div className="mt-4 p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-emerald-800">
                ✅ Connected via Respond.io
              </p>
            </div>
          )}
          
          {connectionStatus?.status === 'pending_onboarding' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800">
                ⏳ Onboarding in progress. Please complete the setup in the popup window.
              </p>
              {connectionStatus.provider === 'gupshup_partner' && (
                <button
                  onClick={refreshWhatsAppStatus}
                  className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  🔄 Refresh Status from Gupshup
                </button>
              )}
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {connectionStatus?.provider === 'gupshup_partner' && (
              <button
                onClick={refreshWhatsAppStatus}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                title="Refresh status from Gupshup API"
              >
                🔄 Refresh Status
              </button>
            )}
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {!loading && !connected && connectionStatus && !connectionStatus.connected && connectionStatus.status === 'pending_onboarding' && connectionStatus.provider === 'gupshup_partner' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-900 mb-2">
            ⏳ Onboarding in progress. Status may be stuck.
          </p>
          <button
            onClick={refreshWhatsAppStatus}
            className="w-full rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            🔄 Refresh Status from Gupshup
          </button>
        </div>
      )}

      {!loading && !connected && (
        <div className="connect-prompt rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Connect WhatsApp</h2>
          <p className="text-xs text-gray-600 mb-4">
            Choose a provider to connect your WhatsApp Business Account.
            Each tenant gets their own WhatsApp number.
          </p>
          
          <form onSubmit={(e) => { e.preventDefault(); connectWhatsApp(); }} className="space-y-4">
            {/* Provider selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Provider</label>
              <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value as 'gupshup' | 'meta_embedded' | 'respondio')}
                aria-label="WhatsApp provider"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              >
                <option value="gupshup">Gupshup Partner (Recommended)</option>
                <option value="meta_embedded">Meta Embedded Signup</option>
                <option value="respondio">Respond.io</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {selectedProvider === 'gupshup' && 'Phone number selection happens in Gupshup UI. Phone number is optional here.'}
                {selectedProvider === 'meta_embedded' && 'Connect using Meta&apos;s Embedded Signup flow.'}
                {selectedProvider === 'respondio' && 'Instant connection. Phone number required.'}
              </p>
            </div>

            {/* Phone number input for Respond.io */}
            {selectedProvider === 'respondio' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumberInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[\d\s\-+]*$/.test(value)) {
                        setPhoneNumberInput(value);
                      }
                    }}
                    placeholder="+1234567890"
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
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
              </>
            )}

            {/* Phone number input for Gupshup (optional) */}
            {selectedProvider === 'gupshup' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phoneNumberInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\d\s\-+]*$/.test(value)) {
                      setPhoneNumberInput(value);
                    }
                  }}
                  placeholder="+1234567890 (optional)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to select phone number in Gupshup UI.
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <button 
                type="submit"
                disabled={loading || (selectedProvider === 'respondio' && !phoneNumberInput.trim())}
                className="btn-primary flex-1 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
              >
                {selectedProvider === 'gupshup' ? 'Continue to Gupshup' : selectedProvider === 'meta_embedded' ? 'Continue to Meta' : 'Connect WhatsApp'}
              </button>
              <button 
                type="button"
                onClick={() => refetchStatus()} 
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                title="Refresh connection status"
              >
                🔄
              </button>
            </div>
          </form>
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
