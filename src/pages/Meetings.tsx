import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Video,
  FileText,
  Download,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMeetings,
  getMaterialsByMeeting,
  getAllMaterials,
  createMaterial,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '@/services/api'
import type { Meeting, Material } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { format, isPast, isFuture, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

export default function MeetingsAndMaterials() {
  const { isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'documents'>('photos')
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('todos')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [yearFilter, setYearFilter] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('busca') || '')

  // Media preview modal
  const [previewItem, setPreviewItem] = useState<Material | null>(null)

  // Admin Create/Edit Meeting Modal
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingEventName, setMeetingEventName] = useState('')
  const [meetingStartDate, setMeetingStartDate] = useState('')
  const [meetingEndDate, setMeetingEndDate] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('')
  const [meetingType, setMeetingType] = useState<'presencial' | 'online' | 'hibrido'>('presencial')
  const [meetingSpeakers, setMeetingSpeakers] = useState('')
  const [meetingDesc, setMeetingDesc] = useState('')

  // Admin New Material Modal
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [newMatTitle, setNewMatTitle] = useState('')
  const [newMatType, setNewMatType] = useState<'photo' | 'video' | 'document'>('photo')
  const [newMatUrl, setNewMatUrl] = useState('')
  const [newMatDesc, setNewMatDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Align minutes to 15-minute step helper
  const roundToNearest15Min = (date: Date = new Date()): string => {
    const minutes = date.getMinutes()
    const roundedMinutes = Math.round(minutes / 15) * 15
    const newDate = new Date(date)
    newDate.setMinutes(roundedMinutes)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    // Format to yyyy-MM-ddTHH:mm for datetime-local
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    const yyyy = newDate.getFullYear()
    const MM = pad(newDate.getMonth() + 1)
    const dd = pad(newDate.getDate())
    const hh = pad(newDate.getHours())
    const mm = pad(newDate.getMinutes())
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
  }

  // Convert stored ISO string to datetime-local input string
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

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [meets, mats] = await Promise.all([getMeetings(), getAllMaterials()])
      setMeetings(meets)
      setMaterials(mats)

      const targetId = searchParams.get('id')
      if (targetId) {
        const found = meets.find((m) => m.id === targetId)
        if (found) setSelectedMeeting(found)
      } else if (meets.length > 0 && !selectedMeeting) {
        setSelectedMeeting(meets[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const q = searchParams.get('busca')
    if (q) setSearchTerm(q)
  }, [searchParams])

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

  // Meeting Status Logic (Agendado / Em andamento / Realizado)
  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date()
    const startStr = meeting.start_date || meeting.date
    if (!startStr) {
      return {
        key: 'scheduled',
        label: 'Agendado',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        cardBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: Calendar,
      }
    }

    const startDate = new Date(startStr)
    let endDate = meeting.end_date ? new Date(meeting.end_date) : null

    // Default duration to 2.5 hours if end_date is missing or invalid
    if (!endDate || isNaN(endDate.getTime())) {
      endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000)
    }

    if (now < startDate) {
      return {
        key: 'scheduled',
        label: 'Próximo Encontro',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        cardBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: Calendar,
      }
    } else if (now >= startDate && now <= endDate) {
      return {
        key: 'ongoing',
        label: 'Em Andamento',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
        cardBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
        icon: Hourglass,
      }
    } else {
      return {
        key: 'completed',
        label: 'Realizado',
        badgeClass: 'bg-teal-900/60 text-teal-200 border-teal-700/50',
        cardBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: CalendarCheck2,
      }
    }
  }

  // Filtered meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      searchTerm === '' ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.event_name && m.event_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.speakers && m.speakers.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'todos' || m.type === typeFilter

    const status = getMeetingStatus(m).key
    const matchesStatus = statusFilter === 'todos' || status === statusFilter

    const mYear = new Date(m.start_date || m.date).getFullYear().toString()
    const matchesYear = yearFilter === 'todos' || mYear === yearFilter

    return matchesSearch && matchesType && matchesStatus && matchesYear
  })

  // Materials of currently selected meeting
  const currentMeetingMaterials = materials.filter(
    (mat) => selectedMeeting && mat.meeting === selectedMeeting.id,
  )

  const photos = currentMeetingMaterials.filter((m) => m.type === 'photo')
  const videos = currentMeetingMaterials.filter((m) => m.type === 'video')
  const documents = currentMeetingMaterials.filter((m) => m.type === 'document')

  // Open modal for new meeting
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
    setMeetingSpeakers('')
    setMeetingDesc('')
    setShowMeetingModal(true)
  }

  // Open modal for editing existing meeting
  const handleOpenEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setMeetingTitle(meeting.title || '')
    setMeetingEventName(meeting.event_name || '')
    setMeetingStartDate(toDateTimeLocalString(meeting.start_date || meeting.date))
    setMeetingEndDate(toDateTimeLocalString(meeting.end_date))
    setMeetingLocation(meeting.location || '')
    setMeetingType(meeting.type || 'presencial')
    setMeetingSpeakers(meeting.speakers || '')
    // Strip <p> wrapper for clean textarea edit
    const cleanDesc = (meeting.description || '').replace(/^<p>/, '').replace(/<\/p>$/, '')
    setMeetingDesc(cleanDesc)
    setShowMeetingModal(true)
  }

  // Handle Save Meeting (Create or Update)
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
      const payload: Partial<Meeting> = {
        title: meetingTitle,
        event_name: meetingEventName.trim() || undefined,
        date: startIso,
        start_date: startIso,
        end_date: endIso || undefined,
        location: meetingLocation,
        type: meetingType,
        speakers: meetingSpeakers,
        description: meetingDesc ? `<p>${meetingDesc}</p>` : '',
      }

      let saved: Meeting
      if (editingMeeting) {
        saved = await updateMeeting(editingMeeting.id, payload)
        toast.success('Encontro atualizado com sucesso!')
      } else {
        saved = await createMeeting(payload)
        toast.success('Encontro criado com sucesso!')
      }

      setShowMeetingModal(false)
      await loadData()
      setSelectedMeeting(saved)
    } catch (err: any) {
      toast.error('Erro ao salvar encontro: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete Meeting
  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (!window.confirm(`Tem certeza que deseja excluir o encontro "${meeting.title}"?`)) {
      return
    }
    try {
      await deleteMeeting(meeting.id)
      toast.success('Encontro excluído com sucesso!')
      await loadData()
      if (selectedMeeting?.id === meeting.id) {
        setSelectedMeeting(null)
      }
    } catch (err: any) {
      toast.error('Erro ao excluir encontro: ' + err.message)
    }
  }

  // Handle Add Material (Admin)
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMeeting) {
      toast.error('Selecione um encontro primeiro.')
      return
    }
    if (!newMatTitle || !newMatUrl) {
      toast.error('Título e Link/URL do material são obrigatórios.')
      return
    }
    setIsSubmitting(true)
    try {
      await createMaterial({
        title: newMatTitle,
        type: newMatType,
        url: newMatUrl,
        description: newMatDesc,
        meeting: selectedMeeting.id,
      })
      toast.success('Material adicionado ao acervo com sucesso!')
      setShowAddMaterialModal(false)
      setNewMatTitle('')
      setNewMatUrl('')
      setNewMatDesc('')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao adicionar material: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simulate download all
  const handleDownloadAll = () => {
    toast.success(`Iniciando download dos arquivos do encontro: ${selectedMeeting?.title}`)
    currentMeetingMaterials.forEach((m) => {
      if (m.url) {
        window.open(m.url, '_blank')
      }
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#8C6D07] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Acervo Executivo Edvanced
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Encontros, Fotos & Vídeos Oficiais
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Acesse as coberturas fotográficas dos encontros presenciais, assista às gravações dos
            encontros online e baixe apresentações em PDF com horários de 15 em 15 minutos.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenAddMeeting}
              className="bg-[#06242E] hover:bg-[#0A3340] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm border border-teal-900/60"
            >
              <Plus className="w-4 h-4 mr-1.5 text-[#D4AF37]" /> Novo Encontro
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Filtrar por tema, evento, local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 text-xs rounded-xl bg-slate-50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="scheduled">Agendados / Futuros</SelectItem>
              <SelectItem value="ongoing">Em Andamento</SelectItem>
              <SelectItem value="completed">Realizados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-36 text-xs rounded-xl bg-slate-50">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Formatos</SelectItem>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="online">Online VIP</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full sm:w-32 text-xs rounded-xl bg-slate-50">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Anos</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Split Layout: Left Meeting Timeline & Right Media Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Meeting Timeline / List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              Cronograma de Encontros ({filteredMeetings.length})
            </h3>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting) => {
                const isSelected = selectedMeeting?.id === meeting.id
                const meetMats = materials.filter((mat) => mat.meeting === meeting.id)
                const status = getMeetingStatus(meeting)
                const StatusIcon = status.icon

                return (
                  <div
                    key={meeting.id}
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      setSearchParams({ id: meeting.id })
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative group ${
                      isSelected
                        ? 'bg-[#06242E] text-white border-[#06242E] shadow-xl ring-2 ring-[#D4AF37]/60'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-[#D4AF37]/60 hover:shadow-md'
                    }`}
                  >
                    {/* Top tags row: Format + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                            isSelected
                              ? 'bg-[#D4AF37] text-slate-950'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {meeting.type || 'Presencial'}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                            isSelected ? status.badgeClass : status.cardBadgeClass
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-amber-200' : 'text-slate-400'
                        }`}
                      >
                        {formatDateString(meeting.start_date || meeting.date)}
                      </span>
                    </div>

                    {/* Item 4: Destacar o título do encontro e logo abaixo o nome do evento */}
                    <div className="space-y-1 mb-2.5">
                      <h4
                        className={`font-black text-base leading-snug tracking-tight ${
                          isSelected ? 'text-white' : 'text-slate-900 group-hover:text-[#8C6D07]'
                        }`}
                      >
                        {meeting.title}
                      </h4>
                      {meeting.event_name && (
                        <p
                          className={`text-xs font-semibold flex items-center gap-1.5 ${
                            isSelected ? 'text-[#F5D77F]' : 'text-[#8C6D07]'
                          }`}
                        >
                          <Tag className="w-3 h-3 flex-shrink-0" />
                          <span>{meeting.event_name}</span>
                        </p>
                      )}
                    </div>

                    {/* Schedule times: 15 min steps display */}
                    <div
                      className={`flex items-center gap-1.5 text-xs mb-1.5 ${
                        isSelected ? 'text-teal-100' : 'text-slate-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#D4AF37]" />
                      <span>
                        {formatTimeString(meeting.start_date || meeting.date)}
                        {meeting.end_date ? ` às ${formatTimeString(meeting.end_date)}` : ''}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-2 text-xs truncate ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#D4AF37]" />
                      <span className="truncate">{meeting.location}</span>
                    </div>

                    <div
                      className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                        isSelected ? 'border-teal-800/60' : 'border-slate-200/40'
                      }`}
                    >
                      <span className={isSelected ? 'text-teal-200/80' : 'text-slate-500'}>
                        {meetMats.length} material(is) disponível(is)
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected
                            ? 'text-[#D4AF37] translate-x-1'
                            : 'text-slate-400 group-hover:translate-x-1'
                        }`}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-400 text-xs">
                  Nenhum encontro encontrado com os filtros atuais.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Meeting Details & Media Gallery (8 Cols) */}
        <div className="lg:col-span-8">
          {selectedMeeting ? (
            <div className="space-y-6">
              {/* Meeting Header Banner */}
              {(() => {
                const status = getMeetingStatus(selectedMeeting)
                const StatusIcon = status.icon
                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2.5 max-w-2xl">
                        {/* Status & Date Tag */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-[#D4AF37] text-slate-950 font-bold uppercase text-[10px]">
                            {selectedMeeting.type || 'Presencial'}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`font-bold uppercase text-[10px] flex items-center gap-1 ${status.cardBadgeClass}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>

                          <span className="text-xs text-slate-500 font-medium">
                            {formatDateString(selectedMeeting.start_date || selectedMeeting.date)}
                          </span>
                        </div>

                        {/* Title & Event Name Prominence */}
                        <div className="space-y-1">
                          <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                            {selectedMeeting.title}
                          </h2>
                          {selectedMeeting.event_name && (
                            <p className="text-sm md:text-base font-bold text-[#8C6D07] flex items-center gap-2">
                              <Tag className="w-4 h-4 text-[#D4AF37]" />
                              <span>Evento: {selectedMeeting.event_name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentMeetingMaterials.length > 0 && (
                          <Button
                            onClick={handleDownloadAll}
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold border-slate-300 hover:bg-slate-50"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar Materiais
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              onClick={() => handleOpenEditMeeting(selectedMeeting)}
                              variant="outline"
                              size="sm"
                              className="text-xs font-semibold border-slate-300 hover:bg-slate-100"
                              title="Editar este encontro"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-600" /> Editar
                            </Button>
                            <Button
                              onClick={() => handleDeleteMeeting(selectedMeeting)}
                              variant="ghost"
                              size="sm"
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Excluir encontro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              onClick={() => setShowAddMaterialModal(true)}
                              size="sm"
                              className="bg-[#D4AF37] hover:bg-[#B89324] text-slate-950 font-bold text-xs"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Mídia
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Details Grid (Horário início/fim com 15 min, Local e Palestrantes) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
                      {/* Horário Início e Previsão Fim */}
                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <Clock className="w-4 h-4 text-[#8C6D07] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">Horário do Encontro</p>
                          <p className="text-slate-600 mt-0.5">
                            Início:{' '}
                            {formatTimeString(selectedMeeting.start_date || selectedMeeting.date)}
                          </p>
                          {selectedMeeting.end_date && (
                            <p className="text-slate-500 text-[11px]">
                              Previsão Fim: {formatTimeString(selectedMeeting.end_date)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <MapPin className="w-4 h-4 text-[#8C6D07] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">Local do Encontro</p>
                          <p
                            className="text-slate-600 mt-0.5 truncate max-w-[200px]"
                            title={selectedMeeting.location}
                          >
                            {selectedMeeting.location}
                          </p>
                        </div>
                      </div>

                      {selectedMeeting.speakers ? (
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <Users className="w-4 h-4 text-[#8C6D07] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">Palestrantes & Convidados</p>
                            <p
                              className="text-slate-600 mt-0.5 truncate max-w-[200px]"
                              title={selectedMeeting.speakers}
                            >
                              {selectedMeeting.speakers}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <Sparkles className="w-4 h-4 text-[#8C6D07] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">Clube de Negócios</p>
                            <p className="text-slate-600 mt-0.5">Edvanced Business Club</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedMeeting.description && (
                      <div
                        className="text-xs md:text-sm text-slate-600 prose prose-slate max-w-none pt-2 border-t border-slate-100"
                        dangerouslySetInnerHTML={{ __html: selectedMeeting.description }}
                      />
                    )}
                  </div>
                )
              })()}

              {/* Media Gallery with Tabs: Fotos, Vídeos, Documentos */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <Tabs
                  defaultValue="photos"
                  className="w-full"
                  onValueChange={(v) => setActiveTab(v as any)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        Galeria de Mídia do Encontro
                      </h3>
                      <p className="text-xs text-slate-500">
                        {currentMeetingMaterials.length} item(ns) anexados a este evento
                      </p>
                    </div>

                    <TabsList className="bg-slate-100 p-1 rounded-xl">
                      <TabsTrigger
                        value="photos"
                        className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-[#8C6D07]" />
                        Fotos ({photos.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="videos"
                        className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                      >
                        <Video className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                        Vídeos ({videos.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="documents"
                        className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs rounded-lg px-3 py-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        Documentos ({documents.length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* TAB: PHOTOS */}
                  <TabsContent value="photos" className="pt-6">
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {photos.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setPreviewItem(item)}
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/80 bg-[#03151B] relative aspect-[4/3] shadow-xs hover:shadow-lg transition-all"
                          >
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#03151B]/95 via-transparent to-transparent flex flex-col justify-end p-4">
                              <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#F5D77F] transition-colors">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-[10px] text-teal-100 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                              <span className="text-[10px] text-[#D4AF37] font-semibold mt-1 flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Ver em alta resolução
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-xs">Nenhuma foto anexada a este encontro.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB: VIDEOS */}
                  <TabsContent value="videos" className="pt-6">
                    {videos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {videos.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setPreviewItem(item)}
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/80 bg-[#03151B] relative aspect-[16/9] shadow-xs hover:shadow-lg transition-all"
                          >
                            <img
                              src="https://img.usecurling.com/p/600/350?q=executive%20summit%20stage&color=teal"
                              alt="Video cover"
                              className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#03151B]/95 p-3">
                              <h4 className="text-xs font-bold text-white line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-teal-100 line-clamp-1">
                                {item.description || 'Assista à gravação completa'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <Video className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-xs">Nenhum vídeo cadastrado para este encontro.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB: DOCUMENTS */}
                  <TabsContent value="documents" className="pt-6">
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-[#D4AF37]/50 transition-all flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs font-semibold border-slate-300 hover:bg-[#D4AF37] hover:text-slate-950"
                                >
                                  <Download className="w-3.5 h-3.5 mr-1" /> Baixar PDF
                                </Button>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <FileText className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-xs">Nenhum documento ou apresentação anexada.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">Nenhum encontro selecionado</h3>
              <p className="text-xs text-slate-400">
                Selecione um encontro na lista ao lado para ver fotos e vídeos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal for Photos/Videos */}
      {previewItem && (
        <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="max-w-3xl bg-white p-6 rounded-3xl shadow-2xl">
            <DialogHeader>
              <Badge className="w-fit bg-[#D4AF37] text-slate-950 uppercase font-bold text-[10px] mb-1">
                {previewItem.type}
              </Badge>
              <DialogTitle className="text-base font-bold text-slate-900">
                {previewItem.title}
              </DialogTitle>
              {previewItem.description && (
                <DialogDescription className="text-xs text-slate-600">
                  {previewItem.description}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="my-4 rounded-2xl overflow-hidden bg-[#03151B] flex items-center justify-center min-h-[350px]">
              {previewItem.type === 'photo' && previewItem.url && (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  className="max-h-[500px] w-auto object-contain rounded-lg"
                />
              )}
              {previewItem.type === 'video' && (
                <div className="p-8 text-center text-white space-y-4">
                  <Play className="w-16 h-16 text-[#D4AF37] mx-auto animate-pulse" />
                  <p className="text-sm font-semibold">Assistir Gravação na Íntegra</p>
                  {previewItem.url && (
                    <a
                      href={previewItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button className="bg-[#D4AF37] text-slate-950 font-bold hover:bg-[#F5D77F] text-xs">
                        Abrir Streaming do Vídeo <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewItem(null)} className="text-xs">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ADMIN: Add / Edit Meeting Modal (15 min interval, start/end dates, event name) */}
      {showMeetingModal && (
        <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
          <DialogContent className="max-w-xl bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {editingMeeting ? 'Editar Encontro' : 'Cadastrar Novo Encontro'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Configure os dados do encontro oficial. O seletor de horários segue passos de 15
                minutos.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveMeeting} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Título do Encontro *</Label>
                <Input
                  placeholder="Ex: Mastermind de Escala & Governança 2025"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Nome do Evento / Série (exibido logo abaixo)
                </Label>
                <Input
                  placeholder="Ex: Edvanced Executive Immersion 2025"
                  value={meetingEventName}
                  onChange={(e) => setMeetingEventName(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Data Início & Previsão de Fim com step 900 (15 minutos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Data e Hora de Início * (passo: 15 min)
                  </Label>
                  <Input
                    type="datetime-local"
                    step={900}
                    value={meetingStartDate}
                    onChange={(e) => setMeetingStartDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    Intervalos de 15 min (ex: 14:00, 14:15, 14:30)
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Previsão de Fim (passo: 15 min)</Label>
                  <Input
                    type="datetime-local"
                    step={900}
                    value={meetingEndDate}
                    onChange={(e) => setMeetingEndDate(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    Opcional — define o período "Em andamento"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Formato do Encontro</Label>
                  <Select value={meetingType} onValueChange={(v: any) => setMeetingType(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online VIP</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Local / Transmissão *</Label>
                  <Input
                    placeholder="Ex: Hotel Fasano Jardins - SP"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Palestrantes / Convidados Especiais</Label>
                <Input
                  placeholder="Ex: Ediane Dal Bosco, Dr. Fernando Cintra"
                  value={meetingSpeakers}
                  onChange={(e) => setMeetingSpeakers(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Pauta / Descrição</Label>
                <Textarea
                  placeholder="Detalhes, cronograma ou tópicos discutidos..."
                  value={meetingDesc}
                  onChange={(e) => setMeetingDesc(e.target.value)}
                  className="text-xs"
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMeetingModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#06242E] hover:bg-[#0A3340] text-white font-bold text-xs"
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

      {/* ADMIN: Add Material Modal */}
      {showAddMaterialModal && (
        <Dialog open={showAddMaterialModal} onOpenChange={setShowAddMaterialModal}>
          <DialogContent className="max-w-lg bg-white rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Adicionar Material ao Encontro
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Encontro: <span className="font-bold text-slate-800">{selectedMeeting?.title}</span>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMaterial} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Título do Arquivo / Foto *</Label>
                <Input
                  placeholder="Ex: Galeria de Fotos em Alta - Welcome Dinner"
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tipo de Mídia *</Label>
                <Select value={newMatType} onValueChange={(v: any) => setNewMatType(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Foto / Galeria</SelectItem>
                    <SelectItem value="video">Vídeo / Gravação</SelectItem>
                    <SelectItem value="document">Documento / PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">URL / Link Direto *</Label>
                <Input
                  placeholder="https://img.usecurling.com/... ou link do vídeo/pdf"
                  value={newMatUrl}
                  onChange={(e) => setNewMatUrl(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descrição / Notas</Label>
                <Textarea
                  placeholder="Informações adicionais para os membros..."
                  value={newMatDesc}
                  onChange={(e) => setNewMatDesc(e.target.value)}
                  className="text-xs"
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#D4AF37] hover:bg-[#B89324] text-slate-950 font-bold text-xs"
                >
                  {isSubmitting ? 'Salvando...' : 'Adicionar ao Acervo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
