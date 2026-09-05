"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, AlertCircle, MailCheck, Loader2 } from "lucide-react"

type VerifyState = "loading" | "success" | "error" | "missing-token"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [state, setState] = useState<VerifyState>(token ? "loading" : "missing-token")
  const [message, setMessage] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendMessage, setResendMessage] = useState("")
  const [isResending, setIsResending] = useState(false)

  // React 18/19 StrictMode mounts effects twice in development; the token is
  // single-use, so guard against firing the request twice (the second call
  // would otherwise report "already used" for a link that just worked).
  const hasVerified = useRef(false)

  const verify = useCallback(async () => {
    if (!token || hasVerified.current) return
    hasVerified.current = true

    try {
      const response = await api<{ success: boolean; message?: string }>("/auth/verify-email", {
        method: "POST",
        body: { token },
      })
      setState("success")
      setMessage(response.message ?? "ยืนยันอีเมลสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว")
    } catch (err) {
      setState("error")
      setMessage(
        err instanceof Error
          ? err.message
          : "ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่"
      )
    }
  }, [token])

  useEffect(() => {
    verify()
  }, [verify])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResending(true)
    setResendMessage("")
    try {
      const response = await api<{ message?: string }>("/auth/resend-verification", {
        method: "POST",
        body: { email: resendEmail },
      })
      setResendMessage(
        response.message ?? "หากอีเมลนี้ต้องยืนยัน ระบบได้ส่งลิงก์ใหม่ไปให้แล้ว"
      )
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
              <MailCheck className="h-6 w-6 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl sm:text-3xl tracking-tight">ยืนยันอีเมล</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            ยืนยันอีเมลของคุณเพื่อเริ่มใช้งาน ProjectClue
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">กำลังตรวจสอบลิงก์ยืนยัน...</p>
            </div>
          )}

          {state === "success" && (
            <>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 py-10 px-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <p className="font-medium text-foreground">ยืนยันอีเมลสำเร็จ</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button asChild size="lg" className="w-full mt-6">
                <Link href="/login">เข้าสู่ระบบ</Link>
              </Button>
            </>
          )}

          {(state === "error" || state === "missing-token") && (
            <>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 py-10 px-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="font-medium text-destructive">
                  {state === "missing-token" ? "ไม่พบโทเค็นยืนยัน" : "ยืนยันอีเมลไม่สำเร็จ"}
                </p>
                <p className="text-sm text-destructive/90">
                  {state === "missing-token"
                    ? "ลิงก์นี้ไม่มีโทเค็นยืนยัน กรุณาเปิดลิงก์จากอีเมลของคุณอีกครั้ง"
                    : message}
                </p>
              </div>

              <form onSubmit={handleResend} className="mt-6 space-y-3">
                <p className="text-sm text-muted-foreground">ขอลิงก์ยืนยันใหม่อีกครั้ง</p>
                <Input
                  type="email"
                  placeholder="email@live.rmutl.ac.th"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="lg" className="w-full" disabled={isResending}>
                  {isResending ? <Spinner className="mr-2" /> : null}
                  ส่งลิงก์ยืนยันใหม่
                </Button>
                {resendMessage && (
                  <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    {resendMessage}
                  </div>
                )}
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            กลับไปที่{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              หน้าเข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
