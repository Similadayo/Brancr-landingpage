'use client';

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import MediaUploader, { type UploadedMedia } from "@/app/(tenant)/components/posting/MediaUploader";
import MediaSelector from "@/app/(tenant)/components/posting/MediaSelector";
import CaptionEditor from "@/app/(tenant)/components/posting/CaptionEditor";
import PlatformSelector from "@/app/(tenant)/components/posting/PlatformSelector";
import SchedulePicker from "@/app/(tenant)/components/posting/SchedulePicker";
import PostReview from "@/app/(tenant)/components/posting/PostReview";
import TikTokOptions from "@/app/(tenant)/components/posting/TikTokOptions";

type Step = "upload" | "media" | "caption" | "platforms" | "schedule" | "review";

const STEPS: Step[] = ["upload", "media", "caption", "platforms", "schedule", "review"];
const STEP_LABELS: Record<Step, string> = {
  upload: "Upload Media",
  media: "Select Media",
  caption: "Write Caption",
  platforms: "Choose Platforms",
  schedule: "Schedule",
  review: "Review & Publish",
};

export default function NewPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<{
    status: "idle" | "publishing" | "success" | "error";
    platformResults?: Record<string, "success" | "error">;
    error?: string;
  }>({ status: "idle" });

  // State
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  
  // TikTok-specific options
  const [tiktokDisableDuet, setTiktokDisableDuet] = useState(false);
  const [tiktokDisableStitch, setTiktokDisableStitch] = useState(false);
  const [tiktokDisableComment, setTiktokDisableComment] = useState(false);
  const [tiktokScheduleTime, setTiktokScheduleTime] = useState<string | null>(null);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      uploadedMedia,
      selectedMediaIds,
      caption,
      isAIGenerated,
      selectedPlatforms,
      scheduledAt,
      step,
    };
    localStorage.setItem("post-draft", JSON.stringify(draft));
  }, [uploadedMedia, selectedMediaIds, caption, isAIGenerated, selectedPlatforms, scheduledAt, step]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("post-draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.selectedMediaIds) setSelectedMediaIds(draft.selectedMediaIds);
        if (draft.caption) setCaption(draft.caption);
        if (draft.isAIGenerated) setIsAIGenerated(draft.isAIGenerated);
        if (draft.selectedPlatforms) setSelectedPlatforms(draft.selectedPlatforms);
        if (draft.scheduledAt) setScheduledAt(draft.scheduledAt);
        if (draft.step) setStep(draft.step);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const currentStepIndex = STEPS.indexOf(step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
  const currentStepLabel = STEP_LABELS[step];

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
      // Convert media IDs from strings to numbers
      const mediaIds = selectedMediaIds.map((id) => Number(id)).filter((id) => !isNaN(id));
      const res = await tenantApi.generateCaption({
        media_ids: mediaIds,
        include_hashtags: true,
      });
      setCaption(res.caption || "");
      setIsAIGenerated(true);
      toast.success("Caption generated successfully");
    } catch (error: any) {
      const errorMessage = error?.body?.message || error?.message || "Failed to generate caption";
      toast.error(errorMessage);
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

      // Convert media IDs from strings to numbers
      const mediaIds = selectedMediaIds.map((id) => Number(id)).filter((id) => !isNaN(id));

      // Prepare payload
      const payload: {
        media_ids: number[];
        platforms: string[];
        scheduled_at?: string | null;
        caption?: string;
        name?: string;
        tiktok_disable_duet?: boolean;
        tiktok_disable_stitch?: boolean;
        tiktok_disable_comment?: boolean;
        tiktok_schedule_time?: string;
      } = {
        media_ids: mediaIds,
        platforms: selectedPlatforms,
      };

      // Add optional fields
      if (caption.trim()) {
        payload.caption = caption.trim();
      }

      // Handle scheduling
      if (scheduledAt) {
        // Convert local datetime to ISO string (RFC3339)
        const local = new Date(scheduledAt);
        payload.scheduled_at = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
      } else {
        // Publish immediately
        payload.scheduled_at = "now";
      }

      // Add optional name
      if (caption.trim()) {
        payload.name = caption.split("\n")[0]?.slice(0, 50) || "Post";
      }

      // Add TikTok-specific options if TikTok is selected
      if (selectedPlatforms.includes("tiktok")) {
        if (tiktokDisableDuet) payload.tiktok_disable_duet = true;
        if (tiktokDisableStitch) payload.tiktok_disable_stitch = true;
        if (tiktokDisableComment) payload.tiktok_disable_comment = true;
        if (tiktokScheduleTime) {
          const local = new Date(tiktokScheduleTime);
          payload.tiktok_schedule_time = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
        }
      }

      setPublishingStatus({ status: "publishing" });

      const response = await tenantApi.createPost(payload);

      // Clear draft on success
      localStorage.removeItem("post-draft");

      // Invalidate queries to refresh the campaigns page
      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });

      if (response.publishing_now || !scheduledAt) {
        setPublishingStatus({
          status: "success",
          platformResults: selectedPlatforms.reduce((acc, p) => ({ ...acc, [p]: "success" as const }), {}),
        });
        toast.success("✅ Post published successfully!", { duration: 5000 });
        // Redirect after a short delay to show success state
        setTimeout(() => {
          router.push("/app/campaigns");
        }, 2000);
      } else {
        setPublishingStatus({ status: "success" });
        toast.success("Post scheduled successfully!", { duration: 5000 });
        setTimeout(() => {
          router.push("/app/campaigns");
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage = error?.body?.message || error?.message || "Failed to publish post";
      setPublishingStatus({
        status: "error",
        error: errorMessage,
        platformResults: selectedPlatforms.reduce((acc, p) => ({ ...acc, [p]: "error" as const }), {}),
      });
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [canNext, caption, selectedMediaIds, selectedPlatforms, scheduledAt, router, queryClient]);

  // Keyboard shortcuts (must be after canNext and handlePublish are defined)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter: Publish immediately
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && step === "review" && canNext) {
        e.preventDefault();
        void handlePublish();
      }
      // Cmd/Ctrl + S: Save draft (already auto-saving)
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        toast.success("Draft saved automatically", { duration: 2000 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canNext]);

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
          <p className="mt-2 max-w-2xl text-sm font-medium text-gray-700">
            Step {currentStepIndex + 1} of {STEPS.length}: {currentStepLabel}
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

      {/* Step Indicator - Mobile responsive */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STEPS.map((stepKey, idx) => {
          const label = STEP_LABELS[stepKey];
          const isActive = step === stepKey;
          const isCompleted = idx < currentStepIndex;
          return (
            <button
              key={stepKey}
              type="button"
              onClick={() => {
                // Allow going back to completed steps
                if (idx <= currentStepIndex) {
                  setStep(stepKey);
                }
              }}
              className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                  : isCompleted
                  ? "border-green-300 bg-green-50 text-green-700 hover:border-green-400"
                  : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              } ${idx <= currentStepIndex ? "cursor-pointer hover:scale-105" : ""}`}
              disabled={idx > currentStepIndex}
              aria-label={`Step ${idx + 1}: ${label}`}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
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
            selectedPlatforms={selectedPlatforms}
          />
        )}

        {step === "platforms" && (
          <PlatformSelector
            selectedPlatforms={selectedPlatforms}
            onSelectionChange={setSelectedPlatforms}
          />
        )}

        {step === "schedule" && (
          <div className="space-y-6">
            <SchedulePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              selectedPlatforms={selectedPlatforms}
            />
            
            {/* TikTok-specific options */}
            {selectedPlatforms.includes("tiktok") && (
              <TikTokOptions
                disableDuet={tiktokDisableDuet}
                disableStitch={tiktokDisableStitch}
                disableComment={tiktokDisableComment}
                scheduleTime={tiktokScheduleTime}
                onDisableDuetChange={setTiktokDisableDuet}
                onDisableStitchChange={setTiktokDisableStitch}
                onDisableCommentChange={setTiktokDisableComment}
                onScheduleTimeChange={setTiktokScheduleTime}
              />
            )}
          </div>
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
            publishingStatus={publishingStatus}
            uploadedMedia={uploadedMedia}
          />
        )}
      </div>

      {/* Navigation - Mobile responsive */}
      {step !== "review" && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="min-h-[44px] flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Go to previous step"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className="min-h-[44px] flex-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-primary/20"
            aria-label="Go to next step"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
