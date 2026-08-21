"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ActivityCard } from "@/components/activity-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { ACTIVITY_TYPES, type Activity, type ActivityStatus } from "@/lib/types"
import { Search, Calendar, Loader2, AlertCircle } from "lucide-react"

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

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | "all">("all")
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchActivities = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set("search", searchQuery)
        if (selectedType !== "all") params.set("type", selectedType)
        if (selectedStatus !== "all") params.set("status", selectedStatus)

        const query = params.toString()
        const response = await api<ActivitiesResponse>(
          `/activities${query ? `?${query}` : ""}`,
          { signal: controller.signal }
        )
        setActivities((response.data?.activities ?? []).map(normalizeActivity))
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายการกิจกรรมได้")
      } finally {
        setIsLoading(false)
      }
    }

    const timeout = setTimeout(fetchActivities, 300)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [searchQuery, selectedType, selectedStatus])

  const statusTabs = [
    { value: "all", label: "ทั้งหมด" },
    { value: "upcoming", label: "กำลังจะมา" },
    { value: "ongoing", label: "กำลังดำเนินการ" },
    { value: "completed", label: "เสร็จสิ้น" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-accent/5 via-background to-primary/5 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                กิจกรรมทั้งหมด
              </h1>
              <p className="text-muted-foreground mb-8">
                ค้นหาและสมัครเข้าร่วมกิจกรรมที่คุณสนใจ สะสมชั่วโมงจิตอาสาและประสบการณ์
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ค้นหากิจกรรม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Status Tabs */}
        <section className="py-6 border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ActivityStatus | "all")}>
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-4">
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Type Filter */}
        <section className="py-4 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant={selectedType === "all" ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
                onClick={() => setSelectedType("all")}
              >
                ทุกประเภท
              </Badge>
              {ACTIVITY_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 text-sm"
                  onClick={() => setSelectedType(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Activities Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  เกิดข้อผิดพลาด
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : activities.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-6">
                  แสดง <span className="numeric-font">{activities.length}</span> กิจกรรม
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  ไม่พบกิจกรรมที่ค้นหา
                </h3>
                <p className="text-muted-foreground">
                  ลองเปลี่ยนคำค้นหาหรือเลือกตัวกรองอื่น
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
