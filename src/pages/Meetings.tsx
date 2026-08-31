import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Image as ImageIcon,
  Video,
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Users,
  Play,
  Eye,
  Plus,
  Edit2,
  Trash2,
  CalendarCheck2,
  Hourglass,
  Tag,
  LayoutGrid,
  Info,
  CalendarDays,
  CalendarPlus,
  Smartphone,
  Share2,
  Upload,
  Paperclip,
} from 'lucide-react'
import { downloadICSFile } from '@/lib/ics'
import { useAuth } from '@/contexts/AuthContext'
import { detectMaterialKind, type DetailedMaterialSubtype } from '@/lib/utils'
import PdfDocumentViewer from '@/components/PdfDocumentViewer'
import {
  getMeetings,
  getAllMaterials,
  getApprovedDisclosures,
  createMaterial,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getFileUrl,
} from '@/services/api'
import type { Meeting, Material, Disclosure } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import NetflixShelf from '@/components/NetflixShelf'
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

// Unified UnifiedEvent type for Calendar view
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

export default function MeetingsAndMaterials() {
  const { user, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Main navigation tab: "acervo" (Materiais por Categoria) or "calendario" (Calendário Unificado)
  const initialView = searchParams.get('aba') === 'calendario' ? 'calendario' : 'acervo'
  const [mainView, setMainView] = useState<'acervo' | 'calendario'>(initialView)

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

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [disclosures, setDisclosures] = useState<Disclosure[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Media preview modal (Fotos / Vídeos / Docs)
  const [previewMedia, setPreviewMedia] = useState<Material | null>(null)

  // Meeting detail modal (Mais informações do encontro)
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null)

  // Event detail modal for Calendar click
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<UnifiedEvent | null>(null)

  // ==========================================
  // FILTERS FOR ACERVO & SHELVES
  // ==========================================
  const [acervoSearch, setAcervoSearch] = useState(searchParams.get('busca') || '')
  const [acervoCategory, setAcervoCategory] = useState<
    'todos' | 'encontros' | 'photos' | 'videos' | 'documents'
  >('todos')

  // ==========================================
  // FILTERS FOR CALENDAR (Requested by user)
  // Evento (nome), Dia/Semana/Mês, Local, Presencial/Online, Pago/Gratuito
  // ==========================================
  const [calendarViewMode, setCalendarViewMode] = useState<'mes' | 'semana' | 'dia'>('mes')
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date())
  const [calSearchName, setCalSearchName] = useState('')
  const [calLocationFilter, setCalLocationFilter] = useState('todos')
  const [calFormatFilter, setCalFormatFilter] = useState('todos') // todos | presencial | online | hibrido
  const [calPricingFilter, setCalPricingFilter] = useState('todos') // todos | gratuito | pago
  const [calOriginFilter, setCalOriginFilter] = useState('todos') // todos | club | members

  // ==========================================
  // ADMIN MODALS (Create/Edit Meeting & Material)
  // ==========================================
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingEventName, setMeetingEventName] = useState('')
  const [meetingStartDate, setMeetingStartDate] = useState('')
  const [meetingEndDate, setMeetingEndDate] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('')
  const [meetingType, setMeetingType] = useState<'presencial' | 'online' | 'hibrido'>('presencial')
  const [meetingPricing, setMeetingPricing] = useState<'gratuito' | 'pago'>('gratuito')
  const [meetingRegistrationUrl, setMeetingRegistrationUrl] = useState('')
  const [meetingSpeakers, setMeetingSpeakers] = useState('')
  const [meetingDesc, setMeetingDesc] = useState('')
  const [meetingCoverFile, setMeetingCoverFile] = useState<File | null>(null)
  const [meetingCoverPreview, setMeetingCoverPreview] = useState<string>('')

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [newMatTitle, setNewMatTitle] = useState('')
  const [newMatType, setNewMatType] = useState<'photo' | 'video' | 'document'>('photo')
  const [newMatUrl, setNewMatUrl] = useState('')
  const [newMatFile, setNewMatFile] = useState<File | null>(null)
  const [newMatFilePreview, setNewMatFilePreview] = useState<string | null>(null)
  const [newMatDesc, setNewMatDesc] = useState('')
  const [newMatMeetingId, setNewMatMeetingId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 15-minute alignment helper
  const roundToNearest15Min = (date: Date = new Date()): string => {
    const minutes = date.getMinutes()
    const roundedMinutes = Math.round(minutes / 15) * 15
    const newDate = new Date(date)
    newDate.setMinutes(roundedMinutes)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    const yyyy = newDate.getFullYear()
    const MM = pad(newDate.getMonth() + 1)
    const dd = pad(newDate.getDate())
    const hh = pad(newDate.getHours())
    const mm = pad(newDate.getMinutes())
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
  }

  const toDateTimeLocalString = (isoStr?: string) => {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return ''
      const pad = (n: number) => (n < 10 ? '0' + n : n)
      const yyyy = d.getFullYear()
      const MM = pad(d.getMonth() + 1)
      const dd = pad(d.getDate())
      const hh = pad(d.getHours())
      const mm = pad(d.getMinutes())
      return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
    } catch {
      return ''
    }
  }

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const [meets, mats, appDiscs] = await Promise.all([
        getMeetings(),
        getAllMaterials(),
        getApprovedDisclosures(),
      ])
      setMeetings(meets)
      setMaterials(mats)
      setDisclosures(appDiscs)

      const targetId = searchParams.get('id')
      if (targetId) {
        const found = meets.find((m) => m.id === targetId)
        if (found) setSelectedMeeting(found)
      } else if (meets.length > 0 && !selectedMeeting) {
        setSelectedMeeting(meets[0])
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    const q = searchParams.get('busca')
    if (q) setAcervoSearch(q)
    const viewParam = searchParams.get('aba')
    if (viewParam === 'calendario') {
      setMainView('calendario')
    } else if (viewParam === 'acervo' || (!viewParam && !searchParams.get('id'))) {
      // default to acervo if not specified
    }
  }, [searchParams])

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

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return format(d, 'dd MMM yyyy', { locale: ptBR })
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

  // Meeting Status Logic
  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date()
    const startStr = meeting.start_date || meeting.date
    if (!startStr) {
      return {
        key: 'scheduled',
        label: 'Agendado',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        cardClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: CalendarIcon,
      }
    }

    const start = new Date(startStr)
    const end = meeting.end_date
      ? new Date(meeting.end_date)
      : new Date(start.getTime() + 2.5 * 60 * 60 * 1000)

    if (now < start) {
      return {
        key: 'scheduled',
        label: 'Próximo Encontro',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        cardClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: CalendarIcon,
      }
    } else if (now >= start && now <= end) {
      return {
        key: 'ongoing',
        label: 'Em Andamento',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
        cardClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: Hourglass,
      }
    } else {
      return {
        key: 'completed',
        label: 'Realizado',
        badgeClass: 'bg-blue-950/80 text-blue-200 border-blue-700/50',
        cardClass: 'bg-slate-800/80 text-slate-300 border-slate-700',
        icon: CalendarCheck2,
      }
    }
  }

  // Cover image resolver
  const getMeetingHeroCover = (meeting?: Meeting | null) => {
    if (!meeting) {
      return ''
    }
    if (meeting.cover_image) {
      return getFileUrl('meetings', meeting.id, meeting.cover_image)
    }
    return ''
  }

  // Hero Meeting prioritization (upcoming first, else latest)
  const sortedMeetings = [...meetings].sort((a, b) => {
    const timeA = new Date(a.start_date || a.date).getTime()
    const timeB = new Date(b.start_date || b.date).getTime()
    return timeB - timeA
  })

  const now = new Date()
  const upcomingOrOngoing = sortedMeetings
    .filter((m) => {
      const start = new Date(m.start_date || m.date)
      const end = m.end_date
        ? new Date(m.end_date)
        : new Date(start.getTime() + 2.5 * 60 * 60 * 1000)
      return end >= now
    })
    .sort(
      (a, b) =>
        new Date(a.start_date || a.date).getTime() - new Date(b.start_date || b.date).getTime(),
    )[0]

  const heroMeeting = selectedMeeting || upcomingOrOngoing || sortedMeetings[0] || null

  // Categorized materials
  const photoMaterials = useMemo(
    () =>
      materials.filter((m) => {
        if (selectedMeeting && m.meeting !== selectedMeeting.id) return false
        const kind = detectMaterialKind({
          file: m.file,
          url: m.url,
          title: m.title,
          type: m.type,
        })
        if (kind.category !== 'photo') return false
        return (
          acervoSearch === '' ||
          m.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(acervoSearch.toLowerCase()))
        )
      }),
    [materials, acervoSearch, selectedMeeting],
  )

  const allPhotoMaterials = useMemo(
    () =>
      materials.filter((m) => {
        const kind = detectMaterialKind({
          file: m.file,
          url: m.url,
          title: m.title,
          type: m.type,
        })
        if (kind.category !== 'photo') return false
        return (
          acervoSearch === '' ||
          m.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(acervoSearch.toLowerCase()))
        )
      }),
    [materials, acervoSearch],
  )

  const videoMaterials = useMemo(
    () =>
      materials.filter((m) => {
        if (selectedMeeting && m.meeting !== selectedMeeting.id) return false
        const kind = detectMaterialKind({
          file: m.file,
          url: m.url,
          title: m.title,
          type: m.type,
        })
        if (kind.category !== 'video') return false
        return (
          acervoSearch === '' ||
          m.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(acervoSearch.toLowerCase()))
        )
      }),
    [materials, acervoSearch, selectedMeeting],
  )

  const allVideoMaterials = useMemo(
    () =>
      materials.filter((m) => {
        const kind = detectMaterialKind({
          file: m.file,
          url: m.url,
          title: m.title,
          type: m.type,
        })
        if (kind.category !== 'video') return false
        return (
          acervoSearch === '' ||
          m.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(acervoSearch.toLowerCase()))
        )
      }),
    [materials, acervoSearch],
  )

  const docMaterials = useMemo(
    () =>
      materials.filter((m) => {
        if (selectedMeeting && m.meeting !== selectedMeeting.id) return false
        const kind = detectMaterialKind({
          file: m.file,
          url: m.url,
          title: m.title,
          type: m.type,
        })
        if (kind.category !== 'document') return false
        return (
          acervoSearch === '' ||
          m.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(acervoSearch.toLowerCase()))
        )
      }),
    [materials, acervoSearch, selectedMeeting],
  )

  const allDocMaterials = useMemo(
    () =>
      materials.filter((m) => {
        const kind = detectMaterialKind({
          file: m.file,
          url: m.url,
          title: m.title,
          type: m.type,
        })
        if (kind.category !== 'document') return false
        return (
          acervoSearch === '' ||
          m.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(acervoSearch.toLowerCase()))
        )
      }),
    [materials, acervoSearch],
  )

  // Materials linked specifically to selected/detail meeting
  const currentMeetingMaterials = useMemo(() => {
    const target = detailMeeting || selectedMeeting
    if (!target) return []
    return materials.filter((m) => m.meeting === target.id)
  }, [detailMeeting, selectedMeeting, materials])

  const filteredMeetingsList = useMemo(
    () =>
      meetings.filter(
        (m) =>
          acervoSearch === '' ||
          m.title.toLowerCase().includes(acervoSearch.toLowerCase()) ||
          (m.event_name && m.event_name.toLowerCase().includes(acervoSearch.toLowerCase())) ||
          (m.speakers && m.speakers.toLowerCase().includes(acervoSearch.toLowerCase())) ||
          m.location.toLowerCase().includes(acervoSearch.toLowerCase()),
      ),
    [meetings, acervoSearch],
  )

  // =========================================================================
  // UNIFIED CALENDAR EVENTS MAPPING (Meetings in Dark Navy + Disclosures in Teal)
  // =========================================================================
  const unifiedEvents: UnifiedEvent[] = useMemo(() => {
    const list: UnifiedEvent[] = []

    // 1. Official Club Meetings (Business Club - Azul Escuro)
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
      // Use event_date if present, else fallback to created
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
      // Filter by name / search
      if (
        calSearchName.trim() &&
        !ev.title.toLowerCase().includes(calSearchName.toLowerCase()) &&
        !(ev.subtitle && ev.subtitle.toLowerCase().includes(calSearchName.toLowerCase())) &&
        !(ev.location && ev.location.toLowerCase().includes(calSearchName.toLowerCase())) &&
        !(ev.speakers && ev.speakers.toLowerCase().includes(calSearchName.toLowerCase()))
      ) {
        return false
      }

      // Filter by origin (Club vs Membros)
      if (calOriginFilter === 'club' && ev.origin !== 'meeting') return false
      if (calOriginFilter === 'members' && ev.origin !== 'disclosure') return false

      // Filter by format (Presencial vs Online vs Hibrido)
      if (calFormatFilter !== 'todos' && ev.format !== calFormatFilter) return false

      // Filter by pricing (Gratuito vs Pago)
      if (calPricingFilter !== 'todos' && ev.pricing !== calPricingFilter) return false

      // Filter by location
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

  // ==========================================
  // CALENDAR NAVIGATION HANDLERS
  // ==========================================
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

  // Handler for Calendar Event Click
  // Rule 2: Official club meeting -> Open the meeting directly with all its materials
  // Disclosure of member -> Open disclosure modal
  const handleCalendarEventClick = (ev: UnifiedEvent) => {
    if (ev.origin === 'meeting' && ev.originalMeeting) {
      setSelectedMeeting(ev.originalMeeting)
      setDetailMeeting(ev.originalMeeting)
      setMainView('acervo')
      setSearchParams({ id: ev.originalMeeting.id })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setSelectedCalendarEvent(ev)
    }
  }

  // ==========================================
  // ADMIN MEETING / MATERIAL CREATION
  // ==========================================
  const handleOpenAddMeeting = () => {
    const nowRounded = roundToNearest15Min(new Date())
    const laterDate = new Date()
    laterDate.setHours(laterDate.getHours() + 2)
    laterDate.setMinutes(laterDate.getMinutes() + 30)
    const endRounded = roundToNearest15Min(laterDate)

    setEditingMeeting(null)
    setMeetingTitle('')
    setMeetingEventName('')
    setMeetingStartDate(nowRounded)
    setMeetingEndDate(endRounded)
    setMeetingLocation('')
    setMeetingType('presencial')
    setMeetingPricing('gratuito')
    setMeetingRegistrationUrl('')
    setMeetingSpeakers('')
    setMeetingDesc('')
    setMeetingCoverFile(null)
    setMeetingCoverPreview('')
    setShowMeetingModal(true)
  }

  const handleOpenEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setMeetingTitle(meeting.title || '')
    setMeetingEventName(meeting.event_name || '')
    setMeetingStartDate(toDateTimeLocalString(meeting.start_date || meeting.date))
    setMeetingEndDate(toDateTimeLocalString(meeting.end_date))
    setMeetingLocation(meeting.location || '')
    setMeetingType(meeting.type || 'presencial')
    setMeetingPricing(meeting.pricing || 'gratuito')
    setMeetingRegistrationUrl(meeting.registration_url || '')
    setMeetingSpeakers(meeting.speakers || '')
    const cleanDesc = (meeting.description || '').replace(/^<p>/, '').replace(/<\/p>$/, '')
    setMeetingDesc(cleanDesc)
    setMeetingCoverFile(null)
    if (meeting.cover_image) {
      setMeetingCoverPreview(getFileUrl('meetings', meeting.id, meeting.cover_image))
    } else {
      setMeetingCoverPreview('')
    }
    setShowMeetingModal(true)
  }

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingTitle || !meetingStartDate || !meetingLocation) {
      toast.error('Preencha os campos obrigatórios (Título, Data de Início e Local).')
      return
    }

    const startIso = new Date(meetingStartDate).toISOString()
    const endIso = meetingEndDate ? new Date(meetingEndDate).toISOString() : ''

    if (endIso && new Date(endIso) < new Date(startIso)) {
      toast.error('A previsão de fim deve ser posterior à data de início.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', meetingTitle)
      if (meetingEventName.trim()) {
        formData.append('event_name', meetingEventName.trim())
      } else {
        formData.append('event_name', '')
      }
      formData.append('date', startIso)
      formData.append('start_date', startIso)
      if (endIso) {
        formData.append('end_date', endIso)
      } else {
        formData.append('end_date', '')
      }
      formData.append('location', meetingLocation)
      formData.append('type', meetingType)
      formData.append('pricing', meetingPricing)
      formData.append('registration_url', meetingRegistrationUrl.trim())
      formData.append('speakers', meetingSpeakers || '')
      formData.append('description', meetingDesc ? `<p>${meetingDesc}</p>` : '')

      if (meetingCoverFile) {
        formData.append('cover_image', meetingCoverFile)
      }

      let saved: Meeting
      if (editingMeeting) {
        saved = await updateMeeting(editingMeeting.id, formData)
        toast.success('Encontro atualizado com sucesso!')
      } else {
        saved = await createMeeting(formData)
        toast.success('Encontro criado com sucesso!')
      }

      setShowMeetingModal(false)
      await loadAllData()
      setSelectedMeeting(saved)
    } catch (err: any) {
      toast.error('Erro ao salvar encontro: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (!window.confirm(`Tem certeza que deseja excluir o encontro "${meeting.title}"?`)) {
      return
    }
    try {
      await deleteMeeting(meeting.id)
      toast.success('Encontro excluído com sucesso!')
      await loadAllData()
      if (selectedMeeting?.id === meeting.id) {
        setSelectedMeeting(null)
      }
    } catch (err: any) {
      toast.error('Erro ao excluir encontro: ' + err.message)
    }
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetMeetingId = newMatMeetingId || selectedMeeting?.id
    if (!targetMeetingId) {
      toast.error('Selecione um encontro para vincular o material.')
      return
    }
    if (!newMatTitle.trim()) {
      toast.error('O título do material é obrigatório.')
      return
    }
    if (!newMatFile && !newMatUrl.trim()) {
      toast.error('Por favor, selecione um arquivo do computador ou informe um Link/URL.')
      return
    }
    setIsSubmitting(true)
    try {
      if (newMatFile) {
        const formData = new FormData()
        formData.append('title', newMatTitle.trim())
        formData.append('type', newMatType)
        formData.append('meeting', targetMeetingId)
        if (newMatDesc.trim()) formData.append('description', newMatDesc.trim())
        if (newMatUrl.trim()) formData.append('url', newMatUrl.trim())
        formData.append('file', newMatFile)

        await createMaterial(formData)
      } else {
        await createMaterial({
          title: newMatTitle.trim(),
          type: newMatType,
          url: newMatUrl.trim(),
          description: newMatDesc.trim(),
          meeting: targetMeetingId,
        })
      }

      toast.success('Material adicionado ao acervo com sucesso!')
      setShowAddMaterialModal(false)
      setNewMatTitle('')
      setNewMatUrl('')
      setNewMatDesc('')
      setNewMatFile(null)
      setNewMatFilePreview(null)
      await loadAllData()
    } catch (err: any) {
      toast.error('Erro ao adicionar material: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-10 -mt-2 sm:-mt-4 pb-16 animate-fade-in text-slate-100">
      {/* =========================================================================
          1. NETFLIX-STYLE HERO BANNER (Capa em Destaque no Topo)
         ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-[#061020] border border-[#D4AF37]/25 shadow-2xl min-h-[440px] md:min-h-[520px] flex flex-col justify-end">
        {/* Background Cover Image with Premium Fallback */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#0A1A33] via-[#061020] to-[#122443]">
          {getMeetingHeroCover(heroMeeting) ? (
            <img
              src={getMeetingHeroCover(heroMeeting)}
              alt={heroMeeting?.title || 'Edvanced Business Club'}
              className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 contrast-110 transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Elegant abstract geometric gold & navy background */}
              <div className="absolute inset-0 bg-radial-gradient opacity-80" />
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="flex flex-col items-center justify-center text-center p-8 opacity-40">
                <Sparkles className="w-20 h-20 text-[#D4AF37] mb-2" />
                <span className="text-xl font-extrabold uppercase tracking-[0.3em] text-[#F5D77F]">
                  Edvanced Business Club
                </span>
              </div>
            </div>
          )}
          {/* Multi-layer Netflix-style vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33] via-[#0A1A33]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#061020] via-[#061020]/85 to-transparent w-full md:w-3/4" />
          {/* Golden Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Hero Content Overlaid */}
        <div className="relative z-10 p-6 md:p-12 max-w-3xl space-y-4 md:space-y-6">
          {/* Top Pill / Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37] text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Acervo & Encontros VIP</span>
            </div>

            {heroMeeting && (
              <>
                <Badge className="bg-white/15 backdrop-blur-md text-white border-white/25 font-bold uppercase text-[10px] tracking-wider">
                  {heroMeeting.type || 'Presencial'}
                </Badge>

                <Badge
                  variant="outline"
                  className={`font-bold uppercase text-[10px] tracking-wider ${
                    heroMeeting.pricing === 'pago'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {heroMeeting.pricing === 'pago'
                    ? 'Pago / Inscrição Especial'
                    : 'Exclusivo para Membros'}
                </Badge>

                {(() => {
                  const status = getMeetingStatus(heroMeeting)
                  const StatusIcon = status.icon
                  return (
                    <Badge
                      variant="outline"
                      className={`font-bold uppercase text-[10px] flex items-center gap-1.5 ${status.badgeClass}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  )
                })()}
              </>
            )}

            <span className="text-xs font-medium text-slate-300 hidden sm:inline-block">
              &bull; Fotos, Gravações & Cronograma
            </span>
          </div>

          {/* Title & Event Series */}
          {heroMeeting ? (
            <div className="space-y-2">
              {heroMeeting.event_name && (
                <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{heroMeeting.event_name}</span>
                </p>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight drop-shadow-md">
                {heroMeeting.title}
              </h1>
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Encontros & Materiais Oficiais
              </h1>
              <p className="text-slate-200 text-sm md:text-base">
                Assista a palestras gravadas, baixe apresentações em PDF e visualize fotos em alta
                resolução.
              </p>
            </div>
          )}

          {/* Meeting Metadata */}
          {heroMeeting && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-slate-200">
              <div className="flex items-center gap-2 bg-[#061020]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <CalendarIcon className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-semibold">
                  {formatDateString(heroMeeting.start_date || heroMeeting.date)}
                </span>
                <span className="text-[#F5D77F]">
                  às {formatTimeString(heroMeeting.start_date || heroMeeting.date)}
                  {heroMeeting.end_date ? ` até ${formatTimeString(heroMeeting.end_date)}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-[#061020]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span className="truncate max-w-[240px]" title={heroMeeting.location}>
                  {heroMeeting.location}
                </span>
              </div>

              {heroMeeting.speakers && (
                <div className="flex items-center gap-2 bg-[#061020]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <Users className="w-4 h-4 text-[#D4AF37]" />
                  <span className="truncate max-w-[220px]" title={heroMeeting.speakers}>
                    {heroMeeting.speakers}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Short Description */}
          {heroMeeting?.description && (
            <div
              className="text-xs md:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed"
              dangerouslySetInnerHTML={{ __html: heroMeeting.description }}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {heroMeeting && (
              <Button
                onClick={() => setDetailMeeting(heroMeeting)}
                className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider px-6 py-6 rounded-xl shadow-xl shadow-[#D4AF37]/30 flex items-center gap-2 group transition-all hover:scale-105"
              >
                <Info className="w-4 h-4 mr-1" />
                <span>Ver Detalhes do Encontro</span>
              </Button>
            )}

            <Button
              onClick={() => {
                setMainView('calendario')
                setSearchParams({ aba: 'calendario' })
              }}
              variant="outline"
              className="border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md text-xs md:text-sm font-bold px-5 py-6 rounded-xl transition-all flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
              Abrir Calendário Geral
            </Button>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleOpenAddMeeting}
                  className="bg-[#0A1A33] hover:bg-[#122443] border border-[#D4AF37]/40 text-white font-bold text-xs px-4 py-6 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1 text-[#D4AF37]" />
                  Novo Encontro
                </Button>
                <Button
                  onClick={() => {
                    setNewMatMeetingId(heroMeeting?.id || '')
                    setShowAddMaterialModal(true)
                  }}
                  className="bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-100 font-bold text-xs px-4 py-6 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1 text-[#D4AF37]" />
                  Adicionar Mídia
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* =========================================================================
          2. SELEÇÃO PRINCIPAL: PRATELEIRAS POR CATEGORIA vs ABA CALENDÁRIO
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-[#0A1A33] p-1.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto">
          <Button
            type="button"
            onClick={() => {
              setMainView('acervo')
              setSearchParams({})
            }}
            className={`flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all ${
              mainView === 'acervo'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black'
                : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Materiais por Categoria
          </Button>

          <Button
            type="button"
            onClick={() => {
              setMainView('calendario')
              setSearchParams({ aba: 'calendario' })
            }}
            className={`flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all ${
              mainView === 'calendario'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black'
                : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Calendário Integrado do Club
          </Button>
        </div>

        {mainView === 'acervo' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por tema, foto, gravação..."
              value={acervoSearch}
              onChange={(e) => setAcervoSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-[#0A1A33] border-slate-800 text-white placeholder:text-slate-400"
            />
          </div>
        )}
      </div>
      {/* =========================================================================
          3. VISÃO A: MATERIAIS SEPARADOS POR CATEGORIA (Estilo Capa Netflix)
         ========================================================================= */}
      {mainView === 'acervo' && (
        <div className="space-y-12 animate-fade-in">
          {/* CATEGORIA 1: PRATELEIRA DE ENCONTROS OFICIAIS */}
          {(acervoCategory === 'todos' || acervoCategory === 'encontros') && (
            <NetflixShelf
              title="Encontros Oficiais & Masterminds"
              subtitle="Imersões presenciais, rodadas executivas e webinars exclusivos"
              icon={CalendarIcon}
              badge={`${filteredMeetingsList.length} encontros`}
              action={
                isAdmin
                  ? {
                      label: '+ Cadastrar Encontro',
                      onClick: handleOpenAddMeeting,
                    }
                  : undefined
              }
            >
              {filteredMeetingsList.length > 0 ? (
                filteredMeetingsList.map((m) => {
                  const status = getMeetingStatus(m)
                  const StatusIcon = status.icon
                  const isHero = heroMeeting?.id === m.id

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMeeting(m)
                        setDetailMeeting(m)
                      }}
                      className={`group relative flex-shrink-0 w-72 sm:w-80 cursor-pointer rounded-2xl overflow-hidden bg-[#0A1A33] border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between ${
                        isHero
                          ? 'border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-xl shadow-[#D4AF37]/15'
                          : 'border-slate-800 hover:border-[#D4AF37] shadow-lg'
                      }`}
                    >
                      {/* Thumbnail Cover with Fallback */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#061020]">
                        {getMeetingHeroCover(m) ? (
                          <img
                            src={getMeetingHeroCover(m)}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#122443] via-[#0A1A33] to-[#061020] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#D4AF37]/20 rounded-full blur-xl pointer-events-none" />
                            <Sparkles className="w-8 h-8 text-[#D4AF37] mb-1 opacity-80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#F5D77F] line-clamp-1">
                              {m.event_name || 'Business Club'}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33] via-transparent to-black/40" />

                        {/* Badges Top */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#D4AF37] text-slate-950 tracking-wider shadow">
                            {m.type || 'Presencial'}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1 backdrop-blur-md ${status.cardClass}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>

                        {/* Play / Inspect Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Eye className="w-5 h-5 text-slate-950" />
                          </div>
                        </div>

                        {/* Bottom Date */}
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-200">
                          <span className="font-semibold text-[#F5D77F]">
                            {formatShortDate(m.start_date || m.date)}
                          </span>
                          <span>{formatTimeString(m.start_date || m.date)}</span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {m.event_name && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] line-clamp-1 flex items-center gap-1 mb-1">
                              <Tag className="w-3 h-3 flex-shrink-0" />
                              <span>{m.event_name}</span>
                            </p>
                          )}
                          <h3 className="font-black text-sm text-white group-hover:text-[#F5D77F] transition-colors line-clamp-2 leading-snug">
                            {m.title}
                          </h3>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                          <div className="flex items-center gap-1.5 text-[11px] truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                            <span className="truncate" title={m.location}>
                              {m.location}
                            </span>
                          </div>

                          {m.speakers && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                              <Users className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                              <span className="truncate" title={m.speakers}>
                                {m.speakers}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Admin Action Buttons inline */}
                        {isAdmin && (
                          <div
                            className="pt-2 border-t border-slate-800 flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditMeeting(m)}
                              className="h-7 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-white/10"
                            >
                              <Edit2 className="w-3 h-3 mr-1" /> Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMeeting(m)}
                              className="h-7 px-2 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="w-full p-8 text-center bg-[#0A1A33] rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">Nenhum encontro encontrado.</p>
                </div>
              )}
            </NetflixShelf>
          )}
          {/* Info banner if filtered by selected meeting */}
          {selectedMeeting && (
            <div className="p-3.5 rounded-2xl bg-[#0A1A33] border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#F5D77F]">
                    Visualizando materiais vinculados ao encontro:
                  </span>
                  <h4 className="font-extrabold text-xs text-white">{selectedMeeting.title}</h4>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMeeting(null)
                  setSearchParams({})
                }}
                className="text-xs text-[#F5D77F] hover:text-white hover:bg-white/10 h-8 self-end sm:self-auto"
              >
                Mostrar todos os materiais do Club &rarr;
              </Button>
            </div>
          )}
          {/* CATEGORIA 2: PRATELEIRA DE FOTOS (Galeria de Imagens) */}
          {(acervoCategory === 'todos' || acervoCategory === 'photos') && (
            <NetflixShelf
              title={
                selectedMeeting
                  ? `Fotos deste Encontro (${selectedMeeting.title})`
                  : 'Coberturas Fotográficas Oficiais (Fotos)'
              }
              subtitle={
                selectedMeeting
                  ? 'Álbuns fotográficos em alta resolução deste dia'
                  : 'Álbuns em alta resolução dos jantares, imersões e solenidades'
              }
              icon={ImageIcon}
              badge={`${(selectedMeeting ? photoMaterials : allPhotoMaterials).length} fotos/álbuns`}
              action={
                isAdmin
                  ? {
                      label: '+ Anexar Foto',
                      onClick: () => {
                        setNewMatType('photo')
                        setNewMatMeetingId(selectedMeeting?.id || '')
                        setShowAddMaterialModal(true)
                      },
                    }
                  : undefined
              }
            >
              {(selectedMeeting ? photoMaterials : allPhotoMaterials).length > 0 ? (
                (selectedMeeting ? photoMaterials : allPhotoMaterials).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPreviewMedia(item)}
                    className="group relative flex-shrink-0 w-64 sm:w-72 cursor-pointer rounded-2xl overflow-hidden bg-[#0A1A33] border border-slate-800 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#061020]">
                      {(() => {
                        const fileUrl = item.file
                          ? getFileUrl('materials', item.id, item.file)
                          : item.url
                        const kind = detectMaterialKind({
                          file: item.file,
                          url: item.url,
                          title: item.title,
                          type: item.type,
                        })
                        return (
                          <>
                            {fileUrl && kind.subtype === 'photo' ? (
                              <img
                                src={fileUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-blue-950/40">
                                <ImageIcon className="w-8 h-8 text-[#D4AF37]" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33] via-transparent to-black/30" />

                            <div className="absolute top-2.5 left-2.5">
                              <Badge className="text-[9px] uppercase font-bold tracking-wider bg-[#D4AF37] text-slate-950">
                                {kind.label}
                              </Badge>
                            </div>

                            <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 flex items-center gap-1 bg-[#061020]/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
                              <Eye className="w-3 h-3 text-[#D4AF37]" />
                              <span>Ver álbum</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-xs text-white group-hover:text-[#F5D77F] transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                        <span className="font-medium">Galeria Edvanced</span>
                        <span className="text-[#D4AF37] font-semibold group-hover:translate-x-0.5 transition-transform">
                          Abrir Foto &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full p-8 text-center bg-[#0A1A33] rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">Nenhuma foto cadastrada no acervo.</p>
                </div>
              )}
            </NetflixShelf>
          )}
          {/* CATEGORIA 3: PRATELEIRA DE VÍDEOS (Gravações & Palestras) */}
          {(acervoCategory === 'todos' || acervoCategory === 'videos') && (
            <NetflixShelf
              title={
                selectedMeeting
                  ? `Vídeos deste Encontro (${selectedMeeting.title})`
                  : 'Gravações & Streaming VIP (Vídeos)'
              }
              subtitle={
                selectedMeeting
                  ? 'Keynotes e sessões transmitidas deste encontro'
                  : 'Palestras na íntegra, keynotes e gravações completas dos encontros'
              }
              icon={Video}
              badge={`${(selectedMeeting ? videoMaterials : allVideoMaterials).length} vídeos`}
              action={
                isAdmin
                  ? {
                      label: '+ Anexar Vídeo',
                      onClick: () => {
                        setNewMatType('video')
                        setNewMatMeetingId(selectedMeeting?.id || '')
                        setShowAddMaterialModal(true)
                      },
                    }
                  : undefined
              }
            >
              {(selectedMeeting ? videoMaterials : allVideoMaterials).length > 0 ? (
                (selectedMeeting ? videoMaterials : allVideoMaterials).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPreviewMedia(item)}
                    className="group relative flex-shrink-0 w-72 sm:w-80 cursor-pointer rounded-2xl overflow-hidden bg-[#0A1A33] border border-slate-800 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#061020]">
                      <img
                        src="https://img.usecurling.com/p/600/380?q=executive%20keynote%20stage&color=navy"
                        alt="Video Cover"
                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33] via-transparent to-black/40" />

                      <div className="absolute top-2.5 left-2.5">
                        <Badge className="text-[9px] uppercase font-bold tracking-wider bg-rose-600 text-white">
                          Gravação na Íntegra
                        </Badge>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>

                      <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 flex items-center gap-1 bg-[#061020]/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        <span>Assistir streaming</span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-xs text-white group-hover:text-[#F5D77F] transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                        <span className="font-medium">Edvanced Player</span>
                        <span className="text-[#D4AF37] font-semibold group-hover:translate-x-0.5 transition-transform">
                          Reproduzir &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full p-8 text-center bg-[#0A1A33] rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">Nenhum vídeo cadastrado no acervo.</p>
                </div>
              )}
            </NetflixShelf>
          )}
          {/* CATEGORIA 4: PRATELEIRA DE DOCUMENTOS & PDFS */}
          {(acervoCategory === 'todos' || acervoCategory === 'documents') && (
            <NetflixShelf
              title={
                selectedMeeting
                  ? `Documentos & PDFs deste Encontro`
                  : 'Apresentações & PDFs Executivos (Documentos)'
              }
              subtitle={
                selectedMeeting
                  ? 'Apresentações e relatórios vinculados a este dia'
                  : 'Slides apresentados pelos palestrantes, atas executivas e relatórios estratégicos'
              }
              icon={FileText}
              badge={`${(selectedMeeting ? docMaterials : allDocMaterials).length} arquivos`}
              action={
                isAdmin
                  ? {
                      label: '+ Anexar Documento',
                      onClick: () => {
                        setNewMatType('document')
                        setNewMatMeetingId(selectedMeeting?.id || '')
                        setShowAddMaterialModal(true)
                      },
                    }
                  : undefined
              }
            >
              {(selectedMeeting ? docMaterials : allDocMaterials).length > 0 ? (
                (selectedMeeting ? docMaterials : allDocMaterials).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPreviewMedia(item)}
                    className="group relative flex-shrink-0 w-64 sm:w-72 cursor-pointer rounded-2xl overflow-hidden bg-[#0A1A33] border border-slate-800 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
                  >
                    {(() => {
                      const kind = detectMaterialKind({
                        file: item.file,
                        url: item.url,
                        title: item.title,
                        type: item.type,
                      })
                      const isExcel = kind.subtype === 'excel'
                      const isPowerPoint = kind.subtype === 'powerpoint'
                      const isWord = kind.subtype === 'word'
                      const isPdf = kind.subtype === 'pdf'

                      return (
                        <>
                          <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#122443] to-[#061020] flex flex-col items-center justify-center text-slate-200 p-4 text-center">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${
                                isExcel
                                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                                  : isPowerPoint
                                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                                    : isWord
                                      ? 'bg-sky-500/20 border border-sky-400/40 text-sky-300'
                                      : 'bg-blue-500/20 border border-blue-400/40 text-[#F5D77F]'
                              }`}
                            >
                              {isExcel ? (
                                <FileSpreadsheet className="w-6 h-6" />
                              ) : (
                                <FileText className="w-6 h-6" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5D77F]">
                              {isExcel
                                ? 'Planilha Eletrônica'
                                : isPowerPoint
                                  ? 'Apresentação em Slides'
                                  : isWord
                                    ? 'Documento Word'
                                    : isPdf
                                      ? 'Documento PDF (Leitor)'
                                      : 'Documento Executivo'}
                            </span>

                            <div className="absolute top-2.5 left-2.5">
                              <Badge
                                className={`text-[9px] uppercase font-bold tracking-wider ${
                                  isExcel
                                    ? 'bg-emerald-600 text-white'
                                    : isPowerPoint
                                      ? 'bg-amber-600 text-slate-950'
                                      : isWord
                                        ? 'bg-sky-600 text-white'
                                        : isPdf
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-blue-600 text-white'
                                }`}
                              >
                                {kind.label}
                              </Badge>
                            </div>

                            <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 flex items-center gap-1 bg-[#061020]/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
                              <Eye className="w-3 h-3 text-[#D4AF37]" />
                              <span>{isPdf ? 'Ler Todas as Páginas' : 'Visualizar'}</span>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h4 className="font-bold text-xs text-white group-hover:text-[#F5D77F] transition-colors line-clamp-2 leading-snug">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                              <span className="font-medium">
                                {isExcel
                                  ? 'Acervo Planilha'
                                  : isPowerPoint
                                    ? 'Acervo Slides'
                                    : isPdf
                                      ? 'Acervo PDF'
                                      : 'Acervo Documento'}
                              </span>
                              <span className="text-[#D4AF37] font-semibold group-hover:translate-x-0.5 transition-transform">
                                {isPdf ? 'Ler PDF &rarr;' : 'Visualizar / Baixar &rarr;'}
                              </span>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ))
              ) : (
                <div className="w-full p-8 text-center bg-[#0A1A33] rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">Nenhum documento cadastrado no acervo.</p>
                </div>
              )}
            </NetflixShelf>
          )}{' '}
        </div>
      )}
      {/* =========================================================================
          4. VISÃO B: ABA DE CALENDÁRIO UNIFICADO (Fundo Claro / Light Theme)
         ========================================================================= */}
      {mainView === 'calendario' && (
        <div className="space-y-6 animate-fade-in text-slate-900 bg-slate-50/60 p-1 sm:p-2 rounded-3xl">
          {/* Header do Calendário com Filtros Completos & Botão de Exportação ICS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 space-y-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#D4AF37] text-slate-950 font-bold uppercase text-[10px] shadow-xs">
                    Calendário Integrado do Club
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {filteredCalendarEvents.length} evento(s) visíveis
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Agenda Oficial do Business Club & Divulgações dos Membros
                </h2>
                <p className="text-xs text-slate-600">
                  Encontros oficiais em{' '}
                  <span className="text-[#0A1A33] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-[#D4AF37]/40">
                    Azul Escuro Navy & Dourado VIP
                  </span>{' '}
                  e eventos dos membros em{' '}
                  <span className="text-blue-800 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Azul Suave
                  </span>
                  .
                </p>
              </div>

              {/* Botões de Ação Topo: Exportar ICS + Navegação */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Botão de Exportação para Celular / Google Agenda / Apple (.ICS) */}
                <Button
                  onClick={handleExportICS}
                  className="bg-gradient-to-r from-[#0A1A33] to-[#122443] hover:from-[#061020] hover:to-[#0A1A33] text-white border border-[#D4AF37]/40 text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-105"
                  title="Exportar eventos visíveis no formato .ICS para Google Agenda, Apple Calendar ou Celular"
                >
                  <CalendarPlus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Exportar para Celular / Google Agenda (.ics)</span>
                </Button>
              </div>
            </div>

            {/* Controles de Navegação de Data & Alternância Dia / Semana / Mês */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode: Dia / Semana / Mês */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCalendarViewMode('mes')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      calendarViewMode === 'mes'
                        ? 'bg-[#0A1A33] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    Mês
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarViewMode('semana')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      calendarViewMode === 'semana'
                        ? 'bg-[#0A1A33] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarViewMode('dia')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      calendarViewMode === 'dia'
                        ? 'bg-[#0A1A33] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    Dia
                  </button>
                </div>

                {/* Prev / Today / Next */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                    className="h-8 px-2.5 text-xs font-bold text-[#8C6D07] hover:text-slate-950 hover:bg-slate-200/80 rounded-lg"
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

              <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-[#0A1A33] uppercase tracking-wider min-w-[160px] text-center shadow-2xs">
                {format(currentCalendarDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>

            {/* BARRA DE FILTROS DO CALENDÁRIO (Evento, Local, Presencial/Online, Pago/Gratuito, Origem) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-200">
              {/* 1. Busca por Nome de Evento */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Nome do Evento
                </Label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Filtrar evento..."
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

              {/* 3. Formato: Presencial ou Online */}
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
                  <option value="online">Online</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>

              {/* 4. Cobrança: Pago ou Gratuito */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Cobrança / Acesso
                </Label>
                <select
                  value={calPricingFilter}
                  onChange={(e) => setCalPricingFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="todos">Todos (Exclusivo Membros & Pago)</option>
                  <option value="gratuito">Exclusivo Membros Club</option>
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
            <div className="flex flex-wrap items-center gap-4 text-xs pt-2 text-slate-600">
              <span className="font-semibold text-slate-500">Legenda:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0A1A33] border-2 border-[#D4AF37]" />
                <span className="text-slate-800 font-semibold">Business Club (Oficial)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-blue-300" />
                <span className="text-slate-800 font-semibold">Eventos dos Membros</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase font-bold text-emerald-700 border-emerald-300 bg-emerald-50"
                >
                  Exclusivo Membros Club
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
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase tracking-wider text-slate-700 py-3">
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
                      className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                        isCurrentMonth
                          ? 'bg-white hover:bg-slate-50/80'
                          : 'bg-slate-50/70 text-slate-400 opacity-60'
                      } ${isToday ? 'ring-2 ring-inset ring-[#D4AF37] bg-amber-50/20' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            isToday
                              ? 'bg-[#0A1A33] text-[#F5D77F] ring-1 ring-[#D4AF37] font-black shadow-xs'
                              : isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 text-[#0A1A33] border border-slate-200">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1.5 overflow-y-auto max-h-[90px] no-scrollbar">
                        {dayEvents.map((ev) => {
                          const isOfficial = ev.origin === 'meeting'
                          return (
                            <div
                              key={ev.id}
                              onClick={() => handleCalendarEventClick(ev)}
                              className={`p-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-[1.02] truncate border shadow-2xs ${
                                isOfficial
                                  ? 'bg-[#0A1A33] text-white border-[#D4AF37]/60 hover:bg-[#122443] hover:border-[#D4AF37]'
                                  : 'bg-blue-50 text-slate-900 border-blue-200 hover:bg-blue-100/90 hover:border-blue-300'
                              }`}
                              title={`${ev.title} (${ev.format} - ${ev.pricing}) - Clique para ver`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    isOfficial ? 'bg-[#D4AF37]' : 'bg-blue-600'
                                  }`}
                                />
                                <span className="truncate font-bold">{ev.title}</span>
                              </div>
                              <div
                                className={`flex items-center justify-between text-[9px] mt-0.5 ${
                                  isOfficial ? 'text-blue-200' : 'text-blue-700'
                                }`}
                              >
                                <span className="font-medium">{formatTimeString(ev.date)}</span>
                                <span
                                  className={`uppercase text-[8px] font-extrabold ${
                                    isOfficial ? 'text-[#F5D77F]' : 'text-blue-900'
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
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm p-4">
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
                      className={`rounded-2xl p-3 bg-slate-50/80 border min-h-[220px] flex flex-col justify-between transition-all ${
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

                      <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
                        {dayEvents.length > 0 ? (
                          dayEvents.map((ev) => {
                            const isOfficial = ev.origin === 'meeting'
                            return (
                              <div
                                key={ev.id}
                                onClick={() => handleCalendarEventClick(ev)}
                                className={`p-2.5 rounded-xl text-xs cursor-pointer border transition-all hover:scale-[1.02] shadow-2xs ${
                                  isOfficial
                                    ? 'bg-[#0A1A33] text-white border-[#D4AF37]/60 hover:bg-[#122443] shadow-sm'
                                    : 'bg-blue-50 text-slate-900 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <Badge
                                    className={`text-[8px] uppercase font-extrabold ${
                                      isOfficial
                                        ? 'bg-[#D4AF37] text-slate-950'
                                        : 'bg-blue-700 text-white'
                                    }`}
                                  >
                                    {isOfficial ? 'Club' : 'Membro'}
                                  </Badge>
                                  <span
                                    className={`text-[10px] font-bold ${
                                      isOfficial ? 'text-[#F5D77F]' : 'text-blue-800'
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
                                      isOfficial ? 'text-blue-200' : 'text-slate-600'
                                    }`}
                                  >
                                    <MapPin
                                      className={`w-3 h-3 ${
                                        isOfficial ? 'text-[#D4AF37]' : 'text-blue-700'
                                      }`}
                                    />
                                    {ev.location}
                                  </p>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-[11px]">
                            Sem eventos
                          </div>
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
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
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
                        Nenhum encontro do Business Club ou divulgação de membros coincide com os
                        filtros aplicados.
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
                          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            isOfficial
                              ? 'bg-[#0A1A33] text-white border-[#D4AF37]/50 hover:bg-[#122443] shadow-md'
                              : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400 hover:bg-slate-50/60 shadow-xs'
                          }`}
                        >
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={`text-[10px] font-black uppercase tracking-wider ${
                                  isOfficial
                                    ? 'bg-[#D4AF37] text-slate-950'
                                    : 'bg-teal-700 text-white'
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
                                {ev.pricing === 'pago' ? 'Pago' : 'Exclusivo Membros Club'}
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
                            <Button
                              className={`font-bold text-xs ${
                                isOfficial
                                  ? 'bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 shadow-sm'
                                  : 'bg-[#0A1A33] hover:bg-[#122443] text-white shadow-xs'
                              }`}
                            >
                              {isOfficial ? 'Acessar Encontro & Materiais →' : 'Ver Detalhes →'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}
      {/* =========================================================================
          MODAIS: PREVIEW DE MÍDIA, DETALHES DE ENCONTRO E DETALHES DO EVENTO CALENDÁRIO
         ========================================================================= */}
      {/* 1. Modal Preview de Foto / Vídeo / Documento / Planilha */}
      {previewMedia && (
        <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
          <DialogContent
            className={`bg-[#0A1A33] text-white border-slate-800 p-6 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto transition-all ${(() => {
              const k = detectMaterialKind({
                file: previewMedia.file,
                url: previewMedia.url,
                title: previewMedia.title,
                type: previewMedia.type,
              })
              return k.subtype === 'pdf' ? 'max-w-5xl' : 'max-w-3xl'
            })()}`}
          >
            {(() => {
              const fileUrl = previewMedia.file
                ? getFileUrl('materials', previewMedia.id, previewMedia.file)
                : previewMedia.url
              const kind = detectMaterialKind({
                file: previewMedia.file,
                url: previewMedia.url,
                title: previewMedia.title,
                type: previewMedia.type,
              })
              const isExcel = kind.subtype === 'excel'
              const isPdf = kind.subtype === 'pdf'
              const isPpt = kind.subtype === 'powerpoint'
              const isWord = kind.subtype === 'word'
              const isVideo = kind.subtype === 'video'
              const isPhoto = kind.subtype === 'photo'

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-slate-950 uppercase font-black text-[10px] ${
                          isPdf
                            ? 'bg-gradient-to-r from-[#F5D77F] to-[#D4AF37]'
                            : isExcel
                              ? 'bg-emerald-500 text-white'
                              : isPpt
                                ? 'bg-amber-500 text-slate-950'
                                : isVideo
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-[#D4AF37] text-slate-950'
                        }`}
                      >
                        {kind.label}
                      </Badge>
                      {isPdf && (
                        <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                          Visualização Completa de Todas as Páginas
                        </span>
                      )}
                    </div>
                    <DialogTitle className="text-lg font-bold text-white">
                      {previewMedia.title}
                    </DialogTitle>
                    {previewMedia.description && (
                      <DialogDescription className="text-xs text-slate-300">
                        {previewMedia.description}
                      </DialogDescription>
                    )}
                  </DialogHeader>

                  <div className="my-4">
                    {/* Visualizador Completo de PDF com navegação de páginas */}
                    {isPdf && fileUrl ? (
                      <PdfDocumentViewer
                        url={fileUrl}
                        title={previewMedia.title}
                        fileName={previewMedia.file}
                        className="w-full"
                      />
                    ) : (
                      <div className="rounded-2xl overflow-hidden bg-[#061020] flex items-center justify-center min-h-[300px] border border-slate-800 p-4">
                        {/* Visualizador de Foto */}
                        {isPhoto && fileUrl && (
                          <img
                            src={fileUrl}
                            alt={previewMedia.title}
                            className="max-h-[500px] w-auto max-w-full object-contain rounded-xl"
                          />
                        )}

                        {/* Visualizador de Vídeo */}
                        {isVideo && fileUrl && (
                          <div className="w-full flex flex-col items-center justify-center">
                            <video
                              src={fileUrl}
                              controls
                              className="max-h-[500px] w-full object-contain rounded-xl shadow-lg"
                            />
                          </div>
                        )}

                        {/* Visualizador de Excel */}
                        {isExcel && fileUrl && (
                          <div className="p-8 text-center text-white space-y-4">
                            <FileSpreadsheet className="w-16 h-16 text-emerald-400 mx-auto" />
                            <div>
                              <p className="text-sm font-bold">
                                Planilha Eletrônica Excel (.xlsx / .xls / .csv)
                              </p>
                              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                                Arquivo de planilha executiva disponível para download.
                              </p>
                            </div>
                            <div className="pt-2">
                              <a
                                href={fileUrl}
                                download={previewMedia.file || previewMedia.title}
                                className="inline-block"
                              >
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20">
                                  <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar Planilha Excel
                                </Button>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Visualizador de PowerPoint / Apresentação */}
                        {isPpt && fileUrl && (
                          <div className="p-8 text-center text-white space-y-4">
                            <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                            <div>
                              <p className="text-sm font-bold">
                                Apresentação em Slides (.pptx / .ppt)
                              </p>
                              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                                Arquivo de apresentação executiva disponível para download.
                              </p>
                            </div>
                            <div className="pt-2">
                              <a
                                href={fileUrl}
                                download={previewMedia.file || previewMedia.title}
                                className="inline-block"
                              >
                                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20">
                                  <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar Apresentação
                                </Button>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Outros tipos genéricos de documento / Word */}
                        {!isPhoto && !isVideo && !isPdf && !isExcel && !isPpt && fileUrl && (
                          <div className="p-8 text-center text-white space-y-4">
                            <FileText className="w-16 h-16 text-blue-400 mx-auto" />
                            <div>
                              <p className="text-sm font-bold">
                                {isWord ? 'Documento Word (.docx / .doc)' : 'Arquivo do Acervo'}
                              </p>
                              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                                Clique abaixo para acessar ou transferir o arquivo.
                              </p>
                            </div>
                            <a
                              href={fileUrl}
                              download={previewMedia.file || previewMedia.title}
                              className="inline-block pt-2"
                            >
                              <Button className="bg-[#D4AF37] text-slate-950 font-bold hover:bg-[#F5D77F] text-xs">
                                <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar Arquivo
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewMedia(null)}
                      className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                    >
                      Fechar
                    </Button>

                    {fileUrl && (
                      <a
                        href={fileUrl}
                        download={previewMedia.file || previewMedia.title}
                        className="inline-block"
                      >
                        <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar Arquivo</span>
                        </Button>
                      </a>
                    )}
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>
      )}
      {/* 2. Modal Detalhes do Encontro */}
      {detailMeeting && (
        <Dialog open={!!detailMeeting} onOpenChange={(open) => !open && setDetailMeeting(null)}>
          <DialogContent className="max-w-2xl bg-[#0A1A33] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-bold text-[10px]">
                  {detailMeeting.type || 'Presencial'}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    detailMeeting.pricing === 'pago'
                      ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                      : 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                  }`}
                >
                  {detailMeeting.pricing === 'pago' ? 'Pago' : 'Exclusivo para Membros'}
                </Badge>
                {(() => {
                  const status = getMeetingStatus(detailMeeting)
                  const StatusIcon = status.icon
                  return (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${status.badgeClass}`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  )
                })()}
              </div>
              <DialogTitle className="text-xl md:text-2xl font-black text-white leading-tight">
                {detailMeeting.title}
              </DialogTitle>
              {detailMeeting.event_name && (
                <p className="text-xs font-bold text-[#F5D77F] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Série: {detailMeeting.event_name}</span>
                </p>
              )}
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#D4AF37]" /> Data & Horário
                  </p>
                  <p className="text-white font-bold">
                    {formatDateString(detailMeeting.start_date || detailMeeting.date)}
                  </p>
                  <p className="text-slate-300">
                    {formatTimeString(detailMeeting.start_date || detailMeeting.date)}
                    {detailMeeting.end_date
                      ? ` até ${formatTimeString(detailMeeting.end_date)}`
                      : ''}
                  </p>
                </div>

                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> Localização
                  </p>
                  <p className="text-white font-bold">{detailMeeting.location}</p>
                </div>
              </div>

              {detailMeeting.speakers && (
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 text-xs space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" /> Palestrantes & Convidados
                  </p>
                  <p className="text-white">{detailMeeting.speakers}</p>
                </div>
              )}

              {detailMeeting.description && (
                <div className="p-4 bg-[#061020]/80 rounded-2xl border border-slate-800 text-xs text-slate-200 max-h-48 overflow-y-auto leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: detailMeeting.description }} />
                </div>
              )}

              {/* Materiais vinculados a este Encontro */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Materiais & Mídias deste Encontro ({currentMeetingMaterials.length})
                  </h4>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewMatMeetingId(detailMeeting.id)
                        setShowAddMaterialModal(true)
                      }}
                      className="h-6 text-[10px] bg-blue-900/80 hover:bg-blue-800 text-blue-200"
                    >
                      + Anexar Material
                    </Button>
                  )}
                </div>

                {currentMeetingMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {currentMeetingMaterials.map((mat) => {
                      const kind = detectMaterialKind({
                        file: mat.file,
                        url: mat.url,
                        title: mat.title,
                        type: mat.type,
                      })

                      return (
                        <div
                          key={mat.id}
                          onClick={() => setPreviewMedia(mat)}
                          className="p-2.5 rounded-xl bg-[#061020] border border-slate-800 hover:border-[#D4AF37] cursor-pointer flex items-center justify-between gap-2 transition-all group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {kind.subtype === 'photo' ? (
                              <ImageIcon className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                            ) : kind.subtype === 'video' ? (
                              <Video className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            ) : kind.subtype === 'excel' ? (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-white truncate group-hover:text-[#F5D77F]">
                                {mat.title}
                              </p>
                              <span className="text-[10px] text-blue-300/70 font-semibold">
                                {kind.label}
                              </span>
                            </div>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-[#D4AF37] opacity-60 group-hover:opacity-100 flex-shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-[#061020]/40 rounded-xl border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400">
                      Nenhum material anexado especificamente a este encontro ainda.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setDetailMeeting(null)}
                className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Fechar
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => {
                    const m = detailMeeting
                    setDetailMeeting(null)
                    handleOpenEditMeeting(m)
                  }}
                  className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar Encontro
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* 3. Modal Detalhes do Evento do Calendário (Unificado) */}
      {selectedCalendarEvent && (
        <Dialog
          open={!!selectedCalendarEvent}
          onOpenChange={(open) => !open && setSelectedCalendarEvent(null)}
        >
          <DialogContent className="max-w-2xl bg-[#0A1A33] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`uppercase font-black text-[10px] ${
                    selectedCalendarEvent.origin === 'meeting'
                      ? 'bg-[#D4AF37] text-slate-950'
                      : 'bg-blue-700 text-white'
                  }`}
                >
                  {selectedCalendarEvent.origin === 'meeting'
                    ? 'Edvanced Business Club'
                    : 'Evento do Membro'}
                </Badge>

                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold text-blue-200 border-blue-800"
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
                  {selectedCalendarEvent.pricing === 'pago' ? 'Pago' : 'Exclusivo Membros Club'}
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
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#D4AF37]" /> Data do Evento
                  </p>
                  <p className="text-white font-bold">
                    {formatDateString(selectedCalendarEvent.date)}
                  </p>
                  <p className="text-slate-300">
                    {formatTimeString(selectedCalendarEvent.date)}
                    {selectedCalendarEvent.endDate
                      ? ` às ${formatTimeString(selectedCalendarEvent.endDate)}`
                      : ''}
                  </p>
                </div>

                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> Local / Plataforma
                  </p>
                  <p className="text-white font-bold">
                    {selectedCalendarEvent.location || 'Online / A combinar'}
                  </p>
                </div>
              </div>

              {selectedCalendarEvent.speakers && (
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" /> Palestrantes & Convidados
                  </p>
                  <p className="text-white">{selectedCalendarEvent.speakers}</p>
                </div>
              )}

              {selectedCalendarEvent.description && (
                <div className="p-4 bg-[#061020]/80 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedCalendarEvent.description.startsWith('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedCalendarEvent.description }} />
                  ) : (
                    selectedCalendarEvent.description
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setSelectedCalendarEvent(null)}
                className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Fechar
              </Button>

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
          </DialogContent>
        </Dialog>
      )}
      {/* =========================================================================
          ADMIN: CRIAR / EDITAR ENCONTRO MODAL
         ========================================================================= */}
      {showMeetingModal && (
        <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
          <DialogContent className="max-w-xl bg-[#0A1A33] text-white border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white">
                {editingMeeting ? 'Editar Encontro Oficial' : 'Cadastrar Novo Encontro Oficial'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Configure os dados do encontro oficial. Selecione formato e cobrança.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveMeeting} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1">
                <Label className="text-slate-200">Título do Encontro *</Label>
                <Input
                  placeholder="Ex: Mastermind de Escala & Governança 2026"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-200">
                  Nome do Evento / Série (exibido em destaque)
                </Label>
                <Input
                  placeholder="Ex: Edvanced Executive Immersion 2026"
                  value={meetingEventName}
                  onChange={(e) => setMeetingEventName(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                />
              </div>

              {/* Data Início & Previsão de Fim com step 900 (15 min) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-200">Data e Hora de Início * (passo: 15 min)</Label>
                  <Input
                    type="datetime-local"
                    step={900}
                    value={meetingStartDate}
                    onChange={(e) => setMeetingStartDate(e.target.value)}
                    className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-200">Previsão de Fim (passo: 15 min)</Label>
                  <Input
                    type="datetime-local"
                    step={900}
                    value={meetingEndDate}
                    onChange={(e) => setMeetingEndDate(e.target.value)}
                    className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                  />
                </div>
              </div>

              {/* Formato & Cobrança */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-200">Formato do Encontro *</Label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl bg-[#061020] border border-slate-800 text-white text-xs"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="online">Online VIP</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-200">Cobrança / Acesso *</Label>
                  <select
                    value={meetingPricing}
                    onChange={(e) => setMeetingPricing(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl bg-[#061020] border border-slate-800 text-white text-xs"
                  >
                    <option value="gratuito">Exclusivo para Membros</option>
                    <option value="pago">Pago (Inscrição Extra)</option>
                  </select>
                </div>
              </div>

              {/* Upload da Imagem de Capa do Encontro */}
              <div className="space-y-2 p-3 bg-[#061020]/70 rounded-2xl border border-slate-800">
                <Label className="text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                    Imagem de Capa do Encontro (Estilo Netflix / Formato 16:9)
                  </span>
                  {meetingCoverPreview && (
                    <span className="text-[10px] text-[#F5D77F] font-semibold">
                      Capa selecionada
                    </span>
                  )}
                </Label>

                {meetingCoverPreview && (
                  <div className="relative aspect-[16/9] w-full max-h-40 rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-black/40 group">
                    <img
                      src={meetingCoverPreview}
                      alt="Preview da Capa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setMeetingCoverFile(null)
                          setMeetingCoverPreview('')
                        }}
                        className="text-[11px] h-7 px-3 bg-rose-600 hover:bg-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover Imagem
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setMeetingCoverFile(file)
                        const previewUrl = URL.createObjectURL(file)
                        setMeetingCoverPreview(previewUrl)
                      }
                    }}
                    className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-slate-950 hover:file:bg-[#F5D77F] file:cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Formatos aceitos: JPG, PNG, WEBP. Tamanho máx.: 10MB. Se não enviada, será
                  utilizado um gradiente premium padrão.
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-200">Local / Plataforma de Transmissão *</Label>
                <Input
                  placeholder="Ex: Palácio Tangará - SP ou Zoom VIP"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                  required
                />
              </div>

              {/* Link de Inscrição Externa */}
              <div className="space-y-1 p-3 bg-[#061020]/70 rounded-2xl border border-slate-800">
                <Label className="text-[#F5D77F] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                    Link de Inscrição Externa (Página Pública de Eventos)
                  </span>
                  <span className="text-[10px] text-slate-300 font-normal">
                    Opcional / Recomendado
                  </span>
                </Label>
                <Input
                  placeholder="https://eventos.edvanced.com.br/... ou link Sympla/Hotmart/Formulário"
                  value={meetingRegistrationUrl}
                  onChange={(e) => setMeetingRegistrationUrl(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400">
                  Este link será exibido no botão "Inscrever-se" da aba pública de eventos para o
                  público externo.
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-200">Palestrantes / Convidados Especiais</Label>
                <Input
                  placeholder="Ex: Ediane Dal Bosco, Dr. Fernando Cintra"
                  value={meetingSpeakers}
                  onChange={(e) => setMeetingSpeakers(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-200">Pauta / Descrição</Label>
                <Textarea
                  placeholder="Detalhes, cronograma ou tópicos discutidos..."
                  value={meetingDesc}
                  onChange={(e) => setMeetingDesc(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMeetingModal(false)}
                  className="text-xs border-slate-700 text-slate-200"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs"
                >
                  {isSubmitting
                    ? 'Salvando...'
                    : editingMeeting
                      ? 'Salvar Alterações'
                      : 'Criar Encontro'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {/* =========================================================================
          ADMIN: ADICIONAR MATERIAL MODAL (Com Upload Direto de Vídeo, Foto, Excel, PDF)
         ========================================================================= */}
      {showAddMaterialModal && (
        <Dialog
          open={showAddMaterialModal}
          onOpenChange={(open) => {
            setShowAddMaterialModal(open)
            if (!open) {
              setNewMatFile(null)
              setNewMatFilePreview(null)
            }
          }}
        >
          <DialogContent className="max-w-lg bg-[#0A1A33] text-white border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white">
                Adicionar Material ao Acervo
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Selecione o encontro e anexe um arquivo direto do computador (Vídeo, Foto, PDF,
                Excel) ou insira um link externo.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMaterial} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1">
                <Label className="text-slate-200">Encontro Relacionado *</Label>
                <select
                  value={newMatMeetingId || selectedMeeting?.id || ''}
                  onChange={(e) => setNewMatMeetingId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#061020] border border-slate-800 text-white text-xs"
                  required
                >
                  <option value="">Selecione um encontro...</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-200">Título do Arquivo / Álbum *</Label>
                <Input
                  placeholder="Ex: Apresentação Executiva em Slides / Planilha de Metas"
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-200">Tipo de Categoria *</Label>
                <select
                  value={newMatType}
                  onChange={(e) => setNewMatType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl bg-[#061020] border border-slate-800 text-white text-xs"
                >
                  <option value="photo">Foto / Imagem (Galeria JPG, PNG, WEBP)</option>
                  <option value="video">Vídeo (Gravação MP4, WEBM, MOV)</option>
                  <option value="document">Documento (PDF, Planilha Excel .xlsx/.xls)</option>
                </select>
              </div>

              {/* Upload direto de arquivo do computador */}
              <div className="p-4 rounded-2xl bg-[#061020] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[#F5D77F] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#D4AF37]" /> Upload Direto do Computador
                  </Label>
                  <span className="text-[10px] text-slate-400">Até 100MB</span>
                </div>

                <Input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,image/jpeg,image/png,image/webp,image/gif,.pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 100 * 1024 * 1024) {
                        toast.error('O arquivo excede o limite máximo permitido de 100MB.')
                        return
                      }
                      setNewMatFile(file)

                      const detected = detectMaterialKind(file)
                      setNewMatType(detected.category)

                      if (detected.category === 'photo' || detected.category === 'video') {
                        try {
                          setNewMatFilePreview(URL.createObjectURL(file))
                        } catch {
                          setNewMatFilePreview(null)
                        }
                      } else {
                        setNewMatFilePreview(null)
                      }

                      if (!newMatTitle) {
                        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
                        setNewMatTitle(nameWithoutExt)
                      }
                    }
                  }}
                  className="text-xs bg-[#0A1A33] border-slate-700 text-white rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-slate-950 hover:file:bg-[#F5D77F] file:cursor-pointer"
                />

                {newMatFile && (
                  <div className="p-3 bg-[#0A1A33] rounded-xl border border-slate-700 flex items-center justify-between gap-2">
                    {(() => {
                      const detected = detectMaterialKind(newMatFile)
                      return (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            {detected.subtype === 'photo' && (
                              <ImageIcon className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                            )}
                            {detected.subtype === 'video' && (
                              <Video className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            )}
                            {detected.subtype === 'pdf' && (
                              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            )}
                            {detected.subtype === 'excel' && (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            )}
                            {detected.subtype === 'powerpoint' && (
                              <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            )}
                            {detected.subtype === 'word' && (
                              <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                            )}
                            {detected.subtype === 'document' && (
                              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p
                                className="text-xs font-semibold text-white truncate"
                                title={newMatFile.name}
                              >
                                {newMatFile.name}
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                <span className="text-[#F5D77F] font-semibold">
                                  {detected.label}
                                </span>
                                <span>&bull;</span>
                                <span>{(newMatFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewMatFile(null)
                              setNewMatFilePreview(null)
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-7 px-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                          </Button>
                        </>
                      )
                    })()}
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  Formatos aceitos: Vídeos (.mp4, .webm, .mov), Fotos (.jpg, .png, .webp), Planilhas
                  (.xls, .xlsx) e PDFs (.pdf).
                </p>
              </div>

              {/* Ou URL Externa alternativa */}
              <div className="space-y-1">
                <Label className="text-slate-300 flex items-center justify-between">
                  <span>Ou Link / URL Externa</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Opcional se enviar arquivo acima
                  </span>
                </Label>
                <Input
                  placeholder="https://... (ex: link do YouTube, Vimeo, Google Drive)"
                  value={newMatUrl}
                  onChange={(e) => setNewMatUrl(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-200">Descrição / Notas</Label>
                <Textarea
                  placeholder="Informações adicionais para os associados..."
                  value={newMatDesc}
                  onChange={(e) => setNewMatDesc(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-800 text-white rounded-xl"
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="text-xs border-slate-700 text-slate-200"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs"
                >
                  {isSubmitting ? 'Salvando...' : 'Adicionar ao Acervo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}{' '}
    </div>
  )
}
