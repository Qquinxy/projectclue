"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { HeroBackground } from "@/components/hero-background"
import { Footer } from "@/components/footer"
import { ClubMarquee } from "@/components/club-marquee"
import { ActivityCard } from "@/components/activity-card"
import { api } from "@/lib/api"
import type { Club, Activity } from "@/lib/types"
import { ArrowRight, Loader2, AlertCircle, Users, Calendar } from "lucide-react"

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
// by _id, not id — normalize here so ClubCard/ActivityCard links get a real id.
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

export default function HomePage() {
  const [featuredClubs, setFeaturedClubs] = useState<Club[]>([])
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [clubsRes, activitiesRes] = await Promise.all([
          api<ClubsResponse>("/clubs?limit=6"),
          api<ActivitiesResponse>("/activities?status=upcoming&limit=3"),
        ])

        setFeaturedClubs((clubsRes.data?.clubs ?? []).map(normalizeClub))
        setUpcomingActivities((activitiesRes.data?.activities ?? []).map(normalizeActivity))
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden py-20 md:py-28 lg:py-32">
          <HeroBackground />
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight text-white mb-5 text-balance drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                ค้นพบกิจกรรมที่ใช่ เติมเต็มชีวิตมหาวิทยาลัย
              </h1>
              <p className="text-base sm:text-lg text-white/90 mb-10 text-pretty drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                เข้าร่วมชมรมที่คุณสนใจ มีส่วนร่วมในกิจกรรมจิตอาสา และสร้างประสบการณ์ที่มีค่า
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#6b3e00] text-white shadow-lg shadow-black/25 hover:bg-[#8a5210]"
                >
                  <Link href="/clubs">
                    สำรวจชมรม
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/70 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-[#6b3e00]"
                >
                  <Link href="/activities">ดูกิจกรรม</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Clubs */}
        <section className="py-14 md:py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                  ชมรมแนะนำ
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/clubs" className="gap-1">
                  ดูทั้งหมด
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            ) : featuredClubs.length > 0 ? (
              <ClubMarquee clubs={featuredClubs} />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
                ยังไม่มีชมรมในระบบ
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Activities */}
        <section className="py-14 md:py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                  กิจกรรมที่กำลังจะมา
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/activities" className="gap-1">
                  ดูทั้งหมด
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            ) : upcomingActivities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {upcomingActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
                ยังไม่มีกิจกรรมที่กำลังจะมา
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-16 border-t bg-secondary/30">
          <div className="container mx-auto px-4">
            <Card className="mx-auto max-w-2xl border-none shadow-md">
              <CardContent className="px-6 py-10 sm:px-10 sm:py-12 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                  พร้อมเริ่มต้นแล้วหรือยัง?
                </h2>
                <p className="text-muted-foreground mb-8 text-sm sm:text-base">
                  สมัครเข้าร่วมชมรมที่คุณสนใจวันนี้
                </p>
                <Button asChild size="lg">
                  <Link href="/register">
                    สมัครสมาชิก
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
