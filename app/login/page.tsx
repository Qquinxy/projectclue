"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { googleAuthUrl, googleErrorMessage } from "@/lib/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { GoogleIcon } from "@/components/google-icon"
import { Users, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const enableGoogleLogin = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true"

  // The Google OAuth callback redirects here with ?error=... on failure.
  // Read it once on mount and remove it from the URL so a refresh doesn't
  // keep showing a stale error.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errCode = params.get("error")
    if (errCode) {
      setError(googleErrorMessage(errCode) ?? "เข้าสู่ระบบด้วย Google ไม่สำเร็จ")
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResendMessage("")
    setNeedsVerification(false)
    setIsLoading(true)

    const { user: loggedInUser, error: loginError } = await login(email, password)

    if (loggedInUser) {
      const isAdmin = loggedInUser.role === "club_admin" || loggedInUser.role === "superadmin"
      router.push(isAdmin ? "/admin" : "/dashboard")
    } else {
      // The backend answers 403 with a "verify your email" message for an
      // unverified account, and 401 for wrong credentials.
      const isUnverified = Boolean(loginError && /verify your email/i.test(loginError))
      setNeedsVerification(isUnverified)
      setError(
        isUnverified
          ? "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ โปรดตรวจสอบกล่องจดหมายของคุณ"
          : "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      )
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    window.location.href = googleAuthUrl()
  }

  const handleResend = async () => {
    setIsResending(true)
    setResendMessage("")
    try {
      await api("/auth/resend-verification", { method: "POST", body: { email } })
      setResendMessage("ส่งลิงก์ยืนยันอีเมลใหม่แล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ")
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : "ไม่สามารถส่งอีเมลยืนยันได้")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(107,62,0,0.08),transparent_60%)]"
      />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6b3e00] shadow-md">
              <Users className="h-6 w-6 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl sm:text-3xl tracking-tight">เข้าสู่ระบบ</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            เข้าสู่ระบบเพื่อจัดการชมรมและกิจกรรม
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enableGoogleLogin && (
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-2"
                disabled={isGoogleLoading || isLoading}
                onClick={handleGoogleLogin}
              >
                {isGoogleLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                เข้าสู่ระบบด้วย Google
              </Button>
            </div>
          )}

          {enableGoogleLogin && (
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">หรือ</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">อีเมล</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@live.rmutl.ac.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
            </FieldGroup>

            <div className="mt-6 flex flex-col gap-4">
              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {needsVerification && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending || !email}
                      className="mt-2 font-medium underline underline-offset-4 disabled:opacity-60"
                    >
                      {isResending ? "กำลังส่งอีเมล..." : "ส่งลิงก์ยืนยันอีเมลอีกครั้ง"}
                    </button>
                  )}
                </div>
              )}

              {resendMessage && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {resendMessage}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : null}
                เข้าสู่ระบบ
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              สมัครสมาชิก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}