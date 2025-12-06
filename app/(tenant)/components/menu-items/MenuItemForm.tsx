'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, type MenuItem } from "../../hooks/useMenuItems";
import { XIcon, TrashIcon, ArrowLeftIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import { toast } from "react-hot-toast";
import Link from "next/link";

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
    price: item?.price || 0,
    currency: item?.currency || "NGN",
    category: item?.category || "",
    preparation_time: item?.preparation_time || 0,
    dietary_info: item?.dietary_info || [],
    spice_level: item?.spice_level || "mild",
    availability: item?.availability || "available",
    is_active: item?.is_active ?? true,
    images: item?.images || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        currency: item.currency || "NGN",
        category: item.category || "",
        preparation_time: item.preparation_time || 0,
        dietary_info: item.dietary_info || [],
        spice_level: item.spice_level || "mild",
        availability: item.availability || "available",
        is_active: item.is_active ?? true,
        images: item.images || [],
      });
    }
  }, [item]);

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
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        currency: formData.currency,
        category: formData.category || undefined,
        preparation_time: formData.preparation_time || undefined,
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
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm("Are you sure you want to delete this menu item?")) return;

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
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="menu-item-currency" className="block text-sm font-semibold text-gray-700">Currency</label>
              <select
                id="menu-item-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="menu-item-category" className="block text-sm font-semibold text-gray-700">Category *</label>
              <select
                id="menu-item-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Category</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Main Course">Main Course</option>
                <option value="Dessert">Dessert</option>
                <option value="Drink">Drink</option>
                <option value="Side">Side</option>
                <option value="Beverage">Beverage</option>
              </select>
            </div>
            <div>
              <label htmlFor="menu-item-prep-time" className="block text-sm font-semibold text-gray-700">Preparation Time (minutes)</label>
              <input
                id="menu-item-prep-time"
                type="number"
                min="0"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="menu-item-spice" className="block text-sm font-semibold text-gray-700">Spice Level</label>
              <select
                id="menu-item-spice"
                value={formData.spice_level}
                onChange={(e) => setFormData({ ...formData, spice_level: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="mild">None / Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
                <option value="very_hot">Extra Hot</option>
              </select>
            </div>
            <div>
              <label htmlFor="menu-item-availability" className="block text-sm font-semibold text-gray-700">Availability *</label>
              <select
                id="menu-item-availability"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="limited">Limited</option>
              </select>
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
