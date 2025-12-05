'use client';

import { useState, useMemo } from "react";
import { usePayments, useVerifyPayment, useDisputePayment, type Payment } from "../../hooks/usePayments";
import {
  CreditCardIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "../../components/icons";
import { toast } from "react-hot-toast";

export default function PaymentsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [verificationFilter, setVerificationFilter] = useState<string | undefined>(undefined);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const { data: paymentsData, isLoading, error } = usePayments({
    status: statusFilter,
    verification_status: verificationFilter,
    limit: 50,
  });
  const verifyMutation = useVerifyPayment();
  const disputeMutation = useDisputePayment();

  const payments = paymentsData?.payments || [];
  const count = paymentsData?.count || 0;

  const filteredPayments = useMemo(() => {
    if (!query) return payments;
    const lowerQuery = query.toLowerCase();
    return payments.filter(
      (payment) =>
        payment.payment_reference.toLowerCase().includes(lowerQuery) ||
        payment.order_number.toLowerCase().includes(lowerQuery) ||
        payment.customer_name.toLowerCase().includes(lowerQuery)
    );
  }, [payments, query]);

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "verified":
        return "bg-green-100 text-green-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "disputed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getVerificationStatusColor = (status: Payment["verification_status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "verified":
        return "bg-green-100 text-green-700";
      case "disputed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleVerify = async () => {
    if (!selectedPayment) return;
    try {
      await verifyMutation.mutateAsync({
        paymentId: selectedPayment.id,
        payload: {
          transaction_id: transactionId || undefined,
          notes: verifyNotes || undefined,
        },
      });
      setShowVerifyModal(false);
      setVerifyNotes("");
      setTransactionId("");
      setSelectedPayment(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDispute = async () => {
    if (!selectedPayment) return;
    try {
      await disputeMutation.mutateAsync({
        paymentId: selectedPayment.id,
        payload: {
          reason: disputeReason || undefined,
          notes: disputeReason || undefined,
        },
      });
      setShowDisputeModal(false);
      setDisputeReason("");
      setSelectedPayment(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl lg:text-4xl">Payment Verification</h1>
            <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm">Verify and manage customer payments</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
          <div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-blue-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
          <div className="relative">
            <p className="text-xs text-gray-600 sm:text-sm">Total Payments</p>
            <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{count}</p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
          <div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-yellow-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
          <div className="relative">
            <p className="text-xs text-gray-600 sm:text-sm">Pending Verification</p>
            <p className="mt-1 text-xl font-bold text-yellow-600 sm:text-2xl">
              {payments.filter((p) => p.verification_status === "pending").length}
            </p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
          <div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-green-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
          <div className="relative">
            <p className="text-xs text-gray-600 sm:text-sm">Verified</p>
            <p className="mt-1 text-xl font-bold text-green-600 sm:text-2xl">
              {payments.filter((p) => p.verification_status === "verified").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:h-5 sm:w-5" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payments..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 sm:pl-10 sm:pr-4 sm:py-2.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <select
            value={verificationFilter || ""}
            onChange={(e) => setVerificationFilter(e.target.value || undefined)}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
          >
            <option value="">All Verification</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="disputed">Disputed</option>
          </select>
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="confirmed">Confirmed</option>
            <option value="disputed">Disputed</option>
          </select>
          <button
            onClick={() => {
              setStatusFilter(undefined);
              setVerificationFilter(undefined);
              setQuery("");
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
          <XIcon className="mx-auto h-12 w-12 text-rose-400" />
          <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load payments</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center sm:p-16">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
          <p className="mt-4 text-base font-semibold text-gray-900 sm:text-lg">No payments found</p>
          <p className="mt-2 text-xs text-gray-600 sm:text-sm">Payments will appear here when customers make payments.</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="group rounded-xl border-2 border-gray-200 bg-white p-3 transition hover:border-primary/30 hover:shadow-md sm:p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{payment.order_number}</h3>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs ${getVerificationStatusColor(payment.verification_status)}`}>
                      {payment.verification_status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5 sm:space-y-1">
                    <p className="text-xs text-gray-600 sm:text-sm">
                      Customer: <span className="font-medium">{payment.customer_name}</span>
                    </p>
                    {payment.customer_phone && (
                      <p className="text-xs text-gray-600 sm:text-sm">
                        Phone: <span className="font-medium">{payment.customer_phone}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-600 sm:text-sm">
                      Payment Ref: <span className="font-mono font-medium">{payment.payment_reference}</span>
                    </p>
                    {payment.transaction_id && (
                      <p className="text-xs text-gray-600 sm:text-sm">
                        Transaction ID: <span className="font-mono font-medium">{payment.transaction_id}</span>
                      </p>
                    )}
                    {payment.verified_at && (
                      <p className="text-xs text-gray-500">
                        Verified: {new Date(payment.verified_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2 sm:ml-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-base font-bold text-gray-900 sm:text-lg">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  {payment.verification_status === "pending" && (
                    <div className="flex gap-2 sm:mt-3 sm:flex-col">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowVerifyModal(true);
                        }}
                        className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-95 sm:px-3"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDisputeModal(true);
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95 sm:px-3"
                      >
                        Dispute
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify Payment Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Verify Payment</h2>
              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedPayment(null);
                  setVerifyNotes("");
                  setTransactionId("");
                }}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Payment Reference</p>
                <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{selectedPayment.payment_reference}</p>
                <p className="mt-2 text-sm text-gray-600">Amount</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {selectedPayment.currency} {selectedPayment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Bank transaction ID, mobile money reference, etc."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Notes (Optional)</label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional verification notes..."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setSelectedPayment(null);
                    setVerifyNotes("");
                    setTransactionId("");
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-95 disabled:opacity-50 sm:shadow-md"
                >
                  {verifyMutation.isPending ? "Verifying..." : "Verify Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Payment Modal */}
      {showDisputeModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Dispute Payment</h2>
              <button
                type="button"
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedPayment(null);
                  setDisputeReason("");
                }}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">Warning</p>
                <p className="mt-1 text-sm text-red-700">
                  Marking this payment as disputed will require manual review. Please provide a reason.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Reason for Dispute *</label>
                <textarea
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why this payment is being disputed..."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setSelectedPayment(null);
                    setDisputeReason("");
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispute}
                  disabled={disputeMutation.isPending || !disputeReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-50 sm:shadow-md"
                >
                  {disputeMutation.isPending ? "Processing..." : "Mark as Disputed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

