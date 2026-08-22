"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ClubCard } from "@/components/club-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { CLUB_CATEGORIES, type Club, type ClubCategory } from "@/lib/types"
import { Search, Users, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

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

// The API returns MongoDB documents keyed by _id, not id — normalize here
// so the rest of the page (and ClubCard's /clubs/:id link) gets a real id.
function normalizeClub(club: RawClub): Club {
  return { ...club, id: club.id ?? club._id ?? "" }
}

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ClubCategory | "all">("all")
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchClubs = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set("search", searchQuery)
        if (selectedCategory !== "all") params.set("category", selectedCategory)

        const query = params.toString()
        const response = await api<ClubsResponse>(
          `/clubs${query ? `?${query}` : ""}`,
          { signal: controller.signal }
        )
        setClubs((response.data?.clubs ?? []).map(normalizeClub))
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อชมรมได้")
      } finally {
        setIsLoading(false)
      }
    }

    const timeout = setTimeout(fetchClubs, 300)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [searchQuery, selectedCategory])

  const categoryCounts = clubs.reduce<Record<string, number>>((acc, club) => {
    acc[club.category] = (acc[club.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-14 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                ชมรมทั้งหมด
              </h1>
              <p className="text-muted-foreground mb-8">
                ค้นหาและเข้าร่วมชมรมที่คุณสนใจ
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ค้นหาชมรม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="py-6 border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant={selectedCategory === "all" ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm transition-colors"
                onClick={() => setSelectedCategory("all")}
              >
                ทั้งหมด
                <span className="numeric-font ml-1.5 opacity-70">{clubs.length}</span>
              </Badge>
              {CLUB_CATEGORIES.map((category) => (
                <Badge
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm transition-colors",
                    selectedCategory === category.value && `${category.color} text-white border-transparent`
                  )}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                  <span className="numeric-font ml-1.5 opacity-70">
                    {categoryCounts[category.value] ?? 0}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Clubs Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed py-24 min-h-[16rem]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-dashed py-16 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">
                  เกิดข้อผิดพลาด
                </h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : clubs.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-6">
                  แสดง <span className="numeric-font">{clubs.length}</span> ชมรม
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clubs.map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed py-16 text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">
                  ไม่พบชมรมที่ค้นหา
                </h3>
                <p className="text-sm text-muted-foreground">
                  ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
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
