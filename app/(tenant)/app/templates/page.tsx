'use client';

import { useState } from "react";
import Link from "next/link";
import { useTemplates, useDeleteTemplate } from "@/app/(tenant)/hooks/useTemplates";
import ConfirmModal from '@/app/components/ConfirmModal';

export default function TemplatesPage() {
  const { data: templatesData, isLoading, error } = useTemplates();
  const templates = Array.isArray(templatesData) ? templatesData : [];
  const deleteMutation = useDeleteTemplate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showDeleteTemplateId, setShowDeleteTemplateId] = useState<string | null>(null);
  const [showDeleteTemplateName, setShowDeleteTemplateName] = useState<string | null>(null);

  const handleDelete = async (templateId: string) => {
    setDeletingId(templateId);
    try {
      await deleteMutation.mutateAsync(templateId);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setDeletingId(null);
    }
  };

  const requestDelete = (templateId: string, templateName: string) => {
    setShowDeleteTemplateId(templateId);
    setShowDeleteTemplateName(templateName);
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
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Message Templates</h1>
              <p className="mt-2 text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                Pre-approved message templates for WhatsApp Business and other platforms.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/templates/new"
                className="btn-primary w-full sm:w-auto justify-center"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Template
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-900">Failed to load templates</p>
          <p className="mt-2 text-xs text-rose-700">{error.message}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-sm font-semibold text-gray-900">No templates yet</p>
          <p className="mt-2 text-xs text-gray-600">Create your first template to get started.</p>
          <Link
            href="/app/templates/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/90 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Create Template
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className="mt-2 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {template.category}
                  </span>
                </div>
                <>
                  <button
                    type="button"
                    onClick={() => requestDelete(template.id, template.name)}
                    disabled={deletingId === template.id || deleteMutation.isPending}
                    className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                    title="Delete template"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <ConfirmModal
                    open={!!showDeleteTemplateId}
                    title={`Delete template`}
                    description={`Are you sure you want to delete "${showDeleteTemplateName}"? This cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={() => {
                      if (showDeleteTemplateId) {
                        void handleDelete(showDeleteTemplateId);
                      }
                      setShowDeleteTemplateId(null);
                      setShowDeleteTemplateName(null);
                    }}
                    onCancel={() => { setShowDeleteTemplateId(null); setShowDeleteTemplateName(null); }}
                  />
                </>
              </div>
              {template.description && (
                <p className="mt-4 text-sm text-gray-600">{template.description}</p>
              )}
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Template Body</p>
                <p className="mt-2 line-clamp-3 text-sm text-gray-700">{template.body}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.isArray(template.platforms) ? template.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 capitalize"
                  >
                    {platform}
                  </span>
                )) : (
                  <span className="text-xs text-gray-400">No platforms</span>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-gray-500">{template.uses ?? 0} uses</p>
                <Link
                  href={`/app/campaigns/new?template=${template.id}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                >
                  Use Template
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

