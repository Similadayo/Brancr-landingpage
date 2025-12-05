'use client';

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useOrders, useOrderStats, type Order } from "../../hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { CopyToClipboard } from "../../components/CopyToClipboard";
import {
  PackageIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XIcon,
  CheckCircleIcon,
  ClockIcon,
} from "../../components/icons";
import { toast } from "react-hot-toast";

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [platformFilter, setPlatformFilter] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const lastOrderIdRef = useRef<number | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());

  const { data: ordersData, isLoading, error } = useOrders({
    status: statusFilter,
    platform: platformFilter,
    limit: 50,
  });
  const { data: stats } = useOrderStats();

  const orders = ordersData?.orders || [];
  const count = ordersData?.count || 0;

  // Real-time polling for new orders
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  // Detect new orders and show notifications
  useEffect(() => {
    if (orders.length === 0 || isLoading) return;

    const currentMaxId = Math.max(...orders.map((o) => o.id));
    
    if (lastOrderIdRef.current === null) {
      lastOrderIdRef.current = currentMaxId;
      return;
    }

    if (currentMaxId > lastOrderIdRef.current) {
      const newOrders = orders.filter((o) => o.id > lastOrderIdRef.current!);
      newOrders.forEach((order) => {
        setNewOrderIds((prev) => new Set(prev).add(order.id));
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <p className="font-semibold">New Order Created!</p>
              <p className="text-sm">{order.order_number} - {order.customer_name}</p>
              <p className="text-sm">Amount: {order.currency} {(order.total_amount ?? 0).toLocaleString()}</p>
              <Link
                href={`/app/orders/${order.id}`}
                onClick={() => toast.dismiss(t.id)}
                className="mt-2 text-sm font-medium text-primary underline"
              >
                View Order
              </Link>
            </div>
          ),
          { duration: 10000 }
        );
      });
      lastOrderIdRef.current = currentMaxId;
    }
  }, [orders, isLoading]);

  // Remove "new" badge after 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setNewOrderIds((prev) => {
        const now = Date.now();
        const filtered = new Set<number>();
        prev.forEach((id) => {
          const order = orders.find((o) => o.id === id);
          if (order) {
            const createdAt = new Date(order.created_at).getTime();
            const fiveMinutesAgo = now - 5 * 60 * 1000;
            if (createdAt > fiveMinutesAgo) {
              filtered.add(id);
            }
          }
        });
        return filtered;
      });
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!query) return orders;
    const lowerQuery = query.toLowerCase();
    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(lowerQuery) ||
        order.customer_name.toLowerCase().includes(lowerQuery) ||
        order.payment_reference.toLowerCase().includes(lowerQuery)
    );
  }, [orders, query]);

  const getStatusColor = (status: Order["status"]) => {
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

  const isNewOrder = (order: Order) => {
    const createdAt = new Date(order.created_at).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return createdAt > fiveMinutesAgo || newOrderIds.has(order.id);
  };

  const isAutoCreated = (order: Order) => {
    // If API provides is_auto_created, use it. Otherwise, infer from timestamp (created in last 10 minutes)
    if (order.is_auto_created !== undefined) {
      return order.is_auto_created;
    }
    const createdAt = new Date(order.created_at).getTime();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return createdAt > tenMinutesAgo;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Orders</h1>
            <p className="mt-1 text-sm text-gray-600">Manage customer orders from sales conversations</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total_orders}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending_orders}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.completed_orders}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stats.currency} {(stats.total_revenue ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order number, customer name, or payment reference..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={platformFilter || ""}
            onChange={(e) => setPlatformFilter(e.target.value || undefined)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Platforms</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="telegram">Telegram</option>
            <option value="facebook">Facebook</option>
          </select>
          <button
            onClick={() => {
              setStatusFilter(undefined);
              setPlatformFilter(undefined);
              setQuery("");
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Orders List */}
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
          <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load orders</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">No orders found</p>
          <p className="mt-2 text-sm text-gray-600">Orders will appear here when customers commit to purchase.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isNew = isNewOrder(order);
            const autoCreated = isAutoCreated(order);
            return (
              <Link
                key={order.id}
                href={`/app/orders/${order.id}`}
                className={`block rounded-xl border-2 p-4 transition hover:shadow-md ${
                  isNew
                    ? "border-primary/50 bg-primary/5 animate-in fade-in slide-in-from-left-2"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                      {autoCreated && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Auto-created
                        </span>
                      )}
                      {isNew && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 animate-pulse">
                          New
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 capitalize">
                        {order.platform}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div
                        onClick={(e) => e.preventDefault()}
                        className="mb-2"
                      >
                        <CopyToClipboard
                          text={order.payment_reference}
                          label="Payment Ref:"
                          showLabel={true}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Customer: <span className="font-medium">{order.customer_name}</span>
                      </p>
                      {order.customer_phone && (
                        <p className="text-sm text-gray-600">
                          Phone: <span className="font-medium">{order.customer_phone}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Items: <span className="font-medium">{order.items.length} item(s)</span>
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {order.currency} {(order.total_amount ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

