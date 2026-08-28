"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Users, AlertCircle } from "lucide-react"

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
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
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

    if (formData.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }

    setIsLoading(true)

    const success = await register({
      studentId: formData.studentId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      faculty: formData.faculty,
      major: formData.major,
      year: parseInt(formData.year),
    })

    if (success) {
      router.push("/dashboard")
    } else {
      setError("ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง")
    }
    setIsLoading(false)
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
                    placeholder="ตั้งรหัสผ่าน 6 ตัวขึ้นไป"
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
