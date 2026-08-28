import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  Users,
  ShieldCheck,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Crown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Building2,
  Lock,
  UserCheck,
  User,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import { getPendingDisclosures, getMemberDisclosures, getFileUrl } from '@/services/api'
import type { Disclosure } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

export default function Layout() {
  const { user, isAdmin, logout, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [myRecentDisclosures, setMyRecentDisclosures] = useState<Disclosure[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load notification data
  const loadNotificationData = async () => {
    if (!user) return
    try {
      if (isAdmin) {
        const pending = await getPendingDisclosures()
        setPendingCount(pending.length)
      }
      const myItems = await getMemberDisclosures(user.id)
      setMyRecentDisclosures(myItems.slice(0, 5))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadNotificationData()
  }, [user, isAdmin])

  // Realtime subscription for disclosures updates
  useRealtime<Disclosure>(
    'disclosures',
    (data) => {
      loadNotificationData()
      if (data.action === 'create' && isAdmin) {
        toast.info('Nova divulgação submetida para aprovação!')
      } else if (data.action === 'update' && user && data.record.member === user.id) {
        if (data.record.status === 'approved') {
          toast.success(`Sua divulgação "${data.record.title}" foi APROVADA!`)
        } else if (data.record.status === 'rejected') {
          toast.error(`Sua divulgação "${data.record.title}" foi recusada. Verifique o feedback.`)
        }
      }
    },
    !!user,
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    navigate(`/encontros?busca=${encodeURIComponent(searchTerm.trim())}`)
  }

  // Navigation Items
  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Encontros & Materiais',
      path: '/encontros',
      icon: CalendarDays,
      badge: 'Fotos, Vídeos & Docs',
    },
    {
      label: 'Calendário Integrado',
      path: '/calendario',
      icon: Sparkles,
      badge: 'Agenda VIP',
    },
    {
      label: 'Minhas Divulgações',
      path: '/divulgacoes',
      icon: Megaphone,
    },
    {
      label: 'Diretório de Membros',
      path: '/membros',
      icon: Users,
    },
  ]

  const adminNavItems = [
    {
      label: 'Fila de Aprovação',
      path: '/admin/aprovacao',
      icon: ShieldCheck,
      count: pendingCount,
    },
    {
      label: 'Cadastrar Novo Membro',
      path: '/admin/membros/novo',
      icon: UserCheck,
    },
  ]

  const getInitials = (name?: string) => {
    if (!name) return 'EB'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-[#D4AF37]/30 selection:text-slate-900">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#06242E] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#03151B] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-teal-100 hover:text-white hover:bg-[#0A3340]"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#AA820A] flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
              <Crown className="w-4 h-4 text-slate-950 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider text-white">EDVANCED</span>
              <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] -mt-1 font-semibold">
                Business Club
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Link to="/perfil">
              <Avatar className="w-8 h-8 ring-2 ring-[#D4AF37]/50">
                {user.avatar ? (
                  <AvatarImage
                    src={getFileUrl('users', user.id, user.avatar)}
                    alt={user.name}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-[#D4AF37] text-slate-950 font-bold text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#03151B]/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#06242E] text-slate-100 z-50 flex flex-col justify-between border-r border-[#03151B] transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Logo / Brand Header */}
        <div className="p-6 border-b border-[#03151B]/90 bg-gradient-to-b from-[#03151B] to-[#06242E]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#997300] p-[2px] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#06242E] rounded-[10px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">EDVANCED</span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#F5D77F] border border-[#D4AF37]/40">
                  VIP
                </span>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-medium">
                Business Club
              </p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Main Section */}
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-200/70 mb-2">
              Menu Principal
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89324] text-slate-950 font-semibold shadow-md shadow-[#D4AF37]/20'
                        : 'text-teal-50 hover:text-white hover:bg-[#0A3340]/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-slate-950' : 'text-[#D4AF37]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-slate-950" />}
                  </Link>
                )
              })}

              {/* Profile Link in Menu */}
              {user && (
                <Link
                  to="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                    location.pathname === '/perfil'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89324] text-slate-950 font-semibold shadow-md shadow-[#D4AF37]/20'
                      : 'text-teal-50 hover:text-white hover:bg-[#0A3340]/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        location.pathname === '/perfil' ? 'text-slate-950' : 'text-[#D4AF37]'
                      }`}
                    />
                    <span>Meu Perfil & Foto</span>
                  </div>
                  {location.pathname === '/perfil' && (
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  )}
                </Link>
              )}
            </nav>
          </div>

          {/* Admin Exclusive Area */}
          {isAdmin && (
            <div className="pt-2">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Painel de Gestão (Adm)
                </p>
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                        isActive
                          ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md shadow-[#D4AF37]/20'
                          : 'text-amber-200/90 hover:text-white hover:bg-amber-500/10 border border-amber-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-[#D4AF37]'}`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                          {item.count}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}

          {/* Quick Action Button */}
          <div className="pt-2">
            <Link
              to="/divulgacoes/nova"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-[#D4AF37]/50 bg-gradient-to-b from-[#D4AF37]/15 to-[#D4AF37]/5 text-[#F5D77F] hover:bg-[#D4AF37]/25 text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              Nova Divulgação
            </Link>
          </div>
        </div>

        {/* Sidebar Footer / User Profile (Compacto, Elegante & Completo) */}
        <div className="p-3.5 border-t border-[#03151B] bg-[#03151B]/95">
          {user ? (
            <div className="flex items-start justify-between gap-2">
              <Link
                to="/perfil"
                onClick={() => setMobileOpen(false)}
                className="flex items-start gap-2.5 min-w-0 hover:opacity-95 transition-opacity flex-1 group"
                title="Acessar e editar Meu Perfil"
              >
                <Avatar className="w-8 h-8 ring-1.5 ring-[#D4AF37]/70 flex-shrink-0 mt-0.5">
                  {user.avatar ? (
                    <AvatarImage
                      src={getFileUrl('users', user.id, user.avatar)}
                      alt={user.name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#8C6D07] text-slate-950 font-bold text-[11px]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-0.5">
                  {/* Nome & Tag ADM */}
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="text-xs font-bold text-white group-hover:text-[#F5D77F] break-words leading-tight transition-colors">
                      {user.name}
                    </span>
                    {isAdmin && (
                      <span className="px-1 py-0.2 bg-[#D4AF37] text-slate-950 text-[8px] font-black rounded-xs leading-none shrink-0 shadow-2xs">
                        ADM
                      </span>
                    )}
                  </div>

                  {/* Empresa */}
                  {user.company && (
                    <p className="text-[11px] font-medium text-[#F5D77F]/90 break-words leading-snug">
                      {user.company}
                    </p>
                  )}

                  {/* E-mail com quebra de linha quando longo */}
                  <p className="text-[10px] text-teal-200/70 break-all leading-tight">
                    {user.email}
                  </p>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Sair da conta"
                className="text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg flex-shrink-0 mt-0.5 h-7 w-7"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#D4AF37] text-slate-950 font-bold rounded-lg text-xs hover:bg-[#F5D77F] transition-colors"
            >
              <Lock className="w-4 h-4" />
              Fazer Login VIP
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
          {/* Global Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar materiais, palestras, temas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border-slate-200 text-sm focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] rounded-xl"
            />
          </form>

          {/* Right actions: Notifications & User profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                >
                  <Bell className="w-5 h-5" />
                  {pendingCount > 0 && isAdmin && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 shadow-xl border-slate-200" align="end">
                <div className="p-4 bg-[#06242E] text-white rounded-t-lg flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#D4AF37]" /> Notificações do Club
                  </h4>
                  {isAdmin && (
                    <Badge
                      variant="outline"
                      className="border-[#D4AF37] text-[#D4AF37] text-[10px]"
                    >
                      {pendingCount} pendente(s)
                    </Badge>
                  )}
                </div>
                <div className="p-3 max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {isAdmin && pendingCount > 0 && (
                    <div className="py-2.5 px-2 bg-amber-50 rounded-lg mb-2">
                      <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Fila de Divulgações
                      </p>
                      <p className="text-amber-700 mt-0.5">
                        Você tem {pendingCount} nova(s) divulgação(ões) aguardando sua aprovação.
                      </p>
                      <Link
                        to="/admin/aprovacao"
                        className="inline-block mt-2 text-xs font-bold text-amber-900 underline"
                      >
                        Revisar agora &rarr;
                      </Link>
                    </div>
                  )}

                  {myRecentDisclosures.length > 0 ? (
                    myRecentDisclosures.map((d) => (
                      <div key={d.id} className="py-2.5 px-2 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800 line-clamp-1">{d.title}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              d.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.status === 'approved'
                              ? 'Aprovado'
                              : d.status === 'rejected'
                                ? 'Recusado'
                                : 'Pendente'}
                          </span>
                        </div>
                        {d.admin_feedback && d.status === 'rejected' && (
                          <p className="text-[11px] text-rose-600 mt-1 italic line-clamp-2">
                            "{d.admin_feedback}"
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-slate-400">Nenhuma notificação recente.</p>
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center rounded-b-lg">
                  <Link
                    to="/divulgacoes"
                    className="text-xs font-semibold text-[#8C6D07] hover:underline"
                  >
                    Ver todas minhas divulgações
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl"
                  >
                    <Avatar className="w-9 h-9 ring-2 ring-[#D4AF37]/50">
                      {user.avatar ? (
                        <AvatarImage
                          src={getFileUrl('users', user.id, user.avatar)}
                          alt={user.name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#8C6D07] text-slate-950 font-bold text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {user.role || 'Membro'}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-xl">
                  <DropdownMenuLabel>
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 font-normal">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    <User className="w-4 h-4 mr-2 text-[#8C6D07]" /> Meu Perfil & Foto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/membros')}>
                    <Users className="w-4 h-4 mr-2 text-slate-500" /> Diretório de Membros
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/divulgacoes')}>
                    <Megaphone className="w-4 h-4 mr-2 text-slate-500" /> Minhas Divulgações
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin/aprovacao')}>
                        <ShieldCheck className="w-4 h-4 mr-2 text-[#D4AF37]" /> Fila de Aprovação
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/membros/novo')}>
                        <UserCheck className="w-4 h-4 mr-2 text-[#D4AF37]" /> Cadastrar Novo Membro
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sair da Plataforma
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#B89324] text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Entrar
              </Link>
            )}
          </div>
        </header>

        {/* Page Main View Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
