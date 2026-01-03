'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, type MenuItem } from "../../hooks/useMenuItems";
import { TrashIcon, ArrowLeftIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage, parseApiFieldErrors } from '@/lib/error-messages';
import Link from "next/link";
import Select from "../ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';
import { useDraft, useAutoSaveDraft, useDeleteDraft, parseDraftContent, DRAFT_KEYS } from "@/app/(tenant)/hooks/useDrafts";

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut-free',
  'Halal',
  'Kosher',
] as const;

type MenuItemFormProps = {
  item?: MenuItem | null;
};

export default function MenuItemForm({ item }: MenuItemFormProps) {
  const router = useRouter();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const { data: draft, isLoading: draftLoading } = useDraft(DRAFT_KEYS.MENU_ITEM_CREATE);
  const deleteDraft = useDeleteDraft();

  // Only auto-save if creating a new item
  const isCreateMode = !item;

  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price !== undefined ? String(item.price) : "",
    currency: item?.currency || "NGN",
    category: item?.category || "",
    negotiation_mode: item?.negotiation_mode || "default",
    negotiation_min_price: item?.negotiation_min_price !== undefined ? String(item.negotiation_min_price) : "",
    negotiation_max_price: item?.negotiation_max_price !== undefined ? String(item.negotiation_max_price) : "",
    preparation_time: item?.preparation_time !== undefined ? String(item.preparation_time) : "",
    dietary_info: item?.dietary_info || [],
    spice_level: item?.spice_level || "mild",
    availability: item?.availability || "available",
    is_active: item?.is_active ?? true,
    images: item?.images || [],
  });

  // Auto-save hook
  const { isSaving } = useAutoSaveDraft(DRAFT_KEYS.MENU_ITEM_CREATE, formData, isCreateMode && !draftLoading);

  // Restore draft
  useEffect(() => {
    if (isCreateMode && draft) {
      const content = parseDraftContent<typeof formData>(draft);
      if (content) {
        setFormData((prev) => ({ ...prev, ...content }));
        toast.success("Draft restored");
      }
    }
  }, [isCreateMode, draft]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price !== undefined ? String(item.price) : "",
        currency: item.currency || "NGN",
        category: item.category || "",
        negotiation_mode: item.negotiation_mode || "default",
        negotiation_min_price: item.negotiation_min_price !== undefined ? String(item.negotiation_min_price) : "",
        negotiation_max_price: item.negotiation_max_price !== undefined ? String(item.negotiation_max_price) : "",
        preparation_time: item.preparation_time !== undefined ? String(item.preparation_time) : "",
        dietary_info: item.dietary_info || [],
        spice_level: item.spice_level || "mild",
        availability: item.availability || "available",
        is_active: item.is_active ?? true,
        images: item.images || [],
      });
    }
  }, [item]);

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
    }

    setFieldErrors((prev) => {
      if (formData.negotiation_mode !== 'range') {
        const { negotiation_min_price, negotiation_max_price, ...rest } = prev;
        return rest;
      }
      return { ...prev, ...nextErrors };
    });
  }, [formData.negotiation_mode, formData.negotiation_min_price, formData.negotiation_max_price]);

  const toggleDietaryInfo = (diet: string) => {
    setFormData({
      ...formData,
      dietary_info: formData.dietary_info.includes(diet)
        ? formData.dietary_info.filter((d) => d !== diet)
        : [...formData.dietary_info, diet],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedPrice = Number(formData.price);
      const parsedPrep = formData.preparation_time === "" ? undefined : Number.parseInt(formData.preparation_time, 10);

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
        preparation_time: Number.isFinite(parsedPrep as number) ? (parsedPrep as number) : undefined,
        dietary_info: formData.dietary_info.length > 0 ? formData.dietary_info : undefined,
        spice_level: formData.spice_level,
        availability: formData.availability,
        is_active: formData.is_active,
        images: formData.images.length > 0 ? formData.images : undefined,
      };

      if (item) {
        await updateMutation.mutateAsync({ menuItemId: item.id, payload });
        toast.success("Menu item updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Menu item created successfully");
        if (draft?.id) deleteDraft.mutate(draft.id);
      }
      router.push("/app/menu-items");
    } catch (error: any) {
      console.error("Form submission error:", error);
      if (error && error.status) {
        const fields = parseApiFieldErrors(error);
        if (Object.keys(fields).length) setFieldErrors((prev) => ({ ...prev, ...fields }));
        console.error('API error details:', { status: error.status, body: error.body });
        toast.error(getUserFriendlyErrorMessage(error, { action: item ? 'updating menu item' : 'creating menu item', resource: 'menu item' }));
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success("Menu item deleted successfully");
      router.push("/app/menu-items");
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
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/app/menu-items"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white transition hover:border-white/50 hover:bg-white/20"
              aria-label="Back to menu items"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {item ? "Edit Menu Item" : "Add Menu Item"}
              </h1>
              <p className="mt-1 text-sm text-white/90">
                {item ? "Update menu item details" : "Create a new menu item for your restaurant"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {item && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
          <ConfirmModal
            open={showDeleteConfirm}
            title="Delete menu item"
            description="Are you sure you want to delete this menu item? This action cannot be undone."
            confirmText="Delete"
            onConfirm={() => { setShowDeleteConfirm(false); void handleDelete(); }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        {/* Primary Fields - always visible */}
        <div className="space-y-4">
          <div>
            <label htmlFor="menu-item-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Menu Item Name *</label>
            <input
              id="menu-item-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="menu-item-price" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Price *</label>
              <input
                id="menu-item-price"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              />
              {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
            </div>
            <div>
              <label htmlFor="menu-item-currency" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Currency</label>
              <div className="mt-1">
                <Select
                  id="menu-item-currency"
                  value={formData.currency}
                  onChange={(value) => setFormData({ ...formData, currency: String(value) })}
                  options={[{ value: "NGN", label: "NGN" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }]}
                  searchable={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional - collapsed by default */}
        <details className="group rounded-xl border border-gray-100 bg-gray-50 p-4 mt-6 dark:bg-gray-900 dark:border-gray-700">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-white">Optional</summary>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="menu-item-description" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Description</label>
              <textarea
                id="menu-item-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="menu-item-category" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Category</label>
                <input
                  id="menu-item-category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Appetizers, Main Course"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="menu-item-prep-time" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Prep Time (minutes)</label>
                <input
                  id="menu-item-prep-time"
                  type="number"
                  min="0"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  placeholder="e.g., 15"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="menu-item-spice" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Spice Level</label>
                <div className="mt-1">
                  <Select
                    id="menu-item-spice"
                    value={formData.spice_level}
                    onChange={(value) => setFormData({ ...formData, spice_level: value as any })}
                    options={[
                      { value: "none", label: "None" },
                      { value: "mild", label: "Mild" },
                      { value: "medium", label: "Medium" },
                      { value: "hot", label: "Hot" },
                      { value: "extra_hot", label: "Extra Hot" },
                    ]}
                    searchable={false}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="menu-item-availability" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Availability</label>
                <div className="mt-1">
                  <Select
                    id="menu-item-availability"
                    value={formData.availability}
                    onChange={(value) => setFormData({ ...formData, availability: value as any })}
                    options={[
                      { value: "available", label: "Available" },
                      { value: "sold_out", label: "Sold Out" },
                      { value: "seasonal", label: "Seasonal" },
                    ]}
                    searchable={false}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Dietary Information</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((diet) => (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => toggleDietaryInfo(diet)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${formData.dietary_info.includes(diet)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Images</label>
              <ImageUploader
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
              />
            </div>
          </div>
        </details>

        {/* Active checkbox and submit */}
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            id="menu-item-is-active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="menu-item-is-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Menu item is active (visible to customers)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <Link
            href="/app/menu-items"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-primary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || Object.keys(fieldErrors).length > 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50 sm:shadow-md"
          >
            {isSubmitting ? "Saving..." : item ? "Update Menu Item" : "Create Menu Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
