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
import PlatformPreview from "@/app/(tenant)/components/posting/PlatformPreview"; // New Component
import ConfirmModal from '@/app/components/ConfirmModal';
import DraftsModal from '@/app/(tenant)/components/posting/DraftsModal';
import { useDraft, useAutoSaveDraft, useDeleteDraft, parseDraftContent, DRAFT_KEYS } from "@/app/(tenant)/hooks/useDrafts";
import GoalSelector from "@/app/(tenant)/components/posting/GoalSelector";

type Step = "goal" | "platforms" | "media" | "caption" | "schedule" | "review";

const STEPS: { id: Step; label: string }[] = [
  { id: "goal", label: "Goal" },
  { id: "platforms", label: "Platforms" },
  { id: "media", label: "Media" },
  { id: "caption", label: "Caption" },
  { id: "schedule", label: "Schedule" },
  { id: "review", label: "Review" },
];

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

  // Restore draft - Detach from previous session on mount
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

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  // Validation
  const canNext = useMemo(() => {
    switch (step) {
      case "goal":
        return !!goal;
      case "platforms":
        return selectedPlatforms.length > 0;
      case "media":
        return true; // Optional for some
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
        if (new Date(scheduledAt) < new Date()) {
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

  // Keyboard shortcut for saving draft
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        toast.success("Draft saved automatically", { duration: 2000 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNext = useCallback(() => {
    if (!canNext) {
      toast.error("Please complete this step before continuing");
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) setStep(STEPS[nextIndex].id);
  }, [canNext, currentStepIndex]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setStep(STEPS[prevIndex].id);
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
      toast.error("Failed to save draft");
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

  // Selected media URLs for preview
  const selectedMediaUrls = useMemo(() => {
    return selectedMediaIds
      .map(id => uploadedMedia.find(m => m.id === id)?.url)
      .filter(Boolean) as string[];
  }, [selectedMediaIds, uploadedMedia]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
          <p className="text-gray-500 text-sm">Design, schedule, and publish your content</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowDraftsModal(true)} className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-gray-50">Drafts</button>
          <button onClick={handleSaveDraft} disabled={isSubmitting} className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-gray-50 text-gray-700">Save & Exit</button>
          <button onClick={handleCancel} className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-gray-50 text-red-600 border-red-100">Cancel</button>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto pb-4">
        <div className="flex items-center justify-between min-w-[600px]">
          {STEPS.map((s, idx) => {
            const isActive = s.id === step;
            const isCompleted = idx < currentStepIndex;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none relative group cursor-pointer" onClick={() => idx <= currentStepIndex && setStep(s.id)}>
                <div className={`flex items-center gap-2 ${isActive ? 'text-primary font-bold' : isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-primary bg-primary text-white' : isCompleted ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 bg-white text-gray-400 group-hover:border-gray-300'}`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className="whitespace-nowrap text-sm">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-full mx-4 transition-colors ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">

        {step === "goal" && (
          <div className="max-w-3xl mx-auto">
            <GoalSelector
              selectedGoal={goal}
              onSelect={(g) => { setGoal(g); setTimeout(() => setStep("platforms"), 150); }}
            />
          </div>
        )}

        {step === "platforms" && (
          <div className="max-w-3xl mx-auto">
            <PlatformSelector selectedPlatforms={selectedPlatforms} onSelectionChange={setSelectedPlatforms} />
          </div>
        )}

        {step === "media" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Simplified Media Step using conditional sub-steps similar to original but cleaned up */}
            <div className="flex gap-4 border-b border-gray-100 pb-4 mb-4">
              <button
                onClick={() => setMediaSubStep('landing')}
                className={`text-sm font-medium ${mediaSubStep === 'landing' ? 'text-primary' : 'text-gray-500'}`}
              >
                Options
              </button>
              <button
                onClick={() => setMediaSubStep('upload')}
                className={`text-sm font-medium ${mediaSubStep === 'upload' ? 'text-primary' : 'text-gray-500'}`}
              >
                Upload
              </button>
              <button
                onClick={() => setMediaSubStep('library')}
                className={`text-sm font-medium ${mediaSubStep === 'library' ? 'text-primary' : 'text-gray-500'}`}
              >
                Library ({selectedMediaIds.length})
              </button>
            </div>

            {mediaSubStep === 'landing' && (
              <div className="grid gap-6 sm:grid-cols-2">
                <button onClick={() => setMediaSubStep('upload')} className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 hover:border-primary hover:bg-primary/5 transition-all">
                  <span className="text-4xl">☁️</span>
                  <span className="font-semibold text-gray-900">Upload New</span>
                </button>
                <button onClick={() => setMediaSubStep('library')} className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 hover:border-primary hover:bg-primary/5 transition-all">
                  <span className="text-4xl">🖼️</span>
                  <span className="font-semibold text-gray-900">Choose from Library</span>
                </button>
              </div>
            )}

            {mediaSubStep === 'upload' && (
              <MediaUploader
                onUploadComplete={(media) => { handleUploadComplete(media); setMediaSubStep('library'); }}
                maxFiles={10}
                maxFileSize={100}
              />
            )}

            {mediaSubStep === 'library' && (
              <MediaSelector
                selectedMediaIds={selectedMediaIds}
                onSelectionChange={setSelectedMediaIds}
                uploadedMedia={uploadedMedia}
                onUploadRequest={() => setMediaSubStep('upload')}
              />
            )}
          </div>
        )}

        {step === "caption" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
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
            <div className="hidden lg:block sticky top-6 self-start">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Preview</h3>
              <PlatformPreview
                platform={(selectedPlatforms[0] as any) || 'instagram'}
                caption={caption}
                mediaUrls={selectedMediaUrls}
              />
              <p className="text-xs text-center text-gray-400 mt-2">
                Previewing for {selectedPlatforms[0] || 'Instagram'}
              </p>
              {selectedPlatforms.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {selectedPlatforms.map(p => (
                    <button
                      key={p}
                      className="h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-600"
                      title={`Preview ${p}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "schedule" && (
          <div className="max-w-3xl mx-auto space-y-8">
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
            onEdit={(editStep) => setStep(editStep)}
            onPublish={handlePublish}
            isPublishing={isSubmitting}
            publishingStatus={publishingStatus}
            uploadedMedia={uploadedMedia}
          />
        )}
      </div>

      {/* Navigation Footer for Steps */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {step !== 'review' && (
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="px-8 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step
          </button>
        )}
      </div>

      {showDraftsModal && (
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
              // navigate to step if valid
              if (content.step) setStep(content.step);

              if (content.tiktokDisableDuet !== undefined) setTiktokDisableDuet(content.tiktokDisableDuet);
              if (content.tiktokDisableStitch !== undefined) setTiktokDisableStitch(content.tiktokDisableStitch);
              if (content.tiktokDisableComment !== undefined) setTiktokDisableComment(content.tiktokDisableComment);
              if (content.tiktokScheduleTime) setTiktokScheduleTime(content.tiktokScheduleTime);

              setDraftId(d.id);
              toast.success('Draft restored');
            }
          }}
          onDiscard={async (id) => {
            try { await deleteDraft.mutate(id); } catch (e) { }
          }}
        />
      )}

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
    </div>
  );
}
