'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "../../hooks/useProducts";
import { TrashIcon, ArrowLeftIcon, SparklesIcon, XIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import VariantBuilder from "../shared/VariantBuilder";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage, parseApiFieldErrors } from '@/lib/error-messages';
import Link from "next/link";
import Select from "../ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';
import { useDraft, useAutoSaveDraft, useDeleteDraft, useDiscardDraft, parseDraftContent, DRAFT_KEYS } from "@/app/(tenant)/hooks/useDrafts";
import { useProductParser } from "@/app/(tenant)/hooks/useProductParser";
import { RequirementSelector } from "../requirements/RequirementSelector";
import { REQUIREMENT_TEMPLATES } from "../requirements/RequirementTemplates";

type ProductFormProps = {
  product?: Product | null;
};

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // AI Parsing
  const parser = useProductParser();
  const [showParseModal, setShowParseModal] = useState(false);
  const [parseInput, setParseInput] = useState("");
  const [parseMode, setParseMode] = useState<"text" | "file">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleParse = async () => {
    if (parseMode === "text") {
      if (!parseInput.trim()) return;
      const items = await parser.parse(parseInput);
      if (items && items.length > 0) {
        const item = items[0]; // Take the first parsed item
        console.log('[DEBUG] Parsed item from text:', item);
        console.log('[DEBUG] min_price:', item.min_price, 'max_price:', item.max_price);
        setFormData(prev => ({
          ...prev,
          name: item.name || prev.name,
          description: item.description || prev.description,
          price: item.price !== undefined ? String(item.price) : prev.price,
          currency: item.currency || prev.currency,
          category: item.category || prev.category,
          negotiation_mode: (item.min_price != null && item.max_price != null) ? 'range' : 'default',
          negotiation_min_price: item.min_price != null ? String(item.min_price) : prev.negotiation_min_price,
          negotiation_max_price: item.max_price != null ? String(item.max_price) : prev.negotiation_max_price,
          variants: item.variants || prev.variants,
        }));
        setShowParseModal(false);
        setParseInput("");
        toast.success("Details extracted!");
      } else {
        toast.error("Could not extract product details.");
      }
    } else {
      // File mode
      if (!selectedFile) return;
      const items = await parser.parseFile(selectedFile, "products");
      if (items && items.length > 0) {
        const item = items[0];
        setFormData(prev => ({
          ...prev,
          name: item.name || prev.name,
          description: item.description || prev.description,
          price: item.price !== undefined ? String(item.price) : prev.price,
          currency: item.currency || prev.currency,
          category: item.category || prev.category,
          negotiation_mode: (item.min_price != null && item.max_price != null) ? 'range' : 'default',
          negotiation_min_price: item.min_price != null ? String(item.min_price) : prev.negotiation_min_price,
          negotiation_max_price: item.max_price != null ? String(item.max_price) : prev.negotiation_max_price,
          variants: item.variants || prev.variants,
        }));
        setShowParseModal(false);
        setSelectedFile(null);
        setFilePreview(null);
        toast.success("Details extracted from image!");
      } else {
        toast.error("Could not extract details from file.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const { data: draft, isLoading: draftLoading } = useDraft(DRAFT_KEYS.PRODUCT_CREATE);
  const { discard } = useDiscardDraft(DRAFT_KEYS.PRODUCT_CREATE);

  // Only auto-save if creating a new product
  const isCreateMode = !product;

  const getInitialFormData = () => ({
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

  const [formData, setFormData] = useState(getInitialFormData());

  // Requirements Handling
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const hasInitializedDefaults = useRef(false);

  useEffect(() => {
    // Reset defaults check on id change
    hasInitializedDefaults.current = false;

    const loadRequirements = async () => {
      let currentIds: string[] = [];

      // 1. If valid ID, try to fetch existing requirements
      if (product?.id) {
        try {
          const res = await fetch(`/api/tenant/items/${product.id}/requirements`, { credentials: 'include' });
          const data = await res.json();
          currentIds = data.item_requirements?.map((ir: any) => ir.requirement_id) || [];
        } catch (err) {
          console.error('Failed to load item requirements', err);
        }
      }

      // 2. If we found existing requirements, set them and stop.
      if (currentIds.length > 0) {
        setSelectedReqIds(currentIds);
        return;
      }

      // 3. If NO requirements (New Item OR Existing Empty), apply Default Template
      // Only run this once per item view to prevent loops if user clears it
      if (!hasInitializedDefaults.current) {
        hasInitializedDefaults.current = true;
        console.log('[DEBUG] Applying default requirements (Delivery Essentials)...');

        try {
          const res = await fetch('/api/tenant/requirements', { credentials: 'include' });
          if (!res.ok) return;
          const data = await res.json();
          const existingReqs: any[] = data.requirements || [];

          // Fuzzy match existing
          const logistics = existingReqs.find(r =>
            r.label.toLowerCase().includes('logistics') ||
            r.label.toLowerCase().includes('delivery info') ||
            r.label.toLowerCase() === 'delivery essentials'
          );

          if (logistics) {
            setSelectedReqIds([logistics.id]);
          } else {
            // Create from Template
            const template = REQUIREMENT_TEMPLATES.find(t => t.id === 'delivery_essentials');
            if (template) {
              const newIds: string[] = [];
              for (const reqDef of template.requirements) {
                const match = existingReqs.find(r =>
                  r.label.toLowerCase() === reqDef.label.toLowerCase() &&
                  r.data_type === reqDef.data_type
                );

                if (match) {
                  newIds.push(match.id);
                } else {
                  const createRes = await fetch('/api/tenant/requirements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(reqDef)
                  });
                  if (createRes.ok) {
                    const newReq = await createRes.json();
                    // Handle both unwrapped and wrapped responses just in case
                    const id = newReq.id || newReq.requirement?.id;
                    if (id) newIds.push(id);
                  }
                }
              }
              if (newIds.length > 0) setSelectedReqIds(newIds);
            }
          }
        } catch (err) {
          console.error('Failed to setup default requirement', err);
        }
      } else {
        // If we already checked defaults and it's empty, keep it empty
        setSelectedReqIds([]);
      }
    };

    loadRequirements();
  }, [product?.id]);

  // Auto-save hook
  const { isSaving, draftId: autoSavedDraftId } = useAutoSaveDraft(DRAFT_KEYS.PRODUCT_CREATE, formData, isCreateMode && !draftLoading);

  // Restore draft
  useEffect(() => {
    if (isCreateMode && draft) {
      const content = parseDraftContent<typeof formData>(draft);
      if (content) {
        // Merge with defaults if needed, or just set
        setFormData((prev) => ({ ...prev, ...content }));
        toast.success("Draft restored");
      }
    }
  }, [isCreateMode, draft]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      }, {} as Record<string, string>);
      return { ...base, ...nextErrors };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.negotiation_mode, formData.negotiation_min_price, formData.negotiation_max_price]);

  const handleDiscardDraft = async () => {
    if (confirm("Are you sure you want to discard this draft? All changes will be lost.")) {
      await discard(draft?.id);
      setFormData(getInitialFormData());
      toast.success("Draft discarded");
    }
  };

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

      let targetProductId = product?.id;

      if (product) {
        await updateMutation.mutateAsync({ productId: product.id, payload });
        toast.success("Product updated successfully");
      } else {
        const newProduct = await createMutation.mutateAsync(payload);
        targetProductId = newProduct.product.id;
        // Clear draft
        await discard(autoSavedDraftId || draft?.id);
      }

      // Save Requirements
      if (targetProductId) {
        await fetch(`/api/tenant/items/${targetProductId}/requirements`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirement_ids: selectedReqIds }),
        });
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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
            {!product && (
              <div className="flex items-center gap-2">
                {draft && (
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 backdrop-blur-sm transition hover:bg-red-500/20 border border-red-500/20"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Discard Draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowParseModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 border border-white/20"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Parse from Text
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showParseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-primary" />
                Parse Product Details
              </h3>
              <button onClick={() => setShowParseModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setParseMode("text")}
                className={`pb-2 px-4 text-sm font-medium transition ${parseMode === "text" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                Paste Text
              </button>
              <button
                onClick={() => setParseMode("file")}
                className={`pb-2 px-4 text-sm font-medium transition ${parseMode === "file" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                Upload Image
              </button>
            </div>

            {parseMode === "text" ? (
              <>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  Paste your product details and AI will extract the structured data for you.
                </p>
                <textarea
                  value={parseInput}
                  onChange={(e) => setParseInput(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max 256GB - ₦1,500,000. Brand new in box."
                  className="w-full h-32 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-primary focus:ring-primary dark:bg-gray-900 dark:border-gray-700 dark:text-white resize-none"
                />
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  Upload an image of your product catalog and AI will extract the details.
                </p>

                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:hover:bg-gray-800">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedFile ? selectedFile.name : "Click to upload (JPG, PNG, WEBP)"}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>

                {/* Image Preview */}
                {filePreview && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={filePreview} alt="Preview" className="w-full h-48 object-cover" />
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowParseModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={parser.loading || (parseMode === "text" ? !parseInput.trim() : !selectedFile)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {parser.loading ? 'Parsing...' : 'Extract Data'}
              </button>
            </div>
          </div>
        </div>
      )}

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
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-6 dark:bg-gray-800 dark:border-gray-700">
        <div>
          <label htmlFor="product-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Product Name *</label>
          <input
            id="product-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="product-price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-dark-text-secondary">₦</span>
              <input
                id="product-price"
                type="text"
                inputMode="decimal"
                value={formData.price}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if ((val.match(/\./g) || []).length > 1) return;
                  setFormData({ ...formData, price: val });
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white pl-7 pr-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
              />
            </div>
            {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
          </div>

          <div>
            <label htmlFor="product-currency" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Currency</label>
            <Select
              id="product-currency"
              value={formData.currency}
              onChange={(value) => setFormData({ ...formData, currency: value as any })}
              options={[{ value: 'NGN', label: 'NGN' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
              searchable={false}
            />
          </div>

          <div>
            <label htmlFor="product-sku" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">SKU</label>
            <input
              id="product-sku"
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>

            <label htmlFor="product-stock" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Stock count</label>
            <div className="mt-1 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="stock-unlimited"
                  type="checkbox"
                  checked={formData.stock_count === -1}
                  onChange={(e) => setFormData({ ...formData, stock_count: e.target.checked ? -1 : 0 })}
                  className="h-4 w-4 rounded border-gray-200 text-primary focus:ring-primary dark:bg-gray-900 dark:border-gray-600 dark:focus:ring-offset-gray-900"
                />
                <label htmlFor="stock-unlimited" className="text-sm font-medium text-gray-700 dark:text-gray-300">Unlimited Stock</label>
              </div>
              {formData.stock_count !== -1 && (
                <div className="relative">
                  <input
                    id="product-stock"
                    type="text"
                    inputMode="numeric"
                    value={formData.stock_count}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, stock_count: Number(val) });
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
                    placeholder="Enter quantity..."
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-1">
                    <button type="button" onClick={() => setFormData(p => ({ ...p, stock_count: p.stock_count > 0 ? p.stock_count - 1 : 0 }))} className="p-1 px-2 hover:bg-gray-100 rounded text-gray-500">-</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, stock_count: p.stock_count + 1 }))} className="p-1 px-2 hover:bg-gray-100 rounded text-gray-500">+</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="product-availability" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Availability</label>
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
          <label htmlFor="product-category" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
          <input
            id="product-category"
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
          />
        </div>

        <div>
          <label htmlFor="product-tags" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tags</label>
          <input
            id="product-tags"
            type="text"
            placeholder="comma-separated tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
          />
        </div>

        <details className="group rounded-xl border border-gray-100 bg-gray-50 p-4 dark:bg-gray-800/50 dark:border-gray-700">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 flex items-center justify-between dark:text-white">
            <span>Optional</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
          </summary>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Images</label>
              <ImageUploader
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Variants</label>
              <VariantBuilder
                variants={formData.variants}
                onChange={(variants) => setFormData({ ...formData, variants })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Negotiation Rules</label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  id="negotiation-mode"
                  value={formData.negotiation_mode}
                  onChange={(value) => setFormData({ ...formData, negotiation_mode: value as any })}
                  options={[
                    { value: 'default', label: 'Default' },
                    { value: 'fixed', label: 'No Negotiation (Fixed)' },
                    { value: 'range', label: 'Range' }
                  ]}
                  searchable={false}
                />

                {formData.negotiation_mode === 'range' && (
                  <>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-dark-text-secondary">₦</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Min price"
                        value={formData.negotiation_min_price}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          if ((val.match(/\./g) || []).length > 1) return;
                          setFormData({ ...formData, negotiation_min_price: val });
                        }}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white pl-7 pr-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-dark-text-secondary">₦</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Max price"
                        value={formData.negotiation_max_price}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          if ((val.match(/\./g) || []).length > 1) return;
                          setFormData({ ...formData, negotiation_max_price: val });
                        }}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white pl-7 pr-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-primary/40"
                      />
                    </div>
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
                className="h-4 w-4 rounded border-gray-200 text-primary focus:ring-primary dark:bg-gray-900 dark:border-gray-600 dark:focus:ring-offset-gray-900"
              />
              <label htmlFor="product-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
            </div>

            <div className="border-t border-gray-100 pt-6 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Customer Requirements</h3>
              <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                Information you need from the customer after they pay for this product.
              </p>
              <RequirementSelector
                selectedIds={selectedReqIds}
                onChange={setSelectedReqIds}
              />
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
