"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
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
  AlertCircle
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
  const { user, isLoading: isAuthLoading } = useAuth()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">โปรไฟล์</h1>
        <p className="text-muted-foreground">ข้อมูลส่วนตัวและสถิติของคุณ</p>
      </div>

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
                      <div className="font-medium text-foreground">{user.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">คณะ</div>
                      <div className="font-medium text-foreground">{user.faculty}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">สาขาวิชา</div>
                      <div className="font-medium text-foreground">{user.major}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <div className="text-xl font-semibold text-foreground">{user.faculty}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">สาขาวิชา</div>
              <div className="text-xl font-semibold text-foreground">{user.major}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">สถานะ</div>
              <div className="text-xl font-semibold text-primary">กำลังศึกษา</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
