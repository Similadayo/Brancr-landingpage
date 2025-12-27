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
import useAutosaveDraft from '@/app/(tenant)/hooks/useDrafts';

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
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  
  // TikTok-specific options
  const [tiktokDisableDuet, setTiktokDisableDuet] = useState(false);
  const [tiktokDisableStitch, setTiktokDisableStitch] = useState(false);
  const [tiktokDisableComment, setTiktokDisableComment] = useState(false);
  const [tiktokScheduleTime, setTiktokScheduleTime] = useState<string | null>(null);

  // Remote draft availability
  const [remoteDraftAvailable, setRemoteDraftAvailable] = useState<any | null>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showRemoteConflict, setShowRemoteConflict] = useState<any | null>(null);

  // Auto-save draft to localStorage (fast local fallback)
  useEffect(() => {
    const draft = {
      uploadedMedia,
      selectedMediaIds,
      caption,
      enhanceCaption,
      selectedPlatforms,
      scheduledAt,
      step,
    };
    localStorage.setItem("post-draft", JSON.stringify(draft));
  }, [uploadedMedia, selectedMediaIds, caption, enhanceCaption, selectedPlatforms, scheduledAt, step]);

  // Load draft on mount (local fallback)
  useEffect(() => {
    const savedDraft = localStorage.getItem("post-draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.selectedMediaIds) setSelectedMediaIds(draft.selectedMediaIds);
        if (draft.caption) setCaption(draft.caption);
        if (draft.enhanceCaption !== undefined) setEnhanceCaption(draft.enhanceCaption);
        if (draft.selectedPlatforms) setSelectedPlatforms(draft.selectedPlatforms);
        if (draft.scheduledAt) setScheduledAt(draft.scheduledAt);
        if (draft.step) setStep(draft.step);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Server-backed autosave via drafts API
  const { content: remoteDraftContent, setContent: setRemoteContent, status: draftStatus, draftId, lastSyncedAt, restoreRemote, deleteDraft } = useAutosaveDraft({
    key: 'compose.post',
    initialContent: null,
    debounceMs: 1000,
    onRemoteNewer: (remote) => {
      // Open a conflict modal to let user decide
      setShowRemoteConflict(remote);
      setRemoteDraftAvailable(remote as any);
    },
  });

  // Sync page state into remote autosave
  useEffect(() => {
    setRemoteContent({
      uploadedMedia,
      selectedMediaIds,
      caption,
      enhanceCaption,
      selectedPlatforms,
      scheduledAt,
      step,
    });
  }, [uploadedMedia, selectedMediaIds, caption, enhanceCaption, selectedPlatforms, scheduledAt, step, setRemoteContent]);

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
        // Client: require at least one selected platform. Backend will validate platform-specific media requirements.
        return selectedPlatforms.length > 0;
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

  // Get first media asset for API calls
  const getFirstMediaAsset = useCallback(() => {
    if (selectedMediaIds.length === 0) return null;
    const firstId = Number(selectedMediaIds[0]);
    if (isNaN(firstId)) return null;
    const media = uploadedMedia.find(m => m.id === selectedMediaIds[0]);
    return {
      id: firstId,
      type: media?.type || "image",
      url: media?.url || "",
    };
  }, [selectedMediaIds, uploadedMedia]);

  const handleGenerateCaption = useCallback(async () => {
    // Allow caption generation even when no media is selected. If there is no media
    // and no platform selected, default to Facebook (supports text-only posts).
    if (selectedMediaIds.length === 0 && selectedPlatforms.length === 0) {
      setSelectedPlatforms(['facebook']);
    }

    try {
      setIsAIGenerating(true);
      // Convert media IDs from strings to numbers (may be empty)
      const mediaIds = selectedMediaIds.map((id) => Number(id)).filter((id) => !isNaN(id));
      const res = await tenantApi.generateCaption({
        media_ids: mediaIds,
        include_hashtags: true,
      });
      
      // API returns { caption: string } - empty string is a valid successful response
      const generatedCaption = res.caption || "";
      
      // Always set the caption and show success if API call completed without error
      // An empty caption is a valid response, not an error condition
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
      // If caption is empty and mode is ai_generate, backend will generate it
      if (caption.trim()) {
        payload.caption = caption.trim();
      }
      // Note: Backend handles empty captions by generating them based on tenant preferences

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

      // Clear draft on success (local + server)
      localStorage.removeItem("post-draft");
      try {
        // Fire-and-forget delete; hook will enqueue and process
        void deleteDraft();
      } catch (e) {
        // ignore
      }

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
      // Enhanced error handling with platform-specific detection
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

      // Log critical platform errors to monitoring
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
  }, [canNext, caption, enhanceCaption, selectedMediaIds, selectedPlatforms, scheduledAt, router, queryClient, tiktokDisableDuet, tiktokDisableStitch, tiktokDisableComment, tiktokScheduleTime]);

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

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const handleCancel = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);
  const confirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    router.push("/app/campaigns");
  }, [router]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-accent via-accent/95 to-accent/90 p-6 shadow-xl dark:border-gray-700 dark:from-accent dark:via-accent/90 dark:to-accent/80 sm:p-8 md:p-10">
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
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Create Post</h1>
              <p className="mt-2 text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                Step {currentStepIndex + 1} of {STEPS.length}: {currentStepLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drafts / Restore button - moved outside hero */}
      {remoteDraftAvailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex items-center justify-between">
            <div>Newer draft available — saved at {new Date(remoteDraftAvailable.updated_at).toLocaleString()}.</div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await restoreRemote(remoteDraftAvailable.id);
                  setRemoteDraftAvailable(null);
                  const savedAgo = Math.max(0, Date.now() - new Date(remoteDraftAvailable.updated_at).getTime());
                  const mins = Math.floor(savedAgo / 60000);
                  const text = mins < 1 ? 'less than a minute ago' : `${mins} minute${mins > 1 ? 's' : ''} ago`;
                  toast((t) => (
                    <div className="flex items-center gap-3">
                      <div>Restored draft — saved {text}</div>
                      <button
                        className="ml-4 rounded-md bg-white px-2 py-1 text-xs font-semibold text-rose-600 border border-rose-200"
                        onClick={async () => {
                          try {
                            await deleteDraft(remoteDraftAvailable.id);
                            toast.success('Draft discarded');
                            toast.dismiss(t.id);
                          } catch (e) {
                            toast.error('Failed to discard draft');
                          }
                        }}
                      >
                        Discard
                      </button>
                    </div>
                  ), { duration: 8000 });
                }}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Restore
              </button>
              <button
                onClick={() => setRemoteDraftAvailable(null)}
                className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts button and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDraftsModal(true)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300"
          >
            Drafts
          </button>
          <div aria-live="polite" aria-atomic="true">
            {navigator.onLine === false ? (
              <span className="text-xs text-gray-500">Offline — Saved locally</span>
            ) : draftStatus === 'saving' ? (
              <span className="text-xs text-gray-500">Saving…</span>
            ) : draftStatus === 'saved' ? (
              <span className="text-xs text-gray-500">{lastSyncedAt ? `Saved at ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Saved'}</span>
            ) : draftStatus === 'error' ? (
              <span className="text-xs text-rose-600">Save failed (retrying)</span>
            ) : (
              <span className="text-xs text-gray-500">Draft status: {draftStatus}</span>
            )}
          </div>
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
      </div>

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
        keyName="compose.post"
        onRestore={(d) => {
          // restore and show toast with discard action
          void restoreRemote(d.id);
          const savedAgo = Math.max(0, Date.now() - new Date(d.updated_at).getTime());
          const mins = Math.floor(savedAgo / 60000);
          const text = mins < 1 ? 'less than a minute ago' : `${mins} minute${mins > 1 ? 's' : ''} ago`;
          toast((t) => (
            <div className="flex items-center gap-3">
              <div>Restored draft — saved {text}</div>
              <button
                className="ml-4 rounded-md bg-white px-2 py-1 text-xs font-semibold text-rose-600 border border-rose-200"
                onClick={async () => {
                  try {
                    await deleteDraft(d.id);
                    toast.success('Draft discarded');
                    toast.dismiss(t.id);
                  } catch (e) {
                    toast.error('Failed to discard draft');
                  }
                }}
              >
                Discard
              </button>
            </div>
          ), { duration: 8000 });
        }}
        onDiscard={async (id) => {
          try {
            await deleteDraft(id);
          } catch (e) {
            // ignore
          }
        }}
      />

      {/* Remote conflict dialog (if remote draft appears different) */}
      {showRemoteConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="z-50 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Remote draft detected</h3>
            <p className="mt-2 text-sm text-gray-600">A newer draft exists on the server. Would you like to restore it, keep your local draft, or review differences?</p>
            <div className="mt-4 flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  // Review differences -> open drafts modal
                  setShowDraftsModal(true);
                  setShowRemoteConflict(null);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700"
              >
                Review differences
              </button>
              <button
                onClick={async () => {
                  // Keep local
                  setShowRemoteConflict(null);
                  setRemoteDraftAvailable(null);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700"
              >
                Keep local
              </button>
              <button
                onClick={async () => {
                  // Restore remote
                  await restoreRemote(showRemoteConflict.id);
                  setShowRemoteConflict(null);
                  setRemoteDraftAvailable(null);
                  toast.success('Remote draft restored');
                }}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Restore remote
              </button>
            </div>
          </div>
        </div>
      )}

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
            enhanceCaption={enhanceCaption}
            onEnhanceCaptionChange={setEnhanceCaption}
            onAIGenerate={handleGenerateCaption}
            isAIGenerating={isAIGenerating}
            selectedMediaIds={selectedMediaIds}
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
