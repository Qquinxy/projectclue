"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { Club, Activity } from "@/lib/types"
import {
  Users,
  Calendar,
  UserCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react"

interface AdminStatsResponse {
  success: boolean
  message?: string
  data: {
    clubs: number
    activities: number
    members: number
    upcomingActivities: number
  }
}

interface RawClub extends Omit<Club, "id"> {
  id?: string
  _id?: string
}

interface ClubsResponse {
  success: boolean
  message?: string
  data: {
    clubs: RawClub[]
  }
}

interface RawActivity extends Omit<Activity, "id" | "club"> {
  id?: string
  _id?: string
  club: Omit<Activity["club"], "id"> & { id?: string; _id?: string }
}

interface ActivitiesResponse {
  success: boolean
  message?: string
  data: {
    activities: RawActivity[]
  }
}

// The API returns clubs/activities (and populated clubs on activities) keyed
// by _id, not id — normalize here for stable React keys below.
function normalizeClub(club: RawClub): Club {
  return { ...club, id: club.id ?? club._id ?? "" }
}

function normalizeActivity(activity: RawActivity): Activity {
  return {
    ...activity,
    id: activity.id ?? activity._id ?? "",
    club: { ...activity.club, id: activity.club.id ?? activity.club._id ?? "" },
  }
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [statsData, setStatsData] = useState<AdminStatsResponse["data"] | null>(null)
  const [recentClubs, setRecentClubs] = useState<Club[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const isSuperadmin = user.role === "superadmin"

    const fetchDashboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Superadmin sees the 5 most recent clubs/activities system-wide.
        // club_admin has no dedicated "my clubs" list endpoint, so fetch
        // unfiltered and narrow to their managedClubs client-side — the
        // /admin/stats numbers above are already scoped the same way
        // server-side, this just keeps these two widgets consistent with them.
        const [statsRes, clubsRes, activitiesRes] = await Promise.all([
          api<AdminStatsResponse>("/admin/stats"),
          api<ClubsResponse>(isSuperadmin ? "/clubs?limit=5" : "/clubs"),
          api<ActivitiesResponse>(isSuperadmin ? "/activities?status=upcoming&limit=5" : "/activities?status=upcoming"),
        ])

        setStatsData(statsRes.data ?? null)

        let clubs = (clubsRes.data?.clubs ?? []).map(normalizeClub)
        let activities = (activitiesRes.data?.activities ?? []).map(normalizeActivity)

        if (!isSuperadmin) {
          const managedClubIds = new Set(user.managedClubs)
          clubs = clubs.filter((club) => managedClubIds.has(club.id))
          activities = activities.filter((activity) => managedClubIds.has(activity.club.id))
        }

        setRecentClubs(clubs.slice(0, 5))
        setRecentActivities(activities.slice(0, 5))
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [user])

  const stats = [
    {
      label: "ชมรมทั้งหมด",
      value: statsData?.clubs ?? 0,
      icon: Users,
      href: "/admin/clubs",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "กิจกรรมทั้งหมด",
      value: statsData?.activities ?? 0,
      icon: Calendar,
      href: "/admin/activities",
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      label: "สมาชิกทั้งหมด",
      value: statsData?.members ?? 0,
      icon: UserCheck,
      href: "/admin/members",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10"
    },
    {
      label: "กิจกรรมที่กำลังจะมา",
      value: statsData?.upcomingActivities ?? 0,
      icon: TrendingUp,
      href: "/admin/activities",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10"
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-muted-foreground">ภาพรวมและสถิติของระบบชมรม</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              เกิดข้อผิดพลาด
            </h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <span className="numeric-font text-3xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Clubs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">ชมรมล่าสุด</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/clubs">
                    ดูทั้งหมด
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentClubs.map((club) => (
                    <div
                      key={club.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{club.name}</div>
                        <div className="text-sm text-muted-foreground">
                          <span className="numeric-font">{club.memberCount}</span> สมาชิก
                        </div>
                      </div>
                      <Badge variant="outline">
                        <span className="numeric-font">{club.memberCount}/{club.maxMembers}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Activities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">กิจกรรมที่กำลังจะมา</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/activities">
                    ดูทั้งหมด
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{activity.title}</div>
                        <div className="text-sm text-muted-foreground">
                          <span className="numeric-font">
                            {new Date(activity.date).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short"
                            })}
                          </span> - {activity.club.name}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <span className="numeric-font">{activity.currentParticipants}/{activity.maxParticipants}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">การดำเนินการด่วน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link href="/admin/clubs">
                    <Users className="h-6 w-6 text-primary" />
                    <span>จัดการชมรม</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link href="/admin/activities">
                    <Calendar className="h-6 w-6 text-accent" />
                    <span>จัดการกิจกรรม</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link href="/admin/members">
                    <CheckCircle className="h-6 w-6 text-chart-3" />
                    <span>จัดการสมาชิก</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
