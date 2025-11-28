'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function BusinessSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => tenantApi.onboardingStatus(),
  });

  const [form, setForm] = useState({
    name: "",
    industry: "",
    description: "",
    location: "",
    website: "",
    operating_hours: "",
  });

  const updateMutation = useMutation({
    mutationFn: () => tenantApi.updateBusinessProfile({
      name: form.name,
      industry: form.industry,
      description: form.description,
      location: form.location,
      website: form.website || undefined,
      operating_hours: form.operating_hours || undefined,
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

  // Prefill when data arrives
  const profile = data?.business_profile;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Business Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your business information and profile.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { key: "name", label: "Business name", placeholder: profile?.name || "Your company name" },
              { key: "industry", label: "Industry", placeholder: profile?.industry || "Retail, Restaurant, Services..." },
              { key: "location", label: "Location", placeholder: profile?.location || "City, Country" },
              { key: "website", label: "Website", placeholder: profile?.website || "https://example.com" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-semibold text-gray-900">{f.label}</label>
                <input
                  defaultValue={(profile as any)?.[f.key] || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900">Operating hours</label>
              <input
                defaultValue={profile?.operating_hours || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, operating_hours: e.target.value }))}
                placeholder="Mon-Fri 9am-5pm, Sat 10am-2pm"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900">Description</label>
              <textarea
                defaultValue={profile?.description || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={5}
                placeholder="Tell us about your business..."
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}


