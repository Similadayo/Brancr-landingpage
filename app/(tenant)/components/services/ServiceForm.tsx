'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateService, useUpdateService, useDeleteService, type Service } from "../../hooks/useServices";
import { XIcon, TrashIcon, ArrowLeftIcon } from "../icons";
import PackageBuilder from "../shared/PackageBuilder";
import { toast } from "react-hot-toast";
import Link from "next/link";

type ServiceFormProps = {
  service?: Service | null;
};

export default function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    pricing_type: service?.pricing.type || "hourly",
    pricing_rate: service?.pricing.rate || 0,
    pricing_amount: (service?.pricing as any)?.amount || 0,
    duration: service?.duration || "",
    category: service?.category || "",
    deliverables: service?.deliverables || [],
    packages: service?.packages || [],
    is_active: service?.is_active ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        pricing_type: service.pricing.type || "hourly",
        pricing_rate: service.pricing.rate || 0,
        pricing_amount: (service.pricing as any)?.amount || 0,
        duration: service.duration || "",
        category: service.category || "",
        deliverables: service.deliverables || [],
        packages: service.packages || [],
        is_active: service.is_active ?? true,
      });
    }
  }, [service]);

  const addDeliverable = (deliverable: string) => {
    if (!deliverable.trim()) return;
    const deliverables = formData.deliverables || [];
    if (deliverables.includes(deliverable.trim())) return;
    setFormData({ ...formData, deliverables: [...deliverables, deliverable.trim()] });
  };

  const removeDeliverable = (deliverable: string) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((d) => d !== deliverable),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        pricing: {
          type: formData.pricing_type as "hourly" | "fixed" | "package",
          rate: formData.pricing_type === "hourly" ? formData.pricing_rate : undefined,
          amount: formData.pricing_type === "fixed" ? formData.pricing_amount : undefined,
        },
        packages: formData.packages.length > 0 ? formData.packages : undefined,
        duration: formData.duration || undefined,
        category: formData.category || undefined,
        deliverables: formData.deliverables.length > 0 ? formData.deliverables : undefined,
        is_active: formData.is_active,
      };

      if (service) {
        await updateMutation.mutateAsync({ serviceId: service.id, payload });
        toast.success("Service updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Service created successfully");
      }
      router.push("/app/services");
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      await deleteMutation.mutateAsync(service.id);
      toast.success("Service deleted successfully");
      router.push("/app/services");
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
            href="/app/services"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              {service ? "Edit Service" : "Add Service"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {service ? "Update service details" : "Create a new service offering"}
            </p>
          </div>
        </div>
        {service && (
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
            <label htmlFor="service-name" className="block text-sm font-semibold text-gray-700">Service Name *</label>
            <input
              id="service-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="service-description" className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              id="service-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="service-pricing-type" className="block text-sm font-semibold text-gray-700">Pricing Type *</label>
              <select
                id="service-pricing-type"
                value={formData.pricing_type}
                onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as "hourly" | "fixed" | "package" })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed</option>
                <option value="package">Package</option>
              </select>
            </div>
            {formData.pricing_type === "hourly" && (
              <div>
                <label htmlFor="service-rate" className="block text-sm font-semibold text-gray-700">Rate (NGN/hour) *</label>
                <input
                  id="service-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing_rate}
                  onChange={(e) => setFormData({ ...formData, pricing_rate: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            {formData.pricing_type === "fixed" && (
              <div>
                <label htmlFor="service-amount" className="block text-sm font-semibold text-gray-700">Amount (NGN) *</label>
                <input
                  id="service-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing_amount}
                  onChange={(e) => setFormData({ ...formData, pricing_amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </div>

          {formData.pricing_type === "package" && (
            <PackageBuilder
              packages={formData.packages}
              onChange={(packages) => setFormData({ ...formData, packages })}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="service-duration" className="block text-sm font-semibold text-gray-700">Duration</label>
              <input
                id="service-duration"
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="1 hour, 2 weeks..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="service-category" className="block text-sm font-semibold text-gray-700">Category</label>
              <input
                id="service-category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deliverables</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {formData.deliverables.map((del) => (
                <span
                  key={del}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {del}
                  <button
                    type="button"
                    onClick={() => removeDeliverable(del)}
                    className="text-primary hover:text-red-600 transition"
                    aria-label={`Remove ${del}`}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add deliverable..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    addDeliverable(input.value);
                    input.value = '';
                  }
                }}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input) {
                    addDeliverable(input.value);
                    input.value = '';
                  }
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="service-is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="service-is-active" className="text-sm font-medium text-gray-700">
              Service is active (visible to customers)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Link
              href="/app/services"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50 sm:shadow-md"
            >
              {isSubmitting ? "Saving..." : service ? "Update Service" : "Create Service"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
