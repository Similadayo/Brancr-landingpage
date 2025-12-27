'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { tenantApi } from "@/lib/api";
import ConfirmModal from '@/app/components/ConfirmModal';

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
        setError('WhatsApp connection is not configured. Please contact support.');
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
    
    setLoadingMessage(`Waiting for WhatsApp onboarding to complete...`);
    
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

  // Disconnect modal render
  const renderDisconnectModal = () => {
    if (!showDisconnectConfirm) return null;
    return (
      <ConfirmModal
        open={true}
        title="Disconnect WhatsApp number"
        description="Are you sure you want to disconnect this WhatsApp number? This will stop all incoming messages."
        confirmText="Disconnect"
        onConfirm={() => { void confirmDisconnect(); setShowDisconnectConfirm(false); }}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    );
  };

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleDisconnect = useCallback(() => {
    setShowDisconnectConfirm(true);
  }, []);

  // Disconnect mutation
  const confirmDisconnect = async () => {
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
    <div className="whatsapp-connect-container space-y-3">
      {error && (
        <div className="error-banner rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-900/20">
          <div className="flex items-start justify-between">
            <p className="text-xs text-rose-900 dark:text-rose-100">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-rose-700 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
          <div className="spinner mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600 dark:border-amber-800 dark:border-t-amber-400"></div>
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
            {loadingMessage || 'Waiting for WhatsApp onboarding to complete...'}
          </p>
          <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
            Complete the steps in the popup window. This may take a few minutes.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button 
              onClick={stopPolling} 
              className="btn-secondary rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-gray-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
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
              className="btn-primary rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 dark:border-primary/50 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30"
            >
              Check Status Now
            </button>
          </div>
        </div>
      )}

      {connected && (
        <div className="success-state rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-500 text-white">
              <span className="text-sm">✅</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-success-900 dark:text-success-100">WhatsApp Connected!</h3>
              <p className="mt-1 text-xs text-success-700 dark:text-success-300">
                Your WhatsApp Business Account is ready to receive messages.
              </p>
              
              {/* Provider-specific information */}
              {connectionStatus?.provider === 'gupshup_partner' && connectionStatus.app_id && (
                <p className="mt-2 text-xs text-success-600 dark:text-success-400">
                  App ID: {connectionStatus.app_id}
                </p>
              )}
              
              {connectionStatus?.provider === 'meta_embedded' && connectionStatus.external_id && (
                <p className="mt-2 text-xs text-success-600 dark:text-success-400">
                  External ID: {connectionStatus.external_id}
                </p>
              )}
            </div>
          </div>
        </div>
      )}



      {!loading && !connected && (
        <div className="connect-prompt rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Connect WhatsApp</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
            Connect your WhatsApp Business Account. Each tenant gets their own WhatsApp number.
          </p>
          
          <form onSubmit={(e) => { e.preventDefault(); connectWhatsApp(); }} className="space-y-4">
            <div className="flex gap-2">
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50 dark:border-primary/50 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30"
              >
                Connect to WhatsApp
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
