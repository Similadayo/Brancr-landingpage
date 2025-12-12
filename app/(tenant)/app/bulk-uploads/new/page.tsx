'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import MediaUploader, { type UploadedMedia } from "@/app/(tenant)/components/posting/MediaUploader";
import PlatformSelector from "@/app/(tenant)/components/posting/PlatformSelector";
import SchedulePicker from "@/app/(tenant)/components/posting/SchedulePicker";
import CaptionEditor from "@/app/(tenant)/components/posting/CaptionEditor";
import Select from "@/app/(tenant)/components/ui/Select";

type Step = "upload" | "strategy" | "captions" | "platforms" | "schedule" | "review";

const STEPS: Step[] = ["upload", "strategy", "captions", "platforms", "schedule", "review"];
const STEP_LABELS: Record<Step, string> = {
  upload: "Upload Files",
  strategy: "Organization Strategy",
  captions: "Captions",
  platforms: "Platforms",
  schedule: "Schedule",
  review: "Review & Create",
};

type SplitStrategy = "carousels" | "individual" | "custom" | "ai_organized" | "";
type ScheduleStrategy = "spread" | "custom" | "optimal" | "";

export default function NewBulkUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload state
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [bulkSessionId, setBulkSessionId] = useState<string | null>(null);

  // Strategy state
  const [splitStrategy, setSplitStrategy] = useState<SplitStrategy>("");
  const [carouselCount, setCarouselCount] = useState<number>(0);
  const [itemsPerCarousel, setItemsPerCarousel] = useState<string>('10');

  // Caption state
  const [captionStrategy, setCaptionStrategy] = useState<"same" | "individual" | "ai_batch">("same");
  const [sharedCaption, setSharedCaption] = useState("");
  const [enhanceSharedCaption, setEnhanceSharedCaption] = useState(false);
  const [carouselCaptions, setCarouselCaptions] = useState<Record<string, string>>({});
  const [captionContext, setCaptionContext] = useState("");
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  // Platform state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Schedule state
  const [scheduleStrategy, setScheduleStrategy] = useState<ScheduleStrategy>("");
  const [durationDays, setDurationDays] = useState<string>('30');
  const [frequency, setFrequency] = useState<"daily" | "every_2_days" | "weekly">("daily");
  const [startDate, setStartDate] = useState<string>("");
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const itemsPerCarouselNumber = Number(itemsPerCarousel);
  const durationDaysNumber = Number(durationDays);

  // Auto-save draft
  useEffect(() => {
    const draft = {
      uploadedMedia,
      splitStrategy,
      carouselCount,
      itemsPerCarousel,
      captionStrategy,
      sharedCaption,
      carouselCaptions,
      selectedPlatforms,
      scheduleStrategy,
      durationDays,
      frequency,
      startDate,
      step,
    };
    localStorage.setItem("bulk-upload-draft", JSON.stringify(draft));
  }, [
    uploadedMedia,
    splitStrategy,
    carouselCount,
    itemsPerCarousel,
    captionStrategy,
    sharedCaption,
    carouselCaptions,
    selectedPlatforms,
    scheduleStrategy,
    durationDays,
    frequency,
    startDate,
    step,
  ]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("bulk-upload-draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.uploadedMedia) setUploadedMedia(draft.uploadedMedia);
        if (draft.splitStrategy) setSplitStrategy(draft.splitStrategy);
        if (draft.carouselCount) setCarouselCount(draft.carouselCount);
        if (draft.itemsPerCarousel !== undefined && draft.itemsPerCarousel !== null) setItemsPerCarousel(String(draft.itemsPerCarousel));
        if (draft.captionStrategy) setCaptionStrategy(draft.captionStrategy);
        if (draft.sharedCaption) setSharedCaption(draft.sharedCaption);
        if (draft.carouselCaptions) setCarouselCaptions(draft.carouselCaptions);
        if (draft.selectedPlatforms) setSelectedPlatforms(draft.selectedPlatforms);
        if (draft.scheduleStrategy) setScheduleStrategy(draft.scheduleStrategy);
        if (draft.durationDays !== undefined && draft.durationDays !== null) setDurationDays(String(draft.durationDays));
        if (draft.frequency) setFrequency(draft.frequency);
        if (draft.startDate) setStartDate(draft.startDate);
        if (draft.step) setStep(draft.step);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const currentStepIndex = STEPS.indexOf(step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
  const currentStepLabel = STEP_LABELS[step];

  // Auto-calculate carousel count
  useEffect(() => {
    if (splitStrategy !== "carousels" || uploadedMedia.length === 0) return;
    if (!Number.isFinite(itemsPerCarouselNumber) || itemsPerCarouselNumber <= 0) {
      setCarouselCount(0);
      return;
    }
    const calculated = Math.ceil(uploadedMedia.length / itemsPerCarouselNumber);
    setCarouselCount(calculated);
  }, [uploadedMedia.length, splitStrategy, itemsPerCarouselNumber]);

  // Validation
  const canNext = useMemo(() => {
    switch (step) {
      case "upload":
        return uploadedMedia.length > 0;
      case "strategy":
        if (splitStrategy === "carousels") {
          return carouselCount > 0 && Number.isFinite(itemsPerCarouselNumber) && itemsPerCarouselNumber > 0;
        }
        return splitStrategy !== "";
      case "captions":
        if (captionStrategy === "same") {
          return sharedCaption.trim().length > 0;
        }
        return true; // Individual and AI batch can proceed
      case "platforms":
        return selectedPlatforms.length > 0;
      case "schedule":
        if (scheduleStrategy === "spread") {
          return startDate !== "" && Number.isFinite(durationDaysNumber) && durationDaysNumber > 0;
        }
        return scheduleStrategy !== "";
      case "review":
        return true;
      default:
        return false;
    }
  }, [step, uploadedMedia.length, splitStrategy, carouselCount, itemsPerCarouselNumber, captionStrategy, sharedCaption, selectedPlatforms, scheduleStrategy, startDate, durationDaysNumber]);

  // Handlers
  const handleUploadComplete = useCallback((media: UploadedMedia[]) => {
    setUploadedMedia((prev) => [...prev, ...media]);
  }, []);

  const handleGenerateCaptions = useCallback(async () => {
    if (uploadedMedia.length === 0) {
      toast.error("Please upload media first");
      return;
    }

    try {
      setIsGeneratingCaptions(true);
      const mediaIds = uploadedMedia.map((m) => Number(m.id)).filter((id) => !isNaN(id));
      const res = await tenantApi.generateCaption({
        media_ids: mediaIds,
        include_hashtags: true,
      });
      setSharedCaption(res.caption || "");
      toast.success("Captions generated successfully");
    } catch (error: any) {
      const errorMessage = error?.body?.message || error?.message || "Failed to generate captions";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingCaptions(false);
    }
  }, [uploadedMedia]);

  const handleCreateBulkUpload = useCallback(async () => {
    if (!canNext) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 1: Upload media and create bulk session
      const mediaIds = uploadedMedia.map((m) => Number(m.id)).filter((id) => !isNaN(id));

      // Create bulk upload session
      const formData = new FormData();
      formData.append("name", `Bulk Upload - ${new Date().toLocaleDateString()}`);
      formData.append("media_ids", JSON.stringify(mediaIds));
      formData.append("total_items", String(uploadedMedia.length));

      const sessionResponse = await tenantApi.createBulkUpload(formData);
      const sessionId = sessionResponse.session_id || bulkSessionId;

      if (!sessionId) {
        throw new Error("Failed to create bulk upload session");
      }

      setBulkSessionId(sessionId);

      // Step 2: Set strategy
      if (splitStrategy) {
        await tenantApi.updateBulkUpload(sessionId, {
          split_strategy: splitStrategy,
        });
      }

      // Step 3: Set captions (would need new endpoint)
      // Step 4: Set platforms (would need new endpoint)
      // Step 5: Set schedule (would need new endpoint)

      // Clear draft on success
      localStorage.removeItem("bulk-upload-draft");

      // Invalidate queries
      void queryClient.invalidateQueries({ queryKey: ["bulk-uploads"] });

      toast.success("✅ Bulk upload created successfully!", { duration: 5000 });
      setTimeout(() => {
        router.push("/app/bulk-uploads");
      }, 2000);
    } catch (error: any) {
      // Check for "coming soon" feature
      const errorBody = error?.body || {};
      if (error?.status === 501 || errorBody.coming_soon) {
        toast.error("Bulk uploads are coming soon! This feature will be available shortly.", { duration: 5000 });
        return;
      }

      const errorMessage = getUserFriendlyErrorMessage(error, {
        action: 'creating bulk upload',
        resource: 'bulk upload',
        coming_soon: errorBody.coming_soon,
        feature: errorBody.feature || 'bulk_uploads',
      }) || error?.body?.message || error?.message || "Failed to create bulk upload";
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [canNext, uploadedMedia, splitStrategy, bulkSessionId, queryClient, router]);

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
      localStorage.removeItem("bulk-upload-draft");
      router.push("/app/bulk-uploads");
    }
  }, [router]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">New Bulk Upload</h1>
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
          href="/app/bulk-uploads"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
        >
          ← Back to Bulk Uploads
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
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload Files</h2>
              <p className="mt-1 text-sm text-gray-600">
                Upload multiple media files (images/videos). You can upload up to 100 files per session.
              </p>
            </div>
            <MediaUploader
              onUploadComplete={handleUploadComplete}
              maxFiles={100}
              maxFileSize={100}
            />
            {uploadedMedia.length > 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-semibold text-green-900">
                  ✓ {uploadedMedia.length} file{uploadedMedia.length !== 1 ? "s" : ""} uploaded successfully
                </p>
              </div>
            )}
          </div>
        )}

        {step === "strategy" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Organization Strategy</h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose how to organize your {uploadedMedia.length} uploaded file{uploadedMedia.length !== 1 ? "s" : ""}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSplitStrategy("carousels")}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  splitStrategy === "carousels"
                    ? "border-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    📚
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Carousels</h3>
                    <p className="mt-1 text-xs text-gray-600">Split into multiple carousel posts</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSplitStrategy("individual")}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  splitStrategy === "individual"
                    ? "border-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    📄
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Individual Posts</h3>
                    <p className="mt-1 text-xs text-gray-600">Each file becomes its own post</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSplitStrategy("ai_organized")}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  splitStrategy === "ai_organized"
                    ? "border-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Organize</h3>
                    <p className="mt-1 text-xs text-gray-600">AI analyzes and groups by content</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSplitStrategy("custom")}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  splitStrategy === "custom"
                    ? "border-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    🎨
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Custom Grouping</h3>
                    <p className="mt-1 text-xs text-gray-600">Manually organize files</p>
                  </div>
                </div>
              </button>
            </div>

            {splitStrategy === "carousels" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="items-per-carousel" className="block text-sm font-semibold text-gray-900 mb-2">
                      Items per Carousel
                    </label>
                    <input
                      id="items-per-carousel"
                      type="number"
                      min="1"
                      max="20"
                      value={itemsPerCarousel}
                      onChange={(e) => setItemsPerCarousel(e.target.value)}
                      aria-label="Items per carousel"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended: 10-15 items per carousel
                    </p>
                  </div>
                  {uploadedMedia.length > 0 && itemsPerCarouselNumber > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-white p-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Will create approximately <span className="text-primary">{carouselCount}</span> carousel{carouselCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "captions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Caption Configuration</h2>
              <p className="mt-1 text-sm text-gray-600">Set captions for your posts</p>
        </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="caption-strategy" className="block text-sm font-semibold text-gray-900 mb-2">Caption Strategy</label>
                <Select
                  id="caption-strategy"
                  value={captionStrategy}
                  onChange={(value) => setCaptionStrategy(value as any)}
                  options={[
                    { value: "same", label: "Same caption for all" },
                    { value: "individual", label: "Individual captions" },
                    { value: "ai_batch", label: "AI generate for all" },
                  ]}
                  searchable={false}
                />
          </div>

              {captionStrategy === "same" && (
                <div>
                  <CaptionEditor
                    value={sharedCaption}
                    onChange={setSharedCaption}
                    enhanceCaption={enhanceSharedCaption}
                    onEnhanceCaptionChange={setEnhanceSharedCaption}
                    onAIGenerate={handleGenerateCaptions}
                    isAIGenerating={isGeneratingCaptions}
                    selectedMediaIds={uploadedMedia.map((m) => m.id)}
                    selectedPlatforms={selectedPlatforms}
                  />
                </div>
              )}

              {captionStrategy === "ai_batch" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="caption-context" className="block text-sm font-semibold text-gray-900 mb-2">Context (optional)</label>
                    <input
                      id="caption-context"
                      type="text"
                      value={captionContext}
                      onChange={(e) => setCaptionContext(e.target.value)}
                      placeholder="e.g., Product launch, Behind the scenes"
                      aria-label="Caption context for AI generation"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateCaptions}
                    disabled={isGeneratingCaptions}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isGeneratingCaptions ? "Generating..." : "Generate Captions"}
                  </button>
                </div>
              )}

              {captionStrategy === "individual" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-900">
                    Individual captions will be configured in the review step.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "platforms" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Platforms</h2>
              <p className="mt-1 text-sm text-gray-600">Choose which platforms to publish to</p>
            </div>
            <PlatformSelector
              selectedPlatforms={selectedPlatforms}
              onSelectionChange={setSelectedPlatforms}
            />
          </div>
        )}

        {step === "schedule" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Scheduling Strategy</h2>
              <p className="mt-1 text-sm text-gray-600">Choose how to schedule your posts</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setScheduleStrategy("spread")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  scheduleStrategy === "spread"
                    ? "border-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <h3 className="font-semibold text-gray-900">Spread Over Time</h3>
                <p className="mt-1 text-xs text-gray-600">Evenly distribute posts</p>
              </button>

              <button
                type="button"
                onClick={() => setScheduleStrategy("optimal")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  scheduleStrategy === "optimal"
                    ? "border-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <h3 className="font-semibold text-gray-900">Optimal Times</h3>
                <p className="mt-1 text-xs text-gray-600">AI-suggested best times</p>
              </button>

              <button
                type="button"
                onClick={() => setScheduleStrategy("custom")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  scheduleStrategy === "custom"
                    ? "border-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-primary/50"
                }`}
              >
                <h3 className="font-semibold text-gray-900">Custom Dates</h3>
                <p className="mt-1 text-xs text-gray-600">Choose specific dates</p>
              </button>
            </div>

            {scheduleStrategy === "spread" && (
              <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-semibold text-gray-900 mb-2">Start Date & Time</label>
                  <input
                    id="start-date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="Start date and time"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label htmlFor="duration-days" className="block text-sm font-semibold text-gray-900 mb-2">Duration (days)</label>
                  <input
                    id="duration-days"
                    type="number"
                    min="1"
                    max="365"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    aria-label="Duration in days"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label htmlFor="frequency" className="block text-sm font-semibold text-gray-900 mb-2">Frequency</label>
                  <Select
                    id="frequency"
                    value={frequency}
                    onChange={(value) => setFrequency(value as any)}
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "every_2_days", label: "Every 2 days" },
                      { value: "weekly", label: "Weekly" },
                    ]}
                    searchable={false}
                  />
          </div>
        </div>
            )}

            {scheduleStrategy === "optimal" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  AI will analyze your audience engagement patterns and suggest optimal posting times for each post.
                </p>
              </div>
            )}

            {scheduleStrategy === "custom" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                  Custom date selection will be available in the review step.
                </p>
              </div>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review & Confirm</h2>
              <p className="mt-1 text-sm text-gray-600">Review your bulk upload configuration</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Files</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{uploadedMedia.length} files</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Strategy</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 capitalize">{splitStrategy || "Not set"}</p>
                {splitStrategy === "carousels" && (
                  <p className="mt-1 text-xs text-gray-600">{carouselCount} carousels</p>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Platforms</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Schedule</p>
                <p className="mt-2 text-lg font-semibold text-gray-900 capitalize">{scheduleStrategy || "Not set"}</p>
              </div>
            </div>

            {sharedCaption && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Caption Preview</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{sharedCaption}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {step !== "review" && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="min-h-[44px] flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className="min-h-[44px] flex-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            Next →
          </button>
        </div>
      )}

      {step === "review" && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-[44px] flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            ← Back
          </button>
        <button
            type="button"
            onClick={handleCreateBulkUpload}
            disabled={!canNext || isSubmitting}
            className="min-h-[44px] flex-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? "Creating..." : "Create Bulk Upload"}
        </button>
      </div>
      )}
    </div>
  );
}
