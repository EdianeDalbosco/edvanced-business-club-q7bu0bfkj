import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Megaphone,
  PlusCircle,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Building,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import { getMemberDisclosures, getApprovedDisclosures } from '@/services/api'
import type { Disclosure } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Disclosures() {
  const { user } = useAuth()
  const [myDisclosures, setMyDisclosures] = useState<Disclosure[]>([])
  const [allApprovedDisclosures, setAllApprovedDisclosures] = useState<Disclosure[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [approved, mine] = await Promise.all([
        getApprovedDisclosures(),
        user ? getMemberDisclosures(user.id) : Promise.resolve([]),
      ])
      setAllApprovedDisclosures(approved)
      setMyDisclosures(mine)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  // Realtime updates for live status changes
  useRealtime<Disclosure>(
    'disclosures',
    () => {
      loadData()
    },
    !!user,
  )

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const renderStatusBadge = (status: string, feedback?: string) => {
    if (status === 'approved') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold uppercase text-[10px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovado
        </Badge>
      )
    }
    if (status === 'rejected') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold uppercase text-[10px] flex items-center gap-1 cursor-pointer">
                <AlertCircle className="w-3 h-3 text-rose-600" /> Reprovado
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-slate-900 text-white p-3 text-xs">
              <p className="font-bold text-rose-400">Motivo da recusa:</p>
              <p className="mt-1">
                {feedback || 'Entre em contato com a diretoria para mais detalhes.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold uppercase text-[10px] flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Em Análise
      </Badge>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#8C6D07] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Ecossistema & Parcerias
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Divulgações de Eventos & Oportunidades
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Divulgue seus eventos, rodadas e produtos exclusivos para os empresários do club ou
            acompanhe o status de aprovação de suas submissões.
          </p>
        </div>

        <Link to="/divulgacoes/nova">
          <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold uppercase tracking-wider text-xs px-5 py-6 rounded-2xl shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Cadastrar Nova Divulgação
          </Button>
        </Link>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="mine" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-6">
          <TabsTrigger
            value="mine"
            className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-xl px-4 py-2"
          >
            Minhas Divulgações ({myDisclosures.length})
          </TabsTrigger>
          <TabsTrigger
            value="feed"
            className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-xl px-4 py-2"
          >
            Mural do Club ({allApprovedDisclosures.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MINHAS DIVULGAÇÕES (Member History) */}
        <TabsContent value="mine" className="space-y-4">
          {myDisclosures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDisclosures.map((item) => (
                <Card
                  key={item.id}
                  className="border-slate-200/80 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          Enviado em {formatDateString(item.created)}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex-shrink-0">
                        {renderStatusBadge(item.status, item.admin_feedback)}
                      </div>
                    </div>

                    <div className="p-5 space-y-4 text-xs text-slate-600">
                      <p className="leading-relaxed line-clamp-4">{item.content}</p>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold text-slate-700 bg-slate-100"
                        >
                          {item.format || 'Presencial'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold ${
                            item.pricing === 'pago'
                              ? 'text-amber-800 border-amber-300 bg-amber-50'
                              : 'text-emerald-800 border-emerald-300 bg-emerald-50'
                          }`}
                        >
                          {item.pricing === 'pago' ? 'Pago' : 'Gratuito'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold text-slate-700 bg-slate-100"
                        >
                          {item.format || 'Presencial'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold ${
                            item.pricing === 'pago'
                              ? 'text-amber-800 border-amber-300 bg-amber-50'
                              : 'text-emerald-800 border-emerald-300 bg-emerald-50'
                          }`}
                        >
                          {item.pricing === 'pago' ? 'Pago' : 'Gratuito'}
                        </Badge>
                      </div>

                      {(item.event_date || item.event_location) && (
                        <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-[11px] border border-slate-100">
                          {item.event_date && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-[#8C6D07]" />
                              <span>{formatDateString(item.event_date)}</span>
                            </div>
                          )}
                          {item.event_location && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-[#8C6D07]" />
                              <span className="truncate">{item.event_location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Feedback Box for Rejected / Notes */}
                      {item.admin_feedback && (
                        <div
                          className={`p-3.5 rounded-2xl text-xs space-y-1 border ${
                            item.status === 'rejected'
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}
                        >
                          <p className="font-bold flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" /> Parecer da Diretoria:
                          </p>
                          <p className="italic text-[11px] leading-relaxed">
                            "{item.admin_feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    {item.contact_link && (
                      <a
                        href={item.contact_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block"
                      >
                        <Button
                          variant="outline"
                          className="w-full text-xs font-semibold border-slate-200"
                        >
                          Acessar Link Externo <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Você ainda não cadastrou divulgações
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Tem um evento corporativo, rodada de investimento ou benefício especial para os
                  empresários do Club?
                </p>
              </div>
              <Link to="/divulgacoes/nova">
                <Button className="bg-[#D4AF37] hover:bg-[#B89324] text-slate-950 font-bold text-xs uppercase tracking-wider">
                  <PlusCircle className="w-4 h-4 mr-1.5" /> Criar Minha Primeira Divulgação
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: MURAL DO CLUB (All Approved Disclosures) */}
        <TabsContent value="feed" className="space-y-4">
          {allApprovedDisclosures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allApprovedDisclosures.map((item) => (
                <Card
                  key={item.id}
                  className="border-slate-200/80 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D07] bg-[#D4AF37]/15 px-2 py-0.5 rounded">
                          Aprovado pela Diretoria
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateString(item.created)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <div className="p-5 space-y-3 text-xs text-slate-600">
                      <p className="leading-relaxed line-clamp-4">{item.content}</p>

                      {(item.event_date || item.event_location) && (
                        <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-[11px] border border-slate-100">
                          {item.event_date && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-[#8C6D07]" />
                              <span>{formatDateString(item.event_date)}</span>
                            </div>
                          )}
                          {item.event_location && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-[#8C6D07]" />
                              <span className="truncate">{item.event_location}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    {item.contact_link ? (
                      <a
                        href={item.contact_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block"
                      >
                        <Button className="w-full bg-[#06242E] hover:bg-[#0A3340] text-white text-xs font-semibold py-2 border border-teal-900/60">
                          Acessar Página / Inscrição <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" disabled className="w-full text-xs text-slate-400">
                        Inscrições Diretas com o Membro
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-400 text-xs">Nenhuma divulgação pública ativa no momento.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
