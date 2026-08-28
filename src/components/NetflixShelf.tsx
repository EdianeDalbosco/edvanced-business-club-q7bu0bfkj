import React, { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NetflixShelfProps {
  title: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  children: React.ReactNode
  className?: string
}

export default function NetflixShelf({
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  children,
  className = '',
}: NetflixShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [children])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section className={`relative group/shelf space-y-3 ${className}`}>
      {/* Header da Prateleira */}
      <div className="flex items-end justify-between px-1">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F5D77F] border border-[#D4AF37]/35">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-300/80 line-clamp-1">{subtitle}</p>}
          </div>
        </div>

        {action && (
          <div>
            {action.href ? (
              <a
                href={action.href}
                className="text-xs font-semibold text-[#D4AF37] hover:text-[#F5D77F] hover:underline flex items-center gap-1 transition-colors"
              >
                <span>{action.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="text-xs font-semibold text-[#D4AF37] hover:text-[#F5D77F] hover:underline flex items-center gap-1 transition-colors"
              >
                <span>{action.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Container de rolagem horizontal com controles de seta estilo Netflix */}
      <div className="relative">
        {/* Seta Esquerda */}
        <button
          type="button"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Rolar para esquerda"
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-28 bg-[#061224]/90 hover:bg-[#0A1E3F] text-white rounded-r-xl border-y border-r border-[#D4AF37]/30 flex items-center justify-center backdrop-blur-md shadow-2xl transition-all duration-300 opacity-0 group-hover/shelf:opacity-100 disabled:pointer-events-none disabled:opacity-0 ${
            canScrollLeft ? 'cursor-pointer' : 'hidden'
          }`}
        >
          <ChevronLeft className="w-6 h-6 text-[#D4AF37]" />
        </button>

        {/* Linha de Cards com Scroll Horizontal */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-2 px-1 scroll-smooth no-scrollbar select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        {/* Seta Direita */}
        <button
          type="button"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Rolar para direita"
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-28 bg-[#061224]/90 hover:bg-[#0A1E3F] text-white rounded-l-xl border-y border-l border-[#D4AF37]/30 flex items-center justify-center backdrop-blur-md shadow-2xl transition-all duration-300 opacity-0 group-hover/shelf:opacity-100 disabled:pointer-events-none disabled:opacity-0 ${
            canScrollRight ? 'cursor-pointer' : 'hidden'
          }`}
        >
          <ChevronRight className="w-6 h-6 text-[#D4AF37]" />
        </button>
      </div>
    </section>
  )
}
