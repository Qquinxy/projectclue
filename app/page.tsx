"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { HeroBackground } from "@/components/hero-background"
import { Footer } from "@/components/footer"
import { ClubMarquee } from "@/components/club-marquee"
import { ActivityCard } from "@/components/activity-card"
import { api } from "@/lib/api"
import type { Club, Activity } from "@/lib/types"
import { ArrowRight, Loader2, AlertCircle } from "lucide-react"

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
        <section className="relative isolate overflow-hidden py-16 md:py-24">
          <HeroBackground />
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                ค้นพบกิจกรรมที่ใช่ เติมเต็มชีวิตมหาวิทยาลัย
              </h1>
              <p className="text-white/90 mb-8 text-pretty drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                เข้าร่วมชมรมที่คุณสนใจ มีส่วนร่วมในกิจกรรมจิตอาสา และสร้างประสบการณ์ที่มีค่า
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-[#6b3e00] text-white hover:bg-[#8a5210]">
                  <Link href="/clubs">
                    สำรวจชมรม
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
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
        <section className="py-12 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">ชมรมแนะนำ</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/clubs" className="gap-1">
                  ดูทั้งหมด
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            ) : featuredClubs.length > 0 ? (
              <ClubMarquee clubs={featuredClubs} />
            ) : (
              <p className="text-center text-muted-foreground py-12">ยังไม่มีชมรมในระบบ</p>
            )}
          </div>
        </section>

        {/* Upcoming Activities */}
        <section className="py-12 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">กิจกรรมที่กำลังจะมา</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/activities" className="gap-1">
                  ดูทั้งหมด
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            ) : upcomingActivities.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">ยังไม่มีกิจกรรมที่กำลังจะมา</p>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 border-t bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              พร้อมเริ่มต้นแล้วหรือยัง?
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              สมัครเข้าร่วมชมรมที่คุณสนใจวันนี้
            </p>
            <Button asChild>
              <Link href="/register">
                สมัครสมาชิก
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
