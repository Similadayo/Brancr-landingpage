'use client';

import { useState } from "react";
import { tenantApi } from "@/lib/api";
import { ClockIcon } from "@/app/(tenant)/components/icons";
import { toast } from "react-hot-toast";
import { Switch } from "../ui/Switch";
import Calendar from "@/app/(tenant)/components/ui/Calendar";
import { format, addDays, setHours, setMinutes, startOfHour, addHours, isSameDay } from "date-fns";
import QuickTimePresets from './QuickTimePresets';

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
          <Switch
            checked={publishNow}
            onChange={handlePublishNowToggle}
            size="md"
            activeColor="bg-primary"
          />
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
            <div className="space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Quick Select</label>
                <QuickTimePresets onSelect={(val) => {
                  if (val === 'now') {
                    onChange(null); // null means "now" in some contexts, or handle logic
                  } else {
                    onChange(val.toISOString());
                  }
                }} />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Time</label>
                  <div className="flex items-center gap-2">
                    {/* Hour Input */}
                    <div className="relative flex-1 min-w-[70px]">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={format(scheduledDate, 'h')}
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) return;

                          // Handle 12-hour logic
                          if (val < 1) val = 1;
                          if (val > 12) val = 12;

                          const currentHours = scheduledDate.getHours();
                          const isPM = currentHours >= 12;

                          let newHours = val;
                          if (val === 12) {
                            newHours = isPM ? 12 : 0;
                          } else {
                            newHours = isPM ? val + 12 : val;
                          }

                          const updated = new Date(scheduledDate);
                          updated.setHours(newHours);
                          onChange(updated.toISOString());
                        }}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-3 text-center text-base font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <span className="absolute right-2 top-3.5 text-xs text-gray-400 pointer-events-none">Hr</span>
                    </div>

                    <span className="text-gray-400 font-bold">:</span>

                    {/* Minute Input */}
                    <div className="relative flex-1 min-w-[70px]">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={format(scheduledDate, 'mm')}
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) return;
                          if (val < 0) val = 0;
                          if (val > 59) val = 59;

                          const updated = new Date(scheduledDate);
                          updated.setMinutes(val);
                          onChange(updated.toISOString());
                        }}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-3 text-center text-base font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <span className="absolute right-2 top-3.5 text-xs text-gray-400 pointer-events-none">Min</span>
                    </div>

                    {/* AM/PM Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentHours = scheduledDate.getHours();
                        const updated = new Date(scheduledDate);

                        // Toggle logic
                        if (currentHours >= 12) {
                          updated.setHours(currentHours - 12); // PM -> AM
                        } else {
                          updated.setHours(currentHours + 12); // AM -> PM
                        }
                        onChange(updated.toISOString());
                      }}
                      className="flex-1 min-w-[70px] rounded-xl border border-gray-200 bg-gray-100 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 hover:border-gray-300 transition-colors"
                    >
                      {format(scheduledDate, 'a')}
                    </button>
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
                  <Switch
                    checked={false}
                    onChange={() => { }}
                    disabled={true}
                    size="sm"
                  />
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
