"use client"

import { use, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { mockActivities, mockParticipations, getCurrentStudent } from "@/lib/mock-data"
import { ACTIVITY_TYPES } from "@/lib/types"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Award,
  ArrowLeft,
  CheckCircle,
  Info,
  AlertCircle
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

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const activity = mockActivities.find((a) => a.id === id)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!activity) {
    notFound()
  }

  const activityType = ACTIVITY_TYPES.find((t) => t.value === activity.type)
  const student = getCurrentStudent()
  const spotsLeft = activity.maxParticipants - activity.currentParticipants
  const isFull = spotsLeft <= 0

  // Check if student is already registered
  const existingParticipation = mockParticipations.find(
    (p) => p.studentId === student.id && p.activityId === activity.id
  )
  const hasRegistered = existingParticipation !== undefined || isRegistered

  const handleRegister = async () => {
    setIsRegistering(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRegistering(false)
    setIsRegistered(true)
    setDialogOpen(false)
  }

  const canRegister = activity.status === "upcoming" && !isFull && !hasRegistered

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-accent/10 via-background to-primary/10 py-8">
          <div className="container mx-auto px-4">
            <Link 
              href="/activities" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้ากิจกรรม
            </Link>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Activity Image */}
              <div className="lg:w-1/3">
                <div className="relative aspect-video lg:aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-accent/30" />
                  </div>
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <Badge className={cn("text-sm", statusColors[activity.status])}>
                      {statusLabels[activity.status]}
                    </Badge>
                    {activity.volunteerHours > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        <Award className="h-3 w-3 mr-1" />
                        {activity.volunteerHours} ชม.
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="lg:w-2/3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Link 
                    href={`/clubs/${activity.clubId}`}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {activity.clubName}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {activityType?.label}
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
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
                      <div className="font-semibold">
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
                      <div className="font-semibold">{activity.startTime} - {activity.endTime} น.</div>
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
                        {activity.currentParticipants}/{activity.maxParticipants} คน
                        {isFull ? " (เต็มแล้ว)" : ` (เหลือ ${spotsLeft} ที่)`}
                      </div>
                    </div>
                  </div>
                </div>

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
                            <span className="font-medium">{student.studentId}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                            <span className="font-medium">{student.firstName} {student.lastName}</span>
                          </div>
                        </div>
                        {activity.volunteerHours > 0 && (
                          <div className="p-4 bg-primary/5 rounded-lg flex items-start gap-3">
                            <Award className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">ชั่วโมงจิตอาสา</div>
                              <div className="text-sm text-muted-foreground">
                                คุณจะได้รับ {activity.volunteerHours} ชั่วโมงเมื่อเข้าร่วมกิจกรรมนี้
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
                  <Button size="lg" variant="secondary" disabled>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    คุณลงทะเบียนแล้ว
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
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Requirements */}
                {activity.requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
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
                    <CardTitle className="text-xl">รายละเอียดกิจกรรม</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                    <p>{activity.description}</p>
                    <p>
                      กิจกรรมนี้จัดโดย <strong>{activity.clubName}</strong> 
                      {activity.volunteerHours > 0 && (
                        <> ผู้เข้าร่วมจะได้รับชั่วโมงจิตอาสา <strong>{activity.volunteerHours} ชั่วโมง</strong></>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ข้อมูลกิจกรรม</CardTitle>
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
                        <span className="font-semibold text-primary">{activity.volunteerHours} ชม.</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">ที่ว่าง</span>
                        <span>{spotsLeft} ที่</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            isFull ? "bg-destructive" : "bg-primary"
                          )}
                          style={{ width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">จัดโดย</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link 
                      href={`/clubs/${activity.clubId}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{activity.clubName}</div>
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
