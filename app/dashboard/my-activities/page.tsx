"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { ActivityStatus, ParticipationStatus } from "@/lib/types"
import {
  Calendar,
  MapPin,
  Clock,
  Award,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

const participationStatusConfig = {
  registered: { label: "ลงทะเบียนแล้ว", icon: AlertCircle, color: "text-accent" },
  attended: { label: "เข้าร่วมแล้ว", icon: CheckCircle, color: "text-primary" },
  absent: { label: "ไม่ได้เข้าร่วม", icon: XCircle, color: "text-destructive" },
  cancelled: { label: "ยกเลิก", icon: XCircle, color: "text-muted-foreground" },
}

interface ActivityClub {
  id: string
  name: string
}

interface ParticipationActivity {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  volunteerHours: number
  status: ActivityStatus
  club: ActivityClub
}

interface Participation {
  id: string
  status: ParticipationStatus
  registeredAt: string
  attendedAt: string | null
  hoursEarned: number
  activity: ParticipationActivity
}

interface ActivitiesMeResponse {
  success: boolean
  message?: string
  data: {
    participations: Participation[]
  }
}

export default function MyActivitiesPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [participations, setParticipations] = useState<Participation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchMyActivities = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api<ActivitiesMeResponse>("/students/me/activities")
        setParticipations(
          (response.data?.participations ?? []).filter(p => p.activity)
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลกิจกรรมได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyActivities()
  }, [user])

  const upcomingActivities = participations.filter(
    p => p.status === "registered" && p.activity?.status === "upcoming"
  )
  const completedActivities = participations.filter(
    p => p.status === "attended"
  )
  const allActivities = participations

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">กิจกรรมของฉัน</h1>
          <p className="text-muted-foreground">ติดตามกิจกรรมที่คุณลงทะเบียน</p>
        </div>
        <Button asChild>
          <Link href="/activities">
            <Calendar className="mr-2 h-4 w-4" />
            ค้นหากิจกรรมใหม่
          </Link>
        </Button>
      </div>

      {isAuthLoading || isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              เกิดข้อผิดพลาด
            </h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="numeric-font text-2xl font-bold text-accent">{upcomingActivities.length}</div>
                <div className="text-sm text-muted-foreground">กำลังจะมา</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="numeric-font text-2xl font-bold text-primary">{completedActivities.length}</div>
                <div className="text-sm text-muted-foreground">เข้าร่วมแล้ว</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="numeric-font text-2xl font-bold text-foreground">
                  {completedActivities.reduce((sum, p) => sum + p.hoursEarned, 0)}
                </div>
                <div className="text-sm text-muted-foreground">ชม.จิตอาสา</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full max-w-md grid grid-cols-3">
              <TabsTrigger value="upcoming">
                กำลังจะมา (<span className="numeric-font">{upcomingActivities.length}</span>)
              </TabsTrigger>
              <TabsTrigger value="completed">
                เข้าร่วมแล้ว (<span className="numeric-font">{completedActivities.length}</span>)
              </TabsTrigger>
              <TabsTrigger value="all">
                ทั้งหมด (<span className="numeric-font">{allActivities.length}</span>)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              {upcomingActivities.length > 0 ? (
                <div className="space-y-4">
                  {upcomingActivities.map((participation) => (
                    <ActivityCard key={participation.id} participation={participation} />
                  ))}
                </div>
              ) : (
                <EmptyState message="ไม่มีกิจกรรมที่กำลังจะมา" />
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              {completedActivities.length > 0 ? (
                <div className="space-y-4">
                  {completedActivities.map((participation) => (
                    <ActivityCard key={participation.id} participation={participation} />
                  ))}
                </div>
              ) : (
                <EmptyState message="ยังไม่มีกิจกรรมที่เข้าร่วม" />
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              {allActivities.length > 0 ? (
                <div className="space-y-4">
                  {allActivities.map((participation) => (
                    <ActivityCard key={participation.id} participation={participation} />
                  ))}
                </div>
              ) : (
                <EmptyState message="ยังไม่มีกิจกรรมที่ลงทะเบียน" />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function ActivityCard({ participation }: { participation: Participation }) {
  const { activity } = participation
  if (!activity) return null

  const statusConfig = participationStatusConfig[participation.status]
  const StatusIcon = statusConfig.icon

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Activity Image */}
          <div className="md:w-48 h-32 md:h-auto bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-accent/40" />
          </div>

          {/* Activity Info */}
          <div className="flex-1 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Link
                href={`/clubs/${activity.club?.id}`}
                className="text-sm text-primary hover:underline"
              >
                {activity.club?.name}
              </Link>
              <Badge className={cn("text-xs", statusConfig.color, "bg-transparent")}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            <h3 className="font-semibold text-lg text-foreground mb-2">
              <Link href={`/activities/${activity.id}`} className="hover:text-primary transition-colors">
                {activity.title}
              </Link>
            </h3>

            <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/70" />
                <span className="numeric-font">
                  {new Date(activity.date).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary/70" />
                <span>
                  <span className="numeric-font">{activity.startTime} - {activity.endTime}</span> น.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70" />
                <span className="truncate">{activity.location}</span>
              </div>
              {participation.status === "attended" && participation.hoursEarned > 0 && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">
                    ได้รับ {participation.hoursEarned} ชม.จิตอาสา
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ลงทะเบียนเมื่อ <span className="numeric-font">{new Date(participation.registeredAt).toLocaleDateString("th-TH")}</span>
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/activities/${activity.id}`}>
                  ดูรายละเอียด
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">{message}</h3>
        <p className="text-muted-foreground mb-6">
          ค้นหากิจกรรมที่น่าสนใจและสมัครเข้าร่วมได้เลย
        </p>
        <Button asChild>
          <Link href="/activities">
            ค้นหากิจกรรม
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
