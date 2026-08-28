import { useState, useRef, useEffect } from 'react'
import {
  User as UserIcon,
  Crown,
  Building,
  Mail,
  Phone,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Save,
  Trash2,
  Instagram,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile, getFileUrl } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function Profile() {
  const { user, isAdmin, refreshUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setCompany(user.company || '')
      setPhone(user.phone || '')
      setInstagram(user.instagram || '')
      setBio(user.bio || '')
      if (user.avatar) {
        setAvatarPreview(getFileUrl('users', user.id, user.avatar))
      } else {
        setAvatarPreview(null)
      }
    }
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem de perfil deve ter no máximo 5MB.')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!name.trim()) {
      toast.error('O nome é obrigatório.')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('company', company.trim())
      formData.append('phone', phone.trim())
      formData.append('instagram', instagram.trim())
      formData.append('bio', bio.trim())

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      } else if (avatarPreview === null && user.avatar) {
        // Pocketbase clears file when empty string sent
        formData.append('avatar', '')
      }

      await updateProfile(user.id, formData)
      await refreshUser()
      toast.success('Seus dados e foto de perfil foram atualizados com sucesso!')
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err)
      toast.error('Erro ao salvar alterações: ' + (err.message || 'Tente novamente.'))
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (userName?: string) => {
    if (!userName) return 'EB'
    return userName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const formattedInstagramLink = (handle?: string) => {
    if (!handle) return ''
    const clean = handle.replace(/^@/, '').trim()
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean
    }
    return `https://instagram.com/${clean}`
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#03151B] via-[#06242E] to-[#03151B] border border-teal-950/80 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 md:w-24 md:h-24 ring-4 ring-[#D4AF37]/50 shadow-xl">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={user.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#8C6D07] text-slate-950 font-black text-xl md:text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#D4AF37] text-slate-950 hover:bg-[#F5D77F] shadow-lg transition-transform hover:scale-110"
                title="Alterar foto de perfil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F5D77F] text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  {isAdmin ? 'Master & Administrador' : 'Membro Executivo VIP'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {user.name}
              </h1>
              <p className="text-xs md:text-sm text-slate-300">
                {user.company || 'Edvanced Business Club'} &bull; {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-[#D4AF37] text-slate-950 font-bold uppercase text-xs px-3 py-1">
              Perfil Ativo
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <Card className="border-slate-200/80 shadow-md bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#8C6D07]" />
            Editar Dados Cadastrais & Perfil
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Atualize suas informações executivas, foto e canais de contato. Elas serão exibidas no
            Diretório de Membros do Club.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto de Perfil Upload Section */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Foto de Perfil Oficial
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <Avatar className="w-20 h-20 ring-2 ring-[#D4AF37]/40 shadow-md flex-shrink-0">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt={name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#8C6D07] text-slate-950 font-bold text-lg">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold rounded-xl border-slate-300 hover:bg-[#D4AF37] hover:text-slate-950"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      {avatarPreview ? 'Substituir Foto' : 'Escolher Foto'}
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Formatos recomendados: JPG, PNG ou WEBP em formato quadrado (até 5MB).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome Completo */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-name" className="text-xs font-semibold text-slate-700">
                  Nome Completo *
                </Label>
                <div className="relative">
                  <Input
                    id="profile-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* E-mail (read-only for security) */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="text-xs font-semibold text-slate-700">
                  E-mail Corporativo (Identificador)
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    disabled
                    className="pl-9 text-xs rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Para alterar seu e-mail de acesso, entre em contato com a Diretoria.
                </p>
              </div>

              {/* Empresa / Cargo */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-company" className="text-xs font-semibold text-slate-700">
                  Empresa / Holding / Cargo
                </Label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="profile-company"
                    type="text"
                    placeholder="Ex: Holding Investimentos (Fundador & CEO)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* WhatsApp / Contato Direto */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone" className="text-xs font-semibold text-slate-700">
                  WhatsApp / Telefone Direto
                </Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="profile-phone"
                    type="text"
                    placeholder="+55 (11) 99999-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Instagram (Novo Campo) */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="profile-instagram" className="text-xs font-semibold text-slate-700">
                  Instagram Executivo / Pessoal (Handle ou Link)
                </Label>
                <div className="relative">
                  <Instagram className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  <Input
                    id="profile-instagram"
                    type="text"
                    placeholder="Ex: @elianedalbosco ou https://instagram.com/elianedalbosco"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
                {instagram && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <span>Link gerado:</span>
                    <a
                      href={formattedInstagramLink(instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8C6D07] font-semibold underline truncate max-w-md"
                    >
                      {formattedInstagramLink(instagram)}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Minibiografia / Especialidades */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-bio" className="text-xs font-semibold text-slate-700">
                Minibiografia Executiva & Áreas de Atuação
              </Label>
              <Textarea
                id="profile-bio"
                placeholder="Conte brevemente sobre sua trajetória executiva, investimentos, segmentos em que atua e tipos de conexões que busca no Club..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="text-xs rounded-xl leading-relaxed"
                rows={4}
              />
              <p className="text-[10px] text-slate-400">
                Apresentação visível para os outros empresários no Diretório de Membros.
              </p>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                As alterações são salvas imediatamente no sistema.
              </p>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold uppercase tracking-wider text-xs py-2.5 px-6 rounded-xl shadow-md shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Salvando Alterações...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
