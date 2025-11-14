'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { tenantApi, ApiError } from "@/lib/api";

export function WhatsAppNumberSelector() {
  const queryClient = useQueryClient();
  const [assigningNumberId, setAssigningNumberId] = useState<string | null>(null);
  
  // Tenant-provided number flow
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestPhoneNumber, setRequestPhoneNumber] = useState('');
  const [phoneNumberID, setPhoneNumberID] = useState<string | null>(null);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [checkingNumber, setCheckingNumber] = useState(false);

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

  // Request number mutation (custom number)
  const requestMutation = useMutation({
    mutationFn: (phoneNumber: string) => tenantApi.requestWhatsAppNumber({ phone_number: phoneNumber }),
    onSuccess: (data) => {
      setPhoneNumberID(data.phone_number_id);
      setShowRequestForm(false);
      setShowVerifyForm(true);
      toast.success("📨 Verification code requested! Check your phone (SMS) for the code.");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.body?.error === 'phone_number_not_found') {
          toast.error(
            "📱 This phone number is not yet in our system. Please contact support to add your phone number first, or select an available number from the pool below.",
            { duration: 8000 }
          );
          setShowRequestForm(false);
        } else {
          toast.error(error.message || "Failed to request number");
        }
      } else {
        toast.error("Failed to request number. Please try again.");
      }
    },
  });

  // Verify number mutation
  const verifyMutation = useMutation({
    mutationFn: (payload: { phone_number_id: string; verification_code: string }) =>
      tenantApi.verifyWhatsAppNumber(payload),
    onSuccess: (data) => {
      toast.success(`✅ ${data.message}`);
      setShowVerifyForm(false);
      setVerificationCode('');
      setRequestPhoneNumber('');
      setPhoneNumberID(null);
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

  // Check number mutation
  const checkNumberMutation = useMutation({
    mutationFn: (phoneNumber: string) => tenantApi.checkWhatsAppNumber({ phone_number: phoneNumber }),
    onSuccess: (data) => {
      if (data.ready) {
        toast.success("✅ Number is ready for verification!");
        setShowRequestForm(true);
      } else {
        toast.error(data.message || "Number is not ready yet. Please contact support to add your number to Meta Business Manager first.");
      }
      setCheckingNumber(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to check number status");
      } else {
        toast.error("Failed to check number. Please try again.");
      }
      setCheckingNumber(false);
    },
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

  const handleRequestNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(requestPhoneNumber)) {
      toast.error("Please enter a valid phone number (e.g., +1234567890)");
      return;
    }
    const cleanedPhone = requestPhoneNumber.replace(/\s+/g, '');
    requestMutation.mutate(cleanedPhone);
  };

  const handleVerifyNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberID || verificationCode.length !== 6) return;
    verifyMutation.mutate({
      phone_number_id: phoneNumberID,
      verification_code: verificationCode,
    });
  };

  const handleCheckNumber = () => {
    if (!requestPhoneNumber) {
      toast.error("Please enter a phone number first");
      return;
    }
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanedPhone = requestPhoneNumber.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      toast.error("Please enter a valid phone number (e.g., +1234567890)");
      return;
    }
    setCheckingNumber(true);
    checkNumberMutation.mutate(cleanedPhone);
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

  return (
    <div className="space-y-4">
      {/* Current assigned number */}
      {currentNumber ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  ✅ Connected
                </span>
                {(currentNumber as any).quality_rating && getQualityBadge((currentNumber as any).quality_rating)}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-emerald-900">Your WhatsApp Number</h3>
              <p className="mt-1 text-sm font-semibold text-emerald-900">
                {formatPhoneNumber(currentNumber.phone_number)}
              </p>
              {currentNumber.verified_name && (
                <p className="mt-1 text-xs text-emerald-700">
                  Verified Name: {currentNumber.verified_name}
                </p>
              )}
              {(currentNumber as any).assigned_at && (
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

          {/* Option 2: Custom Number */}
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">📱 Use Your Own Number</h4>
              <p className="mt-1 text-xs text-gray-600">
                Admin must add your number to Meta Business Manager first. Then verify it here.
              </p>
            </div>

            {!showRequestForm && !showVerifyForm && (
              <div className="space-y-2">
                <input
                  type="tel"
                  value={requestPhoneNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow digits, +, spaces, and dashes
                    if (/^[\d\s\+\-]*$/.test(value)) {
                      setRequestPhoneNumber(value);
                    }
                  }}
                  placeholder="+1234567890"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCheckNumber}
                    disabled={checkingNumber || !requestPhoneNumber}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {checkingNumber ? "Checking..." : "Check Status"}
                  </button>
                  <button
                    onClick={() => setShowRequestForm(true)}
                    disabled={!requestPhoneNumber}
                    className="flex-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                  >
                    Request Verification Code
                  </button>
                </div>
              </div>
            )}

            {showRequestForm && (
              <form onSubmit={handleRequestNumber} className="space-y-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                  <p className="text-xs text-amber-900">
                    ⚠️ Admin must add your number to Meta Business Manager first
                  </p>
                </div>
                <input
                  type="tel"
                  value={requestPhoneNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow digits, +, spaces, and dashes
                    if (/^[\d\s\+\-]*$/.test(value)) {
                      setRequestPhoneNumber(value);
                    }
                  }}
                  placeholder="+1234567890"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={requestMutation.isPending || !requestPhoneNumber}
                    className="flex-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                  >
                    {requestMutation.isPending ? "Requesting..." : "Request Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestForm(false);
                      setRequestPhoneNumber('');
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {showVerifyForm && (
              <form onSubmit={handleVerifyNumber} className="space-y-2">
                <p className="text-xs text-gray-600">
                  Enter the 6-digit verification code sent to {requestPhoneNumber}
                </p>
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
                    {verifyMutation.isPending ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerifyForm(false);
                      setVerificationCode('');
                      setPhoneNumberID(null);
                      setRequestPhoneNumber('');
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
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
