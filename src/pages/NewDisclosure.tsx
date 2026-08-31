import { useState } from 'react'
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
