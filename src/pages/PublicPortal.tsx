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
  Users,
  Mic,
  Tv,
  Tag,
  ArrowRight,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ChevronRight,
  ChevronLeft,
  CalendarCheck2,
  Hourglass,
  Layers,
  X,
  Copy,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  Instagram,
  Phone,
  Mail,
  FolderOpen,
  TrendingUp,
  Globe2,
  Building2,
  Quote,
  Star,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import heroEdianeBg from '../assets/business-club-1-977b6.jpg'
import salaReuniaoImg from '../assets/whatsapp-image-2026-05-29-at-16.27.10-1-2d279.jpeg'
import salaCompartilhadaImg from '../assets/whatsapp-image-2026-05-29-at-16.27.10-c0958.jpeg'
import {
  getMeetings,
  getEdvancedCastEpisodes,
  getAllMaterials,
  getTestimonials,
  getClubBenefits,
  getClubSpacesPhotos,
  getFileUrl,
  createEdvancedCastEpisode,
  updateEdvancedCastEpisode,
  deleteEdvancedCastEpisode,
  deleteMaterial,
} from '@/services/api'
import type {
  Meeting,
  EdvancedCastEpisode,
  Material,
  Testimonial,
  ClubBenefit,
  ClubSpacePhoto,
} from '@/types'
import { AVAILABLE_ICONS } from '@/pages/AdminClubSelection'
import { useAuth } from '@/contexts/AuthContext'
import { detectMaterialKind } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/,
  )
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
  }

  const vimeoMatch = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  }

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

  // Tab switch: 'sobre' | 'eventos' | 'podcast' | 'materiais'
  const rawTab = searchParams.get('aba')
  const activeTab: 'sobre' | 'eventos' | 'podcast' | 'materiais' =
    rawTab === 'eventos'
      ? 'eventos'
      : rawTab === 'podcast'
        ? 'podcast'
        : rawTab === 'materiais'
          ? 'materiais'
          : 'sobre'

  const setTab = (tab: 'sobre' | 'eventos' | 'podcast' | 'materiais') => {
    setSearchParams({ aba: tab })
  }

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [episodes, setEpisodes] = useState<EdvancedCastEpisode[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [benefits, setBenefits] = useState<ClubBenefit[]>([])
  const [spacesPhotos, setSpacesPhotos] = useState<ClubSpacePhoto[]>([])
  const [previewSpacePhoto, setPreviewSpacePhoto] = useState<ClubSpacePhoto | null>(null)
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

  // Search and filters for Public Materials (Exclusivo Fotos e Vídeos — PDFs restritos aos membros)
  const [materialSearch, setMaterialSearch] = useState('')
  const [materialTypeFilter, setMaterialTypeFilter] = useState<'todos' | 'photo' | 'video'>('todos')
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

  // Testimonials Carousel scroll ref
  const testimonialScrollRef = useRef<HTMLDivElement | null>(null)

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialScrollRef.current) {
      const scrollAmount = 380
      testimonialScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [meets, eps, mats, tests, bnf, spaces] = await Promise.all([
        getMeetings().catch(() => [] as Meeting[]),
        getEdvancedCastEpisodes().catch(() => [] as EdvancedCastEpisode[]),
        getAllMaterials().catch(() => [] as Material[]),
        getTestimonials().catch(() => [] as Testimonial[]),
        getClubBenefits().catch(() => [] as ClubBenefit[]),
        getClubSpacesPhotos().catch(() => [] as ClubSpacePhoto[]),
      ])
      setMeetings(meets)
      setEpisodes(eps)
      setMaterials(mats)
      setTestimonials(tests)
      setBenefits(bnf)
      setSpacesPhotos(spaces)
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
      // Extrair prefixo de data YYYY-MM-DD suportando separadores 'T' ou espaço
      const datePart = dateStr.split(/[T ]/)[0]
      const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (match) {
        const year = parseInt(match[1], 10)
        const month = parseInt(match[2], 10)
        const day = parseInt(match[3], 10)
        const d = new Date(year, month - 1, day, 12, 0, 0)
        return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      }
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

  const getEpisodeCoverUrl = (ep: EdvancedCastEpisode) => {
    if (ep.cover_image) {
      return getFileUrl('edvanced_cast', ep.id, ep.cover_image)
    }
    if (ep.thumbnail_url) {
      return ep.thumbnail_url
    }
    return ''
  }

  const getTestimonialAvatar = (t: Testimonial) => {
    if (t.avatar) {
      return getFileUrl('testimonials', t.id, t.avatar)
    }
    if (t.avatar_url) {
      return t.avatar_url
    }
    return ''
  }

  const getSpacePhotoSrc = (sp: ClubSpacePhoto) => {
    if (sp.photo) {
      return getFileUrl('club_spaces_photos', sp.id, sp.photo)
    }
    if (sp.photo_url === '/images/sala-de-reuniao.jpeg') {
      return salaReuniaoImg
    }
    if (sp.photo_url === '/images/sala-compartilhada.jpeg') {
      return salaCompartilhadaImg
    }
    if (sp.photo_url) {
      return sp.photo_url
    }
    return ''
  }

  const WHATSAPP_NUMBER = '5565981003969'
  const WHATSAPP_SELECTION_URL = `https://wa.me/${WHATSAPP_NUMBER}`

  const getEpisodeShareUrl = (ep: EdvancedCastEpisode) => {
    const origin = window.location.origin
    return `${origin}/?aba=podcast&episodio=${ep.id}`
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

  const getEpisodeWhatsAppShareUrl = (ep: EdvancedCastEpisode) => {
    const url = getEpisodeShareUrl(ep)
    const epNumberStr = ep.episode_number ? ` #${ep.episode_number}` : ''
    const text = encodeURIComponent(
      `🎙️ Assista ao EdvancedCast${epNumberStr}: "${ep.title}" no Edvanced Business Club!\n\nConfira o episódio completo:\n${url}`,
    )
    return `https://wa.me/?text=${text}`
  }

  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date()
    const startStr = meeting.start_date || meeting.date
    if (!startStr) {
      return {
        key: 'scheduled',
        label: 'Confirmado',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
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
        label: 'Confirmado',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        icon: CalendarIcon,
      }
    } else if (now >= start && now <= end) {
      return {
        key: 'ongoing',
        label: 'Acontecendo Agora',
        badgeClass: 'bg-amber-50 text-amber-800 border-[#D4AF37] font-black animate-pulse',
        icon: Hourglass,
      }
    } else {
      return {
        key: 'completed',
        label: 'Realizado',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
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

  // Filtered official Club meetings
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

  // Public Materials (Apenas Fotos e Vídeos — PDFs/documentos são exclusivos para membros VIP)
  const publicMaterialsOnly = useMemo(() => {
    return materials.filter((mat) => {
      const kind = detectMaterialKind({
        file: mat.file,
        url: mat.url,
        title: mat.title,
        type: mat.type,
      })
      return kind.category === 'photo' || kind.category === 'video'
    })
  }, [materials])

  // Filtered Public Materials (Fotos e Vídeos apenas)
  const filteredMaterials = useMemo(() => {
    return publicMaterialsOnly.filter((mat) => {
      const q = materialSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        mat.title?.toLowerCase().includes(q) ||
        mat.description?.toLowerCase().includes(q) ||
        mat.expand?.meeting?.title?.toLowerCase().includes(q) ||
        mat.expand?.meeting?.event_name?.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (materialTypeFilter !== 'todos') {
        const kind = detectMaterialKind({
          file: mat.file,
          url: mat.url,
          title: mat.title,
          type: mat.type,
        })
        if (kind.category !== materialTypeFilter) return false
      }

      if (materialMeetingFilter !== 'todos') {
        const matMeetId = mat.meeting || (mat as any).meeting_id
        if (matMeetId !== materialMeetingFilter) return false
      }

      return true
    })
  }, [publicMaterialsOnly, materialSearch, materialTypeFilter, materialMeetingFilter])

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
    setCastPublishedAt(ep.published_at ? ep.published_at.substring(0, 10) : '')
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
          formData.append(
            'published_at',
            new Date(`${castPublishedAt}T12:00:00.000Z`).toISOString(),
          )
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
          published_at: castPublishedAt
            ? new Date(`${castPublishedAt}T12:00:00.000Z`).toISOString()
            : undefined,
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-[#D4AF37]/30 selection:text-slate-950">
      {/* =========================================================================
          1. PUBLIC HEADER / TOP NAVIGATION (Pure Dark Navy + Gold Glow)
         ========================================================================= */}
      <header className="relative z-40 sticky top-0 bg-[#061020] border-b border-[#D4AF37]/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#997300] p-[1.5px] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center transition-all duration-300 group-hover:shadow-[#D4AF37]/40 group-hover:scale-105">
                <div className="w-full h-full bg-[#061020] rounded-[14px] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-[#F5D77F] drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
                  EDVANCED
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-[#D4AF37]/15 text-[#F5D77F] border border-[#D4AF37]/35 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                  Portal Oficial
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#D4AF37] font-bold">
                Business Club
              </p>
            </div>
          </Link>

          {/* Tab Navigation Center (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0A1A33] p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setTab('sobre')}
              className={`flex items-center justify-center gap-2 px-3.5 lg:px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                activeTab === 'sobre'
                  ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown className="w-4 h-4 shrink-0" />
              <span>Sobre o Business Club</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('eventos')}
              className={`flex items-center justify-center gap-2 px-3.5 lg:px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                activeTab === 'eventos'
                  ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span>Eventos do Club</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('podcast')}
              className={`flex items-center justify-center gap-2 px-3.5 lg:px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                activeTab === 'podcast'
                  ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>EdvancedCast</span>
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('materiais')}
              className={`flex items-center justify-center gap-2 px-3.5 lg:px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                activeTab === 'materiais'
                  ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-md shadow-[#D4AF37]/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span>Galeria</span>
            </button>
          </nav>

          {/* Right Action: Login / Member Area button */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 flex items-center gap-2 transition-all">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Área de Membros VIP</span>
                  <span className="sm:hidden">Área VIP</span>
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="relative group overflow-hidden bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 flex items-center gap-2 transition-all">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Acesso VIP Membros</span>
                  <span className="sm:hidden">Login</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Tab switcher */}
        <div className="md:hidden grid grid-cols-4 border-t border-white/10 bg-[#061020]">
          <button
            type="button"
            onClick={() => setTab('sobre')}
            className={`py-3 px-1 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors ${
              activeTab === 'sobre'
                ? 'border-[#D4AF37] text-[#F5D77F] bg-[#0A1A33]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sobre o Business Club</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('eventos')}
            className={`py-3 px-1 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors ${
              activeTab === 'eventos'
                ? 'border-[#D4AF37] text-[#F5D77F] bg-[#0A1A33]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Eventos do Club</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('podcast')}
            className={`py-3 px-1 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors ${
              activeTab === 'podcast'
                ? 'border-[#D4AF37] text-[#F5D77F] bg-[#0A1A33]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">EdvancedCast</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('materiais')}
            className={`py-3 px-1 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors ${
              activeTab === 'materiais'
                ? 'border-[#D4AF37] text-[#F5D77F] bg-[#0A1A33]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Galeria</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. INSTITUTIONAL HERO SECTION (Fundo com Imagem da Ediane e Logo)
             Textos posicionados à esquerda sobre o fundo escuro, Ediane visível à direita
         ========================================================================= */}
      <section className="relative overflow-hidden bg-[#030914] text-white py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/30 shadow-2xl min-h-[560px] flex items-center">
        {/* Background Hero Image (Logo à esquerda, Ediane e Sala à direita) */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroEdianeBg}
            alt="Edvanced Business Club - Ediane Dal Bosco"
            className="w-full h-full object-cover object-right sm:object-center filter brightness-90 contrast-105"
          />
          {/* Degradê de alto contraste para garantir leitura impecável dos textos à esquerda */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030914] via-[#030914]/90 sm:via-[#030914]/80 to-transparent w-full md:w-[75%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030914] via-transparent to-[#030914]/50" />
        </div>

        {/* Soft Ambient Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-1">
          <div className="absolute -top-24 left-10 w-[500px] h-[350px] bg-[#D4AF37]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[250px] bg-[#0055B8]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl lg:max-w-3xl space-y-6 text-left">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061020]/90 border border-[#D4AF37]/50 text-[#F5D77F] text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#D4AF37]/15 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
              <span>Ecossistema de Alta Governança & Negócios</span>
            </div>

            {/* Main Hero Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Edvanced Business Club &{' '}
                <span className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#FFF0B8] bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(212,175,55,0.45)]">
                  EdvancedCast
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-slate-200/95 max-w-xl leading-relaxed font-normal drop-shadow-md">
                Acompanhe a agenda oficial de eventos, assista aos episódios exclusivos do podcast
                com grandes líderes de mercado e consulte a galeria e acervo do Club.
              </p>
            </div>

            {/* Value props badges / pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl pt-1">
              <div className="p-3 rounded-2xl bg-[#061020]/85 border border-[#D4AF37]/30 backdrop-blur-md text-left flex items-center gap-2.5 hover:border-[#D4AF37] transition-colors shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Crown className="w-4 h-4 text-[#F5D77F]" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-white">Alta Governança</p>
                  <p className="text-[10px] text-slate-300 font-medium">Institucional</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#061020]/85 border border-[#D4AF37]/30 backdrop-blur-md text-left flex items-center gap-2.5 hover:border-[#D4AF37] transition-colors shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <TrendingUp className="w-4 h-4 text-[#F5D77F]" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-white">Geração de Valor</p>
                  <p className="text-[10px] text-slate-300 font-medium">Negócios & M&A</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#061020]/85 border border-[#D4AF37]/30 backdrop-blur-md text-left flex items-center gap-2.5 hover:border-[#D4AF37] transition-colors shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Building2 className="w-4 h-4 text-[#F5D77F]" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-white">Grandes Líderes</p>
                  <p className="text-[10px] text-slate-300 font-medium">C-Level & Founders</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#061020]/85 border border-[#D4AF37]/30 backdrop-blur-md text-left flex items-center gap-2.5 hover:border-[#D4AF37] transition-colors shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Globe2 className="w-4 h-4 text-[#F5D77F]" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-white">Eventos Oficiais</p>
                  <p className="text-[10px] text-slate-300 font-medium">Presencial & Online</p>
                </div>
              </div>
            </div>

            {/* Quick tab switcher pill in hero */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setTab('sobre')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'sobre'
                    ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-lg shadow-[#D4AF37]/30'
                    : 'bg-[#061020]/90 hover:bg-[#0A1A33] text-slate-200 border border-white/15 hover:border-[#D4AF37]/60 backdrop-blur-md'
                }`}
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span>Sobre o Business Club</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('eventos')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'eventos'
                    ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-lg shadow-[#D4AF37]/30'
                    : 'bg-[#061020]/90 hover:bg-[#0A1A33] text-slate-200 border border-white/15 hover:border-[#D4AF37]/60 backdrop-blur-md'
                }`}
              >
                <CalendarIcon className="w-4 h-4 shrink-0" />
                <span>Eventos do Club ({meetings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('podcast')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'podcast'
                    ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-lg shadow-[#D4AF37]/30'
                    : 'bg-[#061020]/90 hover:bg-[#0A1A33] text-slate-200 border border-white/15 hover:border-[#D4AF37]/60 backdrop-blur-md'
                }`}
              >
                <Mic className="w-4 h-4 shrink-0" />
                <span>EdvancedCast ({episodes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('materiais')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'materiais'
                    ? 'bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] text-slate-950 shadow-lg shadow-[#D4AF37]/30'
                    : 'bg-[#061020]/90 hover:bg-[#0A1A33] text-slate-200 border border-white/15 hover:border-[#D4AF37]/60 backdrop-blur-md'
                }`}
              >
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span>Galeria ({publicMaterialsOnly.length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MAIN CONTENT (SEÇÕES COM FUNDO CLARO, CARDS BRANCOS E ALTO CONTRASTE)
         ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-16 animate-fade-in">
        {/* =====================================================================
            ABA: SOBRE O BUSINESS CLUB (INFORMAÇÕES INSTITUCIONAIS COMPLETAS)
           ===================================================================== */}
        {activeTab === 'sobre' && (
          <div className="space-y-12 animate-fade-in">
            {/* Banner Institucional Principal */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#061020] via-[#0A1A33] to-[#061020] border border-[#D4AF37]/40 shadow-2xl p-6 sm:p-10 md:p-12 text-white">
              {/* Ambient Glows */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 right-1/4 w-[500px] h-[300px] bg-[#D4AF37]/15 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-20 w-[400px] h-[300px] bg-[#0055B8]/20 rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />
              </div>

              <div className="relative z-10 space-y-12">
                {/* Header Institucional */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061020] border border-[#D4AF37]/50 text-[#F5D77F] text-xs font-black uppercase tracking-widest shadow-lg shadow-[#D4AF37]/15">
                    <Crown className="w-4 h-4 text-[#D4AF37]" />
                    <span>Institucional &bull; Edvanced Business Club</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    Sobre o{' '}
                    <span className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#FFF0B8] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(212,175,55,0.4)]">
                      Edvanced Business Club
                    </span>
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                    Ecossistema de Alta Governança & Negócios criado para empresários,
                    empreendedores e líderes em constante evolução que buscam conexões estratégicas
                    e geração de valor.
                  </p>

                  {isAdmin && (
                    <div className="pt-2">
                      <Link to="/admin/selecao-membros">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#D4AF37]/70 text-[#F5D77F] bg-[#061020]/90 hover:bg-[#0A1A33] text-xs font-bold rounded-xl"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" /> Gerenciar Benefícios
                          & Fotos (Painel Adm)
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* ================= OS 4 PILARES ESTRATÉGICOS ================= */}
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37] block">
                      Fundamentos do Ecossistema
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Os 4 Pilares do Edvanced Business Club
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="p-5 rounded-2xl bg-[#0A1A33]/90 border border-[#D4AF37]/35 space-y-3 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] p-[1.5px] flex items-center justify-center">
                        <div className="w-full h-full bg-[#061020] rounded-[10px] flex items-center justify-center">
                          <Crown className="w-5 h-5 text-[#F5D77F]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">Alta Governança</h4>
                        <p className="text-xs text-[#F5D77F] font-bold">Institucional</p>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Estruturação corporativa, compliance, integridade nos processos e
                        direcionamento sólido para sustentabilidade dos negócios.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0A1A33]/90 border border-[#D4AF37]/35 space-y-3 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] p-[1.5px] flex items-center justify-center">
                        <div className="w-full h-full bg-[#061020] rounded-[10px] flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-[#F5D77F]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">Geração de Valor</h4>
                        <p className="text-xs text-[#F5D77F] font-bold">Negócios & M&A</p>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Aceleração estratégica de resultados, atração de investimentos, fusões e
                        aquisições com foco em escalabilidade real.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0A1A33]/90 border border-[#D4AF37]/35 space-y-3 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] p-[1.5px] flex items-center justify-center">
                        <div className="w-full h-full bg-[#061020] rounded-[10px] flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#F5D77F]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">Grandes Líderes</h4>
                        <p className="text-xs text-[#F5D77F] font-bold">C-Level & Founders</p>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Conexões qualificadas de alta densidade entre tomadores de decisão,
                        presidentes de conselho e empresários seniores.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0A1A33]/90 border border-[#D4AF37]/35 space-y-3 hover:border-[#D4AF37] transition-colors shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] p-[1.5px] flex items-center justify-center">
                        <div className="w-full h-full bg-[#061020] rounded-[10px] flex items-center justify-center">
                          <Globe2 className="w-5 h-5 text-[#F5D77F]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">Eventos Oficiais</h4>
                        <p className="text-xs text-[#F5D77F] font-bold">Presencial & Online</p>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Encontros executivos periódicos, imersões estratégicas e summits desenhados
                        para gerar conhecimento prático e negócios.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ================= BLOCO: "PARA QUEM É" ================= */}
                <div className="bg-gradient-to-br from-[#061020]/95 via-[#0A1A33]/90 to-[#061020]/95 rounded-3xl p-6 sm:p-8 md:p-10 border border-[#D4AF37]/35 shadow-xl space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] p-[1.5px] flex items-center justify-center shadow-md">
                        <div className="w-full h-full bg-[#061020] rounded-[14px] flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-[#F5D77F]" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37] block">
                          Manifesto do Club
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white">Para Quem É</h3>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-bold">
                      <span>
                        O lugar certo &bull; As pessoas certas &bull; As oportunidades certas
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-5">
                      <div className="relative pl-6 border-l-2 border-[#D4AF37] space-y-3">
                        <p className="text-base sm:text-lg md:text-xl text-slate-100 font-medium leading-relaxed">
                          &ldquo;Empresários de alta performance não crescem apenas através de
                          conhecimento. Acontece também pelos ambientes que você frequenta, pelas
                          pessoas com quem se conecta e pelas decisões que passa a tomar.&rdquo;
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <p className="text-sm sm:text-base text-[#F5D77F] font-bold">
                          Foi exatamente por isso que nasceu o Edvanced Business Club.
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Um clube empresarial exclusivo criado para empresários, líderes e
                          profissionais que desejam evoluir continuamente, compartilhar experiências
                          e gerar oportunidades reais de crescimento.
                        </p>
                      </div>
                    </div>

                    {/* Pilares do Perfil de Membros */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="p-4 rounded-2xl bg-[#061020] border border-[#D4AF37]/25 space-y-1.5">
                        <div className="flex items-center gap-2 text-[#F5D77F] font-bold text-xs uppercase tracking-wide">
                          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          <span>Empreendedores & Founders</span>
                        </div>
                        <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                          Que desejam acelerar seu crescimento com estratégia e conexões de alto
                          nível.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#061020] border border-[#D4AF37]/25 space-y-1.5">
                        <div className="flex items-center gap-2 text-[#F5D77F] font-bold text-xs uppercase tracking-wide">
                          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          <span>Empresários & Executivos</span>
                        </div>
                        <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                          Que buscam estruturar, fortalecer governança e expandir seus negócios.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#061020] border border-[#D4AF37]/25 space-y-1.5">
                        <div className="flex items-center gap-2 text-[#F5D77F] font-bold text-xs uppercase tracking-wide">
                          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          <span>Líderes de Mercado</span>
                        </div>
                        <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                          Que buscam desenvolver pessoas, equipes e resultados exponenciais.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= BLOCO: "BENEFÍCIOS E DIFERENCIAIS" ================= */}
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F5D77F] text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Diferenciais do Club
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Benefícios Exclusivos do Club
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                        Uma infraestrutura completa de ambiência, conteúdos estratégicos e conexões
                        de negócios para impulsionar a sua jornada.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F5D77F] bg-[#061020] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/40 shadow-xs">
                        {benefits.length} Benefício(s) Inclusos
                      </span>
                    </div>
                  </div>

                  {/* Grid de Cards de Benefícios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit) => {
                      const IconComp = AVAILABLE_ICONS[benefit.icon_name || 'Sparkles'] || Sparkles
                      return (
                        <div
                          key={benefit.id}
                          className="group relative rounded-3xl bg-gradient-to-b from-[#0A1A33] to-[#061020] border border-white/10 hover:border-[#D4AF37] p-6 shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            {/* Top Icon + Category */}
                            <div className="flex items-center justify-between">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#B89324] p-[1.5px] flex items-center justify-center shadow-md">
                                <div className="w-full h-full bg-[#061020] rounded-[14px] flex items-center justify-center group-hover:bg-[#0A1A33] transition-colors">
                                  <IconComp className="w-6 h-6 text-[#F5D77F] group-hover:scale-110 transition-transform" />
                                </div>
                              </div>

                              {benefit.category && (
                                <Badge className="bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D77F] text-[9px] font-extrabold uppercase tracking-wider">
                                  {benefit.category}
                                </Badge>
                              )}
                            </div>

                            {/* Text */}
                            <div className="space-y-2">
                              <h4 className="text-base sm:text-lg font-black text-white group-hover:text-[#F5D77F] transition-colors leading-snug">
                                {benefit.title}
                              </h4>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {benefit.description}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#F5D77F]">
                            <span className="font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                              Incluso para Membros
                            </span>
                            <Sparkles className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ================= BLOCO: "ESTRUTURA FÍSICA E SALAS" ================= */}
                <div className="space-y-6 pt-4 border-t border-white/10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F5D77F] text-xs font-bold uppercase tracking-wider mb-2">
                        <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Infraestrutura Premium
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Conheça o Local e as Salas
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                        Tenha acesso exclusivo a um ambiente empresarial moderno e de alto padrão
                        (Sala de Reunião e Sala Compartilhada) sem os altos custos fixos de manter
                        uma estrutura própria.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F5D77F] bg-[#061020] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/40 shadow-xs">
                        {spacesPhotos.length} Foto(s) dos Ambientes
                      </span>
                    </div>
                  </div>

                  {/* Galeria de Fotos Reais */}
                  {spacesPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {spacesPhotos.map((photoItem) => {
                        const src = getSpacePhotoSrc(photoItem)
                        return (
                          <div
                            key={photoItem.id}
                            onClick={() => setPreviewSpacePhoto(photoItem)}
                            className="group relative rounded-3xl overflow-hidden bg-[#061020] border border-white/10 hover:border-[#D4AF37] shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                          >
                            {/* Imagem */}
                            <div className="relative aspect-[16/10] w-full bg-[#0A1A33] overflow-hidden">
                              {src ? (
                                <img
                                  src={src}
                                  alt={photoItem.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                  <Building2 className="w-10 h-10 text-[#F5D77F] mb-2" />
                                  <span className="text-[11px] font-black uppercase text-[#F5D77F]">
                                    {photoItem.title}
                                  </span>
                                </div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                              {/* Tipo de Espaço */}
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                                  {photoItem.space_type || 'Espaço Edvanced'}
                                </Badge>
                              </div>

                              {/* Hover Zoom Icon */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                  <Eye className="w-5 h-5" />
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-1.5">
                              <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#F5D77F] transition-colors line-clamp-2">
                                {photoItem.title}
                              </h4>
                              {photoItem.caption && (
                                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                  {photoItem.caption}
                                </p>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="p-5 pt-0 flex items-center justify-between text-[11px] text-[#F5D77F] border-t border-white/5 mt-1">
                              <span className="font-bold flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                                Estrutura Oficial
                              </span>
                              <span className="text-slate-400 group-hover:text-white flex items-center gap-1 transition-colors">
                                Ampliar foto &rarr;
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-[#061020]/90 border border-dashed border-[#D4AF37]/40 p-8 sm:p-12 text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#F5D77F]">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <div className="space-y-1 max-w-lg mx-auto">
                        <h4 className="font-black text-lg text-white">
                          Estrutura Física do Ecossistema Edvanced
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Salas de reunião executivas e salas compartilhadas de alto padrão para
                          potencializar sua produtividade e realizar reuniões estratégicas com seus
                          parceiros.
                        </p>
                      </div>
                      {isAdmin ? (
                        <Link
                          to="/admin/selecao-membros"
                          className="inline-flex items-center justify-center bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
                        >
                          <Upload className="w-4 h-4 mr-1.5" /> Fazer Upload das Fotos Reais (Painel
                          Adm)
                        </Link>
                      ) : (
                        <a
                          href={WHATSAPP_SELECTION_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" /> Solicitar Apresentação do
                          Espaço
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* ================= BLOCO: EXCLUSIVIDADE & CONTATOS OFICIAIS ================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                  {/* Exclusividade */}
                  <div className="p-6 rounded-3xl bg-[#061020] border border-[#D4AF37]/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4 text-[#F5D77F]" />
                      </div>
                      <h4 className="font-extrabold text-sm text-white">
                        Exclusividade para Membros
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Os materiais estratégicos em PDF, relatórios e apresentações completas são
                      restritos aos membros associados do Edvanced Business Club.
                    </p>
                  </div>

                  {/* Canais Oficiais */}
                  <div className="p-6 rounded-3xl bg-[#061020] border border-[#D4AF37]/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-[#F5D77F]" />
                      </div>
                      <h4 className="font-extrabold text-sm text-white">
                        Canais Oficiais de Atendimento
                      </h4>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p className="flex items-center gap-2">
                        <span className="text-[#F5D77F] font-bold">WhatsApp:</span>
                        <a
                          href="https://wa.me/5565981003969"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white underline underline-offset-2"
                        >
                          (65) 98100-3969
                        </a>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-[#F5D77F] font-bold">E-mail:</span>
                        <a
                          href="mailto:contatoedvanced@gmail.com"
                          className="hover:text-white underline underline-offset-2"
                        >
                          contatoedvanced@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ================= BOTÃO "MAIS INFORMAÇÕES" EM DESTAQUE ================= */}
                <div className="rounded-3xl bg-gradient-to-r from-[#061020] via-[#0D2142] to-[#061020] border-2 border-[#D4AF37]/60 p-8 sm:p-10 text-center space-y-5 shadow-2xl">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F5D77F] text-xs font-bold uppercase tracking-wider">
                    <Crown className="w-4 h-4 text-[#D4AF37]" />
                    Vagas Limitadas &bull; Processo Seletivo
                  </div>

                  <div className="space-y-2 max-w-2xl mx-auto">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      Pronto para transformar a ambiência e as conexões do seu negócio?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      Entre em contato com a equipe de curadoria do Edvanced Business Club para
                      consultar critérios de seleção de membros, disponibilidade de salas e
                      benefícios exclusivos.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                      href={WHATSAPP_SELECTION_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-sm uppercase tracking-wider py-5 px-8 rounded-2xl shadow-xl shadow-[#D4AF37]/30 hover:scale-105 transition-all flex items-center justify-center gap-2.5"
                    >
                      <MessageCircle className="w-5 h-5 text-slate-950 fill-current" />
                      <span>Mais Informações sobre Seleção de Membros</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Atendimento direto via WhatsApp (65) 98100-3969 com a nossa curadoria executiva.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            ABA 1: EVENTOS OFICIAIS DO CLUB COM INSCRIÇÃO EXTERNA
           ===================================================================== */}
        {activeTab === 'eventos' && (
          <div className="space-y-8">
            {/* Top Toolbar: Search & Format Filters (Fundo Branco + Borda Dourada Suave) */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] p-[1px] flex items-center justify-center shadow-xs">
                      <div className="w-full h-full bg-[#0A1A33] rounded-[11px] flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-[#F5D77F]" />
                      </div>
                    </div>
                    <span>Eventos Oficiais Edvanced Business Club</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Encontros, experiências e conexões estratégicas para desenvolver você,
                    fortalecer seu negócio e gerar novas oportunidades.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#8C6D07] bg-amber-50 px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 shadow-xs">
                    {filteredEvents.length} evento(s) encontrado(s)
                  </span>
                </div>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar por título, cidade, tema..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
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
                    <option value="todos">Todas as Modalidades</option>
                    <option value="gratuito">🎟️ Exclusivo Membros Club</option>
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
                  <span className="text-[11px] font-bold text-slate-500">Filtros ativos:</span>
                  {eventSearch && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-slate-100 text-slate-800 border border-slate-300 gap-1 pr-1"
                    >
                      Busca: "{eventSearch}"
                      <button onClick={() => setEventSearch('')} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {eventFormat !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-amber-50 text-[#8C6D07] border border-[#D4AF37]/40 gap-1 pr-1 font-bold"
                    >
                      Formato: {eventFormat}
                      <button
                        onClick={() => setEventFormat('todos')}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {eventPricing !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-slate-100 text-slate-800 border border-slate-300 gap-1 pr-1"
                    >
                      Cobrança:{' '}
                      {eventPricing === 'gratuito' ? 'Exclusivo Membros Club' : 'Pago / Inscrição'}
                      <button
                        onClick={() => setEventPricing('todos')}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {eventMonth !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-amber-50 text-[#8C6D07] border border-[#D4AF37]/40 gap-1 pr-1 font-bold"
                    >
                      Mês: {availableMonths.find((m) => m.key === eventMonth)?.label || eventMonth}
                      <button
                        onClick={() => setEventMonth('todos')}
                        className="hover:text-rose-600"
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

            {/* Events Grid (Executive White Cards with Gold Border on Hover) */}
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const status = getMeetingStatus(event)
                  const StatusIcon = status.icon
                  const coverUrl = getMeetingCover(event)

                  return (
                    <Card
                      key={event.id}
                      className="group relative border border-slate-200/90 bg-white rounded-3xl overflow-hidden shadow-sm hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Cover image */}
                        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0A1A33] via-[#0D2142] to-[#061020] flex flex-col items-center justify-center p-6 text-center">
                              <Crown className="w-8 h-8 text-[#F5D77F] mb-2" />
                              <span className="text-[11px] font-black uppercase tracking-widest text-[#F5D77F]">
                                {event.event_name || 'Edvanced Business Club'}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                          {/* Top badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5">
                            <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md">
                              {event.type || 'Presencial'}
                            </Badge>

                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold uppercase backdrop-blur-md shadow-xs ${status.badgeClass}`}
                            >
                              <StatusIcon className="w-3 h-3 mr-1 inline" />
                              {status.label}
                            </Badge>
                          </div>

                          {/* Bottom pricing */}
                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                            <span className="font-extrabold text-[#F5D77F] drop-shadow-sm flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5 text-[#F5D77F]" />
                              {formatShortDate(event.start_date || event.date)}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-950/80 border border-white/20 text-white">
                              {event.pricing === 'pago'
                                ? 'Inscrição Paga'
                                : 'Exclusivo Membros Club'}
                            </span>
                          </div>
                        </div>

                        {/* Event Content */}
                        <div className="p-5 sm:p-6 space-y-3">
                          {event.event_name && (
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D07] flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-[#D4AF37]" />
                              <span>{event.event_name}</span>
                            </p>
                          )}

                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2 leading-snug">
                            {event.title}
                          </h3>

                          {/* Location & Time */}
                          <div className="space-y-2 text-xs text-slate-600 pt-1">
                            <div className="flex items-start gap-2">
                              <Clock className="w-4 h-4 text-[#8C6D07] flex-shrink-0 mt-0.5" />
                              <span className="text-slate-700 font-medium">
                                {formatDateString(event.start_date || event.date)} às{' '}
                                {formatTimeString(event.start_date || event.date)}
                                {event.end_date ? ` até ${formatTimeString(event.end_date)}` : ''}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-[#8C6D07] flex-shrink-0 mt-0.5" />
                              <span className="truncate text-slate-700" title={event.location}>
                                {event.location}
                              </span>
                            </div>

                            {event.speakers && (
                              <div className="flex items-start gap-2 text-slate-700">
                                <Users className="w-4 h-4 text-[#8C6D07] flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{event.speakers}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Exclusive Member Notice & Detail Action */}
                      <div className="p-5 sm:p-6 pt-0 space-y-2.5 border-t border-slate-100 mt-2">
                        {/* Selo/Aviso de Exclusividade para Membros */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-amber-500/10 border border-[#D4AF37]/40 text-[#8C6D07]">
                          <Lock className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider line-clamp-1">
                            Exclusivo para Membros do Edvanced Business Club
                          </span>
                        </div>

                        <Button
                          onClick={() => setSelectedEventModal(event)}
                          className="w-full bg-[#0A1A33] hover:bg-[#122443] text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all border border-slate-800 hover:border-[#D4AF37]/50"
                        >
                          <span>Ver Detalhes do Evento</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#F5D77F]" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEventModal(event)}
                          className="w-full text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
                <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">Nenhum evento encontrado</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ajuste os filtros de busca ou formato para ver a agenda de encontros oficiais.
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
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-xs">
                      <Mic className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      EdvancedCast — O PodCast Oficial
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Grandes entrevistas sobre governança, investimentos, M&A e liderança com os
                    maiores nomes do mercado.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && (
                    <Button
                      onClick={handleOpenAddEpisode}
                      className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-[#D4AF37]/20"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Novo Episódio
                    </Button>
                  )}

                  <span className="text-xs font-bold text-[#8C6D07] bg-amber-50 px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 shadow-xs">
                    {filteredEpisodes.length} episódio(s)
                  </span>
                </div>
              </div>

              {/* Search podcast */}
              <div className="pt-3 border-t border-slate-100">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar episódios por título, convidado ou tema..."
                    value={podcastSearch}
                    onChange={(e) => setPodcastSearch(e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Featured Hero Player (se houver episódios) */}
            {filteredEpisodes.length > 0 && (
              <div className="rounded-3xl overflow-hidden bg-[#0A1A33] border border-[#D4AF37]/40 shadow-xl text-white">
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
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0A1A33] to-[#061020]" />
                          )}
                          <div className="relative z-10 p-8 text-center space-y-3">
                            <Tv className="w-12 h-12 text-[#F5D77F] mx-auto animate-pulse" />
                            <p className="text-sm font-bold text-white">Assistir ao Episódio</p>
                            <a
                              href={featuredEp.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                            >
                              Abrir Player Externo <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
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
                            <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-[10px] uppercase tracking-wider">
                              Episódio{' '}
                              {featuredEp.episode_number
                                ? `#${featuredEp.episode_number}`
                                : 'Especial'}
                            </Badge>
                            {featuredEp.duration && (
                              <Badge
                                variant="outline"
                                className="text-slate-200 border-slate-700 text-[10px] bg-[#061020]/80"
                              >
                                <Clock className="w-3 h-3 mr-1 inline text-[#F5D77F]" />
                                {featuredEp.duration}
                              </Badge>
                            )}
                            {featuredEp.published_at && (
                              <span className="text-xs text-slate-300">
                                {formatDateString(featuredEp.published_at)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                            {featuredEp.title}
                          </h3>

                          {featuredEp.description && (
                            <p className="text-xs md:text-sm text-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {featuredEp.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleCopyEpisodeLink(e, featuredEp)}
                              className="border-slate-700 bg-[#061020]/90 text-slate-200 hover:text-white hover:bg-slate-800 text-xs rounded-xl"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1 text-[#F5D77F]" />
                              Copiar Link
                            </Button>

                            <a
                              href={getEpisodeWhatsAppShareUrl(featuredEp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center h-8 px-3 border border-emerald-700 bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900 text-xs font-medium rounded-xl transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                              WhatsApp
                            </a>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditEpisode(featuredEp)}
                                className="h-8 text-xs text-slate-300 hover:text-white"
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
                          window.scrollTo({ top: 380, behavior: 'smooth' })
                        }}
                        className={`group border bg-white rounded-3xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#D4AF37] ring-2 ring-[#D4AF37] shadow-xl'
                            : 'border-slate-200/90 hover:border-[#D4AF37] hover:shadow-xl'
                        }`}
                      >
                        <div>
                          {/* Thumbnail */}
                          <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                            {cover ? (
                              <img
                                src={cover}
                                alt={ep.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#0A1A33] via-[#0D2142] to-[#061020] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center mb-2">
                                  <Mic className="w-5 h-5 text-[#F5D77F]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5D77F]">
                                  EdvancedCast
                                </span>
                                <span className="text-xs font-bold text-white mt-1 line-clamp-1 px-4">
                                  {ep.title}
                                </span>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                            {/* Ep number */}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
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
                                className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#D4AF37] text-white hover:text-slate-950 border border-white/20 flex items-center justify-center transition-all"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                title="Compartilhar no WhatsApp"
                                href={getEpisodeWhatsAppShareUrl(ep)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-7 h-7 rounded-full bg-black/70 hover:bg-emerald-600 text-white border border-white/20 flex items-center justify-center transition-all"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {/* Play overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>

                            {/* Duration bottom */}
                            {ep.duration && (
                              <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] text-white font-bold border border-white/10">
                                {ep.duration}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-5 sm:p-6 space-y-2">
                            {ep.published_at && (
                              <p className="text-[10px] font-semibold text-[#8C6D07]">
                                {formatDateString(ep.published_at)}
                              </p>
                            )}

                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2 leading-snug">
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
                        <div className="p-5 sm:p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#8C6D07] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Assistir
                            </span>

                            <span className="text-slate-300">&bull;</span>

                            <a
                              href={getEpisodeWhatsAppShareUrl(ep)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              title="Compartilhar no WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
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
                                className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-950"
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
                  <Mic className="w-12 h-12 text-slate-400 mx-auto" />
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

        {/* =====================================================================
            ABA 3: MATERIAIS PÚBLICOS DOS ENCONTROS OFICIAIS DO CLUB (FOTOS E VÍDEOS APENAS)
           ===================================================================== */}
        {activeTab === 'materiais' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Toolbar: Search & Format Filters */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] p-[1px] flex items-center justify-center shadow-xs">
                      <div className="w-full h-full bg-[#0A1A33] rounded-[11px] flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-[#F5D77F]" />
                      </div>
                    </div>
                    <span>Galeria Oficial &bull; Fotos e Vídeos dos Eventos</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Visualização de registros fotográficos e vídeos de cobertura dos nossos
                    encontros presenciais e summits.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#8C6D07] bg-amber-50 px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 shadow-xs">
                    {filteredMaterials.length} registro(s) visualizável(is)
                  </span>
                </div>
              </div>

              {/* Banner informativo de exclusividade dos PDFs para membros */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#061020] via-[#0A1A33] to-[#061020] border border-[#D4AF37]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-[#F5D77F]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F5D77F]">
                      Materiais em PDF, slides e apresentações são exclusivos aos membros
                    </p>
                    <p className="text-[11px] text-slate-300">
                      O público pode visualizar apenas registros de fotos e vídeos dos eventos (sem
                      opção de download).
                    </p>
                  </div>
                </div>

                {user ? (
                  <Link to="/encontros" className="flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl px-4 shadow-md"
                    >
                      Acessar Acervo VIP Completo &rarr;
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" className="flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl px-4 shadow-md"
                    >
                      Login de Membro &rarr;
                    </Button>
                  </Link>
                )}
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar fotos, vídeos dos eventos..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#D4AF37]"
                  />
                </div>

                {/* Tipo de Material */}
                <div>
                  <select
                    value={materialTypeFilter}
                    onChange={(e) => setMaterialTypeFilter(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                  >
                    <option value="todos">Todos os Registros (Fotos & Vídeos)</option>
                    <option value="photo">📸 Apenas Fotos dos Encontros</option>
                    <option value="video">🎥 Apenas Vídeos / Coberturas</option>
                  </select>
                </div>

                {/* Encontro Relacionado */}
                <div>
                  <select
                    value={materialMeetingFilter}
                    onChange={(e) => setMaterialMeetingFilter(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37]"
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
              {(materialSearch ||
                materialTypeFilter !== 'todos' ||
                materialMeetingFilter !== 'todos') && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500">Filtros ativos:</span>
                  {materialSearch && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-slate-100 text-slate-800 border border-slate-300 gap-1 pr-1"
                    >
                      Busca: "{materialSearch}"
                      <button onClick={() => setMaterialSearch('')} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {materialTypeFilter !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-amber-50 text-[#8C6D07] border border-[#D4AF37]/40 gap-1 pr-1 font-bold"
                    >
                      Tipo: {materialTypeFilter === 'photo' ? 'Fotos' : 'Vídeos'}
                      <button
                        onClick={() => setMaterialTypeFilter('todos')}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {materialMeetingFilter !== 'todos' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-slate-100 text-slate-800 border border-slate-300 gap-1 pr-1"
                    >
                      Encontro:{' '}
                      {meetings.find((m) => m.id === materialMeetingFilter)?.title ||
                        materialMeetingFilter}
                      <button
                        onClick={() => setMaterialMeetingFilter('todos')}
                        className="hover:text-rose-600"
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

            {/* Public Materials Grid (Fotos e Vídeos apenas) */}
            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.map((mat) => {
                  const kind = detectMaterialKind({
                    file: mat.file,
                    url: mat.url,
                    title: mat.title,
                    type: mat.type,
                  })
                  const isPhoto = kind.subtype === 'photo'
                  const isVideo = kind.subtype === 'video'

                  const fileUrl = mat.file ? getFileUrl('materials', mat.id, mat.file) : ''
                  const externalUrl = mat.url || ''
                  const ytId = isVideo ? getYouTubeId(externalUrl) : null
                  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : ''
                  const displayThumb = isPhoto ? fileUrl : ytThumb || ''

                  const relatedMeeting =
                    mat.expand?.meeting ||
                    meetings.find((m) => m.id === mat.meeting || (mat as any).meeting_id)

                  return (
                    <Card
                      key={mat.id}
                      onClick={() => setPreviewMediaModal(mat)}
                      className="group border border-slate-200/90 bg-white rounded-3xl overflow-hidden shadow-sm hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer select-none"
                    >
                      <div>
                        {/* Media Thumbnail Container */}
                        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                          {displayThumb ? (
                            <img
                              src={displayThumb}
                              alt={mat.title}
                              onContextMenu={(e) => e.preventDefault()}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0A1A33] via-[#0D2142] to-[#061020] flex flex-col items-center justify-center p-6 text-center">
                              {isPhoto ? (
                                <ImageIcon className="w-10 h-10 text-[#F5D77F] mb-2" />
                              ) : (
                                <Video className="w-10 h-10 text-[#F5D77F] mb-2" />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#F5D77F]">
                                {kind.label.toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                          {/* Top Type Badge */}
                          <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow flex items-center gap-1">
                              {isPhoto && <ImageIcon className="w-3 h-3" />}
                              {isVideo && <Video className="w-3 h-3" />}
                              <span>{isPhoto ? 'Foto do Evento' : 'Vídeo do Evento'}</span>
                            </Badge>
                          </div>

                          {/* Botão de Excluir exclusivo do Administrador */}
                          {isAdmin && (
                            <button
                              type="button"
                              title="Excluir Material (Administrador)"
                              onClick={async (e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                if (
                                  !window.confirm(
                                    `Tem certeza que deseja excluir o material "${mat.title}" permanentemente do acervo?`,
                                  )
                                ) {
                                  return
                                }
                                try {
                                  await deleteMaterial(mat.id)
                                  toast.success('Material excluído com sucesso!')
                                  const updated = await getAllMaterials()
                                  setMaterials(updated)
                                } catch (err: any) {
                                  toast.error(
                                    'Erro ao excluir material: ' + (err?.message || 'Falha'),
                                  )
                                }
                              }}
                              className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 flex items-center justify-center transition-colors shadow-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Center Play or Zoom Icon on Hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
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
                        <div className="p-5 sm:p-6 space-y-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2 leading-snug">
                            {mat.title}
                          </h4>

                          {mat.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {mat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Info (Apenas Visualização) */}
                      <div className="p-5 sm:p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
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
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#8C6D07]">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-bold text-slate-900 text-base">
                    Nenhum registro de foto ou vídeo encontrado
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Fotos e vídeos de cobertura dos encontros oficiais são publicados aqui após a
                    realização de cada evento. Os materiais e apresentações em PDF são de acesso
                    exclusivo aos membros do Club.
                  </p>
                </div>
                {user ? (
                  <Link to="/encontros" className="inline-block pt-1">
                    <Button className="bg-[#0A1A33] hover:bg-[#122443] text-white text-xs font-bold rounded-xl px-4 py-2">
                      Ver Materiais no Portal VIP de Membros
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" className="inline-block pt-1">
                    <Button className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 text-xs font-bold rounded-xl px-4 py-2">
                      Acessar Portal de Membros
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            NOVA SEÇÃO: DEPOIMENTOS DE MEMBROS (EXCLUSIVIDADE & PROVA SOCIAL VIP)
           ===================================================================== */}
        <section className="bg-gradient-to-b from-white via-slate-50 to-white p-7 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-[#D4AF37]/40 text-[#8C6D07] text-xs font-bold uppercase tracking-wider mb-2">
                <Quote className="w-3.5 h-3.5 text-[#D4AF37]" />
                Experiência & Autoridade
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                O que dizem os membros do{' '}
                <span className="bg-gradient-to-r from-[#8C6D07] via-[#D4AF37] to-[#8C6D07] bg-clip-text text-transparent">
                  Edvanced Business Club
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Relatos de presidentes de conselho, founders e executivos C-Level sobre o impacto
                prático dos encontros e da governança do Club.
              </p>
            </div>

            {/* Controls / Admin Link */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin/depoimentos">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#D4AF37] text-[#8C6D07] hover:bg-amber-50 text-xs font-bold rounded-xl"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Gerenciar Depoimentos (Adm)
                  </Button>
                </Link>
              )}

              {testimonials.length > 3 && (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => scrollTestimonials('left')}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-[#D4AF37] hover:bg-amber-50 text-slate-700 flex items-center justify-center shadow-xs transition-all"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollTestimonials('right')}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-[#D4AF37] hover:bg-amber-50 text-slate-700 flex items-center justify-center shadow-xs transition-all"
                    title="Próximo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Testimonials Grid / Carousel */}
          {testimonials.length > 0 ? (
            <div
              ref={testimonialScrollRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto no-scrollbar pb-2 pt-1"
            >
              {testimonials.map((item) => {
                const avatarSrc = getTestimonialAvatar(item)

                return (
                  <Card
                    key={item.id}
                    className="group border border-slate-200/90 hover:border-[#D4AF37] bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top rating stars */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: item.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                          ))}
                        </div>

                        <Quote className="w-6 h-6 text-[#D4AF37]/30" />
                      </div>

                      {/* Content */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                        "{item.content}"
                      </p>
                    </div>

                    {/* Member Profile */}
                    <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-100">
                      <Avatar className="w-12 h-12 ring-2 ring-[#D4AF37]/50 flex-shrink-0">
                        {avatarSrc ? (
                          <AvatarImage
                            src={avatarSrc}
                            alt={item.author_name}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[#0A1A33] to-[#061020] text-[#F5D77F] font-bold text-xs">
                          {item.author_name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {item.author_name}
                        </h4>
                        {item.author_role && (
                          <p className="text-[11px] text-[#8C6D07] font-bold truncate">
                            {item.author_role}
                          </p>
                        )}
                        {item.company && (
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{item.company}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum depoimento exibido no momento.
            </div>
          )}
        </section>
      </main>

      {/* =========================================================================
          4. PUBLIC FOOTER & OFFICIAL CLUB CONTACT INFO (Dark Navy + Gold)
         ========================================================================= */}
      <footer className="bg-gradient-to-b from-[#0A1A33] via-[#061020] to-[#040B17] text-slate-200 border-t border-[#D4AF37]/30 py-16 px-4 sm:px-6 lg:px-8 mt-16 shadow-2xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Col 1: Club Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#997300] p-[1.5px] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#061020] rounded-[14px] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[#F5D77F]" />
                </div>
              </div>
              <div>
                <span className="font-black text-lg tracking-wider text-white block">EDVANCED</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold block -mt-0.5">
                  Business Club
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O ecossistema exclusivo de alta governança corporativa, conexões estratégicas e
              aceleração de negócios para grandes empresários, líderes e investidores.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#F5D77F] border border-[#D4AF37]/40">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Experiência Executiva VIP
              </span>
            </div>
          </div>

          {/* Col 2: Public Navigation Links */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-[#F5D77F] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Navegação do Portal
            </p>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTab('sobre')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="hover:text-[#F5D77F] transition-colors flex items-center gap-2 text-slate-300"
                >
                  <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Sobre o Business Club</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTab('eventos')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="hover:text-[#F5D77F] transition-colors flex items-center gap-2 text-slate-300"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Eventos Oficiais do Club</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTab('podcast')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="hover:text-[#F5D77F] transition-colors flex items-center gap-2 text-slate-300"
                >
                  <Mic className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>EdvancedCast (Podcast Oficial)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTab('materiais')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="hover:text-[#F5D77F] transition-colors flex items-center gap-2 text-slate-300"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Materiais, Fotos e Gravações</span>
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800">
                <Link
                  to="/login"
                  className="text-[#F5D77F] hover:text-white transition-colors font-bold flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Portal VIP dos Membros &rarr;</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Contact Details */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-[#F5D77F] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> Contato Oficial do Club
            </p>
            <div className="space-y-2.5 text-slate-300">
              <a
                href="https://wa.me/5565981003969"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#061020] border border-slate-800 hover:border-emerald-500/50 hover:bg-[#0A1A33] transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[11px]">WhatsApp Edvanced</span>
                  <span className="text-[11px] text-emerald-300">(65) 98100-3969</span>
                </div>
              </a>

              <a
                href="https://instagram.com/edvancedbusinessclub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#061020] border border-slate-800 hover:border-pink-500/50 hover:bg-[#0A1A33] transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Instagram className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[11px]">Instagram Oficial</span>
                  <span className="text-[11px] text-pink-300">@edvanced_</span>
                </div>
              </a>

              <a
                href="mailto:contatoedvanced@gmail.com"
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#061020] border border-slate-800 hover:border-[#D4AF37]/50 hover:bg-[#0A1A33] transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#F5D77F] group-hover:scale-105 transition-transform flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[11px]">E-mail de Contato</span>
                  <span className="text-[11px] text-slate-300">contatoedvanced@gmail.com</span>
                </div>
              </a>
            </div>
          </div>

          {/* Col 4: Sede & Admissão */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-[#F5D77F] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Sede
            </p>
            <div className="p-3.5 rounded-2xl bg-[#061020] border border-slate-800 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-[11px]">
                    Centro de Transformação Edvanced
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Rua Dep. Roberto Cruz, 246&nbsp;<div>Bairro Alvorada</div>
                  </p>
                  <p className="text-slate-400 text-[10px]">Cuiabá - MT, Brasil</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Edvanced Business Club. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">Onde os Resultados Acontecem</span>
            <span>&bull;</span>
            <span className="text-[#F5D77F] font-semibold">Ecossistema Exclusivo de Negócios</span>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          MODAL PREVIEW DE FOTO DO LOCAL E SALAS (GALERIA)
         ========================================================================= */}
      {previewSpacePhoto && (
        <Dialog
          open={!!previewSpacePhoto}
          onOpenChange={(open) => !open && setPreviewSpacePhoto(null)}
        >
          <DialogContent className="max-w-3xl bg-[#0A1A33] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 uppercase font-black text-[10px]">
                  {previewSpacePhoto.space_type || 'Espaço Edvanced'}
                </Badge>
              </div>

              <DialogTitle className="text-xl md:text-2xl font-black text-white leading-tight">
                {previewSpacePhoto.title}
              </DialogTitle>
            </DialogHeader>

            <div className="my-4">
              <div className="relative w-full max-h-[65vh] bg-black/60 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {getSpacePhotoSrc(previewSpacePhoto) ? (
                  <img
                    src={getSpacePhotoSrc(previewSpacePhoto)}
                    alt={previewSpacePhoto.title}
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-[#D4AF37]" />
                    <p className="text-xs">Foto do ambiente.</p>
                  </div>
                )}
              </div>
            </div>

            {previewSpacePhoto.caption && (
              <div className="p-4 bg-[#061020] rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
                <p className="whitespace-pre-wrap">{previewSpacePhoto.caption}</p>
              </div>
            )}

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setPreviewSpacePhoto(null)}
                className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </Button>

              <a
                href={WHATSAPP_SELECTION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md gap-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Mais Informações sobre as Salas</span>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL PREVIEW DE MÍDIA PÚBLICA (VISUALIZAÇÃO DE FOTOS E VÍDEOS — SEM DOWNLOAD)
         ========================================================================= */}
      {previewMediaModal && (
        <Dialog
          open={!!previewMediaModal}
          onOpenChange={(open) => !open && setPreviewMediaModal(null)}
        >
          <DialogContent className="max-w-3xl bg-[#0A1A33] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto">
            {(() => {
              const kind = detectMaterialKind({
                file: previewMediaModal.file,
                url: previewMediaModal.url,
                title: previewMediaModal.title,
                type: previewMediaModal.type,
              })
              const isVideo = kind.subtype === 'video'
              const isPhoto = kind.subtype === 'photo'

              return (
                <>
                  <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 uppercase font-black text-[10px]">
                        {isPhoto ? 'Registro Fotográfico' : 'Vídeo do Evento'}
                      </Badge>
                      <span className="text-[10px] font-bold text-[#F5D77F] bg-[#061020] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                        Visualização Pública
                      </span>
                      {previewMediaModal.created && (
                        <span className="text-[11px] text-slate-300 font-semibold">
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

                  {/* Visualizador de Foto ou Player Embutido de Vídeo (Sem link de download) */}
                  <div className="my-4">
                    <div className="rounded-2xl overflow-hidden bg-[#061020] border border-slate-800 flex items-center justify-center p-4">
                      {/* Video Player Embutido */}
                      {isVideo && (
                        <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                          {getVideoEmbedUrl(previewMediaModal.url) ? (
                            <iframe
                              src={getVideoEmbedUrl(previewMediaModal.url)!}
                              title={previewMediaModal.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : previewMediaModal.file ? (
                            <video
                              src={getFileUrl(
                                'materials',
                                previewMediaModal.id,
                                previewMediaModal.file,
                              )}
                              controls
                              controlsList="nodownload"
                              disablePictureInPicture
                              onContextMenu={(e) => e.preventDefault()}
                              autoPlay
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                              <Video className="w-10 h-10 mb-2 text-[#D4AF37]" />
                              <p className="text-xs">Vídeo em processamento de cobertura.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Photo Viewer (Apenas visualização em alta resolução na tela, sem salvar) */}
                      {isPhoto && (
                        <div className="relative w-full max-h-[65vh] bg-black/50 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
                          {previewMediaModal.file ? (
                            <img
                              src={getFileUrl(
                                'materials',
                                previewMediaModal.id,
                                previewMediaModal.file,
                              )}
                              alt={previewMediaModal.title}
                              onContextMenu={(e) => e.preventDefault()}
                              className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl pointer-events-none"
                            />
                          ) : previewMediaModal.url ? (
                            <img
                              src={previewMediaModal.url}
                              alt={previewMediaModal.title}
                              onContextMenu={(e) => e.preventDefault()}
                              className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl pointer-events-none"
                            />
                          ) : (
                            <div className="p-12 text-center text-slate-400">
                              <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[#D4AF37]" />
                              <p className="text-xs">Registro fotográfico indisponível.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {previewMediaModal.description && (
                    <div className="p-4 bg-[#061020] rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
                      <p className="whitespace-pre-wrap">{previewMediaModal.description}</p>
                    </div>
                  )}

                  {/* Selo de exclusividade no rodapé do modal */}
                  <div className="p-3 rounded-xl bg-[#061020] border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 text-[#F5D77F] font-semibold">
                      <Eye className="w-3.5 h-3.5" />
                      Visualização exclusiva na plataforma
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Downloads e PDFs restritos a membros
                    </span>
                  </div>

                  <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPreviewMediaModal(null)}
                        className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Fechar
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (
                              !window.confirm(
                                `Tem certeza que deseja excluir o material "${previewMediaModal.title}" permanentemente do acervo?`,
                              )
                            ) {
                              return
                            }
                            try {
                              await deleteMaterial(previewMediaModal.id)
                              toast.success('Material excluído com sucesso!')
                              setPreviewMediaModal(null)
                              const updated = await getAllMaterials()
                              setMaterials(updated)
                            } catch (err: any) {
                              toast.error('Erro ao excluir material: ' + (err?.message || 'Falha'))
                            }
                          }}
                          className="bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir Material</span>
                        </Button>
                      )}
                    </div>

                    {user ? (
                      <Link to="/encontros">
                        <Button className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl shadow-md">
                          Ver PDFs e Acervo VIP &rarr;
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/login">
                        <Button className="bg-[#0A1A33] hover:bg-[#122443] border border-[#D4AF37]/50 text-[#F5D77F] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl">
                          <Lock className="w-3.5 h-3.5 mr-1" />
                          Login de Membros
                        </Button>
                      </Link>
                    )}
                  </DialogFooter>
                </>
              )
            })()}
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
          <DialogContent className="max-w-2xl bg-[#0A1A33] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 uppercase font-black text-[10px]">
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
                  {selectedEventModal.pricing === 'pago'
                    ? 'Inscrição Paga'
                    : 'Exclusivo Membros Club'}
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
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[#F5D77F] font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#D4AF37]" /> Data & Horário
                  </p>
                  <p className="text-white font-bold">
                    {formatDateString(selectedEventModal.start_date || selectedEventModal.date)}
                  </p>
                  <p className="text-slate-300">
                    {formatTimeString(selectedEventModal.start_date || selectedEventModal.date)}
                    {selectedEventModal.end_date
                      ? ` até ${formatTimeString(selectedEventModal.end_date)}`
                      : ''}
                  </p>
                </div>

                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[#F5D77F] font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> Local / Transmissão
                  </p>
                  <p className="text-white font-bold">{selectedEventModal.location}</p>
                </div>
              </div>

              {selectedEventModal.speakers && (
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[#F5D77F] font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" /> Palestrantes & Convidados
                  </p>
                  <p className="text-white">{selectedEventModal.speakers}</p>
                </div>
              )}

              {selectedEventModal.description && (
                <div className="p-4 bg-[#061020]/90 rounded-2xl border border-slate-800 text-slate-200 max-h-52 overflow-y-auto leading-relaxed">
                  {selectedEventModal.description.startsWith('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEventModal.description }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedEventModal.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Aviso de exclusividade no modal */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 via-[#F5D77F]/10 to-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#061020] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-[#F5D77F]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-[#F5D77F]">
                  Exclusivo para Membros do Edvanced Business Club
                </p>
                <p className="text-[11px] text-slate-300">
                  Evento fechado e restrito aos membros associados. Não há inscrições abertas para o
                  público externo.
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setSelectedEventModal(null)}
                className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </Button>

              {user ? (
                <Link to={`/encontros?id=${selectedEventModal.id}`}>
                  <Button className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-5 shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Acessar no Portal de Membros</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-5 shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Entrar como Membro</span>
                  </Button>
                </Link>
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
          <DialogContent className="max-w-xl bg-[#0A1A33] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider">
                  Curadoria do EdvancedCast
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                {editingEpisode
                  ? 'Editar Episódio do Podcast'
                  : 'Publicar Novo Episódio do Podcast'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Cadastre o link do vídeo (YouTube, Vimeo ou MP4) e detalhes do episódio para a aba
                pública.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEpisode} className="space-y-4 pt-2 text-xs">
              {/* Título */}
              <div className="space-y-1">
                <Label className="text-[#F5D77F] font-semibold">Título do Episódio *</Label>
                <Input
                  placeholder="Ex: EdvancedCast #03 — Governança e Captação de Recursos"
                  value={castTitle}
                  onChange={(e) => setCastTitle(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-700 text-white rounded-xl"
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
                  className="text-xs bg-[#061020] border-slate-700 text-white rounded-xl"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Insira o link padrão do YouTube ou Vimeo. Ele será reproduzido no player embutido
                  da plataforma.
                </p>
              </div>

              {/* Upload de Capa / Thumbnail Própria */}
              <div className="p-4 rounded-2xl bg-[#061020] border border-slate-800 space-y-3">
                <Label className="text-[#F5D77F] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                    Capa / Thumbnail Própria do Episódio
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG ou WebP</span>
                </Label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Box */}
                  <div className="w-full sm:w-36 h-24 rounded-xl border border-slate-700 bg-[#0A1A33] overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
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
                      <div className="w-full h-full bg-gradient-to-br from-[#0A1A33] to-[#061020] flex flex-col items-center justify-center p-2 text-center">
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
                        className="bg-[#122443] hover:bg-[#1A335E] text-slate-100 border border-slate-700 text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
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

                    <p className="text-[10px] text-slate-400">
                      Envie uma imagem em alta resolução (16:9). Se nenhuma imagem for enviada, será
                      utilizado o padrão visual premium dourado do Club.
                    </p>
                  </div>
                </div>

                {/* Ou URL Externa */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <Label className="text-[11px] text-slate-400">
                    Ou informe uma URL de imagem externa:
                  </Label>
                  <Input
                    placeholder="https://... (opcional)"
                    value={castThumbnailUrl}
                    onChange={(e) => setCastThumbnailUrl(e.target.value)}
                    className="text-xs bg-[#0A1A33] border-slate-700 text-white rounded-xl h-8"
                  />
                </div>
              </div>

              {/* Duração Estimada */}
              <div className="space-y-1">
                <Label className="text-[#F5D77F] font-semibold">Duração Estimada</Label>
                <Input
                  placeholder="Ex: 45 min ou 01h 15m"
                  value={castDuration}
                  onChange={(e) => setCastDuration(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-700 text-white rounded-xl"
                />
              </div>

              {/* Número do Episódio e Data de Publicação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[#F5D77F] font-semibold">Número do Episódio</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 1, 2, 3..."
                    value={castEpNumber}
                    onChange={(e) => setCastEpNumber(e.target.value ? Number(e.target.value) : '')}
                    className="text-xs bg-[#061020] border-slate-700 text-white rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[#F5D77F] font-semibold">Data de Publicação</Label>
                  <Input
                    type="date"
                    value={castPublishedAt}
                    onChange={(e) => setCastPublishedAt(e.target.value)}
                    className="text-xs bg-[#061020] border-slate-700 text-white rounded-xl"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <Label className="text-[#F5D77F] font-semibold">
                  Descrição / Sinopse do Episódio
                </Label>
                <Textarea
                  placeholder="Resumo dos tópicos discutidos, perfil dos convidados e destaques..."
                  value={castDesc}
                  onChange={(e) => setCastDesc(e.target.value)}
                  className="text-xs bg-[#061020] border-slate-700 text-white rounded-xl"
                  rows={4}
                />
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPodcastModal(false)}
                  className="text-xs border-slate-700 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEpisode}
                  className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-5 rounded-xl shadow-md"
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
