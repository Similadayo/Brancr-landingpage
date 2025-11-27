'use client';

import { useState } from "react";
import { tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";

type SchedulePickerProps = {
  value: string | null; // ISO datetime string or null for "publish now"
  onChange: (value: string | null) => void;
  selectedPlatforms: string[];
};

export default function SchedulePicker({
  value,
  onChange,
  selectedPlatforms,
}: SchedulePickerProps) {
  const [showOptimalTimes, setShowOptimalTimes] = useState(false);
  const [optimalTimes, setOptimalTimes] = useState<Array<{ at: string; score: number }>>([]);
  const [isLoadingOptimalTimes, setIsLoadingOptimalTimes] = useState(false);

  const publishNow = value === null;
  const scheduledDate = value ? new Date(value) : new Date();

  // Convert to local datetime string for input
  const localDateTimeString = scheduledDate
    ? new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localValue = e.target.value;
    if (!localValue) {
      onChange(null);
      return;
    }

    // Convert local datetime to ISO string
    const local = new Date(localValue);
    const iso = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
    onChange(iso);
  };

  const handlePublishNowToggle = () => {
    if (publishNow) {
      // Switch to scheduling - set to 1 hour from now
      const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
      const iso = oneHourLater.toISOString();
      onChange(iso);
    } else {
      onChange(null);
    }
  };

  const loadOptimalTimes = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select platforms first");
      return;
    }

    try {
      setIsLoadingOptimalTimes(true);
      const date = scheduledDate.toISOString().split("T")[0];
      const res = await tenantApi.optimalTimes({ platforms: selectedPlatforms, date });
      setOptimalTimes(res.times || []);
      setShowOptimalTimes(true);
    } catch (error) {
      toast.error("Failed to load optimal times");
      setOptimalTimes([]);
    } finally {
      setIsLoadingOptimalTimes(false);
    }
  };

  const selectOptimalTime = (timeString: string) => {
    onChange(timeString);
    setShowOptimalTimes(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>

      {/* Publish Now Toggle */}
      <div className="flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={handlePublishNowToggle}
            className="h-5 w-5 rounded border-2 border-gray-300 text-primary transition focus:ring-2 focus:ring-primary/20"
            aria-label="Publish now or schedule for later"
          />
          <div>
            <span className="text-sm font-semibold text-gray-900">Publish Now</span>
            <p className="text-xs text-gray-500">Post immediately to all selected platforms</p>
          </div>
        </label>
      </div>

      {/* Date/Time Picker */}
      {!publishNow && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={localDateTimeString}
              onChange={handleDateTimeChange}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <span>Your timezone:</span>
              <span className="font-semibold text-gray-700">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </p>
          </div>

          {/* Optimal Times */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOptimalTimes}
                  onChange={(e) => {
                    setShowOptimalTimes(e.target.checked);
                    if (e.target.checked && optimalTimes.length === 0) {
                      void loadOptimalTimes();
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-semibold text-gray-900">Show Optimal Times</span>
              </label>
              <button
                type="button"
                onClick={() => void loadOptimalTimes()}
                disabled={isLoadingOptimalTimes || selectedPlatforms.length === 0}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {isLoadingOptimalTimes ? "Loading..." : "Refresh"}
              </button>
            </div>

            {showOptimalTimes && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {optimalTimes.length === 0 ? (
                  <p className="text-center text-xs text-gray-500">
                    {isLoadingOptimalTimes
                      ? "Loading optimal times..."
                      : "No optimal times available. Select a date and click Refresh."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Best times for engagement (click to select):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {optimalTimes.slice(0, 6).map((time) => {
                        const date = new Date(time.at);
                        const local = new Date(
                          date.getTime() - date.getTimezoneOffset() * 60000
                        );
                        const displayTime = local.toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <button
                            key={time.at}
                            type="button"
                            onClick={() => selectOptimalTime(time.at)}
                            title={`Engagement score: ${Math.round(time.score * 100)}%`}
                            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                          >
                            {displayTime} ({Math.round(time.score * 100)}%)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          Current Selection
        </p>
        <p className="mt-2 text-sm font-semibold text-gray-900">
          {publishNow
            ? "Publish immediately"
            : scheduledDate.toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
        </p>
      </div>
    </div>
  );
}

