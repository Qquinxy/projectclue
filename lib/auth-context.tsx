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
  login: (email: string, password: string) => Promise<LoginResult>
  register: (data: RegisterData) => Promise<RegisterResult>
  updateProfile: (data: ProfileUpdateData) => Promise<LoginResult>
  logout: () => Promise<void>
}

// Login failures carry the server's message rather than a bare null, so the
// caller can surface exactly what went wrong.
export interface LoginResult {
  user: Student | null
  error: string | null
}

// Registration deliberately does not sign the user in — it stays a separate
// step from login. The account is usable immediately, so the caller just
// shows the success message and sends the user to the login page.
export interface RegisterResult {
  success: boolean
  message: string | null
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

// Editable profile fields — the subset of the user document PATCH /auth/me
// accepts (firstName/lastName/phone/faculty/major/year are allowed).
interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  phone?: string
  faculty?: string
  major?: string
  year?: number
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
  ): Promise<LoginResult> => {
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
        return { user: response.data.user, error: null }
      }

      return { user: null, error: response.message ?? null }
    } catch (error) {
      // The API's message is the useful part here, so it is passed through
      // to the page.
      return {
        user: null,
        error: error instanceof Error ? error.message : null,
      }
    }
  }

  // Register — deliberately does NOT set the user. No session is issued by
  // the register endpoint; the user logs in as a separate step.
  const register = async (
    data: RegisterData
  ): Promise<RegisterResult> => {
    try {
      const response = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: data,
      })

      return {
        success: Boolean(response.success),
        message: response.message ?? null,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : null,
      }
    }
  }

  // Update the editable profile fields (phone / faculty / major / year, plus
  // the name fields). Keeps the context user in sync so the whole app
  // reflects the new value immediately (e.g. the join-club profile gate).
  const updateProfile = async (data: ProfileUpdateData): Promise<LoginResult> => {
    try {
      const response = await api<AuthResponse>("/auth/me", {
        method: "PATCH",
        body: data,
      })

      if (response.success && response.data?.user) {
        setUser(response.data.user)
        return { user: response.data.user, error: null }
      }

      return { user: null, error: response.message ?? null }
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : null,
      }
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
        updateProfile,
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