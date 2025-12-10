'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useTenant } from '@/app/(tenant)/providers/TenantProvider';

type Payment = {
  id: number;
  order_id?: number;
  payment_reference: string;
  amount: number;
  currency: string;
  payment_method?: string;
  status: 'pending' | 'verified' | 'confirmed' | 'failed';
  verification_status?: 'unverified' | 'tenant_verified' | 'disputed';
  claimed_by_customer?: boolean;
  verified_at?: string | null;
  created_at: string;
};

type PaymentStatsResponse = {
  stats: {
    total_payments: number;
    pending_count: number;
    verified_count: number;
    confirmed_count: number;
    failed_count: number;
    disputed_count: number;
    total_revenue: number;
    pending_revenue: number;
    verified_revenue: number;
    this_month_revenue: number;
    last_month_revenue: number;
    today_payments: number;
    today_revenue: number;
  };
  recent_payments: Array<{
    id: number;
    payment_reference: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
};

type PaymentsListResponse = {
  payments: Payment[];
  count: number;
  total: number;
  limit: number;
  offset: number;
};

function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    // Prefer bearer token from localStorage for MVP; adapt as needed.
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
}

function currencyFormat(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function PaymentsPage() {
  const { tenant } = useTenant();
  const [stats, setStats] = useState<PaymentStatsResponse['stats'] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const token = getAuthToken();

  const headers = useMemo(() => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  async function fetchStats() {
    const res = await fetch('/api/v1/tenant/payments/stats', { headers });
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data: PaymentStatsResponse = await res.json();
    setStats(data.stats);
  }

  async function fetchPayments() {
    const params = new URLSearchParams({
      ...(statusFilter ? { status: statusFilter } : {}),
      limit: String(limit),
      offset: String(offset),
    });
    const res = await fetch(`/api/v1/tenant/payments?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch payments');
    const data: PaymentsListResponse = await res.json();
    setPayments(data.payments);
    setTotal(data.total);
  }

  async function fetchPayment(id: number) {
    const res = await fetch(`/api/v1/tenant/payments/${id}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch payment');
    const data = await res.json();
    setSelectedPayment(data.payment);
  }

  async function verifyPayment(id: number, notes?: string) {
    try {
      const res = await fetch(`/api/v1/tenant/payments/${id}/verify`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(notes ? { notes } : {}),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        if (res.status === 404) throw new Error('Payment not found');
        throw new Error('Failed to verify payment');
      }
      await fetchPayments();
      toast.success('Payment verified');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchPayments()])
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, limit, offset, token]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Payments</h1>
        <div className="text-xs text-gray-500">{tenant?.business_profile?.name || tenant?.business_name || tenant?.name}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Payments" value={stats?.total_payments ?? 0} icon="💰" />
        <StatsCard title="Pending" value={stats?.pending_count ?? 0} icon="⏳" color="yellow" />
        <StatsCard title="Verified" value={stats?.verified_count ?? 0} icon="✅" color="green" />
        <StatsCard title="Revenue" value={currencyFormat(stats?.total_revenue ?? 0, 'NGN')} icon="💵" color="green" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Reference</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-mono">{p.payment_reference}</td>
                <td className="px-4 py-2">{currencyFormat(p.amount, p.currency)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-2">{formatDate(p.created_at)}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    {p.status === 'pending' && (
                      <button
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-accent hover:text-accent"
                        onClick={() => verifyPayment(p.id)}
                      >
                        Verify
                      </button>
                    )}
                    <button
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-accent hover:text-accent"
                      onClick={() => fetchPayment(p.id)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                  {loading ? 'Loading payments…' : 'No payments found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Prev
          </button>
          <button
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelectedPayment(null)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
            <div className="mt-3 space-y-2 text-sm">
              <DetailRow label="Reference" value={selectedPayment.payment_reference} />
              <DetailRow label="Amount" value={currencyFormat(selectedPayment.amount, selectedPayment.currency)} />
              <DetailRow label="Status" value={selectedPayment.status} />
              {selectedPayment.payment_method && <DetailRow label="Method" value={selectedPayment.payment_method} />}
              <DetailRow label="Created" value={formatDate(selectedPayment.created_at)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {selectedPayment.status === 'pending' && (
                <button
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-accent hover:text-accent"
                  onClick={() => verifyPayment(selectedPayment.id)}
                >
                  Verify Payment
                </button>
              )}
              <button
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, icon, color = 'gray' }: { title: string; value: number | string; icon: string; color?: 'gray' | 'yellow' | 'green' }) {
  const border = color === 'yellow' ? 'border-amber-200' : color === 'green' ? 'border-emerald-200' : 'border-gray-200';
  const bg = color === 'yellow' ? 'bg-amber-50' : color === 'green' ? 'bg-emerald-50' : 'bg-white';
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
          <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Payment['status'] }) {
  const color = status === 'pending' ? 'bg-amber-100 text-amber-800' : status === 'verified' || status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{status}</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
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

