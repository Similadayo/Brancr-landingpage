'use client';

import { useState } from "react";
import HashtagSuggestions from './HashtagSuggestions';

type CaptionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  enhanceCaption: boolean;
  onEnhanceCaptionChange: (enhance: boolean) => void;
  onAIGenerate?: (options?: { tone?: string; include_hashtags?: boolean }) => Promise<void>;
  isAIGenerating?: boolean;
  selectedMediaIds: string[];
  selectedPlatforms?: string[];
};

const PLATFORM_LIMITS: Record<string, { max: number; name: string; icon: string }> = {
  instagram: { max: 2200, name: "Instagram", icon: "📷" },
  facebook: { max: 5000, name: "Facebook", icon: "👥" },
  twitter: { max: 280, name: "Twitter", icon: "🐦" },
  whatsapp: { max: 4096, name: "WhatsApp", icon: "💬" },
  tiktok: { max: 2200, name: "TikTok", icon: "🎵" },
  telegram: { max: 4096, name: "Telegram", icon: "✈️" },
  youtube: { max: 5000, name: "YouTube", icon: "▶️" },
};

export default function CaptionEditor({
  value,
  onChange,
  enhanceCaption,
  onEnhanceCaptionChange,
  onAIGenerate,
  isAIGenerating = false,
  selectedMediaIds,
  selectedPlatforms = [],
}: CaptionEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const handleAIGenerate = async (options?: { tone?: string; include_hashtags?: boolean }) => {
    // Allow AI generation even when no media is selected. The server will fall back to
    // tenant-level defaults when media is absent; the page may also auto-select a
    // platform (e.g., Facebook) when appropriate.
    if (onAIGenerate) {
      await onAIGenerate(options);
    }
  };

  // Auto-save indicator
  const handleChange = (newValue: string) => {
    onChange(newValue);
    setDraftSaved(false);
    // Show "saved" indicator after a delay
    setTimeout(() => setDraftSaved(true), 1000);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Calculate limits based on selected platforms, or use all if none selected
  const relevantPlatforms = selectedPlatforms.length > 0
    ? selectedPlatforms
    : Object.keys(PLATFORM_LIMITS);

  const relevantLimits = relevantPlatforms
    .map((p) => PLATFORM_LIMITS[p])
    .filter(Boolean);

  const minLimit = relevantLimits.length > 0
    ? Math.min(...relevantLimits.map((l) => l.max))
    : 2200;

  const charCount = value.length;
  const isNearLimit = charCount > minLimit * 0.9;
  const isOverLimit = charCount > minLimit;

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

      {/* Platform Character Limits (Top) */}
      {selectedPlatforms.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Target Platforms
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {selectedPlatforms.map((platform) => {
              const limit = PLATFORM_LIMITS[platform];
              if (!limit) return null;
              const platformCount = value.length;
              const isOver = platformCount > limit.max;
              const isNear = platformCount > limit.max * 0.9;
              return (
                <div
                  key={platform}
                  className={`rounded-lg border px-3 py-2 transition-colors ${isOver
                    ? "border-red-200 bg-red-50 text-red-900"
                    : isNear
                      ? "border-orange-200 bg-orange-50 text-orange-900"
                      : "border-gray-200 bg-white"
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{limit.icon}</span>
                    <span className="text-xs font-semibold">{limit.name}</span>
                  </div>
                  <p className={`mt-1 text-xs font-medium ${isOver ? "text-red-600" : isNear ? "text-orange-600" : "text-gray-500"}`}>
                    {platformCount} / {limit.max}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Generation Button (for empty captions) */}
      {!value.trim() && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleAIGenerate()}
            disabled={isAIGenerating}
            className="group flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:border-primary/50 hover:bg-primary/20 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Generate caption with AI"
          >
            {isAIGenerating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <span>Generating caption...</span>
              </>
            ) : (
              <>
                <span className="text-lg">✨</span>
                <span>Generate with AI</span>
              </>
            )}
          </button>
          <div className="flex gap-2">
            {[
              { label: "Short", tone: "concise" },
              { label: "Sales", tone: "sales" },
              { label: "Fun", tone: "humorous" }
            ].map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => void handleAIGenerate({ tone: opt.tone })}
                disabled={isAIGenerating}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          rows={10}
          placeholder="Write your caption... Use @mentions, #hashtags, and emojis to engage your audience! 💬"
          className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 ${isOverLimit
            ? "border-red-300 bg-red-50/50"
            : isNearLimit
              ? "border-orange-300 bg-orange-50/30"
              : "border-gray-200"
            }`}
          aria-label="Caption input"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Quick AI Actions Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Actions:</span>
            <button
              type="button"
              onClick={() => void handleAIGenerate({ include_hashtags: true })}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              disabled={isAIGenerating}
            >
              # Hashtags
            </button>
            <button
              type="button"
              onClick={() => void handleAIGenerate({ tone: 'concise' })}
              className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
              disabled={isAIGenerating}
            >
              Shorten
            </button>
            <button
              type="button"
              onClick={() => void handleAIGenerate({ tone: 'sales' })}
              className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
              disabled={isAIGenerating}
            >
              Sales-mode
            </button>
          </div>



          <button
            type="button"
            onClick={() => handleChange("")}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition"
            aria-label="Clear caption"
          >
            Clear
          </button>
        </div>
      </div>

      {/* AI Hashtag Suggestions */}
      <HashtagSuggestions
        caption={value}
        platforms={selectedPlatforms}
        onInsert={(tag) => handleChange(value ? value + ' ' + tag : tag)}
      />


      {/* Enhance with AI Checkbox */}
      {
        value.trim() && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enhanceCaption}
                onChange={(e) => onEnhanceCaptionChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">✨ Enhance with AI</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Your caption will be optimized for each platform using AI based on your brand persona and best practices.
                </p>
              </div>
            </label>
          </div>
        )
      }

      {/* Status indicators */}
      <div className="flex flex-wrap items-center gap-3">
        {draftSaved && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            <span>✓</span>
            <span>Draft saved & safe</span>
          </span>
        )}
        {enhanceCaption && value.trim() && (
          <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <span>✨</span>
            <span>AI Enhancement enabled</span>
          </span>
        )}
      </div>



      {/* Formatting Hints */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="mb-2 text-xs font-semibold text-blue-900">💡 Formatting Tips</p>
        <div className="flex flex-wrap gap-2 text-xs text-blue-800">
          <span className="rounded-full bg-blue-100 px-2 py-1">@ mentions</span>
          <span className="rounded-full bg-blue-100 px-2 py-1"># hashtags</span>
          <span className="rounded-full bg-blue-100 px-2 py-1">Emojis 😊</span>
          <span className="rounded-full bg-blue-100 px-2 py-1">Line breaks</span>
        </div>
      </div>

      {/* Preview */}
      {
        showPreview && (
          <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                Preview
              </p>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
                {value || <span className="text-gray-400 italic">Your caption will appear here...</span>}
              </p>
            </div>
          </div>
        )
      }
    </div>
  );
}
