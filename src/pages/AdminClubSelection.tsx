import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  X,
  Building2,
  Crown,
  Layers,
  Image as ImageIcon,
  Users,
  Video,
  Briefcase,
  Mic,
  Star,
  CheckCircle2,
  ArrowUpDown,
  ExternalLink,
  Info,
} from 'lucide-react'
import salaReuniaoImg from '../assets/whatsapp-image-2026-05-29-at-16.27.10-1-2d279.jpeg'
import salaCompartilhadaImg from '../assets/whatsapp-image-2026-05-29-at-16.27.10-c0958.jpeg'
import {
  getAllClubBenefitsForAdmin,
  createClubBenefit,
  updateClubBenefit,
  deleteClubBenefit,
  getAllClubSpacesPhotosForAdmin,
  createClubSpacePhoto,
  updateClubSpacePhoto,
  deleteClubSpacePhoto,
  getFileUrl,
} from '@/services/api'
import type { ClubBenefit, ClubSpacePhoto } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export const AVAILABLE_ICONS: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Users,
  Video,
  Building2,
  Briefcase,
  Sparkles,
  Mic,
  Crown,
  Star,
  Layers,
  CheckCircle2,
}

export default function AdminClubSelection() {
  const [activeSubTab, setActiveSubTab] = useState<'beneficios' | 'espacos'>('beneficios')

  // Benefits state
  const [benefits, setBenefits] = useState<ClubBenefit[]>([])
  const [benefitSearch, setBenefitSearch] = useState('')
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<ClubBenefit | null>(null)
  const [benefitTitle, setBenefitTitle] = useState('')
  const [benefitDescription, setBenefitDescription] = useState('')
  const [benefitIcon, setBenefitIcon] = useState('Users')
  const [benefitCategory, setBenefitCategory] = useState('')
  const [benefitOrder, setBenefitOrder] = useState<number | ''>(1)
  const [benefitActive, setBenefitActive] = useState(true)
  const [isSavingBenefit, setIsSavingBenefit] = useState(false)

  // Spaces photos state
  const [spaces, setSpaces] = useState<ClubSpacePhoto[]>([])
  const [spaceSearch, setSpaceSearch] = useState('')
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<ClubSpacePhoto | null>(null)
  const [spaceTitle, setSpaceTitle] = useState('')
  const [spaceCaption, setSpaceCaption] = useState('')
  const [spaceType, setSpaceType] = useState('Sala de Reunião')
  const [spaceOrder, setSpaceOrder] = useState<number | ''>(1)
  const [spaceActive, setSpaceActive] = useState(true)
  const [spacePhotoFile, setSpacePhotoFile] = useState<File | null>(null)
  const [spacePhotoPreview, setSpacePhotoPreview] = useState('')
  const [spacePhotoUrl, setSpacePhotoUrl] = useState('')
  const [isSavingSpace, setIsSavingSpace] = useState(false)
  const spaceFileInputRef = useRef<HTMLInputElement | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [benefitsData, spacesData] = await Promise.all([
        getAllClubBenefitsForAdmin().catch(() => [] as ClubBenefit[]),
        getAllClubSpacesPhotosForAdmin().catch(() => [] as ClubSpacePhoto[]),
      ])
      setBenefits(benefitsData)
      setSpaces(spacesData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast.error('Não foi possível carregar os dados de gestão.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ================= BENEFITS HANDLERS =================
  const handleOpenNewBenefit = () => {
    setEditingBenefit(null)
    setBenefitTitle('')
    setBenefitDescription('')
    setBenefitIcon('Sparkles')
    setBenefitCategory('Exclusivo')
    setBenefitOrder(benefits.length + 1)
    setBenefitActive(true)
    setIsBenefitModalOpen(true)
  }

  const handleOpenEditBenefit = (item: ClubBenefit) => {
    setEditingBenefit(item)
    setBenefitTitle(item.title || '')
    setBenefitDescription(item.description || '')
    setBenefitIcon(item.icon_name || 'Sparkles')
    setBenefitCategory(item.category || '')
    setBenefitOrder(item.order ?? 1)
    setBenefitActive(item.active ?? true)
    setIsBenefitModalOpen(true)
  }

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!benefitTitle.trim() || !benefitDescription.trim()) {
      toast.error('Título e descrição do benefício são obrigatórios.')
      return
    }

    setIsSavingBenefit(true)
    try {
      const payload: Partial<ClubBenefit> = {
        title: benefitTitle.trim(),
        description: benefitDescription.trim(),
        icon_name: benefitIcon,
        category: benefitCategory.trim() || undefined,
        order: typeof benefitOrder === 'number' ? benefitOrder : 1,
        active: benefitActive,
      }

      if (editingBenefit) {
        await updateClubBenefit(editingBenefit.id, payload)
        toast.success('Benefício atualizado com sucesso!')
      } else {
        await createClubBenefit(payload)
        toast.success('Benefício cadastrado com sucesso!')
      }

      setIsBenefitModalOpen(false)
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao salvar benefício: ' + (err.message || 'Tente novamente.'))
    } finally {
      setIsSavingBenefit(false)
    }
  }

  const handleDeleteBenefit = async (item: ClubBenefit) => {
    if (!window.confirm(`Tem certeza que deseja excluir o benefício "${item.title}"?`)) return
    try {
      await deleteClubBenefit(item.id)
      toast.success('Benefício excluído com sucesso.')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao excluir benefício: ' + err.message)
    }
  }

  // ================= SPACES HANDLERS =================
  const handleOpenNewSpace = () => {
    setEditingSpace(null)
    setSpaceTitle('')
    setSpaceCaption('')
    setSpaceType('Sala de Reunião')
    setSpaceOrder(spaces.length + 1)
    setSpaceActive(true)
    setSpacePhotoFile(null)
    setSpacePhotoPreview('')
    setSpacePhotoUrl('')
    setIsSpaceModalOpen(true)
  }

  const handleOpenEditSpace = (item: ClubSpacePhoto) => {
    setEditingSpace(item)
    setSpaceTitle(item.title || '')
    setSpaceCaption(item.caption || '')
    setSpaceType(item.space_type || 'Sala de Reunião')
    setSpaceOrder(item.order ?? 1)
    setSpaceActive(item.active ?? true)
    setSpacePhotoFile(null)
    setSpacePhotoPreview(item.photo ? getFileUrl('club_spaces_photos', item.id, item.photo) : '')
    setSpacePhotoUrl(item.photo_url || '')
    setIsSpaceModalOpen(true)
  }

  const handleSpaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSpacePhotoFile(file)
      setSpacePhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!spaceTitle.trim()) {
      toast.error('O título do espaço/foto é obrigatório.')
      return
    }

    setIsSavingSpace(true)
    try {
      if (spacePhotoFile) {
        const formData = new FormData()
        formData.append('title', spaceTitle.trim())
        if (spaceCaption.trim()) formData.append('caption', spaceCaption.trim())
        if (spaceType.trim()) formData.append('space_type', spaceType.trim())
        if (typeof spaceOrder === 'number') formData.append('order', String(spaceOrder))
        formData.append('active', String(spaceActive))
        if (spacePhotoUrl.trim()) formData.append('photo_url', spacePhotoUrl.trim())
        formData.append('photo', spacePhotoFile)

        if (editingSpace) {
          await updateClubSpacePhoto(editingSpace.id, formData)
          toast.success('Foto do espaço atualizada com sucesso!')
        } else {
          await createClubSpacePhoto(formData)
          toast.success('Foto do espaço enviada com sucesso!')
        }
      } else {
        const payload: Partial<ClubSpacePhoto> = {
          title: spaceTitle.trim(),
          caption: spaceCaption.trim() || undefined,
          space_type: spaceType.trim() || undefined,
          order: typeof spaceOrder === 'number' ? spaceOrder : 1,
          active: spaceActive,
          photo_url: spacePhotoUrl.trim() || undefined,
        }

        if (editingSpace) {
          await updateClubSpacePhoto(editingSpace.id, payload)
          toast.success('Foto do espaço atualizada com sucesso!')
        } else {
          await createClubSpacePhoto(payload)
          toast.success('Foto do espaço cadastrada com sucesso!')
        }
      }

      setIsSpaceModalOpen(false)
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao salvar foto do espaço: ' + (err.message || 'Tente novamente.'))
    } finally {
      setIsSavingSpace(false)
    }
  }

  const handleDeleteSpace = async (item: ClubSpacePhoto) => {
    if (!window.confirm(`Tem certeza que deseja excluir a foto "${item.title}"?`)) return
    try {
      await deleteClubSpacePhoto(item.id)
      toast.success('Foto excluída com sucesso.')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao excluir foto: ' + err.message)
    }
  }

  // Filter lists
  const filteredBenefits = benefits.filter((b) => {
    const q = benefitSearch.toLowerCase().trim()
    if (!q) return true
    return (
      b.title?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q)
    )
  })

  const filteredSpaces = spaces.filter((s) => {
    const q = spaceSearch.toLowerCase().trim()
    if (!q) return true
    return (
      s.title?.toLowerCase().includes(q) ||
      s.caption?.toLowerCase().includes(q) ||
      s.space_type?.toLowerCase().includes(q)
    )
  })

  const getSpacePhotoSrc = (item: ClubSpacePhoto) => {
    if (item.photo) {
      return getFileUrl('club_spaces_photos', item.id, item.photo)
    }
    if (item.photo_url === '/images/sala-de-reuniao.jpeg') {
      return salaReuniaoImg
    }
    if (item.photo_url === '/images/sala-compartilhada.jpeg') {
      return salaCompartilhadaImg
    }
    if (item.photo_url) {
      return item.photo_url
    }
    return ''
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#061020] via-[#0A1A33] to-[#061020] border border-[#061020]/80 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-semibold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
              Gestão da Página Pública
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Seleção de Membros: Benefícios & Galeria do Local
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1">
              Gerencie os benefícios exclusivos exibidos no portal público e faça upload das fotos
              reais do local e das salas (Sala de Reunião, Sala Compartilhada, Auditório e Lounge).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeSubTab === 'beneficios' ? (
              <Button
                onClick={handleOpenNewBenefit}
                className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Benefício
              </Button>
            ) : (
              <Button
                onClick={handleOpenNewSpace}
                className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Foto do Local / Sala
              </Button>
            )}
          </div>
        </div>

        {/* Tab switchers inside Banner */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveSubTab('beneficios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'beneficios'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Benefícios dos Membros ({benefits.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('espacos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'espacos'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Fotos do Local & Salas ({spaces.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: BENEFÍCIOS ================= */}
      {activeSubTab === 'beneficios' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por título, categoria ou descrição..."
                value={benefitSearch}
                onChange={(e) => setBenefitSearch(e.target.value)}
                className="pl-10 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Total de benefícios:</span>
              <Badge variant="outline" className="border-[#D4AF37] text-[#8C6D07] font-bold">
                {benefits.length} item(ns)
              </Badge>
            </div>
          </div>

          {/* Benefits Grid */}
          {filteredBenefits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBenefits.map((item) => {
                const IconComponent = AVAILABLE_ICONS[item.icon_name || 'Sparkles'] || Sparkles
                return (
                  <Card
                    key={item.id}
                    className="group relative border border-slate-200 hover:border-[#D4AF37] bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Bar: Icon + Category + Order */}
                      <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0A1A33] to-[#061020] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D77F] shadow-sm">
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.category && (
                            <Badge className="bg-[#D4AF37]/15 text-[#8C6D07] border border-[#D4AF37]/40 text-[9px] font-bold uppercase">
                              {item.category}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold uppercase ${
                              item.active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-500 border-slate-300'
                            }`}
                          >
                            {item.active ? 'Ativo' : 'Oculto'}
                          </Badge>
                          {typeof item.order === 'number' && (
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                              #{item.order}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditBenefit(item)}
                        className="h-8 text-xs border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-xl"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1 text-[#8C6D07]" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBenefit(item)}
                        className="h-8 text-xs border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300 space-y-3">
              <Sparkles className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Nenhum benefício encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cadastre os benefícios do Edvanced Business Club para exibição na página pública.
              </p>
              <Button
                onClick={handleOpenNewBenefit}
                className="bg-[#0A1A33] hover:bg-[#102A56] text-white font-bold text-xs mt-2 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Cadastrar Benefício
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ESPAÇOS & SALAS ================= */}
      {activeSubTab === 'espacos' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nome da sala, tipo ou legenda..."
                value={spaceSearch}
                onChange={(e) => setSpaceSearch(e.target.value)}
                className="pl-10 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Total de fotos do local:</span>
              <Badge variant="outline" className="border-[#D4AF37] text-[#8C6D07] font-bold">
                {spaces.length} foto(s)
              </Badge>
            </div>
          </div>

          {/* Spaces Grid */}
          {filteredSpaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpaces.map((item) => {
                const photoSrc = getSpacePhotoSrc(item)
                return (
                  <Card
                    key={item.id}
                    className="group border border-slate-200 hover:border-[#D4AF37] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview Box */}
                      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0A1A33] via-[#0D2142] to-[#061020] flex flex-col items-center justify-center p-6 text-center">
                            <Building2 className="w-10 h-10 text-[#F5D77F] mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#F5D77F]">
                              {item.space_type || 'Espaço Edvanced'}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                        {/* Top Badge: Type & Order */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <Badge className="bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                            {item.space_type || 'Sala'}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            {typeof item.order === 'number' && (
                              <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                Ordem #{item.order}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#8C6D07] transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        {item.caption && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.caption}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase ${
                          item.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}
                      >
                        {item.active ? 'Ativo no Site' : 'Oculto'}
                      </Badge>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditSpace(item)}
                          className="h-7 px-2.5 text-xs border-slate-200 text-slate-700 hover:text-slate-950 rounded-xl"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#8C6D07]" /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSpace(item)}
                          className="h-7 px-2 text-xs border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300 space-y-3">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Nenhuma foto cadastrada ainda</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Faça o upload das fotos reais do local (Sala de Reunião, Sala Compartilhada, etc.)
                para apresentar a infraestrutura exclusiva aos interessados.
              </p>
              <Button
                onClick={handleOpenNewSpace}
                className="bg-[#0A1A33] hover:bg-[#102A56] text-white font-bold text-xs mt-2 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Fazer Upload da Primeira Foto
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL DE BENEFÍCIO ================= */}
      {isBenefitModalOpen && (
        <Dialog open={isBenefitModalOpen} onOpenChange={setIsBenefitModalOpen}>
          <DialogContent className="max-w-xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-black text-[9px] tracking-wider">
                  Seleção de Membros
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingBenefit ? 'Editar Benefício' : 'Novo Benefício do Club'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Configure o título, descrição, ícone e ordem de exibição do card de benefício.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveBenefit} className="space-y-4 pt-2 text-xs">
              {/* Título */}
              <div className="space-y-1">
                <Label className="text-slate-800 font-semibold">Título do Benefício *</Label>
                <Input
                  placeholder="Ex: 1 Encontro Presencial por Mês"
                  value={benefitTitle}
                  onChange={(e) => setBenefitTitle(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  required
                />
              </div>

              {/* Categoria & Ícone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Categoria / Selo</Label>
                  <Input
                    placeholder="Ex: Encontros, Estrutura, Conteúdo"
                    value={benefitCategory}
                    onChange={(e) => setBenefitCategory(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Ícone do Card</Label>
                  <select
                    value={benefitIcon}
                    onChange={(e) => setBenefitIcon(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                  >
                    <option value="Users">👥 Users (Pessoas / Networking)</option>
                    <option value="Video">🎥 Video (Encontro Online)</option>
                    <option value="Building2">🏢 Building2 (Estrutura / Salas)</option>
                    <option value="Briefcase">💼 Briefcase (Trabalho / Coworking)</option>
                    <option value="Sparkles">✨ Sparkles (Exclusividade)</option>
                    <option value="Mic">🎙️ Mic (EdvancedCast / Podcast)</option>
                    <option value="Crown">👑 Crown (Liderança / VIP)</option>
                    <option value="Star">⭐ Star (Destaque)</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <Label className="text-slate-800 font-semibold">Descrição do Benefício *</Label>
                <Textarea
                  placeholder="Explique detalhadamente o que está incluso neste benefício..."
                  value={benefitDescription}
                  onChange={(e) => setBenefitDescription(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  rows={4}
                  required
                />
              </div>

              {/* Ordem & Ativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Ordem de Exibição</Label>
                  <Input
                    type="number"
                    value={benefitOrder}
                    onChange={(e) => setBenefitOrder(e.target.value ? Number(e.target.value) : '')}
                    className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Status de Exibição</Label>
                  <div className="flex items-center h-9">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={benefitActive}
                        onChange={(e) => setBenefitActive(e.target.checked)}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37] w-4 h-4"
                      />
                      <span>Ativo (visível no portal público)</span>
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBenefitModalOpen(false)}
                  className="text-xs border-slate-200 text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingBenefit}
                  className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-5 rounded-xl shadow-md"
                >
                  {isSavingBenefit
                    ? 'Salvando...'
                    : editingBenefit
                      ? 'Salvar Alterações'
                      : 'Cadastrar Benefício'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ================= MODAL DE FOTO DE ESPAÇO / SALA ================= */}
      {isSpaceModalOpen && (
        <Dialog open={isSpaceModalOpen} onOpenChange={setIsSpaceModalOpen}>
          <DialogContent className="max-w-xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-black text-[9px] tracking-wider">
                  Galeria Real do Local
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingSpace ? 'Editar Foto do Espaço' : 'Nova Foto do Local / Salas'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Envie a foto real do ambiente e descreva a infraestrutura (Sala de Reunião, Sala
                Compartilhada, etc.).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveSpace} className="space-y-4 pt-2 text-xs">
              {/* Título do Espaço */}
              <div className="space-y-1">
                <Label className="text-slate-800 font-semibold">Nome / Título do Espaço *</Label>
                <Input
                  placeholder="Ex: Sala de Reunião Executiva ou Sala Compartilhada VIP"
                  value={spaceTitle}
                  onChange={(e) => setSpaceTitle(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  required
                />
              </div>

              {/* Tipo de Espaço */}
              <div className="space-y-1">
                <Label className="text-slate-800 font-semibold">Tipo de Espaço</Label>
                <select
                  value={spaceType}
                  onChange={(e) => setSpaceType(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="Sala de Reunião">🏢 Sala de Reunião</option>
                  <option value="Sala Compartilhada">💼 Sala Compartilhada (Coworking VIP)</option>
                  <option value="Auditório & Eventos">🎤 Auditório & Eventos</option>
                  <option value="Lounge Executivo">🛋️ Lounge & Networking</option>
                  <option value="Sede Geral">📍 Sede Geral & Fachada</option>
                </select>
              </div>

              {/* Upload de Foto */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <Label className="text-slate-800 font-semibold flex items-center justify-between">
                  <span>Foto Real do Local / Sala *</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG ou WebP</span>
                </Label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Box */}
                  <div className="w-full sm:w-44 h-28 rounded-xl border border-slate-300 bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                    {spacePhotoPreview ? (
                      <img
                        src={spacePhotoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : spacePhotoUrl ? (
                      <img
                        src={spacePhotoUrl}
                        alt="Preview URL"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                        <span className="text-[10px]">Sem foto</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 flex-1 w-full">
                    <input
                      type="file"
                      ref={spaceFileInputRef}
                      onChange={handleSpaceFileChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => spaceFileInputRef.current?.click()}
                        className="bg-[#0A1A33] hover:bg-[#102A56] text-white text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#F5D77F]" />
                        <span>Selecionar Arquivo</span>
                      </Button>

                      {spacePhotoFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setSpacePhotoFile(null)
                            setSpacePhotoPreview(
                              editingSpace?.photo
                                ? getFileUrl(
                                    'club_spaces_photos',
                                    editingSpace.id,
                                    editingSpace.photo,
                                  )
                                : '',
                            )
                            if (spaceFileInputRef.current) spaceFileInputRef.current.value = ''
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 py-1.5 px-2"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Envie uma foto nítida e bem iluminada do espaço.
                    </p>
                  </div>
                </div>

                {/* Ou URL Externa */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <Label className="text-[11px] text-slate-500">
                    Ou informe uma URL externa de imagem:
                  </Label>
                  <Input
                    placeholder="https://... (opcional)"
                    value={spacePhotoUrl}
                    onChange={(e) => setSpacePhotoUrl(e.target.value)}
                    className="text-xs bg-white border-slate-200 rounded-xl h-8"
                  />
                </div>
              </div>

              {/* Legenda / Detalhes */}
              <div className="space-y-1">
                <Label className="text-slate-800 font-semibold">Legenda / Detalhes do Espaço</Label>
                <Textarea
                  placeholder="Ex: Ambiente climatizado, mesa de reuniões para até 8 pessoas, TV de alta definição e internet de alta velocidade..."
                  value={spaceCaption}
                  onChange={(e) => setSpaceCaption(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  rows={3}
                />
              </div>

              {/* Ordem & Ativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Ordem na Galeria</Label>
                  <Input
                    type="number"
                    value={spaceOrder}
                    onChange={(e) => setSpaceOrder(e.target.value ? Number(e.target.value) : '')}
                    className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Status</Label>
                  <div className="flex items-center h-9">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={spaceActive}
                        onChange={(e) => setSpaceActive(e.target.checked)}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37] w-4 h-4"
                      />
                      <span>Ativo (exibir na galeria pública)</span>
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSpaceModalOpen(false)}
                  className="text-xs border-slate-200 text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingSpace}
                  className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-5 rounded-xl shadow-md"
                >
                  {isSavingSpace
                    ? 'Salvando...'
                    : editingSpace
                      ? 'Salvar Alterações'
                      : 'Cadastrar Foto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
