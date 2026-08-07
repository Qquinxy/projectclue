import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  getCurrentStudent, 
  mockMemberships, 
  mockClubs 
} from "@/lib/mock-data"
import { MEMBER_ROLES, CLUB_CATEGORIES } from "@/lib/types"
import { 
  Users, 
  MapPin, 
  Clock,
  ArrowRight,
  UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function MyClubsPage() {
  const student = getCurrentStudent()
  
  // Get student's memberships
  const myMemberships = mockMemberships.filter(m => m.studentId === student.id)
  const activeClubs = myMemberships
    .filter(m => m.status === "active")
    .map(m => {
      const club = mockClubs.find(c => c.id === m.clubId)
      return { ...m, club }
    })
    .filter(m => m.club)

  const pendingClubs = myMemberships
    .filter(m => m.status === "pending")
    .map(m => {
      const club = mockClubs.find(c => c.id === m.clubId)
      return { ...m, club }
    })
    .filter(m => m.club)

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

      {/* Pending Applications */}
      {pendingClubs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">รอการอนุมัติ</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingClubs.map((membership) => {
              const category = CLUB_CATEGORIES.find(c => c.value === membership.club?.category)
              return (
                <Card key={membership.id} className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {membership.club?.name}
                          </h3>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {category?.label}
                        </Badge>
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            รอการอนุมัติ
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Memberships */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          ชมรมที่เข้าร่วม ({activeClubs.length})
        </h2>
        
        {activeClubs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeClubs.map((membership) => {
              const category = CLUB_CATEGORIES.find(c => c.value === membership.club?.category)
              const role = MEMBER_ROLES.find(r => r.value === membership.role)
              
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
                          <Badge variant="secondary" className="text-xs">
                            {role?.label}
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
                        <span>{membership.club?.memberCount} สมาชิก</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        เข้าร่วมเมื่อ {new Date(membership.joinedAt).toLocaleDateString("th-TH", {
                          month: "short",
                          year: "numeric"
                        })}
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
    </div>
  )
}
