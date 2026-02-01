'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useCustomers, type Customer } from "../../hooks/useCustomers";
import { MagnifyingGlassIcon, FunnelIcon, UsersIcon, XIcon } from "../../components/icons";
import Select from "../../components/ui/Select";
import { Pagination } from "../../components/ui/Pagination";

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [paidFilter, setPaidFilter] = useState<"paid" | "all">("paid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const paidOnly = paidFilter === "paid" ? true : undefined;

  const { data: customersData, isLoading } = useCustomers({
    paid: paidOnly,
    limit: 100,
    offset: 0,
  });

  const customers = customersData?.customers || [];

  const filteredCustomers = useMemo(() => {
    if (!query) return customers;
    const q = query.toLowerCase();
    return customers.filter((c) => {
      const name = (c.display_name || "").toLowerCase();
      const username = (c.username || "").toLowerCase();
      const platformId = (c.platform_id || "").toLowerCase();
      return name.includes(q) || username.includes(q) || platformId.includes(q);
    });
  }, [customers, query]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, paidFilter]);

  const filterOptions = useMemo(
    () => [
      { value: "paid", label: "Paid Customers" },
      { value: "all", label: "All Customers" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Customers</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Find customers who have paid, view their details, and review their requirement submissions.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, username, platform id..."
                className="w-full rounded-2xl border-2 border-gray-200 bg-white px-11 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Clear search"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <Select
              value={paidFilter}
              onChange={(v) => setPaidFilter((v || "paid") as "paid" | "all")}
              options={filterOptions}
              searchable={false}
              buttonClassName="rounded-2xl"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {isLoading ? "Loading..." : `${filteredCustomers.length} customer${filteredCustomers.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FunnelIcon className="h-4 w-4" />
              <span>{paidFilter === "paid" ? "Paid only" : "All"}</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {!isLoading && paginatedCustomers.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">No customers found.</p>
            </div>
          )}

          {paginatedCustomers.map((c: Customer) => (
            <Link
              key={c.id}
              href={`/app/customers/${c.id}`}
              className="block px-6 py-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {c.display_name || "Unnamed"}
                    {c.username ? <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">@{c.username}</span> : null}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {c.channel} • {c.platform_id}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Paid orders: {c.total_paid}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Last paid: {c.last_paid_at ? new Date(c.last_paid_at).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredCustomers.length > itemsPerPage && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
