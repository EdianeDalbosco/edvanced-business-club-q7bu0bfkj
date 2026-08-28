import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  ExternalLink,
  Play,
  Video,
  Crown,
  Search,
  Filter,
  Users,
  Mic,
  Share2,
  Tv,
  CheckCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ChevronRight,
  CalendarCheck2,
  Hourglass,
  Layers,
  X,
  Copy,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  FileText,
  Eye,
  Instagram,
  Phone,
  Mail,
  FolderOpen,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  getMeetings,
  getEdvancedCastEpisodes,
  getAllMaterials,
  getFileUrl,
  createEdvancedCastEpisode,
  updateEdvancedCastEpisode,
  deleteEdvancedCastEpisode,
} from '@/services/api'
import type { Meeting, EdvancedCastEpisode, Material } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// Helper to extract YouTube video ID
export function getYouTubeId(url?: string): string | null {
  if (!url) return null
  const clean = url.trim()
  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/,
  )
  return ytMatch && ytMatch[1] ? ytMatch[1] : null
}

// Helper to convert YouTube / Vimeo url to embed URL
export function getVideoEmbedUrl(url?: string): string | null {
  if (!url) return null
  const clean = url.trim()

  // YouTube formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/,
  )
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
  }

  // Vimeo formats:
  // - https://vimeo.com/VIDEO_ID
  // - https://player.vimeo.com/video/VIDEO_ID
  const vimeoMatch = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  }

  // Direct video file link (.mp4, .webm) or unknown iframe url
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean
  }

  return null
}

export function isDirectVideoFile(url?: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.includes('.mp4?')
  )
}

