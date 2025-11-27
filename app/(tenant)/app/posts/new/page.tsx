'use client';

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { tenantApi } from "@/lib/api";
import MediaUploader, { type UploadedMedia } from "@/app/(tenant)/components/posting/MediaUploader";
import MediaSelector from "@/app/(tenant)/components/posting/MediaSelector";
import CaptionEditor from "@/app/(tenant)/components/posting/CaptionEditor";
import PlatformSelector from "@/app/(tenant)/components/posting/PlatformSelector";
import SchedulePicker from "@/app/(tenant)/components/posting/SchedulePicker";
import PostReview from "@/app/(tenant)/components/posting/PostReview";

type Step = "upload" | "media" | "caption" | "platforms" | "schedule" | "review";

const STEPS: Step[] = ["upload", "media", "caption", "platforms", "schedule", "review"];
const STEP_LABELS = ["Upload", "Media", "Caption", "Platforms", "Schedule", "Review"];

export default function NewPostPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // State
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const currentStepIndex = STEPS.indexOf(step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Validation
  const canNext = useMemo(() => {
    switch (step) {
      case "upload":
        return true; // Can proceed even without uploading
      case "media":
        return true; // Media is optional (Facebook supports text-only)
      case "caption":
        return true; // Caption is optional (can be empty)
      case "platforms":
        return selectedPlatforms.length > 0;
      case "schedule":
        return true; // Can publish now (scheduledAt can be null)
      case "review":
        // Must have either media or Facebook (which supports text-only)
        const hasFacebook = selectedPlatforms.includes("facebook");
        return selectedMediaIds.length > 0 || hasFacebook;
      default:
        return false;
    }
  }, [step, selectedMediaIds, selectedPlatforms]);

  // Handlers
  const handleUploadComplete = useCallback((media: UploadedMedia[]) => {
    setUploadedMedia((prev) => [...prev, ...media]);
    // Auto-select newly uploaded media
    const newIds = media.map((m) => m.id);
    setSelectedMediaIds((prev) => [...prev, ...newIds]);
  }, []);

  const handleGenerateCaption = useCallback(async () => {
    if (selectedMediaIds.length === 0) {
      toast.error("Please select media first");
      return;
    }

    try {
      setIsGeneratingCaption(true);
      const res = await tenantApi.generateCaption({
        media_asset_ids: selectedMediaIds,
        include_hashtags: true,
      });
      setCaption(res.caption || "");
      setIsAIGenerated(true);
      toast.success("Caption generated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate caption");
    } finally {
      setIsGeneratingCaption(false);
    }
  }, [selectedMediaIds]);

  const handlePublish = useCallback(async () => {
    if (!canNext) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate schedule
      if (scheduledAt) {
        const scheduleDate = new Date(scheduledAt);
        if (scheduleDate < new Date()) {
          toast.error("Cannot schedule posts in the past");
          setIsSubmitting(false);
          return;
        }
      }

      const name = caption.split("\n")[0]?.slice(0, 50) || "Scheduled Post";
      const scheduledAtISO = scheduledAt || new Date().toISOString();

      await tenantApi.createPost({
        name,
        caption: caption.trim(),
        media_asset_ids: selectedMediaIds,
        platforms: selectedPlatforms,
        scheduled_at: scheduledAtISO,
      });

      toast.success(scheduledAt ? "Post scheduled successfully!" : "Post published successfully!");
      router.push("/app/campaigns");
    } catch (error: any) {
      toast.error(error.message || "Failed to publish post");
    } finally {
      setIsSubmitting(false);
    }
  }, [canNext, caption, selectedMediaIds, selectedPlatforms, scheduledAt, router]);

  const handleEdit = useCallback((editStep: "media" | "caption" | "platforms" | "schedule") => {
    setStep(editStep);
  }, []);

  const handleNext = useCallback(() => {
    if (!canNext) {
      toast.error("Please complete this step before continuing");
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex]);
    }
  }, [canNext, currentStepIndex]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const handleCancel = useCallback(() => {
    if (confirm("Are you sure you want to cancel? Your progress will be lost.")) {
      router.push("/app/campaigns");
    }
  }, [router]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Create Post</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Step {currentStepIndex + 1} of {STEPS.length}: {STEP_LABELS[currentStepIndex]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300"
          >
            Cancel
          </button>
          <Link
            href="/app/campaigns"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            ← Back to Campaigns
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-6 gap-2">
        {STEP_LABELS.map((label, idx) => {
          const stepKey = STEPS[idx];
          const isActive = step === stepKey;
          const isCompleted = idx < currentStepIndex;
          return (
            <div
              key={stepKey}
              className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold transition ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : isCompleted
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {step === "upload" && (
          <MediaUploader
            onUploadComplete={handleUploadComplete}
            maxFiles={10}
            maxFileSize={50}
          />
        )}

        {step === "media" && (
          <MediaSelector
            selectedMediaIds={selectedMediaIds}
            onSelectionChange={setSelectedMediaIds}
            uploadedMedia={uploadedMedia}
          />
        )}

        {step === "caption" && (
          <CaptionEditor
            value={caption}
            onChange={setCaption}
            onAIGenerate={handleGenerateCaption}
            isAIGenerating={isGeneratingCaption}
            selectedMediaIds={selectedMediaIds}
            isAIGenerated={isAIGenerated}
          />
        )}

        {step === "platforms" && (
          <PlatformSelector
            selectedPlatforms={selectedPlatforms}
            onSelectionChange={setSelectedPlatforms}
          />
        )}

        {step === "schedule" && (
          <SchedulePicker
            value={scheduledAt}
            onChange={setScheduledAt}
            selectedPlatforms={selectedPlatforms}
          />
        )}

        {step === "review" && (
          <PostReview
            selectedMediaIds={selectedMediaIds}
            caption={caption}
            selectedPlatforms={selectedPlatforms}
            scheduledAt={scheduledAt}
            onEdit={handleEdit}
            onPublish={handlePublish}
            isPublishing={isSubmitting}
          />
        )}
      </div>

      {/* Navigation */}
      {step !== "review" && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
