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
  logout: () => Promise<void>
}

// Login can fail for two materially different reasons — wrong credentials
// (401) versus an unverified email address (403) — so the caller gets the
// server's message instead of a bare null.
export interface LoginResult {
  user: Student | null
  error: string | null
}

// Registration no longer signs the user in: the account is created unverified
// and the API returns the "check your email" message to display.
//
// `verificationEmailSent` is false in the partial-success case — the account
// WAS created but the verification email could not be delivered, so the UI
// tells the user that and offers a resend instead of implying failure.
export interface RegisterResult {
  success: boolean
  message: string | null
  verificationEmailSent: boolean
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
    // Registration only: false means the account was created but the
    // verification email could not be delivered.
    verificationEmailSent?: boolean
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
      // The API's message is the useful part here (bad credentials vs.
      // "please verify your email"), so it is passed through to the page.
      return {
        user: null,
        error: error instanceof Error ? error.message : null,
      }
    }
  }

  // Register — deliberately does NOT set the user: the account starts
  // unverified and has no session until the emailed link is opened.
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
        // Absent on older responses — treat as sent so the happy path is unchanged.
        verificationEmailSent: response.data?.verificationEmailSent !== false,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : null,
        verificationEmailSent: false,
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