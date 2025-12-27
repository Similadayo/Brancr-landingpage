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

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <label htmlFor="menu-item-name" className="block text-sm font-semibold text-gray-700">Name *</label>
            <input id="menu-item-name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700" />
          </div>

          <details className="group rounded-xl border border-gray-100 bg-gray-50 p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">Optional</summary>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="menu-item-description" className="block text-sm font-semibold text-gray-700">Description</label>
                <textarea id="menu-item-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="menu-item-price" className="block text-sm font-semibold text-gray-700">Price *</label>
                  <input id="menu-item-price" type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700" />
                </div>
                <div>
                  <label htmlFor="menu-item-currency" className="block text-sm font-semibold text-gray-700">Currency</label>
                  <div className="mt-1">
                    <Select id="menu-item-currency" value={formData.currency} onChange={(value) => setFormData({ ...formData, currency: String(value) })} options={[{ value: "NGN", label: "NGN" }, { value: "USD", label: "USD" }]} searchable={false} />
                  </div>
                </div>
              </div>
            </div>
          </details>

        </div>
      </form>
    </div>
  );
}
