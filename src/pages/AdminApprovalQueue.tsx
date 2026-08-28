import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Calendar,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import { getAllDisclosuresForAdmin, updateDisclosureStatus } from '@/services/api'
import type { Disclosure } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

export default function AdminApprovalQueue() {
  const { user } = useAuth()

  const [disclosures, setDisclosures] = useState<Disclosure[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDisclosure, setSelectedDisclosure] = useState<Disclosure | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  // Rejection reason state
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadData = async () => {
    try {
      const all = await getAllDisclosuresForAdmin()
      setDisclosures(all)
    } catch (err) {
      console.error('Erro ao carregar fila de aprovação:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Realtime updates
  useRealtime<Disclosure>(
    'disclosures',
    () => {
      loadData()
    },
    true,
  )

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  // Handle Approve
  const handleApprove = async (disclosure: Disclosure) => {
    setIsProcessing(true)
    try {
      await updateDisclosureStatus(
        disclosure.id,
        'approved',
        'Divulgação aprovada pela Diretoria do Edvanced Business Club.',
      )
      toast.success(
        `Divulgação "${disclosure.title}" foi APROVADA e já está visível para todos os membros!`,
      )
      setReviewModalOpen(false)
      setSelectedDisclosure(null)
      setShowRejectForm(false)
      setRejectReason('')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao aprovar divulgação: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Reject
  const handleReject = async (disclosure: Disclosure) => {
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo da reprovação para orientar o membro.')
      return
    }

    setIsProcessing(true)
    try {
      await updateDisclosureStatus(disclosure.id, 'rejected', rejectReason.trim())
      toast.info(
        `Divulgação "${disclosure.title}" foi marcada como REPROVADA. O autor foi notificado com o feedback.`,
      )
      setReviewModalOpen(false)
      setSelectedDisclosure(null)
      setShowRejectForm(false)
      setRejectReason('')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao reprovar divulgação: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Filtering
  const pendingList = disclosures.filter((d) => d.status === 'pending')
  const approvedList = disclosures.filter((d) => d.status === 'approved')
  const rejectedList = disclosures.filter((d) => d.status === 'rejected')

  const filterItems = (list: Disclosure[]) => {
    if (!searchTerm.trim()) return list
    const q = searchTerm.toLowerCase()
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.expand?.member?.name?.toLowerCase().includes(q),
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#03151B] via-[#06242E] to-[#03151B] border border-teal-950/80 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              Painel Master de Moderação
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Fila de Aprovação de Divulgações
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Você tem controle total sobre os conteúdos e eventos divulgados pelos membros. Aprove
              para publicar imediatamente ou recuse com feedback de ajustes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-center">
              <p className="text-2xl font-extrabold text-[#D4AF37]">{pendingList.length}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                Pendentes
              </p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-center">
              <p className="text-2xl font-extrabold text-emerald-400">{approvedList.length}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                Aprovados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar solicitações por título, autor ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-6">
          <TabsTrigger
            value="pending"
            className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-xl px-4 py-2"
          >
            Aguardando Aprovação ({pendingList.length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-xl px-4 py-2"
          >
            Aprovadas & Ativas ({approvedList.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-xl px-4 py-2"
          >
            Reprovadas com Feedback ({rejectedList.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENDING */}
        <TabsContent value="pending" className="space-y-4">
          {filterItems(pendingList).length > 0 ? (
            <div className="space-y-3">
              {filterItems(pendingList).map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-amber-200/80 hover:border-amber-400 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold uppercase text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Aguardando Decisão
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Submetido em {formatDateString(item.created)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{item.title}</h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      {item.expand?.member && (
                        <span className="font-semibold text-slate-700">
                          Autor: {item.expand.member.name} (
                          {item.expand.member.company || item.expand.member.email})
                        </span>
                      )}
                      {item.event_date && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3 h-3 text-[#8C6D07]" />
                          {formatDateString(item.event_date)}
                        </span>
                      )}
                      {item.event_location && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-[#8C6D07]" />
                          {item.event_location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0">
                    <Button
                      onClick={() => {
                        setSelectedDisclosure(item)
                        setShowRejectForm(false)
                        setRejectReason('')
                        setReviewModalOpen(true)
                      }}
                      className="bg-[#06242E] hover:bg-[#0A3340] text-white font-bold text-xs rounded-xl py-2 px-4 border border-teal-900/60"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Revisar & Decidir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800">Fila Limpa!</h3>
              <p className="text-xs text-slate-400">
                Não há divulgações pendentes de aprovação no momento.
              </p>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: APPROVED */}
        <TabsContent value="approved" className="space-y-4">
          {filterItems(approvedList).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterItems(approvedList).map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold uppercase text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline text-emerald-600" /> Aprovada
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {formatDateString(item.updated)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Autor: {item.expand?.member?.name || 'Membro do Club'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDisclosure(item)
                        setShowRejectForm(true)
                        setReviewModalOpen(true)
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      Revogar / Reprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400">Nenhuma divulgação aprovada encontrada.</p>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: REJECTED */}
        <TabsContent value="rejected" className="space-y-4">
          {filterItems(rejectedList).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterItems(rejectedList).map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold uppercase text-[10px]">
                        <XCircle className="w-3 h-3 mr-1 inline text-rose-600" /> Reprovada
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {formatDateString(item.updated)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.content}</p>

                    {item.admin_feedback && (
                      <div className="p-3 bg-rose-50 rounded-2xl text-xs text-rose-800 border border-rose-200/60 mt-2">
                        <p className="font-bold">Motivo enviado:</p>
                        <p className="italic text-[11px] mt-0.5">"{item.admin_feedback}"</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">
                      Autor: {item.expand?.member?.name || 'Membro do Club'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(item)}
                      disabled={isProcessing}
                      className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      Reaprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400">Nenhuma divulgação reprovada encontrada.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL: Full Review & Decision */}
      {selectedDisclosure && (
        <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-bold text-[10px]">
                  Moderação Executiva
                </Badge>
                <span className="text-xs text-slate-400">
                  Submetido em {formatDateString(selectedDisclosure.created)}
                </span>
              </div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 leading-snug">
                {selectedDisclosure.title}
              </DialogTitle>
              {selectedDisclosure.expand?.member && (
                <DialogDescription className="text-xs text-slate-600 font-semibold">
                  Membro Solicitante: {selectedDisclosure.expand.member.name} (
                  {selectedDisclosure.expand.member.company ||
                    selectedDisclosure.expand.member.email}
                  )
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Conteúdo da Divulgação:
                </p>
                <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedDisclosure.content}
                </p>
              </div>

              {(selectedDisclosure.event_date || selectedDisclosure.event_location) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedDisclosure.event_date && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Data do Evento
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDateString(selectedDisclosure.event_date)}
                      </span>
                    </div>
                  )}
                  {selectedDisclosure.event_location && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Local
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedDisclosure.event_location}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedDisclosure.contact_link && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Link Indicado
                    </span>
                    <a
                      href={selectedDisclosure.contact_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#8C6D07] hover:underline truncate max-w-sm block"
                    >
                      {selectedDisclosure.contact_link}
                    </a>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              )}

              {/* Rejection reason box (collapsible) */}
              {showRejectForm && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-fade-in">
                  <Label
                    htmlFor="reason"
                    className="text-xs font-bold text-rose-900 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Motivo da Reprovação (visível para o
                    membro):
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Ex: O conteúdo precisa ter foco exclusivo em parcerias B2B ou oferecer um benefício especial para os membros..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="text-xs bg-white border-rose-300"
                    rows={3}
                    required
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRejectForm(false)}
                      className="text-xs text-slate-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleReject(selectedDisclosure)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                    >
                      Confirmar Reprovação
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
              {!showRejectForm && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                  >
                    <XCircle className="w-4 h-4 mr-1.5 text-rose-500" /> Reprovar com Feedback
                  </Button>
                  <Button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(selectedDisclosure)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Aprovar & Publicar no Club
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
