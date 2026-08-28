import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Megaphone,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Video,
  ArrowRight,
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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMeetings,
  getAllMaterials,
  getApprovedDisclosures,
  getPendingDisclosures,
  getMemberDisclosures,
} from '@/services/api'
import type { Meeting, Material, Disclosure } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Index() {
  const { user, isAdmin } = useAuth()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [approvedDisclosures, setApprovedDisclosures] = useState<Disclosure[]>([])
  const [myDisclosures, setMyDisclosures] = useState<Disclosure[]>([])
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Selected media preview modal
  const [selectedMedia, setSelectedMedia] = useState<Material | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        const [meets, mats, appDiscs] = await Promise.all([
          getMeetings(),
          getAllMaterials(),
          getApprovedDisclosures(),
        ])
        setMeetings(meets)
        setMaterials(mats)
        setApprovedDisclosures(appDiscs)

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

  const nextMeeting = upcomingOrOngoing || sortedMeetings[0] || null
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
        label: 'Agendado',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: Calendar,
      }
    }
    const start = new Date(startStr)
    const end = meeting.end_date
      ? new Date(meeting.end_date)
      : new Date(start.getTime() + 2.5 * 60 * 60 * 1000)
    if (nowDate < start) {
      return {
        label: 'Próximo Encontro',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: Calendar,
      }
    } else if (nowDate >= start && nowDate <= end) {
      return {
        label: 'Em Andamento',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
        icon: Hourglass,
      }
    } else {
      return {
        label: 'Realizado',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: CalendarCheck2,
      }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3D4E] via-[#0E4C60] to-[#082B38] border border-teal-900/50 text-white p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Edvanced Business Club &bull; Portal do Membro
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Bem-vindo(a), <span className="text-[#D4AF37]">{user?.name || 'Membro VIP'}</span>
            </h1>
            <p className="text-teal-100/90 text-sm md:text-base leading-relaxed">
              Acesse fotos e vídeos em alta resolução dos nossos encontros presenciais, assista aos
              encontros online e divulgue suas oportunidades exclusivas para o ecossistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/divulgacoes/nova">
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold tracking-wider uppercase text-xs px-5 py-6 rounded-xl shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Criar Divulgação
              </Button>
            </Link>
            <Link to="/encontros">
              <Button
                variant="outline"
                className="border-teal-700/60 bg-[#0B3D4E]/60 text-teal-100 hover:bg-[#0E4C60] hover:text-white text-xs font-semibold px-5 py-6 rounded-xl"
              >
                Ver Acervo de Encontros
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Top Stats & Next Meeting Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Meeting Card (2 Cols on LG) */}
        <div className="lg:col-span-2">
          {nextMeeting ? (
            <Card className="h-full border-slate-200/80 shadow-md hover:shadow-lg transition-all bg-white overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="bg-[#0B3D4E] text-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> Encontro em Destaque
                      </span>
                      <Badge className="bg-[#D4AF37] text-slate-950 font-bold uppercase text-[10px]">
                        {nextMeeting.type || 'Presencial'}
                      </Badge>
                      {(() => {
                        const status = getMeetingStatus(nextMeeting)
                        const StatusIcon = status.icon
                        return (
                          <Badge
                            variant="outline"
                            className={`font-bold uppercase text-[10px] flex items-center gap-1 bg-white/10 text-white border-white/20`}
                          >
                            <StatusIcon className="w-3 h-3 text-[#D4AF37]" />
                            {status.label}
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Highlighted Title & Event Name */}
                  <div className="mt-3 space-y-1">
                    <CardTitle className="text-xl md:text-2xl text-white font-black leading-tight tracking-tight">
                      {nextMeeting.title}
                    </CardTitle>
                    {nextMeeting.event_name && (
                      <p className="text-xs md:text-sm font-semibold text-[#F5D77F] flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Evento: {nextMeeting.event_name}</span>
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#997300]">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">
                          Data & Horário (15 min)
                        </p>
                        <p className="font-semibold text-slate-800">
                          {formatDateString(nextMeeting.start_date || nextMeeting.date)} às{' '}
                          {formatTimeString(nextMeeting.start_date || nextMeeting.date)}
                          {nextMeeting.end_date
                            ? ` até ${formatTimeString(nextMeeting.end_date)}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#997300]">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Localização</p>
                        <p
                          className="font-semibold text-slate-800 truncate"
                          title={nextMeeting.location}
                        >
                          {nextMeeting.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {nextMeeting.speakers && (
                    <div className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/50">
                      <span className="font-bold text-amber-900">Palestrantes & Convidados: </span>
                      {nextMeeting.speakers}
                    </div>
                  )}

                  <div
                    className="text-xs text-slate-600 line-clamp-2 prose prose-sm"
                    dangerouslySetInnerHTML={{ __html: nextMeeting.description || '' }}
                  />
                </CardContent>
              </div>

              <div className="px-6 pb-6 pt-0 flex justify-end">
                <Link to={`/encontros?id=${nextMeeting.id}`}>
                  <Button
                    variant="ghost"
                    className="text-xs font-bold text-[#8C6D07] hover:text-[#5E4804] hover:bg-[#D4AF37]/10 p-0"
                  >
                    Acessar detalhes e materiais do encontro &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-8 text-center bg-white border-dashed">
              <div>
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Nenhum encontro agendado no momento</p>
                <p className="text-xs text-slate-400">
                  Em breve novos cronogramas serão adicionados.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Status Widget (Admin or Member) */}
        <div className="space-y-6">
          {/* Admin Queue Widget */}
          {isAdmin && (
            <Card className="border-amber-300/80 bg-gradient-to-br from-amber-500/10 via-amber-50 to-white shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#8C6D07] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Gestão de Divulgações
                  </span>
                  <Badge className="bg-[#D4AF37] text-slate-950 font-bold">Admin</Badge>
                </div>
                <CardTitle className="text-3xl font-extrabold text-slate-900 mt-2">
                  {pendingCount}{' '}
                  <span className="text-sm font-normal text-slate-600">pendente(s)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {pendingCount === 0
                    ? 'Nenhuma solicitação de divulgação aguardando revisão.'
                    : 'Membros enviaram novos eventos/oportunidades que precisam da sua aprovação.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Link to="/admin/aprovacao">
                  <Button className="w-full bg-[#0B3D4E] hover:bg-[#0E4C60] text-white text-xs font-bold uppercase tracking-wider py-2.5">
                    Abrir Fila de Aprovação
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Member Submission Status Widget */}
          <Card className="border-slate-200/80 bg-white shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-[#D4AF37]" /> Minha Última Divulgação
                </span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                {latestMyDisclosure ? latestMyDisclosure.title : 'Nenhuma divulgação cadastrada'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {latestMyDisclosure ? (
                <>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Status Atual:</span>
                    <Badge
                      className={
                        latestMyDisclosure.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : latestMyDisclosure.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                      }
                    >
                      {latestMyDisclosure.status === 'approved' && (
                        <CheckCircle2 className="w-3 h-3 mr-1 inline text-emerald-600" />
                      )}
                      {latestMyDisclosure.status === 'rejected' && (
                        <AlertCircle className="w-3 h-3 mr-1 inline text-rose-600" />
                      )}
                      {latestMyDisclosure.status === 'approved'
                        ? 'Aprovado & Publicado'
                        : latestMyDisclosure.status === 'rejected'
                          ? 'Reprovado'
                          : 'Em Análise'}
                    </Badge>
                  </div>

                  {latestMyDisclosure.status === 'rejected' &&
                    latestMyDisclosure.admin_feedback && (
                      <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs">
                        <p className="font-bold">Motivo do Admin:</p>
                        <p className="mt-0.5 italic">"{latestMyDisclosure.admin_feedback}"</p>
                      </div>
                    )}

                  <Link
                    to="/divulgacoes"
                    className="block text-right text-[#8C6D07] font-semibold hover:underline"
                  >
                    Ver histórico completo &rarr;
                  </Link>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-500">
                    Você pode divulgar eventos, rodadas e produtos exclusivos para os empresários do
                    Club.
                  </p>
                  <Link to="/divulgacoes/nova">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-semibold border-slate-200"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Enviar primeira divulgação
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Recent Materials Library Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#D4AF37]" /> Materiais & Mídias Recentes
            </h2>
            <p className="text-xs text-slate-500">
              Fotos dos encontros presenciais, vídeos dos encontros online e relatórios executivos
            </p>
          </div>
          <Link to="/encontros">
            <Button variant="outline" size="sm" className="text-xs font-semibold border-slate-300">
              Ver Todos os Materiais &rarr;
            </Button>
          </Link>
        </div>

        {materials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {materials.slice(0, 4).map((item) => {
              const isVideo = item.type === 'video'
              const isDoc = item.type === 'document'
              const isPhoto = item.type === 'photo'

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-[#082B38] overflow-hidden flex items-center justify-center">
                    {isPhoto && item.url ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : isVideo ? (
                      <div className="w-full h-full bg-[#051C24] flex flex-col items-center justify-center text-white relative">
                        <img
                          src="https://img.usecurling.com/p/600/400?q=executive%20boardroom%20conference&color=teal"
                          alt="Video thumbnail"
                          className="w-full h-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Video className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-600">
                        <FileText className="w-12 h-12 text-[#997300]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                          Documento PDF / Slides
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      <Badge
                        className={`text-[9px] uppercase font-bold tracking-wider ${
                          isVideo
                            ? 'bg-rose-600 text-white'
                            : isDoc
                              ? 'bg-blue-600 text-white'
                              : 'bg-[#D4AF37] text-slate-950'
                        }`}
                      >
                        {isVideo ? 'Vídeo' : isDoc ? 'Documento' : 'Foto'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight group-hover:text-[#8C6D07] transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Clique para visualizar</span>
                      <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#8C6D07]" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-xs">Nenhum material carregado ainda.</p>
          </div>
        )}
      </div>

      {/* 4. Club Approved Disclosures Feed */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#D4AF37]" /> Oportunidades & Divulgações dos
              Membros
            </h2>
            <p className="text-xs text-slate-500">
              Eventos exclusivos, investimentos e parcerias chanceladas pela diretoria
            </p>
          </div>
          <Link to="/divulgacoes">
            <Button variant="outline" size="sm" className="text-xs font-semibold border-slate-300">
              Ver Todas &rarr;
            </Button>
          </Link>
        </div>

        {approvedDisclosures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedDisclosures.slice(0, 3).map((disc) => (
              <Card
                key={disc.id}
                className="border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D07] bg-[#D4AF37]/15 px-2 py-0.5 rounded">
                        Divulgação Aprovada
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">
                        {disc.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 text-xs text-slate-600">
                    <p className="line-clamp-3 leading-relaxed">{disc.content}</p>

                    {(disc.event_date || disc.event_location) && (
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-[11px] border border-slate-100">
                        {disc.event_date && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-[#8C6D07]" />
                            <span>{formatDateString(disc.event_date)}</span>
                          </div>
                        )}
                        {disc.event_location && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-[#8C6D07]" />
                            <span className="truncate">{disc.event_location}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between">
                  {disc.contact_link ? (
                    <a
                      href={disc.contact_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button className="w-full bg-[#0B3D4E] hover:bg-[#0E4C60] text-white text-xs font-semibold py-2">
                        Acessar Link / Inscrição
                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </a>
                  ) : (
                    <Link to="/divulgacoes" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold border-slate-200"
                      >
                        Ver Mais Detalhes
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-xs">
              Nenhuma divulgação de membros ativa no momento.
            </p>
          </div>
        )}
      </div>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
          <DialogContent className="max-w-3xl bg-white p-6 shadow-2xl rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-bold text-[10px]">
                  {selectedMedia.type}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {selectedMedia.title}
              </DialogTitle>
              {selectedMedia.description && (
                <DialogDescription className="text-xs text-slate-600">
                  {selectedMedia.description}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="my-4 rounded-xl overflow-hidden bg-[#082B38] flex items-center justify-center min-h-[300px]">
              {selectedMedia.type === 'photo' && selectedMedia.url && (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  className="max-h-[500px] w-auto object-contain"
                />
              )}
              {selectedMedia.type === 'video' && (
                <div className="p-8 text-center text-white space-y-4">
                  <Video className="w-16 h-16 text-[#D4AF37] mx-auto animate-pulse" />
                  <p className="text-sm font-semibold">Vídeo / Gravação na Íntegra</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    A reprodução de vídeo em alta definição está pronta para streaming.
                  </p>
                  {selectedMedia.url && (
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button className="bg-[#D4AF37] text-slate-950 font-bold hover:bg-[#F5D77F] text-xs">
                        Abrir Vídeo Completo <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </a>
                  )}
                </div>
              )}
              {selectedMedia.type === 'document' && (
                <div className="p-8 text-center text-white space-y-4">
                  <FileText className="w-16 h-16 text-[#D4AF37] mx-auto" />
                  <p className="text-sm font-semibold">Documento Executivo (PDF / Slides)</p>
                  {selectedMedia.url && (
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button className="bg-[#D4AF37] text-slate-950 font-bold hover:bg-[#F5D77F] text-xs">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar Documento
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedMedia(null)} className="text-xs">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
