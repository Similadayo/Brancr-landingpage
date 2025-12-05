'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePortalOrders } from "@/app/(tenant)/hooks/usePortal";
import { PackageIcon, XIcon } from "@/app/(tenant)/components/icons";

export default function CustomerPortalOrdersPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { data, isLoading, error } = usePortalOrders(token || "");

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

  const { orders } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
            <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
            <p className="mt-4 text-lg font-semibold text-gray-900">No orders found</p>
            <p className="mt-2 text-sm text-gray-600">You don't have any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/portal/order?token=${token}&order=${order.id}`}
                className="block rounded-xl border-2 border-gray-200 bg-white p-6 transition hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Payment Ref: <span className="font-mono font-medium">{order.payment_reference}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Items: <span className="font-medium">{order.items.length} item(s)</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Created: <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {order.currency} {order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

