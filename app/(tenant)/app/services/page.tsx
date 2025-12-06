'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useServices, useDeleteService, type Service } from "../../hooks/useServices";
import {
  PackageIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
} from "../../components/icons";

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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const itemsPerPage = 20;

  const { data: allServices = [], isLoading, error } = useServices({
    search: query || undefined,
    category: category || undefined,
  });

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

  const categories = useMemo(() => {
    const cats = new Set<string>();
    services.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [services]);

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Services</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your service offerings</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/services/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Add Service
          </Link>
        </div>
      </header>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={category || ""}
              onChange={(e) => setCategory(e.target.value || undefined)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value as PricingTypeFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
          >
            <option value="all">All Pricing Types</option>
            <option value="hourly">Hourly</option>
            <option value="fixed">Fixed</option>
            <option value="package">Package</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="category">Sort by Category</option>
            <option value="duration">Sort by Duration</option>
          </select>
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
          <Link
            href="/app/services/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Add Service
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {paginatedServices.map((service) => {
            const isSelected = selectedIds.includes(service.id);
            return (
              <div
                key={service.id}
                className={`relative rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div className="absolute left-2 top-2 cursor-pointer" onClick={() => toggleSelect(service.id)}>
                  {isSelected ? (
                    <CheckCircleIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{service.name}</h3>
                    {service.category && <p className="text-xs text-gray-500 uppercase tracking-wider">{service.category}</p>}
                  </div>

                  {service.description && <p className="mb-3 line-clamp-2 text-sm text-gray-600">{service.description}</p>}

                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Pricing: {service.pricing.type === "hourly" && service.pricing.rate
                        ? `₦${service.pricing.rate}/hour`
                        : service.pricing.type === "fixed"
                        ? "Fixed Price"
                        : "Package-based"}
                    </p>
                    {service.duration && <p className="text-xs text-gray-500">⏱️ {service.duration}</p>}
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

                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/app/services/${service.id}/edit`}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 transition"
                    >
                      <TrashIcon className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-xs font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
