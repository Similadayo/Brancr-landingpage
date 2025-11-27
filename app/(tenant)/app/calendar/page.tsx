'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import { useScheduledPosts } from "@/app/(tenant)/hooks/useScheduledPosts";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
  XIcon,
  RocketIcon,
} from "../../components/icons";

type ViewMode = "month" | "week" | "day";

function getMonthMatrix(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDay = start.getDay();
  const daysInMonth = end.getDate();
  const cells: Array<Date> = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), i - startDay + 1));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(date.getFullYear(), date.getMonth(), d));
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return cells;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;

  // Fetch calendar data
  const { data: calendarData } = useQuery({
    queryKey: ["calendar", monthKey],
    queryFn: () =>
      tenantApi.calendar({
        start_date: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-01`,
        end_date: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-31`,
      }),
    retry: 0,
  });
  const { data: scheduledPostsData } = useScheduledPosts();
  const scheduledPosts = Array.isArray(scheduledPostsData) ? scheduledPostsData : [];

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Array<{ id?: string; name: string; platforms: string[]; time?: string; status?: string }>>();
    const entries = calendarData?.entries;
    if (Array.isArray(entries) && entries.length > 0) {
      entries.forEach((e) => {
        const key = e.date;
        const list = map.get(key) || [];
        list.push({
          id: e.id,
          name: e.name,
          platforms: Array.isArray(e.platforms) ? e.platforms : [],
          time: e.time || undefined,
          status: e.status,
        });
        map.set(key, list);
      });
    } else {
      scheduledPosts.forEach((p) => {
        const d = new Date(p.scheduled_at);
        const key = d.toISOString().slice(0, 10);
        const list = map.get(key) || [];
        list.push({
          id: p.id,
          name: p.name,
          platforms: Array.isArray(p.platforms) ? p.platforms : [],
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: p.status,
        });
        map.set(key, list);
      });
    }
    return map;
  }, [calendarData, scheduledPosts]);

  const monthCells = getMonthMatrix(cursor);
  const monthName = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const navigateMonth = (direction: "prev" | "next") => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + (direction === "next" ? 1 : -1), 1));
  };

  const goToToday = () => {
    setCursor(new Date());
  };

  const selectedDateKey = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;
  const selectedDatePosts = selectedDateKey ? entriesByDate.get(selectedDateKey) || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Content Calendar</h1>
            <p className="mt-1 text-sm text-gray-600">Plan and schedule your content across all platforms</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/app/posts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105"
          >
            <PlusIcon className="w-4 h-4" />
            Schedule Post
          </Link>
        </div>
      </header>

      {/* Navigation and View Toggle */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth("prev")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-primary hover:text-primary"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth("next")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-primary hover:text-primary"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <h2 className="ml-4 text-lg font-semibold text-gray-900">{monthName}</h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(["month", "week", "day"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === mode
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === "month" && (
        <section className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="rounded-lg bg-gray-50 p-2 text-center text-xs font-semibold text-gray-600">
              {d}
            </div>
          ))}
          {/* Calendar Cells */}
          {monthCells.map((d, idx) => {
            const key = d.toISOString().slice(0, 10);
            const items = entriesByDate.get(key) || [];
            const isCurrentMonth = d.getMonth() === cursor.getMonth();
            const isTodayDate = isToday(d);

            return (
              <div
                key={`${key}-${idx}`}
                onClick={() => {
                  if (isCurrentMonth) {
                    setSelectedDate(d);
                  }
                }}
                className={`min-h-[120px] cursor-pointer rounded-lg border-2 p-2 transition ${
                  isCurrentMonth
                    ? isTodayDate
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                    : "border-gray-100 bg-gray-50 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      isTodayDate ? "text-primary" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {items.length > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((it, i) => {
                    const draggable = Boolean(it.id);
                    return (
                      <div
                        key={i}
                        draggable={draggable}
                        onDragStart={(e) => {
                          if (!draggable) return;
                          e.dataTransfer.setData("text/post-id", it.id as string);
                          e.dataTransfer.setData("text/scheduled-time", it.time || "09:00:00");
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        className="group truncate rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 transition hover:border-primary hover:bg-primary/5"
                        title={draggable ? "Drag to reschedule" : it.name}
                      >
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{it.name}</span>
                        </div>
                      </div>
                    );
                  })}
                  {items.length > 3 && (
                    <div className="text-xs font-medium text-gray-500">+{items.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Week View Placeholder */}
      {viewMode === "week" && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Week View</p>
          <p className="mt-1 text-xs text-gray-500">Week view coming soon</p>
        </div>
      )}

      {/* Day View Placeholder */}
      {viewMode === "day" && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Day View</p>
          <p className="mt-1 text-xs text-gray-500">Day view coming soon</p>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedDatePosts.length} post{selectedDatePosts.length !== 1 ? "s" : ""} scheduled
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedDatePosts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <RocketIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">No posts scheduled</p>
                  <p className="mt-1 text-xs text-gray-500">Schedule a post for this day</p>
                  <Link
                    href="/app/posts/new"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create Post
                  </Link>
                </div>
              ) : (
                selectedDatePosts.map((post, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-primary/50 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{post.name}</h3>
                        {post.status && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              post.status === "scheduled"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : post.status === "posted"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-gray-200 bg-gray-50 text-gray-600"
                            }`}
                          >
                            {post.status}
                          </span>
                        )}
                      </div>
                      {post.time && (
                        <p className="mt-1 text-xs text-gray-500">
                          Scheduled for {post.time}
                        </p>
                      )}
                      {post.platforms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {post.id && (
                      <Link
                        href={`/app/campaigns/${post.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                      >
                        View
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Close
              </button>
              <Link
                href="/app/posts/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
              >
                <PlusIcon className="w-4 h-4" />
                Schedule Post
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
