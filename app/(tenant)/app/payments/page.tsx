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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCardIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Payment Verification</h1>
            <p className="mt-1 text-sm text-gray-600">Verify and manage customer payments</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{count}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Pending Verification</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {payments.filter((p) => p.verification_status === "pending").length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {payments.filter((p) => p.verification_status === "verified").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by payment reference, order number, or customer name..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={verificationFilter || ""}
            onChange={(e) => setVerificationFilter(e.target.value || undefined)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Verification Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="disputed">Disputed</option>
          </select>
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary"
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
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <CreditCardIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">No payments found</p>
          <p className="mt-2 text-sm text-gray-600">Payments will appear here when customers make payments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{payment.order_number}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getVerificationStatusColor(payment.verification_status)}`}>
                      {payment.verification_status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      Customer: <span className="font-medium">{payment.customer_name}</span>
                    </p>
                    {payment.customer_phone && (
                      <p className="text-sm text-gray-600">
                        Phone: <span className="font-medium">{payment.customer_phone}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Payment Ref: <span className="font-mono font-medium">{payment.payment_reference}</span>
                    </p>
                    {payment.transaction_id && (
                      <p className="text-sm text-gray-600">
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
                <div className="ml-4 text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {payment.verification_status === "pending" && (
                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowVerifyModal(true);
                        }}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDisputeModal(true);
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
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
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Verify Payment</h2>
              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedPayment(null);
                  setVerifyNotes("");
                  setTransactionId("");
                }}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setSelectedPayment(null);
                    setVerifyNotes("");
                    setTransactionId("");
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
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
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Dispute Payment</h2>
              <button
                type="button"
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedPayment(null);
                  setDisputeReason("");
                }}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setSelectedPayment(null);
                    setDisputeReason("");
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispute}
                  disabled={disputeMutation.isPending || !disputeReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
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

