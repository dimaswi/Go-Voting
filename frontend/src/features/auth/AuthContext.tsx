import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AdminInfo } from '@/types'
import { authAPI } from '@/lib/api'

interface AuthContextType {
  admin: AdminInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('govote_admin_token')
    const savedAdmin = localStorage.getItem('govote_admin_info')
    if (savedToken && savedAdmin) {
      setToken(savedToken)
      try {
        setAdmin(JSON.parse(savedAdmin))
      } catch {
        localStorage.removeItem('govote_admin_token')
        localStorage.removeItem('govote_admin_info')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await authAPI.login(username, password)
    const { token: newToken, admin: adminInfo } = res.data.data
    setToken(newToken)
    setAdmin(adminInfo)
    localStorage.setItem('govote_admin_token', newToken)
    localStorage.setItem('govote_admin_info', JSON.stringify(adminInfo))
  }

  const logout = () => {
    authAPI.logout().catch(() => {})
    setToken(null)
    setAdmin(null)
    localStorage.removeItem('govote_admin_token')
    localStorage.removeItem('govote_admin_info')
    window.location.href = '/admin/login'
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
