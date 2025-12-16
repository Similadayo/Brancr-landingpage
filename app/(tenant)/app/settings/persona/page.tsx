'use client';

import { useState } from "react";
// Using a small local toggle instead of @headlessui/react to avoid extra dependency
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function PersonaSettingsPage() {
    // AI Mode state and API
    const { data: aiModeData, isLoading: isLoadingAIMode } = useQuery({
      queryKey: ["ai_mode"],
      queryFn: () => tenantApi.getAIMode(),
    });
    const aiMode = aiModeData?.mode || 'ai';
    const [pendingAIMode, setPendingAIMode] = useState<'ai' | 'human'>(aiMode);
    const updateAIModeMutation = useMutation({
      mutationFn: (mode: 'ai' | 'human') => tenantApi.updateAIMode(mode),
      onSuccess: (data) => {
        toast.success(`AI mode set to ${data.mode === 'ai' ? 'AI (enabled)' : 'Human (disabled)'}`);
        void queryClient.invalidateQueries({ queryKey: ["ai_mode"] });
      },
      onError: (err) => {
        toast.error('Failed to update AI mode');
      },
    });
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => tenantApi.onboardingStatus(),
  });

  const persona = data?.persona;
  const [form, setForm] = useState({
    bot_name: "",
    tone: "",
    language: "",
    humor: false,
    style_notes: "",
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      tenantApi.updatePersona({
        bot_name: form.bot_name || persona?.bot_name || "",
        tone: form.tone || persona?.tone || "",
        language: form.language || persona?.language || "English",
        humor: form.humor ?? persona?.humor ?? false,
        style_notes: form.style_notes || persona?.style_notes || "",
      }),
    onSuccess: () => {
      toast.success("Persona updated");
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update persona");
    },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              const next = pendingAIMode === 'ai' ? 'human' : 'ai';
              setPendingAIMode(next);
              updateAIModeMutation.mutate(next);
            }}
            className={`${pendingAIMode === 'ai' ? 'bg-primary' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            disabled={updateAIModeMutation.isPending || isLoadingAIMode}
            aria-pressed={pendingAIMode === 'ai' ? 'true' : 'false'}
          >
            <span className="sr-only">Toggle AI Assistant</span>
            <span
              className={`${pendingAIMode === 'ai' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {pendingAIMode === 'ai' ? 'AI (enabled) — captions, suggestions, and AI replies may be used.' : 'Human (disabled) — AI features are turned off for this tenant.'}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Turning off AI prevents automated caption generation and AI responses. Admins can override in /admin.<br />
          {aiModeData?.updated_at && aiModeData?.updated_by && (
            <span className="block mt-1 text-[11px] text-gray-400">Last changed: {new Date(aiModeData.updated_at).toLocaleString()} by {aiModeData.updated_by}</span>
          )}
        </p>
      </section>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">AI Persona</h1>
          <p className="mt-2 text-sm text-gray-600">Configure your assistant’s voice and style.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Bot name</label>
              <input
                defaultValue={persona?.bot_name || ""}
                onChange={(e) => setForm((p) => ({ ...p, bot_name: e.target.value }))}
                placeholder="Luna, Alex, or your custom name"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Tone</label>
              <input
                defaultValue={persona?.tone || ""}
                onChange={(e) => setForm((p) => ({ ...p, tone: e.target.value }))}
                placeholder="friendly, professional, casual, witty"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Language</label>
              <input
                defaultValue={persona?.language || "English"}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                placeholder="English"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="humor"
                type="checkbox"
                defaultChecked={!!persona?.humor}
                onChange={(e) => setForm((p) => ({ ...p, humor: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <label htmlFor="humor" className="text-sm font-semibold text-gray-900">
                Include humor
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900">Style notes</label>
              <textarea
                defaultValue={persona?.style_notes || ""}
                onChange={(e) => setForm((p) => ({ ...p, style_notes: e.target.value }))}
                rows={5}
                placeholder="Additional guidance for the assistant..."
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

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Test Persona</h2>
        <p className="mt-2 text-xs text-gray-500">Coming soon: try sample prompts and see how your assistant responds.</p>
      </section>
    </div>
  );
}


