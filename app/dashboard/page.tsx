"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Club, Activity } from "@/lib/types"
import {
  Users,
  Calendar,
  Award,
  Clock,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react"

interface ClubMembershipItem {
  id: string
  joinedAt: string
  club: Club
}

interface RawClubMembershipItem extends Omit<ClubMembershipItem, "id" | "club"> {
  id?: string
  _id?: string
  club: Omit<Club, "id"> & { id?: string; _id?: string }
}

interface ClubsMeResponse {
  success: boolean
  message?: string
  data: {
    memberships: RawClubMembershipItem[]
  }
}

// The API returns the joined club keyed by _id, not id — normalize here so
// the "/clubs/:id" links below get a real id, consistent with app/clubs/page.tsx.
function normalizeMembership(membership: RawClubMembershipItem): ClubMembershipItem {
  return {
    ...membership,
    id: membership.id ?? membership._id ?? "",
    club: { ...membership.club, id: membership.club.id ?? membership.club._id ?? "" },
  }
}

interface ActivityParticipationItem {
  id: string
  status: string
  registeredAt: string
  attendedAt: string | null
  hoursEarned: number
  activity: Activity
}

interface RawActivityParticipationItem extends Omit<ActivityParticipationItem, "id" | "activity"> {
  id?: string
  _id?: string
  activity: Omit<Activity, "id"> & { id?: string; _id?: string }
}

interface ActivitiesMeResponse {
  success: boolean
  message?: string
  data: {
    participations: RawActivityParticipationItem[]
  }
}

// The API returns the activity keyed by _id, not id — normalize here so the
// "/activities/:id" link below gets a real id.
function normalizeParticipation(participation: RawActivityParticipationItem): ActivityParticipationItem {
  return {
    ...participation,
    id: participation.id ?? participation._id ?? "",
    activity: { ...participation.activity, id: participation.activity.id ?? participation.activity._id ?? "" },
  }
}

interface VolunteerHoursResponse {
  success: boolean
  message?: string
  data: {
    totalVolunteerHours: number
    activitiesCompleted: number
    history: unknown[]
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

// The API returns activities (and their populated club) keyed by _id, not id —
// normalize here so the "/activities/:id" link below gets a real id.
function normalizeActivity(activity: RawActivity): Activity {
  return {
    ...activity,
    id: activity.id ?? activity._id ?? "",
    club: { ...activity.club, id: activity.club.id ?? activity.club._id ?? "" },
  }
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const [memberships, setMemberships] = useState<ClubMembershipItem[]>([])
  const [participations, setParticipations] = useState<ActivityParticipationItem[]>([])
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([])
  const [totalVolunteerHours, setTotalVolunteerHours] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [clubsRes, participationsRes, volunteerRes, activitiesRes] = await Promise.all([
          api<ClubsMeResponse>("/students/me/clubs"),
          api<ActivitiesMeResponse>("/students/me/activities"),
          api<VolunteerHoursResponse>("/students/me/volunteer-hours"),
          api<ActivitiesResponse>("/activities?status=upcoming"),
        ])

        setMemberships((clubsRes.data?.memberships ?? []).map(normalizeMembership))
        setParticipations((participationsRes.data?.participations ?? []).map(normalizeParticipation))
        setTotalVolunteerHours(volunteerRes.data?.totalVolunteerHours ?? 0)

        // status is set once at creation and never recomputed against the
        // current date, so still filter/sort by date here rather than
        // trusting the server-side status=upcoming filter alone.
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const upcoming = (activitiesRes.data?.activities ?? [])
          .map(normalizeActivity)
          .filter((activity) => new Date(activity.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setUpcomingActivities(upcoming)
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const attendedCount = participations.filter(p => p.status === "attended").length

  const stats = [
    {
      label: "ชมรมที่เข้าร่วม",
      value: memberships.length,
      icon: Users,
      href: "/dashboard/my-clubs",
      color: "text-primary"
    },
    {
      label: "กิจกรรมที่กำลังจะมา",
      value: upcomingActivities.length,
      icon: Calendar,
      href: "/dashboard/my-activities",
      color: "text-accent"
    },
    {
      label: "ชั่วโมงจิตอาสา",
      value: totalVolunteerHours,
      icon: Award,
      href: "/dashboard/volunteer-hours",
      color: "text-chart-3"
    },
    {
      label: "กิจกรรมที่เข้าร่วมแล้ว",
      value: attendedCount,
      icon: CheckCircle,
      href: "/dashboard/my-activities",
      color: "text-primary"
    },
  ]

  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              สวัสดี, {user.firstName}
            </h1>
            <p className="text-muted-foreground">
              <span className="numeric-font">{user.studentId}</span> | {user.faculty}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/clubs">
            ค้นหาชมรมใหม่
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
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
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      <span className="numeric-font text-3xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* My Clubs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">ชมรมของฉัน</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/my-clubs">
                    ดูทั้งหมด
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {memberships.length > 0 ? (
                  <div className="space-y-3">
                    {memberships.slice(0, 3).map((membership) => (
                      <Link
                        key={membership.id}
                        href={`/clubs/${membership.club?.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{membership.club?.name}</div>
                          <div className="text-sm text-muted-foreground">สมาชิก</div>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">
                          <span className="numeric-font">{membership.club?.memberCount}</span>&nbsp;คน
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">คุณยังไม่ได้เข้าร่วมชมรมใดๆ</p>
                    <Button asChild variant="outline">
                      <Link href="/clubs">ค้นหาชมรม</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Activities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">กิจกรรมที่กำลังจะมา</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/my-activities">
                    ดูทั้งหมด
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingActivities.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingActivities.slice(0, 3).map((activity) => (
                      <Link
                        key={activity.id}
                        href={`/activities/${activity.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{activity.title}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="numeric-font">
                              {new Date(activity.date || "").toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short"
                              })}
                            </span>
                          </div>
                        </div>
                        {(activity.volunteerHours ?? 0) > 0 && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            <Award className="h-3 w-3 mr-1" />
                            <span className="numeric-font">{activity.volunteerHours}</span>&nbsp;ชม.
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">ไม่มีกิจกรรมที่กำลังจะมา</p>
                    <Button asChild variant="outline">
                      <Link href="/activities">ค้นหากิจกรรม</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Volunteer Hours Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                สรุปชั่วโมงจิตอาสา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="numeric-font text-3xl font-bold text-primary">{totalVolunteerHours}</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">ชั่วโมงสะสม</div>
                    <div className="text-sm text-muted-foreground">
                      จากกิจกรรม <span className="numeric-font">{attendedCount}</span> กิจกรรม
                    </div>
                  </div>
                </div>
                <div className="flex-1 max-w-md">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">ความคืบหน้า (เป้าหมาย <span className="numeric-font">36</span> ชม.)</span>
                    <span className="numeric-font font-medium">{Math.min(100, Math.round((totalVolunteerHours / 36) * 100))}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totalVolunteerHours / 36) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ต้องการอีก <span className="numeric-font">{Math.max(0, 36 - totalVolunteerHours)}</span> ชั่วโมง เพื่อครบตามเกณฑ์
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
