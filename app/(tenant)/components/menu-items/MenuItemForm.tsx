'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, type MenuItem } from "../../hooks/useMenuItems";
import { XIcon, TrashIcon, ArrowLeftIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage, parseApiFieldErrors } from '@/lib/error-messages';
import Link from "next/link";
import Select from "../ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/menu-items"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              {item ? "Edit Menu Item" : "Add Menu Item"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {item ? "Update menu item details" : "Create a new menu item for your restaurant"}
            </p>
          </div>
        </div>
        {item && (
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
              title="Delete menu item"
              description="Are you sure you want to delete this menu item? This action cannot be undone."
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
            <label htmlFor="menu-item-name" className="block text-sm font-semibold text-gray-700">Name *</label>
            <input
              id="menu-item-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="menu-item-description" className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              id="menu-item-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="menu-item-price" className="block text-sm font-semibold text-gray-700">Price *</label>
              <input
                id="menu-item-price"
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
              <label htmlFor="menu-item-currency" className="block text-sm font-semibold text-gray-700">Currency</label>
              <div className="mt-1">
                <Select
                  id="menu-item-currency"
                  value={formData.currency}
                  onChange={(value) => setFormData({ ...formData, currency: String(value) })}
                  options={[
                    { value: "NGN", label: "NGN" },
                    { value: "USD", label: "USD" },
                  ]}
                  searchable={false}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="menu-item-category" className="block text-sm font-semibold text-gray-700">Category *</label>
              <div className="mt-1">
                <Select
                  id="menu-item-category"
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: String(value) })}
                  options={[
                    { value: "", label: "Select Category" },
                    { value: "Appetizer", label: "Appetizer" },
                    { value: "Main Course", label: "Main Course" },
                    { value: "Dessert", label: "Dessert" },
                    { value: "Drink", label: "Drink" },
                    { value: "Side", label: "Side" },
                    { value: "Beverage", label: "Beverage" },
                  ]}
                  searchable={false}
                />
              </div>
            </div>
            <div>
              <label htmlFor="menu-item-prep-time" className="block text-sm font-semibold text-gray-700">Preparation Time (minutes)</label>
              <input
                id="menu-item-prep-time"
                type="number"
                min="0"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Negotiation Rules</h3>
            <p className="mt-1 text-xs text-gray-600">Controls what the AI can negotiate for this menu item.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="menu-item-negotiation-mode" className="block text-sm font-semibold text-gray-700">Negotiation</label>
                <div className="mt-1">
                  <Select
                    id="menu-item-negotiation-mode"
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
                    <label htmlFor="menu-item-negotiation-min" className="block text-sm font-semibold text-gray-700">Min Price</label>
                    <input
                      id="menu-item-negotiation-min"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.negotiation_min_price}
                      onChange={(e) => setFormData({ ...formData, negotiation_min_price: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="menu-item-negotiation-max" className="block text-sm font-semibold text-gray-700">Max Price</label>
                    <input
                      id="menu-item-negotiation-max"
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
              <label htmlFor="menu-item-spice" className="block text-sm font-semibold text-gray-700">Spice Level</label>
              <div className="mt-1">
                <Select
                  id="menu-item-spice"
                  value={formData.spice_level}
                  onChange={(value) => setFormData({ ...formData, spice_level: value as any })}
                  options={[
                    { value: "mild", label: "None / Mild" },
                    { value: "medium", label: "Medium" },
                    { value: "hot", label: "Hot" },
                    { value: "very_hot", label: "Extra Hot" },
                  ]}
                  searchable={false}
                />
              </div>
            </div>
            <div>
              <label htmlFor="menu-item-availability" className="block text-sm font-semibold text-gray-700">Availability *</label>
              <div className="mt-1">
                <Select
                  id="menu-item-availability"
                  value={formData.availability}
                  onChange={(value) => setFormData({ ...formData, availability: value as any })}
                  options={[
                    { value: "available", label: "Available" },
                    { value: "unavailable", label: "Unavailable" },
                    { value: "limited", label: "Limited" },
                  ]}
                  searchable={false}
                />
              </div>
            </div>
          </div>

          {/* Dietary Information */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dietary Information</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {DIETARY_OPTIONS.map((diet) => (
                <label key={diet} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dietary_info.includes(diet)}
                    onChange={() => toggleDietaryInfo(diet)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{diet}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <ImageUploader
            images={formData.images}
            onChange={(images) => setFormData({ ...formData, images })}
            maxImages={10}
            label="Menu Item Images"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="menu-item-is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="menu-item-is-active" className="text-sm font-medium text-gray-700">
              Menu item is active (visible to customers)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Link
              href="/app/menu-items"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50 sm:shadow-md"
            >
              {isSubmitting ? "Saving..." : item ? "Update Menu Item" : "Create Menu Item"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
