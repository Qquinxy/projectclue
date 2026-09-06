"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSignIn } from "@clerk/nextjs"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { getPasswordError, getPasswordRuleStates } from "@/lib/password"
import { GoogleIcon } from "@/components/google-icon"
import { Users, AlertCircle, MailCheck, Check, X } from "lucide-react"

const faculties = [
  "คณะวิศวกรรมศาสตร์",
  "คณะบริหารธุรกิจ",
  "คณะศิลปศาสตร์",
  "คณะสถาปัตยกรรมศาสตร์",
]

// 11 digits, a dash, then 1 digit (e.g. 67543206105-8) — must match the
// backend's registration-only studentId validation.
const STUDENT_ID_PATTERN = /^[0-9]{11}-[0-9]$/

export default function RegisterPage() {
  const router = useRouter()
  const { register, loginWithGoogle, completeGoogleLogin } = useAuth()
  const { signIn } = useSignIn()
  const oauthHandledRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")
  // Set once registration succeeds; switches the card to the "check your
  // email" state instead of navigating into the app.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [verificationEmailSent, setVerificationEmailSent] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    faculty: "",
    major: "",
    year: "",
  })
  const [error, setError] = useState("")

  const enableGoogleLogin = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true"

  // If Clerk's OAuth redirect just returned to this page, complete the
  // Google login by exchanging the Clerk session for our backend JWT.
  useEffect(() => {
    const finishOAuth = async () => {
      if (!signIn || oauthHandledRef.current) return

      const isOAuthComplete =
        signIn.status === "complete" && Boolean(signIn.createdSessionId)

      if (!isOAuthComplete) return

      oauthHandledRef.current = true
      setIsGoogleLoading(true)
      const { user: loggedInUser, error: googleLoginError } = await completeGoogleLogin()

      if (loggedInUser) {
        const isAdmin =
          loggedInUser.role === "club_admin" || loggedInUser.role === "superadmin"
        router.push(isAdmin ? "/admin" : "/dashboard")
      } else {
        setGoogleError(googleLoginError ?? "สมัครสมาชิกด้วย Google ล้มเหลว กรุณาลองใหม่")
      }
      setIsGoogleLoading(false)
    }

    finishOAuth()
  }, [signIn, completeGoogleLogin, router])

  const handleGoogleSignUp = async () => {
    setGoogleError("")
    setError("")
    setIsGoogleLoading(true)
    const { error: googleLoginError } = await loginWithGoogle("/register")
    if (googleLoginError) {
      setGoogleError(googleLoginError)
      setIsGoogleLoading(false)
    }
    // On success the browser leaves for Google; isGoogleLoading stays true
    // only while awaiting the redirect.
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const requiredFields: Array<keyof typeof formData> = [
      "studentId",
      "firstName",
      "lastName",
      "email",
      "major",
      "password",
      "confirmPassword",
    ]
    if (requiredFields.some((field) => !formData[field].trim())) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง")
      return
    }

    if (!STUDENT_ID_PATTERN.test(formData.studentId.trim())) {
      setError("รหัสนักศึกษาต้องเป็นตัวเลข 11 หลัก ตามด้วย - และตัวเลข 1 หลัก เช่น 67543206105-8")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }

    // Same policy the backend enforces (lib/password.ts mirrors utils/password.js).
    const passwordError = getPasswordError(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setIsLoading(true)

    const result = await register({
      studentId: formData.studentId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      faculty: formData.faculty,
      major: formData.major,
      year: parseInt(formData.year),
    })

    if (result.success) {
      // No session is created — the account must be verified by email first.
      // The account exists either way; `verificationEmailSent` only says
      // whether the email actually went out.
      setRegisteredEmail(formData.email)
      setVerificationEmailSent(result.verificationEmailSent)
    } else {
      setError(result.message || "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง")
    }
    setIsLoading(false)
  }

  const handleResendVerification = async () => {
    if (!registeredEmail) return
    setIsResending(true)
    setResendMessage("")
    try {
      await api("/auth/resend-verification", { method: "POST", body: { email: registeredEmail } })
      setVerificationEmailSent(true)
      setResendMessage("ส่งลิงก์ยืนยันอีเมลแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ")
    } catch (err) {
      setResendMessage(
        err instanceof Error ? err.message : "ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่ภายหลัง"
      )
    } finally {
      setIsResending(false)
    }
  }

  // Post-registration state: the account exists but is unverified, so there is
  // nothing to navigate into yet.
  if (registeredEmail) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-background p-4 py-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(107,62,0,0.08),transparent_60%)]"
        />
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6b3e00] shadow-md">
                <MailCheck className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl tracking-tight">สมัครสมาชิกสำเร็จ</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {verificationEmailSent
                ? "กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์ยืนยันก่อนเข้าสู่ระบบ"
                : "บัญชีของคุณถูกสร้างแล้ว แต่ยังส่งอีเมลยืนยันไม่สำเร็จ"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationEmailSent ? (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">เราได้ส่งลิงก์ยืนยันไปที่</p>
                <p className="font-medium text-foreground break-all">{registeredEmail}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  ลิงก์มีอายุ 24 ชั่วโมง หากไม่พบอีเมล กรุณาตรวจสอบในกล่องจดหมายขยะ (Spam)
                </p>
              </div>
            ) : (
              /* Partial success: the account exists, only delivery failed —
                 do NOT tell the user to register again, offer a resend. */
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-5">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">ส่งอีเมลยืนยันไม่สำเร็จ</p>
                    <p className="mt-1">
                      บัญชีสำหรับ <span className="font-medium break-all">{registeredEmail}</span>{" "}
                      ถูกสร้างเรียบร้อยแล้ว ไม่ต้องสมัครใหม่อีกครั้ง
                      กรุณากดปุ่มด้านล่างเพื่อส่งลิงก์ยืนยันอีกครั้ง
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!verificationEmailSent && (
              <Button
                type="button"
                size="lg"
                className="w-full mt-4"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? <Spinner className="mr-2" /> : null}
                ส่งลิงก์ยืนยันอีกครั้ง
              </Button>
            )}

            {resendMessage && (
              <div className="mt-4 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {resendMessage}
              </div>
            )}

            <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
              ยืนยันอีเมลแล้ว?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                เข้าสู่ระบบ
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-background p-4 py-10 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(107,62,0,0.08),transparent_60%)]"
      />
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6b3e00] shadow-md">
              <Users className="h-6 w-6 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl sm:text-3xl tracking-tight">สมัครสมาชิก</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            สร้างบัญชีเพื่อเข้าร่วมชมรมและกิจกรรม
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enableGoogleLogin && (
            <>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isGoogleLoading || isLoading}
                  onClick={handleGoogleSignUp}
                >
                  {isGoogleLoading ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <GoogleIcon className="h-5 w-5" />
                  )}
                  สมัครสมาชิกด้วย Google
                </Button>

                {googleError && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{googleError}</span>
                  </div>
                )}
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">หรือ</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="studentId">รหัสนักศึกษา</FieldLabel>
                <Input
                  id="studentId"
                  className="numeric-font"
                  placeholder="12345678901-2"
                  value={formData.studentId}
                  onChange={(e) => handleChange("studentId", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">ชื่อ</FieldLabel>
                  <Input
                    id="firstName"
                    placeholder="ชื่อ"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">นามสกุล</FieldLabel>
                  <Input
                    id="lastName"
                    placeholder="นามสกุล"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">อีเมล</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@live.rmutl.ac.th"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="faculty">คณะ</FieldLabel>
                <Select value={formData.faculty} onValueChange={(v) => handleChange("faculty", v)}>
                  <SelectTrigger id="faculty">
                    <SelectValue placeholder="เลือกคณะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="major">สาขา</FieldLabel>
                  <Input
                    id="major"
                    placeholder="สาขาวิชา"
                    value={formData.major}
                    onChange={(e) => handleChange("major", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="year">ชั้นปี</FieldLabel>
                  <Select value={formData.year} onValueChange={(v) => handleChange("year", v)}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="ชั้นปี" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((y) => (
                        <SelectItem key={y} value={y.toString()}>ปี {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="เช่น ProjectClue@2026"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">ยืนยันรหัสผ่าน</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="ยืนยันรหัสผ่าน"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  />
                </Field>
              </div>

              {/* Live checklist of the password policy (mirrors the backend). */}
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-sm font-medium text-foreground mb-2">รหัสผ่านต้องประกอบด้วย</p>
                <ul className="space-y-1">
                  {getPasswordRuleStates(formData.password).map((rule) => (
                    <li
                      key={rule.id}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        rule.passed ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {rule.passed ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      )}
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FieldGroup>

            <div className="mt-6 flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : null}
                สมัครสมาชิก
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
