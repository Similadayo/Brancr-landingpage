'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTemplates, useCreateTemplate } from "@/app/(tenant)/hooks/useTemplates";
import Select from "@/app/(tenant)/components/ui/Select";

const CATEGORIES = [
  "Onboarding",
  "Transactional",
  "Marketing",
  "Notifications",
  "Support",
  "Promotional",
];

const PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "tiktok", name: "TikTok" },
  { id: "telegram", name: "Telegram" },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template'); // For editing from templates list
  
  const { data: templates = [] } = useTemplates();
  const createMutation = useCreateTemplate();

  const [formData, setFormData] = useState({
    name: "",
    category: CATEGORIES[0],
    description: "",
    body: "",
    platforms: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // If template ID is provided, load template data (for future edit functionality)
  useEffect(() => {
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setFormData({
          name: template.name,
          category: template.category,
          description: template.description || "",
          body: template.body,
          platforms: template.platforms,
        });
      }
    }
  }, [templateId, templates]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    }

    if (!formData.body.trim()) {
      newErrors.body = "Template body is required";
    }

    if (formData.platforms.length === 0) {
      newErrors.platforms = "Please select at least one platform";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim() || undefined,
        body: formData.body.trim(),
        platforms: formData.platforms,
      });

      // Redirect to templates list on success
      router.push("/app/templates");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }));
    // Clear error when platform is selected
    if (errors.platforms && formData.platforms.length === 0) {
      setErrors((prev) => ({ ...prev, platforms: "" }));
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Create Template</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Create a reusable message template for your campaigns across multiple platforms.
          </p>
        </div>
        <Link
          href="/app/templates"
          className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary"
        >
          ← Back to Templates
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
          <div className="space-y-6">
            {/* Template Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
                Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g., Welcome Message, Order Confirmation"
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 ${
                  errors.name
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-gray-200 focus:border-primary focus:ring-primary/20"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-900">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="mt-2">
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(value) => setFormData((prev) => ({ ...prev, category: value || prev.category }))}
                  options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                  searchable={false}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                Description <span className="text-xs font-normal text-gray-500">(optional)</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of when and how to use this template..."
                rows={3}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Template Body */}
            <div>
              <label htmlFor="body" className="block text-sm font-semibold text-gray-900">
                Template Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="body"
                value={formData.body}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, body: e.target.value }));
                  if (errors.body) setErrors((prev) => ({ ...prev, body: "" }));
                }}
                placeholder="Enter your message template here. You can use variables like {{name}}, {{order_id}}, etc."
                rows={8}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 ${
                  errors.body
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-gray-200 focus:border-primary focus:ring-primary/20"
                }`}
              />
              {errors.body && <p className="mt-1 text-xs text-rose-600">{errors.body}</p>}
              <p className="mt-2 text-xs text-gray-500">
                Supports variable placeholders like <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{"{{name}}"}</code>, <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{"{{order_id}}"}</code>
              </p>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Platforms <span className="text-rose-500">*</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Select the platforms where this template will be available</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {PLATFORMS.map((platform) => {
                  const isSelected = formData.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`rounded-xl border-2 p-4 text-center transition ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isSelected ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-semibold">{platform.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.platforms && <p className="mt-2 text-xs text-rose-600">{errors.platforms}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                Create Template
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
          <Link
            href="/app/templates"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