export default function PublicPortal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAdmin } = useAuth()

  // Tab switch: 'eventos' | 'podcast' | 'materiais'
  const rawTab = searchParams.get('aba')
  const activeTab: 'eventos' | 'podcast' | 'materiais' =
    rawTab === 'podcast' ? 'podcast' : rawTab === 'materiais' ? 'materiais' : 'eventos'

  const setTab = (tab: 'eventos' | 'podcast' | 'materiais') => {
    setSearchParams({ aba: tab })
  }

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [episodes, setEpisodes] = useState<EdvancedCastEpisode[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Search and filters for Public Events
  const [eventSearch, setEventSearch] = useState('')
  const [eventFormat, setEventFormat] = useState<'todos' | 'presencial' | 'online' | 'hibrido'>(
    'todos',
  )
  const [eventPricing, setEventPricing] = useState<'todos' | 'gratuito' | 'pago'>('todos')
  const [eventMonth, setEventMonth] = useState<string>('todos')

  // Search for Podcast Episodes
  const [podcastSearch, setPodcastSearch] = useState('')

  // Search and filters for Public Materials
  const [materialSearch, setMaterialSearch] = useState('')
  const [materialTypeFilter, setMaterialTypeFilter] = useState<'todos' | 'photo' | 'video' | 'document'>('todos')
  const [materialMeetingFilter, setMaterialMeetingFilter] = useState<string>('todos')

  // Video Player Modal
  const [activeVideoEpisode, setActiveVideoEpisode] = useState<EdvancedCastEpisode | null>(null)

  // Media Preview Modal (for Public Materials: Photo/Video/Document)
  const [previewMediaModal, setPreviewMediaModal] = useState<Material | null>(null)

  // Event Details Modal
  const [selectedEventModal, setSelectedEventModal] = useState<Meeting | null>(null)

  // Admin Podcast Manage Modals
  const [showPodcastModal, setShowPodcastModal] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<EdvancedCastEpisode | null>(null)
  const [castTitle, setCastTitle] = useState('')
  const [castDesc, setCastDesc] = useState('')
  const [castVideoUrl, setCastVideoUrl] = useState('')
  const [castThumbnailUrl, setCastThumbnailUrl] = useState('')
  const [castCoverFile, setCastCoverFile] = useState<File | null>(null)
  const [castCoverPreview, setCastCoverPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [castDuration, setCastDuration] = useState('')
  const [castEpNumber, setCastEpNumber] = useState<number | ''>('')
  const [castPublishedAt, setCastPublishedAt] = useState('')
  const [isSavingEpisode, setIsSavingEpisode] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [meets, eps, mats] = await Promise.all([
        getMeetings().catch(() => [] as Meeting[]),
        getEdvancedCastEpisodes().catch(() => [] as EdvancedCastEpisode[]),
        getAllMaterials().catch(() => [] as Material[]),
      ])
      setMeetings(meets)
      setEpisodes(eps)
      setMaterials(mats)
    } catch (err) {
      console.error('Erro ao carregar dados da página pública:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Check if an episode is linked from URL
  useEffect(() => {
    const epId = searchParams.get('episodio')
    if (epId && episodes.length > 0) {
      const found = episodes.find((e) => e.id === epId)
      if (found) {
        setActiveVideoEpisode(found)
        setTab('podcast')
      }
    }
  }, [searchParams, episodes])

  // Formatting helpers
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

  const getMeetingCover = (m: Meeting) => {
    if (m.cover_image) {
      return getFileUrl('meetings', m.id, m.cover_image)
    }
    return ''
  }

  // Get Episode Cover URL or fallback
  const getEpisodeCoverUrl = (ep: EdvancedCastEpisode) => {
    if (ep.cover_image) {
      return getFileUrl('edvanced_cast', ep.id, ep.cover_image)
    }
    if (ep.thumbnail_url) {
      return ep.thumbnail_url
    }
    return ''
  }

  // Generate share URL and handlers
  const getEpisodeShareUrl = (ep: EdvancedCastEpisode) => {
    const origin = window.location.origin
    return `${origin}/publico?aba=podcast&episodio=${ep.id}`
  }

  const handleCopyEpisodeLink = (e: React.MouseEvent, ep: EdvancedCastEpisode) => {
    e.stopPropagation()
    const url = getEpisodeShareUrl(ep)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      toast.success('Link do episódio copiado para a área de transferência!')
    } else {
      toast.info(`Link do episódio: ${url}`)
    }
  }

  const handleShareWhatsApp = (e: React.MouseEvent, ep: EdvancedCastEpisode) => {
    e.stopPropagation()
    const url = getEpisodeShareUrl(ep)
    const epNumberStr = ep.episode_number ? ` #${ep.episode_number}` : ''
    const text = encodeURIComponent(
      `🎙️ Assista ao EdvancedCast${epNumberStr}: "${ep.title}" no Edvanced Business Club!\n\nConfira o episódio completo:\n${url}`,
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date()
    const startStr = meeting.start_date || meeting.date
    if (!startStr) {
      return {
        key: 'scheduled',
        label: 'Inscrições Abertas',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
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
        label: 'Inscrições Abertas',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: CalendarIcon,
      }
    } else if (now >= start && now <= end) {
      return {
        key: 'ongoing',
        label: 'Acontecendo Agora',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
        icon: Hourglass,
      }
    } else {
      return {
        key: 'completed',
        label: 'Encerrado',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        icon: CalendarCheck2,
      }
    }
  }

  // Unique months available in meetings
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { key: string; label: string; date: Date }>()
    meetings.forEach((m) => {
      const dateStr = m.start_date || m.date
      if (!dateStr) return
      try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return
        const key = format(d, 'yyyy-MM')
        if (!monthMap.has(key)) {
          const rawLabel = format(d, 'MMMM yyyy', { locale: ptBR })
          const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
          monthMap.set(key, { key, label, date: d })
        }
      } catch {
        /* intentionally ignored */
      }
    })
    return Array.from(monthMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [meetings])

  // Filtered official Club meetings (strictly meetings, NEVER disclosures)
  const filteredEvents = useMemo(() => {
    return meetings.filter((m) => {
      const q = eventSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        m.title?.toLowerCase().includes(q) ||
        m.event_name?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q) ||
        m.speakers?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (eventFormat !== 'todos' && m.type !== eventFormat) return false
      if (eventPricing !== 'todos' && m.pricing !== eventPricing) return false

      if (eventMonth !== 'todos') {
        const dateStr = m.start_date || m.date
        if (!dateStr) return false
        try {
          const d = new Date(dateStr)
          const mKey = format(d, 'yyyy-MM')
          if (mKey !== eventMonth) return false
        } catch {
          return false
        }
      }

      return true
    })
  }, [meetings, eventSearch, eventFormat, eventPricing, eventMonth])

  // Filtered EdvancedCast episodes
  const filteredEpisodes = useMemo(() => {
    return episodes.filter((ep) => {
      const q = podcastSearch.toLowerCase().trim()
      if (!q) return true
      return (
        ep.title?.toLowerCase().includes(q) ||
        ep.description?.toLowerCase().includes(q) ||
        String(ep.episode_number || '').includes(q)
      )
    })
  }, [episodes, podcastSearch])

  // Filtered Public Materials (Photos, Videos, Documents)
  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      const q = materialSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        mat.title?.toLowerCase().includes(q) ||
        mat.description?.toLowerCase().includes(q) ||
        mat.expand?.meeting?.title?.toLowerCase().includes(q) ||
        mat.expand?.meeting?.event_name?.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (materialTypeFilter !== 'todos' && mat.type !== materialTypeFilter) return false

      if (materialMeetingFilter !== 'todos') {
        const matMeetId = mat.meeting || (mat as any).meeting_id
        if (matMeetId !== materialMeetingFilter) return false
      }

      return true
    })
  }, [materials, materialSearch, materialTypeFilter, materialMeetingFilter])

  // Materials grouped by meeting or standalone for nice presentation
  const materialsByMeeting = useMemo(() => {
    const map = new Map<string, { meeting: Meeting | null; items: Material[] }>()
    filteredMaterials.forEach((mat) => {
      const meetId = mat.meeting || (mat as any).meeting_id || 'sem_encontro'
      if (!map.has(meetId)) {
        const foundMeeting = meetings.find((m) => m.id === meetId) || mat.expand?.meeting || null
        map.set(meetId, { meeting: foundMeeting, items: [] })
      }
      map.get(meetId)!.items.push(mat)
    })
    return Array.from(map.values())
  }, [filteredMaterials, meetings])

  // Admin: Open Add/Edit Episode
  const handleOpenAddEpisode = () => {
    setEditingEpisode(null)
    setCastTitle('')
    setCastDesc('')
    setCastVideoUrl('')
    setCastThumbnailUrl('')
    setCastCoverFile(null)
    setCastCoverPreview('')
    setCastDuration('')
    setCastEpNumber(episodes.length + 1)
    setCastPublishedAt(new Date().toISOString().split('T')[0])
    setShowPodcastModal(true)
  }

  const handleOpenEditEpisode = (ep: EdvancedCastEpisode) => {
    setEditingEpisode(ep)
    setCastTitle(ep.title || '')
    setCastDesc(ep.description || '')
    setCastVideoUrl(ep.video_url || '')
    setCastThumbnailUrl(ep.thumbnail_url || '')
    setCastCoverFile(null)
    setCastCoverPreview(ep.cover_image ? getFileUrl('edvanced_cast', ep.id, ep.cover_image) : '')
    setCastDuration(ep.duration || '')
    setCastEpNumber(ep.episode_number ?? '')
    setCastPublishedAt(ep.published_at ? ep.published_at.split('T')[0] : '')
    setShowPodcastModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCastCoverFile(file)
      const previewUrl = URL.createObjectURL(file)
      setCastCoverPreview(previewUrl)
    }
  }

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!castTitle.trim() || !castVideoUrl.trim()) {
      toast.error('Título e Link do Vídeo são obrigatórios.')
      return
    }

    setIsSavingEpisode(true)
    try {
      if (castCoverFile) {
        // Use FormData for file upload
        const formData = new FormData()
        formData.append('title', castTitle.trim())
        formData.append('description', castDesc.trim())
        formData.append('video_url', castVideoUrl.trim())
        if (castThumbnailUrl.trim()) {
          formData.append('thumbnail_url', castThumbnailUrl.trim())
        }
        if (castDuration.trim()) {
          formData.append('duration', castDuration.trim())
        }
        if (typeof castEpNumber === 'number') {
          formData.append('episode_number', String(castEpNumber))
        }
        if (castPublishedAt) {
          formData.append('published_at', new Date(castPublishedAt).toISOString())
        }
        formData.append('cover_image', castCoverFile)

        if (editingEpisode) {
          await updateEdvancedCastEpisode(editingEpisode.id, formData)
          toast.success('Episódio do EdvancedCast atualizado com sucesso!')
        } else {
          await createEdvancedCastEpisode(formData)
          toast.success('Novo episódio publicado com sucesso no EdvancedCast!')
        }
      } else {
        const data: Partial<EdvancedCastEpisode> = {
          title: castTitle.trim(),
          description: castDesc.trim(),
          video_url: castVideoUrl.trim(),
          thumbnail_url: castThumbnailUrl.trim() || undefined,
          duration: castDuration.trim() || undefined,
          episode_number: typeof castEpNumber === 'number' ? castEpNumber : undefined,
          published_at: castPublishedAt ? new Date(castPublishedAt).toISOString() : undefined,
        }

        if (editingEpisode) {
          await updateEdvancedCastEpisode(editingEpisode.id, data)
          toast.success('Episódio do EdvancedCast atualizado com sucesso!')
        } else {
          await createEdvancedCastEpisode(data)
          toast.success('Novo episódio publicado com sucesso no EdvancedCast!')
        }
      }

      setShowPodcastModal(false)
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao salvar episódio: ' + (err.message || 'Tente novamente.'))
    } finally {
      setIsSavingEpisode(false)
    }
  }

  const handleDeleteEpisode = async (ep: EdvancedCastEpisode) => {
    if (!window.confirm(`Tem certeza que deseja excluir o episódio "${ep.title}"?`)) return
    try {
      await deleteEdvancedCastEpisode(ep.id)
      toast.success('Episódio excluído com sucesso.')
      await loadData()
      if (activeVideoEpisode?.id === ep.id) {
        setActiveVideoEpisode(null)
      }
    } catch (err: any) {
      toast.error('Erro ao excluir episódio: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-[#D4AF37]/30 selection:text-slate-900">
      {/* =========================================================================
          1. PUBLIC HEADER / TOP NAVIGATION
         ========================================================================= */}
      <header className="bg-[#06242E] text-white sticky top-0 z-40 border-b border-[#03151B] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/publico" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#997300] p-[2px] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#06242E] rounded-[10px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
                  EDVANCED
                </span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D4AF37]/20 text-[#F5D77F] border border-[#D4AF37]/40">
                  PORTAL PÚBLICO
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold -mt-0.5">
                Business Club
              </p>
            </div>
          </Link>

          {/* Tab Navigation Center */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#03151B]/80 p-1 rounded-2xl border border-teal-900/60 shadow-inner">
            <button
              type="button"
              onClick={() => setTab('eventos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'eventos'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89324] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : 'text-teal-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Eventos do Club</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('podcast')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'podcast'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89324] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : 'text-teal-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>EdvancedCast</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </button>

            <button
              type="button"
              onClick={() => setTab('materiais')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'materiais'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89324] text-slate-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : 'text-teal-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Materiais Públicos</span>
            </button>
          </div>

          {/* Right Action: Login / Member Area button */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/">
                <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Área de Membros VIP</span>
                  <span className="sm:hidden">Área VIP</span>
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md shadow-[#D4AF37]/20 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Acesso VIP Membros</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Tab switcher */}
        <div className="md:hidden flex border-t border-teal-950 bg-[#03151B]">
          <button
            type="button"
            onClick={() => setTab('eventos')}
            className={`flex-1 py-3 text-center text-[11px] font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1 ${
              activeTab === 'eventos'
                ? 'border-[#D4AF37] text-[#F5D77F] bg-[#06242E]'
                : 'border-transparent text-teal-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Eventos
          </button>
          <button
            type="button"
            onClick={() => setTab('podcast')}
            className={`flex-1 py-3 text-center text-[11px] font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1 ${
              activeTab === 'podcast'
                ? 'border-[#D4AF37] text-[#F5D77F] bg-[#06242E]'
                : 'border-transparent text-teal-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Podcast
          </button>
          <button
            type="button"
            onClick={() => setTab('materiais')}
            className={`flex-1 py-3 text-center text-[11px] font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1 ${
              activeTab === 'materiais'
                ? 'border-[#D4AF37] text-[#F5D77F] bg-[#06242E]'
                : 'border-transparent text-teal-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Materiais
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. HERO BANNER PÚBLICO (Dourado & Azul Petróleo Premium)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#06242E] via-[#041B23] to-[#03151B] text-white py-12 md:py-16 px-4 border-b border-teal-950">
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D77F] text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Ecossistema de Alta Governança & Negócios
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Edvanced Business Club &{' '}
            <span className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] bg-clip-text text-transparent">
              EdvancedCast
            </span>
          </h1>

          <p className="text-sm sm:text-base text-teal-100/90 max-w-3xl mx-auto leading-relaxed">
            Acompanhe a agenda de eventos oficiais abertos ao mercado, inscreva-se diretamente nos
            próximos encontros e assista aos episódios completos do nosso videocast exclusivo com os
            maiores líderes e investidores.
          </p>

          {/* Quick tab switcher pill in hero */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setTab('eventos')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'eventos'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/25 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Eventos Oficiais ({meetings.length})
            </button>
            <button
              onClick={() => setTab('podcast')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'podcast'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/25 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Tv className="w-4 h-4" />
              EdvancedCast ({episodes.length})
            </button>
            <button
              onClick={() => setTab('materiais')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'materiais'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/25 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Materiais & Mídias ({materials.length})
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CONTEÚDO PRINCIPAL (ABA 1: EVENTOS vs ABA 2: EDVANCEDCAST)
         ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8 animate-fade-in">
        {/* =====================================================================
            ABA 1: EVENTOS OFICIAIS DO CLUB COM INSCRIÇÃO EXTERNA
           ===================================================================== */}
        {activeTab === 'eventos' && (
          <div className="space-y-8">
            {/* Top Toolbar: Search & Format Filters */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-[#8C6D07]" />
                    Eventos Oficiais Edvanced Business Club
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Palestras, jantares de gala, summits e rodadas de negócios oficiais organizadas
                    pela diretoria.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {filteredEvents.length} evento(s) encontrado(s)
                  </span>
                </div>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar evento por título, cidade, tema..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:border-[#D4AF37]"
                  />
                </div>

                {/* Formato */}
                <div>
                  <select
                    value={eventFormat}
                    onChange={(e) => setEventFormat(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="todos">Todos os Formatos</option>
                    <option value="presencial">📍 Apenas Presencial</option>
                    <option value="online">🌐 Apenas Online</option>
                    <option value="hibrido">⚡ Apenas Híbrido</option>
                  </select>
                </div>

                {/* Cobrança */}
                <div>
                  <select
                    value={eventPricing}
                    onChange={(e) => setEventPricing(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="todos">Todas as Inscrições</option>
                    <option value="gratuito">🎟️ Apenas Gratuitos / Inclusos</option>
                    <option value="pago">💳 Apenas Pagos / Ingressos</option>
                  </select>
                </div>

                {/* Mês */}
                <div>
                  <select
                    value={eventMonth}
                    onChange={(e) => setEventMonth(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="todos">Todos os Meses</option>
                    {availableMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        📅 {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active filters pill list / reset */}
              {(eventSearch ||
                eventFormat !== 'todos' ||
                eventPricing !== 'todos' ||
                eventMonth !== 'todos') && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Filtros ativos:</span>
                  {eventSearch && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-slate-100 text-slate-700 gap-1 pr-1"
                    >
                      Busca: "{eventSearch}"
                      <button onClick={() => setEventSearch('')} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {eventFormat !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-[#D4AF37]/15 text-[#8C6D07] border border-[#D4AF37]/30 gap-1 pr-1"
                    >
                      Formato: {eventFormat}
                      <button
                        onClick={() => setEventFormat('todos')}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {eventPricing !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-[#06242E]/10 text-[#06242E] border border-[#06242E]/20 gap-1 pr-1"
                    >
                      Cobrança: {eventPricing}
                      <button
                        onClick={() => setEventPricing('todos')}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {eventMonth !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-[#D4AF37]/20 text-[#8C6D07] border border-[#D4AF37]/40 gap-1 pr-1"
                    >
                      Mês: {availableMonths.find((m) => m.key === eventMonth)?.label || eventMonth}
                      <button
                        onClick={() => setEventMonth('todos')}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setEventSearch('')
                      setEventFormat('todos')
                      setEventPricing('todos')
                      setEventMonth('todos')
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold ml-2 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar filtros
                  </button>
                </div>
              )}
            </div>

            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const status = getMeetingStatus(event)
                  const StatusIcon = status.icon
                  const coverUrl = getMeetingCover(event)

                  return (
                    <Card
                      key={event.id}
                      className="border border-slate-200/90 bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group min-w-0"
                    >
                      <div>
                        {/* Cover image */}
                        <div className="relative aspect-[16/9] w-full bg-[#06242E] overflow-hidden">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#06242E] via-[#0A3340] to-[#03151B] flex flex-col items-center justify-center p-4 text-center">
                              <Sparkles className="w-8 h-8 text-[#D4AF37] mb-2 opacity-80" />
                              <span className="text-[11px] font-black uppercase tracking-widest text-[#F5D77F]">
                                {event.event_name || 'Edvanced Business Club'}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                          {/* Top badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5">
                            <Badge className="bg-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                              {event.type || 'Presencial'}
                            </Badge>

                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold uppercase backdrop-blur-md ${status.badgeClass}`}
                            >
                              <StatusIcon className="w-3 h-3 mr-1 inline" />
                              {status.label}
                            </Badge>
                          </div>

                          {/* Bottom pricing */}
                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                            <span className="font-extrabold text-[#F5D77F] drop-shadow-sm">
                              {formatShortDate(event.start_date || event.date)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-black/60 border border-white/20">
                              {event.pricing === 'pago' ? 'Pago' : 'Gratuito'}
                            </span>
                          </div>
                        </div>

                        {/* Event Content */}
                        <div className="p-5 space-y-3">
                          {event.event_name && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D07] flex items-center gap-1">
                              <Tag className="w-3 h-3 text-[#8C6D07]" />
                              <span>{event.event_name}</span>
                            </p>
                          )}

                          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2 leading-snug">
                            {event.title}
                          </h3>

                          {/* Location & Time */}
                          <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                            <div className="flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 text-[#8C6D07] flex-shrink-0 mt-0.5" />
                              <span className="font-medium text-slate-700">
                                {formatDateString(event.start_date || event.date)} às{' '}
                                {formatTimeString(event.start_date || event.date)}
                                {event.end_date ? ` até ${formatTimeString(event.end_date)}` : ''}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[#8C6D07] flex-shrink-0 mt-0.5" />
                              <span className="truncate text-slate-700" title={event.location}>
                                {event.location}
                              </span>
                            </div>

                            {event.speakers && (
                              <div className="flex items-start gap-2 text-slate-600">
                                <Users className="w-3.5 h-3.5 text-[#8C6D07] flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{event.speakers}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Action Buttons (Link de Inscrição Externa) */}
                      <div className="p-5 pt-0 space-y-2">
                        {event.registration_url ? (
                          <a
                            href={event.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                          >
                            <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-md shadow-[#D4AF37]/20 flex items-center justify-center gap-2">
                              <span>Garantir Inscrição / Ingressos</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        ) : (
                          <Button
                            onClick={() => setSelectedEventModal(event)}
                            className="w-full bg-[#06242E] hover:bg-[#0A3340] text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2"
                          >
                            <span>Ver Detalhes do Evento</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEventModal(event)}
                          className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Mais Informações & Pauta
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">Nenhum evento encontrado</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ajuste os filtros de formato e busca para ver a agenda de encontros oficiais.
                </p>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            ABA 2: EDVANCEDCAST (EPISÓDIOS DO PODCAST COM PLAYER EMBUTIDO)
           ===================================================================== */}
        {activeTab === 'podcast' && (
          <div className="space-y-8">
            {/* Top Toolbar Podcast */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
                      <Mic className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      EdvancedCast — O Videocast Oficial
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Entrevistas com CEOs, conselheiros, fundadores e investidores do ecossistema de
                    negócios.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && (
                    <Button
                      onClick={handleOpenAddEpisode}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl shadow-md"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Novo Episódio
                    </Button>
                  )}

                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {filteredEpisodes.length} episódio(s)
                  </span>
                </div>
              </div>

              {/* Search podcast */}
              <div className="pt-2 border-t border-slate-100">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar episódios por título, convidado ou tema..."
                    value={podcastSearch}
                    onChange={(e) => setPodcastSearch(e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Featured Hero Player (se houver episódio selecionado ou primeiro episódio) */}
            {filteredEpisodes.length > 0 && (
              <div className="rounded-3xl overflow-hidden bg-[#06242E] border border-[#D4AF37]/30 shadow-2xl text-white">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left: Video Player Box */}
                  <div className="lg:col-span-7 aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                    {(() => {
                      const featuredEp = activeVideoEpisode || filteredEpisodes[0]
                      const embedUrl = getVideoEmbedUrl(featuredEp.video_url)
                      const cover = getEpisodeCoverUrl(featuredEp)

                      if (embedUrl) {
                        if (isDirectVideoFile(featuredEp.video_url)) {
                          return (
                            <video
                              controls
                              className="w-full h-full object-cover"
                              src={featuredEp.video_url}
                              poster={cover || undefined}
                            />
                          )
                        }

                        return (
                          <iframe
                            src={embedUrl}
                            title={featuredEp.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        )
                      }

                      return (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {cover ? (
                            <img
                              src={cover}
                              alt={featuredEp.title}
                              className="absolute inset-0 w-full h-full object-cover filter brightness-50"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#06242E] via-[#0A3340] to-[#03151B]" />
                          )}
                          <div className="relative z-10 p-8 text-center space-y-3">
                            <Tv className="w-12 h-12 text-[#D4AF37] mx-auto animate-pulse" />
                            <p className="text-sm font-bold text-white">Assistir ao Episódio</p>
                            <a
                              href={featuredEp.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs">
                                Abrir Player Externo <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Right: Metadata do Episódio em Destaque */}
                  {(() => {
                    const featuredEp = activeVideoEpisode || filteredEpisodes[0]
                    return (
                      <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-[#D4AF37] text-slate-950 font-black text-[10px] uppercase tracking-wider">
                              Episódio{' '}
                              {featuredEp.episode_number
                                ? `#${featuredEp.episode_number}`
                                : 'Especial'}
                            </Badge>
                            {featuredEp.duration && (
                              <Badge
                                variant="outline"
                                className="text-teal-200 border-teal-700 text-[10px]"
                              >
                                <Clock className="w-3 h-3 mr-1 inline text-[#D4AF37]" />
                                {featuredEp.duration}
                              </Badge>
                            )}
                            {featuredEp.published_at && (
                              <span className="text-xs text-teal-300/80">
                                {formatDateString(featuredEp.published_at)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                            {featuredEp.title}
                          </h3>

                          {featuredEp.description && (
                            <p className="text-xs md:text-sm text-teal-100/80 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {featuredEp.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-teal-900/60 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleCopyEpisodeLink(e, featuredEp)}
                              className="border-teal-800 text-teal-100 hover:bg-teal-900 text-xs rounded-xl"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" />
                              Copiar Link
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleShareWhatsApp(e, featuredEp)}
                              className="border-emerald-800/80 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900 text-xs rounded-xl"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                              WhatsApp
                            </Button>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditEpisode(featuredEp)}
                                className="h-8 text-xs text-teal-300 hover:text-white"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEpisode(featuredEp)}
                                className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Episodes List Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Tv className="w-5 h-5 text-[#8C6D07]" />
                Todos os Episódios do EdvancedCast
              </h3>

              {filteredEpisodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEpisodes.map((ep) => {
                    const isSelected = activeVideoEpisode?.id === ep.id
                    const cover = getEpisodeCoverUrl(ep)

                    return (
                      <Card
                        key={ep.id}
                        onClick={() => {
                          setActiveVideoEpisode(ep)
                          window.scrollTo({ top: 400, behavior: 'smooth' })
                        }}
                        className={`border bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'border-[#D4AF37] ring-2 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                            : 'border-slate-200/90 hover:border-[#D4AF37]'
                        }`}
                      >
                        <div>
                          {/* Thumbnail / Capa Customizada */}
                          <div className="relative aspect-[16/9] w-full bg-[#06242E] overflow-hidden">
                            {cover ? (
                              <img
                                src={cover}
                                alt={ep.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                              />
                            ) : (
                              /* Fallback Premium Gradiente Dourado + Azul Petróleo */
                              <div className="w-full h-full bg-gradient-to-br from-[#06242E] via-[#0A3340] to-[#03151B] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#D4AF37]/15 blur-xl pointer-events-none" />
                                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center mb-2 shadow-inner">
                                  <Mic className="w-5 h-5 text-[#F5D77F]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5D77F]">
                                  EdvancedCast
                                </span>
                                <span className="text-xs font-bold text-teal-100 mt-1 line-clamp-1 px-4">
                                  {ep.title}
                                </span>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                            {/* Ep number */}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                                Ep. {ep.episode_number ? `#${ep.episode_number}` : 'Extra'}
                              </Badge>
                            </div>

                            {/* Quick Share Buttons on Card */}
                            <div
                              className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                title="Copiar link do episódio"
                                onClick={(e) => handleCopyEpisodeLink(e, ep)}
                                className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#D4AF37] text-white hover:text-slate-950 border border-white/20 hover:border-[#D4AF37] flex items-center justify-center backdrop-blur-sm transition-all"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Compartilhar no WhatsApp"
                                onClick={(e) => handleShareWhatsApp(e, ep)}
                                className="w-7 h-7 rounded-full bg-black/60 hover:bg-emerald-600 text-white border border-white/20 hover:border-emerald-500 flex items-center justify-center backdrop-blur-sm transition-all"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Play overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>

                            {/* Duration bottom */}
                            {ep.duration && (
                              <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-white font-bold">
                                {ep.duration}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-5 space-y-2">
                            {ep.published_at && (
                              <p className="text-[10px] font-semibold text-slate-500">
                                {formatDateString(ep.published_at)}
                              </p>
                            )}

                            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2 leading-snug">
                              {ep.title}
                            </h4>

                            {ep.description && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {ep.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#8C6D07] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Assistir
                            </span>

                            <span className="text-slate-300">&bull;</span>

                            <button
                              type="button"
                              onClick={(e) => handleShareWhatsApp(e, ep)}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                              title="Compartilhar no WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </button>
                          </div>

                          {isAdmin && (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditEpisode(ep)}
                                className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900"
                              >
                                <Edit2 className="w-3 h-3 mr-1" /> Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEpisode(ep)}
                                className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                  <Mic className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-base">Nenhum episódio encontrado</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Novos episódios do EdvancedCast estão sendo gravados e serão disponibilizados em
                    breve.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

        {/* =====================================================================
            ABA 3: MATERIAIS PÚBLICOS DOS ENCONTROS OFICIAIS DO CLUB
           ===================================================================== */}
        {activeTab === 'materiais' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Toolbar: Search & Format Filters */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FolderOpen className="w-6 h-6 text-[#8C6D07]" />
                    Galeria e Materiais Públicos do Club
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fotos em alta definição, vídeos de cobertura e apresentações oficiais dos nossos
                    encontros presenciais e digitais abertos ao público.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {filteredMaterials.length} material(is)
                  </span>
                </div>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar fotos, vídeos, temas..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:border-[#D4AF37]"
                  />
                </div>

                {/* Tipo de Material */}
                <div>
                  <select
                    value={materialTypeFilter}
                    onChange={(e) => setMaterialTypeFilter(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="todos">Todos os Formatos (Fotos & Vídeos)</option>
                    <option value="photo">📸 Apenas Fotos dos Encontros</option>
                    <option value="video">🎥 Apenas Vídeos / Gravações</option>
                    <option value="document">📄 Apenas Documentos & PDFs</option>
                  </select>
                </div>

                {/* Encontro Relacionado */}
                <div>
                  <select
                    value={materialMeetingFilter}
                    onChange={(e) => setMaterialMeetingFilter(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="todos">Todos os Encontros Oficiais</option>
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        📅 {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active filters pill list / reset */}
              {(materialSearch || materialTypeFilter !== 'todos' || materialMeetingFilter !== 'todos') && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Filtros ativos:</span>
                  {materialSearch && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-slate-100 text-slate-700 gap-1 pr-1"
                    >
                      Busca: "{materialSearch}"
                      <button onClick={() => setMaterialSearch('')} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {materialTypeFilter !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-[#D4AF37]/15 text-[#8C6D07] border border-[#D4AF37]/30 gap-1 pr-1"
                    >
                      Tipo: {materialTypeFilter === 'photo' ? 'Fotos' : materialTypeFilter === 'video' ? 'Vídeos' : 'Documentos'}
                      <button
                        onClick={() => setMaterialTypeFilter('todos')}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {materialMeetingFilter !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-[#0A1A33]/10 text-[#0A1A33] border border-[#0A1A33]/20 gap-1 pr-1"
                    >
                      Encontro: {meetings.find((m) => m.id === materialMeetingFilter)?.title || materialMeetingFilter}
                      <button
                        onClick={() => setMaterialMeetingFilter('todos')}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setMaterialSearch('')
                      setMaterialTypeFilter('todos')
                      setMaterialMeetingFilter('todos')
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold ml-2 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar filtros
                  </button>
                </div>
              )}
            </div>

            {/* Public Materials Grid */}
            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.map((mat) => {
                  const isPhoto = mat.type === 'photo'
                  const isVideo = mat.type === 'video'
                  const isDoc = mat.type === 'document'

                  const fileUrl = mat.file_url ? getFileUrl('materials', mat.id, mat.file_url) : ''
                  const externalUrl = mat.external_url || ''
                  const ytId = isVideo ? getYouTubeId(externalUrl) : null
                  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : ''
                  const displayThumb = isPhoto ? fileUrl : (ytThumb || fileUrl)

                  const relatedMeeting =
                    mat.expand?.meeting || meetings.find((m) => m.id === mat.meeting || (mat as any).meeting_id)

                  return (
                    <Card
                      key={mat.id}
                      onClick={() => setPreviewMediaModal(mat)}
                      className="border border-slate-200/90 bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        {/* Media Thumbnail Container */}
                        <div className="relative aspect-[16/10] w-full bg-[#061020] overflow-hidden">
                          {displayThumb ? (
                            <img
                              src={displayThumb}
                              alt={mat.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-100"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0A1A33] via-[#061020] to-[#030914] flex flex-col items-center justify-center p-6 text-center">
                              {isPhoto ? (
                                <ImageIcon className="w-10 h-10 text-[#D4AF37] mb-2 opacity-80" />
                              ) : isVideo ? (
                                <Video className="w-10 h-10 text-[#D4AF37] mb-2 opacity-80" />
                              ) : (
                                <FileText className="w-10 h-10 text-[#D4AF37] mb-2 opacity-80" />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#F5D77F]">
                                {mat.type.toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                          {/* Top Type Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow flex items-center gap-1">
                              {isPhoto && <ImageIcon className="w-3 h-3" />}
                              {isVideo && <Video className="w-3 h-3" />}
                              {isDoc && <FileText className="w-3 h-3" />}
                              <span>
                                {isPhoto ? 'Foto Oficial' : isVideo ? 'Vídeo / Gravação' : 'Documento'}
                              </span>
                            </Badge>
                          </div>

                          {/* Center Play or Zoom Icon on Hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                              {isVideo ? (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </div>
                          </div>

                          {/* Bottom Meeting Name if available */}
                          {relatedMeeting && (
                            <div className="absolute bottom-2.5 left-3 right-3 text-[11px] font-bold text-[#F5D77F] drop-shadow line-clamp-1">
                              📅 {relatedMeeting.title}
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="p-5 space-y-2">
                          <h4 className="font-black text-sm text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2 leading-snug">
                            {mat.title}
                          </h4>

                          {mat.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {mat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {mat.created ? formatShortDate(mat.created) : 'Oficial do Club'}
                        </span>

                        <span className="text-xs font-bold text-[#8C6D07] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <Eye className="w-3.5 h-3.5" />
                          Visualizar
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">Nenhum material encontrado</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Fotos e vídeos dos próximos encontros serão catalogados aqui após a realização de
                  cada evento.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          4. PUBLIC FOOTER & OFFICIAL CLUB CONTACT INFO (PREMIUM NAVY & GOLD)
         ========================================================================= */}
      <footer className="bg-gradient-to-b from-[#0A1A33] via-[#061020] to-[#030914] text-slate-200 border-t border-slate-800/80 py-14 px-4 sm:px-6 lg:px-8 mt-16 shadow-2xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Col 1: Club Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#997300] p-[2px] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#0A1A33] rounded-[10px] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </div>
              <div>
                <span className="font-black text-base tracking-wider text-white block">
                  EDVANCED
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold block -mt-0.5">
                  Business Club
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O ecossistema exclusivo de alta governança corporativa, conexões estratégicas e
              aceleração de negócios para grandes empresários, líderes e investidores.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/10 text-[#F5D77F] border border-[#D4AF37]/30">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Experiência Executiva VIP
              </span>
            </div>
          </div>

          {/* Col 2: Public Navigation Links */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-white uppercase tracking-wider text-[11px] text-[#D4AF37] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Navegação do Portal
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTab('eventos')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="hover:text-[#F5D77F] transition-colors flex items-center gap-1.5 text-slate-300"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Eventos Oficiais com Inscrição</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTab('podcast')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="hover:text-[#F5D77F] transition-colors flex items-center gap-1.5 text-slate-300"
                >
                  <Mic className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>EdvancedCast (Videocast Oficial)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTab('materiais')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="hover:text-[#F5D77F] transition-colors flex items-center gap-1.5 text-slate-300"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Materiais, Fotos e Gravações</span>
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800">
                <Link
                  to="/login"
                  className="text-[#F5D77F] hover:text-white transition-colors font-bold flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Portal VIP dos Membros &rarr;</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Contact Details */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-white uppercase tracking-wider text-[11px] text-[#D4AF37] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Contato Oficial do Club
            </p>
            <div className="space-y-2.5 text-slate-300">
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[11px]">WhatsApp Concierge</span>
                  <span className="text-[11px] text-emerald-300">+55 (11) 99999-9999</span>
                </div>
              </a>

              <a
                href="https://instagram.com/edvancedbusinessclub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-900 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Instagram className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[11px]">Instagram Oficial</span>
                  <span className="text-[11px] text-pink-300">@edvancedbusinessclub</span>
                </div>
              </a>

              <a
                href="mailto:contato@edvanced.com.br"
                className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-[#D4AF37]/50 hover:bg-slate-900 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#F5D77F] group-hover:scale-105 transition-transform flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[11px]">E-mail de Contato</span>
                  <span className="text-[11px] text-slate-300">contato@edvanced.com.br</span>
                </div>
              </a>
            </div>
          </div>

          {/* Col 4: Sede / Address & Admissions */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-white uppercase tracking-wider text-[11px] text-[#D4AF37] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Sede & Admissão
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-[11px]">Sede Executiva</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Av. Brigadeiro Faria Lima, 3477 — Itaim Bibi
                  </p>
                  <p className="text-slate-500 text-[10px]">São Paulo - SP, Brasil</p>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Interessado em candidatar-se ao quadro de membros ou propor uma pauta no EdvancedCast?
              Entre em contato direto com a Diretoria de Relações Institucionais.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Edvanced Business Club. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Alta Governança Corporativa</span>
            <span>&bull;</span>
            <span className="text-[#D4AF37] font-semibold">Ecossistema Exclusivo de Negócios</span>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          MODAL PREVIEW DE MÍDIA / MATERIAL PÚBLICO (FOTO / VÍDEO / DOCUMENTO)
         ========================================================================= */}
      {previewMediaModal && (
        <Dialog
          open={!!previewMediaModal}
          onOpenChange={(open) => !open && setPreviewMediaModal(null)}
        >
          <DialogContent className="max-w-3xl bg-[#061020] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-extrabold text-[10px]">
                  {previewMediaModal.type === 'photo'
                    ? 'Foto do Encontro'
                    : previewMediaModal.type === 'video'
                      ? 'Vídeo Oficial'
                      : 'Documento'}
                </Badge>
                {previewMediaModal.created && (
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {formatDateString(previewMediaModal.created)}
                  </span>
                )}
              </div>

              <DialogTitle className="text-xl md:text-2xl font-black text-white leading-tight">
                {previewMediaModal.title}
              </DialogTitle>

              {previewMediaModal.expand?.meeting && (
                <p className="text-xs font-bold text-[#F5D77F] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Encontro: {previewMediaModal.expand.meeting.title}</span>
                </p>
              )}
            </DialogHeader>

            {/* Media Player or Large Image */}
            <div className="my-4">
              {previewMediaModal.type === 'video' && (
                <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                  {getVideoEmbedUrl(previewMediaModal.external_url) ? (
                    <iframe
                      src={getVideoEmbedUrl(previewMediaModal.external_url)!}
                      title={previewMediaModal.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : previewMediaModal.file_url ? (
                    <video
                      src={getFileUrl('materials', previewMediaModal.id, previewMediaModal.file_url)}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <Video className="w-10 h-10 mb-2 text-[#D4AF37]" />
                      <p className="text-xs">Vídeo não disponível para reprodução direta.</p>
                      {previewMediaModal.external_url && (
                        <a
                          href={previewMediaModal.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 text-xs text-[#F5D77F] underline font-bold flex items-center gap-1"
                        >
                          Abrir link externo <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {previewMediaModal.type === 'photo' && (
                <div className="relative w-full max-h-[65vh] bg-black/50 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  {previewMediaModal.file_url ? (
                    <img
                      src={getFileUrl('materials', previewMediaModal.id, previewMediaModal.file_url)}
                      alt={previewMediaModal.title}
                      className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl"
                    />
                  ) : previewMediaModal.external_url ? (
                    <img
                      src={previewMediaModal.external_url}
                      alt={previewMediaModal.title}
                      className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[#D4AF37]" />
                      <p className="text-xs">Imagem não encontrada.</p>
                    </div>
                  )}
                </div>
              )}

              {previewMediaModal.type === 'document' && (
                <div className="p-8 rounded-2xl bg-[#030914] border border-slate-800 text-center space-y-4">
                  <FileText className="w-14 h-14 text-[#D4AF37] mx-auto opacity-90" />
                  <div>
                    <h5 className="text-base font-bold text-white">{previewMediaModal.title}</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {previewMediaModal.description ||
                        'Documento oficial disponibilizado para consulta.'}
                    </p>
                  </div>
                  {previewMediaModal.file_url && (
                    <a
                      href={getFileUrl('materials', previewMediaModal.id, previewMediaModal.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs uppercase tracking-wider px-5 rounded-xl shadow-md">
                        Baixar Arquivo / Documento
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>

            {previewMediaModal.description && previewMediaModal.type !== 'document' && (
              <div className="p-4 bg-[#030914] rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <p className="whitespace-pre-wrap">{previewMediaModal.description}</p>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setPreviewMediaModal(null)}
                className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </Button>

              {previewMediaModal.file_url && (
                <a
                  href={getFileUrl('materials', previewMediaModal.id, previewMediaModal.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-black text-xs uppercase tracking-wider px-5 shadow-md">
                    Baixar Mídia Original <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </a>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL DETALHES DO EVENTO PÚBLICO
         ========================================================================= */}
      {selectedEventModal && (
        <Dialog
          open={!!selectedEventModal}
          onOpenChange={(open) => !open && setSelectedEventModal(null)}
        >
          <DialogContent className="max-w-2xl bg-[#06242E] text-white border-teal-950 p-6 md:p-8 shadow-2xl rounded-3xl">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-bold text-[10px]">
                  {selectedEventModal.type || 'Presencial'}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold ${
                    selectedEventModal.pricing === 'pago'
                      ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                      : 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                  }`}
                >
                  {selectedEventModal.pricing === 'pago' ? 'Inscrição Paga' : 'Acesso Gratuito'}
                </Badge>
              </div>

              <DialogTitle className="text-xl md:text-2xl font-black text-white leading-tight">
                {selectedEventModal.title}
              </DialogTitle>

              {selectedEventModal.event_name && (
                <p className="text-xs font-bold text-[#F5D77F] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Série: {selectedEventModal.event_name}</span>
                </p>
              )}
            </DialogHeader>

            <div className="space-y-4 my-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#03151B] rounded-2xl border border-teal-950 space-y-1">
                  <p className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#D4AF37]" /> Data & Horário
                  </p>
                  <p className="text-white font-bold">
                    {formatDateString(selectedEventModal.start_date || selectedEventModal.date)}
                  </p>
                  <p className="text-teal-200">
                    {formatTimeString(selectedEventModal.start_date || selectedEventModal.date)}
                    {selectedEventModal.end_date
                      ? ` até ${formatTimeString(selectedEventModal.end_date)}`
                      : ''}
                  </p>
                </div>

                <div className="p-3.5 bg-[#03151B] rounded-2xl border border-teal-950 space-y-1">
                  <p className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> Local / Transmissão
                  </p>
                  <p className="text-white font-bold">{selectedEventModal.location}</p>
                </div>
              </div>

              {selectedEventModal.speakers && (
                <div className="p-3.5 bg-[#03151B] rounded-2xl border border-teal-950 space-y-1">
                  <p className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" /> Palestrantes & Convidados
                  </p>
                  <p className="text-white">{selectedEventModal.speakers}</p>
                </div>
              )}

              {selectedEventModal.description && (
                <div className="p-4 bg-[#03151B]/70 rounded-2xl border border-teal-950 text-teal-100/90 max-h-52 overflow-y-auto leading-relaxed">
                  {selectedEventModal.description.startsWith('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEventModal.description }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedEventModal.description}</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal-950">
              <Button
                variant="outline"
                onClick={() => setSelectedEventModal(null)}
                className="text-xs border-teal-800 text-teal-100 hover:bg-teal-900"
              >
                Fechar
              </Button>

              {selectedEventModal.registration_url && (
                <a
                  href={selectedEventModal.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-black text-xs uppercase tracking-wider px-5 shadow-lg shadow-[#D4AF37]/20">
                    Ir para Inscrição Externa <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </a>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          ADMIN MODAL: CADASTRO / EDIÇÃO DE EPISÓDIO DO EDVANCEDCAST
         ========================================================================= */}
      {showPodcastModal && (
        <Dialog open={showPodcastModal} onOpenChange={setShowPodcastModal}>
          <DialogContent className="max-w-xl bg-[#06242E] text-white border-teal-950 p-6 md:p-8 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider">
                  Curadoria do EdvancedCast
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                {editingEpisode
                  ? 'Editar Episódio do Podcast'
                  : 'Publicar Novo Episódio do Podcast'}
              </DialogTitle>
              <DialogDescription className="text-xs text-teal-200/70">
                Cadastre o link do vídeo (YouTube, Vimeo ou MP4) e detalhes do episódio para a aba
                pública.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEpisode} className="space-y-4 pt-2 text-xs">
              {/* Título */}
              <div className="space-y-1">
                <Label className="text-teal-300 font-semibold">Título do Episódio *</Label>
                <Input
                  placeholder="Ex: EdvancedCast #03 — Governança e Captação de Recursos"
                  value={castTitle}
                  onChange={(e) => setCastTitle(e.target.value)}
                  className="text-xs bg-[#03151B] border-teal-900 text-white rounded-xl"
                  required
                />
              </div>

              {/* Link do Vídeo (YouTube/Vimeo) */}
              <div className="space-y-1">
                <Label className="text-[#F5D77F] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#D4AF37]" />
                    Link do Vídeo (YouTube / Vimeo / MP4) *
                  </span>
                </Label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  value={castVideoUrl}
                  onChange={(e) => setCastVideoUrl(e.target.value)}
                  className="text-xs bg-[#03151B] border-teal-900 text-white rounded-xl"
                  required
                />
                <p className="text-[10px] text-teal-200/60">
                  Insira o link padrão do YouTube ou Vimeo. Ele será reproduzido no player embutido
                  da plataforma.
                </p>
              </div>

              {/* Upload de Capa / Thumbnail Própria */}
              <div className="p-4 rounded-2xl bg-[#03151B] border border-teal-900 space-y-3">
                <Label className="text-[#F5D77F] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                    Capa / Thumbnail Própria do Episódio
                  </span>
                  <span className="text-[10px] text-teal-300/70">JPG, PNG ou WebP</span>
                </Label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Box */}
                  <div className="w-full sm:w-36 h-24 rounded-xl border border-teal-800 bg-[#06242E] overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                    {castCoverPreview ? (
                      <img
                        src={castCoverPreview}
                        alt="Preview da capa"
                        className="w-full h-full object-cover"
                      />
                    ) : castThumbnailUrl ? (
                      <img
                        src={castThumbnailUrl}
                        alt="Preview da URL"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Fallback Preview Premium */
                      <div className="w-full h-full bg-gradient-to-br from-[#06242E] via-[#0A3340] to-[#03151B] flex flex-col items-center justify-center p-2 text-center">
                        <Mic className="w-5 h-5 text-[#D4AF37] mb-1" />
                        <span className="text-[9px] font-bold text-[#F5D77F]">Capa Padrão</span>
                      </div>
                    )}
                  </div>

                  {/* Upload action buttons */}
                  <div className="w-full space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-teal-950 hover:bg-teal-900 text-teal-100 border border-teal-800 text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Selecionar Arquivo</span>
                      </Button>

                      {castCoverFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setCastCoverFile(null)
                            setCastCoverPreview(
                              editingEpisode?.cover_image
                                ? getFileUrl(
                                    'edvanced_cast',
                                    editingEpisode.id,
                                    editingEpisode.cover_image,
                                  )
                                : '',
                            )
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 py-1.5 px-2"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      )}
                    </div>

                    <p className="text-[10px] text-teal-300/60">
                      Envie uma imagem em alta resolução (16:9). Se nenhuma imagem for enviada, será
                      utilizado o padrão visual premium dourado do Club.
                    </p>
                  </div>
                </div>

                {/* Ou URL Externa */}
                <div className="pt-2 border-t border-teal-950 space-y-1">
                  <Label className="text-[11px] text-teal-300/80">
                    Ou informe uma URL de imagem externa:
                  </Label>
                  <Input
                    placeholder="https://... (opcional)"
                    value={castThumbnailUrl}
                    onChange={(e) => setCastThumbnailUrl(e.target.value)}
                    className="text-xs bg-[#06242E] border-teal-900 text-white rounded-xl h-8"
                  />
                </div>
              </div>

              {/* Duração Estimada */}
              <div className="space-y-1">
                <Label className="text-teal-300 font-semibold">Duração Estimada</Label>
                <Input
                  placeholder="Ex: 45 min ou 01h 15m"
                  value={castDuration}
                  onChange={(e) => setCastDuration(e.target.value)}
                  className="text-xs bg-[#03151B] border-teal-900 text-white rounded-xl"
                />
              </div>

              {/* Número do Episódio e Data de Publicação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-teal-300 font-semibold">Número do Episódio</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 1, 2, 3..."
                    value={castEpNumber}
                    onChange={(e) => setCastEpNumber(e.target.value ? Number(e.target.value) : '')}
                    className="text-xs bg-[#03151B] border-teal-900 text-white rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-teal-300 font-semibold">Data de Publicação</Label>
                  <Input
                    type="date"
                    value={castPublishedAt}
                    onChange={(e) => setCastPublishedAt(e.target.value)}
                    className="text-xs bg-[#03151B] border-teal-900 text-white rounded-xl"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <Label className="text-teal-300 font-semibold">
                  Descrição / Sinopse do Episódio
                </Label>
                <Textarea
                  placeholder="Resumo dos tópicos discutidos, perfil dos convidados e destaques..."
                  value={castDesc}
                  onChange={(e) => setCastDesc(e.target.value)}
                  className="text-xs bg-[#03151B] border-teal-900 text-white rounded-xl"
                  rows={4}
                />
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPodcastModal(false)}
                  className="text-xs border-teal-900 text-teal-200"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEpisode}
                  className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs uppercase tracking-wider px-5 rounded-xl shadow-md"
                >
                  {isSavingEpisode
                    ? 'Salvando...'
                    : editingEpisode
                      ? 'Salvar Alterações'
                      : 'Publicar Episódio'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
