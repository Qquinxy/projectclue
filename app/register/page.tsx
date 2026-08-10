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
import { Users } from "lucide-react"

const faculties = [
  "คณะวิศวกรรมศาสตร์",
  "คณะบริหารธุรกิจ",
  "คณะศิลปศาสตร์",
  "คณะสถาปัตยกรรมศาสตร์",
]

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="text-2xl">สมัครสมาชิก</CardTitle>
          <CardDescription>สร้างบัญชีเพื่อเข้าร่วมชมรมและกิจกรรม</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="studentId">รหัสนักศึกษา</FieldLabel>
                <Input
                  id="studentId"
                  className="numeric-font"
                  placeholder="64010001"
                  value={formData.studentId}
                  onChange={(e) => handleChange("studentId", e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">ชื่อ</FieldLabel>
                  <Input
                    id="firstName"
                    placeholder="ชื่อ"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">นามสกุล</FieldLabel>
                  <Input
                    id="lastName"
                    placeholder="นามสกุล"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
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
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="faculty">คณะ</FieldLabel>
                <Select value={formData.faculty} onValueChange={(v) => handleChange("faculty", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกคณะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="major">สาขา</FieldLabel>
                  <Input
                    id="major"
                    placeholder="สาขาวิชา"
                    value={formData.major}
                    onChange={(e) => handleChange("major", e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="year">ชั้นปี</FieldLabel>
                  <Select value={formData.year} onValueChange={(v) => handleChange("year", v)}>
                    <SelectTrigger>
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

              <Field>
                <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
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
                  required
                />
              </Field>
            </FieldGroup>

            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}

            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              สมัครสมาชิก
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
