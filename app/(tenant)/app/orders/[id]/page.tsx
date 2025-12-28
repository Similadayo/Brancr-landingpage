'use client';

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrder, useUpdateOrder, useConfirmOrderPayment } from "../../../hooks/useOrders";
import { CopyToClipboard } from "../../../components/CopyToClipboard";
import { PortalLinkGenerator } from "../../../components/PortalLinkGenerator";
import {
  PackageIcon,
  XIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
} from "../../../components/icons";
import Select from "@/app/(tenant)/components/ui/Select";
import { toast } from "react-hot-toast";
import { useState, useMemo, useEffect } from "react";
import { formatDate } from '@/lib/date';

// NOTE: This page consumes `GET /api/tenant/orders/{id}` and maps fields exactly as returned by the API.
// See `docs/order-details.md` for exact endpoint names, field mappings, and debugging steps.
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);
  const { data: order, isLoading, error } = useOrder(orderId);
  const updateMutation = useUpdateOrder();
  const confirmPaymentMutation = useConfirmOrderPayment();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-purple-100 text-purple-700";
      case "confirmed":
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isAutoCreated = useMemo(() => {
    if (!order) return false;
    if (order.is_auto_created !== undefined) {
      return order.is_auto_created;
    }
    // Infer from timestamp (created in last 10 minutes)
    const createdAt = new Date(order.created_at).getTime();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return createdAt > tenMinutesAgo;
  }, [order]);

  const orderItems = order?.items ?? [];

  useEffect(() => {
    if (order && !paymentRef) {
      setPaymentRef(order.payment_reference);
    }
  }, [order, paymentRef]);

  const handleConfirmPayment = async () => {
    if (!paymentRef.trim()) {
      toast.error("Payment reference is required");
      return;
    }
    try {
      await confirmPaymentMutation.mutateAsync({
        orderId,
        payload: { payment_reference: paymentRef, notes: notes || undefined },
      });
      setShowConfirmModal(false);
      setPaymentRef(order?.payment_reference || "");
      setNotes("");
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleStatusUpdate = async (newStatus: "pending" | "confirmed" | "processing" | "completed" | "cancelled") => {
    try {
      await updateMutation.mutateAsync({ orderId, payload: { status: newStatus } });
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
        <XIcon className="mx-auto h-12 w-12 text-rose-400" />
        <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load order</p>
        <button
          onClick={() => router.push("/app/orders")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-700 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 dark:hidden" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute inset-0 hidden dark:block" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push("/app/orders")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white transition hover:border-white/50 hover:bg-white/20"
              aria-label="Back to orders"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl truncate">{order.order_number}</h1>
              <p className="mt-1 text-sm text-white/90">Order Details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Reference - Prominent Display */}
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/5 to-primary/10 p-6 shadow-sm">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Payment Reference</h2>
              <p className="mt-1 text-sm text-gray-600">
                Share this reference with the customer for payment verification
              </p>
            </div>
            <CopyToClipboard
              text={order.payment_reference}
              showLabel={false}
              className="justify-start"
            />
          </div>

          {/* Auto-created Indicator */}
          {isAutoCreated && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">Auto-created Order</p>
                  <p className="mt-1 text-sm text-blue-700">
                    This order was created automatically when the customer committed to purchase.
                  </p>
                  {order.conversation_id && (
                    <Link
                      href={`/app/inbox?conversation=${order.conversation_id}`}
                      className="mt-2 inline-block text-sm font-medium text-blue-600 underline hover:text-blue-700"
                    >
                      View Conversation →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Information</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{order.platform ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Name</span>
                <p className="text-sm font-medium text-gray-900">{order.customer_name ?? 'N/A'}</p>
              </div>
              {order.customer_phone && (
                <div>
                  <span className="text-sm text-gray-600">Phone</span>
                  <p className="text-sm font-medium text-gray-900">{order.customer_phone}</p>
                </div>
              )}
              {order.customer_email && (
                <div>
                  <span className="text-sm text-gray-600">Email</span>
                  <p className="text-sm font-medium text-gray-900">{order.customer_email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Items</h2>
            <div className="space-y-3">
              {orderItems && orderItems.length > 0 ? (
                orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name ?? 'N/A'}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity ?? 0} × {order.currency ?? ''} {(item.unit_price ?? 0).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.currency ?? ''} {(item.total_price ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No items found.</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {order.currency} {(order.total_amount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Instructions */}
          {order.payment_instructions && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Instructions</h2>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-gray-700">{order.payment_instructions}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions</h2>
            <div className="space-y-3">
              {order.status === "pending" && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  Confirm Payment
                </button>
              )}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Update Status</label>
                <Select
                  value={order.status}
                  onChange={(value) =>
                    handleStatusUpdate((value || order.status) as 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled')
                  }
                  searchable={false}
                  buttonClassName="px-3 py-2 text-sm rounded-lg"
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'processing', label: 'Processing' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Receipt Section */}
          {/* Portal Link Generator */}
          <PortalLinkGenerator orderId={order.id} />
        </div>
      </div>

      {/* Confirm Payment Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Confirm Payment</h2>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Payment Reference *</label>
                <div className="mt-1">
                  <CopyToClipboard
                    text={order.payment_reference}
                    showLabel={false}
                    className="mb-2"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={order.payment_reference}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Verify the payment reference matches the one sent to the customer
                </p>
              </div>
              <div>
                <label htmlFor="payment-notes" className="block text-sm font-semibold text-gray-700">Notes (Optional)</label>
                <textarea
                  id="payment-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes about the payment..."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirmPaymentMutation.isPending || !paymentRef.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {confirmPaymentMutation.isPending ? "Confirming..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

