'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useServices, useDeleteService, type Service } from "../../hooks/useServices";
import { useNegotiationSettings } from "../../hooks/useNegotiationSettings";
import { formatNegotiationBrief } from "../../utils/negotiation";
import {
  PackageIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XIcon,
  TrashIcon,
  PencilIcon,
} from "../../components/icons";
import Select from "../../components/ui/Select";
import { Pagination } from "../../components/ui/Pagination";
import ConfirmModal from '@/app/components/ConfirmModal';

type SortOption = 'name' | 'price' | 'duration' | 'category' | 'date';
type PricingTypeFilter = 'all' | 'hourly' | 'fixed' | 'package';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function ServicesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [pricingType, setPricingType] = useState<PricingTypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: allServices = [], isLoading, error } = useServices({
    search: query || undefined,
    category: category || undefined,
  });

  const { data: negotiationSettings } = useNegotiationSettings();

  // Filter and sort services
  const services = useMemo(() => {
    let filtered = [...allServices];

    // Filter by pricing type
    if (pricingType !== 'all') {
      filtered = filtered.filter((s) => s.pricing.type === pricingType);
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter((s) => (status === 'active') === s.is_active);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          const aPrice = a.pricing.rate || (a.packages?.[0]?.price || 0);
          const bPrice = b.pricing.rate || (b.packages?.[0]?.price || 0);
          return aPrice - bPrice;
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'duration':
          return (a.duration || '').localeCompare(b.duration || '');
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [allServices, pricingType, status, sortBy]);

  // Pagination
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return services.slice(start, start + itemsPerPage);
  }, [services, currentPage, itemsPerPage]);

  const deleteMutation = useDeleteService();
  const [showDeleteServiceId, setShowDeleteServiceId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    services.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [services]);

  const handleDelete = (id: string) => {
    setShowDeleteServiceId(id);
  };

  const confirmDeleteService = (id: string) => {
    deleteMutation.mutate(id);
    setShowDeleteServiceId(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[80px] lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg z-30">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="space-y-6">
          {showDeleteServiceId && (
            <ConfirmModal
              open={true}
              title="Delete service"
              description="Are you sure you want to delete this service? This action cannot be undone."
              confirmText="Delete"
              onConfirm={() => { if (showDeleteServiceId) confirmDeleteService(showDeleteServiceId); }}
              onCancel={() => setShowDeleteServiceId(null)}
            />
          )}
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
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <PackageIcon className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" />
                    <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Services</h1>
                  </div>
                  <p className="text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                    Manage your service offerings
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/app/services/quick-add"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-white/50 hover:bg-white/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Quick Add / Import
                  </Link>
                  <Link
                    href="/app/services/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-white/30"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Service
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search services..."
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-500 transition hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <div className="min-w-[240px]">
                  <Select
                    value={(category || "") as any}
                    onChange={(value) => setCategory(value ? String(value) : undefined)}
                    options={[
                      { value: "", label: "All Categories" },
                      ...categories.map((cat) => ({ value: cat, label: cat })),
                    ]}
                    searchable
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[220px]">
                <Select
                  value={pricingType}
                  onChange={(value) => setPricingType(value as PricingTypeFilter)}
                  options={[
                    { value: "all", label: "All Pricing Types" },
                    { value: "hourly", label: "Hourly" },
                    { value: "fixed", label: "Fixed" },
                    { value: "package", label: "Package" },
                  ]}
                  searchable={false}
                />
              </div>
              <div className="min-w-[180px]">
                <Select
                  value={status}
                  onChange={(value) => setStatus(value as StatusFilter)}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  searchable={false}
                />
              </div>
              <div className="min-w-[220px]">
                <Select
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortOption)}
                  options={[
                    { value: "date", label: "Sort by Date" },
                    { value: "name", label: "Sort by Name" },
                    { value: "price", label: "Sort by Price" },
                    { value: "category", label: "Sort by Category" },
                    { value: "duration", label: "Sort by Duration" },
                  ]}
                  searchable={false}
                />
              </div>
              <button
                onClick={() => {
                  setCategory(undefined);
                  setQuery("");
                  setPricingType('all');
                  setStatus('all');
                  setSortBy('date');
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary sm:text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
              <XIcon className="mx-auto h-12 w-12 text-rose-400" />
              <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load services</p>
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
              <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-4 text-lg font-semibold text-gray-900">No services found</p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app/services/quick-add"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/5 dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Quick Add / Import
                </Link>
                <Link
                  href="/app/services/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Service
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {paginatedServices.map((service) => {
                  const pricingText =
                    service.pricing.type === "hourly" && typeof service.pricing.rate === "number"
                      ? `₦${service.pricing.rate.toLocaleString()}/hr`
                      : service.pricing.type === "fixed"
                        ? "Fixed"
                        : "Package";

                  const negotiationText = formatNegotiationBrief(service, negotiationSettings ?? undefined);

                  return (
                    <div
                      key={service.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{service.name}</h3>
                          {service.category && (
                            <span className="mt-1 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                              {service.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Link
                            href={`/app/services/${service.id}/edit`}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            aria-label={`Edit ${service.name}`}
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Delete ${service.name}`}
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {service.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                          {service.description}
                        </p>
                      )}

                      <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-medium text-gray-600">Pricing</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {pricingText}
                            <span className="text-xs font-medium text-gray-600"> ({negotiationText})</span>
                          </p>
                        </div>
                        {service.duration && <p className="mt-1 text-xs text-gray-500">⏱️ {service.duration}</p>}
                      </div>

                      {service.packages && service.packages.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-xs font-semibold text-gray-700">Packages:</p>
                          {service.packages.slice(0, 2).map((pkg, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              {pkg.name}: ₦{pkg.price.toLocaleString()} ({pkg.duration})
                            </p>
                          ))}
                        </div>
                      )}

                      {service.deliverables && service.deliverables.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {service.deliverables.slice(0, 3).map((del) => (
                            <span
                              key={del}
                              className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                            >
                              {del}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
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
                    totalItems={services.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
