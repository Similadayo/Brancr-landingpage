'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

import { usePortalOrder } from "@/app/(tenant)/hooks/usePortal";
import { CopyToClipboard } from "@/app/(tenant)/components/CopyToClipboard";
import { PackageIcon, XIcon, CheckCircleIcon, ClockIcon } from "@/app/(tenant)/components/icons";
import Link from "next/link";

import { formatDate } from "@/lib/date";
import { OrderStatusDropdown, OrderStatus } from "@/app/(tenant)/components/OrderStatusDropdown";
import { useUpdateOrder } from "@/app/(tenant)/hooks/useOrders";

function getValidStatusTransitions(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case 'pending':
      return ['pending', 'confirmed', 'cancelled'];
    case 'confirmed':
      return ['confirmed', 'processing', 'completed', 'cancelled'];
    case 'processing':
      return ['processing', 'completed', 'cancelled'];
    case 'completed':
      return ['completed'];
    case 'cancelled':
      return ['cancelled'];
    default:
      return [current];
  }
}

function CustomerPortalOrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { data, isLoading, error } = usePortalOrder(token || "");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || !data || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <XIcon className="mx-auto h-12 w-12 text-rose-400" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Invalid or Expired Link</h1>
          <p className="mt-3 text-sm text-gray-600">
            This link is invalid or has expired. Please contact the business for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { order, payment, business } = data;
  const [status, setStatus] = React.useState<OrderStatus>(order.status);
  const updateOrder = useUpdateOrder();
  const [statusLoading, setStatusLoading] = React.useState(false);

  // Helper for null/undefined display
  const safe = (val: any, fallback = 'N/A') => (val === null || val === undefined || val === '' ? fallback : val);

  // Handle status update
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === status) return;
    setStatusLoading(true);
    try {
      await updateOrder.mutateAsync({ orderId: order.id, payload: { status: newStatus } });
      setStatus(newStatus);
    } catch (e) {
      // error handled by mutation
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{safe(business?.name)}</h1>
          {business?.location && <p className="mt-1 text-sm text-gray-600">{business.location}</p>}
        </div>

        {/* Order Details */}
        <div className="mb-4 sm:mb-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order Details</h2>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(status)}`}>{safe(status)}</span>
              <OrderStatusDropdown
                value={status}
                onChange={handleStatusChange}
                validTransitions={getValidStatusTransitions(status)}
                disabled={statusLoading || updateOrder.isLoading}
              />
              {statusLoading && <span className="ml-2 text-xs text-gray-500">Updating...</span>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-sm font-medium text-gray-900">{safe(order.id)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="text-lg font-semibold text-gray-900">{safe(order.order_number)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Platform</p>
                <p className="text-sm font-medium text-gray-900">{safe(order.platform)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-gray-600">Payment Reference</p>
              <CopyToClipboard text={safe(order.payment_reference)} showLabel={false} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="text-sm font-medium text-gray-900">{safe(payment?.status)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="text-sm font-medium text-gray-900">{safe(payment?.payment_method)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="text-sm font-medium text-gray-900">{safe(order.customer_name)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Contact</p>
                <p className="text-sm font-medium text-gray-900">{safe(order.customer_email) || safe(order.customer_phone)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Items</h2>
          <div className="space-y-3">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{safe(item.name)}</p>
                    <p className="text-xs text-gray-500">
                      Qty: {safe(item.quantity)} × {safe(order.currency)} {safe(item.unit_price)?.toLocaleString?.() ?? safe(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {safe(order.currency)} {safe(item.total_price)?.toLocaleString?.() ?? safe(item.total_price)}
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
              {safe(order.currency)} {safe(order.total_amount)?.toLocaleString?.() ?? safe(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Payment Information */}
        {payment && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{safe(payment.status)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Reference</p>
                <CopyToClipboard text={safe(payment.payment_reference)} showLabel={false} />
              </div>
              {payment.payment_method && (
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {safe(payment.payment_method.replace("_", " "))}
                  </p>
                </div>
              )}
              {payment.receipt_id && (
                <div>
                  <Link
                    href={`/portal/receipt?token=${token}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    <PackageIcon className="h-4 w-4" />
                    View Receipt
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Portal Link */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer Portal Link</h2>
          <div className="flex items-center gap-2">
            <CopyToClipboard text={`https://brancr.com/portal/${safe(order.order_number)}`} label="Portal Link" />
          </div>
        </div>

        {/* Business Contact */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact Business</h2>
          <div className="space-y-2">
            {business?.phone && (
              <p className="text-sm text-gray-600">
                Phone: <a href={`tel:${business.phone}`} className="font-medium text-primary hover:underline">{business.phone}</a>
              </p>
            )}
            {business?.email && (
              <p className="text-sm text-gray-600">
                Email: <a href={`mailto:${business.email}`} className="font-medium text-primary hover:underline">{business.email}</a>
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href={`/portal/orders?token=${token}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All Orders →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPortalOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    }>
      <CustomerPortalOrderPageContent />
    </Suspense>
  );
}

