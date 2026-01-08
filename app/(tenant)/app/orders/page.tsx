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
import Select from "../../components/ui/Select";
import { Pagination } from "../../components/ui/Pagination";
import { toast } from "react-hot-toast";

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [platformFilter, setPlatformFilter] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();
  const lastOrderIdRef = useRef<string | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

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

    // Use created_at to detect new orders (since IDs are now UUIDs)
    const sortedByTime = [...orders].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestOrderId = sortedByTime[0]?.id;

    if (lastOrderIdRef.current === null) {
      lastOrderIdRef.current = latestOrderId || null;
      return;
    }

    // Find orders created after our last known newest order
    const lastKnownOrder = orders.find(o => o.id === lastOrderIdRef.current);
    if (lastKnownOrder) {
      const lastKnownTime = new Date(lastKnownOrder.created_at).getTime();
      const newOrders = orders.filter((o) => new Date(o.created_at).getTime() > lastKnownTime);
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
                className="mt-2 text-sm font-medium text-accent underline"
              >
                View Order
              </Link>
            </div>
          ),
          { duration: 10000 }
        );
      });
    }
    lastOrderIdRef.current = latestOrderId || lastOrderIdRef.current;
  }, [orders, isLoading]);

  // Remove "new" badge after 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setNewOrderIds((prev) => {
        const now = Date.now();
        const filtered = new Set<string>();
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

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, platformFilter]);

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "badge-warning";
      case "confirmed":
      case "completed":
        return "badge-success";
      case "processing":
        return "badge-info";
      case "cancelled":
        return "badge-error";
      default:
        return "badge-gray";
    }
  };

  const isNewOrder = (order: Order) => {
    const createdAt = new Date(order.created_at).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return createdAt > fiveMinutesAgo || newOrderIds.has(order.id);
  };

  const isAutoCreated = (order: Order) => {
    if (order.is_auto_created !== undefined) {
      return order.is_auto_created;
    }
    const createdAt = new Date(order.created_at).getTime();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return createdAt > tenMinutesAgo;
  };

  // Unified filter options
  const filterOptions = [
    { value: "", label: "All Orders", status: undefined, platform: undefined },
    { value: "pending", label: "Pending", status: "pending", platform: undefined },
    { value: "processing", label: "Processing", status: "processing", platform: undefined },
    { value: "completed", label: "Completed", status: "completed", platform: undefined },
    { value: "cancelled", label: "Cancelled", status: "cancelled", platform: undefined },
  ];

  const activeFilter = useMemo(() => {
    if (statusFilter && platformFilter) {
      return filterOptions.find(opt => opt.status === statusFilter && opt.platform === platformFilter)?.value || "";
    }
    if (statusFilter) {
      return filterOptions.find(opt => opt.status === statusFilter && !opt.platform)?.value || "";
    }
    if (platformFilter) {
      return "";
    }
    return "";
  }, [statusFilter, platformFilter]);

  const handleFilterChange = (value: string) => {
    const option = filterOptions.find(opt => opt.value === value);
    if (option) {
      setStatusFilter(option.status);
      // Clear platform filter when changing status filter to avoid confusing combined filtering
      setPlatformFilter(undefined);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[80px] lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Modern Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-600 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
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
                <PackageIcon className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" />
                <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Orders</h1>
              </div>
              <p className="text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                Manage customer orders from sales conversations
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <div
                onClick={() => {
                  setStatusFilter(undefined);
                  setPlatformFilter(undefined);
                  setQuery("");
                }}
                className="stat-card group cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
              >
                <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-info-400/20 to-info-500/20 blur-2xl transition-transform group-hover:scale-150" />
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Total Orders</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{stats.total_orders ?? 0}</p>
                </div>
              </div>
              <div
                onClick={() => setStatusFilter("pending")}
                className="stat-card group cursor-pointer transition-all hover:ring-2 hover:ring-warning/50"
              >
                <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-warning-400/20 to-warning-500/20 blur-2xl transition-transform group-hover:scale-150" />
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-warning-600 dark:text-warning-400 sm:text-3xl">{stats.pending_orders ?? 0}</p>
                </div>
              </div>
              <div
                onClick={() => setStatusFilter("completed")}
                className="stat-card group cursor-pointer transition-all hover:ring-2 hover:ring-success/50"
              >
                <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-success-400/20 to-success-500/20 blur-2xl transition-transform group-hover:scale-150" />
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Completed</p>
                  <p className="mt-2 text-2xl font-bold text-success-600 dark:text-success-400 sm:text-3xl">{stats.completed_orders ?? 0}</p>
                </div>
              </div>
              <div className="stat-card group col-span-2 lg:col-span-1">
                <div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-accent-400/20 to-accent-500/20 blur-2xl transition-transform group-hover:scale-150" />
                <div className="relative">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Total Revenue</p>
                  <p className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl lg:text-3xl">
                    {stats.currency} {(stats.total_revenue ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unified Search and Filter Section */}
          <div className="card p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="search-bar flex-1 sm:max-w-md lg:max-w-lg">
                <MagnifyingGlassIcon className="input-icon" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by order number, customer name, or payment reference..."
                  className="search-input"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <FunnelIcon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-400" />
                  <div className="flex-1 sm:flex-none sm:min-w-[180px]">
                    <Select
                      value={activeFilter}
                      onChange={(value) => handleFilterChange(value as string)}
                      options={filterOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                      searchable={false}
                    />
                  </div>
                  <div className="flex-1 sm:flex-none sm:min-w-[180px]">
                    <Select
                      value={(platformFilter || "") as any}
                      onChange={(value) => setPlatformFilter(value ? String(value) : undefined)}
                      options={[
                        { value: "", label: "All Platforms" },
                        { value: "whatsapp", label: "WhatsApp" },
                        { value: "instagram", label: "Instagram" },
                        { value: "telegram", label: "Telegram" },
                        { value: "facebook", label: "Facebook" },
                      ]}
                      searchable={false}
                    />
                  </div>
                </div>
                {(query || statusFilter || platformFilter) && (
                  <button
                    onClick={() => {
                      setStatusFilter(undefined);
                      setPlatformFilter(undefined);
                      setQuery("");
                    }}
                    className="btn-ghost text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-600" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-600" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="card p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
                <XIcon className="h-8 w-8 text-error-600 dark:text-error-400" />
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Failed to load orders</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-white">Please try refreshing the page</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="card p-12 text-center sm:p-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                <PackageIcon className="h-8 w-8 text-gray-400 dark:text-gray-400" />
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No orders found</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-white">
                {query || statusFilter || platformFilter
                  ? "Try adjusting your search or filters"
                  : "Orders will appear here when customers commit to purchase"}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-700/50 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">Order List</p>
                    <span className="badge badge-gray text-[10px] sm:text-xs">{filteredOrders.length}</span>
                  </div>
                </div>
              </div>

              {/* Desktop Table Header */}
              <div className="hidden grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 md:grid lg:px-6">
                <div className="col-span-3">Order</div>
                <div className="col-span-3">Customer</div>
                <div className="col-span-3">Payment Reference</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1 text-right">Status</div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedOrders.map((order) => {
                  const isNew = isNewOrder(order);
                  const autoCreated = isAutoCreated(order);
                  const itemCount = order.items?.length ?? 0;

                  return (
                    <Link
                      key={order.id}
                      href={`/app/orders/${order.id}`}
                      className={`block px-4 py-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 sm:px-6 ${isNew ? "bg-success-50/50 dark:bg-success-900/10" : ""}`}
                    >
                      {/* Mobile View */}
                      <div className="space-y-3 sm:hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                          {autoCreated && <span className="badge badge-info text-[10px]">Auto</span>}
                          {isNew && <span className="badge badge-success text-[10px]">New</span>}
                          <span className={`badge ${getStatusBadge(order.status)} text-[10px]`}>{order.status}</span>
                          <span className="badge badge-gray text-[10px] capitalize">{order.platform}</span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm text-gray-600 dark:text-white">
                            Customer: <span className="font-medium text-gray-900 dark:text-white">{order.customer_name}</span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-white">
                            Items: <span className="font-medium text-gray-900 dark:text-white">{itemCount}</span>
                          </p>
                          <div onClick={(e) => e.preventDefault()}>
                            <CopyToClipboard text={order.payment_reference} showLabel={false} className="text-xs" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {order.currency} {(order.total_amount ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white">
                            {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="hidden grid-cols-12 items-center gap-3 md:grid lg:gap-4">
                        <div className="col-span-3 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                            {autoCreated && <span className="badge badge-info text-[10px]">Auto</span>}
                            {isNew && <span className="badge badge-success text-[10px]">New</span>}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-white">
                            {new Date(order.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="col-span-3 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-white capitalize">
                            {order.platform} • {itemCount} item(s)
                          </p>
                        </div>

                        <div className="col-span-3 min-w-0" onClick={(e) => e.preventDefault()}>
                          <CopyToClipboard text={order.payment_reference} showLabel={false} className="text-xs" />
                        </div>

                        <div className="col-span-2 text-right">
                          <p className="text-base font-bold text-gray-900 dark:text-white">
                            {order.currency} {(order.total_amount ?? 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <span className={`badge ${getStatusBadge(order.status)} text-[10px]`}>{order.status}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredOrders.length}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
