'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateService, useUpdateService, useDeleteService, type Service } from "../../hooks/useServices";
import { XIcon, TrashIcon, ArrowLeftIcon } from "../icons";
import PackageBuilder from "../shared/PackageBuilder";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage, parseApiFieldErrors } from '@/lib/error-messages';
import Link from "next/link";
import Select from "../ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';

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
    negotiation_mode: service?.negotiation_mode || "default",
    negotiation_min_price: service?.negotiation_min_price !== undefined ? String(service.negotiation_min_price) : "",
    negotiation_max_price: service?.negotiation_max_price !== undefined ? String(service.negotiation_max_price) : "",
    pricing_type: service?.pricing.type || "hourly",
    pricing_rate: service?.pricing.rate !== undefined ? String(service.pricing.rate) : "",
    pricing_amount: (service?.pricing as any)?.amount !== undefined ? String((service?.pricing as any)?.amount) : "",
    duration: service?.duration || "",
    category: service?.category || "",
    deliverables: service?.deliverables || [],
    packages: (service?.packages || []).map((p: any) => ({ ...p, price: p?.price !== undefined ? String(p.price) : "" })),
    is_active: service?.is_active ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        negotiation_mode: service.negotiation_mode || "default",
        negotiation_min_price: service.negotiation_min_price !== undefined ? String(service.negotiation_min_price) : "",
        negotiation_max_price: service.negotiation_max_price !== undefined ? String(service.negotiation_max_price) : "",
        pricing_type: service.pricing.type || "hourly",
        pricing_rate: service.pricing.rate !== undefined ? String(service.pricing.rate) : "",
        pricing_amount: (service.pricing as any)?.amount !== undefined ? String((service.pricing as any)?.amount) : "",
        duration: service.duration || "",
        category: service.category || "",
        deliverables: service.deliverables || [],
        packages: (service.packages || []).map((p: any) => ({ ...p, price: p?.price !== undefined ? String(p.price) : "" })),
        is_active: service.is_active ?? true,
      });
    }
  }, [service]);

  // Client-side validation for negotiation fields
  useEffect(() => {
    const nextErrors: Record<string, string> = {};
    if (formData.negotiation_mode === 'range') {
      const min = formData.negotiation_min_price === '' ? NaN : Number(formData.negotiation_min_price);
      const max = formData.negotiation_max_price === '' ? NaN : Number(formData.negotiation_max_price);
      if (!Number.isFinite(min)) nextErrors.negotiation_min_price = 'Min price is required';
      else if (min <= 0) nextErrors.negotiation_min_price = 'Min price must be greater than 0';
      if (!Number.isFinite(max)) nextErrors.negotiation_max_price = 'Max price is required';
      else if (max <= 0) nextErrors.negotiation_max_price = 'Max price must be greater than 0';
      if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
        nextErrors.negotiation_min_price = 'Min must be less than or equal to Max';
      }
    }

    setFieldErrors((prev) => {
      // If negotiation mode is not range, remove any negotiation-specific errors but keep others
      if (formData.negotiation_mode !== 'range') {
        const { negotiation_min_price, negotiation_max_price, ...rest } = prev;
        return rest;
      }

      // In range mode, merge existing server-side errors with client-side validation errors,
      // allowing client-side validation to override the same keys when present.
      return { ...prev, ...nextErrors };
    });
  }, [formData.negotiation_mode, formData.negotiation_min_price, formData.negotiation_max_price]);

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
      const parsedRate = formData.pricing_rate === "" ? undefined : Number(formData.pricing_rate);
      const parsedAmount = formData.pricing_amount === "" ? undefined : Number(formData.pricing_amount);

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

      const parsedPackages = (formData.packages || []).map((p: any) => ({
        ...p,
        price: p?.price === "" || p?.price === undefined ? 0 : Number(p.price),
      }));

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        negotiation_mode: formData.negotiation_mode,
        negotiation_min_price: formData.negotiation_mode === "range" ? (negotiationMin as number) : undefined,
        negotiation_max_price: formData.negotiation_mode === "range" ? (negotiationMax as number) : undefined,
        pricing: {
          type: formData.pricing_type as "hourly" | "fixed" | "package",
          rate: formData.pricing_type === "hourly" && Number.isFinite(parsedRate as number) ? (parsedRate as number) : undefined,
          amount: formData.pricing_type === "fixed" && Number.isFinite(parsedAmount as number) ? (parsedAmount as number) : undefined,
        },
        packages: parsedPackages.length > 0 ? parsedPackages : undefined,
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
    } catch (error: any) {
      console.error("Form submission error:", error);
      if (error && error.status) {
        const fields = parseApiFieldErrors(error);
        if (Object.keys(fields).length) setFieldErrors((prev) => ({ ...prev, ...fields }));
        console.error('API error details:', { status: error.status, body: error.body });
        toast.error(getUserFriendlyErrorMessage(error, { action: service ? 'updating service' : 'creating service', resource: 'service' }));
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!service) return;
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
              title="Delete service"
              description="Are you sure you want to delete this service? This action cannot be undone."
              confirmText="Delete"
              onConfirm={() => { setShowDeleteConfirm(false); void handleDelete(); }}
              onCancel={() => setShowDeleteConfirm(false)}
            />
          </>
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
              <div className="mt-1">
                <Select
                  id="service-pricing-type"
                  value={formData.pricing_type}
                  onChange={(value) => setFormData({ ...formData, pricing_type: value as any })}
                  options={[
                    { value: "hourly", label: "Hourly" },
                    { value: "fixed", label: "Fixed" },
                    { value: "package", label: "Package" },
                  ]}
                  searchable={false}
                />
              </div>
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
                  onChange={(e) => setFormData({ ...formData, pricing_rate: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, pricing_amount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Negotiation Rules</h3>
            <p className="mt-1 text-xs text-gray-600">Controls what the AI can negotiate for this service.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="service-negotiation-mode" className="block text-sm font-semibold text-gray-700">Negotiation</label>
                <div className="mt-1">
                  <Select
                    id="service-negotiation-mode"
                    value={formData.negotiation_mode}
                    onChange={(value) => {
                      const mode = value as any;
                      const next = { ...formData, negotiation_mode: mode };
                      if (mode !== 'range') {
                        next.negotiation_min_price = '';
                        next.negotiation_max_price = '';
                      }
                      setFormData(next);
                    }}
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
                    <label htmlFor="service-negotiation-min" className="block text-sm font-semibold text-gray-700">Min Price</label>
                    <input
                      id="service-negotiation-min"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.negotiation_min_price}
                      onChange={(e) => setFormData({ ...formData, negotiation_min_price: e.target.value })}
                      aria-invalid={!!fieldErrors.negotiation_min_price}
                      aria-describedby={fieldErrors.negotiation_min_price ? 'service-neg-min-error' : undefined}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {fieldErrors.negotiation_min_price && (
                      <p id="service-neg-min-error" className="mt-1 text-xs text-rose-600">{fieldErrors.negotiation_min_price}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="service-negotiation-max" className="block text-sm font-semibold text-gray-700">Max Price</label>
                    <input
                      id="service-negotiation-max"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.negotiation_max_price}
                      onChange={(e) => setFormData({ ...formData, negotiation_max_price: e.target.value })}
                      aria-invalid={!!fieldErrors.negotiation_max_price}
                      aria-describedby={fieldErrors.negotiation_max_price ? 'service-neg-max-error' : undefined}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {fieldErrors.negotiation_max_price && (
                      <p id="service-neg-max-error" className="mt-1 text-xs text-rose-600">{fieldErrors.negotiation_max_price}</p>
                    )}
                  </div>
                </>
              )}
            </div>
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
              disabled={isSubmitting || Object.keys(fieldErrors).length > 0}
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
