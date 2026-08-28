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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMeetings,
  getMaterialsByMeeting,
  getAllMaterials,
  createMaterial,
  createMeeting,
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
import { format } from 'date-fns'
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
  const [yearFilter, setYearFilter] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('busca') || '')

  // Media preview modal
  const [previewItem, setPreviewItem] = useState<Material | null>(null)

  // Admin New Meeting Modal
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false)
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [newMeetingDate, setNewMeetingDate] = useState('')
  const [newMeetingLocation, setNewMeetingLocation] = useState('')
  const [newMeetingType, setNewMeetingType] = useState<'presencial' | 'online' | 'hibrido'>(
    'presencial',
  )
  const [newMeetingSpeakers, setNewMeetingSpeakers] = useState('')
  const [newMeetingDesc, setNewMeetingDesc] = useState('')

  // Admin New Material Modal
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [newMatTitle, setNewMatTitle] = useState('')
  const [newMatType, setNewMatType] = useState<'photo' | 'video' | 'document'>('photo')
  const [newMatUrl, setNewMatUrl] = useState('')
  const [newMatDesc, setNewMatDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const formatTimeString = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return format(d, "HH:mm'h'", { locale: ptBR })
    } catch {
      return ''
    }
  }

  // Filtered meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      searchTerm === '' ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.speakers && m.speakers.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'todos' || m.type === typeFilter

    const mYear = new Date(m.date).getFullYear().toString()
    const matchesYear = yearFilter === 'todos' || mYear === yearFilter

    return matchesSearch && matchesType && matchesYear
  })

  // Materials of currently selected meeting
  const currentMeetingMaterials = materials.filter(
    (mat) => selectedMeeting && mat.meeting === selectedMeeting.id,
  )

  const photos = currentMeetingMaterials.filter((m) => m.type === 'photo')
  const videos = currentMeetingMaterials.filter((m) => m.type === 'video')
  const documents = currentMeetingMaterials.filter((m) => m.type === 'document')

  // Handle Create Meeting (Admin)
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMeetingTitle || !newMeetingDate || !newMeetingLocation) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    setIsSubmitting(true)
    try {
      const created = await createMeeting({
        title: newMeetingTitle,
        date: new Date(newMeetingDate).toISOString(),
        location: newMeetingLocation,
        type: newMeetingType,
        speakers: newMeetingSpeakers,
        description: `<p>${newMeetingDesc}</p>`,
      })
      toast.success('Encontro criado com sucesso!')
      setShowAddMeetingModal(false)
      setNewMeetingTitle('')
      setNewMeetingDate('')
      setNewMeetingLocation('')
      setNewMeetingSpeakers('')
      setNewMeetingDesc('')
      await loadData()
      setSelectedMeeting(created)
    } catch (err: any) {
      toast.error('Erro ao criar encontro: ' + err.message)
    } finally {
      setIsSubmitting(false)
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
      {/* Top Header */}
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
            encontros online e baixe apresentações em PDF.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddMeetingModal(true)}
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5 text-[#D4AF37]" /> Novo Encontro
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Filtrar por tema, palestrante ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-40 text-xs rounded-xl bg-slate-50">
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
            <SelectTrigger className="w-full md:w-36 text-xs rounded-xl bg-slate-50">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Anos</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
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

                return (
                  <div
                    key={meeting.id}
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      setSearchParams({ id: meeting.id })
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative group ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg ring-2 ring-[#D4AF37]/50'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-[#D4AF37]/60 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                          isSelected ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {meeting.type || 'Presencial'}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-amber-200' : 'text-slate-400'
                        }`}
                      >
                        {formatDateString(meeting.date)}
                      </span>
                    </div>

                    <h4
                      className={`font-bold text-sm leading-snug mb-2 ${
                        isSelected ? 'text-white' : 'text-slate-900 group-hover:text-[#8C6D07]'
                      }`}
                    >
                      {meeting.title}
                    </h4>

                    <div
                      className={`flex items-center gap-2 text-xs truncate ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#D4AF37]" />
                      <span className="truncate">{meeting.location}</span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/30 flex items-center justify-between text-[11px]">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
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
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#D4AF37] text-slate-950 font-bold uppercase text-[10px]">
                        {selectedMeeting.type || 'Presencial'}
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        Realizado em {formatDateString(selectedMeeting.date)}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                      {selectedMeeting.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
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
                      <Button
                        onClick={() => setShowAddMaterialModal(true)}
                        size="sm"
                        className="bg-[#D4AF37] hover:bg-[#B89324] text-slate-950 font-bold text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Mídia
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <MapPin className="w-4 h-4 text-[#8C6D07] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Local do Encontro</p>
                      <p className="text-slate-600 mt-0.5">{selectedMeeting.location}</p>
                    </div>
                  </div>

                  {selectedMeeting.speakers && (
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <Users className="w-4 h-4 text-[#8C6D07] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">Palestrantes & Keynotes</p>
                        <p className="text-slate-600 mt-0.5">{selectedMeeting.speakers}</p>
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
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-950 relative aspect-[4/3] shadow-xs hover:shadow-lg transition-all"
                          >
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-4">
                              <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#F5D77F] transition-colors">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
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
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-950 relative aspect-[16/9] shadow-xs hover:shadow-lg transition-all"
                          >
                            <img
                              src="https://img.usecurling.com/p/600/350?q=executive%20summit%20stage&color=navy"
                              alt="Video cover"
                              className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 p-3">
                              <h4 className="text-xs font-bold text-white line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-slate-300 line-clamp-1">
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

            <div className="my-4 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[350px]">
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

      {/* ADMIN: Add Meeting Modal */}
      {showAddMeetingModal && (
        <Dialog open={showAddMeetingModal} onOpenChange={setShowAddMeetingModal}>
          <DialogContent className="max-w-lg bg-white rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Cadastrar Novo Encontro
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Adicione um evento ao cronograma oficial do Edvanced Business Club.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateMeeting} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Título do Encontro *</Label>
                <Input
                  placeholder="Ex: Mastermind de Escala & Governança 2025"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data e Hora *</Label>
                  <Input
                    type="datetime-local"
                    value={newMeetingDate}
                    onChange={(e) => setNewMeetingDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Formato</Label>
                  <Select value={newMeetingType} onValueChange={(v: any) => setNewMeetingType(v)}>
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
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Local / Link de Transmissão *</Label>
                <Input
                  placeholder="Ex: Hotel Fasano Jardins - São Paulo / SP"
                  value={newMeetingLocation}
                  onChange={(e) => setNewMeetingLocation(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Palestrantes / Convidados</Label>
                <Input
                  placeholder="Ex: Ediane Dal Bosco, Dr. Fernando Cintra"
                  value={newMeetingSpeakers}
                  onChange={(e) => setNewMeetingSpeakers(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Pauta / Descrição</Label>
                <Textarea
                  placeholder="Detalhes, cronograma ou tópicos discutidos..."
                  value={newMeetingDesc}
                  onChange={(e) => setNewMeetingDesc(e.target.value)}
                  className="text-xs"
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMeetingModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Encontro'}
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
