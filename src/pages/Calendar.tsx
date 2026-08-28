import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  MapPin,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Users,
  CalendarPlus,
  Sparkles,
  Tag,
  Clock,
  Layers,
  Info,
} from 'lucide-react'
import { downloadICSFile } from '@/lib/ics'
import { useAuth } from '@/contexts/AuthContext'
import { getMeetings, getApprovedDisclosures, getFileUrl } from '@/services/api'
import type { Meeting, Disclosure } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

export type UnifiedEvent = {
  id: string
  origin: 'meeting' | 'disclosure'
  title: string
  subtitle?: string
  date: string // ISO string
  endDate?: string // ISO string
  location?: string
  format: 'presencial' | 'online' | 'hibrido'
  pricing: 'gratuito' | 'pago'
  speakers?: string
  description?: string
  contactLink?: string
  authorName?: string
  authorCompany?: string
  coverImage?: string
  originalMeeting?: Meeting
  originalDisclosure?: Disclosure
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [disclosures, setDisclosures] = useState<Disclosure[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Calendar View and Navigation States
  const [calendarViewMode, setCalendarViewMode] = useState<'mes' | 'semana' | 'dia'>('mes')
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date())

  // Calendar Filters
  const [calSearchName, setCalSearchName] = useState('')
  const [calLocationFilter, setCalLocationFilter] = useState('todos')
  const [calFormatFilter, setCalFormatFilter] = useState('todos') // todos | presencial | online | hibrido
  const [calPricingFilter, setCalPricingFilter] = useState('todos') // todos | gratuito | pago
  const [calOriginFilter, setCalOriginFilter] = useState('todos') // todos | club | members

  // Event modal
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<UnifiedEvent | null>(null)

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const [meets, appDiscs] = await Promise.all([getMeetings(), getApprovedDisclosures()])
      setMeetings(meets)
      setDisclosures(appDiscs)
    } catch (err) {
      console.error('Erro ao carregar dados do calendário:', err)
      toast.error('Não foi possível carregar os eventos do calendário.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Helpers de formatação
  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const formatTimeString = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return format(d, "HH:mm'h'", { locale: ptBR })
    } catch {
      return ''
    }
  }

  // Unified Calendar Events Mapping
  const unifiedEvents: UnifiedEvent[] = useMemo(() => {
    const list: UnifiedEvent[] = []

    // 1. Official Club Meetings (Business Club)
    meetings.forEach((m) => {
      const dateStr = m.start_date || m.date
      if (dateStr) {
        list.push({
          id: `meeting-${m.id}`,
          origin: 'meeting',
          title: m.title,
          subtitle: m.event_name || 'Encontro Oficial Edvanced Business Club',
          date: dateStr,
          endDate: m.end_date,
          location: m.location,
          format: m.type || 'presencial',
          pricing: m.pricing || 'gratuito',
          speakers: m.speakers,
          description: m.description,
          coverImage: m.cover_image,
          originalMeeting: m,
        })
      }
    })

    // 2. Approved Disclosures of Members (Eventos dos Membros)
    disclosures.forEach((d) => {
      const dateStr = d.event_date || d.created
      if (dateStr) {
        list.push({
          id: `disclosure-${d.id}`,
          origin: 'disclosure',
          title: d.title,
          subtitle: `Membro: ${d.expand?.member?.name || 'Membro do Club'}`,
          date: dateStr,
          location: d.event_location || 'A definir / Online',
          format:
            d.format ||
            (d.event_location?.toLowerCase().includes('online') ||
            d.event_location?.toLowerCase().includes('zoom')
              ? 'online'
              : 'presencial'),
          pricing: d.pricing || 'gratuito',
          description: d.content,
          contactLink: d.contact_link,
          authorName: d.expand?.member?.name,
          authorCompany: d.expand?.member?.company,
          originalDisclosure: d,
        })
      }
    })

    return list
  }, [meetings, disclosures])

  // Unique locations for calendar filter
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>()
    unifiedEvents.forEach((e) => {
      if (e.location && e.location.trim()) {
        set.add(e.location.trim())
      }
    })
    return Array.from(set)
  }, [unifiedEvents])

  // Filtered Calendar Events
  const filteredCalendarEvents = useMemo(() => {
    return unifiedEvents.filter((ev) => {
      if (
        calSearchName.trim() &&
        !ev.title.toLowerCase().includes(calSearchName.toLowerCase()) &&
        !(ev.subtitle && ev.subtitle.toLowerCase().includes(calSearchName.toLowerCase())) &&
        !(ev.location && ev.location.toLowerCase().includes(calSearchName.toLowerCase())) &&
        !(ev.speakers && ev.speakers.toLowerCase().includes(calSearchName.toLowerCase()))
      ) {
        return false
      }

      if (calOriginFilter === 'club' && ev.origin !== 'meeting') return false
      if (calOriginFilter === 'members' && ev.origin !== 'disclosure') return false
      if (calFormatFilter !== 'todos' && ev.format !== calFormatFilter) return false
      if (calPricingFilter !== 'todos' && ev.pricing !== calPricingFilter) return false
      if (
        calLocationFilter !== 'todos' &&
        (!ev.location || !ev.location.toLowerCase().includes(calLocationFilter.toLowerCase()))
      ) {
        return false
      }

      return true
    })
  }, [
    unifiedEvents,
    calSearchName,
    calOriginFilter,
    calFormatFilter,
    calPricingFilter,
    calLocationFilter,
  ])

  // Calendar Navigation Handlers
  const handlePrevDate = () => {
    if (calendarViewMode === 'mes') {
      setCurrentCalendarDate((prev) => subMonths(prev, 1))
    } else if (calendarViewMode === 'semana') {
      setCurrentCalendarDate((prev) => subWeeks(prev, 1))
    } else {
      setCurrentCalendarDate((prev) => subDays(prev, 1))
    }
  }

  const handleNextDate = () => {
    if (calendarViewMode === 'mes') {
      setCurrentCalendarDate((prev) => addMonths(prev, 1))
    } else if (calendarViewMode === 'semana') {
      setCurrentCalendarDate((prev) => addWeeks(prev, 1))
    } else {
      setCurrentCalendarDate((prev) => addDays(prev, 1))
    }
  }

  const handleToday = () => {
    setCurrentCalendarDate(new Date())
  }

  // Export ICS handler
  const handleExportICS = () => {
    try {
      if (filteredCalendarEvents.length === 0) {
        toast.error('Nenhum evento corresponde aos filtros ativos para exportação.')
        return
      }
      downloadICSFile(filteredCalendarEvents, 'edvanced-business-club-agenda.ics')
      toast.success(
        `Arquivo .ics baixado com ${filteredCalendarEvents.length} evento(s)! Abra o arquivo para adicionar à sua agenda (Google Agenda, Apple Calendar ou Outlook).`,
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar calendário.')
    }
  }

  // Days list for Month View
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentCalendarDate)
    const monthEnd = endOfMonth(currentCalendarDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentCalendarDate])

  // Days list for Week View
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentCalendarDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentCalendarDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentCalendarDate])

  // Click on event: open modal or direct to meeting page
  const handleCalendarEventClick = (ev: UnifiedEvent) => {
    setSelectedCalendarEvent(ev)
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-16">
      {/* Header com estilo elegante #06242E e Dourado VIP em harmonia com fundo claro */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06242E] text-[#F5D77F] border border-[#D4AF37]/50 text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Calendário Integrado</span>
              </div>
              <Badge className="bg-[#D4AF37] text-slate-950 font-extrabold uppercase text-[10px] tracking-wider shadow-xs">
                Agenda VIP
              </Badge>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {filteredCalendarEvents.length} evento(s) no filtro
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Agenda Completa & Calendário Oficial
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Consulte a programação completa dos encontros oficiais do{' '}
              <strong className="text-[#06242E] font-bold">Edvanced Business Club</strong> e as
              divulgações e workshops realizados pelos membros. Alterne entre visões de Mês, Semana
              e Dia, aplique filtros personalizados e sincronize com seu celular.
            </p>
          </div>

          {/* Ações de topo */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleExportICS}
              className="bg-gradient-to-r from-[#06242E] to-[#0A3340] hover:from-[#03151B] hover:to-[#06242E] text-white border border-[#D4AF37]/40 text-xs md:text-sm font-bold py-5 px-5 rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-105"
              title="Exportar eventos visíveis no formato .ICS para Google Agenda, Apple Calendar ou Celular"
            >
              <CalendarPlus className="w-4 h-4 text-[#D4AF37]" />
              <span>Exportar para Celular / Google Agenda (.ics)</span>
            </Button>

            <Button
              onClick={() => navigate('/encontros')}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs md:text-sm font-bold py-5 px-4 rounded-xl transition-colors"
            >
              <Layers className="w-4 h-4 mr-1 text-[#8C6D07]" />
              Ver Acervo & Materiais
            </Button>
          </div>
        </div>

        {/* Controles de Navegação de Data & Alternância Dia / Semana / Mês */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode: Mês / Semana / Dia */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCalendarViewMode('mes')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  calendarViewMode === 'mes'
                    ? 'bg-[#06242E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Mês
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('semana')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  calendarViewMode === 'semana'
                    ? 'bg-[#06242E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('dia')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  calendarViewMode === 'dia'
                    ? 'bg-[#06242E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Dia
              </button>
            </div>

            {/* Prev / Today / Next */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevDate}
                className="h-8 w-8 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="h-8 px-3 text-xs font-bold text-[#8C6D07] hover:text-slate-950 hover:bg-slate-200/80 rounded-lg"
              >
                Hoje
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDate}
                className="h-8 w-8 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="px-5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm font-black text-[#06242E] uppercase tracking-wider min-w-[200px] text-center shadow-2xs">
            {calendarViewMode === 'dia'
              ? format(currentCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : format(currentCalendarDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>

        {/* BARRA DE FILTROS DO CALENDÁRIO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-200">
          {/* 1. Busca por Nome de Evento */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Nome / Palestrante
            </Label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Filtrar eventos..."
                value={calSearchName}
                onChange={(e) => setCalSearchName(e.target.value)}
                className="pl-8 text-xs h-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* 2. Origem (Business Club vs Membros) */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Origem do Evento
            </Label>
            <select
              value={calOriginFilter}
              onChange={(e) => setCalOriginFilter(e.target.value)}
              className="w-full h-9 px-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="todos">Todos (Club & Membros)</option>
              <option value="club">Apenas Edvanced Business Club</option>
              <option value="members">Apenas Eventos dos Membros</option>
            </select>
          </div>

          {/* 3. Formato */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Presencial / Online
            </Label>
            <select
              value={calFormatFilter}
              onChange={(e) => setCalFormatFilter(e.target.value)}
              className="w-full h-9 px-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="todos">Todos os Formatos</option>
              <option value="presencial">Presencial</option>
              <option value="online">Online VIP</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>

          {/* 4. Cobrança */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Cobrança / Acesso
            </Label>
            <select
              value={calPricingFilter}
              onChange={(e) => setCalPricingFilter(e.target.value)}
              className="w-full h-9 px-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="todos">Todos (Gratuito & Pago)</option>
              <option value="gratuito">Apenas Gratuitos / Inclusos</option>
              <option value="pago">Apenas Pagos / Inscrição</option>
            </select>
          </div>

          {/* 5. Local */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Localização
            </Label>
            <select
              value={calLocationFilter}
              onChange={(e) => setCalLocationFilter(e.target.value)}
              className="w-full h-9 px-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#D4AF37]"
            >
              <option value="todos">Todos os Locais</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legenda Visual */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-2 text-slate-600 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-500">Legenda:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#06242E] border-2 border-[#D4AF37]" />
              <span className="text-slate-800 font-semibold">Business Club (Oficial)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-600 border-2 border-teal-300" />
              <span className="text-slate-800 font-semibold">Eventos dos Membros</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[9px] uppercase font-bold text-emerald-700 border-emerald-300 bg-emerald-50"
            >
              Gratuito
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] uppercase font-bold text-amber-700 border-amber-300 bg-amber-50"
            >
              Pago
            </Badge>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODO 1: VISÃO DE MÊS (Month Grid - Fundo Claro)
         ========================================================================= */}
      {calendarViewMode === 'mes' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase tracking-wider text-slate-700 py-3.5">
            <span className="text-rose-600">Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span className="text-slate-600">Sáb</span>
          </div>

          {/* Month calendar cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-100/50">
            {monthDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentCalendarDate)
              const isToday = isSameDay(day, new Date())

              const dayEvents = filteredCalendarEvents.filter((ev) => {
                try {
                  return isSameDay(parseISO(ev.date), day)
                } catch {
                  return false
                }
              })

              return (
                <div
                  key={idx}
                  className={`min-h-[130px] p-2 sm:p-2.5 flex flex-col justify-between transition-colors ${
                    isCurrentMonth
                      ? 'bg-white hover:bg-slate-50/80'
                      : 'bg-slate-50/70 text-slate-400 opacity-60'
                  } ${isToday ? 'ring-2 ring-inset ring-[#D4AF37] bg-amber-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isToday
                          ? 'bg-[#06242E] text-[#F5D77F] ring-1 ring-[#D4AF37] font-black shadow-xs'
                          : isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 text-[#06242E] border border-slate-200">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[96px] no-scrollbar">
                    {dayEvents.map((ev) => {
                      const isOfficial = ev.origin === 'meeting'
                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleCalendarEventClick(ev)}
                          className={`p-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-[1.02] truncate border shadow-2xs ${
                            isOfficial
                              ? 'bg-[#06242E] text-white border-[#D4AF37]/60 hover:bg-[#0A3340] hover:border-[#D4AF37]'
                              : 'bg-teal-50 text-teal-950 border-teal-200 hover:bg-teal-100/90 hover:border-teal-300'
                          }`}
                          title={`${ev.title} (${ev.format} - ${ev.pricing}) - Clique para ver detalhes`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                isOfficial ? 'bg-[#D4AF37]' : 'bg-teal-600'
                              }`}
                            />
                            <span className="truncate font-bold">{ev.title}</span>
                          </div>
                          <div
                            className={`flex items-center justify-between text-[9px] mt-0.5 ${
                              isOfficial ? 'text-teal-200' : 'text-teal-700'
                            }`}
                          >
                            <span className="font-medium">{formatTimeString(ev.date)}</span>
                            <span
                              className={`uppercase text-[8px] font-extrabold ${
                                isOfficial ? 'text-[#F5D77F]' : 'text-teal-900'
                              }`}
                            >
                              {ev.format}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODO 2: VISÃO DE SEMANA (Week Columns - Fundo Claro)
         ========================================================================= */}
      {calendarViewMode === 'semana' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date())
              const dayEvents = filteredCalendarEvents.filter((ev) => {
                try {
                  return isSameDay(parseISO(ev.date), day)
                } catch {
                  return false
                }
              })

              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-3 bg-slate-50/80 border min-h-[260px] flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 bg-amber-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="border-b border-slate-200 pb-2 mb-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p
                      className={`text-lg font-black mt-0.5 ${
                        isToday ? 'text-[#8C6D07]' : 'text-slate-900'
                      }`}
                    >
                      {format(day, 'dd/MM')}
                    </p>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[320px]">
                    {dayEvents.length > 0 ? (
                      dayEvents.map((ev) => {
                        const isOfficial = ev.origin === 'meeting'
                        return (
                          <div
                            key={ev.id}
                            onClick={() => handleCalendarEventClick(ev)}
                            className={`p-2.5 rounded-xl text-xs cursor-pointer border transition-all hover:scale-[1.02] shadow-2xs ${
                              isOfficial
                                ? 'bg-[#06242E] text-white border-[#D4AF37]/60 hover:bg-[#0A3340] shadow-sm'
                                : 'bg-teal-50 text-teal-950 border-teal-200 hover:bg-teal-100 hover:border-teal-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <Badge
                                className={`text-[8px] uppercase font-extrabold ${
                                  isOfficial
                                    ? 'bg-[#D4AF37] text-slate-950'
                                    : 'bg-teal-700 text-white'
                                }`}
                              >
                                {isOfficial ? 'Club' : 'Membro'}
                              </Badge>
                              <span
                                className={`text-[10px] font-bold ${
                                  isOfficial ? 'text-[#F5D77F]' : 'text-teal-800'
                                }`}
                              >
                                {formatTimeString(ev.date)}
                              </span>
                            </div>
                            <h4
                              className={`font-bold text-xs line-clamp-2 leading-tight ${
                                isOfficial ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {ev.title}
                            </h4>
                            {ev.location && (
                              <p
                                className={`text-[10px] truncate mt-1 flex items-center gap-1 ${
                                  isOfficial ? 'text-teal-200' : 'text-slate-600'
                                }`}
                              >
                                <MapPin
                                  className={`w-3 h-3 ${
                                    isOfficial ? 'text-[#D4AF37]' : 'text-teal-700'
                                  }`}
                                />
                                {ev.location}
                              </p>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-[11px]">Sem eventos</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODO 3: VISÃO DE DIA (Day Agenda - Fundo Claro)
         ========================================================================= */}
      {calendarViewMode === 'dia' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs uppercase font-bold text-[#8C6D07] tracking-wider">
                Agenda do Dia Selecionado
              </span>
              <h3 className="text-xl md:text-2xl font-black text-slate-900">
                {format(currentCalendarDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
            </div>
          </div>

          {(() => {
            const dayEvents = filteredCalendarEvents.filter((ev) => {
              try {
                return isSameDay(parseISO(ev.date), currentCalendarDate)
              } catch {
                return false
              }
            })

            if (dayEvents.length === 0) {
              return (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-base">
                    Nenhum evento agendado para esta data
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Nenhum encontro oficial ou divulgação coincide com os filtros aplicados.
                  </p>
                </div>
              )
            }

            return (
              <div className="space-y-4">
                {dayEvents.map((ev) => {
                  const isOfficial = ev.origin === 'meeting'
                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleCalendarEventClick(ev)}
                      className={`p-5 md:p-6 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isOfficial
                          ? 'bg-[#06242E] text-white border-[#D4AF37]/50 hover:bg-[#0A3340] shadow-md'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-teal-400 hover:bg-slate-50/60 shadow-xs'
                      }`}
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`text-[10px] font-black uppercase tracking-wider ${
                              isOfficial ? 'bg-[#D4AF37] text-slate-950' : 'bg-teal-700 text-white'
                            }`}
                          >
                            {isOfficial ? 'Business Club Oficial' : 'Divulgação de Membro'}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold ${
                              isOfficial
                                ? 'text-teal-200 border-teal-700'
                                : 'text-slate-700 border-slate-300'
                            }`}
                          >
                            {ev.format}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold ${
                              ev.pricing === 'pago'
                                ? isOfficial
                                  ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                                  : 'text-amber-800 border-amber-300 bg-amber-50'
                                : isOfficial
                                  ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                                  : 'text-emerald-800 border-emerald-300 bg-emerald-50'
                            }`}
                          >
                            {ev.pricing === 'pago' ? 'Pago' : 'Gratuito'}
                          </Badge>

                          <span
                            className={`text-xs font-bold ${
                              isOfficial ? 'text-teal-300' : 'text-slate-600'
                            }`}
                          >
                            {formatTimeString(ev.date)}
                            {ev.endDate ? ` até ${formatTimeString(ev.endDate)}` : ''}
                          </span>
                        </div>

                        <h4
                          className={`font-extrabold text-base md:text-lg ${
                            isOfficial ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {ev.title}
                        </h4>

                        {ev.subtitle && (
                          <p
                            className={`text-xs font-semibold ${
                              isOfficial ? 'text-[#F5D77F]' : 'text-teal-700'
                            }`}
                          >
                            {ev.subtitle}
                          </p>
                        )}

                        {ev.location && (
                          <p
                            className={`text-xs flex items-center gap-1.5 ${
                              isOfficial ? 'text-teal-200/90' : 'text-slate-600'
                            }`}
                          >
                            <MapPin
                              className={`w-3.5 h-3.5 ${
                                isOfficial ? 'text-[#D4AF37]' : 'text-teal-700'
                              }`}
                            />
                            {ev.location}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isOfficial && ev.originalMeeting ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/encontros?id=${ev.originalMeeting?.id}`)
                            }}
                            className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs shadow-sm"
                          >
                            Acessar Encontro & Materiais →
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCalendarEventClick(ev)
                            }}
                            className="bg-[#06242E] hover:bg-[#0A3340] text-white font-bold text-xs shadow-xs"
                          >
                            Ver Detalhes →
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* =========================================================================
          MODAL DETALHES DO EVENTO DO CALENDÁRIO
         ========================================================================= */}
      {selectedCalendarEvent && (
        <Dialog
          open={!!selectedCalendarEvent}
          onOpenChange={(open) => !open && setSelectedCalendarEvent(null)}
        >
          <DialogContent className="max-w-2xl bg-[#06242E] text-white border-teal-950 p-6 md:p-8 shadow-2xl rounded-3xl">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`uppercase font-black text-[10px] ${
                    selectedCalendarEvent.origin === 'meeting'
                      ? 'bg-[#D4AF37] text-slate-950'
                      : 'bg-teal-700 text-white'
                  }`}
                >
                  {selectedCalendarEvent.origin === 'meeting'
                    ? 'Edvanced Business Club'
                    : 'Evento do Membro'}
                </Badge>

                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold text-teal-200 border-teal-700"
                >
                  {selectedCalendarEvent.format}
                </Badge>

                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold ${
                    selectedCalendarEvent.pricing === 'pago'
                      ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                      : 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                  }`}
                >
                  {selectedCalendarEvent.pricing === 'pago' ? 'Pago' : 'Gratuito'}
                </Badge>
              </div>

              <DialogTitle className="text-xl md:text-2xl font-black text-white leading-tight">
                {selectedCalendarEvent.title}
              </DialogTitle>

              {selectedCalendarEvent.subtitle && (
                <p className="text-xs font-bold text-[#F5D77F]">{selectedCalendarEvent.subtitle}</p>
              )}
            </DialogHeader>

            <div className="space-y-4 my-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#03151B] rounded-2xl border border-teal-950 space-y-1">
                  <p className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#D4AF37]" /> Data do Evento
                  </p>
                  <p className="text-white font-bold">
                    {formatDateString(selectedCalendarEvent.date)}
                  </p>
                  <p className="text-teal-200">
                    {formatTimeString(selectedCalendarEvent.date)}
                    {selectedCalendarEvent.endDate
                      ? ` às ${formatTimeString(selectedCalendarEvent.endDate)}`
                      : ''}
                  </p>
                </div>

                <div className="p-3.5 bg-[#03151B] rounded-2xl border border-teal-950 space-y-1">
                  <p className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> Local / Plataforma
                  </p>
                  <p className="text-white font-bold">
                    {selectedCalendarEvent.location || 'Online / A combinar'}
                  </p>
                </div>
              </div>

              {selectedCalendarEvent.speakers && (
                <div className="p-3.5 bg-[#03151B] rounded-2xl border border-teal-950 space-y-1">
                  <p className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" /> Palestrantes & Convidados
                  </p>
                  <p className="text-white">{selectedCalendarEvent.speakers}</p>
                </div>
              )}

              {selectedCalendarEvent.description && (
                <div className="p-4 bg-[#03151B]/60 rounded-2xl border border-teal-950 text-teal-100/90 leading-relaxed whitespace-pre-wrap">
                  {selectedCalendarEvent.description.startsWith('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedCalendarEvent.description }} />
                  ) : (
                    selectedCalendarEvent.description
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-teal-950">
              <Button
                variant="outline"
                onClick={() => setSelectedCalendarEvent(null)}
                className="text-xs border-teal-800 text-teal-100 hover:bg-teal-900"
              >
                Fechar
              </Button>

              <div className="flex items-center gap-2">
                {selectedCalendarEvent.origin === 'meeting' &&
                  selectedCalendarEvent.originalMeeting && (
                    <Button
                      onClick={() => {
                        const mId = selectedCalendarEvent.originalMeeting?.id
                        setSelectedCalendarEvent(null)
                        navigate(`/encontros?id=${mId}`)
                      }}
                      className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs"
                    >
                      Ver Acervo & Fotos deste Encontro →
                    </Button>
                  )}

                {selectedCalendarEvent.contactLink && (
                  <a
                    href={selectedCalendarEvent.contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs uppercase tracking-wider">
                      Acessar Link / Inscrição <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
