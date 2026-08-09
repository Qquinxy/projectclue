import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { HeroBackground } from "@/components/hero-background"
import { Footer } from "@/components/footer"
import { ClubMarquee } from "@/components/club-marquee"
import { ActivityCard } from "@/components/activity-card"
import { mockClubs, mockActivities } from "@/lib/mock-data"
import { ArrowRight, Users, Calendar, Award, Heart } from "lucide-react"

export default function HomePage() {
  const topClubs = mockClubs.slice(0, 3)
  const footballClub = mockClubs.find((c) => c.name.includes("ฟุตบอล"))
  const featuredClubs = [
    ...topClubs,
    ...(footballClub && !topClubs.some((c) => c.id === footballClub.id) ? [footballClub] : []),
  ]
  const upcomingActivities = mockActivities.filter(a => a.status === "upcoming").slice(0, 3)

  const stats = [
    { label: "ชมรม", value: "25+", icon: Users },
    { label: "กิจกรรม/ปี", value: "100+", icon: Calendar },
    { label: "นักศึกษา", value: "2,000+", icon: Heart },
    { label: "ชั่วโมงจิตอาสา", value: "5,000+", icon: Award },
  ]

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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
              {stats.map((stat) => (
                <Card key={stat.label} className="border-white/40 bg-[#f6f3ea]/90 backdrop-blur-md shadow-lg">
                  <CardContent className="p-4 text-center">
                    <stat.icon className="h-5 w-5 mx-auto mb-2 text-[#6b3e00]" />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
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
            <ClubMarquee clubs={featuredClubs} />
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
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
