/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a Brazilian phone number string for display.
 * Accepts numbers with 10 digits (DD + 8 digits) or 11 digits (DD + 9 digits),
 * or with country code 55 (12 or 13 digits).
 * Handles raw digits, partial input, and previously formatted strings.
 * Examples:
 *   "65981003969" -> "(65) 98100-3969"
 *   "5565981003969" -> "(65) 98100-3969"
 *   "1133334444" -> "(11) 3333-4444"
 */
export function formatPhone(value?: string | null): string {
  if (!value) return ''

  // Extract all digits
  let digits = value.replace(/\D/g, '')

  // If starts with Brazilian country code 55 and length is 12 or 13, strip 55 for standard national display
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2)
  }

  // Cap at 11 digits (DDD + 9 digits)
  digits = digits.slice(0, 11)

  if (digits.length === 0) {
    return ''
  }

  if (digits.length <= 2) {
    return `(${digits}`
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    // 8 digits phone: (DD) NNNN-NNNN
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  // 11 digits phone: (DD) NNNNN-NNNN
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Normalizes a phone number to only digits before saving to the backend
 * (preserving only numbers to avoid breaking WhatsApp wa.me links).
 * Example: "(65) 98100-3969" -> "65981003969"
 */
export function normalizePhone(value?: string | null): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}
