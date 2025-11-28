'use client';

import Link from "next/link";
import { useIntegrations, type Integration } from "@/app/(tenant)/hooks/useIntegrations";

type PlatformSelectorProps = {
  selectedPlatforms: string[];
  onSelectionChange: (platforms: string[]) => void;
};

const AVAILABLE_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "facebook", name: "Facebook", icon: "👥" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
];

export default function PlatformSelector({
  selectedPlatforms,
  onSelectionChange,
}: PlatformSelectorProps) {
  const { data: integrationsData, isLoading } = useIntegrations();

  // Ensure integrations is always an array
  const integrations = Array.isArray(integrationsData) ? integrationsData : [];

  // Create a map of platform connections
  const platformConnections = new Map<string, boolean>();
  integrations.forEach((integration: Integration) => {
    platformConnections.set(integration.platform.toLowerCase(), integration.connected);
  });

  const togglePlatform = (platformId: string) => {
    const isConnected = platformConnections.get(platformId) ?? false;
    if (!isConnected) {
      return; // Don't allow selecting unconnected platforms
    }

    if (selectedPlatforms.includes(platformId)) {
      onSelectionChange(selectedPlatforms.filter((p) => p !== platformId));
    } else {
      onSelectionChange([...selectedPlatforms, platformId]);
    }
  };

  const selectAll = () => {
    const connectedPlatforms = AVAILABLE_PLATFORMS.filter(
      (p) => platformConnections.get(p.id) === true
    ).map((p) => p.id);
    onSelectionChange(connectedPlatforms);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const connectedCount = AVAILABLE_PLATFORMS.filter(
    (p) => platformConnections.get(p.id) === true
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (connectedCount === 0) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
        <p className="text-sm font-semibold text-orange-900">No platforms connected</p>
        <p className="mt-2 text-xs text-orange-700">
          Please connect at least one platform to create posts.
        </p>
        <Link
          href="/app/integrations"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
        >
          Connect Platforms
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Select Platforms</h2>
          <p className="mt-1 text-xs text-gray-500">
            {selectedPlatforms.length} of {connectedCount} connected platforms selected
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_PLATFORMS.map((platform) => {
          const isConnected = platformConnections.get(platform.id) ?? false;
          const isSelected = selectedPlatforms.includes(platform.id);
          const isDisabled = !isConnected;

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => {
                if (isDisabled) {
                  // Show modal or toast for unconnected platforms
                  return;
                }
                togglePlatform(platform.id);
              }}
              disabled={isDisabled}
              className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg ring-4 ring-primary/20 scale-[1.02]"
                  : isDisabled
                  ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md hover:scale-[1.01]"
              }`}
              aria-label={`${isSelected ? "Deselect" : "Select"} ${platform.name}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{platform.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {isConnected ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          <p className="text-xs font-medium text-green-700">Connected</p>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-gray-400" />
                          <p className="text-xs text-gray-500">Not connected</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              {!isConnected && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Link
                    href="/app/integrations"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition"
                  >
                    <span>Connect {platform.name}</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedPlatforms.length === 0 && (
        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-orange-900">Platform selection required</p>
              <p className="mt-0.5 text-xs text-orange-700">Please select at least one platform to continue</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

