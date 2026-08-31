import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  CalendarDays,
  Users,
  Megaphone,
  Mic,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileText,
  Compass,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Welcome() {
  const { user, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStart = async () => {
    setIsSubmitting(true)
    try {
      await completeOnboarding()
      toast.success('Onboarding concluído com sucesso! Bem-vindo(a) à sua área exclusiva.')
      navigate('/', { replace: true })
    } catch (err: any) {
      console.error('Erro ao concluir onboarding:', err)
      toast.error('Erro ao registrar conclusão. Tentando acessar dashboard...')
      navigate('/', { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  // First name or full name for warm greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'Associado(a)'

  const features = [
    {
      icon: CalendarDays,
      title: 'Encontros & Materiais Exclusivos',
      badge: 'Acervo Premium',
      description:
        'Acesse gravações em alta definição, fotos oficiais dos eventos, apresentações executivas e documentos estratégicos de cada encontro do Club.',
    },
    {
      icon: Users,
      title: 'Diretório Executivo de Membros',
      badge: 'Networking VIP',
      description:
        'Conecte-se diretamente com fundadores, líderes de mercado, investidores e empresários que integram nosso ecossistema de alto valor.',
    },
    {
      icon: Megaphone,
      title: 'Mural de Divulgações & Oportunidades',
      badge: 'Geração de Negócios',
      description:
        'Divulgue seus eventos parceiros, oportunidades de investimento, rodadas e produtos para toda a comunidade com curadoria da diretoria.',
    },
    {
      icon: Mic,
      title: 'EdvancedCast & Conteúdos Estratégicos',
      badge: 'Podcast & Insights',
      description:
        'Acompanhe entrevistas completas, episódios especiais e discussões profundas com as maiores referências em gestão e inovação.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061020] via-[#0A1A33] to-[#040B16] text-slate-100 flex flex-col justify-between selection:bg-[#D4AF37]/30 selection:text-white py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#D4AF37]/15 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-[#D4AF37]/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full relative z-10 my-auto space-y-8 md:space-y-10">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#D4AF37]/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Primeiro Acesso VIP</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#8C6D07] p-[2px] shadow-2xl shadow-[#D4AF37]/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0A1E3F] rounded-[14px] flex items-center justify-center">
                <Crown className="w-7 h-7 text-[#D4AF37] fill-[#D4AF37]/20" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Seja muito bem-vindo(a),{' '}
              <span className="bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#E5C158] bg-clip-text text-transparent">
                {firstName}!
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Você agora tem acesso exclusivo à plataforma oficial do{' '}
              <strong className="text-white font-semibold">Edvanced Business Club</strong>. Um
              espaço pensado para impulsionar conexões de alto escalão, troca de inteligência e
              geração de novos negócios.
            </p>
          </div>

          {user?.company && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#061020]/80 border border-slate-800 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                Associado representando: <strong className="text-[#F5D77F]">{user.company}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card
                key={idx}
                className="bg-[#0A1E3F]/80 backdrop-blur-md border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 transition-all duration-300 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/10 group"
              >
                <CardContent className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/40 text-[#F5D77F] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4AF37] bg-[#061020]/80 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#F5D77F] transition-colors leading-snug">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Call to action box */}
        <div className="rounded-3xl bg-gradient-to-r from-[#061020] via-[#0A1E3F] to-[#061020] border border-[#D4AF37]/40 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Ambiente 100% Seguro & Privado</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Comunidade Curada pela Diretoria</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span>Acesso Imediato ao Catálogo</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={handleStart}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#B89324] hover:from-[#FBE39D] hover:to-[#A37E17] text-slate-950 font-black tracking-wider uppercase text-xs sm:text-sm py-6 px-10 rounded-2xl shadow-xl shadow-[#D4AF37]/30 hover:scale-105 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span>
                {isSubmitting ? 'Preparando seu acesso...' : 'Começar & Acessar Minha Área'}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-[11px] text-slate-400">
            Ao clicar, seu acesso inicial será confirmado e você será direcionado ao Dashboard do
            Club.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center pt-6 relative z-10 text-[11px] text-slate-500">
        <p>
          EDVANCED BUSINESS CLUB &copy; {new Date().getFullYear()} &bull; Todos os direitos
          reservados
        </p>
      </footer>
    </div>
  )
}
