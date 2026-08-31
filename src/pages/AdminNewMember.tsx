import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  UserPlus,
  Crown,
  ShieldCheck,
  Building,
  Mail,
  Lock,
  Phone,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Instagram,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createMemberByAdmin } from '@/services/api'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { formatPhone, normalizePhone } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminNewMember() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Skip@Pass')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Nome completo e e-mail corporativo são obrigatórios.')
      return
    }

    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setIsLoading(true)
    try {
      await createMemberByAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        company: company.trim(),
        phone: normalizePhone(phone),
        instagram: instagram.trim(),
        bio: bio.trim(),
      })

      toast.success(`Membro "${name.trim()}" cadastrado com sucesso no Edvanced Business Club!`)
      navigate('/membros')
    } catch (err: any) {
      console.error('Erro ao cadastrar membro:', err)
      const fieldErrors = extractFieldErrors(err)
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        const details = Object.entries(fieldErrors)
          .map(([f, msg]) => {
            const fieldNameMap: Record<string, string> = {
              email: 'E-mail',
              password: 'Senha',
              passwordConfirm: 'Confirmação de Senha',
              name: 'Nome',
              role: 'Nível',
              status: 'Status',
            }
            return `${fieldNameMap[f] || f}: ${msg}`
          })
          .join(' | ')
        toast.error(`Erro ao cadastrar membro: ${details}`)
      } else {
        const errorMsg = getErrorMessage(err)
        if (
          errorMsg.toLowerCase().includes('unique') ||
          errorMsg.toLowerCase().includes('already in use') ||
          errorMsg.toLowerCase().includes('exist')
        ) {
          toast.error('Este e-mail já está cadastrado no sistema. Use outro endereço.')
        } else {
          toast.error(`Erro ao cadastrar membro: ${errorMsg || 'Verifique os dados informados.'}`)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/membros"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Diretório de Membros
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#061224] via-[#0A1E3F] to-[#061224] border border-[#061224]/80 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F5D77F] text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          Área Restrita da Diretoria
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <UserPlus className="w-7 h-7 text-[#D4AF37]" />
          Cadastro Exclusivo de Novo Membro
        </h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
          Somente administradores autorizados podem admitir novos líderes, empresários e
          investidores na plataforma do Edvanced Business Club.
        </p>
      </div>

      {/* Form Card */}
      <Card className="border-slate-200/80 shadow-md bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-900">
            Dados do Novo Associado
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Preencha os dados cadastrais e as credenciais provisórias de acesso.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="member-name" className="text-xs font-semibold text-slate-700">
                  Nome Completo *
                </Label>
                <div className="relative">
                  <Input
                    id="member-name"
                    type="text"
                    placeholder="Ex: Dra. Mariana Vasconcellos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="member-email" className="text-xs font-semibold text-slate-700">
                  E-mail Corporativo *
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="mariana@holdinginvest.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Senha Inicial */}
              <div className="space-y-1.5">
                <Label htmlFor="member-pass" className="text-xs font-semibold text-slate-700">
                  Senha Inicial de Acesso *
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="member-pass"
                    type="text"
                    placeholder="Mínimo 8 caracteres (Padrão: Skip@Pass)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs rounded-xl font-mono"
                    minLength={8}
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  O membro poderá alterar esta senha no primeiro login.
                </p>
              </div>

              {/* Nível de Acesso (Role) */}
              <div className="space-y-1.5">
                <Label htmlFor="member-role" className="text-xs font-semibold text-slate-700">
                  Nível de Permissão
                </Label>
                <Select value={role} onValueChange={(val: 'member' | 'admin') => setRole(val)}>
                  <SelectTrigger id="member-role" className="text-xs rounded-xl bg-white">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member" className="text-xs">
                      Membro VIP (Associado Padrão)
                    </SelectItem>
                    <SelectItem value="admin" className="text-xs font-bold text-[#8C6D07]">
                      Administrador (Acesso e Gestão Plena)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Empresa */}
              <div className="space-y-1.5">
                <Label htmlFor="member-company" className="text-xs font-semibold text-slate-700">
                  Empresa / Holding / Cargo
                </Label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="member-company"
                    type="text"
                    placeholder="Ex: Vasconcellos Equity Partners (CEO)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-1.5">
                <Label htmlFor="member-phone" className="text-xs font-semibold text-slate-700">
                  WhatsApp / Contato Direto
                </Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="member-phone"
                    type="tel"
                    placeholder="(65) 98100-3969"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    maxLength={15}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="member-instagram" className="text-xs font-semibold text-slate-700">
                  Instagram (Handle ou Perfil)
                </Label>
                <div className="relative">
                  <Instagram className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  <Input
                    id="member-instagram"
                    type="text"
                    placeholder="Ex: @mariana.vasconcellos ou https://instagram.com/mariana.vasconcellos"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Minibiografia / Perfil */}
            <div className="space-y-1.5">
              <Label htmlFor="member-bio" className="text-xs font-semibold text-slate-700">
                Minibiografia Executiva / Especialidades
              </Label>
              <Textarea
                id="member-bio"
                placeholder="Ex: Especialista em expansão de franquias, investimentos em venture capital e governança corporativa com mais de 15 anos de atuação no mercado..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="text-xs rounded-xl"
                rows={3}
              />
              <p className="text-[10px] text-slate-400">
                Esta descrição aparecerá no Diretório Executivo para conexão com outros membros.
              </p>
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                O membro será ativado imediatamente e constará na lista pública do club.
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/membros')}
                  className="w-full sm:w-auto text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold tracking-wider uppercase text-xs py-2.5 px-6 rounded-xl shadow-md shadow-[#D4AF37]/20"
                >
                  {isLoading ? 'Cadastrando...' : 'Confirmar & Admitir Membro'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
