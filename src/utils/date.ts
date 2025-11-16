import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  formatRelative,
  isSameMonth,
  isSameYear,
  isThisYear,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
/**
 * Formats two Date objects into a human-readable range.
 * Examples:
 *  - Oct 20-22, 2025
 *  - Sep 30 - Oct 2, 2025
 *  - Dec 30, 2025 - Jan 2, 2026
 *  - "Ongoing" if no dates provided
 */
export function formatDateRange(startDate?: Date | string | null, endDate?: Date | string | null): string {
  // Handle null, undefined, or invalid dates
  if (!startDate && !endDate) {
    return "Ongoing";
  }

  // Parse dates if they are strings
  const start = startDate ? (typeof startDate === 'string' ? new Date(startDate) : startDate) : null;
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : null;

  // Handle partial date ranges
  if (!start && end && end instanceof Date && !isNaN(end.getTime())) {
    return `Until ${format(end, "MMM d, yyyy")}`;
  }

  if (start && start instanceof Date && !isNaN(start.getTime()) && !end) {
    return `From ${format(start, "MMM d, yyyy")}`;
  }

  // Both dates must be valid Date objects
  if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Ongoing";
  }

  const sameMonth = isSameMonth(start, end);
  const sameYear = isSameYear(start, end);

  if (sameMonth && sameYear) {
    // Example: Oct 20-22, 2025
    return `${format(start, "MMM d")}-${format(end, "d, yyyy")}`;
  }

  if (sameYear) {
    // Example: Sep 30 - Oct 2, 2025
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }

  // Example: Dec 30, 2025 - Jan 2, 2026
  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

/**
 * Formats a date with smart UX rules:
 * - "3:45 PM" if it's today
 * - "Yesterday, 3:45 PM" if it's yesterday
 * - "Oct 20, 3:45 PM" if it's this year
 * - "Oct 20, 2024, 3:45 PM" if it's from another year
 */

// Add the necessary import from 'date-fns-tz'

// ... (Keep the other date-fns imports) ...

export const formatRelativeDate = (
  createdAt: string | Date | null | undefined
) => {
  if (!createdAt) {
    return null;
  }
  return formatRelative(
    typeof createdAt === "string" ? parseISO(createdAt) : createdAt,
    new Date()
  );
};

export function formatSmartDate(dateInput?: Date | string): string {
  if (!dateInput) return "";

  let date: Date;
  let targetTz: string;

  // 1. Determine the correct Date object and the target timezone
  if (typeof dateInput === "string" && !dateInput.endsWith("Z")) {
    // Treat naive string as UTC for correct parsing
    date = new Date(dateInput + "Z");
  } else {
    date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  }

  // Use the local system's timezone as the conversion target for display
  // eslint-disable-next-line prefer-const
  targetTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (isNaN(date.getTime())) return "";

  // 2. Perform all calculations and formatting using timezone-aware functions

  // Get the zoned date objects for correct comparison and calculation
  const zonedDate = toZonedTime(date, targetTz);
  const zonedNow = toZonedTime(new Date(), targetTz); // Ensure 'now' is also zoned

  const diffInMinutes = differenceInMinutes(zonedNow, zonedDate);
  const diffInHours = differenceInHours(zonedNow, zonedDate);
  const diffInDays = differenceInDays(zonedNow, zonedDate);

  // Use the zoned date for all checks
  const isMidnight =
    zonedDate.getHours() === 0 &&
    zonedDate.getMinutes() === 0 &&
    zonedDate.getSeconds() === 0;

  // Helper function for timezone-aware formatting
  const formatZoned = (date: Date, formatStr: string) =>
    formatInTimeZone(date, targetTz, formatStr);

  // ⏱️ Relative time for recent events (Logic remains the same)
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  if (diffInHours < 6 && isToday(zonedDate)) {
    // Use isToday on zonedDate
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  // 📅 Same day
  if (isToday(zonedDate)) {
    return isMidnight ? "Today" : formatZoned(zonedDate, "h:mm a");
  }

  // 📅 Yesterday
  if (isYesterday(zonedDate)) {
    return isMidnight
      ? "Yesterday"
      : `Yesterday, ${formatZoned(zonedDate, "h:mm a")}`;
  }

  // 📆 Within the past week
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  // 📆 This year
  if (isThisYear(zonedDate)) {
    return formatZoned(zonedDate, isMidnight ? "MMM d" : "MMM d, h:mm a");
  }

  // 📆 Older than this year
  return formatZoned(
    zonedDate,
    isMidnight ? "MMM d, yyyy" : "MMM d, yyyy, h:mm a"
  );
}
