'use client';

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import { captureException } from "@/lib/observability";
import MediaUploader, { type UploadedMedia } from "@/app/(tenant)/components/posting/MediaUploader";
import MediaSelector from "@/app/(tenant)/components/posting/MediaSelector";
import CaptionEditor from "@/app/(tenant)/components/posting/CaptionEditor";
import PlatformSelector from "@/app/(tenant)/components/posting/PlatformSelector";
import SchedulePicker from "@/app/(tenant)/components/posting/SchedulePicker";
import PostReview from "@/app/(tenant)/components/posting/PostReview";
import TikTokOptions from "@/app/(tenant)/components/posting/TikTokOptions";
import ConfirmModal from '@/app/components/ConfirmModal';
import DraftsModal from '@/app/(tenant)/components/posting/DraftsModal';
import {
  RocketIcon,
  LinkIcon,
  ImageIcon,
  PencilIcon,
  CalendarIcon,
  EyeIcon,
  CloudArrowUpIcon,
  PhotoIcon,
} from "@/app/(tenant)/components/icons";
import { useDraft, useAutoSaveDraft, useDeleteDraft, parseDraftContent, DRAFT_KEYS } from "@/app/(tenant)/hooks/useDrafts";
import GoalSelector from "@/app/(tenant)/components/posting/GoalSelector";

type Step = "goal" | "platforms" | "media" | "caption" | "schedule" | "review";

const STEPS: Step[] = ["goal", "platforms", "media", "caption", "schedule", "review"];
const STEP_LABELS: Record<Step, string> = {
  goal: "Goal",
  platforms: "Platforms",
  media: "Media",
  caption: "Caption",
  schedule: "Schedule",
  review: "Review",
};

const STEP_ICONS: Record<Step, React.ElementType> = {
  goal: RocketIcon,
  platforms: LinkIcon,
  media: ImageIcon,
  caption: PencilIcon,
  schedule: CalendarIcon,
  review: EyeIcon,
};

