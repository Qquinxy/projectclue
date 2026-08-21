"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"

import { Student } from "./types"
import { api } from "./api"

interface AuthContextType {
  user: Student | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<Student | null>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
}

interface RegisterData {
  studentId: string
  firstName: string
  lastName: string
  email: string
  password: string
  faculty: string
  major: string
  year: number
}

interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: Student
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check existing login session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api<AuthResponse>("/auth/me")

        if (response.success && response.data?.user) {
          setUser(response.data.user)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login
  const login = async (
    email: string,
    password: string
  ): Promise<Student | null> => {
    try {
      const response = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: {
          email,
          password,
        },
      })

      if (response.success && response.data?.user) {
        setUser(response.data.user)
        return response.data.user
      }

      return null
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  }

  // Register
  const register = async (
    data: RegisterData
  ): Promise<boolean> => {
    try {
      const response = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: data,
      })

      if (response.success && response.data?.user) {
        setUser(response.data.user)
        return true
      }

      return false
    } catch (error) {
      console.error("Register error:", error)
      return false
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await api("/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}