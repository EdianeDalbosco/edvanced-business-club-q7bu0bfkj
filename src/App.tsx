import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

// Pages
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Meetings from '@/pages/Meetings'
import CalendarPage from '@/pages/Calendar'
import Disclosures from '@/pages/Disclosures'
import NewDisclosure from '@/pages/NewDisclosure'
import Members from '@/pages/Members'
import AdminApprovalQueue from '@/pages/AdminApprovalQueue'
import AdminNewMember from '@/pages/AdminNewMember'
import Profile from '@/pages/Profile'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <Routes>
          <Route element={<Layout />}>
            {/* Public or Protected Root */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />

            {/* Meetings & Materials */}
            <Route
              path="/encontros"
              element={
                <ProtectedRoute>
                  <Meetings />
                </ProtectedRoute>
              }
            />

            {/* Direct Calendar Route */}
            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />

            {/* Member Disclosures */}
            <Route
              path="/divulgacoes"
              element={
                <ProtectedRoute>
                  <Disclosures />
                </ProtectedRoute>
              }
            />

            {/* Profile Page */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* New Disclosure submission */}
            <Route
              path="/divulgacoes/nova"
              element={
                <ProtectedRoute>
                  <NewDisclosure />
                </ProtectedRoute>
              }
            />

            {/* Members Directory */}
            <Route
              path="/membros"
              element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              }
            />

            {/* Admin Approval Queue (Protected + Admin Only) */}
            <Route
              path="/admin/aprovacao"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminApprovalQueue />
                </ProtectedRoute>
              }
            />

            {/* Admin New Member (Protected + Admin Only) */}
            <Route
              path="/admin/membros/novo"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminNewMember />
                </ProtectedRoute>
              }
            />

            {/* Auth Page */}
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
