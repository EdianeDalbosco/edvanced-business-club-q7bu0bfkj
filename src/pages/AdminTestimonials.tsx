import React, { useState, useEffect, useRef } from 'react'
import {
  Quote,
  Plus,
  Edit2,
  Trash2,
  Star,
  Sparkles,
  Search,
  Upload,
  X,
  CheckCircle2,
  Building2,
  Crown,
  Eye,
  ArrowUpDown,
} from 'lucide-react'
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getFileUrl,
} from '@/services/api'
import type { Testimonial } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [authorName, setAuthorName] = useState('')
  const [authorRole, setAuthorRole] = useState('')
  const [company, setCompany] = useState('')
  const [content, setContent] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [rating, setRating] = useState<number>(5)
  const [order, setOrder] = useState<number | ''>(1)
  const [featured, setFeatured] = useState<boolean>(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getTestimonials()
      setTestimonials(data)
    } catch (err) {
      console.error('Erro ao carregar depoimentos:', err)
      toast.error('Não foi possível carregar os depoimentos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenNew = () => {
    setEditingItem(null)
    setAuthorName('')
    setAuthorRole('')
    setCompany('')
    setContent('')
    setAvatarUrl('')
    setAvatarFile(null)
    setAvatarPreview('')
    setRating(5)
    setOrder(testimonials.length + 1)
    setFeatured(true)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Testimonial) => {
    setEditingItem(item)
    setAuthorName(item.author_name || '')
    setAuthorRole(item.author_role || '')
    setCompany(item.company || '')
    setContent(item.content || '')
    setAvatarUrl(item.avatar_url || '')
    setAvatarFile(null)
    setAvatarPreview(item.avatar ? getFileUrl('testimonials', item.id, item.avatar) : '')
    setRating(item.rating || 5)
    setOrder(item.order ?? 1)
    setFeatured(item.featured ?? false)
    setModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authorName.trim() || !content.trim()) {
      toast.error('Nome do membro e texto do depoimento são obrigatórios.')
      return
    }

    setIsSaving(true)
    try {
      if (avatarFile) {
        const formData = new FormData()
        formData.append('author_name', authorName.trim())
        formData.append('author_role', authorRole.trim())
        formData.append('company', company.trim())
        formData.append('content', content.trim())
        if (avatarUrl.trim()) formData.append('avatar_url', avatarUrl.trim())
        formData.append('rating', String(rating))
        if (typeof order === 'number') formData.append('order', String(order))
        formData.append('featured', String(featured))
        formData.append('avatar', avatarFile)

        if (editingItem) {
          await updateTestimonial(editingItem.id, formData)
          toast.success('Depoimento atualizado com sucesso!')
        } else {
          await createTestimonial(formData)
          toast.success('Depoimento cadastrado com sucesso!')
        }
      } else {
        const data: Partial<Testimonial> = {
          author_name: authorName.trim(),
          author_role: authorRole.trim() || undefined,
          company: company.trim() || undefined,
          content: content.trim(),
          avatar_url: avatarUrl.trim() || undefined,
          rating,
          order: typeof order === 'number' ? order : 1,
          featured,
        }

        if (editingItem) {
          await updateTestimonial(editingItem.id, data)
          toast.success('Depoimento atualizado com sucesso!')
        } else {
          await createTestimonial(data)
          toast.success('Depoimento cadastrado com sucesso!')
        }
      }

      setModalOpen(false)
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao salvar depoimento: ' + (err.message || 'Tente novamente.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: Testimonial) => {
    if (!window.confirm(`Tem certeza que deseja excluir o depoimento de "${item.author_name}"?`)) {
      return
    }

    try {
      await deleteTestimonial(item.id)
      toast.success('Depoimento excluído com sucesso.')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao excluir depoimento: ' + err.message)
    }
  }

  const getAvatarSrc = (item: Testimonial) => {
    if (item.avatar) {
      return getFileUrl('testimonials', item.id, item.avatar)
    }
    if (item.avatar_url) {
      return item.avatar_url
    }
    return ''
  }

  const filteredTestimonials = testimonials.filter((t) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      t.author_name?.toLowerCase().includes(q) ||
      t.company?.toLowerCase().includes(q) ||
      t.author_role?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#061020] via-[#0A1A33] to-[#061020] border border-[#061020]/80 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-semibold uppercase tracking-wider mb-2">
              <Quote className="w-3.5 h-3.5 text-[#D4AF37]" />
              Gestão da Página Pública
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Depoimentos de Membros
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1">
              Cadastre, edite e organize os depoimentos de líderes e membros do Edvanced Business
              Club que aparecem na seção de exclusividade da área pública.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenNew}
              className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Depoimento
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, empresa ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Total cadastrado:</span>
          <Badge variant="outline" className="border-[#D4AF37] text-[#8C6D07] font-bold">
            {testimonials.length} depoimento(s)
          </Badge>
        </div>
      </div>

      {/* Testimonials Grid */}
      {filteredTestimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((item) => {
            const avatarSrc = getAvatarSrc(item)

            return (
              <Card
                key={item.id}
                className="group relative border border-slate-200 hover:border-[#D4AF37] bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar: Stars + Featured Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.featured && (
                        <Badge className="bg-[#D4AF37]/15 text-[#8C6D07] border border-[#D4AF37]/40 text-[9px] font-bold uppercase">
                          Destaque
                        </Badge>
                      )}
                      {typeof item.order === 'number' && (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                          Ordem #{item.order}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quote Content */}
                  <div className="relative">
                    <Quote className="w-8 h-8 text-[#D4AF37]/20 absolute -top-2 -left-1" />
                    <p className="text-xs text-slate-700 leading-relaxed italic relative z-10 pl-5">
                      "{item.content}"
                    </p>
                  </div>

                  {/* Member Profile */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <Avatar className="w-11 h-11 ring-2 ring-[#D4AF37]/40">
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
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {item.author_name}
                      </h4>
                      {item.author_role && (
                        <p className="text-[11px] text-[#8C6D07] font-semibold truncate">
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
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="h-8 text-xs border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-xl"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-[#8C6D07]" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item)}
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
          <Quote className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum depoimento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cadastre os depoimentos de membros para valorizar a exclusividade e autoridade do Club
            na página pública.
          </p>
          <Button
            onClick={handleOpenNew}
            className="bg-[#0A1A33] hover:bg-[#102A56] text-white font-bold text-xs mt-2 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Cadastrar Primeiro Depoimento
          </Button>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D4AF37] text-slate-950 uppercase font-black text-[9px] tracking-wider">
                  Área Pública & Prova Social
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingItem ? 'Editar Depoimento' : 'Novo Depoimento de Membro'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Preencha os dados do membro, empresa e o relato sobre a experiência no Edvanced
                Business Club.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
              {/* Nome do Membro */}
              <div className="space-y-1">
                <Label className="text-slate-800 font-semibold">Nome do Membro *</Label>
                <Input
                  placeholder="Ex: Dr. Roberto Alcantara"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  required
                />
              </div>

              {/* Cargo e Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Cargo / Função</Label>
                  <Input
                    placeholder="Ex: CEO & Founder ou Conselheiro"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Empresa / Grupo</Label>
                  <Input
                    placeholder="Ex: Alcantara Participações"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Texto do Depoimento */}
              <div className="space-y-1">
                <Label className="text-slate-800 font-semibold">Texto do Depoimento *</Label>
                <Textarea
                  placeholder="Escreva a avaliação do membro sobre o ecossistema, os eventos, a governança ou as oportunidades geradas..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  rows={4}
                  required
                />
              </div>

              {/* Upload de Foto / Avatar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <Label className="text-slate-800 font-semibold flex items-center justify-between">
                  <span>Foto do Membro (Opcional)</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG ou WebP</span>
                </Label>

                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-[#D4AF37]/50 flex-shrink-0">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Preview" className="object-cover" />
                    ) : avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Preview URL" className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-[#0A1A33] text-[#F5D77F] font-bold text-base">
                      {authorName ? authorName.charAt(0).toUpperCase() : 'M'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2 flex-1">
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
                        className="bg-[#0A1A33] hover:bg-[#102A56] text-white text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#F5D77F]" />
                        <span>Upload de Foto</span>
                      </Button>

                      {avatarFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setAvatarFile(null)
                            setAvatarPreview(
                              editingItem?.avatar
                                ? getFileUrl('testimonials', editingItem.id, editingItem.avatar)
                                : '',
                            )
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 py-1.5 px-2"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Caso não faça upload, você pode informar uma URL externa abaixo ou deixar com
                      o ícone executivo padrão.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <Input
                    placeholder="Ou URL de imagem: https://... (opcional)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="text-xs bg-white border-slate-200 rounded-xl h-8"
                  />
                </div>
              </div>

              {/* Avaliação (Estrelas), Ordem e Destaque */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Avaliação (1 a 5 estrelas)</Label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Estrelas</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Estrelas</option>
                    <option value={3}>⭐⭐⭐ 3 Estrelas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Ordem de Exibição</Label>
                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value ? Number(e.target.value) : '')}
                    className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-800 font-semibold">Exibir na Página?</Label>
                  <div className="flex items-center h-9">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37] w-4 h-4"
                      />
                      <span>Sim, ativo em destaque</span>
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="text-xs border-slate-200 text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FFF0B8] hover:to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider px-5 rounded-xl shadow-md"
                >
                  {isSaving
                    ? 'Salvando...'
                    : editingItem
                      ? 'Salvar Alterações'
                      : 'Cadastrar Depoimento'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
