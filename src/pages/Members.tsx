import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  Mail,
  Phone,
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Crown,
  UserPlus,
  Instagram,
  User as UserIcon,
  Edit2,
  Ban,
  CheckCircle,
  AlertTriangle,
  Lock,
  UserX,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMembers, getFileUrl, updateUserByAdmin, toggleMemberSuspension } from '@/services/api'
import type { User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function Members() {
  const { user: currentUser, isAdmin } = useAuth()
  const [members, setMembers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'active' | 'suspended'>('todos')
  const [isLoading, setIsLoading] = useState(true)

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editInstagram, setEditInstagram] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member')
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active')
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Suspend/Reactivate confirmation modal
  const [confirmSuspendMember, setConfirmSuspendMember] = useState<User | null>(null)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const list = await getMembers()
      setMembers(list)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      m.name?.toLowerCase().includes(q) ||
      m.company?.toLowerCase().includes(q) ||
      m.instagram?.toLowerCase().includes(q) ||
      m.bio?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)

    if (!matchSearch) return false

    if (statusFilter === 'active' && m.status === 'suspended') return false
    if (statusFilter === 'suspended' && m.status !== 'suspended') return false

    return true
  })

  // Open Edit Modal
  const handleOpenEdit = (member: User) => {
    setEditingMember(member)
    setEditName(member.name || '')
    setEditCompany(member.company || '')
    setEditPhone(member.phone || '')
    setEditInstagram(member.instagram || '')
    setEditBio(member.bio || '')
    setEditRole(member.role || 'member')
    setEditStatus(member.status || 'active')
    setEditAvatarFile(null)
    if (member.avatar) {
      setEditAvatarPreview(getFileUrl('users', member.id, member.avatar))
    } else {
      setEditAvatarPreview('')
    }
  }

  // Save Member Changes
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    if (!editName.trim()) {
      toast.error('O nome do membro é obrigatório.')
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', editName.trim())
      formData.append('company', editCompany.trim())
      formData.append('phone', editPhone.trim())
      formData.append('instagram', editInstagram.trim())
      formData.append('bio', editBio.trim())
      formData.append('role', editRole)
      formData.append('status', editStatus)

      if (editAvatarFile) {
        formData.append('avatar', editAvatarFile)
      }

      await updateUserByAdmin(editingMember.id, formData)
      toast.success(`Dados do membro "${editName}" atualizados com sucesso!`)
      setEditingMember(null)
      await loadMembers()
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao atualizar membro: ' + (err.message || 'Tente novamente.'))
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle Suspend Status directly
  const handleConfirmToggleSuspension = async () => {
    if (!confirmSuspendMember) return
    setIsTogglingStatus(true)
    try {
      const isCurrentlySuspended = confirmSuspendMember.status === 'suspended'
      await toggleMemberSuspension(confirmSuspendMember.id, confirmSuspendMember.status)
      toast.success(
        isCurrentlySuspended
          ? `Membro "${confirmSuspendMember.name}" reativado com sucesso!`
          : `Acesso do membro "${confirmSuspendMember.name}" suspenso.`,
      )
      setConfirmSuspendMember(null)
      await loadMembers()
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao alterar status do membro: ' + (err.message || 'Tente novamente.'))
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'MB'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const formatInstagramLink = (handle?: string) => {
    if (!handle) return ''
    const clean = handle.replace(/^@/, '').trim()
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean
    }
    return `https://instagram.com/${clean}`
  }

  const formatInstagramDisplay = (handle?: string) => {
    if (!handle) return ''
    let clean = handle.trim()
    if (clean.includes('instagram.com/')) {
      clean = clean.split('instagram.com/')[1].replace(/\/$/, '')
    }
    return clean.startsWith('@') ? clean : `@${clean}`
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#8C6D07] text-xs font-semibold uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
            Rede Exclusiva VIP
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Diretório de Membros & Empresários
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Conheça os líderes, fundadores e investidores que fazem parte do ecossistema Edvanced
            Business Club.
          </p>
        </div>

        {isAdmin && (
          <div className="flex-shrink-0">
            <Link to="/admin/membros/novo">
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 shadow-md shadow-[#D4AF37]/20 rounded-xl">
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Novo Membro
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, empresa ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden"
            >
              <option value="todos">Todos os Status</option>
              <option value="active">Apenas Ativos</option>
              <option value="suspended">Apenas Suspensos</option>
            </select>
          )}

          <span className="text-xs text-slate-400 font-medium whitespace-nowrap pl-2">
            {filteredMembers.length} membro(s)
          </span>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => {
          const isMemberAdmin =
            member.role === 'admin' || member.email === 'edianedalbosco@gmail.com'
          const isSuspended = member.status === 'suspended'
          const isMe = currentUser?.id === member.id

          return (
            <Card
              key={member.id}
              className={`border bg-white rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                isSuspended ? 'border-rose-200/80 bg-rose-50/15' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                  <Avatar
                    className={`w-14 h-14 ring-2 flex-shrink-0 ${isSuspended ? 'ring-rose-300 opacity-70' : 'ring-[#D4AF37]/40'}`}
                  >
                    {member.avatar ? (
                      <AvatarImage
                        src={getFileUrl('users', member.id, member.avatar)}
                        alt={member.name}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback
                      className={`text-slate-950 font-bold text-base ${isSuspended ? 'bg-slate-300' : 'bg-gradient-to-br from-[#D4AF37] to-[#8C6D07]'}`}
                    >
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-bold text-base truncate transition-colors ${isSuspended ? 'text-slate-500 line-through' : 'text-slate-900 group-hover:text-[#8C6D07]'}`}
                      >
                        {member.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {isMemberAdmin ? (
                        <Badge className="bg-[#D4AF37] text-slate-950 font-bold text-[9px] uppercase tracking-wider">
                          <Crown className="w-3 h-3 mr-1 inline" /> Fundadora & Master
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-600 text-[9px] uppercase tracking-wider"
                        >
                          Membro VIP
                        </Badge>
                      )}

                      {/* Status Badge */}
                      {isSuspended ? (
                        <Badge className="bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider shadow-xs animate-pulse">
                          <Ban className="w-3 h-3 mr-1 inline" /> Suspenso
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 text-[9px] uppercase tracking-wider font-bold">
                          <CheckCircle className="w-3 h-3 mr-1 inline" /> Ativo
                        </Badge>
                      )}
                    </div>

                    {member.company && (
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-[#8C6D07] flex-shrink-0" />
                        <span className="truncate">{member.company}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4 text-xs text-slate-600">
                  {member.bio ? (
                    <p className="leading-relaxed line-clamp-3 italic">"{member.bio}"</p>
                  ) : (
                    <p className="text-slate-400 italic">Membro do Edvanced Business Club.</p>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    {member.phone && (
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}

                    {member.instagram && (
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Instagram className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <a
                          href={formatInstagramLink(member.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#8C6D07] hover:underline truncate font-semibold text-[#8C6D07]"
                        >
                          {formatInstagramDisplay(member.instagram)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-2">
                {/* Regular Contact Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`mailto:${member.email}?subject=Contato%20via%20Edvanced%20Business%20Club`}
                    className="w-full block"
                  >
                    <Button
                      variant="outline"
                      className="w-full text-xs font-semibold border-slate-200 hover:bg-[#D4AF37] hover:text-slate-950 hover:border-[#D4AF37] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1" /> E-mail
                    </Button>
                  </a>

                  {member.instagram ? (
                    <a
                      href={formatInstagramLink(member.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block"
                    >
                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold border-slate-200 hover:bg-[#06242E] hover:text-white hover:border-[#06242E] transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" /> Instagram
                      </Button>
                    </a>
                  ) : member.phone ? (
                    <a
                      href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block"
                    >
                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1" /> WhatsApp
                      </Button>
                    </a>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full text-xs text-slate-400 border-slate-200"
                    >
                      Membro VIP
                    </Button>
                  )}
                </div>

                {/* Admin Management Toolbar */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(member)}
                      className="flex-1 h-8 text-xs font-semibold text-slate-700 hover:bg-[#D4AF37]/15 hover:text-[#8C6D07] rounded-xl"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" />
                      Editar Membro
                    </Button>

                    {!isMe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmSuspendMember(member)}
                        className={`h-8 text-xs font-bold rounded-xl px-2.5 ${
                          isSuspended
                            ? 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                            : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                        title={
                          isSuspended ? 'Reativar acesso do membro' : 'Suspender acesso do membro'
                        }
                      >
                        {isSuspended ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 mr-1" /> Reativar
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5 mr-1" /> Suspender
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      {/* =========================================================================
          ADMIN MODALS: EDITAR MEMBRO & CONFIRMAR SUSPENSÃO
         ========================================================================= */}

      {/* 1. Modal Editar Membro */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent className="max-w-xl bg-white text-slate-900 border-slate-200 p-6 md:p-8 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D4AF37] text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                  Painel da Diretoria
                </Badge>
                <span className="text-xs text-slate-500 font-mono">ID: {editingMember.id}</span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Editar Dados do Membro
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Atualize as informações corporativas, cargo, redes sociais e status de acesso.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveMember} className="space-y-4 pt-3 text-xs">
              {/* Nome */}
              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold">Nome Completo *</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              {/* Status de Acesso & Nível de Permissão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold">Status de Acesso</Label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="active">Ativo (Acesso Liberado)</option>
                    <option value="suspended">Suspenso (Bloqueado)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold">Nível de Permissão (Role)</Label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="member">Membro VIP</option>
                    <option value="admin">Administrador / Diretoria</option>
                  </select>
                </div>
              </div>

              {/* Empresa & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold">Empresa / Holding / Cargo</Label>
                  <Input
                    placeholder="Ex: Holding Invest (CEO)"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold">WhatsApp / Telefone</Label>
                  <Input
                    placeholder="+55 11 99999-9999"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold">Instagram (Handle ou URL)</Label>
                <Input
                  placeholder="@usuario ou link"
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Minibiografia */}
              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold">Minibiografia / Descrição</Label>
                <Textarea
                  placeholder="Resumo executivo, área de atuação e histórico..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="text-xs rounded-xl"
                  rows={3}
                />
              </div>

              {/* Avatar do Membro */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <Label className="text-slate-700 font-semibold flex items-center justify-between">
                  <span>Foto de Perfil (Avatar)</span>
                  {editAvatarPreview && (
                    <span className="text-[10px] text-emerald-600 font-bold">Foto carregada</span>
                  )}
                </Label>

                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-[#D4AF37]/50 flex-shrink-0">
                    {editAvatarPreview ? (
                      <AvatarImage
                        src={editAvatarPreview}
                        alt={editName}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#8C6D07] text-slate-950 font-bold text-sm">
                      {getInitials(editName)}
                    </AvatarFallback>
                  </Avatar>

                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setEditAvatarFile(file)
                        setEditAvatarPreview(URL.createObjectURL(file))
                      }
                    }}
                    className="text-xs bg-white rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-slate-950 hover:file:bg-[#F5D77F] file:cursor-pointer"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B89324] hover:from-[#C5A028] hover:to-[#A37E17] text-slate-950 font-bold text-xs uppercase tracking-wider px-5 rounded-xl shadow-md"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. Modal Confirmação de Suspensão/Reativação */}
      {confirmSuspendMember && (
        <Dialog
          open={!!confirmSuspendMember}
          onOpenChange={(open) => !open && setConfirmSuspendMember(null)}
        >
          <DialogContent className="max-w-md bg-white text-slate-900 border-slate-200 p-6 shadow-2xl rounded-3xl">
            <DialogHeader className="space-y-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-1 ${
                  confirmSuspendMember.status === 'suspended'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {confirmSuspendMember.status === 'suspended' ? (
                  <UserCheck className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 text-center">
                {confirmSuspendMember.status === 'suspended'
                  ? 'Reativar Acesso do Membro?'
                  : 'Suspender Acesso do Membro?'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 text-center leading-relaxed">
                {confirmSuspendMember.status === 'suspended'
                  ? `O membro "${confirmSuspendMember.name}" voltará a ter acesso imediato à plataforma, acervo de encontros e calendário VIP.`
                  : `Ao suspender "${confirmSuspendMember.name}", o usuário não conseguirá mais realizar login nem acessar as áreas restritas até ser reativado.`}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmSuspendMember(null)}
                className="w-full sm:w-auto text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isTogglingStatus}
                onClick={handleConfirmToggleSuspension}
                className={`w-full sm:w-auto text-xs font-bold uppercase tracking-wider rounded-xl shadow-md ${
                  confirmSuspendMember.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isTogglingStatus
                  ? 'Processando...'
                  : confirmSuspendMember.status === 'suspended'
                    ? 'Confirmar Reativação'
                    : 'Confirmar Suspensão'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
