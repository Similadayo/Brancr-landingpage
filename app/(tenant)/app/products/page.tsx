'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { useProducts, useDeleteProduct, type Product } from "../../hooks/useProducts";
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
import { Pagination } from "../../components/ui/Pagination";
import { toast } from "react-hot-toast";
import ConfirmModal from '@/app/components/ConfirmModal';

type SortOption = 'name' | 'price' | 'stock' | 'date';
type AvailabilityFilter = 'all' | 'in_stock' | 'out_of_stock' | 'low_stock';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const itemsPerPage = 20;

  const { data: allProducts = [], isLoading, error } = useProducts({
    search: query || undefined,
    category: category || undefined,
  });

  const { data: negotiationSettings } = useNegotiationSettings();

  // Filter and sort products
  const products = useMemo(() => {
    let filtered = [...allProducts];

    // Filter by availability
    if (availability !== 'all') {
      filtered = filtered.filter((p) => p.availability === availability);
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter((p) => (status === 'active') === p.is_active);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'stock':
          return (a.stock_count ?? 0) - (b.stock_count ?? 0);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [allProducts, availability, status, sortBy]);

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage, itemsPerPage]);

  // Cleanup modals when navigating away
  // (optional UX: close confirmation modal when page changes)
  // useEffect(() => { setShowDeleteProductId(null); setShowBulkDeleteConfirm(false); }, [currentPage]);

  const deleteMutation = useDeleteProduct();
  const [showDeleteProductId, setShowDeleteProductId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const handleDelete = (productId: string) => {
    setShowDeleteProductId(productId);
  };

  const confirmDeleteProduct = (productId: string) => {
    deleteMutation.mutate(productId);
    setShowDeleteProductId(null);
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    selectedProductIds.forEach((id) => deleteMutation.mutate(id));
    setSelectedProductIds([]);
    setShowBulkDeleteConfirm(false);
  };

  const toggleSelect = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[80px] lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg z-30">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {showDeleteProductId && (
            <ConfirmModal
              open={true}
              title="Delete product"
              description="Are you sure you want to delete this product? This action cannot be undone."
              confirmText="Delete"
              onConfirm={() => { if (showDeleteProductId) confirmDeleteProduct(showDeleteProductId); }}
              onCancel={() => setShowDeleteProductId(null)}
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
                    <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Products</h1>
                  </div>
                  <p className="text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                    Manage your product catalog
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedProductIds.length > 0 && (
                    <>
                      <button
                        onClick={handleBulkDelete}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Delete ({selectedProductIds.length})
                      </button>
                      <ConfirmModal
                        open={showBulkDeleteConfirm}
                        title="Delete selected products"
                        description={`Are you sure you want to delete ${selectedProductIds.length} product(s)? This cannot be undone.`}
                        confirmText="Delete"
                        onConfirm={confirmBulkDelete}
                        onCancel={() => setShowBulkDeleteConfirm(false)}
                      />
                    </>
                  )}
                  <Link
                    href="/app/products/quick-add"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm sm:shadow-md dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
                  >
                    <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Quick Add / Import
                  </Link>
                  <Link
                    href="/app/products/new"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    Add Product
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-11 pr-3 text-sm text-gray-900 placeholder:text-gray-500 transition hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:pr-4"
                />
              </div>
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-[220px]">
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
                  value={availability}
                  onChange={(value) => setAvailability(value as AvailabilityFilter)}
                  options={[
                    { value: "all", label: "All Availability" },
                    { value: "in_stock", label: "In Stock" },
                    { value: "out_of_stock", label: "Out of Stock" },
                    { value: "low_stock", label: "Low Stock" },
                  ]}
                  searchable={false}
                />
              </div>
              <div className="min-w-[200px]">
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
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortOption)}
                  options={[
                    { value: "date", label: "Sort by Date" },
                    { value: "name", label: "Sort by Name" },
                    { value: "price", label: "Sort by Price" },
                    { value: "stock", label: "Sort by Stock" },
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
                  setSortBy('date');
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
              <XIcon className="mx-auto h-12 w-12 text-rose-400" />
              <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load products</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center sm:p-16">
              <PackageIcon className="mx-auto h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
              <p className="mt-4 text-base font-semibold text-gray-900 sm:text-lg">No products found</p>
              <p className="mt-2 text-xs text-gray-600 sm:text-sm">Add your first product to get started.</p>
              <Link
                href="/app/products/quick-add"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 sm:mt-6 sm:px-6 sm:py-3 sm:text-sm sm:shadow-md dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
              >
                <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Quick Add / Import products
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginatedProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`group relative overflow-hidden rounded-xl border transition-all ${isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md"
                        }`}
                    >
                      <div
                        className="absolute left-2 top-2 z-10 cursor-pointer"
                        onClick={() => toggleSelect(product.id)}
                      >
                        {isSelected ? (
                          <CheckCircleIcon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white transition group-hover:border-primary sm:h-6 sm:w-6" />
                        )}
                      </div>

                      <div className="p-4 pl-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                            {product.category && (
                              <span className="mt-1 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                                {product.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Link
                              href={`/app/products/${product.id}/edit`}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                              aria-label={`Edit ${product.name}`}
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-rose-50 hover:text-rose-700"
                              aria-label={`Delete ${product.name}`}
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {product.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-xs font-medium text-gray-600">Price</p>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {product.currency} {product.price.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {formatNegotiationRule(product, negotiationSettings ?? undefined)}
                              </p>
                            </div>
                          </div>
                          {product.stock_count !== undefined && (
                            <div className="mt-1 flex items-center justify-between border-t border-gray-200/50 pt-1">
                              <p className="text-xs text-gray-500">Stock</p>
                              <p className="text-xs font-medium text-gray-700">
                                {product.stock_count} {product.availability === "in_stock" ? "✅" : "❌"}
                              </p>
                            </div>
                          )}
                        </div>

                        {product.tags && product.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {product.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                      </div>
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
                    totalItems={products.length}
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

