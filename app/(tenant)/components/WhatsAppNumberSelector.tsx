'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { tenantApi, ApiError } from "@/lib/api";

export function WhatsAppNumberSelector() {
  const queryClient = useQueryClient();
  const [assigningNumberId, setAssigningNumberId] = useState<string | null>(null);

  // Fetch available numbers and current assignment
  const { data: numbersData, isLoading, error } = useQuery({
    queryKey: ["whatsapp-numbers"],
    queryFn: () => tenantApi.whatsappNumbers(),
  });

  // Assign number mutation
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
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  ✅ Connected
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-emerald-900">
                Number: {currentNumber.phone_number}
              </p>
              {currentNumber.verified_name && (
                <p className="mt-1 text-xs text-emerald-700">
                  Verified Name: {currentNumber.verified_name}
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
        <div className="space-y-3">
          <p className="text-sm text-gray-600">No number assigned. Select one below:</p>

          {/* Available numbers list */}
          {availableNumbers.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">Available Numbers</h4>
              <div className="grid gap-2">
                {availableNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{num.phone_number}</p>
                      </div>
                      {num.verified_name && (
                        <p className="mt-0.5 text-xs text-gray-500">{num.verified_name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAssign(num.phone_number_id)}
                      disabled={assigningNumberId === num.phone_number_id || assignMutation.isPending}
                      className="ml-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                    >
                      {assigningNumberId === num.phone_number_id ? "Assigning..." : "Select Number"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm text-amber-900">No phone numbers available</p>
              <p className="mt-1 text-xs text-amber-700">
                Contact support to add WhatsApp Business numbers to your account.
              </p>
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

