import React, { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  Loader2,
  FileText,
  AlertCircle,
  Maximize2,
  Minimize2,
  Layers,
  FileCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadPdfJsLibrary } from '@/components/PdfThumbnail'

interface PdfDocumentViewerProps {
  url: string
  title?: string
  fileName?: string
  className?: string
}

export default function PdfDocumentViewer({
  url,
  title,
  fileName,
  className = '',
}: PdfDocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.15)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single')
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const allPagesContainerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)

  // 1. Load the PDF document via PDF.js with graceful fallback
  useEffect(() => {
    let isCancelled = false
    setLoading(true)
    setError(null)
    setNumPages(0)
    setCurrentPage(1)
    setUseIframeFallback(false)

    if (!url) {
      setLoading(false)
      setError('URL do documento não fornecida.')
      return
    }

    loadPdfJsLibrary()
      .then((pdfjs) => {
        if (isCancelled) return null
        const loadingTask = pdfjs.getDocument({
          url,
          withCredentials: false,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        })
        return loadingTask.promise
      })
      .then((pdfDoc) => {
        if (isCancelled || !pdfDoc) return
        pdfDocRef.current = pdfDoc
        setNumPages(pdfDoc.numPages)
        setLoading(false)
      })
      .catch((err) => {
        if (isCancelled) return
        console.warn('PDF.js inline rendering failed, falling back to embedded viewer:', err)
        setUseIframeFallback(true)
        setLoading(false)
      })

    return () => {
      isCancelled = true
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // ignore
        }
      }
    }
  }, [url])

  // 2. Render Single Page Mode
  useEffect(() => {
    if (
      useIframeFallback ||
      viewMode !== 'single' ||
      !pdfDocRef.current ||
      !canvasRef.current ||
      numPages === 0
    ) {
      return
    }

    let isCancelled = false
    const pdf = pdfDocRef.current
    const canvas = canvasRef.current

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel()
      } catch {
        // ignore
      }
    }

    pdf
      .getPage(currentPage)
      .then((page: any) => {
        if (isCancelled || !canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Compute viewport with scale and rotation
        const viewport = page.getViewport({ scale, rotation })
        const pixelRatio = window.devicePixelRatio || 1.5

        canvas.width = Math.floor(viewport.width * pixelRatio)
        canvas.height = Math.floor(viewport.height * pixelRatio)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        const renderContext = {
          canvasContext: ctx,
          viewport,
        }

        const renderTask = page.render(renderContext)
        renderTaskRef.current = renderTask

        return renderTask.promise
      })
      .catch((err: any) => {
        if (err?.name === 'RenderingCancelledException') return
        console.error('Error rendering single page:', err)
      })

    return () => {
      isCancelled = true
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // ignore
        }
      }
    }
  }, [useIframeFallback, viewMode, currentPage, scale, rotation, numPages])

  // 3. Render All Pages Mode (continuous scroll)
  useEffect(() => {
    if (
      useIframeFallback ||
      viewMode !== 'all' ||
      !pdfDocRef.current ||
      !allPagesContainerRef.current ||
      numPages === 0
    ) {
      return
    }

    let isCancelled = false
    const pdf = pdfDocRef.current
    const container = allPagesContainerRef.current
    container.innerHTML = ''

    const renderAllPages = async () => {
      for (let i = 1; i <= numPages; i++) {
        if (isCancelled) break
        try {
          const page = await pdf.getPage(i)
          if (isCancelled) break

          const pageWrapper = document.createElement('div')
          pageWrapper.className =
            'relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/60 transition-all mb-6 max-w-full'

          const pageBadge = document.createElement('div')
          pageBadge.className =
            'absolute top-3 left-3 z-10 bg-slate-950/85 text-[#F5D77F] text-[11px] font-black px-2.5 py-1 rounded-lg border border-[#D4AF37]/50 shadow-md backdrop-blur-md'
          pageBadge.textContent = `Página ${i} de ${numPages}`
          pageWrapper.appendChild(pageBadge)

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) continue

          const viewport = page.getViewport({ scale: scale * 0.95, rotation })
          const pixelRatio = window.devicePixelRatio || 1.5

          canvas.width = Math.floor(viewport.width * pixelRatio)
          canvas.height = Math.floor(viewport.height * pixelRatio)
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`
          canvas.className = 'block mx-auto'

          ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          pageWrapper.appendChild(canvas)
          container.appendChild(pageWrapper)

          const renderTask = page.render({
            canvasContext: ctx,
            viewport,
          })
          await renderTask.promise
        } catch (err: any) {
          if (err?.name === 'RenderingCancelledException') break
          console.error(`Error rendering page ${i}:`, err)
        }
      }
    }

    renderAllPages()

    return () => {
      isCancelled = true
    }
  }, [useIframeFallback, viewMode, scale, rotation, numPages])

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1))
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {})
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {})
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#050D1A] rounded-2xl border border-slate-800 text-white overflow-hidden shadow-2xl ${
        isFullscreen ? 'p-4 h-screen w-screen z-50 fixed inset-0' : className
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3.5 bg-[#0A1A33] border-b border-slate-800">
        {/* Left: View Mode Toggle & Page navigation (single mode) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!useIframeFallback && numPages > 0 && (
            <div className="flex items-center bg-[#061020] rounded-xl p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'single'
                    ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Página por página com navegação interativa"
              >
                Página {currentPage}/{numPages}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'all'
                    ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Visualizar todas as páginas em rolagem contínua"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todas ({numPages})</span>
              </button>
            </div>
          )}

          {!useIframeFallback && viewMode === 'single' && numPages > 0 && (
            <div className="flex items-center gap-1 bg-[#061020] px-2 py-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                aria-label="Página anterior"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-xs text-[#F5D77F] min-w-[60px] text-center">
                {currentPage} / {numPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                aria-label="Próxima página"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Zoom, Rotate, Fullscreen & External actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
          {!useIframeFallback && (
            <>
              <div className="flex items-center bg-[#061020] rounded-xl p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.6}
                  title="Diminuir Zoom"
                  aria-label="Diminuir Zoom"
                  className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-slate-200"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-slate-300 px-1.5 min-w-[38px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 2.5}
                  title="Aumentar Zoom"
                  aria-label="Aumentar Zoom"
                  className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-30 text-slate-200"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleRotate}
                title="Girar 90°"
                aria-label="Girar página"
                className="w-7 h-7 bg-[#061020] border border-slate-800 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-200"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            aria-label="Alternar tela cheia"
            className="w-7 h-7 bg-[#061020] border border-slate-800 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-200"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir em nova aba do navegador"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-slate-700 rounded-xl text-slate-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Navegador</span>
          </a>

          <a
            href={url}
            download={fileName || title || 'documento.pdf'}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 rounded-xl shadow transition-colors"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Baixar PDF</span>
          </a>
        </div>
      </div>

      {/* Main Canvas Viewer / Document Container */}
      <div className="relative flex-1 min-h-[420px] max-h-[75vh] overflow-auto bg-[#040A14] flex items-center justify-center p-3 sm:p-6 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
            <p className="text-sm font-bold text-slate-200">Carregando apresentação em PDF...</p>
            <p className="text-xs text-slate-400">Renderizando páginas com alta nitidez</p>
          </div>
        )}

        {/* Fallback to Native Embed Iframe if PDF.js fails */}
        {!loading && useIframeFallback && (
          <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-800 bg-white">
            <iframe
              src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
              title={title || 'Visualizador PDF'}
              className="w-full h-full border-0"
            />
          </div>
        )}

        {error && !loading && !useIframeFallback && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md space-y-3 bg-[#0A1A33] rounded-2xl border border-slate-800">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <h4 className="font-bold text-sm text-white">Visualização Direta Indisponível</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Abrir no Navegador
                </Button>
              </a>
              <a href={url} download={fileName || title || 'documento.pdf'}>
                <Button
                  size="sm"
                  className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar Arquivo
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Mode: Single Page */}
        {!loading && !error && !useIframeFallback && viewMode === 'single' && (
          <div className="relative inline-block max-w-full my-auto transition-all">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-white">
              <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
            </div>

            {/* Floating bottom pagination controller with direct Quick Page Selector */}
            {numPages > 1 && (
              <div className="sticky bottom-3 mt-4 flex flex-wrap items-center justify-center gap-2 z-20">
                <div className="bg-[#0A1A33]/95 backdrop-blur-md px-4 py-2 rounded-full border border-[#D4AF37]/40 shadow-2xl flex items-center gap-2 text-xs">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="h-7 px-2.5 text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <span className="font-black text-[#F5D77F] text-xs px-2 min-w-[75px] text-center">
                    Página {currentPage} de {numPages}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleNextPage}
                    disabled={currentPage >= numPages}
                    className="h-7 px-2.5 text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-30"
                  >
                    Próxima <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className="bg-[#061020]/95 hover:bg-[#D4AF37] hover:text-slate-950 text-slate-200 border border-[#D4AF37]/40 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Ver todas ({numPages}) em rolagem</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode: All Pages Continuous Scroll */}
        {!loading && !error && !useIframeFallback && viewMode === 'all' && (
          <div ref={allPagesContainerRef} className="w-full flex flex-col items-center py-2" />
        )}
      </div>

      {/* Footer info bar */}
      <div className="px-4 py-2.5 bg-[#061020] border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 truncate max-w-md">
          <FileText className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
          <span className="font-semibold text-slate-200 truncate">
            {title || fileName || 'Documento PDF'}
          </span>
        </div>
        {!useIframeFallback && numPages > 0 && (
          <div className="text-[11px] text-slate-300 font-medium">
            Total de <span className="text-[#F5D77F] font-bold">{numPages} página(s)</span>{' '}
            renderizadas inline
          </div>
        )}
      </div>
    </div>
  )
}
