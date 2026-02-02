'use client';

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomer } from "../../../hooks/useCustomers";
import { UsersIcon, ChevronLeftIcon, PackageIcon, CreditCardIcon } from "../../../components/icons";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data, isLoading } = useCustomer(customerId);

  const customer = data?.customer;
  const payment = data?.payment_summary;
  const orders = data?.orders || [];
  const submissions = data?.requirement_submissions || [];

  const ordersById = useMemo(() => {
    const map = new Map<string, { order_number: string }>();
    for (const o of orders) {
      map.set(o.id, { order_number: o.order_number });
    }
    return map;
  }, [orders]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading customer...</p>
      </div>
    );
  }

  if (!data || !customer) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">Customer not found.</p>
        <button
          onClick={() => router.push("/app/customers")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/app/customers")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <UsersIcon className="h-6 w-6 text-primary" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">{customer.display_name || "Unnamed"}</h1>
            <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
              {customer.channel} • {customer.platform_id}
              {customer.username ? ` • @${customer.username}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Payment</h2>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Status: <span className="font-semibold">{payment?.has_paid ? payment.status : "not paid"}</span>
              </p>
              {payment?.has_paid && (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    Amount: <span className="font-semibold">{payment.currency} {(payment.amount ?? 0).toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Verified: {payment.verified_at ? new Date(payment.verified_at).toLocaleString() : "-"}
                  </p>
                  {payment.receipt_url ? (
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                    >
                      View receipt
                    </a>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Orders</h2>
            </div>
            <div className="mt-4 space-y-3">
              {orders.length === 0 && <p className="text-sm text-gray-600 dark:text-gray-300">No orders.</p>}
              {orders.slice(0, 5).map((o) => (
                <Link
                  key={o.id}
                  href={`/app/orders/${o.id}`}
                  className="block rounded-xl border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{o.order_number}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {o.currency} {(o.total_amount ?? 0).toLocaleString()} • {o.status}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Requirement submissions</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Latest {submissions.length} submissions
            </p>

            <div className="mt-4 space-y-3">
              {submissions.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">No requirement submissions yet.</p>
              )}

              {submissions.slice(0, 50).map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.requirement_label}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {s.requirement_data_type} • {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {ordersById.get(s.order_id)?.order_number ? `Order: ${ordersById.get(s.order_id)?.order_number}` : null}
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-100">
                    {s.requirement_data_type === "file" ? (
                      (() => {
                        try {
                          // Attempt to parse JSON value
                          const val = s.value?.trim() || "";
                          if (val.startsWith("{") && val.endsWith("}")) {
                            const meta = JSON.parse(val);
                            const url = meta.media_stored_url || meta.media_url;
                            const caption = meta.caption || meta.filename || "View Attachment";

                            if (url) {
                              return (
                                <div className="space-y-2">
                                  {meta.caption && <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">{meta.caption}</p>}
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-primary hover:underline"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    View File ({meta.media_type || "Attachment"})
                                  </a>
                                </div>
                              );
                            }
                          }
                          // Fallback to raw text if not JSON or no URL
                          return s.value || "-";
                        } catch (e) {
                          return s.value || "-";
                        }
                      })()
                    ) : (
                      <div className="whitespace-pre-wrap">{s.value || "-"}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
