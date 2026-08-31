import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { loadPdfJsLibrary } from '@/components/PdfThumbnail'

interface PdfDocumentViewerProps {
  url: string
  title?: string
  fileName?: string
  className?: string
  initialPage?: number
  onPageChange?: (page: number) => void
}

interface PageAspect {
  aspectRatio: number
  width: number
  height: number
}

export default function PdfDocumentViewer({
  url,
  title,
  fileName,
  className = '',
  initialPage = 1,
  onPageChange,
}: PdfDocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [zoom, setZoom] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [renderingPage, setRenderingPage] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single')

  // Cache of aspect ratios and native dimensions per page
  const [pageAspects, setPageAspects] = useState<Record<number, PageAspect>>({})

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pdfDocRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)
  const continuousCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const continuousRenderTasks = useRef<Map<number, any>>(new Map())

  // 1. Load PDF Document and calculate aspect ratios for all pages
  useEffect(() => {
    if (!url) {
      setError('URL do documento não fornecida.')
      setLoading(false)
      return
    }

    let isCancelled = false
    setLoading(true)
    setError(null)
    setCurrentPage(initialPage)

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
      .then(async (pdfDoc) => {
        if (isCancelled || !pdfDoc) return
        pdfDocRef.current = pdfDoc
        const total = pdfDoc.numPages
        setNumPages(total)

        // Read aspect ratio and unrotated dimensions for all pages
        const aspects: Record<number, PageAspect> = {}
        for (let i = 1; i <= total; i++) {
          try {
            const p = await pdfDoc.getPage(i)
            const vp = p.getViewport({ scale: 1.0 })
            const ar = vp.height > 0 ? vp.width / vp.height : 1.7777
            aspects[i] = {
              aspectRatio: ar,
              width: vp.width,
              height: vp.height,
            }
          } catch (e) {
            console.warn(`Erro ao ler dimensões da página ${i}:`, e)
            aspects[i] = { aspectRatio: 16 / 9, width: 1920, height: 1080 }
          }
        }

        if (!isCancelled) {
          setPageAspects(aspects)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isCancelled) return
        console.error('Erro ao carregar PDF:', err)
        setError(
          'Não foi possível renderizar o arquivo PDF no visualizador inline. Use o botão abaixo para baixar ou abrir diretamente.',
        )
        setLoading(false)
      })

    return () => {
      isCancelled = true
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy()
        } catch {
          /* ignore */
        }
        pdfDocRef.current = null
      }
    }
  }, [url])

  // Helper to compute effective aspect ratio under rotation
  const getEffectiveAspectRatio = useCallback(
    (pageNum: number, rot: number) => {
      const base = pageAspects[pageNum]
      if (!base) return 16 / 9
      const isSwapped = ((rot % 180) + 180) % 180 === 90
      return isSwapped ? 1 / base.aspectRatio : base.aspectRatio
    },
    [pageAspects],
  )

  // 2. Render Single Page Mode
  const renderSinglePage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDocRef.current || !canvasRef.current) return
      setRenderingPage(true)

      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch {
            /* ignore cancellation */
          }
        }

        const page = await pdfDocRef.current.getPage(pageNumber)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        // Compute viewport with rotation
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation })
        const effectiveAR =
          unscaledViewport.height > 0 ? unscaledViewport.width / unscaledViewport.height : 16 / 9

        // Crisp rendering buffer with devicePixelRatio
        const dpr = window.devicePixelRatio || 1
        const containerWidth = containerRef.current?.clientWidth || 900
        // Base scale matches container or default 1000px, multiplied by zoom
        const baseTargetWidth = Math.min(Math.max(containerWidth - 32, 480), 1600)
        const scale = (baseTargetWidth / unscaledViewport.width) * zoom

        const scaledViewport = page.getViewport({ scale, rotation })

        // Internal buffer resolution (multiplied by dpr for high sharpness)
        canvas.width = Math.floor(scaledViewport.width * dpr)
        canvas.height = Math.floor(scaledViewport.height * dpr)

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined

        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport,
          transform,
        }

        const renderTask = page.render(renderContext)
        renderTaskRef.current = renderTask
        await renderTask.promise
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Erro ao renderizar página do PDF:', err)
        }
      } finally {
        setRenderingPage(false)
      }
    },
    [rotation, zoom],
  )

  // Trigger render when in single page mode
  useEffect(() => {
    if (!loading && !error && numPages > 0 && viewMode === 'single') {
      renderSinglePage(currentPage)
    }
  }, [loading, error, numPages, currentPage, zoom, rotation, viewMode, renderSinglePage])

  // 3. Render Continuous Mode Pages
  const renderContinuousPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDocRef.current || !canvas) return

      try {
        const existingTask = continuousRenderTasks.current.get(pageNumber)
        if (existingTask) {
          try {
            existingTask.cancel()
          } catch {
            /* ignore */
          }
        }

        const page = await pdfDocRef.current.getPage(pageNumber)
        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        const unscaledViewport = page.getViewport({ scale: 1.0, rotation })
        const dpr = window.devicePixelRatio || 1
        const containerWidth = containerRef.current?.clientWidth || 900
        const baseTargetWidth = Math.min(Math.max(containerWidth - 48, 480), 1600)
        const scale = (baseTargetWidth / unscaledViewport.width) * zoom

        const scaledViewport = page.getViewport({ scale, rotation })

        canvas.width = Math.floor(scaledViewport.width * dpr)
        canvas.height = Math.floor(scaledViewport.height * dpr)

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined

        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport,
          transform,
        }

        const task = page.render(renderContext)
        continuousRenderTasks.current.set(pageNumber, task)
        await task.promise
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Erro na página contínua ${pageNumber}:`, err)
        }
      }
    },
    [rotation, zoom],
  )

  // Trigger continuous renders
  useEffect(() => {
    if (!loading && !error && numPages > 0 && viewMode === 'continuous') {
      for (let i = 1; i <= numPages; i++) {
        const c = continuousCanvasRefs.current.get(i)
        if (c) {
          renderContinuousPage(i, c)
        }
      }
    }
  }, [loading, error, numPages, viewMode, zoom, rotation, renderContinuousPage])

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const p = currentPage - 1
      setCurrentPage(p)
      onPageChange?.(p)
    }
  }

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const p = currentPage + 1
      setCurrentPage(p)
      onPageChange?.(p)
    }
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3.0))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.6))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen(true))
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => setIsFullscreen(false))
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Current effective aspect ratio for single-page mode
  const currentEffectiveAspectRatio = getEffectiveAspectRatio(currentPage, rotation)

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl overflow-hidden bg-[#061020] border border-slate-800 flex flex-col transition-all shadow-2xl select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' : ''
      } ${className}`}
    >
      {/* 1. TOP TOOLBAR CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 bg-[#0A1A33]/95 border-b border-slate-800 text-white backdrop-blur-md z-20">
        {/* Left: Document details and page mode */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#B89324] p-[1.5px] flex items-center justify-center shadow-xs flex-shrink-0">
            <div className="w-full h-full bg-[#061020] rounded-[10px] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#F5D77F]" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {title || 'Apresentação em PDF'}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-300 font-medium">
                {numPages > 0
                  ? viewMode === 'single'
                    ? `Slide ${currentPage} de ${numPages}`
                    : `${numPages} slides (Rolagem Contínua)`
                  : 'Carregando documento...'}
              </span>
              {currentEffectiveAspectRatio >= 1.5 && (
                <Badge className="bg-[#D4AF37]/20 text-[#F5D77F] border border-[#D4AF37]/40 text-[8px] font-black uppercase px-1.5 py-0">
                  16:9 Widescreen
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Center: Page Switcher & View Mode Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Mode switch: Single vs All */}
          <div className="flex items-center bg-[#061020] p-1 rounded-xl border border-slate-700/80 mr-1">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                viewMode === 'single'
                  ? 'bg-[#D4AF37] text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Slide
            </button>
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                viewMode === 'continuous'
                  ? 'bg-[#D4AF37] text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Todas ({numPages})</span>
            </button>
          </div>

          {/* Navigation for Single Mode */}
          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-[#061020] px-1.5 py-1 rounded-xl border border-slate-700/80">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || loading}
                className="h-7 w-7 p-0 text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-30"
                title="Página Anterior (Seta Esquerda)"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-xs font-bold text-[#F5D77F] px-1.5 whitespace-nowrap min-w-[50px] text-center">
                {currentPage} / {numPages || 1}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || loading}
                className="h-7 w-7 p-0 text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-30"
                title="Próxima Página (Seta Direita)"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Zoom, Rotation, Fullscreen & Download */}
        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-0.5 bg-[#061020] px-1.5 py-1 rounded-xl border border-slate-700/80">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6 || loading}
              className="h-7 w-7 p-0 text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-30"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-bold text-slate-300 px-1 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3.0 || loading}
              className="h-7 w-7 p-0 text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-30"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Rotate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            disabled={loading}
            className="h-8 w-8 p-0 bg-[#061020] border border-slate-700/80 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl"
            title="Girar 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 bg-[#061020] border border-slate-700/80 text-[#F5D77F] hover:text-white hover:bg-white/10 rounded-xl"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Apresentação / Tela Cheia'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Download */}
          <a
            href={url}
            download={fileName || title || 'documento.pdf'}
            target="_blank"
            rel="noreferrer"
          >
            <Button
              size="sm"
              className="h-8 px-3 bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Baixar PDF</span>
            </Button>
          </a>
        </div>
      </div>

      {/* 2. MAIN VIEWER CANVAS / STAGE AREA */}
      <div
        className={`relative flex-1 bg-[#030914] flex items-center justify-center p-3 sm:p-6 overflow-auto min-h-[380px] md:min-h-[480px] ${
          isFullscreen ? 'h-[calc(100vh-70px)]' : 'max-h-[78vh]'
        }`}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#F5D77F]">
              Carregando slides em alta resolução...
            </p>
            <p className="text-[11px] text-slate-400">
              Processando camadas e proporções do documento
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {error && !loading && (
          <div className="p-8 text-center max-w-md space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-300">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm">
                Visualização Inline Indisponível
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-black text-xs uppercase px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir em Nova Aba</span>
                </Button>
              </a>
              <a href={url} download={fileName || 'documento.pdf'}>
                <Button
                  variant="outline"
                  className="border-slate-700 bg-white/5 text-slate-200 text-xs rounded-xl"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Baixar Arquivo</span>
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Mode 1: Single Page Stage (Aspect-Ratio Preserved Canvas Container) */}
        {!loading && !error && viewMode === 'single' && (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <div
              className="relative flex items-center justify-center max-w-full max-h-[72vh] mx-auto transition-all shadow-2xl rounded-2xl overflow-hidden bg-black/40 border border-slate-800/80"
              style={{
                aspectRatio: `${currentEffectiveAspectRatio}`,
                width: 'auto',
                height: 'auto',
              }}
            >
              {renderingPage && (
                <div className="absolute inset-0 bg-[#061020]/60 backdrop-blur-xs flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="block max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl transition-transform"
                style={{
                  aspectRatio: `${currentEffectiveAspectRatio}`,
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              />
            </div>
          </div>
        )}

        {/* Mode 2: Continuous Scroll (Each Page Has Its Own Exact Aspect-Ratio Container) */}
        {!loading && !error && viewMode === 'continuous' && (
          <div className="w-full max-w-5xl mx-auto space-y-8 py-4 px-2">
            {Array.from({ length: numPages }).map((_, idx) => {
              const pageNumber = idx + 1
              const effectiveAR = getEffectiveAspectRatio(pageNumber, rotation)

              return (
                <div
                  key={pageNumber}
                  className="space-y-2 flex flex-col items-center justify-center"
                >
                  <div className="flex items-center justify-between w-full max-w-4xl px-2 text-[11px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5 text-[#F5D77F] font-bold">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      Slide {pageNumber} de {numPages}
                    </span>
                    {effectiveAR >= 1.5 && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        16:9 Landscape
                      </span>
                    )}
                  </div>

                  {/* Individual page container with exact aspect ratio */}
                  <div
                    className="relative w-full max-w-4xl flex items-center justify-center bg-black/50 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
                    style={{
                      aspectRatio: `${effectiveAR}`,
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  >
                    <canvas
                      ref={(el) => {
                        if (el) {
                          continuousCanvasRefs.current.set(pageNumber, el)
                        } else {
                          continuousCanvasRefs.current.delete(pageNumber)
                        }
                      }}
                      className="block w-full h-auto object-contain rounded-xl shadow-xl"
                      style={{
                        aspectRatio: `${effectiveAR}`,
                        width: '100%',
                        height: 'auto',
                        maxWidth: '100%',
                        maxHeight: '100%',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. BOTTOM FOOTER BAR (Slide indicators and quick actions) */}
      {!loading && !error && numPages > 1 && viewMode === 'single' && (
        <div className="p-3 bg-[#0A1A33]/90 border-t border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="h-7 text-xs border-slate-700 bg-white/5 text-slate-200 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="h-7 text-xs border-slate-700 bg-white/5 text-slate-200 hover:text-white"
            >
              Próximo
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {/* Slide Indicator Dots (Quick jump if less than 25 slides) */}
          {numPages <= 25 ? (
            <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-md py-1">
              {Array.from({ length: numPages }).map((_, idx) => {
                const pageNum = idx + 1
                const isCurrent = pageNum === currentPage
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum)
                      onPageChange?.(pageNum)
                    }}
                    title={`Ir para Slide ${pageNum}`}
                    className={`h-2.5 rounded-full transition-all ${
                      isCurrent
                        ? 'w-6 bg-[#D4AF37] shadow-sm shadow-[#D4AF37]/50'
                        : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                )
              })}
            </div>
          ) : (
            <span className="text-[11px] font-bold text-slate-400">
              Use as setas para navegar entre os {numPages} slides
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {Math.round(zoom * 100)}% zoom
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-7 text-xs text-[#F5D77F] hover:text-white"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Projetar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
