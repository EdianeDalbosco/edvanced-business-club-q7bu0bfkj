import React, { useEffect, useRef, useState } from 'react'
import { FileText, Loader2, Sparkles } from 'lucide-react'

declare global {
  interface Window {
    pdfjsLib?: any
  }
}

let pdfjsLoadingPromise: Promise<any> | null = null

export function loadPdfJsLibrary(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window undefined'))
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib)
  if (pdfjsLoadingPromise) return pdfjsLoadingPromise

  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    // Check if already in DOM
    const existing = document.querySelector('script[data-pdfjs="true"]') as HTMLScriptElement
    if (existing) {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib)
        return
      }
      existing.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          resolve(window.pdfjsLib)
        } else {
          reject(new Error('PDF.js failed'))
        }
      })
      return
    }

    const script = document.createElement('script')
    script.setAttribute('data-pdfjs', 'true')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.async = true
    script.onload = () => {
      try {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          resolve(window.pdfjsLib)
        } else {
          reject(new Error('PDF.js failed to initialize'))
        }
      } catch (err) {
        reject(err)
      }
    }
    script.onerror = () => reject(new Error('Failed to load PDF.js script'))
    document.head.appendChild(script)
  })

  return pdfjsLoadingPromise
}

interface PdfThumbnailProps {
  url: string
  title?: string
  className?: string
  aspectRatio?: string
  showBadge?: boolean
}

// In-memory cache for rendered data URLs to avoid re-rendering canvases on every re-render
const thumbnailCache = new Map<string, string>()

export default function PdfThumbnail({
  url,
  title,
  className = '',
  showBadge = true,
}: PdfThumbnailProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(() => thumbnailCache.get(url) || null)
  const [loading, setLoading] = useState<boolean>(!thumbUrl && !!url)
  const [error, setError] = useState<boolean>(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }

    if (thumbnailCache.has(url)) {
      setThumbUrl(thumbnailCache.get(url)!)
      setLoading(false)
      return
    }

    let isCancelled = false
    setLoading(true)
    setError(false)

    loadPdfJsLibrary()
      .then((pdfjs) => {
        if (isCancelled) return null
        const task = pdfjs.getDocument({
          url,
          withCredentials: false,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        })
        return task.promise
      })
      .then(async (pdfDoc) => {
        if (isCancelled || !pdfDoc) return
        const page = await pdfDoc.getPage(1)
        if (isCancelled) return

        // Render page 1 to an offscreen/internal canvas
        const viewport = page.getViewport({ scale: 1.0 })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Standard thumbnail dimensions
        const targetWidth = 400
        const scale = targetWidth / viewport.width
        const scaledViewport = page.getViewport({ scale })

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport,
        }

        await page.render(renderContext).promise
        if (isCancelled) return

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        thumbnailCache.set(url, dataUrl)
        setThumbUrl(dataUrl)
        setLoading(false)
      })
      .catch((err) => {
        if (isCancelled) return
        console.warn('Could not generate PDF thumbnail, falling back to icon cover:', err)
        setError(true)
        setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [url])

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0B1E38] via-[#061020] to-[#040A14] flex items-center justify-center select-none ${className}`}
    >
      {/* Hidden reference canvas if needed */}
      <canvas ref={canvasRef} className="hidden" />

      {thumbUrl ? (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
          <img
            src={thumbUrl}
            alt={title || 'Prévia da Apresentação'}
            className="w-full h-full object-cover object-top filter brightness-95 group-hover:brightness-105"
          />
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33]/90 via-transparent to-black/20" />
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Gerando capa do PDF...
          </span>
        </div>
      ) : (
        /* Fallback when rendering is unsupported or offline */
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D77F] mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-[#D4AF37]/10">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#F5D77F]">
            Slides / Apresentação
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">Leitor de PDF Integrado</span>
        </div>
      )}

      {/* Presentation Badge overlay if requested */}
      {showBadge && (
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D4AF37] text-slate-950 shadow-md">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            PDF / Slides
          </span>
        </div>
      )}
    </div>
  )
}
