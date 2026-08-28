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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMembers, getFileUrl } from '@/services/api'
import type { User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Members() {
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
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
    load()
  }, [])

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.company?.toLowerCase().includes(q) ||
      m.instagram?.toLowerCase().includes(q) ||
      m.bio?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    )
  })

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

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, empresa ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {filteredMembers.length} membro(s) encontrado(s)
        </span>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => {
          const isAdmin = member.role === 'admin' || member.email === 'edianedalbosco@gmail.com'

          return (
            <Card
              key={member.id}
              className="border-slate-200/80 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                  <Avatar className="w-14 h-14 ring-2 ring-[#D4AF37]/40 flex-shrink-0">
                    {member.avatar ? (
                      <AvatarImage
                        src={getFileUrl('users', member.id, member.avatar)}
                        alt={member.name}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#8C6D07] text-slate-950 font-bold text-base">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 truncate group-hover:text-[#8C6D07] transition-colors">
                        {member.name}
                      </h3>
                    </div>

                    {isAdmin ? (
                      <Badge className="bg-[#D4AF37] text-slate-950 font-bold text-[9px] uppercase tracking-wider mt-1">
                        <Crown className="w-3 h-3 mr-1 inline" /> Fundadora & Master
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-slate-200 text-slate-600 text-[9px] uppercase tracking-wider mt-1"
                      >
                        Membro Ativo
                      </Badge>
                    )}

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
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
