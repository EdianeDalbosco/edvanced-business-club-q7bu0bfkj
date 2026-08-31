import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Megaphone,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  Play,
  Info,
  ExternalLink,
  PlusCircle,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Tag,
  Hourglass,
  CalendarCheck2,
  ChevronRight,
  UserCheck,
  Building2,
  Mail,
  Instagram,
  Phone,
  Flame,
  Award,
  ArrowUpRight,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMeetings,
  getAllMaterials,
  getApprovedDisclosures,
  getPendingDisclosures,
  getMemberDisclosures,
  getMembers,
  deleteMaterial,
  getFileUrl,
} from '@/services/api'
import { toast } from 'sonner'
import { detectMaterialKind } from '@/lib/utils'
import PdfDocumentViewer from '@/components/PdfDocumentViewer'
import PdfThumbnail from '@/components/PdfThumbnail'
import type { Meeting, Material, Disclosure, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import NetflixShelf from '@/components/NetflixShelf'

export default function Index() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [approvedDisclosures, setApprovedDisclosures] = useState<Disclosure[]>([])
  const [myDisclosures, setMyDisclosures] = useState<Disclosure[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Selected media preview modal
  const [selectedMedia, setSelectedMedia] = useState<Material | null>(null)

  // Selected meeting detail preview modal (para ver mais informações sem sair do fluxo)
  const [selectedMeetingModal, setSelectedMeetingModal] = useState<Meeting | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        const [meets, mats, appDiscs, memberList] = await Promise.all([
          getMeetings(),
          getAllMaterials(),
          getApprovedDisclosures(),
          getMembers().catch(() => [] as User[]),
        ])
        setMeetings(meets)
        setMaterials(mats)
        setApprovedDisclosures(appDiscs)
        // Filter out suspended members from default public/dashboard view for regular members
        const visibleMembers = isAdmin
          ? memberList
          : memberList.filter((m) => m.status !== 'suspended')
        setMembers(visibleMembers)

        if (user) {
          const myItems = await getMemberDisclosures(user.id)
          setMyDisclosures(myItems)
        }

        if (isAdmin) {
          const p = await getPendingDisclosures()
          setPendingCount(p.length)
        }
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user, isAdmin])

  // Sort meetings to find upcoming first, then fallback to newest
  const sortedMeetings = [...meetings].sort((a, b) => {
    const timeA = new Date(a.start_date || a.date).getTime()
    const timeB = new Date(b.start_date || b.date).getTime()
    return timeB - timeA
  })

  // Prioritize upcoming or ongoing meeting, else most recent
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

  const heroMeeting = upcomingOrOngoing || sortedMeetings[0] || null
  const latestMyDisclosure = myDisclosures[0] || null

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

  const getMeetingStatus = (meeting: Meeting) => {
    const nowDate = new Date()
    const startStr = meeting.start_date || meeting.date
    if (!startStr) {
      return {
        key: 'scheduled',
        label: 'Agendado',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        cardClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: Calendar,
      }
    }
    const start = new Date(startStr)
    const end = meeting.end_date
      ? new Date(meeting.end_date)
      : new Date(start.getTime() + 2.5 * 60 * 60 * 1000)
    if (nowDate < start) {
      return {
        key: 'scheduled',
        label: 'Próximo Encontro',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        cardClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: Calendar,
      }
    } else if (nowDate >= start && nowDate <= end) {
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

  const getInitials = (name?: string) => {
    if (!name) return 'MB'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleDeleteMaterial = async (material: Material, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o material "${material.title}" permanentemente do acervo?`,
      )
    ) {
      return
    }
    try {
      await deleteMaterial(material.id)
      toast.success('Material excluído com sucesso do acervo!')
      if (selectedMedia?.id === material.id) {
        setSelectedMedia(null)
      }
      // Refresh list
      const mats = await getAllMaterials()
      setMaterials(mats)
    } catch (err: any) {
      toast.error('Erro ao excluir material: ' + (err?.message || 'Falha na requisição'))
    }
  }

  // Hero background image based on meeting type or curated premium photos
  const getMeetingHeroCover = (meeting?: Meeting | null) => {
    if (!meeting) {
      return ''
    }
    if (meeting.cover_image) {
      return getFileUrl('meetings', meeting.id, meeting.cover_image)
    }
    return ''
  }

  const getMaterialCover = (mat: Material) => {
    if (mat.type === 'photo' && mat.url) return mat.url
    if (mat.type === 'video') {
      return 'https://img.usecurling.com/p/600/380?q=executive%20keynote%20stage&color=teal'
    }
    return 'https://img.usecurling.com/p/600/380?q=corporate%20report%20document&color=dark'
  }

  return (
    <div className="space-y-10 -mt-2 sm:-mt-4 pb-12 animate-fade-in text-slate-100">
      {/* =========================================================================
          1. NETFLIX-STYLE HERO BANNER (Capa em Destaque)
         ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-[#061020] border border-[#D4AF37]/25 shadow-2xl min-h-[440px] md:min-h-[520px] flex flex-col justify-end">
        {/* Background Cover Image with Cinematic Gradients & Premium Fallback */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#0A1A33] via-[#061020] to-[#122443]">
          {getMeetingHeroCover(heroMeeting) ? (
            <img
              src={getMeetingHeroCover(heroMeeting)}
              alt={heroMeeting?.title || 'Edvanced Business Club'}
              className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 contrast-110 transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full relative flex items-center justify-center">
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
          {/* Multi-layer Netflix-style vignette: Top subtle, bottom deep darkness, left dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33] via-[#0A1A33]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#061020] via-[#061020]/85 to-transparent w-full md:w-3/4" />
          {/* Golden Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Hero Content Overlaid */}
        <div className="relative z-10 p-6 md:p-12 max-w-3xl space-y-4 md:space-y-6">
          {/* Top Pill / Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37] text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Destaque Principal</span>
            </div>

            {heroMeeting && (
              <>
                <Badge className="bg-white/15 backdrop-blur-md text-white border-white/25 font-bold uppercase text-[10px] tracking-wider">
                  {heroMeeting.type || 'Presencial'}
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
              &bull; Portal do Membro VIP
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
                Edvanced Business Club
              </h1>
              <p className="text-slate-200 text-sm md:text-base">
                O ecossistema exclusivo para líderes, empresários e investidores de alto impacto.
              </p>
            </div>
          )}

          {/* Meeting Metadata (Data, Horário, Local) */}
          {heroMeeting && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-slate-200">
              <div className="flex items-center gap-2 bg-[#061020]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
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

          {/* Action Buttons (Estilo Netflix: Assistir/Acessar + Mais Informações) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {heroMeeting ? (
              <>
                <Link to={`/encontros?id=${heroMeeting.id}`}>
                  <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider px-6 py-6 rounded-xl shadow-xl shadow-[#D4AF37]/30 flex items-center gap-2 group transition-all hover:scale-105">
                    <Play className="w-4 h-4 fill-current" />
                    <span>Acessar Encontro & Materiais</span>
                  </Button>
                </Link>

                <Button
                  onClick={() => setSelectedMeetingModal(heroMeeting)}
                  variant="outline"
                  className="border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md text-xs md:text-sm font-bold px-5 py-6 rounded-xl transition-all"
                >
                  <Info className="w-4 h-4 mr-1.5 text-slate-200" />
                  Mais Detalhes
                </Button>
              </>
            ) : (
              <Link to="/encontros">
                <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider px-6 py-6 rounded-xl shadow-xl flex items-center gap-2">
                  Ver Acervo Completo
                </Button>
              </Link>
            )}

            <Link to="/divulgacoes/nova">
              <Button
                variant="ghost"
                className="text-slate-200 hover:text-white hover:bg-white/10 text-xs font-semibold px-4 py-6 rounded-xl"
              >
                <Megaphone className="w-4 h-4 mr-1.5 text-[#D4AF37]" />
                Criar Divulgação
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. ADMIN & MEMBER STATUS BANNERS (Se houver fila de aprovação ou submissão)
         ========================================================================= */}
      {isAdmin && pendingCount > 0 && (
        <div className="rounded-2xl p-4 md:p-5 bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-[#0A1A33] border border-amber-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm md:text-base">
                  Fila de Aprovação de Divulgações
                </h3>
                <Badge className="bg-rose-500 text-white font-bold text-[10px] animate-pulse">
                  {pendingCount} Pendente{pendingCount > 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Membros do club submeteram oportunidades que aguardam revisão da diretoria.
              </p>
            </div>
          </div>

          <Link to="/admin/aprovacao" className="flex-shrink-0">
            <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md">
              Revisar Agora <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Status da Última Divulgação do Usuário (se houver) */}
      {latestMyDisclosure && (
        <div className="rounded-2xl p-4 bg-[#0A1A33] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] flex-shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5D77F]">
                  Sua Última Divulgação:
                </span>
                <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {latestMyDisclosure.title}
                </span>
                <Badge
                  className={
                    latestMyDisclosure.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : latestMyDisclosure.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }
                >
                  {latestMyDisclosure.status === 'approved' && (
                    <CheckCircle2 className="w-3 h-3 mr-1 inline text-emerald-400" />
                  )}
                  {latestMyDisclosure.status === 'rejected' && (
                    <AlertCircle className="w-3 h-3 mr-1 inline text-rose-400" />
                  )}
                  {latestMyDisclosure.status === 'approved'
                    ? 'Aprovado & Publicado'
                    : latestMyDisclosure.status === 'rejected'
                      ? 'Reprovado'
                      : 'Em Análise'}
                </Badge>
              </div>
              {latestMyDisclosure.status === 'rejected' && latestMyDisclosure.admin_feedback && (
                <p className="text-[11px] text-rose-300 mt-1 italic line-clamp-1">
                  Parecer: "{latestMyDisclosure.admin_feedback}"
                </p>
              )}
            </div>
          </div>

          <Link
            to="/divulgacoes"
            className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <span>Ver minhas divulgações</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* =========================================================================
          3. PRATELEIRA 1: CATÁLOGO DE ENCONTROS & EVENTOS (Estilo Netflix)
         ========================================================================= */}
      <NetflixShelf
        title="Próximos & Encontros Oficiais"
        subtitle="Cronograma executivo de imersões, masterminds e webinars VIP"
        icon={Calendar}
        badge={`${meetings.length} encontros`}
        action={{
          label: 'Ver todos',
          href: '/encontros',
        }}
      >
        {meetings.length > 0 ? (
          meetings.map((meeting) => {
            const status = getMeetingStatus(meeting)
            const StatusIcon = status.icon
            const isHero = heroMeeting?.id === meeting.id

            return (
              <div
                key={meeting.id}
                onClick={() => navigate(`/encontros?id=${meeting.id}`)}
                className="group relative flex-shrink-0 w-72 sm:w-80 cursor-pointer rounded-2xl overflow-hidden bg-[#0A1A33] border border-slate-800 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                {/* Card Media Preview with Fallback */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#061020]">
                  {getMeetingHeroCover(meeting) ? (
                    <img
                      src={getMeetingHeroCover(meeting)}
                      alt={meeting.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#122443] via-[#0A1A33] to-[#061020] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#D4AF37]/20 rounded-full blur-xl pointer-events-none" />
                      <Sparkles className="w-8 h-8 text-[#D4AF37] mb-1 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#F5D77F] line-clamp-1">
                        {meeting.event_name || 'Business Club'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33] via-transparent to-black/40" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#D4AF37] text-slate-950 tracking-wider shadow">
                      {meeting.type || 'Presencial'}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1 backdrop-blur-md ${status.cardClass}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Play / Access Icon Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Date Overlay */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-200">
                    <span className="font-semibold text-[#F5D77F]">
                      {formatShortDate(meeting.start_date || meeting.date)}
                    </span>
                    <span>{formatTimeString(meeting.start_date || meeting.date)}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {meeting.event_name && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] line-clamp-1 flex items-center gap-1 mb-1">
                        <Tag className="w-3 h-3 flex-shrink-0" />
                        <span>{meeting.event_name}</span>
                      </p>
                    )}
                    <h3 className="font-black text-sm text-white group-hover:text-[#F5D77F] transition-colors line-clamp-2 leading-snug">
                      {meeting.title}
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate" title={meeting.location}>
                        {meeting.location}
                      </span>
                    </div>

                    {meeting.speakers && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                        <Users className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <span className="truncate" title={meeting.speakers}>
                          {meeting.speakers}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="w-full p-8 text-center bg-[#0A1A33] rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">Nenhum encontro agendado.</p>
          </div>
        )}
      </NetflixShelf>

      {/* =========================================================================
          4. PRATELEIRA 2: MATERIAIS & MÍDIAS RECENTES (Vídeos, Fotos e PDFs)
         ========================================================================= */}
      <NetflixShelf
        title="Materiais & Mídias em Alta"
        subtitle="Fotos em alta resolução, gravações na íntegra e apresentações em PDF"
        icon={ImageIcon}
        badge={`${materials.length} itens`}
        action={{
          label: 'Ver acervo',
          href: '/encontros',
        }}
      >
        {materials.length > 0 ? (
          materials.map((item) => {
            const kind = detectMaterialKind({
              file: item.file,
              url: item.url,
              title: item.title,
              type: item.type,
            })
            const isVideo = kind.subtype === 'video'
            const isPhoto = kind.subtype === 'photo'
            const isExcel = kind.subtype === 'excel'
            const isPdf = kind.subtype === 'pdf'
            const isPpt = kind.subtype === 'powerpoint'
            const fileUrl = item.file ? getFileUrl('materials', item.id, item.file) : item.url

            return (
              <div
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className="group relative flex-shrink-0 w-64 sm:w-72 cursor-pointer rounded-2xl overflow-hidden bg-[#0A1A33] border border-slate-800 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                {/* Media Poster / Thumbnail */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#061020] flex items-center justify-center">
                  {isPhoto && fileUrl ? (
                    <img
                      src={fileUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                  ) : isVideo ? (
                    <>
                      <img
                        src="https://img.usecurling.com/p/600/380?q=executive%20boardroom%20conference&color=navy"
                        alt="Video Cover"
                        className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-115 transition-transform duration-300">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : isPdf && fileUrl ? (
                    <PdfThumbnail
                      url={fileUrl}
                      title={item.title}
                      showBadge={false}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#122443] to-[#061020] flex flex-col items-center justify-center text-slate-200 p-4 text-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${
                          isExcel
                            ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                            : isPpt
                              ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                              : 'bg-blue-500/20 border border-blue-400/40 text-blue-300'
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
                          : isPpt
                            ? 'Apresentação em Slides'
                            : 'Documento Executivo'}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A33] via-transparent to-black/30 pointer-events-none" />

                  {/* Badge de tipo */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <Badge
                      className={`text-[9px] uppercase font-bold tracking-wider ${
                        isVideo
                          ? 'bg-rose-600 text-white'
                          : isExcel
                            ? 'bg-emerald-600 text-white'
                            : isPpt
                              ? 'bg-amber-600 text-slate-950'
                              : isPhoto
                                ? 'bg-[#D4AF37] text-slate-950'
                                : isPdf
                                  ? 'bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black'
                                  : 'bg-blue-600 text-white'
                      }`}
                    >
                      {kind.label}
                    </Badge>
                  </div>

                  {/* Botão de Excluir exclusivo do Administrador */}
                  {isAdmin && (
                    <button
                      type="button"
                      title="Excluir Material (Administrador)"
                      onClick={(e) => handleDeleteMaterial(item, e)}
                      className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 flex items-center justify-center transition-colors shadow-md"
                    >
                      <AlertCircle className="w-3.5 h-3.5 hidden" />
                      <span className="text-[11px] font-bold">&times;</span>
                    </button>
                  )}

                  <div className="absolute bottom-2 right-2 z-10 text-[10px] text-slate-300 flex items-center gap-1 bg-[#061020]/80 px-2 py-0.5 rounded-md backdrop-blur-sm pointer-events-none">
                    <Eye className="w-3 h-3 text-[#D4AF37]" />
                    <span>{isPdf ? 'Ler Todas as Páginas' : 'Ver'}</span>
                  </div>
                </div>
                {/* Body */}
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
                    <span className="font-medium">Edvanced Media</span>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteMaterial(item, e)}
                          className="text-rose-400 hover:text-rose-300 font-semibold hover:underline"
                        >
                          Excluir
                        </button>
                      )}
                      <span className="text-[#D4AF37] font-semibold group-hover:translate-x-0.5 transition-transform">
                        {isPdf ? 'Ler PDF &rarr;' : 'Abrir &rarr;'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="w-full p-8 text-center bg-[#0A1A33] rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">Nenhum material cadastrado.</p>
          </div>
        )}
      </NetflixShelf>

      {/* =========================================================================
          5. PRATELEIRA 3: OPORTUNIDADES & DIVULGAÇÕES DOS MEMBROS
         ========================================================================= */}
      <NetflixShelf
        title="Oportunidades & Divulgações dos Membros"
        subtitle="Eventos parceiros, rodadas de investimento e novidades aprovadas"
        icon={Megaphone}
        badge={`${approvedDisclosures.length} publicadas`}
        action={{
          label: 'Ver todas',
          href: '/divulgacoes',
        }}
      >
        {approvedDisclosures.length > 0 ? (
          approvedDisclosures.map((disc) => (
            <div
              key={disc.id}
              className="group relative flex-shrink-0 w-72 sm:w-80 rounded-2xl overflow-hidden bg-[#0A1A33] border border-slate-800 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-950 bg-[#D4AF37] px-2 py-0.5 rounded shadow-sm">
                    Aprovado
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium">
                    {formatShortDate(disc.created)}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-white group-hover:text-[#F5D77F] transition-colors line-clamp-2 leading-snug">
                  {disc.title}
                </h3>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {disc.content}
                </p>

                {(disc.event_date || disc.event_location) && (
                  <div className="p-2.5 bg-[#061020]/80 rounded-xl space-y-1 text-[11px] border border-slate-800">
                    {disc.event_date && (
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <span>{formatDateString(disc.event_date)}</span>
                      </div>
                    )}
                    {disc.event_location && (
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <span className="truncate">{disc.event_location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 pt-0">
                {disc.contact_link ? (
                  <a
                    href={disc.contact_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button className="w-full bg-[#061020] hover:bg-[#D4AF37] hover:text-slate-950 text-white border border-[#D4AF37]/40 text-xs font-bold py-2 rounded-xl transition-all">
                      <span>Acessar Link</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </a>
                ) : (
                  <Link to="/divulgacoes" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-semibold border-slate-700 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl"
                    >
                      Ver Detalhes
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="w-full p-8 text-center bg-[#0A1A33] rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">Nenhuma divulgação ativa no mural no momento.</p>
          </div>
        )}
      </NetflixShelf>

      {/* =========================================================================
          6. PRATELEIRA 4: DIRETÓRIO DE MEMBROS & LÍDERES
         ========================================================================= */}
      {members.length > 0 && (
        <NetflixShelf
          title="Líderes & Diretório de Membros"
          subtitle="Fundadores, conselheiros e empresários do ecossistema VIP"
          icon={Users}
          badge={`${members.length} membros`}
          action={{
            label: 'Ver todos os membros',
            href: '/membros',
          }}
        >
          {members.map((member) => {
            const isMemberAdmin =
              member.role === 'admin' || member.email === 'edianedalbosco@gmail.com'

            return (
              <div
                key={member.id}
                onClick={() => navigate('/membros')}
                className="group relative flex-shrink-0 w-60 sm:w-64 cursor-pointer rounded-2xl overflow-hidden bg-[#0A1A33] border border-slate-800 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1.5 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="w-20 h-20 ring-2 ring-[#D4AF37]/60 group-hover:scale-105 transition-transform">
                    {member.avatar ? (
                      <AvatarImage
                        src={getFileUrl('users', member.id, member.avatar)}
                        alt={member.name}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#8C6D07] text-slate-950 font-black text-lg">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-[#F5D77F] transition-colors truncate max-w-[190px]">
                      {member.name}
                    </h4>

                    {isMemberAdmin ? (
                      <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-slate-950">
                        Fundadora & Master
                      </span>
                    ) : (
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        Membro VIP
                      </span>
                    )}

                    {member.company && (
                      <p className="text-xs text-[#F5D77F] font-semibold mt-1 truncate max-w-[190px]">
                        {member.company}
                      </p>
                    )}
                  </div>

                  {member.bio && (
                    <p className="text-[11px] text-slate-300 line-clamp-2 italic leading-tight">
                      "{member.bio}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-2 text-xs">
                  <span className="text-[#D4AF37] font-semibold group-hover:underline text-[11px]">
                    Ver perfil no diretório &rarr;
                  </span>
                </div>
              </div>
            )
          })}
        </NetflixShelf>
      )}

      {/* =========================================================================
          MODAIS DE PREVIEW
         ========================================================================= */}

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
          <DialogContent
            className={`bg-[#0A1A33] text-white border-slate-800 p-6 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto transition-all ${(() => {
              const k = detectMaterialKind({
                file: selectedMedia.file,
                url: selectedMedia.url,
                title: selectedMedia.title,
                type: selectedMedia.type,
              })
              return k.subtype === 'pdf' ? 'max-w-5xl' : 'max-w-3xl'
            })()}`}
          >
            {(() => {
              const fileUrl = selectedMedia.file
                ? getFileUrl('materials', selectedMedia.id, selectedMedia.file)
                : selectedMedia.url
              const kind = detectMaterialKind({
                file: selectedMedia.file,
                url: selectedMedia.url,
                title: selectedMedia.title,
                type: selectedMedia.type,
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
                      {selectedMedia.title}
                    </DialogTitle>
                    {selectedMedia.description && (
                      <DialogDescription className="text-xs text-slate-300">
                        {selectedMedia.description}
                      </DialogDescription>
                    )}
                  </DialogHeader>

                  <div className="my-4">
                    {/* Visualizador Completo de PDF com navegação inline */}
                    {isPdf && fileUrl ? (
                      <PdfDocumentViewer
                        url={fileUrl}
                        title={selectedMedia.title}
                        fileName={selectedMedia.file}
                        className="w-full"
                      />
                    ) : (
                      <div className="rounded-2xl overflow-hidden bg-[#061020] flex items-center justify-center min-h-[300px] border border-slate-800 p-4">
                        {/* Visualizador de Foto */}
                        {isPhoto && fileUrl && (
                          <img
                            src={fileUrl}
                            alt={selectedMedia.title}
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
                                Arquivo de planilha executiva disponível para download e
                                visualização no seu editor de planilhas.
                              </p>
                            </div>
                            <div className="pt-2">
                              <a
                                href={fileUrl}
                                download={selectedMedia.file || selectedMedia.title}
                                className="inline-block"
                              >
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20">
                                  <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar Planilha Excel
                                </Button>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Visualizador de PowerPoint */}
                        {isPpt && fileUrl && (
                          <div className="p-8 text-center text-white space-y-4">
                            <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                            <div>
                              <p className="text-sm font-bold">
                                Apresentação em Slides (.pptx / .ppt)
                              </p>
                              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                                Arquivo de apresentação executiva disponível para download e uso em
                                reuniões.
                              </p>
                            </div>
                            <div className="pt-2">
                              <a
                                href={fileUrl}
                                download={selectedMedia.file || selectedMedia.title}
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
                                Clique abaixo para acessar ou baixar o arquivo.
                              </p>
                            </div>
                            <a
                              href={fileUrl}
                              download={selectedMedia.file || selectedMedia.title}
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
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMedia(null)}
                        className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                      >
                        Fechar
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMaterial(selectedMedia)}
                          className="bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5"
                        >
                          <span>Excluir Material</span>
                        </Button>
                      )}
                    </div>

                    {fileUrl && (
                      <a
                        href={fileUrl}
                        download={selectedMedia.file || selectedMedia.title}
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

      {/* Meeting Details Modal (para visualização rápida) */}
      {selectedMeetingModal && (
        <Dialog
          open={!!selectedMeetingModal}
          onOpenChange={(open) => !open && setSelectedMeetingModal(null)}
        >
          <DialogContent className="max-w-2xl bg-[#0A1A33] text-white border-slate-800 p-6 md:p-8 shadow-2xl rounded-3xl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-bold text-[10px]">
                  {selectedMeetingModal.type || 'Presencial'}
                </Badge>
                {(() => {
                  const status = getMeetingStatus(selectedMeetingModal)
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
                {selectedMeetingModal.title}
              </DialogTitle>
              {selectedMeetingModal.event_name && (
                <p className="text-xs font-bold text-[#F5D77F] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Evento: {selectedMeetingModal.event_name}</span>
                </p>
              )}
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" /> Data & Horário
                  </p>
                  <p className="text-white font-bold">
                    {formatDateString(selectedMeetingModal.start_date || selectedMeetingModal.date)}
                  </p>
                  <p className="text-slate-300">
                    {formatTimeString(selectedMeetingModal.start_date || selectedMeetingModal.date)}
                    {selectedMeetingModal.end_date
                      ? ` às ${formatTimeString(selectedMeetingModal.end_date)}`
                      : ''}
                  </p>
                </div>

                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> Localização
                  </p>
                  <p className="text-white font-bold">{selectedMeetingModal.location}</p>
                </div>
              </div>

              {selectedMeetingModal.speakers && (
                <div className="p-3.5 bg-[#061020] rounded-2xl border border-slate-800 text-xs space-y-1">
                  <p className="text-blue-200 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" /> Palestrantes & Convidados
                  </p>
                  <p className="text-white">{selectedMeetingModal.speakers}</p>
                </div>
              )}

              {selectedMeetingModal.description && (
                <div className="p-4 bg-[#061020]/80 rounded-2xl border border-slate-800 text-xs text-slate-200 max-h-48 overflow-y-auto leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: selectedMeetingModal.description }} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setSelectedMeetingModal(null)}
                className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Fechar
              </Button>

              <Link to={`/encontros?id=${selectedMeetingModal.id}`}>
                <Button className="bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 font-bold text-xs uppercase tracking-wider">
                  Ir para página do Encontro &rarr;
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
