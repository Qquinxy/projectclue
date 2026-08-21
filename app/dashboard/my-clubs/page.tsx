"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Club, CLUB_CATEGORIES } from "@/lib/types"
import {
  Users,
  MapPin,
  Clock,
  ArrowRight,
  UserPlus,
  Loader2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ClubMembershipItem {
  id: string
  joinedAt: string
  club: Club
}

interface RawClubMembershipItem extends Omit<ClubMembershipItem, "id" | "club"> {
  id?: string
  _id?: string
  club: Omit<Club, "id"> & { id?: string; _id?: string }
}

interface ClubsMeResponse {
  success: boolean
  message?: string
  data: {
    memberships: RawClubMembershipItem[]
  }
}

// The API returns the joined club keyed by _id, not id — normalize here so
// the "/clubs/:id" links below get a real id, consistent with app/clubs/page.tsx.
function normalizeMembership(membership: RawClubMembershipItem): ClubMembershipItem {
  return {
    ...membership,
    id: membership.id ?? membership._id ?? "",
    club: { ...membership.club, id: membership.club.id ?? membership.club._id ?? "" },
  }
}

export default function MyClubsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [memberships, setMemberships] = useState<ClubMembershipItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchMyClubs = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api<ClubsMeResponse>("/students/me/clubs")
        setMemberships((response.data?.memberships ?? []).map(normalizeMembership))
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลชมรมได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyClubs()
  }, [user])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ชมรมของฉัน</h1>
          <p className="text-muted-foreground">จัดการชมรมที่คุณเป็นสมาชิก</p>
        </div>
        <Button asChild>
          <Link href="/clubs">
            <UserPlus className="mr-2 h-4 w-4" />
            ค้นหาชมรมใหม่
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
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            ชมรมที่เข้าร่วม (<span className="numeric-font">{memberships.length}</span>)
          </h2>

          {memberships.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberships.map((membership) => {
                const category = CLUB_CATEGORIES.find(c => c.value === membership.club?.category)

                return (
                  <Card key={membership.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className={cn(
                      "h-2",
                      category?.color || "bg-primary"
                    )} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate mb-1">
                            {membership.club?.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {category?.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {membership.club?.description}
                      </p>

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary/70" />
                          <span className="truncate">{membership.club?.meetingSchedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          <span className="truncate">{membership.club?.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary/70" />
                          <span>
                            <span className="numeric-font">{membership.club?.memberCount}</span> สมาชิก
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          เข้าร่วมเมื่อ{" "}
                          <span className="numeric-font">
                            {new Date(membership.joinedAt).toLocaleDateString("th-TH", {
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </span>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/clubs/${membership.club?.id}`}>
                            ดูชมรม
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  คุณยังไม่ได้เข้าร่วมชมรมใดๆ
                </h3>
                <p className="text-muted-foreground mb-6">
                  เริ่มต้นด้วยการค้นหาชมรมที่คุณสนใจและสมัครเข้าร่วม
                </p>
                <Button asChild>
                  <Link href="/clubs">
                    ค้นหาชมรม
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
