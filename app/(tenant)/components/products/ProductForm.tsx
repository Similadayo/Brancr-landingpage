'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "../../hooks/useProducts";
import { TrashIcon, ArrowLeftIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import VariantBuilder from "../shared/VariantBuilder";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Select from "../ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';

type ProductFormProps = {
  product?: Product | null;
};

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price !== undefined ? String(product.price) : "",
    currency: product?.currency || "NGN",
    category: product?.category || "",
    negotiation_mode: product?.negotiation_mode || "default",
    negotiation_min_price: product?.negotiation_min_price !== undefined ? String(product.negotiation_min_price) : "",
    negotiation_max_price: product?.negotiation_max_price !== undefined ? String(product.negotiation_max_price) : "",
    sku: (product as any)?.sku || "",
    stock_count: product?.stock_count ?? -1,
    availability: product?.availability || "in_stock",
    is_active: product?.is_active ?? true,
    tags: product?.tags?.join(", ") || "",
    images: product?.images || [],
    variants: product?.variants || {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price !== undefined ? String(product.price) : "",
        currency: product.currency || "NGN",
        category: product.category || "",
        negotiation_mode: product.negotiation_mode || "default",
        negotiation_min_price: product.negotiation_min_price !== undefined ? String(product.negotiation_min_price) : "",
        negotiation_max_price: product.negotiation_max_price !== undefined ? String(product.negotiation_max_price) : "",
        sku: (product as any)?.sku || "",
        stock_count: product.stock_count ?? -1,
        availability: product.availability || "in_stock",
        is_active: product.is_active ?? true,
        tags: product.tags?.join(", ") || "",
        images: product.images || [],
        variants: product.variants || {},
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedPrice = Number(formData.price);

      const negotiationMin = formData.negotiation_min_price === "" ? undefined : Number(formData.negotiation_min_price);
      const negotiationMax = formData.negotiation_max_price === "" ? undefined : Number(formData.negotiation_max_price);

      if (formData.negotiation_mode === "range") {
        if (!Number.isFinite(negotiationMin as number) || !Number.isFinite(negotiationMax as number)) {
          toast.error("Set both min and max prices for negotiation range");
          setIsSubmitting(false);
          return;
        }
        if ((negotiationMin as number) > (negotiationMax as number)) {
          toast.error("Negotiation min price cannot exceed max price");
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        currency: formData.currency,
        category: formData.category || undefined,
        negotiation_mode: formData.negotiation_mode,
        negotiation_min_price: formData.negotiation_mode === "range" ? (negotiationMin as number) : undefined,
        negotiation_max_price: formData.negotiation_mode === "range" ? (negotiationMax as number) : undefined,
        sku: formData.sku || undefined,
        stock_count: formData.stock_count === -1 ? undefined : formData.stock_count,
        availability: formData.availability,
        is_active: formData.is_active,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        variants: Object.keys(formData.variants).length > 0 ? formData.variants : undefined,
      };

      if (product) {
        await updateMutation.mutateAsync({ productId: product.id, payload });
        toast.success("Product updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Product created successfully");
      }
      router.push("/app/products");
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success("Product deleted successfully");
      router.push("/app/products");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/products"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              {product ? "Edit Product" : "Add Product"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {product ? "Update product details" : "Create a new product for your catalog"}
            </p>
          </div>
        </div>
        {product && (
          <>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
            <ConfirmModal
              open={showDeleteConfirm}
              title="Delete product"
              description="Are you sure you want to delete this product? This action cannot be undone."
              confirmText="Delete"
              onConfirm={() => {
                setShowDeleteConfirm(false);
                void handleDelete();
              }}
              onCancel={() => setShowDeleteConfirm(false)}
            />
          </>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <label htmlFor="product-name" className="block text-sm font-semibold text-gray-700">Product Name *</label>
            <input
              id="product-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="product-description" className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              id="product-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-price" className="block text-sm font-semibold text-gray-700">Price *</label>
              <input
                id="product-price"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="product-currency" className="block text-sm font-semibold text-gray-700">Currency</label>
              <div className="mt-1">
                <Select
                  id="product-currency"
                  value={formData.currency}
                  onChange={(value) => setFormData({ ...formData, currency: String(value) })}
                  options={[
                    { value: "NGN", label: "NGN" },
                    { value: "USD", label: "USD" },
                    { value: "GBP", label: "GBP" },
                    { value: "EUR", label: "EUR" },
                  ]}
                  searchable={false}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-category" className="block text-sm font-semibold text-gray-700">Category</label>
              <input
                id="product-category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Electronics, Clothing, etc."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="product-sku" className="block text-sm font-semibold text-gray-700">SKU (Optional)</label>
              <input
                id="product-sku"
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROD-001"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Negotiation Rules</h3>
            <p className="mt-1 text-xs text-gray-600">Controls what the AI can negotiate for this product.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="product-negotiation-mode" className="block text-sm font-semibold text-gray-700">Negotiation</label>
                <div className="mt-1">
                  <Select
                    id="product-negotiation-mode"
                    value={formData.negotiation_mode}
                    onChange={(value) => setFormData({ ...formData, negotiation_mode: value as any })}
                    options={[
                      { value: "default", label: "Use tenant default" },
                      { value: "disabled", label: "No negotiation (fixed price)" },
                      { value: "range", label: "Allow negotiation within a range" },
                    ]}
                    searchable={false}
                  />
                </div>
              </div>

              {formData.negotiation_mode === "range" && (
                <>
                  <div>
                    <label htmlFor="product-negotiation-min" className="block text-sm font-semibold text-gray-700">Min Price</label>
                    <input
                      id="product-negotiation-min"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.negotiation_min_price}
                      onChange={(e) => setFormData({ ...formData, negotiation_min_price: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="product-negotiation-max" className="block text-sm font-semibold text-gray-700">Max Price</label>
                    <input
                      id="product-negotiation-max"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.negotiation_max_price}
                      onChange={(e) => setFormData({ ...formData, negotiation_max_price: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-stock" className="block text-sm font-semibold text-gray-700">Stock Count</label>
              <input
                id="product-stock"
                type="number"
                min="-1"
                value={formData.stock_count}
                onChange={(e) => {
                  const next = e.target.value;
                  setFormData({
                    ...formData,
                    stock_count: next === "" ? -1 : Number.parseInt(next, 10) || -1,
                  });
                }}
                placeholder="Enter stock count or -1 for unlimited"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-gray-500">Use -1 for unlimited stock</p>
            </div>
            <div>
              <label htmlFor="product-availability" className="block text-sm font-semibold text-gray-700">Availability *</label>
              <div className="mt-1">
                <Select
                  id="product-availability"
                  value={formData.availability}
                  onChange={(value) => setFormData({ ...formData, availability: value as any })}
                  options={[
                    { value: "in_stock", label: "In Stock" },
                    { value: "out_of_stock", label: "Out of Stock" },
                    { value: "low_stock", label: "Low Stock" },
                  ]}
                  searchable={false}
                />
              </div>
            </div>
          </div>

          <VariantBuilder
            variants={formData.variants}
            onChange={(variants) => setFormData({ ...formData, variants })}
          />

          <ImageUploader
            images={formData.images}
            onChange={(images) => setFormData({ ...formData, images })}
            maxImages={10}
            label="Product Images"
          />

          <div>
            <label htmlFor="product-tags" className="block text-sm font-semibold text-gray-700">Tags (comma-separated)</label>
            <input
              id="product-tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="electronics, computers, laptops"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="product-is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="product-is-active" className="text-sm font-medium text-gray-700">
              Product is active (visible to customers)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Link
              href="/app/products"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50 sm:shadow-md"
            >
              {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
