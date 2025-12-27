'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "../../hooks/useProducts";
import { TrashIcon, ArrowLeftIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import VariantBuilder from "../shared/VariantBuilder";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage, parseApiFieldErrors } from '@/lib/error-messages';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const nextErrors: Record<string, string> = {};
    if (formData.negotiation_mode === 'range') {
      const min = formData.negotiation_min_price === '' ? NaN : Number(formData.negotiation_min_price);
      const max = formData.negotiation_max_price === '' ? NaN : Number(formData.negotiation_max_price);
      if (!Number.isFinite(min)) nextErrors.negotiation_min_price = 'Min price is required';
      else if (min <= 0) nextErrors.negotiation_min_price = 'Min price must be greater than 0';
      if (!Number.isFinite(max)) nextErrors.negotiation_max_price = 'Max price is required';
      else if (max <= 0) nextErrors.negotiation_max_price = 'Max price must be greater than 0';
      if (Number.isFinite(min) && Number.isFinite(max) && min > max) nextErrors.negotiation_min_price = 'Min must be less than or equal to Max';
    } else {
      // remove negotiation errors
      delete fieldErrors.negotiation_min_price;
      delete fieldErrors.negotiation_max_price;
    }
    setFieldErrors((prev) => {
      const base = Object.keys(prev).reduce((acc: Record<string, string>, k) => {
        if (!['negotiation_min_price', 'negotiation_max_price'].includes(k)) acc[k] = prev[k];
        return acc;
      }, {} as Record<string,string>);
      return { ...base, ...nextErrors };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.negotiation_mode, formData.negotiation_min_price, formData.negotiation_max_price]);

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
    } catch (error: any) {
      console.error("Form submission error:", error);
      if (error && error.status) {
        const fields = parseApiFieldErrors(error);
        if (Object.keys(fields).length) setFieldErrors((prev) => ({ ...prev, ...fields }));
        console.error('API error details:', { status: error.status, body: error.body });
        toast.error(getUserFriendlyErrorMessage(error, { action: product ? 'updating product' : 'creating product', resource: 'product' }));
      } else {
        toast.error('Failed to submit. Please try again.');
      }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-700 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
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
            <Link
              href="/app/products"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white transition hover:border-white/50 hover:bg-white/20"
              aria-label="Back to products"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {product ? "Edit Product" : "Add Product"}
              </h1>
              <p className="mt-1 text-sm text-white/90">
                {product ? "Update product details" : "Create a new product"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {product && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
          <ConfirmModal
            open={showDeleteConfirm}
            title="Delete product"
            description="Are you sure you want to delete this product? This action cannot be undone."
            confirmText="Delete"
            onConfirm={() => { setShowDeleteConfirm(false); void handleDelete(); }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
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
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="product-price" className="block text-sm font-semibold text-gray-700">Price</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
          </div>

          <div>
            <label htmlFor="product-currency" className="block text-sm font-semibold text-gray-700">Currency</label>
            <Select
              id="product-currency"
              value={formData.currency}
              onChange={(value) => setFormData({ ...formData, currency: value as any })}
              options={[{ value: 'NGN', label: 'NGN' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
              searchable={false}
            />
          </div>

          <div>
            <label htmlFor="product-sku" className="block text-sm font-semibold text-gray-700">SKU</label>
            <input
              id="product-sku"
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="product-stock" className="block text-sm font-semibold text-gray-700">Stock count</label>
            <input
              id="product-stock"
              type="number"
              value={String(formData.stock_count)}
              onChange={(e) => setFormData({ ...formData, stock_count: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="product-availability" className="block text-sm font-semibold text-gray-700">Availability</label>
            <Select
              id="product-availability"
              value={formData.availability}
              onChange={(value) => setFormData({ ...formData, availability: value as any })}
              options={[{ value: 'in_stock', label: 'In stock' }, { value: 'out_of_stock', label: 'Out of stock' }, { value: 'preorder', label: 'Preorder' }]}
              searchable={false}
            />
          </div>
        </div>

        <div>
          <label htmlFor="product-category" className="block text-sm font-semibold text-gray-700">Category</label>
          <input
            id="product-category"
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="product-tags" className="block text-sm font-semibold text-gray-700">Tags</label>
          <input
            id="product-tags"
            type="text"
            placeholder="comma-separated tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <details className="group rounded-xl border border-gray-100 bg-gray-50 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 flex items-center justify-between">
            <span>Optional</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
          </summary>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Images</label>
              <ImageUploader
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Variants</label>
              <VariantBuilder
                variants={formData.variants}
                onChange={(variants) => setFormData({ ...formData, variants })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Negotiation Rules</label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  id="negotiation-mode"
                  value={formData.negotiation_mode}
                  onChange={(value) => setFormData({ ...formData, negotiation_mode: value as any })}
                  options={[{ value: 'default', label: 'Default' }, { value: 'range', label: 'Range' }]}
                  searchable={false}
                />

                {formData.negotiation_mode === 'range' && (
                  <>
                    <input
                      type="number"
                      placeholder="Min price"
                      value={formData.negotiation_min_price}
                      onChange={(e) => setFormData({ ...formData, negotiation_min_price: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={formData.negotiation_max_price}
                      onChange={(e) => setFormData({ ...formData, negotiation_max_price: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </>
                )}
                {(fieldErrors.negotiation_min_price || fieldErrors.negotiation_max_price) && (
                  <p className="text-xs text-red-600">{fieldErrors.negotiation_min_price || fieldErrors.negotiation_max_price}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="product-active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-200 text-primary focus:ring-primary"
              />
              <label htmlFor="product-active" className="text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>
        </details>

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:opacity-60"
          >
            {isSubmitting ? (product ? 'Updating…' : 'Creating…') : (product ? 'Update product' : 'Create product')}
          </button>
        </div>
      </form>
    </div>
  );
}
