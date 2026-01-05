'use client';

import { useState, useEffect } from "react";
// Using a small local toggle instead of @headlessui/react to avoid extra dependency
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";

export default function PersonaSettingsPage() {
  // AI Mode is controlled from the header toggle. Show current mode as read-only here.
  const { data: aiModeData } = useQuery({
    queryKey: ["ai_mode"],
    queryFn: () => tenantApi.getAIMode(),
  });
  const aiMode = (aiModeData?.mode || 'ai') as 'ai' | 'human';
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

  const TONE_OPTIONS = ["friendly", "professional", "casual", "witty", "formal", "playful"];
  const [selectedTones, setSelectedTones] = useState<string[]>([]);

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

  // Initialize selected tones from persona when loaded
  useEffect(() => {
    if (persona?.tone) {
      const parts = persona.tone.split(",").map((s: string) => s.trim()).filter(Boolean);
      setSelectedTones(parts);
      setForm((p) => ({ ...p, tone: parts.join(', ') }));
    }
  }, [persona?.tone]);

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[80px] lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6">

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h2>
            <p className="text-sm text-gray-700">The AI assistant toggle has been moved to the workspace header for quick access. Use the header toggle to enable or disable AI features for this tenant.</p>
            <p className="mt-3 text-sm text-gray-600">Current: <span className="font-medium text-gray-900">{aiMode === 'ai' ? 'AI (enabled)' : 'Human (disabled)'}</span></p>
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TONE_OPTIONS.map((opt) => {
                      const active = selectedTones.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSelectedTones((prev) => {
                              const next = prev.includes(opt) ? prev.filter((p) => p !== opt) : [...prev, opt];
                              setForm((p) => ({ ...p, tone: next.join(', ') }));
                              return next;
                            });
                          }}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition ${active ? 'bg-primary text-white dark:bg-white dark:text-gray-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Select at least two tones to guide the assistant.</p>
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
                  disabled={updateMutation.isPending || selectedTones.length < 2}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:opacity-50 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
                >
                  {updateMutation.isPending ? "Saving..." : (selectedTones.length < 2 ? 'Select at least 2 tones' : 'Save changes')}
                </button>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Test Persona</h2>
            <p className="mt-2 text-xs text-gray-500">Coming soon: try sample prompts and see how your assistant responds.</p>
          </section>
        </div>
      </div>
    </div>

  );
}


