'use client';

import { useQuery } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";

export type CalendarEntry = {
  id: string;
  date: string;
  time?: string | null;
  name: string;
  platforms: string[];
  status: string;
  media_count?: number;
};

export function useCalendar(params?: { start_date?: string; end_date?: string; platform?: string }) {
  return useQuery<CalendarEntry[], Error>({
    queryKey: ["calendar", params],
    queryFn: async () => {
      try {
        const response = await tenantApi.calendar(params);
        const entries = response?.entries;
        return Array.isArray(entries) ? entries : [];
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });
}

