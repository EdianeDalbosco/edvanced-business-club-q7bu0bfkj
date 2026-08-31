import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, pass: string) => Promise<void>
  registerMemberAsAdmin: (data: {
    email: string
    password?: string
    name: string
    role?: 'admin' | 'member'
    status?: 'active' | 'suspended'
    company?: string
    phone?: string
    bio?: string
    instagram?: string
  }) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    return (pb.authStore.record as unknown as User) || null
  })
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.record) {
        const refreshed = await pb.collection('users').authRefresh<User>()
        if (refreshed.record.status === 'suspended') {
          pb.authStore.clear()
          setUser(null)
          setToken(null)
        } else {
          setUser(refreshed.record)
          setToken(refreshed.token)
        }
      } else {
        setUser(null)
        setToken(null)
      }
    } catch {
      pb.authStore.clear()
      setUser(null)
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()

    const unsubscribe = pb.authStore.onChange((newToken, model) => {
      setToken(newToken)
      setUser((model as unknown as User) || null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword<User>(email, pass)
    if (authData.record.status === 'suspended') {
      pb.authStore.clear()
      setUser(null)
      setToken(null)
      throw new Error('Sua conta está suspensa. Entre em contato com a administração do Club.')
    }
    setUser(authData.record)
    setToken(authData.token)
  }

  const registerMemberAsAdmin = async (data: {
    email: string
    password?: string
    name: string
    role?: 'admin' | 'member'
    status?: 'active' | 'suspended'
    company?: string
    phone?: string
    bio?: string
    instagram?: string
    emailVisibility?: boolean
  }): Promise<User> => {
    const password = data.password?.trim() || 'Skip@Pass'
    const newRecord = await pb.collection('users').create<User>({
      email: data.email.trim().toLowerCase(),
      password: password,
      passwordConfirm: password,
      name: data.name.trim(),
      company: data.company?.trim() || '',
      phone: data.phone?.trim() || '',
      bio: data.bio?.trim() || '',
      instagram: data.instagram?.trim() || '',
      role: data.role || 'member',
      status: data.status || 'active',
      emailVisibility: data.emailVisibility ?? true,
    })

    if (!newRecord.verified) {
      try {
        return await pb.collection('users').update<User>(newRecord.id, {
          verified: true,
        })
      } catch {
        return newRecord
      }
    }

    return newRecord
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const isAdmin = user?.role === 'admin' || user?.email === 'edianedalbosco@gmail.com'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        registerMemberAsAdmin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
