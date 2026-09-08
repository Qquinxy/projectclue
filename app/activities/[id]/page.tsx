"use client"

import { use, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { ActivityGallery } from "@/components/activity-gallery"
import { ACTIVITY_TYPES, getActivityImages, type Activity } from "@/lib/types"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  ArrowLeft,
  CheckCircle,
  Info,
  AlertCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusColors = {
  upcoming: "bg-accent text-accent-foreground",
  ongoing: "bg-primary text-primary-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusLabels = {
  upcoming: "กำลังจะมา",
  ongoing: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
}

interface RawActivity extends Omit<Activity, "id" | "club"> {
  id?: string
  _id?: string
  club: Omit<Activity["club"], "id"> & { id?: string; _id?: string }
}

interface ActivityResponse {
  success: boolean
  message?: string
  data: {
    activity: RawActivity
  }
}

// The API returns the activity (and its populated club) keyed by _id, not id —
// normalize here so the "back to club" links on this page get a real id.
function normalizeActivity(activity: RawActivity): Activity {
  return {
    ...activity,
    id: activity.id ?? activity._id ?? "",
    club: { ...activity.club, id: activity.club.id ?? activity.club._id ?? "" },
  }
}

interface ActivitiesMeResponse {
  success: boolean
  message?: string
  data: {
    participations: { status: string; activity: { id?: string; _id?: string } }[]
  }
}

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, isLoading: isAuthLoading } = useAuth()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [hasRegistered, setHasRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFoundError, setNotFoundError] = useState(false)

  const [isRegistering, setIsRegistering] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNotFoundError(false)

    try {
      const activityRes = await api<ActivityResponse>(`/activities/${id}`)
      setActivity(activityRes.data?.activity ? normalizeActivity(activityRes.data.activity) : null)

      if (user) {
        const participationsRes = await api<ActivitiesMeResponse>("/students/me/activities")
        const participations = participationsRes.data?.participations ?? []
        setHasRegistered(
          participations.some(
            (p) => (p.activity?.id ?? p.activity?._id) === id && p.status === "registered"
          )
        )
      } else {
        setHasRegistered(false)
      }
    } catch (err) {
      if (err instanceof Error && /not ?found/i.test(err.message)) {
        setNotFoundError(true)
      } else {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลกิจกรรมได้")
      }
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    if (isAuthLoading) return
    fetchActivity()
  }, [fetchActivity, isAuthLoading])

  if (notFoundError) {
    notFound()
  }

  const handleRegister = async () => {
    setIsRegistering(true)
    setActionError(null)
    try {
      await api(`/activities/${id}/register`, { method: "POST" })
      setDialogOpen(false)
      await fetchActivity()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ไม่สามารถลงทะเบียนได้")
    } finally {
      setIsRegistering(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    setActionError(null)
    try {
      await api(`/activities/${id}/register`, { method: "DELETE" })
      await fetchActivity()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ไม่สามารถยกเลิกการลงทะเบียนได้")
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex w-full items-center justify-center rounded-xl border border-dashed py-24 min-h-[16rem]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-24 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{error ?? "ไม่พบข้อมูลกิจกรรม"}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const activityType = ACTIVITY_TYPES.find((t) => t.value === activity.type)
  const spotsLeft = activity.maxParticipants - activity.currentParticipants
  const isFull = spotsLeft <= 0
  const canRegister = !!user && activity.status === "upcoming" && !isFull && !hasRegistered

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-accent/10 via-background to-primary/10 py-14 md:py-16">
          <div className="container mx-auto px-4">
            <Link
              href="/activities"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้ากิจกรรม
            </Link>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Activity Images — one image, a browsable gallery, or the
                  original placeholder when the activity has none. */}
              <div className="lg:w-1/3">
                <ActivityGallery
                  images={getActivityImages(activity)}
                  overlay={
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <Badge className={cn("text-sm", statusColors[activity.status])}>
                        {statusLabels[activity.status]}
                      </Badge>
                      {activity.volunteerHours > 0 && (
                        <Badge variant="secondary" className="text-sm">
                          <Award className="h-3 w-3 mr-1" />
                          <span className="numeric-font">{activity.volunteerHours}</span>&nbsp;ชม.
                        </Badge>
                      )}
                    </div>
                  }
                />
              </div>

              {/* Activity Info */}
              <div className="lg:w-2/3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Link
                    href={`/clubs/${activity.club.id}`}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {activity.club.name}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {activityType?.label}
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  {activity.title}
                </h1>

                <p className="text-muted-foreground text-lg mb-6">
                  {activity.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">วันที่</div>
                      <div className="numeric-font font-semibold">
                        {new Date(activity.date).toLocaleDateString("th-TH", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">เวลา</div>
                      <div className="font-semibold">
                        <span className="numeric-font">{activity.startTime} - {activity.endTime}</span> น.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">สถานที่</div>
                      <div className="font-semibold">{activity.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">ผู้เข้าร่วม</div>
                      <div className={cn("font-semibold", isFull && "text-destructive")}>
                        <span className="numeric-font">
                          {activity.currentParticipants}/{activity.maxParticipants}
                        </span>{" "}
                        คน
                        {isFull ? (
                          " (เต็มแล้ว)"
                        ) : (
                          <> (เหลือ <span className="numeric-font">{spotsLeft}</span> ที่)</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {actionError && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {!user && activity.status === "upcoming" && !isFull && (
                  <Button asChild size="lg" className="text-base">
                    <Link href="/login">เข้าสู่ระบบเพื่อลงทะเบียน</Link>
                  </Button>
                )}

                {canRegister && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="text-base">
                        สมัครเข้าร่วมกิจกรรม
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ยืนยันการสมัครเข้าร่วมกิจกรรม</DialogTitle>
                        <DialogDescription>
                          คุณกำลังจะสมัครเข้าร่วม <strong>{activity.title}</strong>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">รหัสนักศึกษา:</span>
                            <span className="numeric-font font-medium">{user?.studentId}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                          </div>
                        </div>
                        {activity.volunteerHours > 0 && (
                          <div className="p-4 bg-primary/5 rounded-lg flex items-start gap-3">
                            <Award className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">ชั่วโมงจิตอาสา</div>
                              <div className="text-sm text-muted-foreground">
                                คุณจะได้รับ <span className="numeric-font">{activity.volunteerHours}</span> ชั่วโมงเมื่อเข้าร่วมกิจกรรมนี้
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          ยกเลิก
                        </Button>
                        <Button onClick={handleRegister} disabled={isRegistering}>
                          {isRegistering ? "กำลังสมัคร..." : "ยืนยันการสมัคร"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {hasRegistered && (
                  <Button size="lg" variant="secondary" onClick={handleCancel} disabled={isCancelling}>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {isCancelling ? "กำลังยกเลิก..." : "ยกเลิกการลงทะเบียน"}
                  </Button>
                )}

                {isFull && !hasRegistered && (
                  <Button size="lg" variant="secondary" disabled>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    เต็มแล้ว
                  </Button>
                )}

                {activity.status !== "upcoming" && !hasRegistered && (
                  <Button size="lg" variant="secondary" disabled>
                    ไม่สามารถลงทะเบียนได้
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="py-14 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Requirements */}
                {activity.requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl tracking-tight flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        สิ่งที่ต้องเตรียม
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {activity.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Activity Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl tracking-tight">รายละเอียดกิจกรรม</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                    <p>{activity.description}</p>
                    <p>
                      กิจกรรมนี้จัดโดย <strong>{activity.club.name}</strong>
                      {activity.volunteerHours > 0 && (
                        <> ผู้เข้าร่วมจะได้รับชั่วโมงจิตอาสา <strong><span className="numeric-font">{activity.volunteerHours}</span> ชั่วโมง</strong></>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg tracking-tight">ข้อมูลกิจกรรม</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">ประเภท</span>
                      <Badge variant="outline">{activityType?.label}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">สถานะ</span>
                      <Badge className={cn(statusColors[activity.status])}>
                        {statusLabels[activity.status]}
                      </Badge>
                    </div>
                    {activity.volunteerHours > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">ชั่วโมงจิตอาสา</span>
                        <span className="font-semibold text-primary">
                          <span className="numeric-font">{activity.volunteerHours}</span> ชม.
                        </span>
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">ที่ว่าง</span>
                        <span className="numeric-font">{Math.max(0, spotsLeft)} ที่</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isFull ? "bg-destructive" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(100, (activity.currentParticipants / activity.maxParticipants) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg tracking-tight">จัดโดย</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/clubs/${activity.club.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{activity.club.name}</div>
                        <div className="text-sm text-muted-foreground">ดูรายละเอียดชมรม</div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
