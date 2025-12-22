'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMenuItems, useDeleteMenuItem, type MenuItem } from "../../hooks/useMenuItems";
import { useNegotiationSettings } from "../../hooks/useNegotiationSettings";
import { formatNegotiationRule } from "../../utils/negotiation";
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
import Select from "../../components/ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';

type SortOption = 'name' | 'price' | 'category' | 'preparation_time' | 'date';
type AvailabilityFilter = 'all' | 'available' | 'unavailable' | 'limited';
type StatusFilter = 'all' | 'active' | 'inactive';
type SpiceLevelFilter = 'all' | 'mild' | 'medium' | 'hot' | 'very_hot';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut-free',
  'Halal',
  'Kosher',
] as const;

export default function MenuItemsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevelFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const itemsPerPage = 20;

  const { data: allItems = [], isLoading, error } = useMenuItems({
    search: query || undefined,
    category: category || undefined,
  });

  const { data: negotiationSettings } = useNegotiationSettings();

  // Filter and sort menu items
  const items = useMemo(() => {
    let filtered = [...allItems];

    // Filter by availability
    if (availability !== 'all') {
      filtered = filtered.filter((item) => item.availability === availability);
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter((item) => (status === 'active') === item.is_active);
    }

    // Filter by spice level
    if (spiceLevel !== 'all') {
      filtered = filtered.filter((item) => item.spice_level === spiceLevel);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'preparation_time':
          return (a.preparation_time || 0) - (b.preparation_time || 0);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [allItems, availability, status, spiceLevel, sortBy]);

  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const deleteMutation = useDeleteMenuItem();
  const [showDeleteItemId, setShowDeleteItemId] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [items]);

  const handleDelete = (id: number) => {
    setShowDeleteItemId(id);
  };

  const confirmDeleteItem = (id: number) => {
    deleteMutation.mutate(id);
    setShowDeleteItemId(null);
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    selectedIds.forEach((id) => deleteMutation.mutate(id));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {showDeleteItemId && (
        <ConfirmModal
          open={true}
          title="Delete menu item"
          description="Are you sure you want to delete this menu item? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => { if (showDeleteItemId) confirmDeleteItem(showDeleteItemId); }}
          onCancel={() => setShowDeleteItemId(null)}
        />
      )}
      {showBulkDeleteConfirm && (
        <ConfirmModal
          open={true}
          title="Delete selected menu items"
          description={`Are you sure you want to delete ${selectedIds.length} menu item(s)? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={confirmBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />
      )}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Menu Items</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your restaurant menu</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <Link
            href="/app/menu-items/quick-add"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Quick Add / Import
          </Link>
          <Link
            href="/app/menu-items/new"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Add Menu Item
          </Link>
        </div>
      </header>

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
            placeholder="Search menu items..."
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
          <div className="min-w-[200px]">
            <Select
              value={availability}
              onChange={(value) => setAvailability(value as AvailabilityFilter)}
              options={[
                { value: "all", label: "All Availability" },
                { value: "available", label: "Available" },
                { value: "unavailable", label: "Unavailable" },
                { value: "limited", label: "Limited" },
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
          <div className="min-w-[200px]">
            <Select
              value={spiceLevel}
              onChange={(value) => setSpiceLevel(value as SpiceLevelFilter)}
              options={[
                { value: "all", label: "All Spice Levels" },
                { value: "mild", label: "Mild" },
                { value: "medium", label: "Medium" },
                { value: "hot", label: "Hot" },
                { value: "very_hot", label: "Very Hot" },
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
                { value: "preparation_time", label: "Sort by Prep Time" },
              ]}
              searchable={false}
            />
          </div>
          <button
            onClick={() => {
              setCategory(undefined);
              setQuery("");
              setAvailability('all');
              setStatus('all');
              setSpiceLevel('all');
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
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
          <XIcon className="mx-auto h-12 w-12 text-rose-400" />
          <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load menu items</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">No menu items found</p>
          <Link
            href="/app/menu-items/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Add Menu Item
          </Link>
        </div>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`relative rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div className="absolute left-2 top-2 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                  {isSelected ? (
                    <CheckCircleIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                    {item.category && <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>}
                  </div>

                  {item.description && <p className="mb-3 line-clamp-2 text-sm text-gray-600">{item.description}</p>}

                  <div className="mb-3">
                    <p className="text-lg font-bold text-gray-900">
                      {item.currency} {item.price.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatNegotiationRule(item, negotiationSettings ?? undefined)}
                    </p>
                    {item.preparation_time && (
                      <p className="text-xs text-gray-500">⏱️ {item.preparation_time} min</p>
                    )}
                    {item.spice_level && (
                      <p className="text-xs text-gray-500">🌶️ {item.spice_level}</p>
                    )}
                  </div>

                  {item.dietary_info && item.dietary_info.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {item.dietary_info.slice(0, 3).map((info) => (
                        <span
                          key={info}
                          className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                        >
                          {info}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/app/menu-items/${item.id}/edit`}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
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
