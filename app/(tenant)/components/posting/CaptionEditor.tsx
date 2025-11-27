'use client';

import { useState } from "react";

type CaptionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate: () => Promise<void>;
  isAIGenerating: boolean;
  selectedMediaIds: string[];
  isAIGenerated?: boolean;
};

const PLATFORM_LIMITS: Record<string, { max: number; name: string }> = {
  instagram: { max: 2200, name: "Instagram" },
  facebook: { max: 5000, name: "Facebook" },
  twitter: { max: 280, name: "Twitter" },
};

export default function CaptionEditor({
  value,
  onChange,
  onAIGenerate,
  isAIGenerating,
  selectedMediaIds,
  isAIGenerated = false,
}: CaptionEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [captionContext, setCaptionContext] = useState("");

  const handleAIGenerate = async () => {
    if (selectedMediaIds.length === 0) {
      return;
    }
    await onAIGenerate();
  };

  const maxLength = Math.min(...Object.values(PLATFORM_LIMITS).map((l) => l.max));
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Write Caption</h2>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {/* AI Generation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleAIGenerate()}
          disabled={isAIGenerating || selectedMediaIds.length === 0}
          className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAIGenerating ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              Generating...
            </>
          ) : (
            <>
              ✨ Generate with AI
            </>
          )}
        </button>
        {isAIGenerated && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            ✨ AI Generated
          </span>
        )}
        {selectedMediaIds.length === 0 && (
          <span className="text-xs text-gray-500">Select media first to generate caption</span>
        )}
      </div>

      {/* Caption Input */}
      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          placeholder="Write your caption... Use hashtags, mentions, etc."
          className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            isNearLimit ? "border-orange-300" : ""
          }`}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              {charCount} / {maxLength} characters
            </span>
            {isNearLimit && (
              <span className="text-orange-600">Approaching character limit</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Platform Hints */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          Platform Limits
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PLATFORM_LIMITS).map(([platform, limit]) => (
            <span
              key={platform}
              className="rounded-lg bg-white px-2 py-1 text-xs text-gray-600"
            >
              {limit.name}: {limit.max} chars
            </span>
          ))}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Preview
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="whitespace-pre-line text-sm text-gray-700">{value || "Your caption will appear here..."}</p>
          </div>
        </div>
      )}
    </div>
  );
}

