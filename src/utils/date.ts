import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isSameMonth,
  isSameYear,
  isThisYear,
  isToday,
  isYesterday,
} from "date-fns";

/**
 * Formats two Date objects into a human-readable range.
 * Examples:
 *  - Oct 20-22, 2025
 *  - Sep 30 - Oct 2, 2025
 *  - Dec 30, 2025 - Jan 2, 2026
 */
export function formatDateRange(startDate?: Date, endDate?: Date): string {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error("Both startDate and endDate must be valid Date objects.");
  }

  const sameMonth = isSameMonth(startDate, endDate);
  const sameYear = isSameYear(startDate, endDate);

  if (sameMonth && sameYear) {
    // Example: Oct 20-22, 2025
    return `${format(startDate, "MMM d")}-${format(endDate, "d, yyyy")}`;
  }

  if (sameYear) {
    // Example: Sep 30 - Oct 2, 2025
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  // Example: Dec 30, 2025 - Jan 2, 2026
  return `${format(startDate, "MMM d, yyyy")} - ${format(
    endDate,
    "MMM d, yyyy"
  )}`;
}

/**
 * Formats a date with smart UX rules:
 * - "3:45 PM" if it's today
 * - "Yesterday, 3:45 PM" if it's yesterday
 * - "Oct 20, 3:45 PM" if it's this year
 * - "Oct 20, 2024, 3:45 PM" if it's from another year
 */

export function formatSmartDate(dateInput?: Date | string): string {
  if (!dateInput) return "";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInMinutes = differenceInMinutes(now, date);
  const diffInHours = differenceInHours(now, date);
  const diffInDays = differenceInDays(now, date);

  const isMidnight =
    date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;

  // ⏱️ Relative time for recent events
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  if (diffInHours < 6 && isToday(date)) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  // 📅 Same day
  if (isToday(date)) {
    // if it's exactly midnight, just show the date
    return isMidnight ? "Today" : format(date, "h:mm a");
  }

  // 📅 Yesterday
  if (isYesterday(date)) {
    return isMidnight ? "Yesterday" : `Yesterday, ${format(date, "h:mm a")}`;
  }

  // 📆 Within the past week
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  // 📆 This year
  if (isThisYear(date)) {
    return format(date, isMidnight ? "MMM d" : "MMM d, h:mm a");
  }

  // 📆 Older than this year
  return format(date, isMidnight ? "MMM d, yyyy" : "MMM d, yyyy, h:mm a");
}
