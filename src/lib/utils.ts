import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  // JPY (Japanese Yen) uses the symbol ¥
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  PHP: "₱",
};

/**
 * Retrieves the symbol for a given currency code.
 * @param {string} currencyCode - The three-letter ISO currency code (e.g., 'JPY', 'USD').
 * @returns {string} The currency symbol or the code itself if the symbol is not found.
 */
export const getCurrencySymbol = (currencyCode?: string | undefined | null) => {
  if (!currencyCode) {
    return "₱";
  }

  // Ensure the code is uppercase for consistent lookup
  const code = currencyCode ? currencyCode.toUpperCase() : "";

  // Return the symbol if it exists, otherwise return the code
  return CURRENCY_SYMBOLS[code] || code;
};
