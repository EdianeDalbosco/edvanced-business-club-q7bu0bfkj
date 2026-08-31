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

export type DetectedMaterialCategory = 'photo' | 'video' | 'document'
export type DetailedMaterialSubtype =
  | 'photo'
  | 'video'
  | 'pdf'
  | 'excel'
  | 'word'
  | 'powerpoint'
  | 'document'

/**
 * Detects the category ('photo' | 'video' | 'document') and subtype of a file or URL
 * by evaluating both MIME type and file extension (name/url fallback).
 */
export function detectMaterialKind(fileOrName?: { name?: string; type?: string } | string | null): {
  category: DetectedMaterialCategory
  subtype: DetailedMaterialSubtype
  label: string
  shortLabel: string
} {
  if (!fileOrName) {
    return {
      category: 'document',
      subtype: 'document',
      label: 'Documento',
      shortLabel: 'Doc',
    }
  }

  const name = typeof fileOrName === 'string' ? fileOrName : fileOrName.name || ''
  const mime = (
    typeof fileOrName === 'object' && fileOrName !== null ? fileOrName.type || '' : ''
  ).toLowerCase()
  const lowerName = name.toLowerCase()

  // 1. Images
  const imageExtensions = /\.(jpg|jpeg|png|webp|gif|svg|bmp|avif|ico|tiff?|heic|heif)$/i
  const isImageMime = mime.startsWith('image/')
  const isImageExt = imageExtensions.test(lowerName)

  if (isImageMime || isImageExt) {
    return {
      category: 'photo',
      subtype: 'photo',
      label: 'Foto',
      shortLabel: 'Foto',
    }
  }

  // 2. Videos
  const videoExtensions = /\.(mp4|webm|mov|avi|mpeg|mpg|mkv|m4v|3gp|wmv|flv|ogv)$/i
  const isVideoMime = mime.startsWith('video/')
  const isVideoExt = videoExtensions.test(lowerName)

  if (isVideoMime || isVideoExt) {
    return {
      category: 'video',
      subtype: 'video',
      label: 'Vídeo',
      shortLabel: 'Vídeo',
    }
  }

  // 3. Excel / Spreadsheets
  const excelExtensions = /\.(xlsx|xls|csv|ods)$/i
  const isExcelMime =
    mime === 'application/vnd.ms-excel' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'text/csv' ||
    mime === 'application/csv' ||
    mime.includes('spreadsheet')
  const isExcelExt = excelExtensions.test(lowerName)

  if (isExcelMime || isExcelExt) {
    return {
      category: 'document',
      subtype: 'excel',
      label: 'Planilha',
      shortLabel: 'Planilha',
    }
  }

  // 4. PDF
  const isPdfMime = mime === 'application/pdf'
  const isPdfExt = /\.pdf$/i.test(lowerName)

  if (isPdfMime || isPdfExt) {
    return {
      category: 'document',
      subtype: 'pdf',
      label: 'PDF/Documento',
      shortLabel: 'PDF',
    }
  }

  // 5. PowerPoint / Presentations
  const pptExtensions = /\.(pptx|ppt|pps|ppsx|odp)$/i
  const isPptMime =
    mime === 'application/vnd.ms-powerpoint' ||
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.slideshow' ||
    mime.includes('presentation')
  const isPptExt = pptExtensions.test(lowerName)

  if (isPptMime || isPptExt) {
    return {
      category: 'document',
      subtype: 'powerpoint',
      label: 'Apresentação',
      shortLabel: 'Slides',
    }
  }

  // 6. Word / Text Docs
  const wordExtensions = /\.(docx|doc|rtf|odt|txt)$/i
  const isWordMime =
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime.includes('wordprocessingml') ||
    mime.includes('msword')
  const isWordExt = wordExtensions.test(lowerName)

  if (isWordMime || isWordExt) {
    return {
      category: 'document',
      subtype: 'word',
      label: 'Documento',
      shortLabel: 'Doc',
    }
  }

  // Default fallback
  return {
    category: 'document',
    subtype: 'document',
    label: 'Documento',
    shortLabel: 'Doc',
  }
}
