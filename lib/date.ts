import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateString?: string, fallback = 'N/A') {
  if (!dateString) return fallback;
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(date)) return fallback;
  return format(date, 'PPpp');
}
