import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Megaphone,
  ArrowLeft,
  Send,
  Sparkles,
  AlertCircle,
  Calendar,
  MapPin,
  Globe,
  Upload,
  FileText,
  FileSpreadsheet,
  Video as VideoIcon,
  Image as ImageIcon,
  Trash2,
  Paperclip,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createDisclosure } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NewDisclosure() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [contactLink, setContactLink] = useState('')
  const [formatType, setFormatType] = useState<'presencial' | 'online' | 'hibrido'>('presencial')
  const [pricingType, setPricingType] = useState<'gratuito' | 'pago'>('gratuito')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Direct file attachment state
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 100 * 1024 * 1024) {
      toast.error('O arquivo selecionado excede o limite máximo permitido de 100MB.')
      return
    }

    setMediaFile(file)
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setMediaPreview(URL.createObjectURL(file))
    } else {
      setMediaPreview(null)
    }
  }

  const handleRemoveFile = () => {
    setMediaFile(null)
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileCategory = (file: File) => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf'
    if (
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel')
    ) {
      return 'excel'
    }
    return 'document'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Você precisa estar autenticado para enviar uma divulgação.')
      return
    }

    if (!title.trim() || !content.trim()) {
      toast.error('Título e descrição detalhada são obrigatórios.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('content', content.trim())
      formData.append('status', 'pending')
      formData.append('member', user.id)
      formData.append('format', formatType)
      formData.append('pricing', pricingType)

      if (eventDate) {
        formData.append('event_date', new Date(eventDate).toISOString())
      }
      if (eventLocation.trim()) {
        formData.append('event_location', eventLocation.trim())
      }
      if (contactLink.trim()) {
        formData.append('contact_link', contactLink.trim())
      }
      if (mediaFile) {
        formData.append('media', mediaFile)
      }

      await createDisclosure(formData)
      toast.success(
        'Divulgação enviada com sucesso! A diretoria irá avaliar e você receberá uma notificação assim que for aprovada.',
      )
      navigate('/divulgacoes')
    } catch (err: any) {
      toast.error('Erro ao enviar divulgação: ' + (err.message || 'Tente novamente mais tarde.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link
          to="/divulgacoes"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Divulgações
        </Link>
      </div>

      <Card className="border-slate-200/80 bg-white rounded-3xl shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Submissão para Membros VIP
          </div>
          <CardTitle className="text-2xl font-extrabold text-white">
            Cadastrar Divulgação de Evento / Parceria
          </CardTitle>
          <CardDescription className="text-slate-300 text-xs leading-relaxed">
            Preencha as informações do seu evento ou oportunidade de negócios. Todo o material passa
            pela moderação do Administrador/Master antes de ser publicado para o ecossistema.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Título da Divulgação *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Imersão Executiva em IA & Estratégia Comercial - Condição VIP"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm rounded-xl"
                required
              />
            </div>

            {/* Description / Content */}
            <div className="space-y-2">
              <Label
                htmlFor="content"
                className="text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Descrição Completa & Proposta de Valor *
              </Label>
              <Textarea
                id="content"
                placeholder="Detalhe o que é o evento/oportunidade, quem deve participar, qual benefício exclusivo para os membros do Edvanced Business Club e como funciona..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="text-sm rounded-xl leading-relaxed"
                required
              />
              <p className="text-[11px] text-slate-400">
                Seja claro e destaque a exclusividade ou relevância para os empresários do Club.
              </p>
            </div>

            {/* Format and Pricing Selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="formatType"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Formato do Evento *
                </Label>
                <select
                  id="formatType"
                  value={formatType}
                  onChange={(e) => setFormatType(e.target.value as any)}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="pricingType"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Cobrança / Acesso *
                </Label>
                <select
                  id="pricingType"
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value as any)}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="gratuito">Exclusivo para Membros (Incluso)</option>
                  <option value="pago">Pago / Com Inscrição</option>
                </select>
              </div>
            </div>

            {/* Date & Location Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="eventDate"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#8C6D07]" /> Data do Evento (se aplicável)
                </Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="text-sm rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="eventLocation"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#8C6D07]" /> Local / Plataforma
                </Label>
                <Input
                  id="eventLocation"
                  placeholder="Ex: Hotel Fasano / Zoom Online"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="text-sm rounded-xl"
                />
              </div>
            </div>

            {/* External Link */}
            <div className="space-y-2">
              <Label
                htmlFor="contactLink"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-[#8C6D07]" /> Link de Inscrição / Landing Page /
                WhatsApp
              </Label>
              <Input
                id="contactLink"
                type="url"
                placeholder="https://suaempresa.com.br/evento-edvanced"
                value={contactLink}
                onChange={(e) => setContactLink(e.target.value)}
                className="text-sm rounded-xl"
              />
            </div>

            {/* Direct File Attachment (Upload do Computador: Vídeo, Foto, Excel, PDF) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="file-upload"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <Paperclip className="w-4 h-4 text-[#8C6D07]" /> Anexo Direto do Computador
                  (Vídeo, Foto, Excel, PDF)
                </Label>
                <span className="text-[10px] font-semibold text-slate-400">
                  Opcional &bull; Até 100MB
                </span>
              </div>

              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/mpeg,image/jpeg,image/png,image/webp,image/gif,.pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
              />

              {!mediaFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#D4AF37] bg-white rounded-2xl p-6 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-50 group-hover:bg-[#D4AF37]/20 text-[#8C6D07] flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-[#8C6D07]">
                    Clique para selecionar um arquivo direto do seu computador
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formatos aceitos: <strong>Vídeos</strong> (.mp4, .webm, .mov),{' '}
                    <strong>Fotos</strong> (.jpg, .png, .webp), <strong>Planilhas Excel</strong>{' '}
                    (.xls, .xlsx) e <strong>PDFs</strong> (.pdf)
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D07] flex items-center justify-center flex-shrink-0">
                        {getFileCategory(mediaFile) === 'image' && (
                          <ImageIcon className="w-5 h-5 text-[#8C6D07]" />
                        )}
                        {getFileCategory(mediaFile) === 'video' && (
                          <VideoIcon className="w-5 h-5 text-rose-500" />
                        )}
                        {getFileCategory(mediaFile) === 'pdf' && (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                        {getFileCategory(mediaFile) === 'excel' && (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        )}
                        {getFileCategory(mediaFile) === 'document' && (
                          <FileText className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-bold text-slate-900 truncate"
                          title={mediaFile.name}
                        >
                          {mediaFile.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFileSize(mediaFile.size)} &bull;{' '}
                          {getFileCategory(mediaFile) === 'image' && 'Foto / Imagem'}
                          {getFileCategory(mediaFile) === 'video' && 'Vídeo'}
                          {getFileCategory(mediaFile) === 'pdf' && 'Documento PDF'}
                          {getFileCategory(mediaFile) === 'excel' && 'Planilha Excel (.xlsx/.xls)'}
                          {getFileCategory(mediaFile) === 'document' && 'Documento'}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                    </Button>
                  </div>

                  {/* Previews for Images and Videos */}
                  {mediaPreview && getFileCategory(mediaFile) === 'image' && (
                    <div className="rounded-xl overflow-hidden bg-slate-900/5 max-h-56 flex items-center justify-center border border-slate-100">
                      <img
                        src={mediaPreview}
                        alt="Preview do anexo"
                        className="max-h-56 w-auto object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {mediaPreview && getFileCategory(mediaFile) === 'video' && (
                    <div className="rounded-xl overflow-hidden bg-black max-h-64 flex items-center justify-center border border-slate-800">
                      <video
                        src={mediaPreview}
                        controls
                        className="max-h-64 w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold">Diretrizes de Divulgação:</p>
                <p className="mt-0.5">
                  Todas as divulgações são moderadas por Ediane Dal Bosco e pela diretoria do Club
                  para garantir a máxima qualidade e relevância do ecossistema.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link to="/divulgacoes">
                <Button type="button" variant="outline" className="text-xs rounded-xl">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold uppercase tracking-wider text-xs px-6 py-2.5 rounded-xl shadow-md shadow-[#D4AF37]/20 flex items-center gap-2"
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Enviar para Aprovação
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