export default function NewPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("goal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<{
    status: "idle" | "publishing" | "success" | "error";
    platformResults?: Record<string, "success" | "error">;
    error?: string;
  }>({ status: "idle" });

  // State
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [enhanceCaption, setEnhanceCaption] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [mediaSubStep, setMediaSubStep] = useState<'landing' | 'upload' | 'library'>('landing');

  // TikTok-specific options
  const [tiktokDisableDuet, setTiktokDisableDuet] = useState(false);
  const [tiktokDisableStitch, setTiktokDisableStitch] = useState(false);
  const [tiktokDisableComment, setTiktokDisableComment] = useState(false);
  const [tiktokScheduleTime, setTiktokScheduleTime] = useState<string | null>(null);

  const [showDraftsModal, setShowDraftsModal] = useState(false);

  // Draft Hooks
  const { data: draft, isLoading: draftLoading } = useDraft(DRAFT_KEYS.POST_CREATE);
  const deleteDraft = useDeleteDraft();

  // Restore draft
  useEffect(() => {
    try {
      localStorage.removeItem(`drafts-local-${DRAFT_KEYS.POST_CREATE}`);
    } catch (e) { /* ignore */ }
  }, []);

  // Notify if unsaved draft exists
  useEffect(() => {
    if (draft && !draftLoading) {
      toast('You have an unsaved draft. Click "Local Drafts" to restore.', {
        icon: '📝',
        duration: 4000,
      });
    }
  }, [draft, draftLoading]);

  // Construct draft content
  const draftContent = useMemo(() => ({
    goal,
    uploadedMedia,
    selectedMediaIds,
    caption,
    enhanceCaption,
    selectedPlatforms,
    scheduledAt,
    step,
    tiktokDisableDuet,
    tiktokDisableStitch,
    tiktokDisableComment,
    tiktokScheduleTime,
  }), [
    goal, uploadedMedia, selectedMediaIds, caption, enhanceCaption, selectedPlatforms, scheduledAt, step,
    tiktokDisableDuet, tiktokDisableStitch, tiktokDisableComment, tiktokScheduleTime
  ]);

  // Auto-save
  const { isSaving, setDraftId } = useAutoSaveDraft(DRAFT_KEYS.POST_CREATE, draftContent, !draftLoading);

  const currentStepIndex = STEPS.indexOf(step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
  const currentStepLabel = STEP_LABELS[step];

  // Validation
  const canNext = useMemo(() => {
    switch (step) {
      case "goal":
        return !!goal;
      case "platforms":
        return selectedPlatforms.length > 0;
      case "media":
        return true;
      case "caption":
        return true;
      case "schedule":
        return true;
      case "review":
        return selectedPlatforms.length > 0;
      default:
        return false;
    }
  }, [step, goal, selectedPlatforms]);

  // Handlers
  const handleUploadComplete = useCallback((media: UploadedMedia[]) => {
    setUploadedMedia((prev) => [...prev, ...media]);
    const newIds = media.map((m) => m.id);
    setSelectedMediaIds((prev) => [...prev, ...newIds]);
  }, []);

  const getFirstMediaAsset = useCallback(() => {
    if (selectedMediaIds.length === 0) return null;
    const firstId = selectedMediaIds[0];
    const media = uploadedMedia.find(m => m.id === firstId);
    return {
      id: firstId,
      type: media?.type || "image",
      url: media?.url || "",
    };
  }, [selectedMediaIds, uploadedMedia]);

  const handleGenerateCaption = useCallback(async (options?: { tone?: string; include_hashtags?: boolean }) => {
    if (selectedMediaIds.length === 0 && selectedPlatforms.length === 0) {
      setSelectedPlatforms(['facebook']);
    }

    try {
      setIsAIGenerating(true);
      const res = await tenantApi.generateCaption({
        media_ids: selectedMediaIds,
        include_hashtags: options?.include_hashtags ?? true,
        tone: options?.tone,
      });

      const generatedCaption = res.caption || "";
      setCaption(generatedCaption);
      toast.success("Caption generated successfully");
    } catch (error: any) {
      console.error("Caption generation error:", error);
      const errorMessage = error?.body?.message || error?.message || "Failed to generate caption";
      toast.error(errorMessage);
    } finally {
      setIsAIGenerating(false);
    }
  }, [selectedMediaIds, selectedPlatforms]);

  const handlePublish = useCallback(async () => {
    if (!canNext) {
      toast.error("Please complete all required fields");
      return;
    }

    if (selectedPlatforms.includes("instagram") && selectedMediaIds.length === 0) {
      toast.error("Instagram posts require at least one media item (image or video)");
      return;
    }

    try {
      setIsSubmitting(true);

      if (scheduledAt) {
        const scheduleDate = new Date(scheduledAt);
        if (scheduleDate < new Date()) {
          toast.error("Cannot schedule posts in the past");
          setIsSubmitting(false);
          return;
        }
      }

      const payload: {
        media_ids: Array<number | string>;
        platforms: string[];
        scheduled_at?: string | null;
        caption?: string;
        name?: string;
        tiktok_disable_duet?: boolean;
        tiktok_disable_stitch?: boolean;
        tiktok_disable_comment?: boolean;
        tiktok_schedule_time?: string;
        draft_id?: string;
      } = {
        media_ids: selectedMediaIds,
        platforms: selectedPlatforms,
        draft_id: draft?.id,
      };

      if (caption.trim()) {
        payload.caption = caption.trim();
      }

      if (scheduledAt) {
        const local = new Date(scheduledAt);
        payload.scheduled_at = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
      } else {
        payload.scheduled_at = "now";
      }

      if (caption.trim()) {
        payload.name = caption.split("\n")[0]?.slice(0, 50) || "Post";
      }

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

      try {
        localStorage.removeItem(`drafts-local-content-${DRAFT_KEYS.POST_CREATE}`);
        localStorage.removeItem(`drafts-local-${DRAFT_KEYS.POST_CREATE}`);
        localStorage.removeItem(`drafts-outbox-${DRAFT_KEYS.POST_CREATE}`);
      } catch (e) { /* ignore storage errors */ }

      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });

      if (response.publishing_now || !scheduledAt) {
        setPublishingStatus({
          status: "success",
          platformResults: selectedPlatforms.reduce((acc, p) => ({ ...acc, [p]: "success" as const }), {}),
        });
        toast.success("✅ Post published successfully!", { duration: 5000 });
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
      const errorBody = error?.body || {};
      const alertType = errorBody.alert_type || errorBody.error || '';
      const errorMessage = getUserFriendlyErrorMessage(error, {
        action: 'publishing post',
        resource: 'post',
        platform: selectedPlatforms[0],
        alert_type: alertType,
        coming_soon: errorBody.coming_soon,
        feature: errorBody.feature,
      });

      if (alertType === 'whatsapp_template_failure' || alertType === 'instagram_rate_limit' || alertType === 'tiktok_upload_failure') {
        captureException(new Error(`Platform error: ${alertType}`), {
          alert_type: alertType,
          platform: selectedPlatforms.join(','),
          error_message: errorMessage,
          post_data: {
            platforms: selectedPlatforms,
            has_media: selectedMediaIds.length > 0,
            has_caption: !!caption,
          },
        });
      }

      setPublishingStatus({
        status: "error",
        error: errorMessage,
        platformResults: selectedPlatforms.reduce((acc, p) => ({ ...acc, [p]: "error" as const }), {}),
      });
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [canNext, caption, enhanceCaption, selectedMediaIds, selectedPlatforms, scheduledAt, router, queryClient, tiktokDisableDuet, tiktokDisableStitch, tiktokDisableComment, tiktokScheduleTime, draft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && step === "review" && canNext) {
        e.preventDefault();
        void handlePublish();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        toast.success("Draft saved automatically", { duration: 2000 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, canNext, handlePublish]);

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

  const handleSaveDraft = useCallback(async () => {
    try {
      setIsSubmitting(true);

      const payload: {
        media_ids: Array<number | string>;
        platforms: string[];
        scheduled_at?: string | null;
        caption?: string;
        name?: string;
        status: "draft";
        tiktok_disable_duet?: boolean;
        tiktok_disable_stitch?: boolean;
        tiktok_disable_comment?: boolean;
        tiktok_schedule_time?: string;
      } = {
        media_ids: selectedMediaIds,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ["instagram"],
        status: "draft",
        scheduled_at: "",
      };

      if (caption.trim()) {
        payload.caption = caption.trim();
        payload.name = caption.split("\n")[0]?.slice(0, 50) || "Draft Post";
      } else {
        payload.name = "Untitled Draft";
      }

      if (selectedPlatforms.includes("tiktok")) {
        if (tiktokDisableDuet) payload.tiktok_disable_duet = true;
        if (tiktokDisableStitch) payload.tiktok_disable_stitch = true;
        if (tiktokDisableComment) payload.tiktok_disable_comment = true;
      }

      await tenantApi.createPost(payload);

      if (draft?.id) deleteDraft.mutate(draft.id);

      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });

      toast.success("Draft saved to server");
      router.push("/app/campaigns");
    } catch (error: any) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft to server");
    } finally {
      setIsSubmitting(false);
    }
  }, [caption, selectedMediaIds, selectedPlatforms, draft, deleteDraft, queryClient, router, tiktokDisableDuet, tiktokDisableStitch, tiktokDisableComment]);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const handleCancel = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);
  const confirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    router.push("/app/campaigns");
  }, [router]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header - matching campaigns/new style */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white lg:text-4xl">Create Post</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Step {currentStepIndex + 1} of {STEPS.length}: {currentStepLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDraftsModal(true)}
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
          >
            Local Drafts
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
          >
            Save to Cloud
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
          >
            Cancel
          </button>
          <Link
            href="/app/campaigns"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary hover:text-primary dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
          >
            ← Back to Campaigns
          </Link>
        </div>
      </header>

      {showCancelConfirm && (
        <ConfirmModal
          open={true}
          title="Cancel post creation"
          description="Are you sure you want to cancel? Your progress will be lost."
          confirmText="Yes, cancel"
          onConfirm={confirmCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {/* Drafts modal */}
      <DraftsModal
        open={showDraftsModal}
        onClose={() => setShowDraftsModal(false)}
        keyName={DRAFT_KEYS.POST_CREATE}
        onRestore={(d) => {
          const content = parseDraftContent<any>(d);
          if (content) {
            if (content.goal) setGoal(content.goal);
            if (content.uploadedMedia) setUploadedMedia(content.uploadedMedia);
            if (content.selectedMediaIds) setSelectedMediaIds(content.selectedMediaIds);
            if (content.caption) setCaption(content.caption);
            if (content.enhanceCaption !== undefined) setEnhanceCaption(content.enhanceCaption);
            if (content.selectedPlatforms) setSelectedPlatforms(content.selectedPlatforms);
            if (content.scheduledAt) setScheduledAt(content.scheduledAt);
            if (content.step) {
              if (content.step === 'upload') setStep('media');
              else setStep(content.step);
            }
            if (content.tiktokDisableDuet !== undefined) setTiktokDisableDuet(content.tiktokDisableDuet);
            if (content.tiktokDisableStitch !== undefined) setTiktokDisableStitch(content.tiktokDisableStitch);
            if (content.tiktokDisableComment !== undefined) setTiktokDisableComment(content.tiktokDisableComment);
            if (content.tiktokScheduleTime) setTiktokScheduleTime(content.tiktokScheduleTime);

            setDraftId(d.id);

            toast.success('Draft restored');
          }
        }}
        onDiscard={async (id) => {
          try {
            await deleteDraft.mutate(id);
          } catch (e) {
            // ignore
          }
        }}
      />

      {/* Autosave status */}
      <div className="flex items-center gap-2" aria-live="polite" aria-atomic="true">
        {isSaving ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">Saving...</span>
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400">Draft saved locally</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-border">
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
          const Icon = STEP_ICONS[stepKey];
          return (
            <button
              key={stepKey}
              type="button"
              onClick={() => {
                if (idx <= currentStepIndex) {
                  setStep(stepKey);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 text-center transition-all ${isActive
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                : isCompleted
                  ? "border-green-300 bg-green-50 text-green-700 hover:border-green-400 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed dark:border-dark-border dark:bg-dark-bg dark:text-gray-500"
                } ${idx <= currentStepIndex ? "cursor-pointer hover:scale-105" : ""}`}
              disabled={idx > currentStepIndex}
              aria-label={`Step ${idx + 1}: ${label}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium sm:text-xs">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content - Using consistent card styles */}
      <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface sm:p-8">
        {step === "goal" && (
          <GoalSelector
            selectedGoal={goal}
            onSelect={(g) => {
              setGoal(g);
              setTimeout(() => setStep("platforms"), 150);
            }}
          />
        )}

        {step === "platforms" && (
          <PlatformSelector
            selectedPlatforms={selectedPlatforms}
            onSelectionChange={setSelectedPlatforms}
          />
        )}

        {step === "media" && (
          <div className="space-y-4">
            {mediaSubStep === 'landing' && (
              <>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">How would you like to add media?</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setMediaSubStep('upload')}
                    className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02] dark:border-dark-border dark:bg-dark-bg dark:hover:border-primary"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CloudArrowUpIcon className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-semibold text-gray-900 dark:text-white">Upload New</span>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">Drag & drop images or videos</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setMediaSubStep('library')}
                    className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02] dark:border-dark-border dark:bg-dark-bg dark:hover:border-primary"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <PhotoIcon className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-semibold text-gray-900 dark:text-white">Select from Library</span>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">Choose from previously uploaded files</span>
                    </div>
                  </button>
                </div>
                {selectedMediaIds.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-4 dark:border-dark-border">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Media ({selectedMediaIds.length})</p>
                    <div className="flex -space-x-2 overflow-hidden">
                      {selectedMediaIds.slice(0, 5).map(id => (
                        <div key={id} className="inline-block h-10 w-10 rounded-full bg-gray-200 ring-2 ring-white dark:bg-dark-border dark:ring-dark-surface" />
                      ))}
                    </div>
                    <button onClick={() => setMediaSubStep('library')} className="text-xs text-primary hover:underline mt-1">
                      View selected
                    </button>
                  </div>
                )}
              </>
            )}

            {mediaSubStep === 'upload' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <button onClick={() => setMediaSubStep('landing')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1">
                    ← Back to options
                  </button>
                  <button onClick={() => setMediaSubStep('library')} className="text-sm text-primary hover:underline font-medium">
                    View Library
                  </button>
                </div>
                <MediaUploader
                  onUploadComplete={(media) => {
                    handleUploadComplete(media);
                    setMediaSubStep('library');
                  }}
                  maxFiles={10}
                  maxFileSize={50}
                />
              </div>
            )}

            {mediaSubStep === 'library' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <button onClick={() => setMediaSubStep('landing')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1">
                    ← Back to options
                  </button>
                </div>
                <MediaSelector
                  selectedMediaIds={selectedMediaIds}
                  onSelectionChange={setSelectedMediaIds}
                  uploadedMedia={uploadedMedia}
                  onUploadRequest={() => setMediaSubStep('upload')}
                />
              </div>
            )}

            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
              Media is optional for text-only posts on some platforms.
            </p>
          </div>
        )}

        {step === "caption" && (
          <CaptionEditor
            value={caption}
            onChange={setCaption}
            enhanceCaption={enhanceCaption}
            onEnhanceCaptionChange={setEnhanceCaption}
            onAIGenerate={handleGenerateCaption}
            isAIGenerating={isAIGenerating}
            selectedMediaIds={selectedMediaIds}
            selectedPlatforms={selectedPlatforms}
          />
        )}

        {step === "schedule" && (
          <div className="space-y-6">
            <SchedulePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              selectedPlatforms={selectedPlatforms}
            />

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
            className="min-h-[44px] flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className="min-h-[44px] flex-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
