import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Crown } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center animate-spin">
          <Crown className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Carregando ambiente VIP...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Acesso Restrito à Diretoria</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Esta área é reservada para a administração e líderes do Edvanced Business Club.
        </p>
        <Navigate to="/" replace />
      </div>
    )
  }

  return <>{children}</>
}
