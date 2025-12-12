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
        return "bg-green-100 text-green-700";
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

  type StatusTab = {
    key: Order["status"] | undefined;
    label: string;
    count?: number;
  };

  const statusTabs: StatusTab[] = [
    { key: undefined, label: "All", count: stats?.total_orders },
    { key: "pending", label: "Pending", count: stats?.pending_orders },
    { key: "processing", label: "Processing" },
    { key: "completed", label: "Completed", count: stats?.completed_orders },
    { key: "cancelled", label: "Cancelled" },
  ];

  const activeStatusKey = (statusFilter || undefined) as StatusTab["key"];

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl lg:text-4xl">Orders</h1>
            <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm">Manage customer orders from sales conversations</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
            <div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-blue-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
            <div className="relative">
              <p className="text-xs text-gray-600 sm:text-sm">Total Orders</p>
              <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{stats.total_orders}</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
            <div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-yellow-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
            <div className="relative">
              <p className="text-xs text-gray-600 sm:text-sm">Pending</p>
              <p className="mt-1 text-xl font-bold text-yellow-600 sm:text-2xl">{stats.pending_orders}</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
            <div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-green-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
            <div className="relative">
              <p className="text-xs text-gray-600 sm:text-sm">Completed</p>
              <p className="mt-1 text-xl font-bold text-green-600 sm:text-2xl">{stats.completed_orders}</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4 col-span-2 lg:col-span-1">
            <div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-purple-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
            <div className="relative">
              <p className="text-xs text-gray-600 sm:text-sm">Total Revenue</p>
              <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                {stats.currency} {(stats.total_revenue ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Tabs */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:h-5 sm:w-5" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 sm:pl-10 sm:pr-4 sm:py-2.5"
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <select
              value={platformFilter || ""}
              onChange={(e) => setPlatformFilter(e.target.value || undefined)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
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
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const active = tab.key === activeStatusKey;
            return (
              <button
                key={String(tab.key ?? "all")}
                onClick={() => setStatusFilter(tab.key ?? undefined)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:text-sm ${
                  active
                    ? "border-primary/20 bg-primary text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:text-primary"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-xs ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
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
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center sm:p-16">
          <PackageIcon className="mx-auto h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
          <p className="mt-4 text-base font-semibold text-gray-900 sm:text-lg">No orders found</p>
          <p className="mt-2 text-xs text-gray-600 sm:text-sm">Orders will appear here when customers commit to purchase.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Orders</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{count}</span>
            </div>
          </div>

          {/* Table header (desktop) */}
          <div className="hidden grid-cols-12 gap-3 border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 sm:grid">
            <div className="col-span-3">Order</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-3">Payment Ref</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredOrders.map((order) => {
              const isNew = isNewOrder(order);
              const autoCreated = isAutoCreated(order);
              const itemCount = order.items?.length ?? 0;

              return (
                <Link
                  key={order.id}
                  href={`/app/orders/${order.id}`}
                  className={`block px-4 py-3 transition hover:bg-gray-50 ${isNew ? "bg-primary/5" : "bg-white"}`}
                >
                  {/* Mobile card */}
                  <div className="space-y-2 sm:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                      {autoCreated && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Auto</span>
                      )}
                      {isNew && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">New</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 capitalize">{order.platform}</span>
                    </div>
                    <p className="text-xs text-gray-600">Customer: <span className="font-medium">{order.customer_name}</span></p>
                    <p className="text-xs text-gray-600">Items: <span className="font-medium">{itemCount}</span></p>
                    <div onClick={(e) => e.preventDefault()}>
                      <CopyToClipboard text={order.payment_reference} showLabel={false} className="text-xs" />
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-base font-bold text-gray-900">{order.currency} {(order.total_amount ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden grid-cols-12 items-center gap-3 sm:grid">
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{order.order_number}</p>
                        {autoCreated && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Auto</span>
                        )}
                        {isNew && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">New</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>

                    <div className="col-span-3 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="mt-0.5 text-xs text-gray-500 capitalize">{order.platform} • {itemCount} item(s)</p>
                    </div>

                    <div className="col-span-3 min-w-0" onClick={(e) => e.preventDefault()}>
                      <CopyToClipboard text={order.payment_reference} showLabel={false} className="text-xs" />
                    </div>

                    <div className="col-span-2 text-right">
                      <p className="text-sm font-semibold text-gray-900">{order.currency} {(order.total_amount ?? 0).toLocaleString()}</p>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

