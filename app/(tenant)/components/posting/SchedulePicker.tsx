'use client';

import { useState } from "react";
import { tenantApi } from "@/lib/api";
import { ClockIcon } from "@/app/(tenant)/components/icons";
import { toast } from "react-hot-toast";
import Calendar from "@/app/(tenant)/components/ui/Calendar";
import { format, addDays, setHours, setMinutes, startOfHour, addHours, isSameDay } from "date-fns";

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
  const [isRecurring, setIsRecurring] = useState(false); // Placeholder

  const publishNow = value === null;
  const scheduledDate = value ? new Date(value) : new Date();

  // Helper to update just the date part
  const handleDateSelect = (newDate: Date) => {
    const current = new Date(scheduledDate);
    const updated = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      current.getHours(),
      current.getMinutes()
    );
    onChange(updated.toISOString());
  };

  // Helper to update just the time part
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const updated = setMinutes(setHours(scheduledDate, hours), minutes);
    onChange(updated.toISOString());
  };

  const handleQuickTime = (type: 'tomorrow_morning' | 'tomorrow_evening' | 'next_monday') => {
    let base = new Date();
    if (type === 'tomorrow_morning') {
      base = addDays(base, 1);
      base = setHours(base, 9);
      base = setMinutes(base, 0);
    } else if (type === 'tomorrow_evening') {
      base = addDays(base, 1);
      base = setHours(base, 18);
      base = setMinutes(base, 0);
    } else if (type === 'next_monday') {
      // Find next monday
      const day = base.getDay();
      const diff = day === 0 ? 1 : 8 - day; // If Sun (0) -> +1. If Mon (1) -> +7 (next week).
      base = addDays(base, diff);
      base = setHours(base, 9);
      base = setMinutes(base, 0);
    }
    onChange(base.toISOString());
  };

  const handlePublishNowToggle = () => {
    if (publishNow) {
      // Default to 1 hour from now, rounded to start of next hour
      const nextHour = startOfHour(addHours(new Date(), 1));
      onChange(nextHour.toISOString());
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Schedule Post</h2>
        <div className="text-sm text-gray-500">
          {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div>
      </div>

      {/* Publish Now Card */}
      <div className={`transition-all duration-300 rounded-xl border p-5 shadow-sm ${publishNow
        ? 'bg-primary/5 border-primary ring-1 ring-primary'
        : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className={`text-base font-semibold ${publishNow ? 'text-primary' : 'text-gray-900'}`}>
              Publish Immediately
            </span>
            <span className="text-sm text-gray-500">
              Post will go live as soon as you click Publish
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={publishNow}
            onClick={handlePublishNowToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${publishNow ? 'bg-primary' : 'bg-gray-200'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${publishNow ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Scheduling Options */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${!publishNow ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-50'
        }`}>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-8">

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Calendar */}
            <div>
              <label className="mb-4 block text-sm font-semibold text-gray-700">Select Date</label>
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                <Calendar
                  selectedDate={scheduledDate}
                  onDateSelect={handleDateSelect}
                  minDate={new Date()}
                />
              </div>
            </div>

            {/* Right Column: Time & Presets */}
            <div className="space-y-6">
              <div>
                <label className="mb-4 block text-sm font-semibold text-gray-700">Select Time</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={format(scheduledDate, 'HH:mm')}
                      onChange={handleTimeChange}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pl-10 text-base text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                    <ClockIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-3 rounded-xl border border-gray-200">
                    {format(scheduledDate, 'a')}
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="mb-3 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Pick</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleQuickTime('tomorrow_morning')} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">
                    Tomorrow 9 AM
                  </button>
                  <button type="button" onClick={() => handleQuickTime('tomorrow_evening')} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">
                    Tomorrow 6 PM
                  </button>
                  <button type="button" onClick={() => handleQuickTime('next_monday')} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">
                    Next Monday
                  </button>
                </div>
              </div>

              {/* Recurring Toggle (Placeholder) */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between opacity-60 cursor-not-allowed" title="Recurring posts coming soon">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Recurring Post</span>
                    <p className="text-xs text-gray-500">Repeat this post daily or weekly</p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors focus:outline-none"
                  >
                    <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                  </button>
                </div>
                <p className="text-[10px] text-primary mt-1 font-medium">✨ Coming soon in Pro plan</p>
              </div>
            </div>
          </div>

          {/* Optimal Times Section */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Best times for engagement</span>
              <button
                type="button"
                onClick={() => void loadOptimalTimes()}
                disabled={isLoadingOptimalTimes || selectedPlatforms.length === 0}
                className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
              >
                {isLoadingOptimalTimes ? "Analyzing..." : "Refresh Insights"}
              </button>
            </div>

            {!showOptimalTimes && optimalTimes.length === 0 ? (
              <button
                type="button"
                onClick={() => void loadOptimalTimes()}
                disabled={selectedPlatforms.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 text-sm text-gray-500 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                <span className="text-lg">✨</span>
                <span>Analyze best time to post</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {isLoadingOptimalTimes ? (
                  <div className="col-span-full py-8 text-center">
                    <span className="animate-pulse text-sm text-gray-500">Finding optimal times...</span>
                  </div>
                ) : optimalTimes.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-sm text-gray-500">No data available for selected date.</div>
                ) : (
                  optimalTimes.slice(0, 6).map((time) => {
                    const date = new Date(time.at);
                    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                    const timeStr = format(local, 'h:mm a');

                    return (
                      <button
                        key={time.at}
                        type="button"
                        onClick={() => selectOptimalTime(time.at)}
                        className="group relative flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-3 shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md"
                      >
                        <span className="text-xs font-bold text-gray-900 group-hover:text-primary">{timeStr}</span>
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-[9px] font-bold text-green-700 opacity-0 scale-75 transition-all group-hover:opacity-100 group-hover:scale-100">
                          {Math.round(time.score * 10)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      {!publishNow && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100 flex items-center justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {format(scheduledDate, 'EEEE, MMMM do')}
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                at {format(scheduledDate, 'h:mm a')}
              </p>
            </div>
          </div>
          <div className="text-xs text-blue-400 font-medium px-2 py-1 bg-white/50 rounded">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>
      )}
    </div>
  );
}
