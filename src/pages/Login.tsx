import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Crown, Lock, Mail, User, Building, Phone, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function Login() {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regCompany, setRegCompany] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regBio, setRegBio] = useState('')

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
      toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regEmail || !regPassword || !regName) {
      toast.error('Nome, e-mail e senha são obrigatórios.')
      return
    }
    setIsLoading(true)
    try {
      await signup({
        name: regName,
        email: regEmail,
        password: regPassword,
        company: regCompany,
        phone: regPhone,
        bio: regBio,
      })
      toast.success('Cadastro realizado com sucesso! Bem-vindo(a) ao Club!')
      navigate(from, { replace: true })
    } catch (err: any) {
      toast.error('Erro ao realizar cadastro: ' + (err.message || 'Verifique os dados informados.'))
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
            <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-slate-50 p-0 h-12">
              <TabsTrigger
                value="login"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:bg-white data-[state=active]:font-bold text-xs uppercase tracking-wider"
              >
                Acessar Conta
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:bg-white data-[state=active]:font-bold text-xs uppercase tracking-wider"
              >
                Novo Membro
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="p-6 pt-4">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg">Credenciais VIP</CardTitle>
                <CardDescription className="text-xs">
                  Insira seus dados para acessar o acervo de encontros e divulgações.
                </CardDescription>
              </CardHeader>
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
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="p-6 pt-4">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg">Cadastro de Membro</CardTitle>
                <CardDescription className="text-xs">
                  Crie sua conta no ecossistema de empresários do Edvanced.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="reg-name" className="text-xs">
                    Nome Completo *
                  </Label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Ex: Ana Paula Martins"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="pl-8 text-xs h-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-email" className="text-xs">
                    E-mail *
                  </Label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="ana@suaempresa.com.br"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="pl-8 text-xs h-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-pass" className="text-xs">
                    Senha (mínimo 8 caracteres) *
                  </Label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="reg-pass"
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-8 text-xs h-9"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="reg-company" className="text-xs">
                      Empresa
                    </Label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="reg-company"
                        type="text"
                        placeholder="Nome da empresa"
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-phone" className="text-xs">
                      WhatsApp / Tel
                    </Label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="reg-phone"
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold tracking-wider uppercase text-xs py-2.5 shadow-md shadow-[#D4AF37]/20"
                >
                  {isLoading ? 'Cadastrando...' : 'Concluir Cadastro'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
