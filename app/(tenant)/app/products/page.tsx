'use client';

import { useState, useMemo } from "react";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "../../hooks/useProducts";
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
import { toast } from "react-hot-toast";

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const { data: products = [], isLoading, error } = useProducts({
    search: query || undefined,
    category: category || undefined,
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const handleDelete = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(productId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedProductIds.length} product(s)?`)) {
      selectedProductIds.forEach((id) => deleteMutation.mutate(id));
      setSelectedProductIds([]);
    }
  };

  const toggleSelect = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Products</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your product catalog</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedProductIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Selected ({selectedProductIds.length})
            </button>
          )}
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
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
          <button
            onClick={() => {
              setCategory(undefined);
              setQuery("");
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Clear
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
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">No products found</p>
          <p className="mt-2 text-sm text-gray-600">Add your first product to get started.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Add Product
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            return (
              <div
                key={product.id}
                className={`relative rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div
                  className="absolute left-2 top-2 cursor-pointer"
                  onClick={() => toggleSelect(product.id)}
                >
                  {isSelected ? (
                    <CheckCircleIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                    {product.category && (
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</p>
                    )}
                  </div>

                  {product.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">{product.description}</p>
                  )}

                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {product.currency} {product.price.toLocaleString()}
                      </p>
                      {product.stock_count !== undefined && (
                        <p className="text-xs text-gray-500">
                          Stock: {product.stock_count} {product.availability === "in_stock" ? "✅" : "❌"}
                        </p>
                      )}
                    </div>
                  </div>

                  {product.tags && product.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setIsCreateModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingProduct(null);
          }}
          onCreate={createMutation.mutateAsync}
          onUpdate={(payload) => editingProduct && updateMutation.mutateAsync({ productId: editingProduct.id, payload })}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  product,
  onClose,
  onCreate,
  onUpdate,
}: {
  product: Product | null;
  isEdit?: boolean;
  onClose: () => void;
  onCreate: (payload: any) => Promise<any>;
  onUpdate: (payload: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    currency: product?.currency || "NGN",
    category: product?.category || "",
    stock_count: product?.stock_count || 0,
    tags: product?.tags?.join(", ") || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };

      if (product) {
        await onUpdate(payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{product ? "Edit Product" : "Add Product"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Price *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Stock Count</label>
              <input
                type="number"
                min="0"
                value={formData.stock_count}
                onChange={(e) => setFormData({ ...formData, stock_count: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="electronics, computers, laptops"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : product ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

