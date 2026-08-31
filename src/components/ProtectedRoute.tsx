import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Crown } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  allowUnonboarded?: boolean
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  allowUnonboarded = false,
}: ProtectedRouteProps) {
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

  if (user.status === 'suspended') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-rose-200 shadow-md max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Acesso Suspenso</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          Seu acesso à plataforma Edvanced Business Club foi temporariamente suspenso pela
          administração. Por favor, entre em contato com a diretoria do Club para regularização.
        </p>
      </div>
    )
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

  // If member has not completed onboarding and is accessing regular protected routes, redirect to welcome
  // Admin is not blocked if onboarded is false, but regular members must go to welcome
  if (
    !allowUnonboarded &&
    !isAdmin &&
    user.onboarded === false &&
    location.pathname !== '/boas-vindas'
  ) {
    return <Navigate to="/boas-vindas" replace />
  }

  // If member is already onboarded and tries to access /boas-vindas directly, send to dashboard
  if (allowUnonboarded && location.pathname === '/boas-vindas' && user.onboarded === true) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
