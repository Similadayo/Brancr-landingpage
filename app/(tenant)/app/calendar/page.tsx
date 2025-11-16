'use client';

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import { useScheduledPosts } from "@/app/(tenant)/hooks/useScheduledPosts";

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

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;

  // Try calendar API; fall back to scheduled posts
  const { data: calendarData } = useQuery({
    queryKey: ["calendar", monthKey],
    queryFn: () =>
      tenantApi.calendar({
        start_date: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-01`,
        end_date: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-31`,
      }),
    retry: 0,
  });
  const { data: scheduledPosts = [] } = useScheduledPosts();

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Array<{ id?: string; name: string; platforms: string[] }>>();
    if (calendarData?.entries) {
      calendarData.entries.forEach((e) => {
        const key = e.date;
        const list = map.get(key) || [];
        list.push({ id: undefined, name: e.name, platforms: e.platforms });
        map.set(key, list);
      });
    } else {
      scheduledPosts.forEach((p) => {
        const d = new Date(p.scheduled_at);
        const key = d.toISOString().slice(0, 10);
        const list = map.get(key) || [];
        list.push({ id: p.id, name: p.name, platforms: p.platforms });
        map.set(key, list);
      });
    }
    return map;
  }, [calendarData, scheduledPosts]);

  const monthCells = getMonthMatrix(cursor);
  const monthName = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900">Content Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-700">{monthName}</span>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            Next
          </button>
        </div>
      </header>

      <section className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="rounded-xl bg-gray-50 p-2 text-center text-xs font-semibold text-gray-600">
            {d}
          </div>
        ))}
        {monthCells.map((d, idx) => {
          const key = d.toISOString().slice(0, 10);
          const items = entriesByDate.get(key) || [];
          const isCurrentMonth = d.getMonth() === cursor.getMonth();
          return (
            <div
              key={`${key}-${idx}`}
              className={`min-h-[120px] rounded-xl border p-2 ${isCurrentMonth ? "bg-white" : "bg-gray-50"} border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">
                  {d.getDate()}
                </span>
                {items.length > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                    {items.length}
                  </span>
                ) : null}
              </div>
              <div
                className="mt-2 space-y-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  const postId = e.dataTransfer.getData("text/post-id");
                  const time = e.dataTransfer.getData("text/scheduled-time") || "09:00:00";
                  if (postId) {
                    // Construct ISO at local timezone date + original time
                    const dt = new Date(`${key}T${time}`);
                    const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
                    try {
                      const { tenantApi } = await import("@/lib/api");
                      await tenantApi.updateScheduledPost(postId, { scheduled_at: iso });
                    } catch {}
                  }
                }}
              >
                {items.slice(0, 3).map((it, i) => {
                  const draggable = Boolean(it.id);
                  return (
                    <div
                      key={i}
                      draggable={draggable}
                      onDragStart={(e) => {
                        if (!draggable) return;
                        e.dataTransfer.setData("text/post-id", it.id as string);
                        // preserve original time 09:00 default (client-only best effort)
                        e.dataTransfer.setData("text/scheduled-time", "09:00:00");
                      }}
                      className="truncate rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                      title={draggable ? "Drag to another day to reschedule" : undefined}
                    >
                      {it.name}
                    </div>
                  );
                })}
                {items.length > 3 ? (
                  <div className="text-xs text-gray-400">+{items.length - 3} more</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}


