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
import { ActivityCard } from "@/components/activity-card"
import { mockClubs, mockActivities, mockMemberships, getCurrentStudent } from "@/lib/mock-data"
import { CLUB_CATEGORIES } from "@/lib/types"
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
  Award
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const club = mockClubs.find((c) => c.id === id)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!club) {
    notFound()
  }

  const category = CLUB_CATEGORIES.find((c) => c.value === club.category)
  const clubActivities = mockActivities.filter((a) => a.clubId === club.id && a.status === "upcoming")
  const student = getCurrentStudent()

  // Check if student is already a member
  const existingMembership = mockMemberships.find(
    (m) => m.studentId === student.id && m.clubId === club.id
  )
  const isMember = existingMembership !== undefined || isRegistered

  const handleRegister = async () => {
    setIsRegistering(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRegistering(false)
    setIsRegistered(true)
    setDialogOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-8">
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
                {/* Reserved club-image area. Intentionally empty — no photo,
                    no external image — so the layout keeps its space until
                    real club photography is supplied. */}
                <div
                  aria-hidden
                  className="relative aspect-video lg:aspect-square rounded-xl border border-dashed border-[#d8d0bd] bg-gradient-to-br from-primary/10 to-accent/10"
                />
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

                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
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

                {!isMember && club.memberCount < club.maxMembers && (
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
                            <span className="numeric-font font-medium">{student.studentId}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                            <span className="font-medium">{student.firstName} {student.lastName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">คณะ:</span>
                            <span className="font-medium">{student.faculty}</span>
                          </div>
                        </div>
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

                {isMember && (
                  <Button size="lg" variant="secondary" disabled>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    คุณเป็นสมาชิกแล้ว
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">คุณสมบัติผู้สมัคร</CardTitle>
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

                {/* Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">สิทธิประโยชน์</CardTitle>
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

                {/* Club Activities */}
                {clubActivities.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-primary" />
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
                    <CardTitle className="text-lg">ติดต่อชมรม</CardTitle>
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
                    <CardTitle className="text-lg">สถิติชมรม</CardTitle>
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
                          <span className="numeric-font">{club.maxMembers - club.memberCount}</span> ที่
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(club.memberCount / club.maxMembers) * 100}%` }}
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
