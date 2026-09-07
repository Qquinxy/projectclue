"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useReferenceLists, withCurrentValue, isProfileComplete } from "@/lib/reference"
import {
  User,
  Mail,
  Phone,
  Building,
  BookOpen,
  Calendar,
  Users,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle,
  Pencil,
  X,
  Save
} from "lucide-react"

interface ClubsMeResponse {
  success: boolean
  message?: string
  data: {
    memberships: unknown[]
  }
}

interface ParticipationItem {
  status: string
}

interface ActivitiesMeResponse {
  success: boolean
  message?: string
  data: {
    participations: ParticipationItem[]
  }
}

interface VolunteerHoursResponse {
  success: boolean
  message?: string
  data: {
    totalVolunteerHours: number
  }
}

interface ProfileStats {
  activeClubs: number
  attendedActivities: number
  totalVolunteerHours: number
}

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading, updateProfile } = useAuth()
  const { lists: referenceLists, isLoading: isReferenceLoading } = useReferenceLists()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ phone: "", faculty: "", major: "", year: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      setIsStatsLoading(true)
      setStatsError(null)

      try {
        const [clubsRes, activitiesRes, volunteerRes] = await Promise.all([
          api<ClubsMeResponse>("/students/me/clubs"),
          api<ActivitiesMeResponse>("/students/me/activities"),
          api<VolunteerHoursResponse>("/students/me/volunteer-hours"),
        ])

        setStats({
          activeClubs: clubsRes.data?.memberships?.length ?? 0,
          attendedActivities:
            activitiesRes.data?.participations?.filter((p) => p.status === "attended").length ?? 0,
          totalVolunteerHours: volunteerRes.data?.totalVolunteerHours ?? 0,
        })
      } catch (error) {
        setStatsError(
          error instanceof Error ? error.message : "ไม่สามารถโหลดสถิติได้"
        )
      } finally {
        setIsStatsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const startEdit = () => {
    if (!user) return
    setForm({
      phone: user.phone ?? "",
      faculty: user.faculty ?? "",
      major: user.major ?? "",
      year: user.year ? String(user.year) : "",
    })
    setFormError(null)
    setSaveMessage(null)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setFormError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaveMessage(null)

    if (!form.phone.trim() || !form.faculty || !form.major || !form.year) {
      setFormError("กรุณากรอกข้อมูลให้ครบทุกช่อง")
      return
    }

    const parsedYear = Number(form.year)
    if (!Number.isInteger(parsedYear) || parsedYear < 1) {
      setFormError("กรุณาเลือกชั้นปีให้ถูกต้อง")
      return
    }

    setIsSaving(true)
    const { user: updated, error } = await updateProfile({
      phone: form.phone.trim(),
      faculty: form.faculty,
      major: form.major,
      year: parsedYear,
    })
    if (updated) {
      setSaveMessage("บันทึกข้อมูลเรียบร้อยแล้ว")
      setIsEditing(false)
    } else {
      setFormError(error ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    }
    setIsSaving(false)
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
        <AlertCircle className="h-6 w-6" />
        <p>ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง</p>
      </div>
    )
  }

  const profileIncomplete = !isProfileComplete(user)
  const facultyOptions = withCurrentValue(referenceLists.faculties, user.faculty ?? "", "faculty")
  const majorOptions = withCurrentValue(referenceLists.majors, user.major ?? "", "major")
  const yearOptions = withCurrentValue(referenceLists.years, user.year ?? "", "year")

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">โปรไฟล์</h1>
          <p className="text-muted-foreground">ข้อมูลส่วนตัวและสถิติของคุณ</p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={startEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            แก้ไขข้อมูล
          </Button>
        )}
      </div>

      {profileIncomplete && !isEditing && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            ยังไม่ได้กรอกข้อมูลส่วนตัวให้ครบ (เบอร์โทรศัพท์ ชั้นปี คณะ สาขาวิชา) —
            กรุณากรอกให้ครบก่อนสมัครเข้าร่วมชมรม
          </span>
        </div>
      )}

      {saveMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {user.firstName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-muted-foreground numeric-font">{user.studentId}</div>
                  </div>
                </div>

                <Separator />

                <Field>
                  <FieldLabel htmlFor="phone">เบอร์โทรศัพท์</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Field>

                <div className="grid md:grid-cols-2 gap-5">
                  <Field>
                    <FieldLabel htmlFor="faculty">คณะ</FieldLabel>
                    <Select value={form.faculty} onValueChange={(v) => setForm((p) => ({ ...p, faculty: v }))}>
                      <SelectTrigger id="faculty">
                        <SelectValue placeholder="เลือกคณะ" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyOptions.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="major">สาขาวิชา</FieldLabel>
                    <Select value={form.major} onValueChange={(v) => setForm((p) => ({ ...p, major: v }))}>
                      <SelectTrigger id="major">
                        <SelectValue placeholder="เลือกสาขา" />
                      </SelectTrigger>
                      <SelectContent>
                        {majorOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="year">ชั้นปี</FieldLabel>
                  <Select value={form.year} onValueChange={(v) => setForm((p) => ({ ...p, year: v }))}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="เลือกชั้นปี" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {formError && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSaving || isReferenceLoading}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    บันทึก
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    ยกเลิก
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                      {user.firstName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="mt-3">นักศึกษาปี {user.year}</Badge>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-muted-foreground">รหัสนักศึกษา: <span className="numeric-font">{user.studentId}</span></p>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">อีเมล</div>
                        <div className="font-medium text-foreground text-sm truncate max-w-[200px]">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">เบอร์โทรศัพท์</div>
                        <div className="font-medium text-foreground">{user.phone || <span className="text-muted-foreground">—</span>}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">คณะ</div>
                        <div className="font-medium text-foreground">{user.faculty || <span className="text-muted-foreground">—</span>}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">สาขาวิชา</div>
                        <div className="font-medium text-foreground">{user.major || <span className="text-muted-foreground">—</span>}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สถิติของคุณ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isStatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : statsError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p>{statsError}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="numeric-font text-2xl font-bold text-foreground">
                      {stats?.activeClubs ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">ชมรมที่เข้าร่วม</div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <div className="numeric-font text-2xl font-bold text-foreground">
                      {stats?.attendedActivities ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">กิจกรรมที่เข้าร่วม</div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-chart-3" />
                  </div>
                  <div>
                    <div className="numeric-font text-2xl font-bold text-foreground">
                      {stats?.totalVolunteerHours ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">ชั่วโมงจิตอาสา</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Academic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            ข้อมูลทางการศึกษา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">ชั้นปี</div>
              <div className="text-xl font-semibold text-foreground">ปี <span className="numeric-font">{user.year}</span></div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">คณะ</div>
              <div className="text-xl font-semibold text-foreground">{user.faculty || <span className="text-muted-foreground">—</span>}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">สาขาวิชา</div>
              <div className="text-xl font-semibold text-foreground">{user.major || <span className="text-muted-foreground">—</span>}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">สถานะ</div>
              <div className="text-xl font-semibold text-primary">{profileIncomplete ? "ยังไม่ครบ" : "กำลังศึกษา"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}