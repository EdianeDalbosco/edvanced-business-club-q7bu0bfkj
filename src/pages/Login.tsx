import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Crown,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Info,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Por favor, preencha seu e-mail e senha.')
      return
    }
    setIsLoading(true)
    try {
      await login(loginEmail, loginPassword)
      toast.success('Bem-vindo(a) ao Edvanced Business Club!')
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg = err?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const fillAdmin = () => {
    setLoginEmail('edianedalbosco@gmail.com')
    setLoginPassword('Skip@Pass')
  }

  const fillMember = () => {
    setLoginEmail('ricardo@alcantarainvest.com.br')
    setLoginPassword('Skip@Pass')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#8C6D07] p-[2px] shadow-xl shadow-[#D4AF37]/20 items-center justify-center">
            <div className="w-full h-full bg-[#06242E] rounded-[14px] flex items-center justify-center">
              <Crown className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            EDVANCED <span className="text-[#B89324]">BUSINESS CLUB</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Portal Executivo Exclusivo
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-slate-200/80 shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-900">Acessar Conta VIP</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Insira suas credenciais corporativas para acessar o acervo de encontros e divulgações.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">E-mail corporativo</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Senha de acesso</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold tracking-wider uppercase text-xs py-2.5 shadow-md shadow-[#D4AF37]/20"
              >
                {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Link para a Área Pública sem login (Eventos abertos & EdvancedCast) */}
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#06242E] to-[#0A3340] text-white border border-[#D4AF37]/40 shadow-sm text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#F5D77F]">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                <span>Página Pública Aberta</span>
              </div>
              <p className="text-[11px] text-teal-100/80 leading-relaxed">
                Quer ver a agenda de eventos abertos e assistir aos episódios do EdvancedCast?
              </p>
              <Link
                to="/publico"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#F5D77F] text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-xs"
              >
                <span>Acessar Página Pública</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Notice about exclusive membership admission */}
            <div className="mt-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-[#8C6D07] flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <p className="font-semibold text-[#8C6D07]">Clube Exclusivo para Convidados</p>
                <p className="text-[11px] text-slate-600">
                  O cadastro de novos membros é restrito à administração do Club. Para solicitar
                  admissão, entre em contato com a curadoria.
                </p>
              </div>
            </div>

            {/* Demo Quick Logins */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
                Acesso rápido para testes
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillAdmin}
                  className="text-[11px] border-[#D4AF37]/60 text-slate-800 hover:bg-[#D4AF37]/10 flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Admin (Ediane)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillMember}
                  className="text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Membro (Ricardo)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
