'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { tenantApi, ApiError } from "@/lib/api";

export function WhatsAppNumberSelector() {
  const queryClient = useQueryClient();
  const [assigningNumberId, setAssigningNumberId] = useState<string | null>(null);
  
  // WhatsApp connection flow
  const [countryCode, setCountryCode] = useState('+234'); // Default to Nigeria
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<"auto" | "respondio" | "gupshup">("auto");
  const [codeMethod, setCodeMethod] = useState<"SMS" | "VOICE">("SMS");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

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

  // Fetch available numbers and current assignment
  const { data: numbersData, isLoading, error } = useQuery({
    queryKey: ["whatsapp-numbers"],
    queryFn: () => tenantApi.whatsappNumbers(),
  });

  // Assign number mutation (from pool)
  const assignMutation = useMutation({
    mutationFn: (phoneNumberId: string) => tenantApi.assignWhatsAppNumber(phoneNumberId),
    onSuccess: (data) => {
      toast.success(`✅ WhatsApp number assigned: ${data.phone_number}`);
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setAssigningNumberId(null);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to assign number. Please try again.");
      }
      setAssigningNumberId(null);
    },
  });

  // Connect WhatsApp mutation
  const connectMutation = useMutation({
    mutationFn: (payload: { phone_number: string; provider?: "auto" | "respondio" | "gupshup" }) => 
      tenantApi.connectWhatsApp(payload),
    onSuccess: (data) => {
      if (data.provider === 'respondio') {
        // Instant connection - show success
        toast.success(data.message || "✅ WhatsApp connected successfully via Respond.io!");
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
        void queryClient.invalidateQueries({ queryKey: ["integrations"] });
        void queryClient.invalidateQueries({ queryKey: ["whatsapp-connection-status"] });
        // Reset form
        setPhoneNumber('');
      } else {
        // Gupshup - show verification code input
        if (data.request_id) {
          setRequestId(data.request_id);
          setShowVerifyForm(true);
          toast.success(`📨 Verification code requested! Check your phone (${codeMethod}) for the code.`);
        } else {
          toast.error("Verification flow initiated but request_id not received");
        }
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

  // Verify number mutation
  const verifyMutation = useMutation({
    mutationFn: (payload: { request_id: number; verification_code: string }) =>
      tenantApi.verifyWhatsAppNumber(payload),
    onSuccess: (data) => {
      toast.success(`✅ ${data.message}`);
      setShowVerifyForm(false);
      setVerificationCode('');
      setPhoneNumber('');
      setRequestId(null);
      setCodeMethod("SMS");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-current"] });
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message || "Verification failed. Check the code and try again.");
      } else {
        toast.error("Verification failed. Please try again.");
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
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to disconnect. Please try again.");
      }
    },
  });

  // Check connection status (with error handling to prevent crashes)
  const { data: connectionStatus } = useQuery({
    queryKey: ["whatsapp-connection-status"],
    queryFn: async () => {
      try {
        return await tenantApi.whatsappConnectionStatus();
      } catch (error) {
        // Silently fail - connection status is optional
        console.warn("Failed to fetch WhatsApp connection status:", error);
        return { connected: false };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleAssign = (phoneNumberId: string) => {
    setAssigningNumberId(phoneNumberId);
    assignMutation.mutate(phoneNumberId);
  };

  const handleDisconnect = () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp number?")) {
      return;
    }
    disconnectMutation.mutate();
  };

  const handleConnectWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    // Combine country code and phone number
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s+/g, '')}`;
    if (!validatePhoneNumber(fullPhoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    connectMutation.mutate({
      phone_number: fullPhoneNumber,
      provider: provider,
    });
  };

  const handleVerifyNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId || verificationCode.length !== 6) return;
    verifyMutation.mutate({
      request_id: requestId,
      verification_code: verificationCode,
    });
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

  // Get quality rating badge
  const getQualityBadge = (quality?: string) => {
    if (!quality) return null;
    const qualityLower = quality.toLowerCase();
    if (qualityLower === 'green' || qualityLower === 'high') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">🟢 High Quality</span>;
    } else if (qualityLower === 'yellow' || qualityLower === 'medium') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">🟡 Medium Quality</span>;
    } else if (qualityLower === 'red' || qualityLower === 'low') {
      return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">🔴 Low Quality</span>;
    }
    return null;
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    if (statusLower === 'available') {
      return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Available</span>;
    } else if (statusLower === 'assigned') {
      return <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Assigned</span>;
    } else if (statusLower === 'suspended') {
      return <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Suspended</span>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm font-semibold text-rose-900">Failed to load numbers</p>
        <p className="mt-1 text-xs text-rose-700">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  const currentNumber = numbersData?.current;
  const availableNumbers = numbersData?.available_numbers || [];
  // Safely check connection status - fallback to currentNumber if status query fails
  const isConnected = (connectionStatus?.connected ?? false) || !!currentNumber;

  return (
    <div className="space-y-4">
      {/* Current assigned number */}
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
                    {connectionStatus.provider === 'respondio' ? 'Respond.io' : connectionStatus.provider === 'gupshup' ? 'Gupshup' : connectionStatus.provider}
                  </span>
                )}
                {!connectionStatus?.provider && currentNumber && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    WhatsApp
                  </span>
                )}
                {(currentNumber as any)?.quality_rating && getQualityBadge((currentNumber as any).quality_rating)}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-emerald-900">Your WhatsApp Number</h3>
              <p className="mt-1 text-sm font-semibold text-emerald-900">
                {formatPhoneNumber(connectionStatus?.phone_number || currentNumber?.phone_number || '')}
              </p>
              {currentNumber?.verified_name && (
                <p className="mt-1 text-xs text-emerald-700">
                  Verified Name: {currentNumber.verified_name}
                </p>
              )}
              {(currentNumber as any)?.assigned_at && (
                <p className="mt-1 text-xs text-emerald-600">
                  Assigned: {new Date((currentNumber as any).assigned_at).toLocaleDateString()}
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
          <h3 className="text-sm font-semibold text-gray-900">No WhatsApp Number Assigned</h3>

          {/* Option 1: Select from Pool */}
          {availableNumbers.length > 0 && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">📋 Available Numbers (Instant)</h4>
                <p className="mt-1 text-xs text-gray-600">Select a number from our pool - instant activation!</p>
              </div>
              <div className="grid gap-2">
                {availableNumbers.map((num) => {
                  const numData = num as any;
                  return (
                    <div
                      key={num.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{formatPhoneNumber(num.phone_number)}</p>
                          {numData.status && getStatusBadge(numData.status)}
                          {numData.quality_rating && getQualityBadge(numData.quality_rating)}
                        </div>
                        {num.verified_name && (
                          <p className="mt-0.5 text-xs text-gray-500">✓ Verified: {num.verified_name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAssign(num.phone_number_id)}
                        disabled={assigningNumberId === num.phone_number_id || assignMutation.isPending || numData.status === 'suspended'}
                        className="ml-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningNumberId === num.phone_number_id ? "Assigning..." : "Select This Number"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Option 2: Connect WhatsApp */}
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">📱 Connect Your WhatsApp Number</h4>
              <p className="mt-1 text-xs text-gray-600">
                Connect your WhatsApp Business number to start receiving and sending messages.
              </p>
            </div>

            {!showVerifyForm && (
              <form onSubmit={handleConnectWhatsApp} className="space-y-2">
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
                      // Allow only digits, spaces, and dashes (no + sign needed as it's in country code)
                      if (/^[\d\s\-]*$/.test(value)) {
                        setPhoneNumber(value);
                      }
                    }}
                    placeholder="8123456789"
                    required
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                {/* Provider selector (optional) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Provider (optional)</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as "auto" | "respondio" | "gupshup")}
                    aria-label="WhatsApp provider"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="auto">Auto (Recommended)</option>
                    <option value="respondio">Respond.io (Instant)</option>
                    <option value="gupshup">Gupshup (Verification Required)</option>
                  </select>
                </div>

                {/* SMS/Voice selector (only shown for Gupshup) */}
                {provider === "gupshup" && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="codeMethod"
                        value="SMS"
                        checked={codeMethod === "SMS"}
                        onChange={(e) => setCodeMethod(e.target.value as "SMS" | "VOICE")}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium text-gray-700">SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="codeMethod"
                        value="VOICE"
                        checked={codeMethod === "VOICE"}
                        onChange={(e) => setCodeMethod(e.target.value as "SMS" | "VOICE")}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium text-gray-700">Voice</span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={connectMutation.isPending || !phoneNumber.trim()}
                  className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  {connectMutation.isPending ? "Connecting..." : "Connect WhatsApp"}
                </button>
              </form>
            )}

            {showVerifyForm && (
              <div className="space-y-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                  <p className="text-xs text-emerald-900">
                    ✅ Verification code sent via {codeMethod} to {formatPhoneNumber(`${countryCode}${phoneNumber.replace(/\s+/g, '')}`)}
                  </p>
                </div>
                <form onSubmit={handleVerifyNumber} className="space-y-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={verifyMutation.isPending || verificationCode.length !== 6}
                      className="flex-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                    >
                      {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVerifyForm(false);
                        setVerificationCode('');
                        setRequestId(null);
                        setPhoneNumber('');
                        setCodeMethod("SMS");
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {availableNumbers.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm text-amber-900">⚠️ No numbers available</p>
              <p className="mt-1 text-xs text-amber-700">Contact support to add WhatsApp Business numbers.</p>
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
