'use client';

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { tenantApi } from "@/lib/api";

interface WhatsAppConnectionStatus {
  connected: boolean;
  provider?: string;
  phone_number?: string;
  phone_number_id?: string;
  status?: string;
}

export function WhatsAppNumberSelector() {
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
    if (connectionStatus?.connected) {
      setConnected(true);
      setPhoneNumber(connectionStatus.phone_number || null);
    }
  }, [connectionStatus]);

  const connectWhatsApp = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call backend to get Embedded Signup URL
      const response = await tenantApi.connectWhatsApp({ provider: 'meta_embedded' });
      
      if (response.onboarding_url) {
        setOnboardingUrl(response.onboarding_url);
        
        // Open Embedded Signup in popup
        const popup = window.open(
          response.onboarding_url,
          'Meta WhatsApp Onboarding',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }
        
        popupRef.current = popup;
        
        // Start polling for completion
        startPolling();
      } else {
        throw new Error('Onboarding URL not received from server');
      }
      
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to connect WhatsApp');
      toast.error(err.message || 'Failed to connect WhatsApp');
    }
  };

  const startPolling = () => {
    stopPolling();
    let attempts = 0;
    
    setLoadingMessage('Waiting for Meta WhatsApp onboarding to complete...');
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      
      try {
        // Check connection status
        const result = await refetchStatus();
        const statusData = result.data as WhatsAppConnectionStatus | undefined;
        
        // ✅ SUCCESS: Connection is live!
        if (statusData?.connected && statusData?.status === 'connected') {
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
        
        // Manual refresh every 15 seconds (faster detection)
        if (attempts % 3 === 0) {
          await refreshConnectionStatus();
        }
        
        // Timeout after 5 minutes
        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setLoading(false);
          setError('Onboarding is taking longer than expected. Please check your connection status manually.');
          setLoadingMessage(null);
        }
        
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling on error
      }
    }, 5000); // Poll every 5 seconds

    // Check if popup was closed manually
    popupCheckIntervalRef.current = setInterval(() => {
      const popup = popupRef.current;
      if (popup && popup.closed) {
        clearInterval(popupCheckIntervalRef.current!);
        popupCheckIntervalRef.current = null;
        // Give it 2 seconds, then check status one more time
        setTimeout(async () => {
          await refreshConnectionStatus();
        }, 2000);
      }
    }, 2000);
  };

  const refreshConnectionStatus = async () => {
    try {
      const result = await refetchStatus();
      const data = result.data as WhatsAppConnectionStatus | undefined;
      
      if (data?.connected && data?.status === 'connected') {
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
              onClick={refreshConnectionStatus} 
              className="btn-primary rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              Check Status Now
            </button>
          </div>
        </div>
      )}

      {connected && (
        <div className="success-state rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
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
          <button
            onClick={handleDisconnect}
            className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Disconnect
          </button>
        </div>
      )}

      {!loading && !connected && (
        <div className="connect-prompt rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Connect WhatsApp</h2>
          <p className="text-xs text-gray-600 mb-4">
            Connect your WhatsApp Business Account using Meta&apos;s Embedded Signup.
            Each tenant gets their own WhatsApp number.
          </p>
          <button 
            onClick={connectWhatsApp} 
            className="btn-primary w-full rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            Connect WhatsApp
          </button>
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
