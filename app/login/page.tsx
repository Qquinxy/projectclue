"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Users, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const loggedInUser = await login(email, password)

    if (loggedInUser) {
      const isAdmin = loggedInUser.role === "club_admin" || loggedInUser.role === "superadmin"
      router.push(isAdmin ? "/admin" : "/dashboard")
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    }
    setIsLoading(false)
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
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
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
