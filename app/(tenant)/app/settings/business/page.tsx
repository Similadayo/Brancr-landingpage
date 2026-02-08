'use client';

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi, ApiError, DeliveryConfig } from "@/lib/api";
import { toast } from "react-hot-toast";
import { PlusIcon, TrashIcon } from "@/app/(tenant)/components/icons";

export default function BusinessSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => tenantApi.onboardingStatus(),
  });

  const [form, setForm] = useState<{
    name: string;
    industry: string;
    description: string;
    location: string;
    website: string;
    operating_hours: string;
    delivery_config: DeliveryConfig;
  }>({
    name: "",
    industry: "",
    description: "",
    location: "",
    website: "",
    operating_hours: "",
    delivery_config: {
      delivery_enabled: false,
      pickup_enabled: false,
      payment_methods: [],
      delivery_areas: [],
    },
  });

  useEffect(() => {
    if (data?.business_profile) {
      const profile = data.business_profile;
      setForm({
        name: profile.name || "",
        industry: profile.industry || "",
        description: profile.description || "",
        location: profile.location || "",
        website: profile.website || "",
        operating_hours: profile.operating_hours || "",
        delivery_config: profile.delivery_config || {
          delivery_enabled: false,
          pickup_enabled: false,
          payment_methods: [],
          delivery_areas: [],
        },
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () => tenantApi.updateBusinessProfile({
      name: form.name,
      industry: form.industry,
      description: form.description,
      location: form.location,
      website: form.website || undefined,
      operating_hours: form.operating_hours || undefined,
      delivery_config: form.delivery_config,
    }),
    onSuccess: () => {
      toast.success("Business profile updated");
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update profile");
    },
  });

  const handleDeliveryConfigChange = (key: keyof DeliveryConfig, value: any) => {
    setForm(prev => ({
      ...prev,
      delivery_config: {
        ...prev.delivery_config,
        [key]: value
      }
    }));
  };

  const togglePaymentMethod = (method: string) => {
    setForm(prev => {
      const current = prev.delivery_config.payment_methods || [];
      const updated = current.includes(method)
        ? current.filter(m => m !== method)
        : [...current, method];
      return {
        ...prev,
        delivery_config: {
          ...prev.delivery_config,
          payment_methods: updated
        }
      };
    });
  };

  const addDeliveryArea = () => {
    setForm(prev => ({
      ...prev,
      delivery_config: {
        ...prev.delivery_config,
        delivery_areas: [
          ...(prev.delivery_config.delivery_areas || []),
          { name: "", price: 0 }
        ]
      }
    }));
  };

  const removeDeliveryArea = (index: number) => {
    setForm(prev => ({
      ...prev,
      delivery_config: {
        ...prev.delivery_config,
        delivery_areas: prev.delivery_config.delivery_areas.filter((_, i) => i !== index)
      }
    }));
  };

  const updateDeliveryArea = (index: number, field: "name" | "price", value: string | number) => {
    setForm(prev => {
      const newAreas = [...(prev.delivery_config.delivery_areas || [])];
      newAreas[index] = { ...newAreas[index], [field]: value };
      return {
        ...prev,
        delivery_config: {
          ...prev.delivery_config,
          delivery_areas: newAreas
        }
      };
    });
  };

  // Prefill when data arrives
  const profile = data?.business_profile;

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[80px] lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-text-primary lg:text-4xl">Business Settings</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">Manage your business information and profile.</p>
            </div>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column: Basic Info */}
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface space-y-5 h-fit">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Basic Information</h2>
                <div className="space-y-4">
                  {[
                    { key: "name", label: "Business name", placeholder: "Your company name" },
                    { key: "industry", label: "Industry", placeholder: "Retail, Restaurant, Services..." },
                    { key: "location", label: "Location", placeholder: "City, Country" },
                    { key: "website", label: "Website", placeholder: "https://example.com" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text-primary">{f.label}</label>
                      <input
                        value={(form as any)[f.key]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary dark:placeholder-dark-text-secondary"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text-primary">Operating hours</label>
                    <input
                      value={form.operating_hours}
                      onChange={(e) => setForm((prev) => ({ ...prev, operating_hours: e.target.value }))}
                      placeholder="Mon-Fri 9am-5pm, Sat 10am-2pm"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary dark:placeholder-dark-text-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text-primary">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Tell us about your business..."
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary dark:placeholder-dark-text-secondary"
                    />
                  </div>
                </div>
              </section>

              {/* Right Column: Delivery & Payment */}
              <div className="space-y-6">
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface space-y-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Delivery & Payment</h2>

                  {/* Fulfillment Methods */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.delivery_config.delivery_enabled}
                        onChange={(e) => handleDeliveryConfigChange('delivery_enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-gray-900 dark:text-dark-text-primary">Enable Delivery</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.delivery_config.pickup_enabled}
                        onChange={(e) => handleDeliveryConfigChange('pickup_enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-gray-900 dark:text-dark-text-primary">Enable Pickup</span>
                    </label>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-3">Accepted Payment Methods</label>
                    <div className="grid gap-3">
                      {[
                        { id: 'bank_transfer', label: 'Bank Transfer' },
                        { id: 'pod', label: 'Pay on Delivery / Cash' },
                        { id: 'card', label: 'Card Payment (Online)' },
                      ].map((method) => (
                        <label key={method.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.delivery_config.payment_methods?.includes(method.id)}
                            onChange={() => togglePaymentMethod(method.id)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="font-medium text-gray-900 dark:text-dark-text-primary">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Default Delivery Fee */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                      Default Delivery Fee
                      <span className="ml-1 font-normal text-gray-500">(for areas not listed below)</span>
                    </label>
                    <div className="relative w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-dark-text-secondary">₦</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.delivery_config.default_delivery_fee || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          handleDeliveryConfigChange('default_delivery_fee', parseInt(val) || 0);
                        }}
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 pl-7 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-dark-text-secondary">
                      This fee applies when the customer&apos;s address doesn&apos;t match any delivery area below
                    </p>
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Delivery Areas</h2>
                    <button
                      onClick={addDeliveryArea}
                      type="button"
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Area
                    </button>
                  </div>

                  {(!form.delivery_config.delivery_areas || form.delivery_config.delivery_areas.length === 0) ? (
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary italic">No delivery areas configured.</p>
                  ) : (
                    <div className="space-y-3">
                      {form.delivery_config.delivery_areas.map((area, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-1 space-y-1">
                            <input
                              value={area.name}
                              onChange={(e) => updateDeliveryArea(index, 'name', e.target.value)}
                              placeholder="Area Name (e.g. Lekki)"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
                            />
                          </div>
                          <div className="w-36 space-y-1">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-dark-text-secondary">₦</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={area.price || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  updateDeliveryArea(index, 'price', parseInt(val) || 0);
                                }}
                                placeholder="0"
                                className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeDeliveryArea(index)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove area"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


