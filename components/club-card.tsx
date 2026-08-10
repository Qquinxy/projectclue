import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import type { Club } from "@/lib/types"
import { CLUB_CATEGORIES } from "@/lib/types"

interface ClubCardProps {
  club: Club
}

export function ClubCard({ club }: ClubCardProps) {
  const category = CLUB_CATEGORIES.find((c) => c.value === club.category)

  return (
    <Link href={`/clubs/${club.id}`} className="club-card-link">
      {/* Outer card is text-only by design: name, description, category,
          member count and location. No club image here. */}
      <Card className="club-card-surface h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {category?.label}
            </Badge>
          </div>
          <h3 className="font-medium text-foreground mb-1 line-clamp-1">
            {club.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {club.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="shrink-0">
              <span className="numeric-font">{club.memberCount}</span> สมาชิก
            </span>
            <span className="min-w-0 truncate">{club.location}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
