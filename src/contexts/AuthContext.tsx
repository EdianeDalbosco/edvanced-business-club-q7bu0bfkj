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
        setUser(refreshed.record)
        setToken(refreshed.token)
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
    setUser(authData.record)
    setToken(authData.token)
  }

  const registerMemberAsAdmin = async (data: {
    email: string
    password?: string
    name: string
    role?: 'admin' | 'member'
    company?: string
    phone?: string
    bio?: string
    instagram?: string
  }): Promise<User> => {
    const password = data.password || 'Skip@Pass'
    const newRecord = await pb.collection('users').create<User>({
      email: data.email,
      password: password,
      passwordConfirm: password,
      name: data.name,
      company: data.company || '',
      phone: data.phone || '',
      bio: data.bio || '',
      instagram: data.instagram || '',
      role: data.role || 'member',
      verified: true,
    })
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
