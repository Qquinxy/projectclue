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
import { ActivityCard } from "@/components/activity-card"
import { useAuth } from "@/lib/auth-context"
import { api, resolveImageUrl } from "@/lib/api"
import { isProfileComplete } from "@/lib/reference"
import { CLUB_CATEGORIES, type Club, type Activity } from "@/lib/types"
import {
  Users,
  MapPin,
  Clock,
  Mail,
  Phone,
  User,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Award,
  Loader2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RawClub extends Omit<Club, "id"> {
  id?: string
  _id?: string
}

interface ClubResponse {
  success: boolean
  message?: string
  data: {
    club: RawClub
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
// normalize here so ActivityCard's /activities/:id link gets a real id.
function normalizeActivity(activity: RawActivity): Activity {
  return {
    ...activity,
    id: activity.id ?? activity._id ?? "",
    club: { ...activity.club, id: activity.club.id ?? activity.club._id ?? "" },
  }
}

interface ClubsMeResponse {
  success: boolean
  message?: string
  data: {
    memberships: { club: { id?: string; _id?: string } }[]
  }
}

// The API returns MongoDB documents keyed by _id, not id — normalize here
// so join/leave, the membership check, and links on this page use a real id.
function normalizeClub(club: RawClub): Club {
  return { ...club, id: club.id ?? club._id ?? "" }
}

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, isLoading: isAuthLoading } = useAuth()

  const [club, setClub] = useState<Club | null>(null)
  const [clubActivities, setClubActivities] = useState<Activity[]>([])
  const [isMember, setIsMember] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFoundError, setNotFoundError] = useState(false)

  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchClub = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNotFoundError(false)

    try {
      const [clubRes, activitiesRes] = await Promise.all([
        api<ClubResponse>(`/clubs/${id}`),
        api<ActivitiesResponse>(`/activities?club=${id}&status=upcoming`),
      ])

      setClub(clubRes.data?.club ? normalizeClub(clubRes.data.club) : null)
      setClubActivities((activitiesRes.data?.activities ?? []).map(normalizeActivity))

      // /students/me/clubs is student-only — admins/superadmins viewing a
      // club aren't members, so skip the call rather than triggering a 403.
      if (user && user.role === "student") {
        try {
          const membershipsRes = await api<ClubsMeResponse>("/students/me/clubs")
          const memberships = membershipsRes.data?.memberships ?? []
          setIsMember(
            memberships.some((m) => (m.club?.id ?? m.club?._id) === id)
          )
        } catch {
          setIsMember(false)
        }
      } else {
        setIsMember(false)
      }
    } catch (err) {
      if (err instanceof Error && /not ?found/i.test(err.message)) {
        setNotFoundError(true)
      } else {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลชมรมได้")
      }
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    if (isAuthLoading) return
    fetchClub()
  }, [fetchClub, isAuthLoading])

  if (notFoundError) {
    notFound()
  }

  const handleJoin = async () => {
    setIsJoining(true)
    setActionError(null)
    try {
      await api(`/clubs/${id}/join`, { method: "POST" })
      setDialogOpen(false)
      await fetchClub()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ไม่สามารถสมัครเข้าร่วมชมรมได้")
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    setIsLeaving(true)
    setActionError(null)
    try {
      await api(`/clubs/${id}/leave`, { method: "DELETE" })
      await fetchClub()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ไม่สามารถออกจากชมรมได้")
    } finally {
      setIsLeaving(false)
    }
  }

  // Backend joinClub rejects students whose profile is missing phone /
  // faculty / major / year — mirror it here so the button offers a link to
  // the profile page instead of a doomed join attempt.
  const profileComplete = isProfileComplete(user)

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

  if (error || !club) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-24 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{error ?? "ไม่พบข้อมูลชมรม"}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const category = CLUB_CATEGORIES.find((c) => c.value === club.category)
  const isFull = club.memberCount >= club.maxMembers

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-14 md:py-16">
          <div className="container mx-auto px-4">
            <Link
              href="/clubs"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้าชมรม
            </Link>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Club Image */}
              <div className="lg:w-1/3">
                {club.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImageUrl(club.image)}
                    alt={club.name}
                    className="aspect-video lg:aspect-square w-full rounded-xl object-cover"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="relative aspect-video lg:aspect-square rounded-xl border border-dashed border-[#d8d0bd] bg-gradient-to-br from-primary/10 to-accent/10"
                  />
                )}
              </div>

              {/* Club Info */}
              <div className="lg:w-2/3">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge
                    className={cn("text-sm text-primary-foreground", category?.color)}
                  >
                    {category?.label}
                  </Badge>
                  {isMember && (
                    <Badge variant="outline" className="text-sm">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      คุณเป็นสมาชิก
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  {club.name}
                </h1>

                <p className="text-muted-foreground text-lg mb-6">
                  {club.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">สมาชิก</div>
                      <div className="font-semibold">
                        <span className="numeric-font">{club.memberCount}/{club.maxMembers}</span> คน
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">อาจารย์ที่ปรึกษา</div>
                      <div className="font-semibold">{club.advisorName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">ประชุม</div>
                      <div className="font-semibold">{club.meetingSchedule}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">สถานที่</div>
                      <div className="font-semibold">{club.location}</div>
                    </div>
                  </div>
                </div>

                {actionError && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {!user && (
                  <Button asChild size="lg" className="text-base">
                    <Link href="/login">เข้าสู่ระบบเพื่อสมัครเข้าร่วมชมรม</Link>
                  </Button>
                )}

                {user && !isMember && !isFull && !profileComplete && (
                  <Button asChild size="lg" className="text-base">
                    <Link href="/dashboard/profile">
                      ยืนยันข้อมูลส่วนตัว (เบอร์ ชั้นปี คณะ สาขา) ก่อนสมัคร
                    </Link>
                  </Button>
                )}

                {user && !isMember && !isFull && profileComplete && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="text-base">
                        สมัครเข้าร่วมชมรม
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ยืนยันการสมัครเข้าร่วมชมรม</DialogTitle>
                        <DialogDescription>
                          คุณกำลังจะสมัครเข้าร่วม <strong>{club.name}</strong>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">รหัสนักศึกษา:</span>
                            <span className="numeric-font font-medium">{user.studentId}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                            <span className="font-medium">{user.firstName} {user.lastName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">คณะ:</span>
                            <span className="font-medium">{user.faculty}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          ยกเลิก
                        </Button>
                        <Button onClick={handleJoin} disabled={isJoining}>
                          {isJoining ? "กำลังสมัคร..." : "ยืนยันการสมัคร"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {user && isMember && (
                  <Button size="lg" variant="destructive" onClick={handleLeave} disabled={isLeaving}>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {isLeaving ? "กำลังออกจากชมรม..." : "ออกจากชมรม"}
                  </Button>
                )}

                {user && !isMember && isFull && (
                  <Button size="lg" variant="secondary" disabled>
                    ชมรมเต็มแล้ว
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
                {club.requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl tracking-tight">คุณสมบัติผู้สมัคร</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {club.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Benefits */}
                {club.benefits.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl tracking-tight">สิทธิประโยชน์</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {club.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Club Activities */}
                {clubActivities.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                        <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      กิจกรรมที่กำลังจะมา
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {clubActivities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg tracking-tight">ติดต่อชมรม</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <a
                        href={`mailto:${club.contactEmail}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {club.contactEmail}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="numeric-font text-muted-foreground">{club.contactPhone}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg tracking-tight">สถิติชมรม</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">สมาชิกปัจจุบัน</span>
                      <span className="font-semibold">
                        <span className="numeric-font">{club.memberCount}</span> คน
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">รับได้สูงสุด</span>
                      <span className="font-semibold">
                        <span className="numeric-font">{club.maxMembers}</span> คน
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">ก่อตั้งเมื่อ</span>
                      <span className="numeric-font font-semibold">
                        {new Date(club.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long"
                        })}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">ที่ว่าง</span>
                        <span>
                          <span className="numeric-font">{Math.max(0, club.maxMembers - club.memberCount)}</span> ที่
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, (club.memberCount / club.maxMembers) * 100)}%` }}
                        />
                      </div>
                    </div>
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
