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
import PlatformPreview from "@/app/(tenant)/components/posting/PlatformPreview";
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
import { useMedia } from "@/app/(tenant)/hooks/useMedia";
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
  const [previewPlatform, setPreviewPlatform] = useState<'instagram' | 'facebook' | 'tiktok'>('instagram');

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

  // Fetch library media for preview URLs
  const { data: libraryMedia = [] } = useMedia();

  // Selected media URLs for preview - check both uploaded and library
  const selectedMediaUrls = useMemo(() => {
    return selectedMediaIds
      .map(id => {
        // First check uploadedMedia (newly uploaded files)
        const uploaded = uploadedMedia.find(m => m.id === id);
        if (uploaded?.url) return uploaded.url;

        // Then check library media
        const library = libraryMedia.find(m => String(m.id) === id);
        if (library) return library.url || library.urls?.[0] || library.thumbnail_url || null;

        return null;
      })
      .filter((url): url is string => url !== null);
  }, [selectedMediaIds, uploadedMedia, libraryMedia]);

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

  // Sync preview platform with selected platforms
  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      const first = selectedPlatforms[0];
      if (first === 'instagram' || first === 'facebook' || first === 'tiktok') {
        setPreviewPlatform(first);
      }
    }
  }, [selectedPlatforms]);

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
      toast.error("Instagram posts require at least one media item");
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

      const payload: any = {
        media_ids: selectedMediaIds,
        platforms: selectedPlatforms,
        draft_id: draft?.id,
      };

      if (caption.trim()) payload.caption = caption.trim();

      if (scheduledAt) {
        const local = new Date(scheduledAt);
        payload.scheduled_at = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
      } else {
        payload.scheduled_at = "now";
      }

      if (caption.trim()) payload.name = caption.split("\n")[0]?.slice(0, 50) || "Post";

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
      } catch (e) { /* ignore */ }

      void queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });

      if (response.publishing_now || !scheduledAt) {
        setPublishingStatus({
          status: "success",
          platformResults: selectedPlatforms.reduce((acc, p) => ({ ...acc, [p]: "success" as const }), {}),
        });
        toast.success("✅ Post published successfully!", { duration: 5000 });
        setTimeout(() => router.push("/app/campaigns"), 2000);
      } else {
        setPublishingStatus({ status: "success" });
        toast.success("Post scheduled successfully!", { duration: 5000 });
        setTimeout(() => router.push("/app/campaigns"), 2000);
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

      setPublishingStatus({
        status: "error",
        error: errorMessage,
        platformResults: selectedPlatforms.reduce((acc, p) => ({ ...acc, [p]: "error" as const }), {}),
      });
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [canNext, caption, selectedMediaIds, selectedPlatforms, scheduledAt, router, queryClient, tiktokDisableDuet, tiktokDisableStitch, tiktokDisableComment, tiktokScheduleTime, draft]);

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
    if (nextIndex < STEPS.length) setStep(STEPS[nextIndex]);
  }, [canNext, currentStepIndex]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setStep(STEPS[prevIndex]);
  }, [currentStepIndex]);

  const handleSaveDraft = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const payload: any = {
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
    } catch (error) {
      toast.error("Failed to save draft to server");
    } finally {
      setIsSubmitting(false);
    }
  }, [caption, selectedMediaIds, selectedPlatforms, draft, deleteDraft, queryClient, router, tiktokDisableDuet, tiktokDisableStitch, tiktokDisableComment]);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const handleCancel = useCallback(() => setShowCancelConfirm(true), []);
  const confirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    router.push("/app/campaigns");
  }, [router]);

  return (
    <div className="fixed inset-0 left-0 lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg">
      {/* Fixed Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-surface lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white lg:text-2xl">Create Post</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Step {currentStepIndex + 1} of {STEPS.length}: {currentStepLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDraftsModal(true)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
            >
              Drafts
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="hidden sm:inline-flex rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
            >
              Save
            </button>
            <Link
              href="/app/campaigns"
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Pills */}
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, idx) => {
            const isActive = s === step;
            const isCompleted = idx < currentStepIndex;
            const Icon = STEP_ICONS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => idx <= currentStepIndex && setStep(s)}
                disabled={idx > currentStepIndex}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${isActive
                  ? "bg-primary text-white"
                  : isCompleted
                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-400 dark:bg-dark-border dark:text-gray-500"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
          {/* Main Content Grid - Two columns on caption step */}
          {step === "caption" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Caption Editor */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface lg:p-6">
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
              </div>

              {/* Right: Platform Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Preview</h3>
                  {selectedPlatforms.length > 1 && (
                    <div className="flex gap-1">
                      {selectedPlatforms.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            if (p === 'instagram' || p === 'facebook' || p === 'tiktok') {
                              setPreviewPlatform(p);
                            }
                          }}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition ${previewPlatform === p
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-border dark:text-gray-400"
                            }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <PlatformPreview
                    platform={previewPlatform}
                    caption={caption}
                    mediaUrls={selectedMediaUrls}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Single column for other steps */
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface lg:p-6">
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Media</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <button
                            onClick={() => setMediaSubStep('upload')}
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:border-primary hover:bg-primary/5 dark:border-dark-border dark:bg-dark-bg"
                          >
                            <CloudArrowUpIcon className="h-10 w-10 text-primary" />
                            <span className="font-medium text-gray-900 dark:text-white">Upload New</span>
                          </button>
                          <button
                            onClick={() => setMediaSubStep('library')}
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:border-primary hover:bg-primary/5 dark:border-dark-border dark:bg-dark-bg"
                          >
                            <PhotoIcon className="h-10 w-10 text-blue-500" />
                            <span className="font-medium text-gray-900 dark:text-white">From Library</span>
                          </button>
                        </div>
                        {selectedMediaIds.length > 0 && (
                          <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              ✓ {selectedMediaIds.length} media item(s) selected
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {mediaSubStep === 'upload' && (
                      <div className="space-y-4">
                        <button onClick={() => setMediaSubStep('landing')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400">
                          ← Back
                        </button>
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
                        <button onClick={() => setMediaSubStep('landing')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400">
                          ← Back
                        </button>
                        <MediaSelector
                          selectedMediaIds={selectedMediaIds}
                          onSelectionChange={setSelectedMediaIds}
                          uploadedMedia={uploadedMedia}
                          onUploadRequest={() => setMediaSubStep('upload')}
                        />
                      </div>
                    )}
                  </div>
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
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      {step !== "review" && (
        <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-surface lg:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-gray-300"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              className="rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </footer>
      )}

      {/* Modals */}
      {showCancelConfirm && (
        <ConfirmModal
          open={true}
          title="Cancel post creation"
          description="Are you sure you want to cancel?"
          confirmText="Yes, cancel"
          onConfirm={confirmCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

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
            if (content.step) setStep(content.step === 'upload' ? 'media' : content.step);
            if (content.tiktokDisableDuet !== undefined) setTiktokDisableDuet(content.tiktokDisableDuet);
            if (content.tiktokDisableStitch !== undefined) setTiktokDisableStitch(content.tiktokDisableStitch);
            if (content.tiktokDisableComment !== undefined) setTiktokDisableComment(content.tiktokDisableComment);
            if (content.tiktokScheduleTime) setTiktokScheduleTime(content.tiktokScheduleTime);
            setDraftId(d.id);
            toast.success('Draft restored');
          }
        }}
        onDiscard={async (id) => {
          try { await deleteDraft.mutate(id); } catch (e) { /* ignore */ }
        }}
      />
    </div>
  );
}
