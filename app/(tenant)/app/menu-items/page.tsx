'use client';

import { useState, useMemo } from "react";
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, type MenuItem } from "../../hooks/useMenuItems";
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

export default function MenuItemsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: items = [], isLoading, error } = useMenuItems({
    search: query || undefined,
    category: category || undefined,
  });

  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [items]);

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} menu item(s)?`)) {
      selectedIds.forEach((id) => deleteMutation.mutate(id));
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Menu Items</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your restaurant menu</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => {
              setEditingItem(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items..."
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

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
          <XIcon className="mx-auto h-12 w-12 text-rose-400" />
          <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load menu items</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">No menu items found</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`relative rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div className="absolute left-2 top-2 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                  {isSelected ? (
                    <CheckCircleIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                    {item.category && <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>}
                  </div>

                  {item.description && <p className="mb-3 line-clamp-2 text-sm text-gray-600">{item.description}</p>}

                  <div className="mb-3">
                    <p className="text-lg font-bold text-gray-900">
                      {item.currency} {item.price.toLocaleString()}
                    </p>
                    {item.preparation_time && (
                      <p className="text-xs text-gray-500">⏱️ {item.preparation_time} min</p>
                    )}
                    {item.spice_level && (
                      <p className="text-xs text-gray-500">🌶️ {item.spice_level}</p>
                    )}
                  </div>

                  {item.dietary_info && item.dietary_info.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {item.dietary_info.slice(0, 3).map((info) => (
                        <span
                          key={info}
                          className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                        >
                          {info}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsCreateModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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

      {(isCreateModalOpen || editingItem) && (
        <MenuItemFormModal
          item={editingItem}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingItem(null);
          }}
          onCreate={createMutation.mutateAsync}
          onUpdate={(payload) => editingItem && updateMutation.mutateAsync({ menuItemId: editingItem.id, payload })}
        />
      )}
    </div>
  );
}

function MenuItemFormModal({
  item,
  onClose,
  onCreate,
  onUpdate,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onCreate: (payload: any) => Promise<any>;
  onUpdate: (payload: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || 0,
    currency: item?.currency || "NGN",
    category: item?.category || "",
    preparation_time: item?.preparation_time || 0,
    dietary_info: item?.dietary_info?.join(", ") || "",
    spice_level: item?.spice_level || "mild",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        dietary_info: formData.dietary_info ? formData.dietary_info.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };

      if (item) {
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
          <h2 className="text-lg font-semibold text-gray-900">{item ? "Edit Menu Item" : "Add Menu Item"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Name *</label>
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
                placeholder="Main, Appetizer, Dessert..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Preparation Time (minutes)</label>
              <input
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
              <label className="block text-sm font-semibold text-gray-700">Spice Level</label>
              <select
                value={formData.spice_level}
                onChange={(e) => setFormData({ ...formData, spice_level: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
                <option value="very_hot">Very Hot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Dietary Info (comma-separated)</label>
              <input
                type="text"
                value={formData.dietary_info}
                onChange={(e) => setFormData({ ...formData, dietary_info: e.target.value })}
                placeholder="vegetarian, gluten-free"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
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
              {isSubmitting ? "Saving..." : item ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

