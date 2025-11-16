'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMedia } from "@/app/(tenant)/hooks/useMedia";
import { tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

type Step = "media" | "caption" | "platforms" | "schedule" | "review";

export default function NewPostPage() {
  const [step, setStep] = useState<Step>("media");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: assets = [], isLoading } = useMedia();
  const [suggestions, setSuggestions] = useState<Array<{ at: string; score: number }>>([]);

  const canNext = useMemo(() => {
    if (step === "media") return selectedMedia.length > 0;
    if (step === "caption") return caption.trim().length > 0;
    if (step === "platforms") return platforms.length > 0;
    if (step === "schedule") return !!scheduledAt;
    return true;
  }, [step, selectedMedia, caption, platforms, scheduledAt]);

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleGenerateCaption() {
    try {
      setIsGenerating(true);
      const res = await tenantApi.generateCaption({ media_asset_ids: selectedMedia, include_hashtags: true });
      setCaption(res.caption || "");
    } catch (e) {
      toast.error("Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      // Convert local datetime to ISO
      const local = new Date(scheduledAt);
      const iso = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
      const name = caption.split("\n")[0]?.slice(0, 50) || "Scheduled Post";
      await tenantApi.createPost({
        name,
        caption: caption.trim(),
        media_asset_ids: selectedMedia,
        platforms,
        scheduled_at: iso,
      });
      toast.success("Post scheduled");
      window.location.href = "/app/campaigns";
    } catch (e) {
      toast.error("Failed to schedule post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Create Post</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">Upload media, write a caption, choose platforms, and schedule.</p>
        </div>
        <Link href="/app/campaigns" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary">
          ← Back to Campaigns
        </Link>
      </header>

      {/* Stepper */}
      <div className="grid grid-cols-5 gap-2">
        {["Media", "Caption", "Platforms", "Schedule", "Review"].map((label, idx) => {
          const active = ["media", "caption", "platforms", "schedule", "review"][idx] === step;
          return (
            <div key={label} className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold ${active ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-600"}`}>
              {label}
            </div>
          );
        })}
      </div>

      {/* Steps */}
      {step === "media" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Select media</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {assets.map((a) => {
                const selected = selectedMedia.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() =>
                      setSelectedMedia((prev) => (prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]))
                    }
                    className={`relative overflow-hidden rounded-2xl border ${selected ? "border-primary ring-2 ring-primary/30" : "border-gray-200"} bg-white`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.thumbnail_url || a.url} alt="media" className="aspect-video w-full object-cover" />
                    {selected ? (
                      <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                        Selected
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {step === "caption" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Write caption</h2>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={8}
            placeholder="Write your caption... Use hashtags, mentions, etc."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleGenerateCaption()}
              disabled={isGenerating || selectedMedia.length === 0}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "AI Generate"}
            </button>
            <span className="text-xs text-gray-500">{caption.length} chars</span>
          </div>
        </section>
      )}

      {step === "platforms" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Select platforms</h2>
          <div className="flex flex-wrap gap-2">
            {["instagram", "facebook", "whatsapp", "tiktok", "telegram"].map((p) => {
              const selected = platforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${selected ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-700 hover:border-primary hover:text-primary"}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === "schedule" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-gray-500">Saved in your local timezone.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const date =
                    (scheduledAt && scheduledAt.split("T")[0]) ||
                    new Date().toISOString().slice(0, 10);
                  const res = await tenantApi.optimalTimes({ platforms, date });
                  setSuggestions(res.times || []);
                } catch {
                  setSuggestions([]);
                }
              }}
              disabled={platforms.length === 0}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary disabled:opacity-50"
            >
              Suggest optimal times
            </button>
            {suggestions.length > 0 ? (
              <span className="text-xs text-gray-500">{suggestions.length} suggestions</span>
            ) : null}
          </div>
          {suggestions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.slice(0, 6).map((s) => {
                const d = new Date(s.at);
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                const val = local.toISOString().slice(0, 16);
                return (
                  <button
                    key={s.at}
                    onClick={() => setScheduledAt(val)}
                    title={`Score: ${s.score}`}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20"
                  >
                    {local.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
      )}

      {step === "review" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Review</h2>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-900">Platforms</p>
            <p className="text-xs text-gray-600">{platforms.join(", ")}</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">Schedule</p>
            <p className="text-xs text-gray-600">{scheduledAt || "Not set"}</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">Caption</p>
            <p className="whitespace-pre-line text-sm text-gray-700">{caption}</p>
          </div>
        </section>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setStep((prev) => (prev === "media" ? "media" : (["media", "caption", "platforms", "schedule", "review"] as Step[])[(["media", "caption", "platforms", "schedule", "review"] as Step[]).indexOf(prev) - 1]))
          }
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
        >
          Back
        </button>
        {step !== "review" ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() =>
              setStep((prev) => (["media", "caption", "platforms", "schedule"].includes(prev) ? (["caption", "platforms", "schedule", "review"] as Step[])[(["media", "caption", "platforms", "schedule"] as Step[]).indexOf(prev)] : "review"))
            }
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Post"}
          </button>
        )}
      </div>
    </div>
  );
}


