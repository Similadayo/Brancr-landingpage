'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "../../hooks/useProducts";
import { TrashIcon, ArrowLeftIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import VariantBuilder from "../shared/VariantBuilder";
import { toast } from "react-hot-toast";
import Link from "next/link";

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
    price: product?.price || 0,
    currency: product?.currency || "NGN",
    category: product?.category || "",
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
        price: product.price || 0,
        currency: product.currency || "NGN",
        category: product.category || "",
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
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        currency: formData.currency,
        category: formData.category || undefined,
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

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

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
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
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
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="product-currency" className="block text-sm font-semibold text-gray-700">Currency</label>
              <select
                id="product-currency"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-stock" className="block text-sm font-semibold text-gray-700">Stock Count</label>
              <input
                id="product-stock"
                type="number"
                min="-1"
                value={formData.stock_count}
                onChange={(e) => setFormData({ ...formData, stock_count: parseInt(e.target.value) || -1 })}
                placeholder="Enter stock count or -1 for unlimited"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-gray-500">Use -1 for unlimited stock</p>
            </div>
            <div>
              <label htmlFor="product-availability" className="block text-sm font-semibold text-gray-700">Availability *</label>
              <select
                id="product-availability"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="low_stock">Low Stock</option>
              </select>
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
